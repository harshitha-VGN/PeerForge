import User from "../models/User.js";

// Helper function to add Focus Coins to a user
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
    const userId = req.user.userId;

    // Atomic deduction and freeze grant with conditional check
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, focusCoins: { $gte: COST } },
      {
        $inc: { focusCoins: -COST },
        $set: { hasStreakFreeze: true }
      },
      { new: true }
    );

    if (!updatedUser) {
      const userExists = await User.findById(userId);
      if (!userExists) return res.status(404).json({ message: "User not found" });
      return res.status(400).json({ message: "Not enough Focus Coins (Need 50)" });
    }

    res.status(200).json({
      message: "Streak Freeze purchased successfully!",
      focusCoins: updatedUser.focusCoins,
      hasStreakFreeze: updatedUser.hasStreakFreeze,
    });

  } catch (error) {
    console.error("buyStreakFreeze error:", error);
    res.status(500).json({ message: "Transaction failed" });
  }
};

// Route: GET /api/economy/leaderboard
export const getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find()
      .select("email streak focusCoins duelWins xp")
      .sort({ focusCoins: -1, streak: -1 })
      .limit(50);

    res.status(200).json(topUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};