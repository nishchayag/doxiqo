import Project from "@/models/project.model";
import connectDB from "@/utils/connectDB";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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

    const originalZipUrl = existingProject.originalZipUrl;
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
