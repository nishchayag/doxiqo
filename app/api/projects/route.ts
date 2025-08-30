import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/utils/connectDB";
import Project from "@/models/project.model";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    await connectDB();

    // Get all projects for the user
    const projects = await Project.find({ user: session.user.id })
      .select("name status createdAt updatedAt outputId")
      .sort({ updatedAt: -1 }); // Most recent first

    return NextResponse.json({
      projects: projects.map((project) => ({
        id: project._id.toString(),
        name: project.name || "Untitled Project",
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        hasOutput: !!project.outputId,
      })),
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
