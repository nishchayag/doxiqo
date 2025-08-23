"use client";

import { useState, useEffect, useRef } from "react";

interface ProjectStatusProps {
  projectId: string;
  onComplete: (outputId: string) => void;
}

interface StatusResponse {
  status: string;
  outputId?: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
  generationMeta?: {
    filesProcessed: number;
    model: string;
    promptTokens: number;
    completionTokens: number;
    durationMs: number;
  };
}

export default function ProjectStatus({
  projectId,
  onComplete,
}: ProjectStatusProps) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}/status`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to get status");
        }

        setStatus(data);
        setLoading(false);

        // If completed, notify parent and stop polling
        if (data.status === "completed" && data.outputId) {
          onComplete(data.outputId);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        // If failed, stop polling
        else if (data.status === "failed") {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds for updates
    intervalRef.current = setInterval(checkStatus, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [projectId, onComplete]);

  if (loading && !status) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Loading project status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!status) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50 border-green-200";
      case "failed":
        return "text-red-600 bg-red-50 border-red-200";
      case "generating":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "processing":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "prepared":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "generating":
        return "🤖";
      case "processing":
        return "⚙️";
      case "prepared":
        return "📋";
      default:
        return "⏳";
    }
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 border rounded-lg ${getStatusColor(status.status)}`}>
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(status.status)}</span>
          <span className="font-semibold capitalize">{status.status}</span>
        </div>
        {status.message && <p className="mt-2 text-sm">{status.message}</p>}
      </div>

      {status.status === "generating" && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">
            AI is generating your documentation...
          </span>
        </div>
      )}

      {status.errors && status.errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
          <ul className="space-y-1">
            {status.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                <strong>{error.field}:</strong> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {status.generationMeta && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">
            Generation Details:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>Files Processed: {status.generationMeta.filesProcessed}</div>
            <div>Model: {status.generationMeta.model}</div>
            <div>
              Prompt Tokens:{" "}
              {status.generationMeta.promptTokens.toLocaleString()}
            </div>
            <div>
              Response Tokens:{" "}
              {status.generationMeta.completionTokens.toLocaleString()}
            </div>
            <div className="col-span-2">
              Duration: {(status.generationMeta.durationMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
