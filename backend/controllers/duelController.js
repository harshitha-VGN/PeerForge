import Duel from "../models/Duel.js";
import User from "../models/User.js";
import axios from "axios";
import ReviewCard from "../models/ReviewCard.js";
import { getIO } from "../socket.js";

const LC_URL = "https://leetcode.com/graphql";
const LC_HEADERS = {
  "Content-Type": "application/json",
  "Referer": "https://leetcode.com",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Origin": "https://leetcode.com",
};

const TAG_MAP = {
  "Arrays": "array", "Strings": "string", "DP": "dynamic-programming",
  "Graphs": "graph", "Stack": "stack", "Sliding Window": "sliding-window",
  "Bit Manipulation": "bit-manipulation", "Backtracking": "backtracking",
  "Binary Search": "binary-search", "Trees": "tree"
};

const isUserInMatch = async (userId, currentRoomId = null) => {
  return await Duel.findOne({
    participants: userId,
    roomId: { $ne: currentRoomId },
    status: { $in: ["WAITING", "REQUESTED", "ONGOING"] },
    results: { $not: { $elemMatch: { user: userId } } },
    abandonedBy: { $ne: userId }
  });
};

const awardWinner = async (winningUserId, winnerEmail, duelDoc) => {
  duelDoc.winner = winnerEmail;
  duelDoc.status = "COMPLETED";
  await User.findByIdAndUpdate(winningUserId, {
    $inc: { focusCoins: 50, xp: 100, duelWins: 1 }
  });
};

// ── Fetch real LeetCode problem (no fallback) ─────────────────────────────────
const fetchLeetCodeProblem = async (tag) => {
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

  const questions = response.data?.data?.problemsetQuestionList?.questions
    ?.filter(q => !q.paidOnly) || [];

  if (questions.length === 0) throw new Error("No problems returned from LeetCode");

  return questions[Math.floor(Math.random() * questions.length)];
};

export const createDuel = async (req, res) => {
  try {
    const userId = req.user.userId;
    const busy = await isUserInMatch(userId);
    if (busy) return res.status(400).json({ message: "Finish your other match first!", roomId: busy.roomId });

    const currentUser = await User.findById(userId);
    const { category } = req.body;
    const tag = TAG_MAP[category] || "";
    const roomId = `room-${Math.random().toString(36).substring(2, 11)}`;

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

    try {
      getIO().to("lobby").emit("duel_created", newDuel);
    } catch (e) {
      console.warn("Socket broadcast error:", e.message);
    }

    res.status(201).json(newDuel);
  } catch (error) {
    console.error("createDuel error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Lobby: show WAITING/REQUESTED rooms + ONGOING rooms the user is IN
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
    const { roomId } = req.params;

    // Atomic update: only set pendingOpponent if room is currently WAITING and unlocked
    const duel = await Duel.findOneAndUpdate(
      {
        roomId,
        status: "WAITING",
        locked: false,
        pendingOpponent: null,
        participants: { $ne: userId },
      },
      {
        $set: {
          pendingOpponent: userId,
          status: "REQUESTED",
        },
      },
      { new: true }
    )
      .populate("creator", "email")
      .populate("pendingOpponent", "email streak focusCoins currentStatus dsaLevel techStack")
      .populate("participants", "email leetcodeUsername");

    if (!duel) {
      return res.status(400).json({ message: "Room is full, locked, or already has a challenger." });
    }

    try {
      getIO().to(`duel-${roomId}`).emit("opponent_requested", duel);
      getIO().to("lobby").emit("duel_updated", duel);
    } catch (e) {
      console.warn("Socket broadcast error:", e.message);
    }

    res.json({ message: "Requested", duel });
  } catch (error) {
    console.error("requestToJoin error:", error);
    res.status(500).json({ message: "Request failed" });
  }
};

export const acceptOpponent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;

    // Fetch duel to check creator authorization and challenger
    const existing = await Duel.findOne({ roomId });
    if (!existing) return res.status(404).json({ message: "Duel not found" });
    if (existing.creator.toString() !== userId) {
      return res.status(403).json({ message: "Only room host can accept challengers." });
    }
    if (!existing.pendingOpponent) {
      return res.status(400).json({ message: "No pending challenger to accept." });
    }

    const opponentId = existing.pendingOpponent;

    // Atomic update: move pendingOpponent to participants and start match
    const duel = await Duel.findOneAndUpdate(
      {
        roomId,
        status: "REQUESTED",
        pendingOpponent: opponentId,
      },
      {
        $push: { participants: opponentId },
        $set: {
          pendingOpponent: null,
          status: "ONGOING",
          startTime: new Date(),
          locked: true,
        },
      },
      { new: true }
    )
      .populate("creator", "email")
      .populate("participants", "email leetcodeUsername")
      .populate("results.user", "email");

    if (!duel) {
      return res.status(400).json({ message: "Could not start duel (match already started or cancelled)." });
    }

    try {
      getIO().to(`duel-${roomId}`).emit("opponent_accepted", duel);
      getIO().to("lobby").emit("duel_updated", duel);
    } catch (e) {
      console.warn("Socket broadcast error:", e.message);
    }

    res.json({ message: "Match Started", duel });
  } catch (error) {
    console.error("acceptOpponent error:", error);
    res.status(500).json({ message: "Accept failed" });
  }
};

