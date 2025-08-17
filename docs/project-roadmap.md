# Doxiqo Project Roadmap (Rev 2025‑08‑12)

AI‑powered documentation generator: Upload repo ZIP → curate source subset → generate rich markdown docs → download & revisit history.

---

## 1. Current Snapshot

Auth & DB

- NextAuth (Credentials + GitHub) configured with JWT strategy + custom callbacks.
- Mongo connection caching via `connectDB` (good for serverless reuse).

Models (implemented)

- User, Project, OutputMd, ZipFile (unused so far).
- Project fields: user, originalZipUrl, name, status (only: processing | completed), outputMd.
- Missing (proposed): preparedSummary, error, generationMeta (see Section 3).

Upload Layer

- UploadThing route working; returns `file.url` and a token as `userId` (currently just header token, not tied to NextAuth session) → SECURITY GAP.
- `/api/uploads` creates Project but trusts `userId` from body (must switch to session derivation).

Processing Layer

- `/api/process/prepare` implemented with selection logic: downloads ZIP each call, extracts to `/tmp/<projectId>`, traverses with include/exclude sets + limits (perFile=300KB, total=8MB, maxFiles=150). Returns truncated snippets (first 1000 chars).
- `/api/process/generate` stub only.
- Other stubs: `/api/statusUpdate`, `/api/downloadMd` (not aligned with final naming scheme yet).

Frontend

- Still default Next.js starter page; no UI flows implemented.

---

## 2. Key Gaps & Issues

1. Security: Upload + prepare rely on client‑supplied identifiers (header token / body userId). Need server session assertions everywhere.
2. Status enums too narrow: only processing/completed → cannot represent prepared, generating, failed, canceled.
3. No persistence of prepared summary → generate will need to redo traversal (duplicated cost & non‑deterministic ordering if logic later changes).
4. No AI integration path (provider abstraction, prompt templates, token budgeting, model selection).
5. Zip extraction re-runs on every prepare invocation (add idempotent check + caching / hashing).
6. No rate limiting → potential abuse & AI cost spike.
7. No logging / tracing metadata to diagnose failures (especially AI errors or file parsing issues).
8. Stubs (`statusUpdate`, `downloadMd`) not following final RESTful naming; unify under `/api/projects` & `/api/docs` namespace.
9. Missing tests (even a single smoke test to guard regressions in selection routine).
10. No user‑facing progress feedback (polling endpoint absent).

---

## 3. Proposed Data Model Extensions

Project additions:

- status: enum → [uploaded, prepared, generating, completed, failed]
- preparedSummary: [{ path, lang, size, hash }] (lightweight; omit full content)
- error?: { code: string; message: string; at: Date }
- generationMeta?: { model: string; promptTokens: number; completionTokens: number; durationMs: number }

OutputMd additions (optional):

- version (number) for re‑generation iterations
- prompt (snapshot of prompt used)

ZipFile model (optional usage): only store if you need historical diffing or per‑file doc generation; otherwise skip to control DB growth.

---

## 4. Endpoint Inventory

Implemented (state):

- POST /api/uploadthing (3rd‑party handler)
- POST /api/uploads (needs session auth refactor)
- POST /api/process/prepare (works, needs: ownership check improvement, caching, persist summary)
- POST /api/process/generate (stub)
- POST /api/statusUpdate (stub – replace with GET project status)
- POST /api/downloadMd (stub – replace with GET doc download)

Planned / Revised REST Design:

1. POST /api/uploads → returns { projectId }
2. POST /api/process/prepare → returns curated summary + updates Project.status=prepared & preparedSummary
3. POST /api/process/generate → transitions status generating → completed (or failed) + creates OutputMd
4. GET /api/projects/[projectId]/status → { status, outputId?, error? }
5. GET /api/docs/[outputId]/download → markdown stream
6. POST /api/projects/[projectId]/retry (optional) → reset failed to uploaded / processing

---

## 5. Immediate Action Plan (Next 3 Work Sessions)

Session 1 (Security & State)

