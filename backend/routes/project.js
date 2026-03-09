import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { createProjectProfile, findMatches } from "../controllers/projectController.js";

const router = Router();
router.use(authMiddleware);

router.post("/profile", createProjectProfile);
router.get("/matches", findMatches);

export default router;