import mongoose from "mongoose";

// SM-2 Spaced Repetition Card
// Each document = one user's relationship with one problem
const ReviewCardSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Problem info (snapshot from LeetCode / duel)
  problemSlug: { type: String, required: true },
  problemTitle: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  category: { type: String, default: "General" },

  // SM-2 fields
  easeFactor: { type: Number, default: 2.5 },      // min 1.3
  interval: { type: Number, default: 1 },           // days until next review
  repetitions: { type: Number, default: 0 },        // consecutive successful reviews
  nextReviewDate: { type: Date, default: Date.now },
  lastReviewDate: { type: Date, default: null },
  lastRating: { type: Number, default: null },       // 1=Again 2=Hard 3=Good 4=Easy

  // Stats
  totalReviews: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },             // current streak of Good/Easy ratings
}, { timestamps: true });

// Ensure one card per user per problem
ReviewCardSchema.index({ user: 1, problemSlug: 1 }, { unique: true });

export default mongoose.model("ReviewCard", ReviewCardSchema);