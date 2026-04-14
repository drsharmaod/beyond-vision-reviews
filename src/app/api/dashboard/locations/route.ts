// src/app/api/dashboard/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { subDays, startOfDay } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30");
  const since = startOfDay(subDays(new Date(), days));

  const locations = await prisma.location.findMany({
    where: { isActive: true },
    include: {
      feedbackRequests: {
        where: { createdAt: { gte: since } },
        include: { feedbackResponse: true },
      },
      internalAlerts: {
        where: { resolutionStatus: "OPEN" },
      },
    },
  });

  const performance = locations.map((loc) => {
    const sent      = loc.feedbackRequests.length;
    const responses = loc.feedbackRequests.filter((r) => r.feedbackResponse).length;
    const ratings   = loc.feedbackRequests
      .filter((r) => r.feedbackResponse)
      .map((r) => r.feedbackResponse!.rating);

    const avg = ratings.length > 0 ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0;

    return {
      locationId:    loc.id,
      locationName:  loc.name,
      locationCode:  loc.code,
      totalSent:     sent,
      totalResponses: responses,
      responseRate:  sent > 0 ? Math.round((responses / sent) * 1000) / 10 : 0,
      averageRating: Math.round(avg * 100) / 100,
      positiveCount: ratings.filter((r) => r >= 4).length,
      negativeCount: ratings.filter((r) => r <= 3).length,
      openAlerts:    loc.internalAlerts.length,
    };
  });

  return NextResponse.json({ success: true, data: performance });
}
