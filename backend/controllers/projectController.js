import ProjectProfile from "../models/ProjectProfile.js";

export const createProjectProfile = async (req, res) => {
  try {

    // Create or update the user's project profile
    // upsert:true → create if it doesn't exist
    // new:true → return the updated/created document
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

    // Fetch current user's project profile
    const myProfile = await ProjectProfile.findOne({ user: req.user.userId });

    if (!myProfile)
      return res.status(404).json({ message: "Create a profile first" });

    // Find other users searching for projects
    // Match based on overlapping tech stack
    const matches = await ProjectProfile.find({
      user: { $ne: req.user.userId }, // exclude current user
      isSearching: true,
      techStack: { $in: myProfile.techStack } // at least one common tech
    }).populate("user", "email streak"); // include basic user info

    res.status(200).json(matches);

  } catch (error) {
    res.status(500).json({ message: "Matching failed" });
  }
};