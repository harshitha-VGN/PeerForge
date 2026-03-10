import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderEmail: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const PodSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  idea: { type: String, required: true },
  techStack: [{ type: String }],
  maxMembers: { type: Number, default: 4 },

  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  creatorEmail: { type: String },

  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  pendingRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String,
    message: String,
    requestedAt: { type: Date, default: Date.now },
  }],

  // Tracks rejected users + reason so they see a notification
  rejectedUsers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String,
    reason: String,
    rejectedAt: { type: Date, default: Date.now },
  }],

  leaveRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String,
    requestedAt: { type: Date, default: Date.now },
  }],

  messages: [MessageSchema],

  status: { type: String, enum: ["OPEN", "FULL", "CLOSED"], default: "OPEN" },
  tags: [{ type: String }],

  projectLink: { type: String, default: "" },
  closedAt: { type: Date },
  closedByEmail: { type: String },
  lastActivityAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model("Pod", PodSchema);