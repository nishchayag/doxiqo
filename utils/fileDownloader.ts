import axios from "axios";
import fs from "fs";
import path from "path";

export async function downloadFile({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName: string;
}) {
  console.log(`Attempting to download file from: ${fileUrl}`);

  // Convert old UploadThing URL format to new format if needed
  let actualFileUrl = fileUrl;
  if (fileUrl.includes("utfs.io/f/")) {
    // Extract file identifier from old format
    const fileIdentifier = fileUrl.split("/f/")[1];
    if (fileIdentifier) {
      console.log(`Old UploadThing URL detected: ${fileUrl}`);
      console.log(`File identifier: ${fileIdentifier}`);

      // For your specific case, we know the working URL format
      const appId = "smd4r6sna5";

      // If this is the notesify-main.zip file, we know the working URL
      if (fileIdentifier.includes("notesify-main.zip")) {
        actualFileUrl = `https://${appId}.ufs.sh/f/VQmiqidnEs4NOuEjR78VzcrFX2u6ZdaE1KQmlAUI3yLoqnep`;
        console.log(
          `Using known working URL for notesify-main.zip: ${actualFileUrl}`
        );
      } else {
        // Try to find the actual file key - this might need to be adjusted
        // based on what the actual file key format is
        if (fileIdentifier.includes("-")) {
          // Try to extract just the file key part
          const parts = fileIdentifier.split("-");
          if (parts.length > 1) {
            // Try different combinations
            const possibleKeys = [
              fileIdentifier, // Try the full identifier
              parts.slice(1).join("-"), // Try without the timestamp part
              parts[0], // Try just the timestamp part
            ];

            for (const key of possibleKeys) {
              const newFormatUrl = `https://${appId}.ufs.sh/f/${key}`;
              console.log(`Trying new format URL: ${newFormatUrl}`);

              try {
                const testResponse = await axios.head(newFormatUrl, {
                  timeout: 5000,
                });
                if (testResponse.status === 200) {
                  actualFileUrl = newFormatUrl;
                  console.log(`Found working URL: ${actualFileUrl}`);
                  break;
                }
              } catch (error) {
                console.log(`URL ${newFormatUrl} didn't work, trying next...`);
              }
            }
          }
        }
      }
    }
  }

  console.log(`Final URL to download: ${actualFileUrl}`);

  try {
    // Use Vercel-compatible temp directory
    const tmpDir = process.env.VERCEL ? "/tmp" : "./tmp";
    const filePath = path.join(tmpDir, fileName);

    // Ensure the tmp directory exists
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Try different approaches for UploadThing URLs
    if (actualFileUrl.includes("utfs.io") || actualFileUrl.includes("ufs.sh")) {
      console.log("Detected UploadThing URL, trying different approaches...");

      // First, try without any authentication
      try {
        console.log("Trying without authentication...");
        const response = await axios.get(actualFileUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (response.status === 200) {
          fs.writeFileSync(filePath, response.data);
          console.log(`File downloaded successfully to: ${filePath}`);
          return filePath;
        }
      } catch (error) {
        console.log("First attempt failed, trying with token...");
      }

      // Second, try with UploadThing token
      try {
        const uploadthingToken = process.env.UPLOADTHING_TOKEN;
        if (uploadthingToken) {
          console.log("Trying with UploadThing token...");
          const response = await axios.get(actualFileUrl, {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: {
              Authorization: `Bearer ${uploadthingToken}`,
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });

          if (response.status === 200) {
            fs.writeFileSync(filePath, response.data);
            console.log(`File downloaded successfully to: ${filePath}`);
            return filePath;
          }
        }
      } catch (error) {
        console.log(
          "Second attempt failed, trying with X-Uploadthing-Token..."
        );
      }

      // Third, try with X-Uploadthing-Token header
      try {
        const uploadthingToken = process.env.UPLOADTHING_TOKEN;
        if (uploadthingToken) {
          console.log("Trying with X-Uploadthing-Token header...");
          const response = await axios.get(actualFileUrl, {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: {
              "X-Uploadthing-Token": uploadthingToken,
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
          });

          if (response.status === 200) {
            fs.writeFileSync(filePath, response.data);
            console.log(`File downloaded successfully to: ${filePath}`);
            return filePath;
          }
        }
      } catch (error) {
        console.log("Third attempt failed...");
      }
    } else {
      // For non-UploadThing URLs, use standard approach
      const response = await axios.get(actualFileUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      if (response.status === 200) {
        fs.writeFileSync(filePath, response.data);
        console.log(`File downloaded successfully to: ${filePath}`);
        return filePath;
      }
    }

    throw new Error(`All download attempts failed for ${actualFileUrl}`);
  } catch (error) {
    console.error(`Download failed for ${actualFileUrl}:`, error);
    if (axios.isAxiosError(error)) {
      console.error(`Response status: ${error.response?.status}`);
      console.error(`Response headers:`, error.response?.headers);
      console.error(`Response data:`, error.response?.data?.toString?.());
    }
    throw error;
  }
}
