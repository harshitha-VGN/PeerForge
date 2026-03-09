import { Router } from "express";
import { getRevisionQueue, getProblemDetails } from "../controllers/problemController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

// Dashboard calls this to see what to revise today
router.get("/", authMiddleware, getRevisionQueue);

// Workspace calls this to see the description
router.get("/:titleSlug", authMiddleware, getProblemDetails);

export default router;