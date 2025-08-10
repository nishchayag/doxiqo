import mongoose from "mongoose";

const outputMdSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    docMarkdown: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const OutputMd =
  mongoose.models.OutputMd || mongoose.model("OutputMd", outputMdSchema);

export default OutputMd;
