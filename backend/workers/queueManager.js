/**
 * queueManager.js
 *
 * Dual-driver queue with auto-fallback:
 *   - If REDIS_URL is set AND Redis is reachable  → BullMQ + ioredis
 *   - Otherwise                                   → MongoDB VerificationJob polling
 *
 * Public API (same interface regardless of driver):
 *   initQueue()                  - call once on server start
 *   enqueueVerificationJob(data) - add a verification job
 */

import { Queue, Worker, UnrecoverableError } from "bullmq";
import VerificationJob from "../models/VerificationJob.js";
import Duel from "../models/Duel.js";
import User from "../models/User.js";
import { fetchLeetCodeSubmissionsWithRetry, recordSolveAndFinalize } from "../controllers/duelController.js";
import { startVerificationWorker } from "./verificationWorker.js";
import { isRedisConfigured, createRedisClient, checkRedisHealth } from "../config/redis.js";
import { getIO } from "../socket.js";

const QUEUE_NAME = "leetcode-verification";

let bullQueue = null;        // BullMQ Queue producer (Redis driver)
let bullWorker = null;       // BullMQ Worker consumer (Redis driver)
let usingRedis = false;      // which driver is active

// ─── Redis / BullMQ Driver ────────────────────────────────────────────────────

const buildBullWorker = (connection) => {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { roomId, userId, leetcodeUsername } = job.data;
      console.log(`[BullMQ] Processing job ${job.id} – room ${roomId}, user ${userId}`);

      const duel = await Duel.findOne({ roomId });
      const user = await User.findById(userId);

      if (!duel || !user) {
        // No point retrying – throw UnrecoverableError to discard the job
        throw new UnrecoverableError(`[BullMQ] Duel or User not found for room ${roomId}`);
      }

      // Already solved on a previous attempt – nothing to do
      const alreadySolved = duel.results.some(
        (r) => (r.user?._id || r.user)?.toString() === userId.toString()
      );
      if (alreadySolved) {
        console.log(`[BullMQ] Job ${job.id}: user already solved, skipping.`);
        return { alreadySolved: true };
      }

      // Try fetching LeetCode submissions
      const submissions = await fetchLeetCodeSubmissionsWithRetry(leetcodeUsername, 2, 1500);
      const duelStartUnix = Math.floor(new Date(duel.startTime).getTime() / 1000) - 300;
      const validSolve = submissions.find(
        (s) => s.titleSlug === duel.problemSlug && parseInt(s.timestamp) >= duelStartUnix
      );

      if (!validSolve) {
        // Check how long the duel has been running
        const hoursSinceStart =
          (Date.now() - new Date(duel.startTime).getTime()) / (1000 * 60 * 60);

        if (hoursSinceStart > 3) {
          throw new UnrecoverableError(
            `[BullMQ] Duel over 3 hours old and no solve found. Giving up.`
          );
        }

        // Throw a normal error so BullMQ retries with exponential backoff
        throw new Error(`[BullMQ] Accepted submission not yet visible on LeetCode for ${leetcodeUsername}`);
      }

      // Record the solve
      await recordSolveAndFinalize(duel, user, validSolve);

      // Mirror status in MongoDB (useful for admin dashboards / debugging)
      await VerificationJob.findOneAndUpdate(
        { roomId, userId },
        { status: "COMPLETED", lastError: null },
        { upsert: true }
      ).catch(() => {});

      // Notify room via socket
      try {
        getIO().to(`duel-${roomId}`).emit("solve_verified_queued", {
          roomId,
          userId,
          message: "Your delayed verification completed successfully!",
        });
      } catch (sockErr) {
        console.warn("[BullMQ] Socket broadcast error:", sockErr.message);
      }

      console.log(`[BullMQ] Job ${job.id} completed: solve verified for ${leetcodeUsername} in room ${roomId}`);
      return { verified: true };
    },
    {
      connection,
      concurrency: 5,
      attempts: 10,
      backoff: {
        type: "exponential",
        delay: 10_000, // first retry after 10 s, then 20 s, 40 s … capped by BullMQ at ~1 h
      },
    }
  );

  worker.on("failed", (job, err) => {
    console.warn(`[BullMQ] Job ${job?.id} failed (attempt ${job?.attemptsMade}):`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[BullMQ] Worker error:", err.message);
  });

  return worker;
};

// ─── Public: initQueue ────────────────────────────────────────────────────────

export const initQueue = async () => {
  if (isRedisConfigured()) {
    console.log("[Queue] REDIS_URL found. Checking Redis connectivity …");
    const healthy = await checkRedisHealth();

    if (healthy) {
      // Two separate connections are required by BullMQ (one for queue, one for worker)
      const producerConn = createRedisClient();
      const workerConn   = createRedisClient();

      producerConn.on("error", (err) =>
        console.warn("[BullMQ] Producer connection error:", err.message)
      );
      workerConn.on("error", (err) =>
        console.warn("[BullMQ] Worker connection error:", err.message)
      );

      bullQueue  = new Queue(QUEUE_NAME, { connection: producerConn });
      bullWorker = buildBullWorker(workerConn);
      usingRedis = true;

      console.log("[Queue] ✅ Using BullMQ + Redis driver (distributed queue).");
      return;
    }

    console.warn("[Queue] ⚠️  Redis is configured but unreachable. Falling back to MongoDB.");
  } else {
    console.log("[Queue] No REDIS_URL set. Using MongoDB polling driver.");
  }

  // ── MongoDB fallback ──
  startVerificationWorker(15_000);
  usingRedis = false;
  console.log("[Queue] ✅ Using MongoDB polling driver (15 s interval).");
};

// ─── Public: enqueueVerificationJob ──────────────────────────────────────────

/**
 * Adds a verification job to whichever driver is active.
 *
 * @param {{ roomId: string, userId: string, leetcodeUsername: string, lastError?: string }} data
 */
export const enqueueVerificationJob = async ({ roomId, userId, leetcodeUsername, lastError }) => {
  if (usingRedis && bullQueue) {
    // Idempotent: same roomId+userId won't be enqueued twice while the job is active
    const jobId = `${roomId}-${userId}`;
    await bullQueue.add(
      "verify",
      { roomId, userId, leetcodeUsername },
      {
        jobId,
        attempts: 10,
        backoff: { type: "exponential", delay: 10_000 },
        removeOnComplete: { age: 3600 },  // keep completed jobs for 1 hour
        removeOnFail: { age: 86400 },     // keep failed jobs for 24 hours
      }
    );
    console.log(`[Queue] BullMQ job enqueued: ${jobId}`);
  } else {
    // MongoDB fallback: upsert a VerificationJob document
    await VerificationJob.findOneAndUpdate(
      { roomId, userId },
      {
        roomId,
        userId,
        leetcodeUsername,
        status: "PENDING",
        lastError: lastError ?? null,
        nextRetryAt: new Date(Date.now() + 5_000),
        $inc: { attempts: 1 },
      },
      { upsert: true, new: true }
    );
    console.log(`[Queue] MongoDB job upserted for room ${roomId}, user ${userId}`);
  }
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────

export const shutdownQueue = async () => {
  if (bullWorker) await bullWorker.close();
  if (bullQueue)  await bullQueue.close();
  console.log("[Queue] Shut down cleanly.");
};

