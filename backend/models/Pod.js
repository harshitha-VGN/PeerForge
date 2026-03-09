import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderEmail: { type: String },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const PodSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  idea: { type: String, required: true },           // project description
  techStack: [{ type: String }],                    // ["React", "Node.js", ...]
  maxMembers: { type: Number, default: 4 },

  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  creatorEmail: { type: String },

  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  pendingRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String,
    message: String,   // optional intro message from requester
    requestedAt: { type: Date, default: Date.now },
  }],

  messages: [MessageSchema],

  status: { type: String, enum: ["OPEN", "FULL", "CLOSED"], default: "OPEN" },
  tags: [{ type: String }],   // e.g. ["open-source", "hackathon", "beginner-friendly"]
}, { timestamps: true });

export default mongoose.model("Pod", PodSchema);