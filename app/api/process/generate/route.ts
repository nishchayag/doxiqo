import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You are not authorized to generate docs for this project" },
        { status: 403 }
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("/api/process/generate POST error:", error);
    }
    return NextResponse.json(
      { error: "Md generation failed" },
      { status: 500 }
    );
  }
}
