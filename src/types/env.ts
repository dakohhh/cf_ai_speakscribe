export type Environment = {
  DB: D1Database;
  BUCKET: R2Bucket;
  NODE_ENV: string;
  TRANSCRIPTION_WORKFLOW: Workflow;
  KV: KVNamespace;
  AI: Ai;
  R2_BUCKET_URL: string;
  VECTORIZE: Vectorize;
};
