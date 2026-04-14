// src/worker/index.ts
// Run with: ts-node --compiler-options '{"module":"CommonJS"}' src/worker/index.ts

import { Worker, Job } from "bullmq";
import { format } from "date-fns";
import prisma from "@/lib/prisma";
import {
  QUEUE_NAMES,
  SendFeedbackJob,
  ProcessRatingJob,
  SendAlertJob,
  redisConnection,
} from "@/lib/queue";
import {
  sendFeedbackRequestEmail,
  sendPositiveFollowupEmail,
  sendNegativeAlertEmail,
} from "@/lib/email/sender";
import { signFeedbackToken, buildRatingUrls, buildReviewUrl } from "@/lib/tokens";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ── Feedback send worker ──────────────────────────────────────────────────────

const feedbackWorker = new Worker<SendFeedbackJob>(
  QUEUE_NAMES.SEND_FEEDBACK,
  async (job: Job<SendFeedbackJob>) => {
    const { examVisitId } = job.data;

    const visit = await prisma.examVisit.findUnique({
      where: { id: examVisitId },
      include: {
        patient:  true,
        location: true,
      },
    });

    if (!visit) throw new Error(`ExamVisit ${examVisitId} not found`);
    if (visit.sendStatus === "SENT" || visit.sendStatus === "SUPPRESSED") {
      console.log(`Skipping ${examVisitId}: already ${visit.sendStatus}`);
      return;
    }

    const settings = await prisma.systemSettings.findFirst();

    // Sign feedback token
    const token = signFeedbackToken({
      feedbackRequestId: "", // will be set after creation
      examVisitId:       visit.id,
      patientEmail:      visit.patient.email,
      locationCode:      visit.location.code,
    });

    // Create feedback request record
    const feedbackRequest = await prisma.feedbackRequest.create({
      data: {
        examVisitId:  visit.id,
        locationId:   visit.locationId,
        emailTo:      visit.patient.email,
        emailFrom:    settings?.defaultSenderEmail ?? "feedback@beyondvision.ca",
        subject:      `How was your visit to ${visit.location.name}?`,
        token,
        sendStatus:   "PENDING",
      },
    });

    // Re-sign with correct feedbackRequestId
    const finalToken = signFeedbackToken({
      feedbackRequestId: feedbackRequest.id,
      examVisitId:       visit.id,
      patientEmail:      visit.patient.email,
      locationCode:      visit.location.code,
    });

    await prisma.feedbackRequest.update({
      where: { id: feedbackRequest.id },
      data:  { token: finalToken },
    });

    const ratingUrls = buildRatingUrls(finalToken, APP_URL);
    const examDateStr = format(visit.examDate, "MMMM d, yyyy");

    const emailResult = await sendFeedbackRequestEmail({
      to:           visit.patient.email,
      firstName:    visit.patient.firstName,
      locationName: visit.location.name,
      examDate:     examDateStr,
      patientEmail: visit.patient.email,
      ratingUrls,
      senderEmail:  settings?.defaultSenderEmail,
      senderName:   settings?.defaultSenderName,
    });

    if (emailResult.success) {
      await prisma.feedbackRequest.update({
        where: { id: feedbackRequest.id },
        data:  { sendStatus: "SENT", providerMessageId: emailResult.messageId },
      });
      await prisma.examVisit.update({
        where: { id: examVisitId },
        data:  { sendStatus: "SENT", sentAt: new Date() },
      });
      await prisma.auditLog.create({
        data: {
          eventType:  "EMAIL_SENT",
          entityType: "FeedbackRequest",
          entityId:   feedbackRequest.id,
          metadata:   { to: visit.patient.email, messageId: emailResult.messageId },
        },
      });
      console.log(`✅ Sent feedback email to ${visit.patient.email}`);
    } else {
      await prisma.feedbackRequest.update({
        where: { id: feedbackRequest.id },
        data:  { sendStatus: "FAILED" },
      });
      await prisma.examVisit.update({
        where: { id: examVisitId },
        data:  { sendStatus: "FAILED" },
      });
      throw new Error(`Email send failed: ${emailResult.error}`);
    }
  },
  { connection: redisConnection, concurrency: 5 }
);

// ── Rating processing worker ──────────────────────────────────────────────────

