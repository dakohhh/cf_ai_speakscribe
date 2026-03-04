import { z } from "zod";
import { SQL, Column, asc, desc, and, gt, lt, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { SQLiteTable } from "drizzle-orm/sqlite-core";
import { DrizzleD1Database } from "drizzle-orm/d1";

// --- Zod query schemas ---

export const paginationSchema = z.object({
  page: z.coerce.number().gt(0).default(1),
  limit: z.coerce.number().gt(0).max(100).default(10),
});

export const cursorPaginationSchema = z.object({
  limit: z.coerce.number().gt(0).max(100).default(50),
  cursor: z.coerce.number().optional(),
  direction: z.enum(["before", "after"]).default("before"),
});

export type PaginationSchema = z.infer<typeof paginationSchema>;
export type CursorPaginationSchema = z.infer<typeof cursorPaginationSchema>;

// --- Meta / result types ---

export type PaginatorMeta = {
  total: number;
  perPage: number;
  lastPage: number;
  currentPage: number;
  prev: number | null;
  next: number | null;
};

export type CursorPaginatorMeta = {
  hasMore: boolean;
  nextCursor: number | null;
  prevCursor: number | null;
  count: number;
};

export type PaginatorResult<T> = { results: T[]; meta: PaginatorMeta };
export type CursorPaginatorResult<T> = { results: T[]; meta: CursorPaginatorMeta };

// --- Shared ---

type SortDirection = "asc" | "desc";
type OrderByOption = { column: Column | SQL; direction: SortDirection };

// ─────────────────────────────────────────────
// PageNumberPaginator
// ─────────────────────────────────────────────

type PageNumberOptions<TTable extends SQLiteTable> = {
  db: DrizzleD1Database;
  table: TTable;
  schema: PaginationSchema;
  where?: SQL;
  /** Defaults to { column: table.createdAt, direction: "desc" } */
  orderBy?: OrderByOption;
};

export class PageNumberPaginator<TTable extends SQLiteTable> {
  private readonly db: DrizzleD1Database;
  private readonly table: TTable;
  private readonly page: number;
  private readonly limit: number;
  private readonly where?: SQL;
  private readonly orderBy: OrderByOption;

  constructor({ db, table, schema, where, orderBy }: PageNumberOptions<TTable>) {
    this.db = db;
    this.table = table;
    this.page = schema.page;
    this.limit = schema.limit;
    this.where = where;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.orderBy = orderBy ?? { column: (table as any).createdAt as Column, direction: "desc" };
  }

  async paginate(): Promise<PaginatorResult<InferSelectModel<TTable>>> {
    const offset = (this.page - 1) * this.limit;
    const sortFn = this.orderBy.direction === "desc" ? desc : asc;

    const [items, countResult] = await Promise.all([
      this.db
        .select()
        .from(this.table)
        .where(this.where)
        .orderBy(sortFn(this.orderBy.column as Column))
        .limit(this.limit)
        .offset(offset),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(this.table)
        .where(this.where),
    ]);

    const total = countResult[0].total;
    const lastPage = Math.ceil(total / this.limit);

    return {
      results: items as unknown as InferSelectModel<TTable>[],
      meta: {
        total,
        perPage: this.limit,
        lastPage,
        currentPage: this.page,
        prev: this.page > 1 ? this.page - 1 : null,
        next: this.page < lastPage ? this.page + 1 : null,
      },
    };
  }
}

// ─────────────────────────────────────────────
// CursorPaginator
// ─────────────────────────────────────────────

type CursorOptions<TTable extends SQLiteTable> = {
  db: DrizzleD1Database;
  table: TTable;
  schema: CursorPaginationSchema;
  /** Column whose value is compared against the cursor (e.g. posts.createdAt) */
  cursorColumn: Column;
  where?: SQL;
  /** Defaults to { column: cursorColumn, direction: "desc" } */
  orderBy?: OrderByOption;
  /** Reverse the result set — useful for chat-like UIs where oldest appears first. Defaults to true. */
  reverseResults?: boolean;
};

export class CursorPaginator<TTable extends SQLiteTable> {
  private readonly db: DrizzleD1Database;
  private readonly table: TTable;
  private readonly limit: number;
  private readonly cursor?: number;
  private readonly direction: "before" | "after";
  private readonly cursorColumn: Column;
  private readonly where?: SQL;
  private readonly orderBy: OrderByOption;
  private readonly reverseResults: boolean;

  constructor({ db, table, schema, cursorColumn, where, orderBy, reverseResults }: CursorOptions<TTable>) {
    this.db = db;
    this.table = table;
    this.limit = schema.limit;
    this.cursor = schema.cursor;
    this.direction = schema.direction;
    this.cursorColumn = cursorColumn;
    this.where = where;
    this.orderBy = orderBy ?? { column: cursorColumn, direction: "desc" };
    this.reverseResults = reverseResults ?? true;
  }

  async paginate(): Promise<CursorPaginatorResult<InferSelectModel<TTable>>> {
    const sortFn = this.orderBy.direction === "desc" ? desc : asc;

    let cursorCondition: SQL | undefined;
    if (this.cursor !== undefined) {
      // desc+before → lt | desc+after → gt | asc+before → gt | asc+after → lt
      const useLt = (this.orderBy.direction === "desc") === (this.direction === "before");
      cursorCondition = useLt ? lt(this.cursorColumn, this.cursor) : gt(this.cursorColumn, this.cursor);
    }

    const combinedWhere = this.where && cursorCondition ? and(this.where, cursorCondition) : this.where ?? cursorCondition;

    const rows = (await this.db
      .select()
      .from(this.table)
      .where(combinedWhere)
      .orderBy(sortFn(this.orderBy.column as Column))
      .limit(this.limit + 1)) as unknown as InferSelectModel<TTable>[];

    const hasMore = rows.length > this.limit;
    const trimmed = hasMore ? rows.slice(0, this.limit) : rows;
    const results = this.reverseResults ? [...trimmed].reverse() : trimmed;

    let nextCursor: number | null = null;
    let prevCursor: number | null = null;

    if (results.length > 0) {
      const first = results[0] as Record<string, unknown>;
      const last = results[results.length - 1] as Record<string, unknown>;

      if (this.reverseResults) {
        // After reversing: first = oldest, last = newest
        nextCursor = hasMore ? (first.id as number) : null; // cursor to load older
        prevCursor = last.id as number; // cursor to load newer
      } else {
        nextCursor = hasMore ? (last.id as number) : null;
        prevCursor = this.cursor !== undefined ? (first.id as number) : null;
      }
    }

    return {
      results,
      meta: { hasMore, nextCursor, prevCursor, count: results.length },
    };
  }
}
