import mongoose from "mongoose";

const duelSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true },

    creator: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    creatorEmail: String,

    // User who sent a join request (before accepted)
    pendingOpponent: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Both players once match is ONGOING
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    problemTitle: String,
    problemSlug: String,
    difficulty: String,
    category: String,
    startTime: Date,

    status: {
      type: String,
      enum: ["WAITING", "REQUESTED", "ONGOING", "COMPLETED"],
      default: "WAITING",
    },

    results: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        email: String,
        timeTaken: Number,
      },
    ],

    winner: String,

    // Users who explicitly quit/left the duel
    abandonedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ── NEW: per-user visibility control ─────────────────────────────────────
    // Once a user is in this array, the duel is hidden from their lobby/list
    hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // ── NEW: Lock flag — once true, no new players can ever join ─────────────
    // Set to true when match goes ONGOING (or is COMPLETED)
    locked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Duel", duelSchema);