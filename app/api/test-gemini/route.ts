import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authoptions from "@/utils/nextAuthOptions";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authoptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in first." },
        { status: 401 }
      );
    }

    // Test Gemini connection with a simple request
    const result = await model.generateContent("Say 'Hello, Gemini API is working!' in exactly 5 words.");
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      message: "Gemini API is working",
      response: text,
      usage: result.response.usageMetadata,
    });
  } catch (error) {
    console.error("/api/test-gemini error:", error);
    return NextResponse.json(
      {
        error: "Gemini API test failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
