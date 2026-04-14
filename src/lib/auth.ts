// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { UserRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { location: { select: { id: true, name: true, code: true } } },
        });

        if (!user || !user.password || !user.isActive) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // Audit log
        await prisma.auditLog.create({
          data: {
            actorUserId: user.id,
            eventType: "USER_LOGIN",
            entityType: "User",
            entityId: user.id,
            metadata: { email: user.email, role: user.role },
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          locationId: user.locationId,
          locationName: user.location?.name,
          locationCode: user.location?.code,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id;
        token.role       = (user as any).role;
        token.locationId = (user as any).locationId;
        token.locationName = (user as any).locationName;
        token.locationCode = (user as any).locationCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id           = token.id as string;
        (session.user as any).role         = token.role as UserRole;
        (session.user as any).locationId   = token.locationId as string | null;
        (session.user as any).locationName = token.locationName as string | null;
        (session.user as any).locationCode = token.locationCode as string | null;
      }
      return session;
    },
  },
};

// ── RBAC helpers ──────────────────────────────────────────────────────────────

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function isManager(role: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.LOCATION_MANAGER;
}

export function isStaff(role: UserRole): boolean {
  return true; // all roles can read
}

export function canManageLocations(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function canViewAllLocations(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}
