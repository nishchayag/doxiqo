# Doxiqo Project Roadmap

This document captures the current status and the exact steps to complete the AI-powered documentation generator.

## 1) Current Status (What’s Done)

- Authentication
  - NextAuth with Credentials + GitHub providers.
  - Session/JWT callbacks wired.
- Database
  - Mongoose connection helper with global cache.
- Models (partially)
  - user.model.ts defined and exported.
  - project.model.ts, file.model.ts, outputMd.model.ts: schemas exist; project model now exported and includes `originalZipUrl` and `status`.
- Uploads
  - UploadThing router (`lib/uploadThing.ts`) accepts ZIP uploads with auth middleware.
- API
  - POST `/api/uploads` implemented to save upload metadata (creates a Project and returns `projectId`).

## 2) Gaps / Issues To Fix Before Final Feature Work

- UploadThing return payload
  - Ensure you’re using `file.url` (not `file.ufsUrl`).
- Models
  - Confirm exports for `file.model.ts` and `outputMd.model.ts` (see step 3).
- UploadThing route handler
  - Ensure server route for UploadThing exists at `app/api/uploadthing/route.ts`.
- Missing core APIs
  - Processing route, status route, and download route not yet implemented.
- UI wiring
  - No upload UX + status polling + download button screens.

## 3) Data Model Targets

- Project
  - user: ObjectId(User)
  - originalZipUrl: string (required)
  - name: string (optional)
  - status: "processing" | "completed" (default: processing)
  - files: ObjectId(File)[] (optional; for extracted files if you store them)
  - outputMd: ObjectId(OutputMd) (set after processing completes)
- OutputMd
  - userId: ObjectId(User)
  - projectId: ObjectId(Project)
  - docMarkdown: string (AI generated)
  - timestamps
- File (optional, if storing extracted files)
  - path, language, content, userId, projectId, timestamps

## 4) API Endpoints To Implement

1. POST `/api/uploads` (DONE)

   - Input: `{ userId, originalZipUrl, name? }`
   - Behavior: Create a `Project` document in `processing` and return `{ projectId }`.

2. POST `/api/process` (TODO)

   - Input: `{ projectId }`
   - Steps:
     - Look up project and get `originalZipUrl`.
     - Download ZIP from `originalZipUrl`.
     - Extract in `/tmp` (serverless-safe).
     - Select relevant files (code, README, config) with size/type guardrails.
     - Chunk/summarize as needed and call AI to generate a single Markdown doc.
     - Save `OutputMd` doc: `userId`, `projectId`, `originalZipUrl`, `docMarkdown`.
     - Update `Project.status` to `completed` and set `outputMd` ref.
   - Return: `{ outputId }` or `202 Accepted` and process asynchronously.

3. GET `/api/projects/[projectId]/status` (TODO)

   - Return: `{ status: "processing" | "completed", outputId? }`.

4. GET `/api/docs/[outputId]/download` (TODO)

   - Headers: `Content-Type: text/markdown; charset=utf-8`, `Content-Disposition: attachment; filename="documentation.md"`.
   - Body: `docMarkdown` from `OutputMd` collection.

5. UploadThing Route Handler (if not added yet) (TODO)
   - `app/api/uploadthing/route.ts` exposes handlers from your router via `createRouteHandler` with `GET/POST`.

## 5) Frontend Flow

- Upload Page

  - Show UploadThing button for ZIP upload.
  - On upload complete, capture `file.url`.
  - Call `POST /api/uploads` with `{ userId, originalZipUrl: file.url, name? }` to create a project; get `projectId`.
  - Trigger `POST /api/process` with `{ projectId }`.
  - Poll `GET /api/projects/[projectId]/status` until `completed`.
  - Show a “Download Docs” button linking to `GET /api/docs/[outputId]/download`.

- History Page (optional)
  - List projects for the user with status and creation time.
  - Provide download links when available.

## 6) Security and Auth

- API routes should derive `userId` from a verified server-side session (NextAuth) or a signed JWT.
- UploadThing middleware: ensure it authenticates consistently with your session approach.
- Validate ownership on all reads/writes (projects and outputs belong to the requesting user).

## 7) Environments / Config

- Required env vars:
  - `MONGODB_URI`
  - `NEXTAUTH_SECRET` (+ provider keys)
  - `UPLOADTHING_SECRET` (+ app id if required by version)
  - AI provider key, e.g., `OPENAI_API_KEY`
- Serverless considerations:
  - Use `/tmp` for extraction.
  - Keep processing under execution limits or offload to a queue/background job (see below).

## 8) Optional: Background Processing

- If AI + extraction may exceed function timeouts:
  - `POST /api/process` returns `202 Accepted` with a job id.
  - Worker/queue performs extraction + AI generation.
  - Status endpoint polls job + project state.

## 9) Quality Gates

- Lint and typecheck across project.
- Minimal tests:
  - Project creation via `/api/uploads`.
  - Status endpoint for both states.
  - Download endpoint returns correct headers and body.

## 10) Quick Sequencing Guide

- Day 1
  - Verify UploadThing return payload uses `file.url`.
  - Export models for `File` and `OutputMd` (if not already).
  - Add UploadThing route handler at `app/api/uploadthing/route.ts`.
  - (DONE) `/api/uploads` to persist metadata and return `projectId`.
- Day 2
  - Implement `/api/process` (synchronous prototype).
  - Implement `/api/projects/[projectId]/status`.
  - E2E test on a small repo ZIP.
- Day 3
  - Implement `/api/docs/[outputId]/download`.
  - Frontend wiring (upload -> create project -> process -> poll -> download).
  - Improve prompts and error handling.
- Day 4
  - Optional: Background job + queue.
  - History page and nicer UX.

---

Use this as your working checklist and update as you complete each item.
