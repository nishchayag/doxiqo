"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { UploadDropzone } from "@/components/UploadThingComponents";
import FilePreviewComponent from "@/components/FilePreview";
import ProjectStatus from "@/components/ProjectStatus";

interface FilePreview {
  path: string;
  language: string;
  size: number;
  hash: string;
  snippet: string;
}

interface PrepareResponse {
  projectId: string;
  count: number;
  totalBytes: number;
  files: FilePreview[];
}

type AppStep = "upload" | "prepare" | "preview" | "generate" | "completed";

export default function DashboardContent() {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState<AppStep>("upload");
  const [projectId, setProjectId] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [prepareData, setPrepareData] = useState<PrepareResponse | null>(null);
  const [outputId, setOutputId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleUploadComplete = async (res: Array<{ url: string }>) => {
    try {
      setLoading(true);
      setError("");

      const uploadResult = res[0];
      if (!uploadResult?.url) {
        throw new Error("Upload failed - no file URL received");
      }

      // Create project
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalZipUrl: uploadResult.url,
          name: projectName || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setProjectId(data.projectId);
      setCurrentStep("prepare");

      // Automatically start preparation
      await handlePrepare(data.projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePrepare = async (projId: string = projectId) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/process/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to prepare files");
      }

      setPrepareData(data);
      setCurrentStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preparation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      setCurrentStep("generate");

      const response = await fetch("/api/process/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate documentation");
      }

      // Generation started successfully, ProjectStatus component will handle polling
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setCurrentStep("preview"); // Go back to preview on error
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (outputId: string) => {
    setOutputId(outputId);
    setCurrentStep("completed");
  };

  const handleDownload = () => {
    if (outputId) {
      window.open(`/api/docs/${outputId}/download`, "_blank");
    }
  };

  const handleReset = () => {
    setCurrentStep("upload");
    setProjectId("");
    setProjectName("");
    setPrepareData(null);
    setOutputId("");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Doxiqo</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {session?.user?.name || session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/landing" })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {(
              [
                "upload",
                "prepare",
                "preview",
                "generate",
                "completed",
              ] as AppStep[]
            ).map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step
                      ? "bg-blue-600 text-white"
                      : (
                          [
                            "upload",
                            "prepare",
                            "preview",
                            "generate",
                            "completed",
                          ] as AppStep[]
                        ).indexOf(currentStep) > index
                      ? "bg-green-600 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {index + 1}
                </div>
                {index < 4 && (
                  <div
                    className={`w-12 h-0.5 ${
                      (
                        [
                          "upload",
                          "prepare",
                          "preview",
                          "generate",
                          "completed",
                        ] as AppStep[]
                      ).indexOf(currentStep) > index
                        ? "bg-green-600"
                        : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600 capitalize">
              {currentStep === "prepare"
                ? "Processing"
                : currentStep === "preview"
                ? "Review Files"
                : currentStep === "generate"
                ? "Generating"
                : currentStep}
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {currentStep === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Upload Your Project
                </h2>
                <p className="text-gray-600">
                  Upload a ZIP file of your codebase to generate comprehensive
                  documentation
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name (optional)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <UploadDropzone
                endpoint="zipUploader"
                onClientUploadComplete={handleUploadComplete}
                onUploadError={(error: Error) => {
                  setError(`Upload error: ${error.message}`);
                }}
                appearance={{
                  container: "w-full max-w-lg mx-auto",
                  uploadIcon: "text-blue-600",
                  label: "text-blue-600",
                  allowedContent: "text-gray-500",
                }}
              />
            </div>
          )}

          {currentStep === "prepare" && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="text-xl font-semibold text-gray-900">
                Processing Your Project
              </h2>
              <p className="text-gray-600">
                Extracting and analyzing files... This may take a moment.
              </p>
            </div>
          )}

          {currentStep === "preview" && prepareData && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Review Selected Files
                </h2>
                <p className="text-gray-600">
                  These files will be used to generate your documentation
                </p>
              </div>

              <FilePreviewComponent
                files={prepareData.files}
                totalBytes={prepareData.totalBytes}
                onGenerate={handleGenerate}
                isGenerating={loading}
              />
            </div>
          )}

          {currentStep === "generate" && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Generating Documentation
                </h2>
                <p className="text-gray-600">
                  AI is analyzing your code and creating comprehensive
                  documentation
                </p>
              </div>

              <ProjectStatus
                projectId={projectId}
                onComplete={handleComplete}
              />
            </div>
          )}

          {currentStep === "completed" && (
            <div className="text-center space-y-6">
              <div className="text-green-600 text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Documentation Generated!
              </h2>
              <p className="text-gray-600">
                Your comprehensive project documentation is ready for download
              </p>

              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  📄 Download Documentation
                </button>

                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  🔄 Generate Another
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
