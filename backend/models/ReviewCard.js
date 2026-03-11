import mongoose from "mongoose";

// SM-2 Spaced Repetition Card
// Each document represents one user's review state for a specific problem
const ReviewCardSchema = new mongoose.Schema({
  // Reference to the user who owns this review card
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Problem information (snapshot from LeetCode or duel at time of creation)
  problemSlug: { type: String, required: true },
  problemTitle: { type: String, required: true },

  // Problem difficulty and category metadata
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium"
  },
  category: { type: String, default: "General" },

  // ── SM-2 Algorithm Fields ─────────────────────────────
  easeFactor: { type: Number, default: 2.5 }, // controls how fast intervals grow (minimum 1.3)
  interval: { type: Number, default: 1 }, // number of days until next review
  repetitions: { type: Number, default: 0 }, // consecutive successful reviews

  // Scheduling metadata
  nextReviewDate: { type: Date, default: Date.now },
  lastReviewDate: { type: Date, default: null },

  // Last user rating of recall quality
  // 1=Again, 2=Hard, 3=Good, 4=Easy
  lastRating: { type: Number, default: null },

  // Review statistics
  totalReviews: { type: Number, default: 0 },
  streak: { type: Number, default: 0 }, // consecutive Good/Easy reviews

}, { timestamps: true }); // adds createdAt and updatedAt

// Ensure a user can only have one card per problem
ReviewCardSchema.index({ user: 1, problemSlug: 1 }, { unique: true });

export default mongoose.model("ReviewCard", ReviewCardSchema);