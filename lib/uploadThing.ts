import { NextRequest } from "next/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth";
import authoptions from "@/utils/nextAuthOptions";

const f = createUploadthing();

const auth = async (req: NextRequest) => {
  const session = await getServerSession(authoptions);
  if (!session || !session.user) {
    throw new UploadThingError("Unauthorized");
  }
  return session.user.id;
};

export const ourFileRouter = {
  zipUploader: f({
    blob: {
      maxFileSize: "64MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const userId = await auth(req);
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File object:", JSON.stringify(file, null, 2));
      console.log("File URL:", file.url);
      console.log("File key:", file.key);
      console.log("File name:", file.name);

      // Try to construct the correct URL using the app ID and file key
      const appId = "smd4r6sna5"; // This appears to be your app ID from the working URL
      const correctUrl = `https://${appId}.ufs.sh/f/${file.key}`;
      console.log("Constructed URL:", correctUrl);

      return { uploadedBy: metadata.userId, fileUrl: correctUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
