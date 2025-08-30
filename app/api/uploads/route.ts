import { NextResponse, NextRequest } from "next/server";
import connectDB from "@/utils/connectDB";
import UserModel from "@/models/user.model";
import Project from "@/models/project.model";
import { getServerSession } from "next-auth";
import authoptions from "@/utils/nextAuthOptions";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authoptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized, Please sign in first." },
        { status: 401 }
      );
    }

    const { originalZipUrl, name } = await request.json();

    if (!originalZipUrl) {
      return NextResponse.json(
        { error: "Missing originalZipUrl" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await UserModel.findById(session.user.id).select("_id");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await Project.create({
      user: user._id,
      originalZipUrl,
      name: name?.toString().trim() || undefined,
      status: "uploading",
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
