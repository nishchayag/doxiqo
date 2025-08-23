"use client";

interface FilePreview {
  path: string;
  language: string;
  size: number;
  hash: string;
  snippet: string;
}

interface FilePreviewProps {
  files: FilePreview[];
  totalBytes: number;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function FilePreviewComponent({
  files,
  totalBytes,
  onGenerate,
  isGenerating,
}: FilePreviewProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      ts: "bg-blue-100 text-blue-800",
      tsx: "bg-blue-100 text-blue-800",
      js: "bg-yellow-100 text-yellow-800",
      jsx: "bg-yellow-100 text-yellow-800",
      md: "bg-gray-100 text-gray-800",
      json: "bg-green-100 text-green-800",
      py: "bg-green-100 text-green-800",
      default: "bg-gray-100 text-gray-800",
    };
    return colors[language] || colors.default;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">
          Files Prepared for Documentation
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            <strong>{files.length}</strong> files selected
          </p>
          <p>
            <strong>{formatBytes(totalBytes)}</strong> total content
          </p>
          <p>Ready for AI documentation generation</p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {files.map((file, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-gray-700">
                  {file.path}
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getLanguageColor(
                    file.language
                  )}`}
                >
                  {file.language}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {formatBytes(file.size)}
              </span>
            </div>
            {file.snippet && (
              <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                {file.snippet}
                {file.snippet.length >= 1000 && "..."}
              </pre>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
            isGenerating
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500"
          }`}
        >
          {isGenerating ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating Documentation...</span>
            </div>
          ) : (
            "🤖 Generate Documentation"
          )}
        </button>
      </div>
    </div>
  );
}
