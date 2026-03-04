import { drizzle } from "drizzle-orm/d1";
import { Environment } from "../types/env";
// import
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { transcription, speakerTurn } from "../database/schema";
import { eq } from "drizzle-orm";
import { generateEmbeddings } from "../embedding/embedding.service";

export interface Params {
  transcriptionId: string;
  fileKey: string;
}

async function getAudioChunks(audioUrl: string): Promise<ArrayBuffer[]> {
  const response = await fetch(audioUrl, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();

  const chunkSize = 1024 * 1024; // 1MB
  const chunks: ArrayBuffer[] = [];
  for (let i = 0; i < arrayBuffer.byteLength; i += chunkSize) {
    const chunk = arrayBuffer.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}

async function createHashFromChunkBuffer(chunkBuffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-512", chunkBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  return hash;
}

async function transcribeChunk(chunkBuffer: ArrayBuffer, env: Environment): Promise<Ai_Cf_Openai_Whisper_Large_V3_Turbo_Output> {
  const hash = await createHashFromChunkBuffer(chunkBuffer);

  const chunkHashKey = `chunkHashKey:${hash}`;

  const cacheResults = await env.KV.get(chunkHashKey);

  let res: Ai_Cf_Openai_Whisper_Large_V3_Turbo_Output;

  if (!cacheResults) {
    const binary = Array.from(new Uint8Array(chunkBuffer), (byte) => String.fromCharCode(byte)).join("");

    const base64 = btoa(binary);

    res = await env.AI.run("@cf/openai/whisper-large-v3-turbo", {
      audio: base64,
    });

    // Store response in KV store with an expiration of 1 hour
    await env.KV.put(chunkHashKey, JSON.stringify(res), { expirationTtl: 3600 });
  } else {
    res = JSON.parse(cacheResults);
  }

  return res;
}

type Segment = { content: string; start: number; end: number };
type TranscribeResult = { segments: Segment[]; language: string | null };

export class TranscriptionWorkflow extends WorkflowEntrypoint<Environment, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep): Promise<void> {
    const db = drizzle(this.env.DB);
    const { transcriptionId, fileKey } = event.payload;

    try {
      await step.do("update status to processing", async () => {
        const existing = await db
          .update(transcription)
          .set({ status: "processing", updatedAt: new Date() })
          .where(eq(transcription.id, transcriptionId))
          .returning()
          .then((r) => r.at(0));

        if (!existing) {
          throw new NonRetryableError("Transcription not found");
        }

        return existing;
      });

      const result = await step.do("transcribe audio", async (): Promise<TranscribeResult> => {
        const audioUrl = `${this.env.R2_BUCKET_URL}/${fileKey}`;
        const chunks = await getAudioChunks(audioUrl);

        const allSegments: Segment[] = [];
        let language: string | null = null;

        for (const chunk of chunks) {
          const output = await transcribeChunk(chunk, this.env);

          if (!language && output.transcription_info?.language) {
            language = output.transcription_info.language;
          }

          if (output.segments && output.segments.length > 0) {
            for (const segment of output.segments) {
              if (segment.text && segment.start !== undefined && segment.end !== undefined)
                allSegments.push({
                  content: segment.text,
                  start: segment.start,
                  end: segment.end,
                });
            }
          }
        }

        return { segments: allSegments, language };
      });

      await step.do("save speaker turns", async () => {
        const { segments } = result;

        for (const [index, seg] of segments.entries()) {
          const id = crypto.randomUUID();
          const [newSpeakerTurn] = await db
            .insert(speakerTurn)
            .values({
              id,
              content: seg.content,
              start: seg.start,
              end: seg.end,
              orderNo: index + 1,
              transcriptionId,
            })
            .returning();
          // Generate the embeddings

          const embeddingResponse = await generateEmbeddings(newSpeakerTurn.content, this.env);

          if (!("data" in embeddingResponse) || !embeddingResponse.data?.[0]) {
            throw new Error("No embedding data returned");
          }

          // Insert into Vectorize
          await this.env.VECTORIZE.insert([
            {
              id: newSpeakerTurn.id,
              values: embeddingResponse.data[0],
              metadata: {
                transcriptionId,
                speakerTurnId: newSpeakerTurn.id,
                orderNo: newSpeakerTurn.orderNo,
                content: newSpeakerTurn.content,
                start: newSpeakerTurn.start,
                end: newSpeakerTurn.end,
              },
            },
          ]);
        }
      });

      await step.do("update transcription status", async () => {
        const { language } = result;
        await db
          .update(transcription)
          .set({ status: "completed", detectedLanguage: language ?? null, updatedAt: new Date() })
          .where(eq(transcription.id, transcriptionId));
      });
    } catch (err) {
      await db.update(transcription).set({ status: "failed", updatedAt: new Date() }).where(eq(transcription.id, transcriptionId));
      throw err;
    }
  }
}
