import mongoose from "mongoose";

const problemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
  category: { type: String, required: true }, // e.g., "Arrays", "Trees"
  link: String
});

export default mongoose.model("Problem", problemSchema);