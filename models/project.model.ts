import mongoose, { mongo } from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["processing", "completed"],
      default: "processing",
    },
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
    outputMd: { type: mongoose.Schema.Types.ObjectId, ref: "OutputMd" },
  },
  { timestamps: true }
);
