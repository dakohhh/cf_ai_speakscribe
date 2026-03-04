# PROMPTS.md

AI prompts used during development of this project.

---

## Prompt 5 — Project README

**Date:** 2026-03-04

**Prompt:**

Write a professional README.md for Speakscribe, a Cloudflare Workers application that transcribes audio files and lets users chat with their transcriptions using AI. The README should include: a project overview, the full technology stack (Cloudflare Workers, D1, R2, KV, Vectorize, Workers AI, Workflows, Hono, Drizzle ORM), a clear architecture summary explaining how each Cloudflare service is used, local development prerequisites and setup steps, instructions for running migrations and provisioning Cloudflare resources (D1 database, R2 bucket, KV namespace, Vectorize index with metadata index), and a full REST API reference covering all endpoints (transcriptions, speaker turns, conversation messages).

---

## Prompt 4 — Custom Delete Confirmation Modal

**Date:** 2026-03-04

**Prompt:**

Replace the native browser `confirm()` dialog for delete actions with a custom-styled modal. Define it globally in the layout so it works across all pages. It should have a red accent bar at the top, a trash icon in a red circle, title, permanent-action warning, and Cancel + Delete buttons. The Delete button shows a loading state while the async operation runs.

---

## Prompt 3 — Migrate raw CSS to Tailwind CSS

**Date:** 2026-03-04

**Prompt:**

Replace all raw inline CSS in the Hono JSX UI files with Tailwind CSS utility classes. Use the Tailwind Play CDN added to the layout head. Keep a minimal style block only for things Tailwind cannot handle at runtime (range input thumb, turn-active highlight, modal entry animation keyframe). Skip TanStack — it is designed for React component trees and does not compose well with Hono SSR and vanilla script tags.

---

## Prompt 2 — SSR UI with Hono JSX

**Date:** 2026-03-04

**Prompt:**

Build a server-side rendered UI using Hono JSX (TSX) that consumes the existing REST API. The UI should include:

- **Transcription list page** (`/`): Lists all transcriptions with status badges, language, duration, and a delete action. Includes an upload modal where users enter a name and select an audio file, then are redirected to the detail page after upload.
- **Transcription detail page** (`/transcriptions/:id`): Shows transcription status. If pending/processing, displays a spinner and polls `GET /v1/transcription/:id` every 3 seconds until the status changes. Once completed, shows a scrollable speaker turns list (each row: timestamp range, alternating speaker label, content text). Clicking a turn seeks the audio player to that turn's `start` time. A sticky HTML5 audio player at the bottom controls playback. A toggle button opens a slide-in chat panel on the right where users can ask questions about the transcription, powered by `POST /v1/conversation-message` (which returns the AI response). Previous messages are loaded from `GET /v1/conversation-message?transcriptionId=:id` when the panel opens. Reference screenshots provided for visual design (green primary color, white cards, colored alternating speaker labels).

---

## Prompt 1 — Cursor Paginator (TypeScript port)

**Date:** 2026-03-04

**Prompt:**

Port the following Python `CursorPaginator` class to TypeScript and add it to `src/common/paginator.ts`. The `PageNumberPaginator` is already implemented. The paginator should support cursor-based pagination for infinite scrolling / real-time feeds, using a configurable cursor column, sort direction, optional `where` clause, and a `reverseResults` flag for chat-like display order.
