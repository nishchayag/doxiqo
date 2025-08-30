"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  hasOutput: boolean;
}

interface SidebarProps {
  onProjectSelect?: (projectId: string) => void;
  onNewProject?: () => void;
  selectedProjectId?: string;
}

export default function Sidebar({
  onProjectSelect,
  onNewProject,
  selectedProjectId,
}: SidebarProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/projects");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch projects");
      }

      setProjects(data.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
      case "generating":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "processing":
        return "Processing";
      case "generating":
        return "Generating";
      case "uploaded":
        return "Uploaded";
      default:
        return "Unknown";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Projects</h2>
          <button
            onClick={onNewProject}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="New Project"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
            <p className="text-sm text-gray-500 mt-2">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="p-4">
            <div className="text-center">
              <XCircle className="h-8 w-8 text-red-400 mx-auto" />
              <p className="text-sm text-red-600 mt-2">{error}</p>
              <button
                onClick={fetchProjects}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="p-4 text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-gray-500 mt-2">No projects yet</p>
            <button
              onClick={onNewProject}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="p-2">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectSelect?.(project.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedProjectId === project.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {project.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      {getStatusIcon(project.status)}
                      <span className="text-xs text-gray-500 ml-1">
                        {getStatusText(project.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(project.updatedAt)}
                    </p>
                  </div>
                  {project.hasOutput && (
                    <div className="ml-2">
                      <div
                        className="w-2 h-2 bg-green-400 rounded-full"
                        title="Documentation available"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 flex-shrink-0">
        <button
          onClick={fetchProjects}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Refresh Projects
        </button>
      </div>
    </div>
  );
}
