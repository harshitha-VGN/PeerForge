
import Pod from "../models/Pod.js";
import User from "../models/User.js";

// ─── Create a Pod ─────────────────────────────────────────────────────────────
export const createPod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { title, idea, techStack, maxMembers, tags } = req.body;
    if (!title || !idea) return res.status(400).json({ message: "Title and idea are required" });

    const pod = await Pod.create({
      title,
      idea,
      techStack: techStack || [],
      maxMembers: maxMembers || 4,
      tags: tags || [],
      creator: userId,
      creatorEmail: user.email,
      members: [userId],   
      status: "OPEN",
    });

    res.status(201).json(pod);
  } catch (err) {
    res.status(500).json({ message: "Failed to create pod" });
  }
};

// ─── Accept a join request ────────────────────────────────────────────────────
export const acceptRequest = async (req, res) => {
  try {
    const userId = req.user.userId; // The Creator
    const { requestUserId } = req.body; // The applicant ID
    
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    if (pod.creator.toString() !== userId) {
      return res.status(403).json({ message: "Only the creator can accept" });
    }

    // Convert everything to string for comparison
    const targetId = requestUserId.toString();

    // 1. Check if already member
    const alreadyMember = pod.members.some(m => m.toString() === targetId);
    if (alreadyMember) return res.status(400).json({ message: "Already a member" });

    // 2. Remove from pending
    pod.pendingRequests = pod.pendingRequests.filter(r => r.user.toString() !== targetId);
    
    // 3. Add to members
    pod.members.push(targetId);

    if (pod.members.length >= pod.maxMembers) pod.status = "FULL";

    await pod.save();
    res.json({ message: "Member accepted!" });
  } catch (err) {
    res.status(500).json({ message: "Accept failed" });
  }
};

// ─── Get single pod (with messages) ──────────────────────────────────────────
export const getPod = async (req, res) => {
  try {
    const pod = await Pod.findById(req.params.id)
      .populate("creator", "email")
      .populate("members", "email")
      .populate("pendingRequests.user", "email")
      .populate("messages.sender", "email");
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    // Only members can see chat
    const userId = req.user.userId;
    const isMember = pod.members.some(m => m._id.toString() === userId);
    if (!isMember) {
      const safeData = pod.toObject();
      safeData.messages = [];   // hide chat from non-members
      return res.json(safeData);
    }

    res.json(pod);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pod" });
  }
};

// ─── Request to join ──────────────────────────────────────────────────────────
export const requestToJoin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.status !== "OPEN") return res.status(400).json({ message: "Pod is not accepting members" });

    const alreadyMember = pod.members.some(m => m.toString() === userId);
    if (alreadyMember) return res.status(400).json({ message: "Already a member" });

    const alreadyRequested = pod.pendingRequests.some(r => r.user.toString() === userId);
    if (alreadyRequested) return res.status(400).json({ message: "Already requested" });

    const user = await User.findById(userId);
    pod.pendingRequests.push({
      user: userId,
      email: user.email,
      message: req.body.message || "",
    });
    await pod.save();

    res.json({ message: "Join request sent!" });
  } catch (err) {
    res.status(500).json({ message: "Request failed" });
  }
};

// ─── Reject a join request ────────────────────────────────────────────────────
export const rejectRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestUserId } = req.body;
    const pod = await Pod.findById(req.params.id);

    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.creator.toString() !== userId) return res.status(403).json({ message: "Only creator can reject" });

    pod.pendingRequests = pod.pendingRequests.filter(r => r.user.toString() !== requestUserId);
    await pod.save();
    res.json({ message: "Request rejected" });
  } catch (err) {
    res.status(500).json({ message: "Reject failed" });
  }
};

// ─── Send a message ───────────────────────────────────────────────────────────
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Empty message" });

    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    const isMember = pod.members.some(m => m.toString() === userId);
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    const user = await User.findById(userId);
    pod.messages.push({ sender: userId, senderEmail: user.email, content: content.trim() });
    await pod.save();

    const newMsg = pod.messages[pod.messages.length - 1];
    res.json({ message: "Sent", data: newMsg });
  } catch (err) {
    res.status(500).json({ message: "Message failed" });
  }
};

// ─── Get messages (polling) ───────────────────────────────────────────────────
export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pod = await Pod.findById(req.params.id).populate("messages.sender", "email");
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    const isMember = pod.members.some(m => m._id.toString() === userId);
    if (!isMember) return res.status(403).json({ message: "Not a member" });

    // Return last 100 messages
    res.json(pod.messages.slice(-100));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

// ─── Leave a pod ──────────────────────────────────────────────────────────────
export const leavePod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    if (pod.creator.toString() === userId) {
      // Creator closing the pod
      pod.status = "CLOSED";
      await pod.save();
      return res.json({ message: "Pod closed" });
    }

    pod.members = pod.members.filter(m => m.toString() !== userId);
    if (pod.status === "FULL" && pod.members.length < pod.maxMembers) pod.status = "OPEN";
    await pod.save();
    res.json({ message: "Left pod" });
  } catch (err) {
    res.status(500).json({ message: "Leave failed" });
  }
};


// ─── Get all pods (Lobby) ────────────────────────────────────────────────
export const getAllPods = async (req, res) => {
  try {
    // Only show OPEN or FULL pods. Ignore CLOSED ones.
    const pods = await Pod.find({ status: { $in: ["OPEN", "FULL"] } })
      .populate("creator", "email")
      .populate("members", "_id email")
      .populate("pendingRequests.user", "_id email")
      .select("-messages")
      .sort({ createdAt: -1 });
    res.json(pods);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pods" });
  }
};

// ─── Get my pods ──────────────────────────────────────────────────────────────
export const getMyPods = async (req, res) => {
  try {
    // CRITICAL FIX: Only show pods I am in that are NOT closed
    const pods = await Pod.find({ 
      members: req.user.userId,
      status: { $ne: "CLOSED" } 
    })
    .populate("creator", "email")
    .select("-messages")
    .sort({ updatedAt: -1 });
    res.json(pods);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your pods" });
  }
};