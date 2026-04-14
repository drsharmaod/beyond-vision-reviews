// src/app/api/alerts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  resolutionStatus: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "DISMISSED"]).optional(),
  managerNotes:     z.string().max(5000).optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const alert = await prisma.internalAlert.findUnique({
    where: { id: params.id },
    include: {
      location: true,
      feedbackResponse: {
        include: {
          feedbackRequest: {
            include: {
              examVisit: {
                include: {
                  patient: true,
                  location: true,
                },
              },
            },
          },
          reviewClicks: true,
        },
      },
    },
  });

  if (!alert) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  // Location managers can only see their own location's alerts
  if (
    session.user.role === "LOCATION_MANAGER" &&
    session.user.locationId !== alert.locationId
  ) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ success: true, data: alert });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const alert = await prisma.internalAlert.findUnique({ where: { id: params.id } });
  if (!alert) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  if (
    session.user.role === "LOCATION_MANAGER" &&
    session.user.locationId !== alert.locationId
  ) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const updateData: any = { ...parsed.data };
  if (parsed.data.resolutionStatus === "RESOLVED") {
    updateData.resolvedAt = new Date();
    updateData.resolvedByUserId = session.user.id;
  }

  const updated = await prisma.internalAlert.update({
    where: { id: params.id },
    data:  updateData,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      eventType:   "ALERT_UPDATED",
      entityType:  "InternalAlert",
      entityId:    params.id,
      metadata:    parsed.data,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
