import Pod from "../models/Pod.js";
import User from "../models/User.js";

export const createPod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const { title, idea, techStack, maxMembers, tags } = req.body;
    if (!title || !idea) return res.status(400).json({ message: "Title and idea are required" });
    const pod = await Pod.create({
      title, idea, techStack: techStack || [], maxMembers: maxMembers || 4,
      tags: tags || [], creator: userId, creatorEmail: user.email,
      members: [userId], status: "OPEN", lastActivityAt: new Date(),
    });
    res.status(201).json(pod);
  } catch (err) { console.error("createPod:", err); res.status(500).json({ message: "Failed to create pod" }); }
};

export const acceptRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestUserId } = req.body;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.creator.toString() !== userId) return res.status(403).json({ message: "Only creator can accept" });
    const targetId = requestUserId.toString();
    if (pod.members.some(m => m.toString() === targetId)) return res.status(400).json({ message: "Already a member" });
    pod.pendingRequests = pod.pendingRequests.filter(r => r.user.toString() !== targetId);
    pod.members.push(targetId);
    if (pod.members.length >= pod.maxMembers) pod.status = "FULL";
    pod.lastActivityAt = new Date();
    await pod.save();
    res.json({ message: "Member accepted!" });
  } catch (err) { console.error("acceptRequest:", err); res.status(500).json({ message: "Accept failed" }); }
};

export const rejectRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestUserId, reason } = req.body;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.creator.toString() !== userId) return res.status(403).json({ message: "Only creator can reject" });

    // Find the pending request to get email
    const pending = pod.pendingRequests.find(r => r.user.toString() === requestUserId);
    
    // Remove from pending
    pod.pendingRequests = pod.pendingRequests.filter(r => r.user.toString() !== requestUserId);

    // Store rejection with reason so user can see it
    if (pending) {
      pod.rejectedUsers = pod.rejectedUsers || [];
      // Don't duplicate
      if (!pod.rejectedUsers.some(r => r.user.toString() === requestUserId)) {
        pod.rejectedUsers.push({
          user: requestUserId,
          email: pending.email,
          reason: reason || "Not a fit for this project right now.",
          rejectedAt: new Date(),
        });
      }
    }

    await pod.save();
    res.json({ message: "Request rejected" });
  } catch (err) { console.error("rejectRequest:", err); res.status(500).json({ message: "Reject failed" }); }
};

// User dismisses rejection notification (clears it from rejectedUsers)
export const dismissRejection = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    pod.rejectedUsers = (pod.rejectedUsers || []).filter(r => r.user.toString() !== userId);
    await pod.save();
    res.json({ message: "Dismissed" });
  } catch (err) { console.error("dismissRejection:", err); res.status(500).json({ message: "Dismiss failed" }); }
};

export const requestToJoin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.status === "CLOSED") return res.status(400).json({ message: "This pod is closed." });
    if (pod.status === "FULL") return res.status(400).json({ message: "This pod is full." });
    if (pod.members.some(m => m.toString() === userId)) return res.status(400).json({ message: "You are already a member." });
    if (pod.pendingRequests.some(r => r.user.toString() === userId)) return res.status(400).json({ message: "You already sent a request." });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    pod.pendingRequests.push({ user: userId, email: user.email, message: req.body.message || "" });
    // Clear any old rejection if they're re-applying
    pod.rejectedUsers = (pod.rejectedUsers || []).filter(r => r.user.toString() !== userId);
    await pod.save();
    res.json({ message: "Join request sent!" });
  } catch (err) { console.error("requestToJoin:", err); res.status(500).json({ message: "Request failed", detail: err.message }); }
};

export const requestLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!pod.members.some(m => m.toString() === userId)) return res.status(403).json({ message: "Not a member" });
    if (pod.creator.toString() === userId) return res.status(400).json({ message: "Creator should use Close Pod instead." });
    if ((pod.leaveRequests || []).some(r => r.user.toString() === userId)) return res.status(400).json({ message: "Already requested to leave." });
    const user = await User.findById(userId);
    pod.leaveRequests = pod.leaveRequests || [];
    pod.leaveRequests.push({ user: userId, email: user.email });
    await pod.save();
    res.json({ message: "Leave request submitted." });
  } catch (err) { console.error("requestLeave:", err); res.status(500).json({ message: "Leave request failed" }); }
};

