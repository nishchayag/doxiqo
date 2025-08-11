import Project from "@/models/project.model";
import connectDB from "@/utils/connectDB";
import { downloadFile } from "@/utils/fileDownloader";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
var AdmZip = require("adm-zip");
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "Please provide projectId" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingProject = await Project.findById(projectId);

    if (!existingProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (existingProject.user._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "You are not authorized to access this project" },
        { status: 403 }
      );
    }

    const originalZipUrl = existingProject.originalZipUrl;

    const downloadedFilePath = await downloadFile({
      fileUrl: originalZipUrl,
      fileName: `project-${projectId}.zip`,
    });

    var zip = new AdmZip(downloadedFilePath);
    const extractDir = `/tmp/${projectId}`;
    zip.extractAllTo(extractDir, true);

    const INCLUDE_FILES = new Set([
      "README",
      "README.md",
      "README.mdx",
      "LICENSE",
      "CONTRIBUTING",
      "CHANGELOG",
      "package.json",
      "tsconfig.json",
      "next.config.ts",
      ".env.example",
    ]);
    const INCLUDE_EXTS = new Set([
      ".md",
      ".mdx",
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".json",
      ".yml",
      ".yaml",
      ".toml",
      ".py",
      ".rs",
      ".go",
      ".rb",
      ".php",
      ".cs",
      ".java",
      ".kt",
      ".swift",
      ".sql",
      ".graphql",
      ".prisma",
      ".sh",
    ]);
    const EXCLUDE_DIRS = new Set([
      "node_modules",
      ".git",
      ".next",
      "build",
      "dist",
      "out",
      "coverage",
      ".cache",
      ".turbo",
      "vendor",
      ".venv",
      "pycache",
    ]);
    const BINARY_EXTS = new Set([
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".ico",
      ".svg",
      ".webp",
      ".zip",
      ".tar",
      ".gz",
      ".rar",
      ".7z",
      ".pdf",
      ".mp4",
      ".mp3",
      ".woff",
      ".woff2",
      ".ttf",
    ]);
    const PER_FILE_MAX = 300 * 1024; // 300KB
    const TOTAL_MAX = 8 * 1024 * 1024; // 8MB
    const MAX_FILES = 150;

    const results: Array<{
      path: string;
      language: string;
      content: string;
      size: number;
    }> = [];
    let totalBytes = 0;

    const extToLang = (ext: string) => {
      switch (ext) {
        case ".ts":
          return "ts";
        case ".tsx":
          return "tsx";
        case ".js":
          return "js";
        case ".jsx":
          return "jsx";
        case ".md":
          return "md";
        case ".mdx":
          return "mdx";
        case ".json":
          return "json";
        case ".yml":
        case ".yaml":
          return "yaml";
        default:
          return ext.replace(/^\./, "") || "text";
      }
    };

    const shouldInclude = (base: string, ext: string) => {
      const baseLower = base.toLowerCase();
      return (
        INCLUDE_FILES.has(base) ||
        INCLUDE_FILES.has(baseLower) ||
        INCLUDE_EXTS.has(ext)
      );
    };

    const isExcludedDir = (name: string) => EXCLUDE_DIRS.has(name);
    const isBinaryExt = (ext: string) => BINARY_EXTS.has(ext);

    async function fileTraverse(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= MAX_FILES || totalBytes >= TOTAL_MAX) return;

        const abs = path.join(dir, entry.name);
        const rel = path.relative(extractDir, abs).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          if (isExcludedDir(entry.name)) continue;
          await fileTraverse(abs);
          continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        if (isBinaryExt(ext)) continue;
        if (!shouldInclude(entry.name, ext)) continue;

        try {
          const stat = await fs.stat(abs);
          if (stat.size > PER_FILE_MAX) continue;
          if (totalBytes + stat.size > TOTAL_MAX) continue;

          const content = await fs.readFile(abs, "utf8"); // utf8 - unicode transformation format in 8 bits -> from chatgpt
          if (content.indexOf("\u0000") !== -1) continue; // binary guard for null characters -> from chatgpt

          results.push({
            path: rel,
            language: extToLang(ext),
            content,
            size: stat.size,
          });
          totalBytes += stat.size;
        } catch {
          if (process.env.NODE_ENV !== "production") {
            console.warn(`Skipping unreadable file: ${rel}`);
          }
        }
      }
    }

    await fileTraverse(extractDir);

    results.sort((a, b) => {
      const aScore =
        (a.path.toLowerCase().includes("readme") ? -2 : 0) +
        (a.path === "package.json" ? -1 : 0);
      const bScore =
        (b.path.toLowerCase().includes("readme") ? -2 : 0) +
        (b.path === "package.json" ? -1 : 0);
      return aScore - bScore;
    });

    const preview = results.map((f) => ({
      path: f.path,
      language: f.language,
      size: f.size,
      snippet: f.content.slice(0, 1000),
    }));

    return NextResponse.json({
      projectId,
      extractDir,
      limits: {
        perFileMaxBytes: PER_FILE_MAX,
        totalMaxBytes: TOTAL_MAX,
        maxFiles: MAX_FILES,
      },
      count: results.length,
      totalBytes,
      files: preview,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("File Processing error", error);
    }
    return NextResponse.json(
      { error: "File Processing failed" },
      { status: 500 }
    );
  }
}
