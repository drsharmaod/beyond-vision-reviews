// src/app/api/feedback/respond/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyFeedbackToken } from "@/lib/tokens";
import prisma from "@/lib/prisma";
import { enqueueProcessRating } from "@/lib/queue";

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
    include: { feedbackResponse: true },
  });

  if (!feedbackRequest) {
    return NextResponse.json({ success: false, error: "Feedback request not found" }, { status: 404 });
  }

  if (feedbackRequest.feedbackResponse) {
    // Already submitted — idempotent: return existing
    return NextResponse.json({
      success:    true,
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

  // Enqueue follow-up processing (positive review prompt or negative alert)
  await enqueueProcessRating(response.id);

  await prisma.auditLog.create({
    data: {
      eventType:  "RATING_SUBMITTED",
      entityType: "FeedbackResponse",
      entityId:   response.id,
      metadata:   { rating, sentiment, hasComment: !!comment },
      ipAddress:  ip,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      responseId: response.id,
      rating,
      sentiment,
    },
  });
}
