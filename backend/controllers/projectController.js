import ProjectProfile from "../models/ProjectProfile.js";

export const createProjectProfile = async (req, res) => {
  try {
    const profile = await ProjectProfile.findOneAndUpdate(
      { user: req.user.userId },
      { ...req.body, user: req.user.userId },
      { upsert: true, new: true }
    );
    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error saving profile" });
  }
};

export const findMatches = async (req, res) => {
  try {
    const myProfile = await ProjectProfile.findOne({ user: req.user.userId });
    if (!myProfile) return res.status(404).json({ message: "Create a profile first" });

    // Find profiles that share at least one tech stack tag, excluding self
    const matches = await ProjectProfile.find({
      user: { $ne: req.user.userId },
      isSearching: true,
      techStack: { $in: myProfile.techStack }
    }).populate("user", "email streak");

    res.status(200).json(matches);
  } catch (error) {
    res.status(500).json({ message: "Matching failed" });
  }
};