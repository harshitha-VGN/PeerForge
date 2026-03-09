import express from "express";
import {
  createPod, getAllPods, getPod,
  requestToJoin, acceptRequest, rejectRequest,
  sendMessage, getMessages, leavePod, getMyPods
} from "../controllers/podController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/",           getAllPods);           // lobby
router.get("/mine",       getMyPods);            // my pods
router.post("/",          createPod);            // create pod
router.get("/:id",        getPod);               // single pod
router.post("/:id/request",  requestToJoin);     // request to join
router.post("/:id/accept",   acceptRequest);     // accept member
router.post("/:id/reject",   rejectRequest);     // reject member
router.post("/:id/message",  sendMessage);       // send chat message
router.get("/:id/messages",  getMessages);       // get messages (poll)
router.post("/:id/leave",    leavePod);          // leave / close pod

export default router;

// In server.js: app.use("/api/pods", podRoutes);