// src/lib/queue/index.ts
import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ── Queue names ───────────────────────────────────────────────────────────────

export const QUEUE_NAMES = {
  SEND_FEEDBACK:   "send-feedback",
  PROCESS_RATING:  "process-rating",
  SEND_ALERT:      "send-alert",
} as const;

// ── Job types ─────────────────────────────────────────────────────────────────

export interface SendFeedbackJob {
  examVisitId: string;
}

export interface ProcessRatingJob {
  feedbackResponseId: string;
}

export interface SendAlertJob {
  internalAlertId: string;
}

// ── Queues ────────────────────────────────────────────────────────────────────

export const feedbackQueue = new Queue<SendFeedbackJob>(QUEUE_NAMES.SEND_FEEDBACK, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const ratingQueue = new Queue<ProcessRatingJob>(QUEUE_NAMES.PROCESS_RATING, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: 100,
  },
});

export const alertQueue = new Queue<SendAlertJob>(QUEUE_NAMES.SEND_ALERT, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// ── Enqueue helpers ───────────────────────────────────────────────────────────

export async function enqueueFeedbackSend(
  examVisitId: string,
  delayMs?: number
): Promise<void> {
  await feedbackQueue.add(
    "send-feedback",
    { examVisitId },
    delayMs ? { delay: delayMs } : undefined
  );
}

export async function enqueueProcessRating(feedbackResponseId: string): Promise<void> {
  await ratingQueue.add("process-rating", { feedbackResponseId });
}

export async function enqueueSendAlert(internalAlertId: string): Promise<void> {
  await alertQueue.add("send-alert", { internalAlertId });
}

export { connection as redisConnection };
