import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    originalZipUrl: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "processing",
        "completed",
        "failed",
        "cancelled",
        "generating",
        "uploading",
        "prepared",
      ],
      default: "uploading",
    },
    outputMd: { type: mongoose.Schema.Types.ObjectId, ref: "OutputMd" },
    preparedSummary: {
      type: String,
      default: "",
      trim: true,
    },
    generationMeta: {
      model: String,
      promptTokens: Number,
      completionTokens: Number,
      durationMs: Number,
    },
    errorFields: [
      {
        field: { type: String, required: true },
        error: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Project =
  mongoose.models.Project || mongoose.model("Project", projectSchema);

export default Project;
