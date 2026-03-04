import { Hono } from "hono";
import { Environment } from "../types/env";
import { validate } from "../common/validate";
import { HttpResponse } from "../common/response";
import { paginationSchema } from "../common/pagination";
import { StatusCodes as HttpStatus } from "http-status-codes";
import { createTranscription, deleteTranscription, getAllTranscription, getTranscription } from "./transcription.service";
import { createTranscriptionSchema } from "./schemas/create-transcription.schema";
import { BadRequestException } from "../common/exception";
import { deleteTranscriptionParamSchema } from "./schemas/delete-transcription-param.schema";
import { getTranscriptionParamSchema } from "./schemas/get-transcription-param.schema";

export const transcriptionV1Router = new Hono<{ Bindings: Environment }>();

transcriptionV1Router.get("/", validate("query", paginationSchema), async (c) => {
  const schema = c.req.valid("query");
  const results = await getAllTranscription(c.env, schema);

  return c.json(new HttpResponse("Get all transcription", results), HttpStatus.OK);
});

transcriptionV1Router.post("/", validate("form", createTranscriptionSchema), async (c) => {
  const data = c.req.valid("form");

  const formData = await c.req.formData();
  const audioFile = formData.get("file") as unknown;
  if (!(audioFile instanceof File)) {
    throw new BadRequestException("Invalid file");
  }

  const results = await createTranscription(data, audioFile, c.env);

  return c.json(new HttpResponse("Create transcription successfully", results), HttpStatus.CREATED);
});

transcriptionV1Router.get("/:transcriptionId/", validate("param", getTranscriptionParamSchema), async (c) => {
  const { transcriptionId } = c.req.valid("param");

  const results = await getTranscription(transcriptionId, c.env);

  return c.json(new HttpResponse("Get transcription", results), HttpStatus.OK);
});

transcriptionV1Router.delete("/:transcriptionId/", validate("param", deleteTranscriptionParamSchema), async (c) => {
  const { transcriptionId } = c.req.valid("param");

  await deleteTranscription(transcriptionId, c.env);

  return c.json(new HttpResponse("Delete transcription successfully", null), HttpStatus.CREATED);
});
