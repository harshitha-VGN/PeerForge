import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
  // Title of the coding problem
  title: { type: String, required: true },

  // Difficulty level (restricted to predefined values)
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    required: true
  },

  // Problem category or topic (e.g., Arrays, Trees, Graphs)
  category: { type: String, required: true },

  // Optional link to the problem (e.g., LeetCode URL)
  link: String
});

export default mongoose.model("Problem", problemSchema);