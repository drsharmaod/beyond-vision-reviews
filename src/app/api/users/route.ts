// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/users — list all users
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Admins only" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id:        true,
      name:      true,
      email:     true,
      role:      true,
      isActive:  true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, data: users });
}

// POST /api/users — create new user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Admins only" }, { status: 403 });
  }

  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ success: false, error: "A user with this email already exists" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hash,
        role,
        isActive: true,
      },
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: (session.user as any).id,
        eventType:   "USER_CREATED",
        entityType:  "User",
        entityId:    user.id,
        metadata:    { name, email, role },
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
