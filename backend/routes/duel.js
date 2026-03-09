import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { 
  createDuel, getAvailableDuels, requestToJoin, 
  acceptOpponent, rejectOpponent, getDuelStatus, 
  verifyAndFinalize, endDuel,getMyStats 
} from "../controllers/duelController.js";

const router = Router();

router.get("/lobby", authMiddleware, getAvailableDuels);
router.post("/create", authMiddleware, createDuel);
router.post("/request/:roomId", authMiddleware, requestToJoin);
router.post("/accept/:roomId", authMiddleware, acceptOpponent);
router.post("/reject/:roomId", authMiddleware, rejectOpponent);
router.get("/status/:roomId", authMiddleware, getDuelStatus);
router.post("/verify", authMiddleware, verifyAndFinalize);
router.post("/end/:roomId", authMiddleware, endDuel);
router.get("/mystats", getMyStats);

export default router;