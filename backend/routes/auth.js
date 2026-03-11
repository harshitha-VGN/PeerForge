import { Router } from "express";
import { signup, login } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = Router();

// Authentication routes
router.post("/signup", signup);
router.post("/login", login);

// Get currently authenticated user's data
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId);
  res.json(user);
});

// Update LeetCode username
router.put("/update-leetcode", authMiddleware, async (req, res) => {
  try {
    const { leetcodeUsername } = req.body;

    await User.findByIdAndUpdate(req.user.userId, { leetcodeUsername });

    res.json({ message: "LeetCode handle updated successfully!" });

  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
});

// ── Update full extended user profile ────────────────────────────────────────
router.put("/update-profile", authMiddleware, async (req, res) => {
  try {
    const {
      displayName,
      currentStatus,
      techStack,
      dsaLevel,
      codingExperienceYears,
      bio,
      projects,
      githubUrl,
      linkedinUrl,
      portfolioUrl,
      leetcodeUsername,
    } = req.body;

    // Build update object dynamically (only update provided fields)
    const update = {};

    if (displayName !== undefined) update.displayName = displayName;
    if (currentStatus !== undefined) update.currentStatus = currentStatus;
    if (techStack !== undefined) update.techStack = techStack;
    if (dsaLevel !== undefined) update.dsaLevel = dsaLevel;
    if (codingExperienceYears !== undefined)
      update.codingExperienceYears = codingExperienceYears;
    if (bio !== undefined) update.bio = bio;
    if (projects !== undefined) update.projects = projects;
    if (githubUrl !== undefined) update.githubUrl = githubUrl;
    if (linkedinUrl !== undefined) update.linkedinUrl = linkedinUrl;
    if (portfolioUrl !== undefined) update.portfolioUrl = portfolioUrl;
    if (leetcodeUsername !== undefined) update.leetcodeUsername = leetcodeUsername;

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: update }, // apply only the fields provided
      { new: true }     // return updated document
    );

    res.json({ message: "Profile updated!", user: updated });

  } catch (error) {
    res.status(500).json({ message: "Profile update failed" });
  }
});

// ── Get a user's public profile by ID ─────────────────────────────────────────
router.get("/profile/:userId", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select(
      "-password -email" // exclude sensitive fields
    );

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);

  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

export default router;