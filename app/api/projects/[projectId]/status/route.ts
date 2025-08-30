import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authoptions from "@/utils/nextAuthOptions";
import connectDB from "@/utils/connectDB";
import Project from "@/models/project.model";

interface StatusResponse {
  projectId: string;
  status: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  outputId?: string;
  generationMeta?: Record<string, unknown>;
  errors?: Array<{ field: string; message: string }>;
  message?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authoptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    await connectDB();

    // Find project and validate ownership
    const project = await Project.findById(projectId)
      .populate("outputMd", "_id")
      .populate("user", "_id")
      .select(
        "status outputMd errorFields generationMeta createdAt updatedAt name user"
      );

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user._id.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this project" },
        { status: 403 }
      );
    }

    // Build response based on status
    const response: StatusResponse = {
      projectId,
      status: project.status,
      name: project.name,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    // Add status-specific data
    switch (project.status) {
      case "completed":
        if (project.outputMd) {
          response.outputId = project.outputMd._id || project.outputMd;
        }
        if (project.generationMeta) {
          response.generationMeta = project.generationMeta;
        }
        break;

      case "failed":
        if (project.errorFields && project.errorFields.length > 0) {
          response.errors = project.errorFields.map(
            (err: { field: string; error: string }) => ({
              field: err.field,
              message: err.error,
            })
          );
        }
        break;

      case "generating":
        response.message =
          "Documentation is being generated. This may take 30-60 seconds.";
        break;

      case "processing":
        response.message = "Files are being processed and prepared.";
        break;

      case "prepared":
        response.message =
          "Files processed. Ready for documentation generation.";
        break;

      case "uploading":
        response.message = "Upload in progress.";
        break;

      default:
        response.message = `Status: ${project.status}`;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("/api/projects/[projectId]/status GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to get project status",
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
