import Duel from "../models/Duel.js";
import User from "../models/User.js";
import axios from "axios";
import ReviewCard from "../models/ReviewCard.js";

// LeetCode GraphQL endpoint
const LC_URL = "https://leetcode.com/graphql";

// Headers required because LeetCode blocks non-browser requests
const LC_HEADERS = {
  "Content-Type": "application/json",
  "Referer": "https://leetcode.com",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Origin": "https://leetcode.com",
};

// UI category → LeetCode tag mapping
const TAG_MAP = {
  "Arrays": "array", "Strings": "string", "DP": "dynamic-programming",
  "Graphs": "graph", "Stack": "stack", "Sliding Window": "sliding-window",
  "Bit Manipulation": "bit-manipulation", "Backtracking": "backtracking",
  "Binary Search": "binary-search", "Trees": "tree"
};

// Check if a user is already in an active duel
const isUserInMatch = async (userId, currentRoomId = null) => {
  return await Duel.findOne({
    participants: userId,
    roomId: { $ne: currentRoomId }, // ignore current room
    status: { $in: ["WAITING", "REQUESTED", "ONGOING"] },
    results: { $not: { $elemMatch: { user: userId } } },
    abandonedBy: { $ne: userId }
  });
};

// Award rewards to the duel winner
const awardWinner = async (winningUserId, winnerEmail, duel) => {
  duel.winner = winnerEmail;
  duel.status = "COMPLETED";

  // Increment coins, XP and win count
  await User.findByIdAndUpdate(winningUserId, {
    $inc: { focusCoins: 50, xp: 100, duelWins: 1 }
  });
};

// ── Fetch real LeetCode problem ─────────────────────────────────
const fetchLeetCodeProblem = async (tag) => {

  // GraphQL query for problem list
  const body = {
    query: `query problemsetQuestionList($filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: ""
        limit: 50
        skip: 0
        filters: $filters
      ) {
        questions: data {
          title
          titleSlug
          difficulty
          paidOnly: isPaidOnly
        }
      }
    }`,
    variables: { filters: tag ? { tags: [tag] } : {} }
  };

  const response = await axios.post(LC_URL, body, {
    headers: LC_HEADERS,
    timeout: 10000
  });

  // Remove paid-only problems
  const questions = response.data?.data?.problemsetQuestionList?.questions
    ?.filter(q => !q.paidOnly) || [];

  if (questions.length === 0) throw new Error("No problems returned from LeetCode");

  // Return a random problem
  return questions[Math.floor(Math.random() * questions.length)];
};

