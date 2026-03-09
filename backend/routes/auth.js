import { Router } from "express";
import { signup,login } from "../controllers/authController.js";
import {authMiddleware} from "../middleware/authMiddleware.js";
import User from "../models/User.js";


const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId);
  res.json(user);
});
router.put("/update-leetcode", authMiddleware, async (req, res) => {
  try {
    const { leetcodeUsername } = req.body;
    await User.findByIdAndUpdate(req.user.userId, { leetcodeUsername });
    res.json({ message: "LeetCode handle updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

export default router;
