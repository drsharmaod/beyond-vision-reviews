// src/app/api/r/[token]/[rating]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyFeedbackToken } from "@/lib/tokens";
import prisma from "@/lib/prisma";

// GET /r/:token/:rating — clicked from email, captures rating and redirects
export async function GET(
  req: NextRequest,
  { params }: { params: { token: string; rating: string } }
) {
  const { token, rating: ratingStr } = params;
  const rating = parseInt(ratingStr);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Validate rating range
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return NextResponse.redirect(`${appUrl}/feedback/invalid`);
  }

  let payload;
  try {
    payload = verifyFeedbackToken(token);
  } catch {
    return NextResponse.redirect(`${appUrl}/feedback/expired`);
  }

  const feedbackRequest = await prisma.feedbackRequest.findUnique({
    where: { id: payload.feedbackRequestId },
    include: {
      feedbackResponse: true,
      examVisit: { include: { patient: true, location: true } },
    },
  });

  if (!feedbackRequest) {
    return NextResponse.redirect(`${appUrl}/feedback/invalid`);
  }

  // Already responded — redirect to the correct page
  if (feedbackRequest.feedbackResponse) {
    const existing = feedbackRequest.feedbackResponse;
    if (existing.rating >= 4) {
      return NextResponse.redirect(
        `${appUrl}/feedback/thank-you?responseId=${existing.id}&location=${feedbackRequest.examVisit.location.name}`
      );
    } else {
      return NextResponse.redirect(`${appUrl}/feedback/received?responseId=${existing.id}`);
    }
  }

  // Mark first click on feedback request
  if (!feedbackRequest.clickedAt) {
    await prisma.feedbackRequest.update({
      where: { id: feedbackRequest.id },
      data:  { clickedAt: new Date(), sendStatus: "CLICKED" },
    });
  }

  // Redirect to feedback page with pre-selected rating
  return NextResponse.redirect(
    `${appUrl}/feedback?token=${token}&rating=${rating}`
  );
}
