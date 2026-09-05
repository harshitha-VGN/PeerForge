import Pod from "../models/Pod.js";
import User from "../models/User.js";
import { getIO } from "../socket.js";

// Create a new pod (project team)
export const createPod = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { title, idea, techStack, maxMembers, tags } = req.body;

    if (!title || !idea)
      return res.status(400).json({ message: "Title and idea are required" });

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
      lastActivityAt: new Date(),
    });

    try {
      getIO().to("lobby").emit("pod_created", pod);
    } catch (e) {}

    res.status(201).json(pod);
  } catch (err) {
    console.error("createPod:", err);
    res.status(500).json({ message: "Failed to create pod" });
  }
};

// Creator accepts a join request
export const acceptRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestUserId } = req.body;
    const podId = req.params.id;

    const targetId = requestUserId?.toString();
    if (!targetId) return res.status(400).json({ message: "Missing requestUserId" });

    const pod = await Pod.findById(podId);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    if (pod.creator.toString() !== userId)
      return res.status(403).json({ message: "Only creator can accept" });

    if (pod.members.some(m => m.toString() === targetId))
      return res.status(400).json({ message: "Already a member" });

    if (pod.members.length >= pod.maxMembers) {
      return res.status(400).json({ message: "Pod is already at max capacity" });
    }

    // Atomic update: remove from pending and push to members
    const updatedPod = await Pod.findOneAndUpdate(
      {
        _id: podId,
        creator: userId,
        members: { $ne: targetId },
      },
      {
        $pull: { pendingRequests: { user: targetId } },
        $push: { members: targetId },
        $set: {
          lastActivityAt: new Date(),
          status: pod.members.length + 1 >= pod.maxMembers ? "FULL" : "OPEN"
        }
      },
      { new: true }
    )
      .populate("creator", "email")
      .populate("members", "email")
      .populate("pendingRequests.user", "email techStack dsaLevel currentStatus codingExperienceYears bio");

    try {
      getIO().to(`pod-${podId}`).emit("pod_updated", updatedPod);
      getIO().to("lobby").emit("pod_lobby_updated", updatedPod);
    } catch (e) {}

    res.json({ message: "Member accepted!", pod: updatedPod });
  } catch (err) {
    console.error("acceptRequest:", err);
    res.status(500).json({ message: "Accept failed" });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { requestUserId, reason } = req.body;
    const podId = req.params.id;

    const pod = await Pod.findById(podId);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    if (pod.creator.toString() !== userId)
      return res.status(403).json({ message: "Only creator can reject" });

    const pending = pod.pendingRequests.find(
      r => r.user?.toString() === requestUserId
    );

    const updatedPod = await Pod.findOneAndUpdate(
      { _id: podId, creator: userId },
      {
        $pull: { pendingRequests: { user: requestUserId } },
        $push: {
          rejectedUsers: {
            user: requestUserId,
            email: pending?.email || "",
            reason: reason || "Not a fit for this project right now.",
            rejectedAt: new Date(),
          }
        }
      },
      { new: true }
    )
      .populate("creator", "email")
      .populate("members", "email")
      .populate("pendingRequests.user", "email techStack dsaLevel currentStatus codingExperienceYears bio");

    try {
      getIO().to(`pod-${podId}`).emit("pod_updated", updatedPod);
      getIO().to("lobby").emit("pod_lobby_updated", updatedPod);
    } catch (e) {}

    res.json({ message: "Request rejected", pod: updatedPod });
  } catch (err) {
    console.error("rejectRequest:", err);
    res.status(500).json({ message: "Reject failed" });
  }
};

// User dismisses rejection notification
export const dismissRejection = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pod = await Pod.findByIdAndUpdate(
      req.params.id,
      { $pull: { rejectedUsers: { user: userId } } },
      { new: true }
    );

    if (!pod) return res.status(404).json({ message: "Pod not found" });

    res.json({ message: "Dismissed" });
  } catch (err) {
    console.error("dismissRejection:", err);
    res.status(500).json({ message: "Dismiss failed" });
  }
};

