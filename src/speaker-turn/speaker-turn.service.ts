import { eq, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Environment } from "../types/env";
import { speakerTurn, SpeakerTurn } from "../database/schema";
import { PageNumberPaginator, PaginationSchema, PaginatorResult } from "../common/pagination";

export const getAllSpeakerTurns = async (paginationSchema: PaginationSchema, env: Environment, transcriptionId?: string): Promise<PaginatorResult<SpeakerTurn>> => {
  const db = drizzle(env.DB);

  let whereClause: SQL | undefined;

  if (transcriptionId) {
    whereClause = eq(speakerTurn.transcriptionId, transcriptionId);
  }

  const paginator = new PageNumberPaginator({ db, table: speakerTurn, schema: paginationSchema, where: whereClause, orderBy: { column: speakerTurn.orderNo, direction: "asc" } });

  return paginator.paginate();
};
