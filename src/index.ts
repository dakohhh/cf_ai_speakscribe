import { Hono } from "hono";
import { logger } from "hono/logger";
import { registerUIRouter, registerV1Routers } from "./router";
export { TranscriptionWorkflow } from "./transcription/transcription.workflow";

const app = new Hono();

app.use("*", logger());

// Register Routers
registerUIRouter(app);
registerV1Routers(app);

export default app;