export const requestToJoin = async (req, res) => {
  try {
    const userId = req.user.userId;
    const podId = req.params.id;

    const pod = await Pod.findById(podId);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    if (pod.status === "CLOSED")
      return res.status(400).json({ message: "This pod is closed." });

    if (pod.status === "FULL" || pod.members.length >= pod.maxMembers)
      return res.status(400).json({ message: "This pod is full." });

    if (pod.members.some(m => m.toString() === userId))
      return res.status(400).json({ message: "You are already a member." });

    if (pod.pendingRequests.some(r => r.user?.toString() === userId))
      return res.status(400).json({ message: "You already sent a request." });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Atomic push to pending requests and pull from rejected
    const updatedPod = await Pod.findByIdAndUpdate(
      podId,
      {
        $push: {
          pendingRequests: {
            user: userId,
            email: user.email,
            message: req.body.message || "",
            requestedAt: new Date(),
          }
        },
        $pull: { rejectedUsers: { user: userId } }
      },
      { new: true }
    )
      .populate("creator", "email")
      .populate("members", "email")
      .populate("pendingRequests.user", "email techStack dsaLevel currentStatus codingExperienceYears bio");

    try {
      getIO().to(`pod-${podId}`).emit("pod_request_received", {
        podId,
        request: { user: userId, email: user.email, message: req.body.message || "" }
      });
      getIO().to("lobby").emit("pod_lobby_updated", updatedPod);
    } catch (e) {}

    res.json({ message: "Join request sent!", pod: updatedPod });
  } catch (err) {
    console.error("requestToJoin:", err);
    res.status(500).json({ message: "Request failed", detail: err.message });
  }
};

export const requestLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const podId = req.params.id;

    const pod = await Pod.findById(podId);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    if (!pod.members.some(m => m.toString() === userId))
      return res.status(403).json({ message: "Not a member" });

    if (pod.creator.toString() === userId)
      return res.status(400).json({
        message: "Creator should use Close Pod instead.",
      });

    if ((pod.leaveRequests || []).some(r => r.user?.toString() === userId))
      return res.status(400).json({ message: "Already requested to leave." });

    const user = await User.findById(userId);

    const updatedPod = await Pod.findByIdAndUpdate(
      podId,
      {
        $push: {
          leaveRequests: {
            user: userId,
            email: user.email,
            requestedAt: new Date(),
          }
        }
      },
      { new: true }
    );

    try {
      getIO().to(`pod-${podId}`).emit("pod_updated", updatedPod);
    } catch (e) {}

    res.json({ message: "Leave request submitted." });
  } catch (err) {
    console.error("requestLeave:", err);
    res.status(500).json({ message: "Leave request failed" });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { leaveUserId } = req.body;
    const podId = req.params.id;

    const pod = await Pod.findById(podId);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    if (pod.creator.toString() !== userId)
      return res.status(403).json({
        message: "Only creator can approve leave",
      });

    const updatedPod = await Pod.findByIdAndUpdate(
      podId,
      {
        $pull: {
          members: leaveUserId,
          leaveRequests: { user: leaveUserId }
        },
        $set: {
          status: "OPEN",
          lastActivityAt: new Date(),
        }
      },
      { new: true }
    )
      .populate("creator", "email")
      .populate("members", "email");

    try {
      getIO().to(`pod-${podId}`).emit("pod_updated", updatedPod);
      getIO().to("lobby").emit("pod_lobby_updated", updatedPod);
    } catch (e) {}

    res.json({ message: "Member removed." });
  } catch (err) {
    console.error("approveLeave:", err);
    res.status(500).json({ message: "Approve leave failed" });
  }
};

export const closePod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const podId = req.params.id;

    const user = await User.findById(userId);
    const pod = await Pod.findById(podId);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    if (pod.creator.toString() !== userId)
      return res.status(403).json({ message: "Only creator can close" });

    pod.status = "CLOSED";
    pod.projectLink = req.body.projectLink || "";
    pod.closedAt = new Date();
    pod.closedByEmail = user.email;

    await pod.save();

    try {
      getIO().to(`pod-${podId}`).emit("pod_closed", { podId, projectLink: pod.projectLink });
      getIO().to("lobby").emit("pod_lobby_updated", pod);
    } catch (e) {}

    res.json({ message: "Pod closed and added to Hall of Fame!" });
  } catch (err) {
    console.error("closePod:", err);
    res.status(500).json({ message: "Close pod failed" });
  }
};

export const getClosedPods = async (req, res) => {
  try {
    const pods = await Pod.find({ status: "CLOSED" })
      .populate("members", "email")
      .select("-messages")
      .sort({ closedAt: -1 });

    res.json(pods);
  } catch (err) {
    console.error("getClosedPods:", err);
    res.status(500).json({ message: "Failed to fetch closed pods" });
  }
};