- Replace body `userId` in `/api/uploads` with session user.
- Strengthen ownership checks (populate only the user id, avoid dereferencing entire user doc cheaply).
- Extend Project.status enum & migration script (or conditional update) to map existing `processing` → `uploaded`.
- Add preparedSummary + error fields (nullable) to schema.

Session 2 (Prepare Hardening)

- Persist preparedSummary on successful prepare.
- Skip re‑download if ZIP already cached (existence + size check) OR compute SHA256 of zip to ensure integrity.
- Add hashing of each selected file (SHA1 or SHA256) for change detection.
- Update status flow: uploaded → prepared.

Session 3 (Generate Endpoint)

- Implement AI provider wrapper (e.g., OpenAI client) with timeout + retry (exponential backoff).
- Build prompt template (see Section 8) using preparedSummary + prioritized file contents.
- Save OutputMd + generationMeta; update Project.status.
- Introduce failed path with error capture.

---

## 6. Backlog (Detailed)

High Priority

- Implement `/api/process/generate` (core value).
- Status endpoint (polling).
- Download endpoint.
- Frontend minimal flow (upload → prepare → generate → download).
- Auth refactor (session‑derived user everywhere).

Medium

- Persist preparedSummary & file hashes.
- Add failed status + retry endpoint.
- Rate limiting (simple in‑memory or Upstash/Redis later).
- Logging (structured console JSON + correlation id per request).

Low / Future

- Multi‑model support / cheaper fallback model for summarizing large files.
- Background queue (BullMQ / Cloud Tasks) if generation times out.
- Multi‑project dashboard with filtering.
- Prompt customization per project.
- Versioning of OutputMd (regenerations).

---

## 7. AI Generation Strategy (Initial Outline)

Input Assembly Steps:

1. Prioritize README, package.json, config files (tsconfig, next.config, env example) → create Context Section A.
2. Select top N source files (by relevance heuristics later; for now, first K sorted by scoring already in selection) → Section B.
3. Build dependency summary (placeholder) or skip for MVP.
4. Prompt skeleton:

- System: "You are an assistant generating comprehensive technical documentation..."
- User: JSON blocks for A & B (truncate each file > X tokens with continuation note).

5. Ask model to produce: Overview, Tech Stack, Setup, Configuration, Key Modules, Data Models, API Endpoints, Future Improvements.

Token Budgeting MVP:

- Cap combined file text to ~10–12k tokens for gpt-4o / similar; truncate extra files; mark omissions.

---

## 8. Security / Compliance Checklist

- Enforce session check at every project/output endpoint.
- Validate project ownership before reading zip path or output.
- Sanitize file paths (already using relative extraction root; keep guard).
- Avoid persisting secrets from `.env` (consider excluding `.env*` apart from `.env.example`).
- Rate limit generation per user (e.g., 5/min) to control costs.

---

## 9. Performance & Scaling Notes

- Extraction: Use idempotent directory naming; skip if exists & non‑empty.
- Memory: Stream AI output if large (future streaming endpoint or incremental UI update).
- Large repos: Add early rejection if uncompressed size > threshold (e.g., 50 MB) with user guidance.
- Consider pre‑compression hashing to detect duplicate uploads.

---

## 10. Testing Strategy (MVP)

Unit

- File selection: ensure exclusion/inclusion sets & limits behave (mock fs layer).
  Integration (API)
- /api/uploads → creates Project owned by session user.
- /api/process/prepare → returns deterministic file ordering for same archive.
- /api/process/generate (mock AI) → persists OutputMd & updates status.

---

## 11. Future Enhancements

- Semantic code clustering to create per‑module doc subsections.
- Diagrams (Mermaid) auto‑generated from dependency graph.
- Inline source linking (create anchors to repo paths if user supplies GitHub repo URL).
- Diff‑based incremental regeneration (only changed files re‑summarized).
- Multi‑language translation of docs.

---

## 12. Changelog

2025‑08‑12: Added prepare route assessment; defined extended status enum, security refactors, AI strategy, data model extensions, and concrete session‑based action plan.

---

Maintain this file: update Status, Changelog, and close items as they ship.
