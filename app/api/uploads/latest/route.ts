import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authoptions from "@/utils/nextAuthOptions";
import connectDB from "@/utils/connectDB";
import Project from "@/models/project.model";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authoptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized, Please sign in first." },
        { status: 401 }
      );
    }

    await connectDB();

    // Get the most recent project for this user
    const latestProject = await Project.findOne({
      user: session.user.id,
    }).sort({ createdAt: -1 });

    if (!latestProject || !latestProject.originalZipUrl) {
      return NextResponse.json(
        { error: "No recent uploads found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      url: latestProject.originalZipUrl,
      projectId: latestProject._id,
      createdAt: latestProject.createdAt,
    });
  } catch (error) {
    console.error("Latest upload error:", error);
    return NextResponse.json(
      { error: "Failed to fetch latest upload" },
      { status: 500 }
    );
  }
}