export const rejectOpponent = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { roomId } = req.params;

    const existing = await Duel.findOne({ roomId });
    if (!existing) return res.status(404).json({ message: "Duel not found" });
    if (existing.creator.toString() !== userId) {
      return res.status(403).json({ message: "Only room host can reject challengers." });
    }

    const duel = await Duel.findOneAndUpdate(
      { roomId, status: "REQUESTED" },
      { $set: { pendingOpponent: null, status: "WAITING" } },
      { new: true }
    )
      .populate("creator", "email")
      .populate("participants", "email leetcodeUsername");

    try {
      getIO().to(`duel-${roomId}`).emit("opponent_rejected", { roomId, problemTitle: existing.problemTitle });
      getIO().to("lobby").emit("duel_updated", duel);
    } catch (e) {
      console.warn("Socket broadcast error:", e.message);
    }

    res.json({ message: "Rejected", duel });
  } catch (error) {
    console.error("rejectOpponent error:", error);
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
    if (!data.creatorEmail && duel.creator) data.creatorEmail = duel.creator.email;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Sync error" });
  }
};

export const verifyAndFinalize = async (req, res) => {
  try {
    const { leetcodeUsername, roomId } = req.body;
    const userId = req.user.userId;
    const currentUser = await User.findById(userId);
    const duel = await Duel.findOne({ roomId });
    if (!duel) return res.status(404).json({ message: "Duel not found" });

    const response = await axios.post(LC_URL, {
      query: `query recentAcSubmissions($username: String!) { 
        recentAcSubmissionList(username: $username, limit: 10) { 
          titleSlug timestamp 
        } 
      }`,
      variables: { username: leetcodeUsername }
    }, { headers: LC_HEADERS });

    const submissions = response.data?.data?.recentAcSubmissionList || [];
    const duelStartUnix = Math.floor(new Date(duel.startTime).getTime() / 1000) - 300;
    const validSolve = submissions.find(s =>
      s.titleSlug === duel.problemSlug && parseInt(s.timestamp) >= duelStartUnix
    );
    if (!validSolve) return res.status(400).json({ message: "Solve not found on LeetCode." });

    const timeTaken = Math.max(1, Math.round(
      (parseInt(validSolve.timestamp) - (duelStartUnix + 300)) / 60
    ));

    // Atomic push result if not already submitted
    let updatedDuel = await Duel.findOneAndUpdate(
      {
        roomId,
        "results.user": { $ne: userId }
      },
      {
        $push: {
          results: { user: userId, email: currentUser.email, timeTaken }
        }
      },
      { new: true }
    )
      .populate("creator", "email")
      .populate("participants", "email leetcodeUsername")
      .populate("results.user", "email");

    if (!updatedDuel) {
      updatedDuel = await Duel.findOne({ roomId })
        .populate("creator", "email")
        .populate("participants", "email leetcodeUsername")
        .populate("results.user", "email");
    }

    const opponentId = updatedDuel.participants.find(p => p._id?.toString() !== userId && p.toString() !== userId);
    const opponentIdStr = (opponentId?._id || opponentId)?.toString();
    const opponentAbandoned = updatedDuel.abandonedBy.some(a => (a._id || a)?.toString() === opponentIdStr);

    if (updatedDuel.results.length === 2 || opponentAbandoned) {
      if (opponentAbandoned && updatedDuel.results.length === 1) {
        await awardWinner(userId, currentUser.email, updatedDuel);
      } else if (updatedDuel.results.length === 2) {
        const [p1, p2] = updatedDuel.results;
        const winnerId = p1.timeTaken <= p2.timeTaken ? p1.user : p2.user;
        const winnerEmail = p1.timeTaken <= p2.timeTaken ? p1.email : p2.email;
        await awardWinner(winnerId, winnerEmail, updatedDuel);
      }
      updatedDuel.status = "COMPLETED";
      for (const p of updatedDuel.participants) {
        const pid = (p._id || p)?.toString();
        if (!updatedDuel.hiddenFor.map(h => (h._id || h)?.toString()).includes(pid)) {
          updatedDuel.hiddenFor.push(pid);
        }
      }
      await updatedDuel.save();
    }

    // Add to revision queue
    try {
      const existing = await ReviewCard.findOne({ user: userId, problemSlug: duel.problemSlug });
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
    } catch (cardErr) { console.warn("Review card init failed"); }

    await User.findByIdAndUpdate(userId, { lastDuelSolvedAt: new Date() });

    try {
      getIO().to(`duel-${roomId}`).emit("solve_verified", {
        userId,
        timeTaken,
        duel: updatedDuel,
        winner: updatedDuel.winner,
        status: updatedDuel.status
      });
      getIO().to("lobby").emit("duel_updated", updatedDuel);
    } catch (e) {
      console.warn("Socket broadcast error:", e.message);
    }

    res.json({ success: true, timeTaken, message: "Verified! Score awarded and added to Revision Queue." });
  } catch (error) {
    console.error("verifyAndFinalize error:", error);
    res.status(500).json({ message: "Referee error" });
  }
};

