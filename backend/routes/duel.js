import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import { 
  createDuel,
  getAvailableDuels,
  requestToJoin,
  acceptOpponent,
  rejectOpponent,
  getDuelStatus,
  verifyAndFinalize,
  endDuel,
  getMyStats
} from "../controllers/duelController.js";

const router = Router();

// Fetch available duels in the lobby
router.get("/lobby", authMiddleware, getAvailableDuels);

// Create a new duel room
router.post("/create", authMiddleware, createDuel);

// Request to join an existing duel room
router.post("/request/:roomId", authMiddleware, requestToJoin);

// Creator accepts opponent's request
router.post("/accept/:roomId", authMiddleware, acceptOpponent);

// Creator rejects opponent's request
router.post("/reject/:roomId", authMiddleware, rejectOpponent);

// Get current duel state (participants, problem, results, etc.)
router.get("/status/:roomId", authMiddleware, getDuelStatus);

// Verify user's LeetCode submission and finalize duel result
router.post("/verify", authMiddleware, verifyAndFinalize);

// End or exit a duel
router.post("/end/:roomId", authMiddleware, endDuel);

// Fetch statistics for the logged-in user
router.get("/mystats", authMiddleware, getMyStats);

export default router;