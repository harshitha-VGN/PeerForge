import User from "../models/User.js";

// Helper function to add Focus Coins to a user
// This is a utility function and not an API route
export const awardCoins = async (userId, amount) => {
  try {
    // $inc performs an atomic increment in MongoDB
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

    if (!user) 
      return res.status(404).json({ message: "User not found" });

    // Ensure user has enough coins to purchase the streak freeze
    if (user.focusCoins < COST)
      return res.status(400).json({ message: "Not enough Focus Coins (Need 50)" });

    // Deduct coins and grant streak freeze ability
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
// Sorted primarily by focusCoins, with streak as tie-breaker
export const getLeaderboard = async (req, res) => {
  try {

    const topUsers = await User.find()
      .select("email streak focusCoins duelWins xp") // limit fields returned to client
      .sort({ focusCoins: -1, streak: -1 })          // highest coins first, then streak
      .limit(50);                                     // top 50 leaderboard

    res.status(200).json(topUsers);

  } catch (error) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};