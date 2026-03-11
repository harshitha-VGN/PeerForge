import axios from 'axios';
import ReviewCard from "../models/ReviewCard.js"; // Model storing spaced-repetition review problems

export const getRevisionQueue = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch problems whose review time has arrived (or passed)
    const queue = await ReviewCard.find({
      user: userId,
      nextReviewDate: { $lte: new Date() } // due for review
    }).limit(6); // limit queue size for dashboard

    // Format response for Dashboard UI
    const formatted = queue.map(card => ({
      title: card.problemTitle,
      slug: card.problemSlug,
      difficulty: card.difficulty,
      category: card.category,
      _id: card._id
    }));

    res.json(formatted);

  } catch (error) {
    res.status(500).json({ message: "Failed to load dashboard queue" });
  }
};

export const getProblemDetails = async (req, res) => {
  try {
    const { titleSlug } = req.params;

    // GraphQL query to fetch problem details from LeetCode
    const body = {
      query: `query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) { title content difficulty }
      }`,
      variables: { titleSlug }
    };

    const response = await axios.post("https://leetcode.com/graphql", body, {
      headers: {
        "Content-Type": "application/json",
        "Referer": "https://leetcode.com" // required for LeetCode API access
      }
    });

    const q = response.data.data.question;

    // Send cleaned response to frontend
    res.json({
      questionTitle: q.title,
      difficulty: q.difficulty,
      question: q.content
    });

  } catch (error) {
    res.status(500).json({ message: "Error fetching LeetCode data" });
  }
};