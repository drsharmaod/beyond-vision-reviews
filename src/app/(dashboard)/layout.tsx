// src/app/(dashboard)/layout.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div style={{
      display: "flex",
      height: "100vh",
      backgroundColor: "#0a0a0a",
      overflow: "hidden",
    }}>
      <DashboardSidebar session={session} />
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <DashboardHeader session={session} />
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px",
          backgroundColor: "#0a0a0a",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
