import Progress from "../models/Progress.js";
import User from "../models/User.js";
import { startOfDay, endOfDay, subDays, isSameDay } from "date-fns";

export const dailyCheckIn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // 1. Find or create today's progress record
    let progress = await Progress.findOne({
      user: userId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (!progress) {
      progress = await Progress.create({ user: userId, date: new Date() });
      
      // 2. Update Streak Logic
      const user = await User.findById(userId);
      const yesterdayStart = startOfDay(subDays(new Date(), 1));
      const lastProgress = await Progress.findOne({
        user: userId,
        date: { $gte: yesterdayStart, $lt: todayStart }
      });

      if (lastProgress) {
        user.streak = (user.streak || 0) + 1;
      } else {
        user.streak = 1; // Reset streak if yesterday was missed
      }
      await user.save();
    }

    res.status(200).json({ message: "Check-in successful", progress });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};