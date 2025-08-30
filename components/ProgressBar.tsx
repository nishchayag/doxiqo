"use client";

import { useState, useEffect } from "react";

interface ProgressBarProps {
  isVisible: boolean;
  progress: number;
  title?: string;
  description?: string;
  className?: string;
}

export default function ProgressBar({
  isVisible,
  progress,
  title = "Uploading...",
  description,
  className = "",
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (isVisible) {
      // Smooth progress animation
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(0);
    }
  }, [progress, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">
          {Math.round(displayProgress)}%
        </span>
      </div>

      {description && (
        <p className="text-sm text-gray-600 mb-3">{description}</p>
      )}

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      {displayProgress < 100 && (
        <div className="flex items-center mt-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Processing...</span>
        </div>
      )}
    </div>
  );
}
