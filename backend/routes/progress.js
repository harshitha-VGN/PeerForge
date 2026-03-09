import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { dailyCheckIn } from "../controllers/progressController.js";

const router = Router();

// Only keep the daily streak logic here
router.post("/checkin", authMiddleware, dailyCheckIn);

export default router;