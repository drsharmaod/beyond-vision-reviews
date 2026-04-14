// src/components/dashboard/Header.tsx
"use client";
import { Session } from "next-auth";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

interface Props { session: Session; }

export function DashboardHeader({ session }: Props) {
  const { data } = useQuery({
    queryKey: ["alert-count"],
    queryFn: async () => {
      const r = await fetch("/api/alerts?status=OPEN&limit=1");
      const j = await r.json();
      return j.data?.pagination?.total ?? 0;
    },
    refetchInterval: 60_000,
  });

  const openAlerts = data ?? 0;
  const initials = (session.user?.name ?? "U")[0].toUpperCase();

  return (
    <header style={{
      height: 56,
      backgroundColor: "#141414",
      borderBottom: "1px solid #2a2a2a",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: 16,
      flexShrink: 0,
    }}>
      <div style={{ flex: 1 }} />

      {/* Alert badge */}
      {openAlerts > 0 && (
        <Link
          href="/alerts"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px",
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 8, color: "#f87171",
            fontSize: 12, textDecoration: "none",
            transition: "background-color 0.15s ease",
          }}
        >
          <Bell size={12} style={{ animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite" }} />
          <span>{openAlerts} open alert{openAlerts !== 1 ? "s" : ""}</span>
        </Link>
      )}

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: "50%",
          background: "linear-gradient(135deg, #C9A84C, #a8862e)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#000", fontSize: 12, fontWeight: 700, flexShrink: 0,
        }}>
          {initials}
        </div>
        <span style={{ fontSize: 13, color: "#b0b0b0" }}>{session.user?.name}</span>
      </div>
    </header>
  );
}
