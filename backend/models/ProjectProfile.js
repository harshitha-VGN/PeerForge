import mongoose from "mongoose";

const projectProfileSchema = new mongoose.Schema({
  // Reference to the user who owns this project profile (one profile per user)
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },

  // Name of the project the user wants to build
  projectName: { type: String, required: true },

  // Short description of the project idea
  description: { type: String, required: true },

  // Technologies used or required for the project
  techStack: [{ type: String }], // e.g., ["React", "Node", "MongoDB"]

  // Optional GitHub repository link
  githubRepo: String,

  // Current development stage of the project
  status: {
    type: String,
    enum: ["IDEATING", "BUILDING", "POLISHING"],
    default: "IDEATING"
  },

  // Whether the user is actively searching for collaborators
  isSearching: { type: Boolean, default: true }

}, { timestamps: true }); // Adds createdAt and updatedAt fields automatically

export default mongoose.model("ProjectProfile", projectProfileSchema);