// src/app/api/templates/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  subject:  z.string().min(1).optional(),
  htmlBody: z.string().min(1).optional(),
  textBody: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

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

  const template = await prisma.emailTemplate.update({
    where: { id: params.id },
    data:  parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      eventType:   "TEMPLATE_UPDATED",
      entityType:  "EmailTemplate",
      entityId:    params.id,
      metadata:    { templateType: template.templateType },
    },
  });

  return NextResponse.json({ success: true, data: template });
}
