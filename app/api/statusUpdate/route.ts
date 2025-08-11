import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You are not authorized to update status for this project" },
        { status: 403 }
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("/api/statusUpdate POST error:", error);
    }
    return NextResponse.json(
      { error: "Project status change failed" },
      { status: 500 }
    );
  }
}
