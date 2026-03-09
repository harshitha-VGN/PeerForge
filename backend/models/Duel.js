import mongoose from "mongoose";

const duelSchema = new mongoose.Schema({
  // Add these fields to your duelSchema
  abandonedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who clicked 'Quit'
  roomId: { type: String, required: true, unique: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  creatorEmail: String,
  pendingOpponent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  problemTitle: String,
  problemSlug: String,
  difficulty: String,
  category: String,
  startTime: Date,
  status: { 
    type: String, 
    enum: ["WAITING", "REQUESTED", "ONGOING", "COMPLETED"], 
    default: "WAITING" 
  },
  results: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    email: String,
    timeTaken: Number
  }],
  winner: String
}, { timestamps: true });

export default mongoose.model("Duel", duelSchema);