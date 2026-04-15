// src/app/api/feedback/respond/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyFeedbackToken } from "@/lib/tokens";
import prisma from "@/lib/prisma";
import { sendPositiveFollowupEmail, sendNegativeAlertEmail } from "@/lib/email/sender";
import { format } from "date-fns";

const respondSchema = z.object({
  token:   z.string().min(1),
  rating:  z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

// POST /api/feedback/respond
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { token, rating, comment } = parsed.data;

  let payload;
  try {
    payload = verifyFeedbackToken(token);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
  }

  const feedbackRequest = await prisma.feedbackRequest.findUnique({
    where: { id: payload.feedbackRequestId },
    include: {
      feedbackResponse: true,
      examVisit: {
        include: {
          patient:  true,
          location: true,
        },
      },
    },
  });

  if (!feedbackRequest) {
    return NextResponse.json({ success: false, error: "Feedback request not found" }, { status: 404 });
  }

  if (feedbackRequest.feedbackResponse) {
    return NextResponse.json({
      success: true,
      data: {
        responseId: feedbackRequest.feedbackResponse.id,
        rating:     feedbackRequest.feedbackResponse.rating,
        already:    true,
      },
    });
  }

  const ip        = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;
  const sentiment = rating >= 4 ? "POSITIVE" : rating === 3 ? "NEUTRAL" : "NEGATIVE";

  const response = await prisma.feedbackResponse.create({
    data: {
      feedbackRequestId: feedbackRequest.id,
      rating,
      comment:    comment?.trim() || null,
      sentiment,
      respondedAt: new Date(),
      ipAddress:  ip,
      userAgent,
    },
  });

  await prisma.auditLog.create({
    data: {
      eventType:  "RATING_SUBMITTED",
      entityType: "FeedbackResponse",
      entityId:   response.id,
      metadata:   { rating, sentiment, hasComment: !!comment },
      ipAddress:  ip,
    },
  });

  // Process rating inline — no Redis queue needed
  try {
    const visit    = feedbackRequest.examVisit;
    const patient  = visit.patient;
    const location = visit.location;
    const settings = await prisma.systemSettings.findFirst();
    const appUrl   = process.env.NEXT_PUBLIC_APP_URL ?? "https://beyond-vision-reviews.vercel.app";

    if (rating >= 4) {
      // ── POSITIVE: send Google review follow-up email ────────────────────
      await sendPositiveFollowupEmail({
        to:           patient.email,
        firstName:    patient.firstName,
        locationName: location.name,
        rating,
        reviewLink:   location.reviewLink,
        comment:      comment ?? undefined,
        senderEmail:  settings?.defaultSenderEmail,
        senderName:   settings?.defaultSenderName,
      });

      await prisma.feedbackResponse.update({
        where: { id: response.id },
        data:  { reviewPromptShown: true },
      });

      await prisma.auditLog.create({
        data: {
          eventType:  "REVIEW_PROMPT_SENT",
          entityType: "FeedbackResponse",
          entityId:   response.id,
          metadata:   { rating },
        },
      });

    } else {
      // ── NEGATIVE: create alert and send internal email ──────────────────
      const alertRecipients = [
        location.managerEmail,
        ...(location.alertEmails ?? []),
      ].filter(Boolean) as string[];

      const uniqueRecipients = [...new Set(alertRecipients)];

      const alert = await prisma.internalAlert.create({
        data: {
          feedbackResponseId: response.id,
          locationId:    location.id,
          alertEmailTo:  uniqueRecipients,
          sendStatus:    "PENDING",
        },
      });

      const emailResult = await sendNegativeAlertEmail({
        to:           uniqueRecipients,
        firstName:    patient.firstName,
        lastName:     patient.lastName,
        patientEmail: patient.email,
        locationName: location.name,
        examDate:     format(visit.examDate, "MMMM d, yyyy"),
        rating,
        comment:      comment ?? undefined,
        timestamp:    format(new Date(), "PPpp"),
        dashboardUrl: `${appUrl}/alerts`,
      });

      await prisma.internalAlert.update({
        where: { id: alert.id },
        data: {
          sendStatus: emailResult.success ? "SENT" : "FAILED",
          sentAt:     emailResult.success ? new Date() : undefined,
        },
      });

      await prisma.feedbackResponse.update({
        where: { id: response.id },
        data:  { internalAlertSent: emailResult.success },
      });

      await prisma.auditLog.create({
        data: {
          eventType:  "INTERNAL_ALERT_SENT",
          entityType: "InternalAlert",
          entityId:   alert.id,
          metadata:   { rating, recipients: uniqueRecipients, success: emailResult.success },
        },
      });
    }
  } catch (processingErr: any) {
    console.error("Post-rating processing error:", processingErr.message);
    // Don't fail the response — patient already submitted successfully
  }

  return NextResponse.json({
    success: true,
    data: {
      responseId: response.id,
      rating,
      sentiment,
    },
  });
}