export const getAllPods = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pods = await Pod.find({
      $or: [
        { status: { $in: ["OPEN", "FULL"] } },
        { "rejectedUsers.user": userId },
      ],
    })
      .populate("creator", "email")
      .populate("members", "_id email")
      .populate("pendingRequests.user", "_id email")
      .select("-messages")
      .sort({ lastActivityAt: -1, createdAt: -1 });

    res.json(pods);
  } catch (err) {
    console.error("getAllPods:", err);
    res.status(500).json({ message: "Failed to fetch pods" });
  }
};

export const getMyPods = async (req, res) => {
  try {
    const pods = await Pod.find({
      members: req.user.userId,
      status: { $ne: "CLOSED" },
    })
      .populate("creator", "email")
      .select("-messages")
      .sort({ updatedAt: -1 });

    res.json(pods);
  } catch (err) {
    console.error("getMyPods:", err);
    res.status(500).json({ message: "Failed to fetch your pods" });
  }
};

export const getPod = async (req, res) => {
  try {
    const pod = await Pod.findById(req.params.id)
      .populate("creator", "email")
      .populate("members", "email")
      .populate(
        "pendingRequests.user",
        "email techStack dsaLevel currentStatus codingExperienceYears bio"
      )
      .populate("messages.sender", "email");

    if (!pod) return res.status(404).json({ message: "Pod not found" });

    const userId = req.user.userId;
    const isMember = pod.members.some(m => (m._id || m).toString() === userId.toString()) ||
                     (pod.creator && (pod.creator._id || pod.creator).toString() === userId.toString());

    // Non-members cannot view pod chat messages
    if (!isMember) {
      const safeData = pod.toObject();
      safeData.messages = [];
      return res.json(safeData);
    }

    res.json(pod);
  } catch (err) {
    console.error("getPod:", err);
    res.status(500).json({ message: "Failed to fetch pod" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { content } = req.body;
    const podId = req.params.id;

    if (!content?.trim())
      return res.status(400).json({ message: "Empty message" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pod = await Pod.findById(podId);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    const isMember = pod.members.some(m => (m._id || m).toString() === userId.toString()) ||
                     (pod.creator && (pod.creator._id || pod.creator).toString() === userId.toString());

    if (!isMember) {
      return res.status(403).json({ message: "Not an active member of this pod" });
    }

    const messageObj = {
      sender: userId,
      senderEmail: user.email,
      content: content.trim(),
      createdAt: new Date(),
    };

    // Append message to pod
    const updatedPod = await Pod.findByIdAndUpdate(
      podId,
      {
        $push: { messages: messageObj },
        $set: { lastActivityAt: new Date() },
      },
      { new: true }
    ).populate("messages.sender", "email");

    const savedMessage = updatedPod.messages[updatedPod.messages.length - 1];

    try {
      getIO().to(`pod-${podId}`).emit("receive_pod_message", savedMessage);
    } catch (e) {
      console.warn("Socket message emit error:", e.message);
    }

    res.json({
      message: "Sent",
      data: savedMessage,
    });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ message: "Message failed" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pod = await Pod.findById(req.params.id).populate(
      "messages.sender",
      "email"
    );

    if (!pod) return res.status(404).json({ message: "Pod not found" });

    const isMember = pod.members.some(m => (m._id || m).toString() === userId.toString()) ||
                     (pod.creator && (pod.creator._id || pod.creator).toString() === userId.toString());

    if (!isMember)
      return res.status(403).json({ message: "Not a member" });

    res.json(pod.messages.slice(-100));
  } catch (err) {
    console.error("getMessages:", err);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

export const leavePod = async (req, res) => {
  try {
    const userId = req.user.userId;
    const podId = req.params.id;

    const pod = await Pod.findById(podId);
    if (!pod) return res.status(404).json({ message: "Pod not found" });

    if (pod.creator.toString() === userId) {
      pod.status = "CLOSED";
      pod.closedAt = new Date();
      await pod.save();
      try {
        getIO().to(`pod-${podId}`).emit("pod_closed", { podId });
        getIO().to("lobby").emit("pod_lobby_updated", pod);
      } catch (e) {}
      return res.json({ message: "Pod closed" });
    }

    const updatedPod = await Pod.findByIdAndUpdate(
      podId,
      {
        $pull: { members: userId },
        $set: {
          status: "OPEN",
          lastActivityAt: new Date(),
        }
      },
      { new: true }
    )
      .populate("creator", "email")
      .populate("members", "email");

    try {
      getIO().to(`pod-${podId}`).emit("pod_updated", updatedPod);
      getIO().to("lobby").emit("pod_lobby_updated", updatedPod);
    } catch (e) {}

    res.json({ message: "Left pod" });
  } catch (err) {
    console.error("leavePod:", err);
    res.status(500).json({ message: "Leave failed" });
  }
};