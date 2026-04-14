// src/app/api/dashboard/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { subDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationCode = searchParams.get("location");
  const days         = parseInt(searchParams.get("days") ?? "30");

  const since = startOfDay(subDays(new Date(), days));
  const prevSince = startOfDay(subDays(new Date(), days * 2));

  // For location managers: restrict to their location
  const effectiveLocationCode =
    session.user.role === "LOCATION_MANAGER"
      ? session.user.locationCode ?? locationCode
      : locationCode;

  let locationFilter: any = {};
  if (effectiveLocationCode) {
    const loc = await prisma.location.findUnique({ where: { code: effectiveLocationCode } });
    if (loc) locationFilter = { locationId: loc.id };
  }

  const [
    totalSent,
    totalResponses,
    ratingAgg,
    positiveCount,
    negativeCount,
    openAlerts,
    reviewClicks,
    prevResponses,
    prevRatingAgg,
    prevClicks,
    lastImport,
  ] = await Promise.all([
    prisma.feedbackRequest.count({
      where: { ...locationFilter, createdAt: { gte: since }, sendStatus: { not: "PENDING" } },
    }),
    prisma.feedbackResponse.count({
      where: {
        ...locationFilter,
        respondedAt: { gte: since },
        feedbackRequest: locationFilter.locationId
          ? { locationId: locationFilter.locationId }
          : undefined,
      },
    }),
    prisma.feedbackResponse.aggregate({
      where: {
        respondedAt: { gte: since },
        feedbackRequest: locationFilter.locationId
          ? { locationId: locationFilter.locationId }
          : undefined,
      },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.feedbackResponse.count({
      where: {
        rating: { gte: 4 },
        respondedAt: { gte: since },
        feedbackRequest: locationFilter.locationId
          ? { locationId: locationFilter.locationId }
          : undefined,
      },
    }),
    prisma.feedbackResponse.count({
      where: {
        rating: { lte: 3 },
        respondedAt: { gte: since },
        feedbackRequest: locationFilter.locationId
          ? { locationId: locationFilter.locationId }
          : undefined,
      },
    }),
    prisma.internalAlert.count({
      where: { ...locationFilter, resolutionStatus: "OPEN" },
    }),
    prisma.reviewClick.count({
      where: {
        clickedAt: { gte: since },
        feedbackResponse: locationFilter.locationId
          ? { feedbackRequest: { locationId: locationFilter.locationId } }
          : undefined,
      },
    }),
    // Previous period for WoW
    prisma.feedbackResponse.count({
      where: {
        respondedAt: { gte: prevSince, lt: since },
        feedbackRequest: locationFilter.locationId
          ? { locationId: locationFilter.locationId }
          : undefined,
      },
    }),
    prisma.feedbackResponse.aggregate({
      where: {
        respondedAt: { gte: prevSince, lt: since },
        feedbackRequest: locationFilter.locationId
          ? { locationId: locationFilter.locationId }
          : undefined,
      },
      _avg: { rating: true },
    }),
    prisma.reviewClick.count({
      where: {
        clickedAt: { gte: prevSince, lt: since },
        feedbackResponse: locationFilter.locationId
          ? { feedbackRequest: { locationId: locationFilter.locationId } }
          : undefined,
      },
    }),
    prisma.patientImport.findFirst({ orderBy: { createdAt: "desc" } }),
  ]);

  const responseRate  = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0;
  const avgRating     = ratingAgg._avg.rating ?? 0;
  const prevAvgRating = prevRatingAgg._avg.rating ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      totalPatients:      totalSent,
      totalFeedbackSent:  totalSent,
      totalResponses,
      responseRate:       Math.round(responseRate * 10) / 10,
      averageRating:      Math.round(avgRating * 100) / 100,
      positiveCount,
      negativeCount,
      openAlerts,
      googleReviewClicks: reviewClicks,
      lastImportDate:     lastImport?.createdAt?.toISOString(),
      weekOverWeek: {
        responses: totalResponses - prevResponses,
        rating:    Math.round((avgRating - prevAvgRating) * 100) / 100,
        clicks:    reviewClicks - prevClicks,
      },
    },
  });
}
