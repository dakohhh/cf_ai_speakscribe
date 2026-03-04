import { Hono } from "hono";
import { createConversationMessageSchema } from "./schemas/create-conversation-message.schema";
import { Environment } from "../types/env";
import { validate } from "../common/validate";
import { createConversationMessage, getAllConversationMessages } from "./conversation-message.service";
import { HttpResponse } from "../common/response";
import { StatusCodes as HttpStatus } from "http-status-codes";
import { getAllConversationMessageQuerySchema } from "./schemas/get-all-conversation-query.schema";
import { cursorPaginationSchema } from "../common/pagination";

export const conversationMessageV1Router = new Hono<{ Bindings: Environment }>();

conversationMessageV1Router.post("/", validate("json", createConversationMessageSchema), async (c) => {
  const data = c.req.valid("json");

  const results = await createConversationMessage(data, c.env);

  return c.json(new HttpResponse("Create Conversation Message successfully", results), HttpStatus.CREATED);
});

conversationMessageV1Router.get("/", validate("query", getAllConversationMessageQuerySchema.merge(cursorPaginationSchema)), async (c) => {
  const { transcriptionId, limit, cursor, direction } = c.req.valid("query");

  const results = await getAllConversationMessages({ limit, cursor, direction }, c.env, transcriptionId);

  return c.json(new HttpResponse("Get all Conversation Message", results), HttpStatus.OK);
});
