import mongoose from "mongoose";

const projectProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  projectName: { type: String, required: true },
  description: { type: String, required: true },
  techStack: [{ type: String }], // e.g., ["React", "Node", "MongoDB"]
  githubRepo: String,
  status: { type: String, enum: ["IDEATING", "BUILDING", "POLISHING"], default: "IDEATING" },
  isSearching: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("ProjectProfile", projectProfileSchema);