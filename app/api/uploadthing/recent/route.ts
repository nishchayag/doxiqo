import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authoptions from "@/utils/nextAuthOptions";
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authoptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized, Please sign in first." },
        { status: 401 }
      );
    }

    try {
      // Use UploadThing's server API to get recent files
      const files = await utapi.listFiles();
      console.log("UploadThing files:", files);

      if (files && files.files && files.files.length > 0) {
        // Get the most recent file
        const mostRecentFile = files.files[0];
        const appId = "smd4r6sna5";

        // Construct the correct URL using the file key
        const correctUrl = `https://${appId}.ufs.sh/f/${mostRecentFile.key}`;

        console.log("Most recent file key:", mostRecentFile.key);
        console.log("Constructed URL:", correctUrl);

        return NextResponse.json({
          url: correctUrl,
          key: mostRecentFile.key,
          name: mostRecentFile.name,
          size: mostRecentFile.size,
          uploadedAt: mostRecentFile.uploadedAt,
          note: "Retrieved from UploadThing API",
        });
      } else {
        return NextResponse.json(
          { error: "No files found in UploadThing" },
          { status: 404 }
        );
      }
    } catch (utError) {
      console.error("UploadThing API error:", utError);

      // Fallback to the latest known key if UploadThing API fails
      const latestFileKey = "VQmiqidnEs4NTg0LGWS9EZWzOQCUR6Ldws3oBSDaVkPNYtJM";
      const appId = "smd4r6sna5";
      const fallbackUrl = `https://${appId}.ufs.sh/f/${latestFileKey}`;

      return NextResponse.json({
        url: fallbackUrl,
        key: latestFileKey,
        note: "Fallback to latest known key due to API error",
        error: utError instanceof Error ? utError.message : String(utError),
      });
    }
  } catch (error) {
    console.error("Recent upload error:", error);
    return NextResponse.json(
      { error: "Failed to get recent upload" },
      { status: 500 }
    );
  }
}
