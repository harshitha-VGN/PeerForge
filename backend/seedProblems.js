import mongoose from "mongoose";
import dotenv from "dotenv";
import Problem from "./models/Problem.js";

dotenv.config();

const problems = [
  { title: "Two Sum", difficulty: "Easy", category: "Arrays", link: "https://leetcode.com/problems/two-sum/" },
  { title: "Reverse Linked List", difficulty: "Easy", category: "Linked List", link: "https://leetcode.com/problems/reverse-linked-list/" },
  { title: "Longest Substring Without Repeating Characters", difficulty: "Medium", category: "Sliding Window", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
  { title: "Container With Most Water", difficulty: "Medium", category: "Two Pointers", link: "https://leetcode.com/problems/container-with-most-water/" },
  { title: "Merge Intervals", difficulty: "Medium", category: "Arrays", link: "https://leetcode.com/problems/merge-intervals/" },
  { title: "Median of Two Sorted Arrays", difficulty: "Hard", category: "Binary Search", link: "https://leetcode.com/problems/median-of-two-sorted-arrays/" }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Problem.deleteMany(); // Clear existing
    await Problem.insertMany(problems);
    console.log("DSA Problems Seeded!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();