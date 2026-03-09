import mongoose from "mongoose";

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  problemsSolved: [{ type: mongoose.Schema.Types.ObjectId, ref: "Problem" }],
  minutesSpent: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Progress", progressSchema);