import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { buyStreakFreeze, getLeaderboard } from "../controllers/economyController.js";

const router = Router();

// Leaderboard is public, but you can add authMiddleware if you want it private
router.get("/leaderboard", getLeaderboard);

// Buying a freeze requires being logged in
router.post("/buy-freeze", authMiddleware, buyStreakFreeze);

export default router;