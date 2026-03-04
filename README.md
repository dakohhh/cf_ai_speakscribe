# Speakscribe

An AI-powered audio transcription and conversation platform built entirely on Cloudflare's developer platform. Upload an audio file, get a full transcription broken into speaker turns, then chat with the transcript using a RAG-powered AI assistant.

**Live demo:** https://speakscribe.wisdomdakoh.workers.dev

---

## Features

- Upload audio files and transcribe them asynchronously via Cloudflare Workflows
- Speaker turn extraction with timestamps from Whisper AI
- Semantic search over speaker turns using vector embeddings (Vectorize)
- Conversational AI that answers questions about your transcription using retrieved context (RAG)
- Conversation history — the AI remembers the last 10 messages per transcription
- Server-side rendered UI built with Hono JSX and Tailwind CSS
- Chunk-level transcription caching with KV to avoid redundant AI calls

---

## Tech Stack

| Layer            | Technology                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| Runtime          | Cloudflare Workers                                                                                       |
| Framework        | Hono                                                                                                     |
| Database         | Cloudflare D1 (SQLite)                                                                                   |
| ORM              | Drizzle ORM                                                                                              |
| File storage     | Cloudflare R2                                                                                            |
| Caching          | Cloudflare KV                                                                                            |
| Vector search    | Cloudflare Vectorize                                                                                     |
| AI models        | Workers AI — Whisper large-v3-turbo (transcription), BGE base en v1.5 (embeddings), Llama 3.2 3B (chat) |
| Async processing | Cloudflare Workflows                                                                                     |

---

## Architecture

```
User uploads audio
       │
       ▼
  R2 (file storage)
       │
       ▼
Cloudflare Workflow
  ├── Fetch audio from R2
  ├── Chunk into 1MB pieces
  ├── Transcribe each chunk with Whisper (cached in KV by SHA-512 hash)
  ├── Save speaker turns to D1
  └── Generate BGE embeddings → insert into Vectorize

User sends chat message
       │
       ▼
  Generate embedding for message (BGE)
       │
       ▼
  Query Vectorize (top 10 similar speaker turns, filtered by transcriptionId)
       │
       ▼
  Build prompt: system prompt + last 10 conversation messages + retrieved context + user question
       │
       ▼
  Llama 3.2 generates answer → saved to D1 → returned to user
```

---

## Prerequisites

- [Bun](https://bun.sh) 1.0+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — `bun add -g wrangler`
- A Cloudflare account with Workers, D1, R2, KV, Vectorize, and Workers AI enabled

---

## Local Development

### 1. Install dependencies

```bash
bun install
```

### 2. Authenticate with Cloudflare

```bash
wrangler login
```

### 3. Provision Cloudflare resources

**D1 database:**

```bash
wrangler d1 create speakscribe
```

Copy the `database_id` into `wrangler.jsonc`.

**Run migrations:**

```bash
wrangler d1 migrations apply speakscribe --remote
```

**R2 bucket:**

```bash
wrangler r2 bucket create speakscribe-bucket
```

**KV namespace:**

```bash
wrangler kv namespace create speakscribe-kv
```

Copy the `id` into `wrangler.jsonc`.

**Vectorize index:**

```bash
wrangler vectorize create speakscribe-embeddings-index --dimensions=768 --metric=cosine
```

**Vectorize metadata index** (required for filtering by transcription):

```bash
wrangler vectorize create-metadata-index speakscribe-embeddings-index --property-name=transcriptionId --type=string
```

### 4. Set environment variables

Copy the example vars file and fill in your values:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars`:

```
NODE_ENV=development
R2_BUCKET_URL=https://your-r2-public-bucket-url
```

### 5. Run locally

```bash
bun run dev
```

The app is available at `http://localhost:8787`.

---

## Deployment

```bash
bun run deploy
```

Apply migrations to production:

```bash
wrangler d1 migrations apply speakscribe --remote
```

---

## API Reference

### Transcriptions

| Method     | Endpoint                  | Description                               |
| ---------- | ------------------------- | ----------------------------------------- |
| `GET`    | `/v1/transcription`     | List all transcriptions (paginated)       |
| `POST`   | `/v1/transcription`     | Upload audio and start transcription      |
| `GET`    | `/v1/transcription/:id` | Get a single transcription                |
| `DELETE` | `/v1/transcription/:id` | Delete transcription and all related data |

**POST `/v1/transcription`** — `multipart/form-data`

```
name: string
file: audio file (mp3, wav, m4a, etc.)
```

**GET `/v1/transcription`** — query params

```
page: number (default: 1)
limit: number (default: 10, max: 100)
```

---

### Speaker Turns

| Method  | Endpoint             | Description                                              |
| ------- | -------------------- | -------------------------------------------------------- |
| `GET` | `/v1/speaker-turn` | List speaker turns, optionally filtered by transcription |

**GET `/v1/speaker-turn`** — query params

```
transcriptionId: uuid (optional)
page: number (default: 1)
limit: number (default: 10, max: 100)
```

---

### Conversation Messages

| Method   | Endpoint                     | Description                                  |
| -------- | ---------------------------- | -------------------------------------------- |
| `POST` | `/v1/conversation-message` | Send a message and get an AI response        |
| `GET`  | `/v1/conversation-message` | Get conversation history for a transcription |

**POST `/v1/conversation-message`** — JSON body

```json
{
  "message": "What topics were discussed?",
  "role": "human",
  "transcriptionId": "uuid"
}
```

**GET `/v1/conversation-message`** — query params

```
transcriptionId: uuid (optional)
limit: number (default: 50, max: 100)
cursor: number (optional, for cursor pagination)
direction: "before" | "after" (default: "before")
```

---

## Cloudflare Services Used

- **Workers AI** — Whisper for transcription, BGE for embeddings, Llama for chat
- **Workflows** — durable async transcription pipeline with step-level retries
- **D1** — stores transcriptions, speaker turns, and conversation messages
- **R2** — stores uploaded audio files
- **KV** — caches transcription chunks by content hash (1 hour TTL)
- **Vectorize** — stores speaker turn embeddings for semantic retrieval
