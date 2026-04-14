// src/app/api/dashboard/ratings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { subDays, startOfDay, format, eachDayOfInterval } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationCode = searchParams.get("location");
  const days = parseInt(searchParams.get("days") ?? "30");
  const since = startOfDay(subDays(new Date(), days));

  const locationFilter =
    session.user.role === "LOCATION_MANAGER"
      ? session.user.locationCode ?? locationCode
      : locationCode;

  let locId: string | undefined;
  if (locationFilter) {
    const loc = await prisma.location.findUnique({ where: { code: locationFilter } });
    locId = loc?.id;
  }

  // Star distribution
  const starGroups = await prisma.feedbackResponse.groupBy({
    by: ["rating"],
    where: {
      respondedAt: { gte: since },
      ...(locId ? { feedbackRequest: { locationId: locId } } : {}),
    },
    _count: { rating: true },
    orderBy: { rating: "asc" },
  });

  const totalResponses = starGroups.reduce((s, g) => s + g._count.rating, 0);
  const distribution = [1, 2, 3, 4, 5].map((star) => {
    const group = starGroups.find((g) => g.rating === star);
    const count = group?._count.rating ?? 0;
    return { star, count, pct: totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0 };
  });

  // Daily trend
  const responses = await prisma.feedbackResponse.findMany({
    where: {
      respondedAt: { gte: since },
      ...(locId ? { feedbackRequest: { locationId: locId } } : {}),
    },
    select: { rating: true, respondedAt: true },
    orderBy: { respondedAt: "asc" },
  });

  const interval = eachDayOfInterval({ start: since, end: new Date() });
  const dailyMap = new Map<string, { positive: number; negative: number; total: number }>();
  for (const day of interval) {
    dailyMap.set(format(day, "yyyy-MM-dd"), { positive: 0, negative: 0, total: 0 });
  }

  for (const r of responses) {
    const key = format(r.respondedAt, "yyyy-MM-dd");
    const entry = dailyMap.get(key) ?? { positive: 0, negative: 0, total: 0 };
    entry.total++;
    if (r.rating >= 4) entry.positive++;
    else entry.negative++;
    dailyMap.set(key, entry);
  }

  const trend = Array.from(dailyMap.entries()).map(([date, counts]) => ({
    date,
    ...counts,
  }));

  return NextResponse.json({ success: true, data: { distribution, trend } });
}
