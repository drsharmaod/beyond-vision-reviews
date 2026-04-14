// src/app/api/audit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page      = parseInt(searchParams.get("page")  ?? "1");
  const limit     = parseInt(searchParams.get("limit") ?? "50");
  const eventType = searchParams.get("eventType") ?? undefined;
  const skip      = (page - 1) * limit;

  const where: any = {};
  if (eventType) where.eventType = eventType;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}
