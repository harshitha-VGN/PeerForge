import Duel from "../models/Duel.js";
import User from "../models/User.js";
import axios from "axios";
import ReviewCard from "../models/ReviewCard.js";

const LC_URL = "https://leetcode.com/graphql";
const LC_HEADERS = {
  "Content-Type": "application/json",
  "Referer": "https://leetcode.com",
  "User-Agent": "Mozilla/5.0",
};

const TAG_MAP = {
  "Arrays": "array", "Strings": "string", "DP": "dynamic-programming", "Graphs": "graph",
  "Stack": "stack", "Sliding Window": "sliding-window", "Bit Manipulation": "bit-manipulation",
  "Backtracking": "backtracking", "Binary Search": "binary-search", "Trees": "tree"
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

export const createDuel = async (req, res) => {
  try {
    const userId = req.user.userId;
    const busy = await isUserInMatch(userId);
    if (busy) return res.status(400).json({ message: "Finish your other match first!", roomId: busy.roomId });

    const currentUser = await User.findById(userId);
    const { category } = req.body;
    const tag = TAG_MAP[category] || "";
    const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;

    const randomSkip = Math.floor(Math.random() * 200);
    const body = {
      query: `query problemsetQuestionList($filters: QuestionListFilterInput) {
        problemsetQuestionList: questionList(limit: 50, filters: $filters) {
          questions: data { title titleSlug difficulty paidOnly: isPaidOnly }
        }
      }`,
      variables: { filters: tag ? { tags: [tag] } : {} }
    };

    let picked = null;
    try {
      const response = await axios.post(LC_URL, body, { headers: LC_HEADERS, timeout: 8000 });
      const questions = response.data?.data?.problemsetQuestionList?.questions?.filter(q => !q.paidOnly) || [];
      if (questions.length > 0) picked = questions[Math.floor(Math.random() * questions.length)];
    } catch (e) { console.warn("API Switch"); }

    if (!picked) picked = { title: "Two Sum", titleSlug: "two-sum", difficulty: "Easy" };

    const newDuel = await Duel.create({
      roomId,
      creator: userId,
      creatorEmail: currentUser.email,
      participants: [userId],
      problemTitle: picked.title,
      problemSlug: picked.titleSlug,
      difficulty: picked.difficulty,
      category: category || "Random",
      status: "WAITING"
    });

    res.status(201).json(newDuel);
  } catch (error) { res.status(500).json({ message: "Server error" }); }
};

export const verifyAndFinalize = async (req, res) => {
  try {
    const { leetcodeUsername, roomId } = req.body;
    const userId = req.user.userId;
    const duel = await Duel.findOne({ roomId });

    if (!duel) return res.status(404).json({ message: "Duel not found" });

    const response = await axios.post(LC_URL, {
      query: `query recentAcSubmissions($username: String!) { recentAcSubmissionList(username: $username, limit: 10) { titleSlug timestamp } }`,
      variables: { username: leetcodeUsername }
    }, { headers: LC_HEADERS });

    const submissions = response.data?.data?.recentAcSubmissionList || [];
    const duelStartUnix = Math.floor(new Date(duel.startTime).getTime() / 1000) - 300;

    const validSolve = submissions.find(s => s.titleSlug === duel.problemSlug && parseInt(s.timestamp) >= duelStartUnix);
    if (!validSolve) return res.status(400).json({ message: "Solve not found on LeetCode." });

    const timeTaken = Math.max(1, Math.round((parseInt(validSolve.timestamp) - (duelStartUnix + 300)) / 60));

    if (!duel.results.some(r => r.user?.toString() === userId)) {
      duel.results.push({ user: userId, email: req.user.email, timeTaken });
    }

    // WINNER LOGIC
    const opponentId = duel.participants.find(p => p.toString() !== userId);
    const opponentQuit = duel.abandonedBy.includes(opponentId);

    if (duel.results.length === 2 || opponentQuit) {
      let winningId;
      if (opponentQuit && duel.results.length === 1) {
        winningId = userId;
        duel.winner = req.user.email;
      } else {
        const [p1, p2] = duel.results;
        winningId = p1.timeTaken <= p2.timeTaken ? p1.user : p2.user;
        duel.winner = p1.timeTaken <= p2.timeTaken ? p1.email : p2.email;
      }
      duel.status = "COMPLETED";

      // AWARD SCORE
      await User.findByIdAndUpdate(winningId, {
        $inc: { focusCoins: 50, xp: 100, duelWins: 1 }
      });
    }

    await duel.save();
    // ... inside verifyAndFinalize after duel.save() ...

    try {
      const existingCard = await ReviewCard.findOne({ user: userId, problemSlug: duel.problemSlug });
      if (!existingCard) {
        await ReviewCard.create({
          user: userId,
          problemSlug: duel.problemSlug,
          problemTitle: duel.problemTitle,
          difficulty: duel.difficulty,
          category: duel.category,
          // Set next review to 24 hours from now
          nextReviewDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
    } catch (cardErr) {
      console.warn("Spaced Repetition failed to initialize for this solve");
    }

    res.json({ success: true, timeTaken, message: "Verified! Score awarded and added to Revision Queue." });
    

    
  } catch (error) { res.status(500).json({ message: "Referee error" }); }
};

export const getDuelStatus = async (req, res) => {
    try {
      const duel = await Duel.findOne({ roomId: req.params.roomId })
        .populate("creator", "email")
        .populate("pendingOpponent", "email streak focusCoins")
        .populate("participants", "email leetcodeUsername")
        .populate("results.user", "email");
      if (!duel) return res.status(404).json({ message: "Not found" });
      const data = duel.toObject();
      data.creatorId = (duel.creator?._id || duel.creator).toString();
      if (!data.creatorEmail && duel.creator) data.creatorEmail = duel.creator.email;
      res.json(data);
    } catch (error) { res.status(500).json({ message: "Sync error" }); }
};

export const requestToJoin = async (req, res) => {
    try {
      const duel = await Duel.findOne({ roomId: req.params.roomId });
      if (!duel || duel.status !== "WAITING") return res.status(400).json({ message: "Unavailable" });
      duel.pendingOpponent = req.user.userId;
      duel.status = "REQUESTED";
      await duel.save();
      res.json({ message: "Requested" });
    } catch (error) { res.status(500).json({ message: "Request failed" }); }
};

export const acceptOpponent = async (req, res) => {
    try {
      const duel = await Duel.findOne({ roomId: req.params.roomId });
      if (!duel || !duel.pendingOpponent) return res.status(400).json({ message: "No challenger" });
      duel.participants.push(duel.pendingOpponent);
      duel.pendingOpponent = null;
      duel.status = "ONGOING";
      duel.startTime = new Date();
      await duel.save();
      res.json({ message: "Match Started" });
    } catch (error) { res.status(500).json({ message: "Accept failed" }); }
};

export const getAvailableDuels = async (req, res) => {
    try {
      const duels = await Duel.find({ status: { $in: ["WAITING", "REQUESTED", "ONGOING"] } })
        .populate("creator", "email")
        .sort({ createdAt: -1 });
      res.json(duels);
    } catch (e) { res.status(500).json({ message: "Lobby error" }); }
};

export const endDuel = async (req, res) => {
    try {
      const duel = await Duel.findOne({ roomId: req.params.roomId });
      const userId = req.user.userId;
      if (!duel) return res.status(404).json({ message: "Not found" });
  
      if (duel.status === "WAITING" || duel.status === "REQUESTED") {
        await Duel.deleteOne({ roomId: req.params.roomId });
      } else {
        if (!duel.abandonedBy.includes(userId)) duel.abandonedBy.push(userId);
        if (duel.abandonedBy.length >= duel.participants.length) duel.status = "COMPLETED";
        await duel.save();
      }
      res.json({ message: "Match exited" });
    } catch (error) { res.status(500).json({ message: "End error" }); }
};

export const rejectOpponent = async (req, res) => {
    try {
      const duel = await Duel.findOne({ roomId: req.params.roomId });
      duel.pendingOpponent = null;
      duel.status = "WAITING";
      await duel.save();
      res.json({ message: "Rejected" });
    } catch (error) { res.status(500).json({ message: "Reject failed" }); }
};

export const getMyStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    // All completed duels this user participated in
    const duels = await Duel.find({
      participants: userId,
      status: "COMPLETED",
    }).sort({ updatedAt: -1 });

    const wins = duels.filter(d => d.winner === user.email).length;
    const totalDuels = duels.length;

    // Win streak: count consecutive wins from most recent
    let winStreak = 0;
    for (const d of duels) {
      if (d.winner === user.email) winStreak++;
      else break;
    }

    // Category breakdown
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

    // Recent duels (last 10)
    const recentDuels = duels.slice(0, 10).map(d => ({
      problemTitle: d.problemTitle,
      problemSlug: d.problemSlug,
      difficulty: d.difficulty,
      category: d.category,
      winner: d.winner,
    }));

    res.json({ totalDuels, wins, winStreak, categoryBreakdown, recentDuels });
  } catch (err) {
    res.status(500).json({ message: "Stats error" });
  }
};