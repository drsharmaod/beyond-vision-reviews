// src/app/api/locations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name:         z.string().min(1).max(100).optional(),
  reviewLink:   z.string().url().optional(),
  managerEmail: z.string().email().optional(),
  managerName:  z.string().optional(),
  alertEmails:  z.array(z.string().email()).optional(),
  isActive:     z.boolean().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const location = await prisma.location.findUnique({
    where: { id: params.id },
    include: { _count: { select: { patients: true, examVisits: true, feedbackRequests: true } } },
  });
  if (!location) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: location });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const location = await prisma.location.update({
    where: { id: params.id },
    data:  parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      eventType:   "LOCATION_UPDATED",
      entityType:  "Location",
      entityId:    location.id,
      metadata:    parsed.data,
    },
  });

  return NextResponse.json({ success: true, data: location });
}
