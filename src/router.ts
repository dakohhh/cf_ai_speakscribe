import { Hono } from "hono";
import { transcriptionV1Router } from "./transcription/transcription.router.v1";
import { conversationMessageV1Router } from "./conversation-message/conversation-message.router.v1";
import { speakerTurnV1Router } from "./speaker-turn/speaker-turn.router.v1";
import { uiRouter } from "./ui/ui.router";

export const registerUIRouter = (app: Hono): void => {
  app.route("/", uiRouter);
};

export const registerV1Routers = (app: Hono): void => {
  const version = "v1";
  app.route(`/${version}/transcription`, transcriptionV1Router);
  app.route(`/${version}/conversation-message`, conversationMessageV1Router);
  app.route(`/${version}/speaker-turn`, speakerTurnV1Router);
};
