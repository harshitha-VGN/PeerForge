import mongoose from "mongoose";

const verificationJobSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    leetcodeUsername: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "NOT_FOUND"],
      default: "PENDING",
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 10 },
    lastError: { type: String, default: null },
    nextRetryAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

verificationJobSchema.index({ roomId: 1, userId: 1 }, { unique: true });
verificationJobSchema.index({ status: 1, nextRetryAt: 1 });

export default mongoose.model("VerificationJob", verificationJobSchema);
