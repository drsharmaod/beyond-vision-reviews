// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  defaultSenderEmail:       z.string().email().optional(),
  defaultSenderName:        z.string().min(1).max(100).optional(),
  duplicateSuppressionDays: z.number().int().min(1).max(365).optional(),
  sendDelayDays:            z.number().int().min(0).max(30).optional(),
  immediateSendEnabled:     z.boolean().optional(),
  brandingPrimaryColor:     z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  feedbackPageTitle:        z.string().min(1).max(200).optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.systemSettings.findFirst();
  return NextResponse.json({ success: true, data: settings });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const body   = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const settings = await prisma.systemSettings.upsert({
    where:  { id: "default" },
    update: parsed.data,
    create: { id: "default", ...parsed.data },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      eventType:   "SETTINGS_UPDATED",
      entityType:  "SystemSettings",
      entityId:    settings.id,
      metadata:    parsed.data,
    },
  });

  return NextResponse.json({ success: true, data: settings });
}