export const approveLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { leaveUserId } = req.body;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.creator.toString() !== userId) return res.status(403).json({ message: "Only creator can approve leave" });
    pod.members = pod.members.filter(m => m.toString() !== leaveUserId);
    pod.leaveRequests = (pod.leaveRequests || []).filter(r => r.user.toString() !== leaveUserId);
    if (pod.status === "FULL" && pod.members.length < pod.maxMembers) pod.status = "OPEN";
    pod.lastActivityAt = new Date();
    await pod.save();
    res.json({ message: "Member removed." });
  } catch (err) { console.error("approveLeave:", err); res.status(500).json({ message: "Approve leave failed" }); }
};

export const closePod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.creator.toString() !== userId) return res.status(403).json({ message: "Only creator can close" });
    pod.status = "CLOSED";
    pod.projectLink = req.body.projectLink || "";
    pod.closedAt = new Date();
    pod.closedByEmail = user.email;
    await pod.save();
    res.json({ message: "Pod closed and added to Hall of Fame!" });
  } catch (err) { console.error("closePod:", err); res.status(500).json({ message: "Close pod failed" }); }
};

export const getClosedPods = async (req, res) => {
  try {
    const pods = await Pod.find({ status: "CLOSED" })
      .populate("members", "email")
      .select("-messages")
      .sort({ closedAt: -1 });
    res.json(pods);
  } catch (err) { console.error("getClosedPods:", err); res.status(500).json({ message: "Failed to fetch closed pods" }); }
};

export const getAllPods = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Include pods where user was rejected so they can see rejection notice
    const pods = await Pod.find({
      $or: [
        { status: { $in: ["OPEN", "FULL"] } },
        { "rejectedUsers.user": userId }  // show rejected pods to that user only
      ]
    })
      .populate("creator", "email")
      .populate("members", "_id email")
      .populate("pendingRequests.user", "_id email")
      .select("-messages")
      .sort({ lastActivityAt: -1, createdAt: -1 });
    res.json(pods);
  } catch (err) { console.error("getAllPods:", err); res.status(500).json({ message: "Failed to fetch pods" }); }
};

export const getMyPods = async (req, res) => {
  try {
    const pods = await Pod.find({ members: req.user.userId, status: { $ne: "CLOSED" } })
      .populate("creator", "email")
      .select("-messages")
      .sort({ updatedAt: -1 });
    res.json(pods);
  } catch (err) { console.error("getMyPods:", err); res.status(500).json({ message: "Failed to fetch your pods" }); }
};

export const getPod = async (req, res) => {
  try {
    const pod = await Pod.findById(req.params.id)
      .populate("creator", "email")
      .populate("members", "email")
      .populate("pendingRequests.user", "email techStack dsaLevel currentStatus codingExperienceYears bio")
      .populate("messages.sender", "email");
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    const userId = req.user.userId;
    const isMember = pod.members.some(m => m._id.toString() === userId);
    if (!isMember) {
      const safeData = pod.toObject();
      safeData.messages = [];
      return res.json(safeData);
    }
    res.json(pod);
  } catch (err) { console.error("getPod:", err); res.status(500).json({ message: "Failed to fetch pod" }); }
};

export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: "Empty message" });
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!pod.members.some(m => m.toString() === userId)) return res.status(403).json({ message: "Not a member" });
    const user = await User.findById(userId);
    pod.messages.push({ sender: userId, senderEmail: user.email, content: content.trim() });
    pod.lastActivityAt = new Date();
    await pod.save();
    res.json({ message: "Sent", data: pod.messages[pod.messages.length - 1] });
  } catch (err) { console.error("sendMessage:", err); res.status(500).json({ message: "Message failed" }); }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pod = await Pod.findById(req.params.id).populate("messages.sender", "email");
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (!pod.members.some(m => m._id.toString() === userId)) return res.status(403).json({ message: "Not a member" });
    res.json(pod.messages.slice(-100));
  } catch (err) { console.error("getMessages:", err); res.status(500).json({ message: "Failed to fetch messages" }); }
};

export const leavePod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const pod = await Pod.findById(req.params.id);
    if (!pod) return res.status(404).json({ message: "Pod not found" });
    if (pod.creator.toString() === userId) {
      pod.status = "CLOSED"; pod.closedAt = new Date(); await pod.save();
      return res.json({ message: "Pod closed" });
    }
    pod.members = pod.members.filter(m => m.toString() !== userId);
    if (pod.status === "FULL" && pod.members.length < pod.maxMembers) pod.status = "OPEN";
    await pod.save();
    res.json({ message: "Left pod" });
  } catch (err) { console.error("leavePod:", err); res.status(500).json({ message: "Leave failed" }); }
};