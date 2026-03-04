import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import type { Environment } from "../types/env";
import { getAllTranscription, getTranscription } from "../transcription/transcription.service";
import { getAllSpeakerTurns } from "../speaker-turn/speaker-turn.service";
import { file } from "../database/schema";
import { IndexPage } from "./pages/index.page";
import { TranscriptionPage } from "./pages/transcription.page";

export const uiRouter = new Hono<{ Bindings: Environment }>();

uiRouter.get("/", async (c) => {
  const result = await getAllTranscription(c.env, { page: 1, limit: 50 });
  return c.html(<IndexPage transcriptions={result.results} meta={result.meta} />);
});

uiRouter.get("/transcriptions/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const t = await getTranscription(id, c.env);

    let speakerTurns = [] as Awaited<ReturnType<typeof getAllSpeakerTurns>>["results"];
    let audioUrl: string | null = null;

    if (t.status === "completed") {
      const turns = await getAllSpeakerTurns({ page: 1, limit: 500 }, c.env, id);
      speakerTurns = turns.results;
    }

    if (t.fileId) {
      const db = drizzle(c.env.DB);
      const fileRecord = await db
        .select()
        .from(file)
        .where(eq(file.id, t.fileId))
        .then((r) => r.at(0));
      if (fileRecord) {
        audioUrl = `${c.env.R2_BUCKET_URL}/${fileRecord.key}`;
      }
    }

    return c.html(
      <TranscriptionPage transcription={t} speakerTurns={speakerTurns} audioUrl={audioUrl} />
    );
  } catch {
    return c.redirect("/");
  }
});
