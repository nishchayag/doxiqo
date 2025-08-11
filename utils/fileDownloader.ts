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
  const response = await axios.get(fileUrl, { responseType: "arraybuffer" });

  if (response.status !== 200) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }

  const filePath = path.join("/tmp", fileName);
  fs.writeFileSync(filePath, response.data);
  return filePath;
}
