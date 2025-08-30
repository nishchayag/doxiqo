"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { uploadFiles } from "@/utils/uploadthing";
import FilePreviewComponent from "@/components/FilePreview";
import ProjectStatus from "@/components/ProjectStatus";
import Sidebar from "@/components/Sidebar";
import ProgressBar from "@/components/ProgressBar";

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
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUploadStart = () => {
    setIsUploading(true);
    setUploadProgress(10); // Start with 10% to show progress has begun
    setError("");
  };

  const handleUploadError = (error: Error) => {
    setError(`Upload error: ${error.message}`);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleUploadComplete = async (res: Array<{ url: string }>) => {
    console.log("Upload complete called with:", res);
    console.log("Current session:", session);
    try {
      setUploadProgress(100);
      setLoading(true);
      setError("");

      const uploadResult = res[0];
      if (!uploadResult?.url) {
        throw new Error("Upload failed - no file URL received");
      }

      console.log("Creating project with URL:", uploadResult.url);

      // Create project
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalZipUrl: uploadResult.url,
          name: projectName || undefined,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const data = await response.json();
      console.log("Upload API response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setProjectId(data.projectId);
      setCurrentStep("prepare");

      console.log("Starting preparation for project:", data.projectId);

      // Automatically start preparation
      await handlePrepare(data.projectId);
    } catch (err) {
      console.error("Upload complete error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/zip" && !file.name.endsWith(".zip")) {
        setError("Please select a ZIP file");
        return;
      }
      setSelectedFile(file);
      setError("");
    }
  };

  const handleManualUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    try {
      console.log("Starting manual upload for file:", selectedFile.name);
      handleUploadStart();

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90; // Stop at 90%, let completion set to 100%
          }
          return prev + 10;
        });
      }, 500);

      console.log("Calling uploadFiles...");

      // Add a timeout to the uploadFiles call since it tends to hang
      const uploadTimeout = 60000; // 60 seconds timeout (increased from 15)

      const uploadPromise = uploadFiles("zipUploader", {
        files: [selectedFile],
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Upload timeout"));
        }, uploadTimeout);
      });

      try {
        // Race between upload and timeout
        const uploadResult = await Promise.race([
          uploadPromise,
          timeoutPromise,
        ]);

        console.log("uploadFiles completed, clearing interval");
        clearInterval(progressInterval);

        console.log("Upload result:", uploadResult);

        if (
          uploadResult &&
          Array.isArray(uploadResult) &&
          uploadResult.length > 0
        ) {
          console.log("Calling handleUploadComplete...");
          await handleUploadComplete(uploadResult as Array<{ url: string }>);
        } else {
          throw new Error("Upload failed - no result received");
        }
      } catch (uploadError) {
        console.warn(
          "Upload function failed or timed out, but checking for successful upload..."
        );
        clearInterval(progressInterval);

        console.log("Checking for latest upload...");

        // Wait a moment for the upload to be processed
        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          const response = await fetch("/api/uploads/latest");
          const data = await response.json();

          if (response.ok && data.url) {
            console.log("Found latest upload URL:", data.url);
            await handleUploadComplete([{ url: data.url }]);
          } else {
            // If no existing projects, try the recent upload endpoint
            console.log(
              "No existing projects found, trying recent upload endpoint..."
            );

            const recentResponse = await fetch("/api/uploadthing/recent");
            const recentData = await recentResponse.json();

            if (recentResponse.ok && recentData.url) {
              console.log("Found recent upload URL:", recentData.url);
              await handleUploadComplete([{ url: recentData.url }]);
            } else {
              throw new Error(
                "Upload completed but callback failed. Please try again or contact support."
              );
            }
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          throw uploadError;
        }
      }
    } catch (err) {
      console.error("Manual upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePrepare = async (projId: string = projectId) => {
    console.log("handlePrepare called with:", projId);
    try {
      setLoading(true);
      setError("");

      console.log("Making request to /api/process/prepare");
      const response = await fetch("/api/process/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: projId }),
      });

      const data = await response.json();
      console.log("Prepare API response:", response.status, data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to prepare files");
      }

      setPrepareData(data);
      setCurrentStep("preview");
      console.log("Successfully moved to preview step");
    } catch (err) {
      console.error("Prepare error:", err);
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
    setSelectedProjectId("");
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleProjectSelect = async (projectId: string) => {
    try {
      setLoading(true);
      setError("");
      setSelectedProjectId(projectId);

      // Fetch project details
      const response = await fetch(`/api/projects/${projectId}/status`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load project");
      }

      setProjectId(projectId);
      setProjectName(data.name || "");

      // Set the appropriate step based on project status
      if (data.status === "completed" && data.outputId) {
        setOutputId(data.outputId);
        setCurrentStep("completed");
      } else if (data.status === "failed") {
        setCurrentStep("upload");
      } else if (data.status === "generating") {
        setCurrentStep("generate");
      } else {
        setCurrentStep("upload");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = () => {
    handleReset();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Full Width */}
      <header className="bg-white shadow-sm border-b">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Doxiqo</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {session?.user?.name || session?.user?.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/landing" })}
              className="text-sm bg-red-500 text-white p-3 rounded-xl cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Content Area with Sidebar */}
      <div className="flex h-[calc(100vh-73px)]">
        {" "}
        {/* Subtract header height */}
        {/* Sidebar */}
        <Sidebar
          onProjectSelect={handleProjectSelect}
          onNewProject={handleNewProject}
          selectedProjectId={selectedProjectId}
        />
        {/* Main Content Area */}
        <main className="flex-1 px-6 py-8 overflow-auto bg-gray-50">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black focus:border-transparent placeholder:text-gray-400 placeholder:opacity-40"
                    disabled={isUploading}
                  />
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  isVisible={isUploading}
                  progress={uploadProgress}
                  title="Uploading your project..."
                  description="Please wait while we upload and process your ZIP file."
                  className="max-w-lg mx-auto"
                />

                {/* Upload Interface */}
                {!isUploading && (
                  <div className="w-full max-w-lg mx-auto">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="zip-upload"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="zip-upload"
                        className="cursor-pointer block"
                      >
                        <div className="text-blue-600 mb-2">
                          <svg
                            className="mx-auto h-12 w-12"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <div className="text-blue-600 font-medium">
                          Choose a ZIP file
                        </div>
                        <div className="text-gray-500 text-sm mt-1">
                          or drag and drop
                        </div>
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <svg
                              className="h-5 w-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            <span className="text-sm text-gray-700">
                              {selectedFile.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(selectedFile.size / 1024 / 1024).toFixed(2)}{" "}
                              MB)
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="text-red-500 hover:text-red-700"
                            aria-label="Remove selected file"
                          >
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>

                        <button
                          onClick={handleManualUpload}
                          disabled={!selectedFile || isUploading}
                          className="w-full mt-3 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isUploading ? "Uploading..." : "Upload Project"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
    </div>
  );
}
