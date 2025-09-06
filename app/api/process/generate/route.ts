import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authoptions from "@/utils/nextAuthOptions";
import connectDB from "@/utils/connectDB";
import Project from "@/models/project.model";
import OutputMd from "@/models/outputMd.model";
import { parsePreparedSummary } from "@/utils/preparedSummaryHelper";
import { checkRateLimit, getRateLimitInfo } from "@/utils/rateLimit";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "node:fs/promises";
import path from "node:path";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authoptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    // Rate limiting check
    if (!checkRateLimit(session.user.id, 5, 60 * 1000)) {
      const rateLimitInfo = getRateLimitInfo(session.user.id);
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Too many generation requests.",
          rateLimitInfo,
        },
        { status: 429 }
      );
    }

    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    await connectDB();

    // Find and validate project
    const project = await Project.findById(projectId).populate("user", "_id");
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this project" },
        { status: 403 }
      );
    }

    if (project.status !== "prepared") {
      return NextResponse.json(
        {
          error:
            "Project must be prepared before generation. Call /api/process/prepare first.",
        },
        { status: 400 }
      );
    }

    // Update status to generating
    await project.updateOne({ status: "generating" });

    // Parse prepared summary
    if (!project.preparedSummary) {
      throw new Error("No prepared summary found");
    }

    const summary = parsePreparedSummary(project.preparedSummary);
    const extractDir = process.env.VERCEL
      ? `/tmp/${projectId}`
      : `./tmp/${projectId}`;

    // Read file contents based on prepared summary
    const fileContents = await Promise.all(
      summary.files.map(async (file) => {
        try {
          const fullPath = path.join(extractDir, file.path);
          const content = await fs.readFile(fullPath, "utf8");
          return {
            path: file.path,
            language: file.language,
            content: content.slice(0, 10000), // Limit content per file for token management
          };
        } catch (error) {
          console.warn(`Failed to read file ${file.path}:`, error);
          return null;
        }
      })
    );

    const validFiles = fileContents.filter(Boolean) as Array<{
      path: string;
      language: string;
      content: string;
    }>;

    // Build AI prompt
    const systemInstruction =
      "You are an expert technical writer who creates comprehensive, well-structured documentation for software projects. Generate clear, professional documentation in markdown format.";
    const fullPrompt = `${systemInstruction}\n\n${buildDocumentationPrompt(
      validFiles,
      project.name || "Project"
    )}`;

    // Call Gemini API
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const generatedMarkdown = response.text();

    if (!generatedMarkdown) {
      throw new Error("Failed to generate documentation");
    }

    // Save to OutputMd
    const outputMd = await OutputMd.create({
      userId: session.user.id,
      projectId: project._id,
      docMarkdown: generatedMarkdown,
    });

    // Calculate generation metadata
    const generationMeta = {
      model: "gemini-1.5-flash",
      promptTokens: result.response.usageMetadata?.promptTokenCount || 0,
      completionTokens:
        result.response.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: result.response.usageMetadata?.totalTokenCount || 0,
      durationMs: Date.now() - startTime,
    };

    // Update project with completion
    await project.updateOne({
      status: "completed",
      outputMd: outputMd._id,
      // Store generation metadata (you might want to add this field to schema)
      $set: {
        generationMeta: generationMeta,
      },
    });

    return NextResponse.json({
      message: "Documentation generated successfully",
      outputId: outputMd._id.toString(),
      projectId: project._id.toString(),
      metadata: {
        filesProcessed: validFiles.length,
        ...generationMeta,
      },
    });
  } catch (error) {
    console.error("/api/process/generate error:", error);

    // Try to update project status to failed
    const { projectId } = await request.json().catch(() => ({}));
    if (projectId) {
      try {
        await connectDB();
        await Project.findByIdAndUpdate(projectId, {
          status: "failed",
          $push: {
            errorFields: {
              field: "generation",
              error:
                error instanceof Error ? error.message : "Generation failed",
            },
          },
        });
      } catch (updateError) {
        console.error("Failed to update project status:", updateError);
      }
    }

    return NextResponse.json(
      {
        error: "Documentation generation failed",
        details:
          process.env.NODE_ENV !== "production"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}

function buildDocumentationPrompt(
  files: Array<{ path: string; language: string; content: string }>,
  projectName: string
): string {
  // Prioritize important files for context
  const prioritizedFiles = files.sort((a, b) => {
    const aPriority = getFilePriority(a.path);
    const bPriority = getFilePriority(b.path);
    return bPriority - aPriority;
  });

  const fileContents = prioritizedFiles
    .map(
      (file) =>
        `### ${file.path} (${file.language})\n\`\`\`${file.language}\n${file.content}\n\`\`\``
    )
    .join("\n\n");

  return `# Generate Comprehensive Documentation

Please analyze the following project files and generate comprehensive technical documentation in markdown format.

**Project Name:** ${projectName}

**Files to analyze:**
${fileContents}

**Please generate documentation with the following sections:**

1. **Project Overview** - Brief description and purpose
2. **Tech Stack & Dependencies** - Technologies, frameworks, and key dependencies used
3. **Project Structure** - High-level directory/file organization
4. **Setup & Installation** - How to get the project running locally
5. **Configuration** - Environment variables, config files, and settings
6. **Key Features & Functionality** - Main features and how they work
7. **API Endpoints** (if applicable) - Available endpoints and their usage
8. **Data Models** (if applicable) - Database schemas or data structures
9. **Architecture Notes** - Important architectural decisions and patterns
10. **Development Notes** - Tips for developers working on this project

**Guidelines:**
- Be thorough but concise
- Use proper markdown formatting
- Include code examples where helpful
- Focus on practical information for developers
- If something isn't clear from the files, note it as "TODO: Add details"
- Organize content logically with clear headers
`;
}

function getFilePriority(filePath: string): number {
  const path = filePath.toLowerCase();

  if (path.includes("readme")) return 100;
  if (path.includes("package.json")) return 90;
  if (path.includes("tsconfig") || path.includes("next.config")) return 80;
  if (path.includes(".env.example")) return 70;
  if (path.endsWith(".md") || path.endsWith(".mdx")) return 60;
  if (path.includes("model") || path.includes("schema")) return 50;
  if (path.includes("api") || path.includes("route")) return 45;
  if (path.includes("config") || path.includes("util")) return 40;
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return 30;
  if (path.endsWith(".js") || path.endsWith(".jsx")) return 25;

  return 10; // Default priority
}