export const createDuel = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Prevent user from joining multiple duels simultaneously
    const busy = await isUserInMatch(userId);
    if (busy) return res.status(400).json({ message: "Finish your other match first!", roomId: busy.roomId });

    const currentUser = await User.findById(userId);

    const { category } = req.body;

    const tag = TAG_MAP[category] || "";

    // Generate unique room id
    const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;

    let picked;

    try {
      picked = await fetchLeetCodeProblem(tag);
    } catch (e) {
      console.error("LeetCode API failed:", e.message);
      return res.status(503).json({ 
        message: "Could not fetch problem from LeetCode. Please try again in a moment." 
      });
    }

    const newDuel = await Duel.create({
      roomId,
      creator: userId,
      creatorEmail: currentUser.email,
      participants: [userId],
      problemTitle: picked.title,
      problemSlug: picked.titleSlug,
      difficulty: picked.difficulty,
      category: category || "Random",
      status: "WAITING",
      locked: false,
    });

    res.status(201).json(newDuel);

  } catch (error) {
    console.error("createDuel error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lobby: show waiting rooms and ongoing rooms the user is part of
export const getAvailableDuels = async (req, res) => {
  try {
    const userId = req.user.userId;

    const duels = await Duel.find({
      $or: [
        {
          status: { $in: ["WAITING", "REQUESTED"] },
          locked: false,
          hiddenFor: { $ne: userId }
        },
        {
          status: "ONGOING",
          participants: userId,
          hiddenFor: { $ne: userId }
        }
      ]
    })
      .populate("creator", "email")
      .sort({ createdAt: -1 });

    res.json(duels);

  } catch (e) {
    res.status(500).json({ message: "Lobby error" });
  }
};

export const requestToJoin = async (req, res) => {
  try {
    const userId = req.user.userId;

    const duel = await Duel.findOne({ roomId: req.params.roomId });

    if (!duel) return res.status(404).json({ message: "Duel not found" });

    if (duel.locked)
      return res.status(400).json({ message: "This duel is locked — no new players can join." });

    if (duel.status !== "WAITING")
      return res.status(400).json({ message: "Room is not available" });

    if (duel.participants.length >= 2)
      return res.status(400).json({ message: "Room is full" });

    duel.pendingOpponent = userId;
    duel.status = "REQUESTED";

    await duel.save();

    res.json({ message: "Requested" });

  } catch (error) {
    res.status(500).json({ message: "Request failed" });
  }
};

export const acceptOpponent = async (req, res) => {
  try {

    const duel = await Duel.findOne({ roomId: req.params.roomId });

    if (!duel || !duel.pendingOpponent)
      return res.status(400).json({ message: "No challenger" });

    duel.participants.push(duel.pendingOpponent);

    duel.pendingOpponent = null;

    duel.status = "ONGOING";

    duel.startTime = new Date();

    duel.locked = true;

    await duel.save();

    res.json({ message: "Match Started" });

  } catch (error) {
    res.status(500).json({ message: "Accept failed" });
  }
};

export const rejectOpponent = async (req, res) => {
  try {

    const duel = await Duel.findOne({ roomId: req.params.roomId });

    if (!duel) return res.status(404).json({ message: "Not found" });

    duel.pendingOpponent = null;

    duel.status = "WAITING";

    await duel.save();

    res.json({ message: "Rejected" });

  } catch (error) {
    res.status(500).json({ message: "Reject failed" });
  }
};

export const getDuelStatus = async (req, res) => {
  try {

    const duel = await Duel.findOne({ roomId: req.params.roomId })
      .populate("creator", "email")
      .populate("pendingOpponent", "email streak focusCoins currentStatus dsaLevel techStack")
      .populate("participants", "email leetcodeUsername")
      .populate("results.user", "email");

    if (!duel) return res.status(404).json({ message: "Not found" });

    const data = duel.toObject();

    data.creatorId = (duel.creator?._id || duel.creator).toString();

    if (!data.creatorEmail && duel.creator)
      data.creatorEmail = duel.creator.email;

    res.json(data);

  } catch (error) {
    res.status(500).json({ message: "Sync error" });
  }
};

export const verifyAndFinalize = async (req, res) => {
  try {

    const { leetcodeUsername, roomId } = req.body;

    const userId = req.user.userId;

    const currentUser = await User.findById(userId); // fetch email from DB

    const duel = await Duel.findOne({ roomId });

    if (!duel) return res.status(404).json({ message: "Duel not found" });

    // Fetch recent accepted submissions from LeetCode
    const response = await axios.post(LC_URL, {
      query: `query recentAcSubmissions($username: String!) { 
        recentAcSubmissionList(username: $username, limit: 10) { 
          titleSlug timestamp 
        } 
      }`,
      variables: { username: leetcodeUsername }
    }, { headers: LC_HEADERS });

    const submissions = response.data?.data?.recentAcSubmissionList || [];

    // Allow 5-minute tolerance window
    const duelStartUnix = Math.floor(new Date(duel.startTime).getTime() / 1000) - 300;

    const validSolve = submissions.find(s =>
      s.titleSlug === duel.problemSlug && parseInt(s.timestamp) >= duelStartUnix
    );

    if (!validSolve)
      return res.status(400).json({ message: "Solve not found on LeetCode." });

    const timeTaken = Math.max(1, Math.round(
      (parseInt(validSolve.timestamp) - (duelStartUnix + 300)) / 60
    ));

    // Add result if user hasn't already submitted
    if (!duel.results.some(r => r.user?.toString() === userId)) {
      duel.results.push({
        user: userId,
        email: currentUser.email,
        timeTaken
      });
    }

    const opponentId = duel.participants.find(p => p.toString() !== userId);

    const opponentAbandoned =
      duel.abandonedBy.some(a => a.toString() === opponentId?.toString());

    if (duel.results.length === 2 || opponentAbandoned) {

      if (opponentAbandoned && duel.results.length === 1) {
        await awardWinner(userId, currentUser.email, duel);
      } else {

        const [p1, p2] = duel.results;

        const winnerId =
          p1.timeTaken <= p2.timeTaken ? p1.user : p2.user;

        const winnerEmail =
          p1.timeTaken <= p2.timeTaken ? p1.email : p2.email;

        await awardWinner(winnerId, winnerEmail, duel);
      }

      duel.status = "COMPLETED";

      // Hide duel from participants once completed
      for (const p of duel.participants) {
        if (!duel.hiddenFor.map(h => h.toString()).includes(p.toString())) {
          duel.hiddenFor.push(p);
        }
      }
    }

    await duel.save();

    // Add solved problem to revision queue
    try {

      const existing = await ReviewCard.findOne({
        user: userId,
        problemSlug: duel.problemSlug
      });

      if (!existing) {
        await ReviewCard.create({
          user: userId,
          problemSlug: duel.problemSlug,
          problemTitle: duel.problemTitle,
          difficulty: duel.difficulty,
          category: duel.category,
          nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      }

    } catch (cardErr) {
      console.warn("Review card init failed");
    }

    // Mark solve time for streak tracking
    await User.findByIdAndUpdate(userId, {
      lastDuelSolvedAt: new Date()
    });

    res.json({
      success: true,
      timeTaken,
      message: "Verified! Score awarded and added to Revision Queue."
    });

  } catch (error) {
    console.error("verifyAndFinalize error:", error);
    res.status(500).json({ message: "Referee error" });
  }
};