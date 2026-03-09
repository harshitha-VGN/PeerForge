import ReviewCard from "../models/ReviewCard.js";

// ─── SM-2 Algorithm Core ──────────────────────────────────────────────────────
// rating: 1=Again, 2=Hard, 3=Good, 4=Easy
// Returns updated { easeFactor, interval, repetitions }
const sm2 = (card, rating) => {
  let { easeFactor, interval, repetitions } = card;

  if (rating < 2) {
    // "Again" — complete reset
    repetitions = 0;
    interval = 1;
  } else {
    // Successful recall
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);

    repetitions += 1;
  }

  // Adjust ease factor based on rating (SM-2 formula)
  easeFactor = easeFactor + (0.1 - (4 - rating) * (0.08 + (4 - rating) * 0.02));
  easeFactor = Math.max(1.3, easeFactor); // never go below 1.3

  return { easeFactor, interval, repetitions };
};

// ─── Add a card (called when user solves a problem in duel / manually) ────────
export const addCard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { problemSlug, problemTitle, difficulty, category } = req.body;

    // upsert: if card already exists don't reset progress
    const existing = await ReviewCard.findOne({ user: userId, problemSlug });
    if (existing) return res.json({ message: "Card already exists", card: existing });

    const card = await ReviewCard.create({
      user: userId,
      problemSlug,
      problemTitle,
      difficulty: difficulty || "Medium",
      category: category || "General",
      nextReviewDate: new Date(), // due immediately after first solve
    });

    res.status(201).json(card);
  } catch (err) {
    console.error("addCard error:", err);
    res.status(500).json({ message: "Failed to add card" });
  }
};

// ─── Get all due cards for today ──────────────────────────────────────────────
export const getDueCards = async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();

    const dueCards = await ReviewCard.find({
      user: userId,
      nextReviewDate: { $lte: now },
    }).sort({ nextReviewDate: 1 });

    // Also get upcoming cards (next 7 days) for the forecast
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingCards = await ReviewCard.find({
      user: userId,
      nextReviewDate: { $gt: now, $lte: in7Days },
    }).sort({ nextReviewDate: 1 });

    // Stats
    const totalCards = await ReviewCard.countDocuments({ user: userId });

    res.json({ dueCards, upcomingCards, totalCards, dueCount: dueCards.length });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cards" });
  }
};

// ─── Submit review rating for a card ─────────────────────────────────────────
export const submitReview = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { cardId, rating } = req.body; // rating: 1-4

    if (!rating || rating < 1 || rating > 4) {
      return res.status(400).json({ message: "Rating must be 1-4" });
    }

    const card = await ReviewCard.findOne({ _id: cardId, user: userId });
    if (!card) return res.status(404).json({ message: "Card not found" });

    const { easeFactor, interval, repetitions } = sm2(card, rating);

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    card.easeFactor = easeFactor;
    card.interval = interval;
    card.repetitions = repetitions;
    card.nextReviewDate = nextReviewDate;
    card.lastReviewDate = new Date();
    card.lastRating = rating;
    card.totalReviews += 1;
    card.streak = rating >= 3 ? card.streak + 1 : 0;

    await card.save();

    res.json({
      success: true,
      nextReviewDate,
      interval,
      message: interval === 1
        ? "See you tomorrow!"
        : `Next review in ${interval} days`,
    });
  } catch (err) {
    console.error("submitReview error:", err);
    res.status(500).json({ message: "Review failed" });
  }
};

// ─── Get all cards (for the full library view) ────────────────────────────────
export const getAllCards = async (req, res) => {
  try {
    const cards = await ReviewCard.find({ user: req.user.userId }).sort({ nextReviewDate: 1 });
    res.json(cards);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch library" });
  }
};

// ─── Delete a card ────────────────────────────────────────────────────────────
export const deleteCard = async (req, res) => {
  try {
    await ReviewCard.deleteOne({ _id: req.params.id, user: req.user.userId });
    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
};