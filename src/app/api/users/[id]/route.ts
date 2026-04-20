// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PATCH /api/users/[id] — update role, isActive, or reset password
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Admins only" }, { status: 403 });
  }

  const { id } = params;

  // Prevent admin from deactivating themselves
  if (id === (session.user as any).id) {
    return NextResponse.json({ success: false, error: "You cannot modify your own account here" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updateData: any = { updatedAt: new Date() };

    if (body.role     !== undefined) updateData.role     = body.role;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.name     !== undefined) updateData.name     = body.name;
    if (body.password !== undefined) {
      if (body.password.length < 8) {
        return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(body.password, 12);
    }

    const user = await prisma.user.update({
      where: { id },
      data:  updateData,
      select: { id: true, name: true, email: true, role: true, isActive: true, updatedAt: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: (session.user as any).id,
        eventType:   "USER_UPDATED",
        entityType:  "User",
        entityId:    id,
        metadata:    { changes: Object.keys(updateData).filter(k => k !== "updatedAt") },
      },
    });

    return NextResponse.json({ success: true, data: user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE /api/users/[id] — delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Admins only" }, { status: 403 });
  }

  const { id } = params;

  if (id === (session.user as any).id) {
    return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorUserId: (session.user as any).id,
        eventType:   "USER_DELETED",
        entityType:  "User",
        entityId:    id,
        metadata:    {},
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
