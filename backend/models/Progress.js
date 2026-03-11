import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  // Reference to the user whose daily progress is being tracked
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Date of the progress entry (defaults to current date)
  date: { type: Date, default: Date.now },

  // List of problems solved by the user on that day
  problemsSolved: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],

  // Total time spent coding/studying (in minutes)
  minutesSpent: { type: Number, default: 0 }

}, { timestamps: true }); // Automatically adds createdAt and updatedAt

export default mongoose.model("Progress", progressSchema);