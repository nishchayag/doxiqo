import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/utils/connectDB";
import UserModel from "@/models/user.model";
import Project from "@/models/project.model";

export async function POST(request: NextRequest) {
  try {
    const { userId, originalZipUrl, name } = await request.json();

    if (!userId || !originalZipUrl) {
      return NextResponse.json(
        { error: "Missing userId or originalZipUrl" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await UserModel.findById(userId).select("_id");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await Project.create({
      user: user._id,
      originalZipUrl,
      name: name?.toString().trim() || undefined,
      status: "processing",
    });

    await UserModel.findByIdAndUpdate(user._id, {
      $addToSet: { projects: project._id },
    });

    return NextResponse.json(
      { message: "Upload metadata saved", projectId: project._id.toString() },
      { status: 201 }
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("/api/uploads POST error:", error);
    }
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
