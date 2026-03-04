import { desc, eq, SQL } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Environment } from "../types/env";
import { NotFoundException } from "../common/exception";
import { generateEmbeddings } from "../embedding/embedding.service";
import { SPEAKSCRIBE_SYSTEM_PROMPT } from "./conversation-message.prompt";
import { CursorPaginationSchema, CursorPaginator, CursorPaginatorResult } from "../common/pagination";
import { conversationMessage, ConversationMessage, transcription } from "../database/schema";
import { CreateConversationMessageSchema } from "./schemas/create-conversation-message.schema";

export const createConversationMessage = async (createConversationMessageSchema: CreateConversationMessageSchema, env: Environment): Promise<ConversationMessage> => {
  const db = drizzle(env.DB);

  const existingTranscription = await db
    .select()
    .from(transcription)
    .where(eq(transcription.id, createConversationMessageSchema.transcriptionId))
    .then((r) => r.at(0));

  if (!existingTranscription) {
    throw new NotFoundException("Transcription not found");
  }

  const messageEmbeddingResponse = await generateEmbeddings(createConversationMessageSchema.message, env);

  if (!("data" in messageEmbeddingResponse) || !messageEmbeddingResponse.data?.[0]) {
    throw new Error("No embedding data returned");
  }

  const results = await env.VECTORIZE.query(messageEmbeddingResponse.data[0], {
    topK: 10,
    returnMetadata: "all",
    filter: { transcriptionId: existingTranscription.id },
  });

  const contextLines = results.matches.map((match) => `Turn [${match.metadata?.start ?? 0} - ${match.metadata?.end ?? 0}]: ${match.metadata?.content}`);
  const transcriptionContext = contextLines.join("\n");

  const previousMessages = await db
    .select()
    .from(conversationMessage)
    .where(eq(conversationMessage.transcriptionId, existingTranscription.id))
    .orderBy(desc(conversationMessage.createdAt))
    .limit(10)
    .then((r) => r.reverse());

  const [newConversationMessage] = await db.insert(conversationMessage).values({ message: createConversationMessageSchema.message, role: createConversationMessageSchema.role, transcriptionId: existingTranscription.id }).returning();

  const userMessage = `## TRANSCRIPTION CONTEXT\n${transcriptionContext}\n\n## USER MESSAGE\n${newConversationMessage.message}`;

  const messages = [{ role: "system", content: SPEAKSCRIBE_SYSTEM_PROMPT }, ...previousMessages.map((m) => ({ role: m.role === "human" ? "user" : "assistant", content: m.message })), { role: "user", content: userMessage }];

  const response = await env.AI.run("@cf/meta/llama-3.2-3b-instruct", { messages, temperature: 0.1 });

  const aiMessage = response.response || "I apologize, but I couldn't generate a response. Please try again.";

  const [newAiConversationMessage] = await db.insert(conversationMessage).values({ message: aiMessage, role: "assistant", transcriptionId: existingTranscription.id }).returning();

  return newAiConversationMessage;
};

export const getAllConversationMessages = async (cursorPaginationSchema: CursorPaginationSchema, env: Environment, transcriptionId?: string): Promise<CursorPaginatorResult<ConversationMessage>> => {
  const db = drizzle(env.DB);

  let whereClause: SQL | undefined;

  if (transcriptionId) {
    whereClause = eq(conversationMessage.transcriptionId, transcriptionId);
  }

  const paginator = new CursorPaginator({ db, table: conversationMessage, cursorColumn: conversationMessage.createdAt, schema: cursorPaginationSchema, reverseResults: true, orderBy: { column: conversationMessage.createdAt, direction: "desc" }, where: whereClause });

  const results = await paginator.paginate();

  return results;
};
