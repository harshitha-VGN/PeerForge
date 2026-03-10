import express from "express";
import {
  createPod, getAllPods, getPod,
  requestToJoin, acceptRequest, rejectRequest, dismissRejection,
  sendMessage, getMessages, leavePod, getMyPods,
  requestLeave, approveLeave, closePod, getClosedPods,
} from "../controllers/podController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/closed",               getClosedPods);
router.get("/",                     getAllPods);
router.get("/mine",                 getMyPods);
router.post("/",                    createPod);
router.get("/:id",                  getPod);
router.post("/:id/request",         requestToJoin);
router.post("/:id/accept",          acceptRequest);
router.post("/:id/reject",          rejectRequest);
router.post("/:id/dismiss-rejection", dismissRejection);
router.post("/:id/message",         sendMessage);
router.get("/:id/messages",         getMessages);
router.post("/:id/leave",           leavePod);
router.post("/:id/leave-request",   requestLeave);
router.post("/:id/approve-leave",   approveLeave);
router.post("/:id/close",           closePod);

export default router;