// src/app/api/review/[responseId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/review/:responseId — track click then redirect to Google
export async function GET(
  req: NextRequest,
  { params }: { params: { responseId: string } }
) {
  const { responseId } = params;

  const response = await prisma.feedbackResponse.findUnique({
    where: { id: responseId },
    include: {
      feedbackRequest: {
        include: {
          examVisit: { include: { location: true } },
        },
      },
    },
  });

  if (!response || response.rating < 4) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/feedback/invalid`);
  }

  const reviewUrl = response.feedbackRequest.examVisit.location.reviewLink;
  const ip        = req.headers.get("x-forwarded-for") ?? null;

  // Log the click
  await prisma.reviewClick.create({
    data: {
      feedbackResponseId: responseId,
      destinationUrl:     reviewUrl,
      ipAddress:          ip,
    },
  });

  await prisma.auditLog.create({
    data: {
      eventType:  "REVIEW_LINK_CLICKED",
      entityType: "FeedbackResponse",
      entityId:   responseId,
      metadata:   { destinationUrl: reviewUrl },
      ipAddress:  ip,
    },
  });

  return NextResponse.redirect(reviewUrl);
}
