/**
 * Helper functions for working with preparedSummary JSON data
 */

export interface PreparedFile {
  path: string;
  language: string;
  size: number;
  hash: string;
}

export interface PreparedSummary {
  files: PreparedFile[];
  totalFiles: number;
  totalBytes: number;
  extractedAt: string;
}

/**
 * Parse preparedSummary JSON string into typed object
 */
export function parsePreparedSummary(summaryJson: string): PreparedSummary {
  try {
    return JSON.parse(summaryJson) as PreparedSummary;
  } catch (error) {
    throw new Error(`Failed to parse preparedSummary: ${error}`);
  }
}

/**
 * Get file paths from prepared summary (useful for generate endpoint)
 */
export function getFilePaths(summary: PreparedSummary): string[] {
  return summary.files.map((f) => f.path);
}

/**
 * Check if files have changed by comparing hashes
 */
export function hasFilesChanged(
  oldSummary: PreparedSummary,
  newSummary: PreparedSummary
): boolean {
  if (oldSummary.files.length !== newSummary.files.length) return true;

  for (let i = 0; i < oldSummary.files.length; i++) {
    const oldFile = oldSummary.files[i];
    const newFile = newSummary.files.find((f) => f.path === oldFile.path);

    if (!newFile || oldFile.hash !== newFile.hash) {
      return true;
    }
  }

  return false;
}
