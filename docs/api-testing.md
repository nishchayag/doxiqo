# API Endpoints Testing Guide

## Complete Backend Flow Test

### 1. Upload ZIP File

```bash
# First upload via UploadThing, then call:
POST /api/uploads
{
  "originalZipUrl": "https://uploadthing.com/f/your-file-url",
  "name": "My Project"
}
# Response: { "projectId": "..." }
```

### 2. Prepare Files

```bash
POST /api/process/prepare
{
  "projectId": "your-project-id"
}
# Response: { "count": 15, "totalBytes": 50000, "files": [...] }
```

### 3. Generate Documentation

```bash
POST /api/process/generate
{
  "projectId": "your-project-id"
}
# Response: { "outputId": "...", "metadata": {...} }
```

### 4. Check Status (Poll this)

```bash
GET /api/projects/{projectId}/status
# Response: { "status": "completed", "outputId": "..." }
```

### 5. Download Documentation

```bash
GET /api/docs/{outputId}/download
# Downloads: project-name-documentation.md
```

## Status Values

- `uploading` → `processing` → `prepared` → `generating` → `completed`
- Or: `failed` at any stage

## Rate Limits

- Generate endpoint: 5 requests per minute per user

## Required Environment Variables

```bash
MONGODB_URI=your-mongo-connection
NEXTAUTH_SECRET=your-secret
OPENAI_API_KEY=your-openai-key
UPLOADTHING_SECRET=your-uploadthing-secret
```
