import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { buyStreakFreeze, getLeaderboard } from "../controllers/economyController.js";

const router = Router();

// Get leaderboard of users ranked by coins/streak
// Currently public (authMiddleware can be added if you want it protected)
router.get("/leaderboard", getLeaderboard);

// Purchase a streak freeze using Focus Coins
// Requires authentication
router.post("/buy-freeze", authMiddleware, buyStreakFreeze);

export default router;