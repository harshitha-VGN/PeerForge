import mongoose from "mongoose";

const duelSchema = new mongoose.Schema(
  {
    // Unique identifier for the duel room
    roomId: { type: String, required: true, unique: true },

    // User who created the duel
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    creatorEmail: String,

    // User who sent a join request (before being accepted)
    pendingOpponent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Both players once the match starts (ONGOING)
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // LeetCode problem information for the duel
    problemTitle: String,
    problemSlug: String,
    difficulty: String,
    category: String,
    startTime: Date,

    // Current duel state
    status: {
      type: String,
      enum: ["WAITING", "REQUESTED", "ONGOING", "COMPLETED"],
      default: "WAITING",
    },

    // Results submitted by players after solving the problem
    results: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        email: String,
        timeTaken: Number, // time taken to solve in minutes
      },
    ],

    // Email of the winning user
    winner: String,

    // Users who explicitly quit or abandoned the duel
    abandonedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Users for whom this duel should be hidden in the lobby/history
    hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Lock flag: once true, no new players can join the duel
    // Typically set when duel becomes ONGOING or COMPLETED
    locked: { type: Boolean, default: false },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

export default mongoose.model("Duel", duelSchema);