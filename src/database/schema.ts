import { sql, relations } from "drizzle-orm";
import { v4 as uuid4 } from "uuid";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Transcription
const transcriptionStatusEnum = ["pending", "processing", "completed", "failed"] as const;
export type TranscriptionStatus = (typeof transcriptionStatusEnum)[number];

export const transcription = sqliteTable("transcription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuid4()),

  name: text("name", { length: 255 }).notNull(),

  status: text("status", { enum: transcriptionStatusEnum }).default("pending").notNull(),

  processingDurationInSeconds: real("duration"),

  fileId: text("fileId").references(() => file.id, { onDelete: "set null" }),

  detectedLanguage: text("detectedLanguage"),

  workflowInstanceId: text("workflowInstanceId"),

  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),

  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Transcription = typeof transcription.$inferSelect;

// Speaker Turn
export const speakerTurn = sqliteTable("speakerTurn", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuid4()),

  content: text("content").notNull(),

  start: real("start").notNull(),

  end: real("end").notNull(),

  orderNo: integer("orderNo").notNull(),

  transcriptionId: text("transcriptionId")
    .notNull()
    .references(() => transcription.id, { onDelete: "cascade" }),

  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),

  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type SpeakerTurn = typeof speakerTurn.$inferSelect;
export type Segment = Pick<SpeakerTurn, "content" | "start" | "end">;

// File
export const file = sqliteTable("file", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuid4()),

  key: text("key").notNull(),

  size: integer("size"),

  etag: text("etag"),

  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),

  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type File = typeof file.$inferSelect;

// Conversation Message
export const conversationMessageRoleEnum = ["human", "assistant"] as const;

export type ConversationMessageRole = (typeof conversationMessageRoleEnum)[number];

export const conversationMessage = sqliteTable("conversationMessage", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => uuid4()),

  message: text("message").notNull(),

  role: text("role", { enum: conversationMessageRoleEnum }).notNull(),

  transcriptionId: text("transcriptionId")
    .notNull()
    .references(() => transcription.id, { onDelete: "cascade" }),

  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),

  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export type ConversationMessage = typeof conversationMessage.$inferSelect;

// Relations
export const transcriptionRelations = relations(transcription, ({ many, one }) => ({
  speakerTurn: many(speakerTurn),
  file: one(file, {
    fields: [transcription.fileId],
    references: [file.id],
  }),
  conversationMessage: many(conversationMessage),
}));

export const speakerTurnRelations = relations(speakerTurn, ({ one }) => ({
  transcription: one(transcription, {
    fields: [speakerTurn.transcriptionId],
    references: [transcription.id],
  }),
}));

export const fileRelations = relations(file, ({ one }) => ({
  transcription: one(transcription, {
    fields: [file.id],
    references: [transcription.fileId],
  }),
}));
