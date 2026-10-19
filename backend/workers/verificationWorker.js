import VerificationJob from "../models/VerificationJob.js";
import Duel from "../models/Duel.js";
import User from "../models/User.js";
import { fetchLeetCodeSubmissionsWithRetry, recordSolveAndFinalize } from "../controllers/duelController.js";

let workerInterval = null;

export const processVerificationQueue = async () => {
  try {
    const pendingJobs = await VerificationJob.find({
      status: "PENDING",
      attempts: { $lt: 10 },
      nextRetryAt: { $lte: new Date() },
    }).limit(5);

    if (!pendingJobs.length) return;

    for (const job of pendingJobs) {
      job.status = "PROCESSING";
      await job.save();

      try {
        const duel = await Duel.findOne({ roomId: job.roomId });
        const user = await User.findById(job.userId);

        if (!duel || !user) {
          job.status = "FAILED";
          job.lastError = "Duel or User not found";
          await job.save();
          continue;
        }

        // If user already solved (e.g. verified on another attempt)
        const alreadySolved = duel.results.some(
          (r) => (r.user?._id || r.user)?.toString() === job.userId.toString()
        );
        if (alreadySolved) {
          job.status = "COMPLETED";
          await job.save();
          continue;
        }

        // Attempt LeetCode query
        const submissions = await fetchLeetCodeSubmissionsWithRetry(job.leetcodeUsername, 2, 1000);
        const duelStartUnix = Math.floor(new Date(duel.startTime).getTime() / 1000) - 300;
        const validSolve = submissions.find(
          (s) => s.titleSlug === duel.problemSlug && parseInt(s.timestamp) >= duelStartUnix
        );

        if (validSolve) {
          await recordSolveAndFinalize(duel, user, validSolve);
          job.status = "COMPLETED";
          job.lastError = null;
          await job.save();
          console.log(`[VerificationWorker] Solved & verified for ${job.leetcodeUsername} in room ${job.roomId}`);
        } else {
          // If match started over 3 hours ago and still no solve, mark NOT_FOUND
          const hoursSinceStart = (Date.now() - new Date(duel.startTime).getTime()) / (1000 * 60 * 60);
          if (hoursSinceStart > 3 || job.attempts >= 9) {
            job.status = "NOT_FOUND";
            job.lastError = "Accepted submission not found on LeetCode";
          } else {
            job.status = "PENDING";
            job.attempts += 1;
            job.nextRetryAt = new Date(Date.now() + 20000); // Check again in 20s
          }
          await job.save();
        }
      } catch (err) {
        console.warn(`[VerificationWorker] Retry failed for job ${job._id}:`, err.message);
        job.attempts += 1;
        job.lastError = err.message;
        if (job.attempts >= 10) {
          job.status = "FAILED";
        } else {
          job.status = "PENDING";
          // Exponential backoff: 10s, 15s, 22s, 33s... up to 2 min
          const backoffDelay = Math.min(120000, Math.round(10000 * Math.pow(1.5, job.attempts)));
          job.nextRetryAt = new Date(Date.now() + backoffDelay);
        }
        await job.save();
      }
    }
  } catch (error) {
    console.error("[VerificationWorker] Error in queue processor:", error.message);
  }
};

export const startVerificationWorker = (intervalMs = 15000) => {
  if (workerInterval) return;
  console.log(`[VerificationWorker] Background verification worker started (polling every ${intervalMs / 1000}s)`);
  workerInterval = setInterval(processVerificationQueue, intervalMs);
};

export const stopVerificationWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
};
