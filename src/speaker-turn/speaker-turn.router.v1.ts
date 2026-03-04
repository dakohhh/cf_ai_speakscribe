import { Hono } from "hono";
import { Environment } from "../types/env";
import { validate } from "../common/validate";
import { HttpResponse } from "../common/response";
import { StatusCodes as HttpStatus } from "http-status-codes";
import { paginationSchema } from "../common/pagination";
import { getAllSpeakerTurns } from "./speaker-turn.service";
import { getAllSpeakerTurnsQuerySchema } from "./schemas/get-all-speaker-turns-query.schema";

export const speakerTurnV1Router = new Hono<{ Bindings: Environment }>();

speakerTurnV1Router.get("/", validate("query", getAllSpeakerTurnsQuerySchema.merge(paginationSchema)), async (c) => {
  const { transcriptionId, page, limit } = c.req.valid("query");

  const results = await getAllSpeakerTurns({ page, limit }, c.env, transcriptionId);

  return c.json(new HttpResponse("Get all speaker turns", results), HttpStatus.OK);
});
