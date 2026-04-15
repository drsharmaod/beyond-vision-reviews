import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function GET() {
  const hash = await bcrypt.hash("BVAdmin2026!", 12);
  await prisma.user.updateMany({
    where: { email: { in: ["thpoon@beyondvision.ca", "kady@kadenave.com"] } },
    data: { password: hash },
  });
  return NextResponse.json({ done: true });
}
