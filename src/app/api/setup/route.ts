import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function GET() {
  const hash = await bcrypt.hash("bvision1800", 12);
  await prisma.user.update({
    where: { email: "sharma@beyondvision.ca" },
    data: { password: hash },
  });
  return NextResponse.json({ done: true });
}