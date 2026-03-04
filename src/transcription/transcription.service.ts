import { drizzle } from "drizzle-orm/d1";
import { Environment } from "../types/env";
import { eq } from "drizzle-orm";
import { transcription, file, Transcription, speakerTurn } from "../database/schema";
import { v4 as uuid4 } from "uuid";
import { CreateTranscriptionSchema } from "./schemas/create-transcription.schema";
import { PageNumberPaginator, PaginationSchema, PaginatorResult } from "../common/pagination";
import { BadRequestException, NotFoundException, PreconditionFailedException } from "../common/exception";

export const getAllTranscription = async (env: Environment, schema: PaginationSchema): Promise<PaginatorResult<Transcription>> => {
  const db = drizzle(env.DB);

  const paginator = new PageNumberPaginator({ db, table: transcription, schema });

  const results = await paginator.paginate();

  return results;
};

export const getTranscription = async (transcriptionId: string, env: Environment): Promise<Transcription> => {
  const db = drizzle(env.DB);

  const post = await db
    .select()
    .from(transcription)
    .where(eq(transcription.id, transcriptionId))
    .then((r) => r.at(0));

  if (!post) {
    throw new NotFoundException("Transcription not found");
  }

  return post;
};

export const createTranscription = async (createTranscriptionSchema: CreateTranscriptionSchema, audioFile: File, env: Environment): Promise<Transcription> => {
  const db = drizzle(env.DB);

  const key = `${env.NODE_ENV}/${crypto.randomUUID()}`;

  const object = await env.BUCKET.put(key, audioFile.stream(), {
    httpMetadata: {
      contentType: audioFile.type,
    },
  });

  if (object === null) {
    throw new PreconditionFailedException("Upload failed");
  }

  const fileId = uuid4();

  const [fileResults, transcriptionResults] = await db.batch([
    db.insert(file).values({ id: fileId, key: object.key, size: object.size, etag: object.etag }).returning(),
    db
      .insert(transcription)
      .values({ ...createTranscriptionSchema, fileId })
      .returning(),
  ]);

  // Send to workflow

  const newTranscription = transcriptionResults[0];
  const newFile = fileResults[0];

  const workflowInstance = await env.TRANSCRIPTION_WORKFLOW.create({ params: { transcriptionId: newTranscription.id, fileKey: newFile.key } });

  await db.update(transcription).set({ workflowInstanceId: workflowInstance.id, updatedAt: new Date() }).where(eq(transcription.id, newTranscription.id));

  return transcriptionResults[0] as Transcription;
};

export const deleteTranscription = async (transcriptionId: string, env: Environment): Promise<void> => {
  const db = drizzle(env.DB);

  const existingTranscription = await getTranscription(transcriptionId, env);

  if (existingTranscription.status === "processing") {
    throw new BadRequestException("Transcription on processing");
  }

  // get speaker turns ids for vectorize index
  const speakerIdResults = await db.select({ id: speakerTurn.id }).from(speakerTurn).where(eq(speakerTurn.transcriptionId, existingTranscription.id));

  const speakerIds = speakerIdResults.map((speakerIdResult) => speakerIdResult.id);

  // Delete the related Speaker Ids on Vectorize
  await env.VECTORIZE.deleteByIds(speakerIds);

  if (existingTranscription.fileId) {
    const fileRecord = await db
      .select()
      .from(file)
      .where(eq(file.id, existingTranscription.fileId))
      .then((r) => r.at(0));

    await db.batch([db.delete(transcription).where(eq(transcription.id, existingTranscription.id)), db.delete(file).where(eq(file.id, existingTranscription.fileId))]);

    if (fileRecord) {
      await env.BUCKET.delete(fileRecord.key);
    }
  } else {
    await db.delete(transcription).where(eq(transcription.id, existingTranscription.id));
  }
};
