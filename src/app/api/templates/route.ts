// src/app/api/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.emailTemplate.findMany({ orderBy: { templateType: "asc" } });
  return NextResponse.json({ success: true, data: templates });
}
