import User from "../models/User.js";

// Helper function (not a route)
export const awardCoins = async (userId, amount) => {
  try {
    await User.findByIdAndUpdate(userId, { $inc: { focusCoins: amount } });
  } catch (error) {
    console.error("Error awarding coins:", error);
  }
};

// Route: POST /api/economy/buy-freeze
export const buyStreakFreeze = async (req, res) => {
  try {
    const COST = 50;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.focusCoins < COST)
      return res.status(400).json({ message: "Not enough Focus Coins (Need 50)" });

    user.focusCoins -= COST;
    user.hasStreakFreeze = true;
    await user.save();

    res.status(200).json({
      message: "Streak Freeze purchased successfully!",
      focusCoins: user.focusCoins,
    });
  } catch (error) {
    res.status(500).json({ message: "Transaction failed" });
  }
};

// Route: GET /api/economy/leaderboard
// Sorted by: focusCoins (primary), then streak (tiebreaker)
export const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find()
      .select("email streak focusCoins duelWins xp")
      .sort({ focusCoins: -1, streak: -1 })  // coins first, streak as tiebreaker
      .limit(50);

    res.status(200).json(topUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};