import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authoptions from "@/utils/nextAuthOptions";
import connectDB from "@/utils/connectDB";
import OutputMd from "@/models/outputMd.model";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ outputId: string }> }
) {
  try {
    const session = await getServerSession(authoptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    const { outputId } = await params;

    if (!outputId) {
      return NextResponse.json({ error: "Missing outputId" }, { status: 400 });
    }

    await connectDB();

    // Find output document and validate ownership
    const outputMd = await OutputMd.findById(outputId).populate(
      "projectId",
      "name"
    );

    if (!outputMd) {
      return NextResponse.json(
        { error: "Documentation not found" },
        { status: 404 }
      );
    }

    // Check ownership - the outputMd has a userId field that should match the session user
    if (outputMd.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this documentation" },
        { status: 403 }
      );
    }

    // Get project name for filename
    const projectName = outputMd.projectId?.name || "project";
    const sanitizedName = projectName
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .toLowerCase();
    const filename = `${sanitizedName}-documentation.md`;

    // Create response with download headers
    const response = new NextResponse(outputMd.docMarkdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": Buffer.byteLength(
          outputMd.docMarkdown,
          "utf8"
        ).toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Expires: "0",
        Pragma: "no-cache",
      },
    });

    return response;
  } catch (error) {
    console.error("/api/docs/[outputId]/download GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to download documentation",
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
