import Progress from "../models/Progress.js";
import User from "../models/User.js";
import ReviewCard from "../models/ReviewCard.js";
import { startOfDay, endOfDay, subDays } from "date-fns";

export const dailyCheckIn = async (req, res) => {
  try {
    const userId = req.user.userId;

    const now = new Date();

    // Calculate today's time boundaries
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Check if the user already checked in today
    const alreadyCheckedIn = await Progress.findOne({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (alreadyCheckedIn) {
      return res.status(400).json({ message: "Already checked in today!" });
    }

    const user = await User.findById(userId);

    // ── RULE 1: Check if revision queue was completed today ────────────────────
    // Completed means:
    // 1) No review cards were due today OR
    // 2) All due cards were reviewed today

    const dueCardsToday = await ReviewCard.find({
      user: userId,
      nextReviewDate: { $lte: todayEnd }
    });

    const reviewedToday =
      dueCardsToday.length === 0 ||
      dueCardsToday.every(
        card =>
          card.lastReviewDate &&
          new Date(card.lastReviewDate) >= todayStart
      );

    // ── RULE 2: Check if the user solved a duel today ──────────────────────────
    const solvedDuelToday =
      user.lastDuelSolvedAt &&
      new Date(user.lastDuelSolvedAt) >= todayStart;

    // ── GATE CONDITION ─────────────────────────────────────────────────────────
    // User must either complete revision OR solve a duel to claim streak
    if (!reviewedToday && !solvedDuelToday) {
      return res.status(403).json({
        message:
          "Complete today's revision queue OR win a duel before claiming your streak!"
      });
    }

    // ── Record today's progress ────────────────────────────────────────────────
    await Progress.create({
      user: userId,
      date: now
    });

    // Determine yesterday's boundary to continue streak
    const yesterdayStart = startOfDay(subDays(now, 1));

    const yesterdayProgress = await Progress.findOne({
      user: userId,
      date: { $gte: yesterdayStart, $lt: todayStart }
    });

    // If user checked in yesterday → increase streak
    if (yesterdayProgress) {
      user.streak = (user.streak || 0) + 1;
    } else {

      // If streak freeze exists, consume it instead of resetting streak
      if (user.hasStreakFreeze && user.streak > 0) {
        user.hasStreakFreeze = false;
        // streak remains unchanged
      } else {
        // Reset streak
        user.streak = 1;
      }
    }

    await user.save();

    res.status(200).json({
      message: `Streak claimed! 🔥 Day ${user.streak}`,
      streak: user.streak
    });

  } catch (error) {
    console.error("dailyCheckIn error:", error);

    res.status(500).json({ message: "Server error" });
  }
};