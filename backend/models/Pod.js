import mongoose from "mongoose";

// Schema for individual chat messages inside a pod
const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // user who sent the message
  senderEmail: { type: String }, // cached email for display
  content: { type: String, required: true }, // message text
  createdAt: { type: Date, default: Date.now }, // message timestamp
});

const PodSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, // project/team title
  idea: { type: String, required: true }, // description of the project idea
  techStack: [{ type: String }], // technologies used in the project
  maxMembers: { type: Number, default: 4 }, // maximum allowed members

  // Creator of the pod
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  creatorEmail: { type: String }, // cached email for convenience

  // Current members of the pod
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Users requesting to join the pod
  pendingRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String,
    message: String, // optional message from requester
    requestedAt: { type: Date, default: Date.now },
  }],

  // Users who were rejected + reason for rejection
  rejectedUsers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String,
    reason: String,
    rejectedAt: { type: Date, default: Date.now },
  }],

  // Members requesting to leave the pod
  leaveRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String,
    requestedAt: { type: Date, default: Date.now },
  }],

  // Embedded chat messages within the pod
  messages: [MessageSchema],

  // Current status of the pod
  status: { type: String, enum: ["OPEN", "FULL", "CLOSED"], default: "OPEN" },

  // Tags used for filtering/searching pods
  tags: [{ type: String }],

  // Project link added when pod is completed/closed
  projectLink: { type: String, default: "" },

  // Pod closure metadata
  closedAt: { type: Date },
  closedByEmail: { type: String },

  // Tracks last activity for sorting active pods
  lastActivityAt: { type: Date, default: Date.now },

}, { timestamps: true }); // adds createdAt and updatedAt

export default mongoose.model("Pod", PodSchema);