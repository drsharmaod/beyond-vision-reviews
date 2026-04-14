// src/app/api/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const locationSchema = z.object({
  name:         z.string().min(1).max(100),
  code:         z.string().min(1).max(50).toLowerCase().regex(/^[a-z0-9_]+$/, "Code must be lowercase alphanumeric with underscores"),
  reviewLink:   z.string().url("Must be a valid URL"),
  managerEmail: z.string().email("Must be a valid email"),
  managerName:  z.string().optional(),
  alertEmails:  z.array(z.string().email()).default([]),
  isActive:     z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const locations = await prisma.location.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { patients: true, examVisits: true } } },
  });

  return NextResponse.json({ success: true, data: locations });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const existing = await prisma.location.findUnique({ where: { code: parsed.data.code } });
  if (existing) {
    return NextResponse.json({ success: false, error: `Location code "${parsed.data.code}" already exists` }, { status: 409 });
  }

  const location = await prisma.location.create({ data: parsed.data });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      eventType:   "LOCATION_CREATED",
      entityType:  "Location",
      entityId:    location.id,
      metadata:    { name: location.name, code: location.code },
    },
  });

  return NextResponse.json({ success: true, data: location }, { status: 201 });
}