export const endDuel = async (req, res) => {
  try {
    const duel = await Duel.findOne({ roomId: req.params.roomId });
    const userId = req.user.userId;
    if (!duel) return res.status(404).json({ message: "Not found" });

    if (duel.status === "WAITING" || duel.status === "REQUESTED") {
      await Duel.deleteOne({ roomId: req.params.roomId });
      try {
        getIO().to(`duel-${req.params.roomId}`).emit("duel_cancelled");
        getIO().to("lobby").emit("duel_removed", req.params.roomId);
      } catch (e) { }
      return res.json({ message: "Match cancelled" });
    }

    if (duel.status === "ONGOING") {
      const userHasSolved = duel.results.some(r => (r.user?._id || r.user)?.toString() === userId);
      if (!duel.abandonedBy.map(a => (a._id || a)?.toString()).includes(userId)) {
        duel.abandonedBy.push(userId);
      }
      if (!duel.hiddenFor.map(h => (h._id || h)?.toString()).includes(userId)) {
        duel.hiddenFor.push(userId);
      }

      const opponent = duel.participants.find(p => (p._id || p)?.toString() !== userId);
      const opponentId = (opponent?._id || opponent)?.toString();

      if (!userHasSolved && opponentId) {
        const opponentSolved = duel.results.some(r => (r.user?._id || r.user)?.toString() === opponentId);
        if (opponentSolved) {
          const opponentResult = duel.results.find(r => (r.user?._id || r.user)?.toString() === opponentId);
          await awardWinner(opponentId, opponentResult.email, duel);
          if (!duel.hiddenFor.map(h => (h._id || h)?.toString()).includes(opponentId)) {
            duel.hiddenFor.push(opponentId);
          }
        }
      }
      await duel.save();

      try {
        getIO().to(`duel-${req.params.roomId}`).emit("opponent_abandoned", {
          abandonedBy: userId,
          duel
        });
        getIO().to("lobby").emit("duel_updated", duel);
      } catch (e) { }

      return res.json({ message: "Match exited" });
    }

    if (duel.status === "COMPLETED") {
      if (!duel.hiddenFor.map(h => (h._id || h)?.toString()).includes(userId)) {
        duel.hiddenFor.push(userId);
      }
      await duel.save();
      return res.json({ message: "Duel hidden" });
    }

    res.json({ message: "Done" });
  } catch (error) {
    console.error("endDuel error:", error);
    res.status(500).json({ message: "End error" });
  }
};

export const getMyStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    const duels = await Duel.find({
      participants: userId,
      status: "COMPLETED",
    }).sort({ updatedAt: -1 });

    const wins = duels.filter(d => d.winner === user.email).length;
    const totalDuels = duels.length;

    let winStreak = 0;
    for (const d of duels) {
      if (d.winner === user.email) winStreak++;
      else break;
    }

    const catMap = {};
    for (const d of duels) {
      const cat = d.category || "Random";
      if (!catMap[cat]) catMap[cat] = { wins: 0, total: 0 };
      catMap[cat].total++;
      if (d.winner === user.email) catMap[cat].wins++;
    }
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => (b.wins / b.total) - (a.wins / a.total));

    const recentDuels = duels.slice(0, 10).map(d => ({
      problemTitle: d.problemTitle,
      problemSlug: d.problemSlug,
      difficulty: d.difficulty,
      category: d.category,
      winner: d.winner,
    }));

    res.json({ totalDuels, wins, winStreak, categoryBreakdown, recentDuels });
  } catch (err) {
    console.error("getMyStats error:", err);
    res.status(500).json({ message: "Stats error" });
  }
};