import express from "express";
import { addCard, getDueCards, submitReview, getAllCards, deleteCard } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js"; // your existing auth middleware

const router = express.Router();

router.use(protect); // all review routes require login

router.get("/due", getDueCards);           // GET due cards + upcoming + stats
router.get("/all", getAllCards);           // GET full card library
router.post("/add", addCard);             // POST add a new card
router.post("/submit", submitReview);     // POST rate a card (1-4)
router.delete("/:id", deleteCard);        // DELETE remove a card

export default router;

// ─── Register in your app.js / server.js like: ───────────────────────────────
// import reviewRoutes from "./routes/reviewRoutes.js";
// app.use("/api/review", reviewRoutes);