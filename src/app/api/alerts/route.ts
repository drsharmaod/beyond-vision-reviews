// src/app/api/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status        = searchParams.get("status");      // "OPEN" | "RESOLVED" | etc.
  const locationCode  = searchParams.get("location");
  const page          = parseInt(searchParams.get("page")  ?? "1");
  const limit         = parseInt(searchParams.get("limit") ?? "20");
  const skip          = (page - 1) * limit;

  // Location managers see only their location
  const effectiveCode =
    session.user.role === "LOCATION_MANAGER"
      ? session.user.locationCode ?? undefined
      : locationCode ?? undefined;

  let locationId: string | undefined;
  if (effectiveCode) {
    const loc = await prisma.location.findUnique({ where: { code: effectiveCode } });
    locationId = loc?.id;
  }

  const where: any = {};
  if (locationId) where.locationId = locationId;
  if (status) where.resolutionStatus = status;

  const [alerts, total] = await Promise.all([
    prisma.internalAlert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        location: { select: { name: true, code: true } },
        feedbackResponse: {
          include: {
            feedbackRequest: {
              include: {
                examVisit: {
                  include: {
                    patient: {
                      select: { firstName: true, lastName: true, email: true, phone: true },
                    },
                    location: { select: { name: true, code: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.internalAlert.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      alerts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}