const ratingWorker = new Worker<ProcessRatingJob>(
  QUEUE_NAMES.PROCESS_RATING,
  async (job: Job<ProcessRatingJob>) => {
    const { feedbackResponseId } = job.data;

    const response = await prisma.feedbackResponse.findUnique({
      where: { id: feedbackResponseId },
      include: {
        feedbackRequest: {
          include: {
            examVisit: {
              include: {
                patient:  true,
                location: true,
              },
            },
          },
        },
      },
    });

    if (!response) throw new Error(`FeedbackResponse ${feedbackResponseId} not found`);

    const visit    = response.feedbackRequest.examVisit;
    const patient  = visit.patient;
    const location = visit.location;
    const settings = await prisma.systemSettings.findFirst();

    if (response.rating >= 4) {
      // ── POSITIVE: send Google review follow-up ──────────────────────────
      const reviewLink = location.reviewLink;

      const emailResult = await sendPositiveFollowupEmail({
        to:           patient.email,
        firstName:    patient.firstName,
        locationName: location.name,
        rating:       response.rating,
        reviewLink,
        comment:      response.comment ?? undefined,
        senderEmail:  settings?.defaultSenderEmail,
        senderName:   settings?.defaultSenderName,
      });

      await prisma.feedbackResponse.update({
        where: { id: feedbackResponseId },
        data:  { reviewPromptShown: true, sentiment: "POSITIVE" },
      });

      await prisma.auditLog.create({
        data: {
          eventType:  "REVIEW_PROMPT_SENT",
          entityType: "FeedbackResponse",
          entityId:   feedbackResponseId,
          metadata:   { rating: response.rating, emailSuccess: emailResult.success },
        },
      });

      console.log(`✅ Sent positive follow-up to ${patient.email} (${response.rating}★)`);
    } else {
      // ── NEGATIVE: send internal alert ──────────────────────────────────
      const alertRecipients = [location.managerEmail, ...(location.alertEmails ?? [])];
      const uniqueRecipients = [...new Set(alertRecipients)].filter(Boolean);

      const alert = await prisma.internalAlert.create({
        data: {
          feedbackResponseId,
          locationId:    location.id,
          alertEmailTo:  uniqueRecipients,
          sendStatus:    "PENDING",
        },
      });

      const examDateStr = format(visit.examDate, "MMMM d, yyyy");
      const timestamp   = format(new Date(), "PPpp");
      const dashboardUrl = `${APP_URL}/alerts/${alert.id}`;

      const emailResult = await sendNegativeAlertEmail({
        to:           uniqueRecipients,
        firstName:    patient.firstName,
        lastName:     patient.lastName,
        patientEmail: patient.email,
        locationName: location.name,
        examDate:     examDateStr,
        rating:       response.rating,
        comment:      response.comment ?? undefined,
        timestamp,
        dashboardUrl,
      });

      await prisma.internalAlert.update({
        where: { id: alert.id },
        data: {
          sendStatus: emailResult.success ? "SENT" : "FAILED",
          sentAt:     emailResult.success ? new Date() : undefined,
        },
      });

      await prisma.feedbackResponse.update({
        where: { id: feedbackResponseId },
        data:  { internalAlertSent: emailResult.success, sentiment: "NEGATIVE" },
      });

      await prisma.auditLog.create({
        data: {
          eventType:  "INTERNAL_ALERT_SENT",
          entityType: "InternalAlert",
          entityId:   alert.id,
          metadata:   { rating: response.rating, recipients: uniqueRecipients, success: emailResult.success },
        },
      });

      console.log(`⚠️  Sent negative alert for ${patient.email} (${response.rating}★) to ${uniqueRecipients.join(", ")}`);
    }
  },
  { connection: redisConnection, concurrency: 10 }
);

// ── Alert send worker (direct retries) ───────────────────────────────────────

const alertWorker = new Worker<SendAlertJob>(
  QUEUE_NAMES.SEND_ALERT,
  async (job: Job<SendAlertJob>) => {
    const { internalAlertId } = job.data;
    const alert = await prisma.internalAlert.findUnique({
      where: { id: internalAlertId },
      include: {
        feedbackResponse: {
          include: {
            feedbackRequest: {
              include: {
                examVisit: {
                  include: { patient: true, location: true },
                },
              },
            },
          },
        },
      },
    });

    if (!alert) throw new Error(`InternalAlert ${internalAlertId} not found`);
    if (alert.sendStatus === "SENT") return;

    const visit   = alert.feedbackResponse.feedbackRequest.examVisit;
    const patient = visit.patient;

    const result = await sendNegativeAlertEmail({
      to:           alert.alertEmailTo,
      firstName:    patient.firstName,
      lastName:     patient.lastName,
      patientEmail: patient.email,
      locationName: visit.location.name,
      examDate:     format(visit.examDate, "MMMM d, yyyy"),
      rating:       alert.feedbackResponse.rating,
      comment:      alert.feedbackResponse.comment ?? undefined,
      timestamp:    format(new Date(), "PPpp"),
      dashboardUrl: `${APP_URL}/alerts/${alert.id}`,
    });

    await prisma.internalAlert.update({
      where: { id: internalAlertId },
      data: {
        sendStatus: result.success ? "SENT" : "FAILED",
        sentAt:     result.success ? new Date() : undefined,
      },
    });
  },
  { connection: redisConnection }
);

// ── Error handlers ────────────────────────────────────────────────────────────

[feedbackWorker, ratingWorker, alertWorker].forEach((w) => {
  w.on("failed", (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });
  w.on("completed", (job) => {
    console.log(`✅ Job ${job.id} completed`);
  });
});

console.log("🚀 Beyond Vision email workers started");
console.log("   Queues: send-feedback, process-rating, send-alert");
