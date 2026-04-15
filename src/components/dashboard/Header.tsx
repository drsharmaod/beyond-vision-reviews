// src/components/dashboard/Header.tsx
"use client";
import { Session } from "next-auth";
import { Bell, Menu } from "lucide-react";
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

  function toggleSidebar() {
    const sidebar = document.getElementById("bv-sidebar");
    if (sidebar) sidebar.classList.toggle("open");
  }

  return (
    <>
      <style>{`
        .bv-hamburger { display: none; }
        .bv-mobile-logo { display: none; }
        .bv-desktop-name { display: block; }
        @media (max-width: 767px) {
          .bv-hamburger { display: flex !important; }
          .bv-mobile-logo { display: block !important; }
          .bv-desktop-name { display: none !important; }
        }
      `}</style>

      <header style={{
        height: 56,
        backgroundColor: "#141414",
        borderBottom: "1px solid #2a2a2a",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: 12,
        flexShrink: 0,
      }}>
        {/* Hamburger — mobile only */}
        <button
          className="bv-hamburger"
          onClick={toggleSidebar}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#888", padding: 4,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Menu size={22} />
        </button>

        {/* Mobile logo text */}
        <span className="bv-mobile-logo" style={{
          fontSize: 14, fontWeight: 700, color: "#ffffff",
          letterSpacing: "0.1em", textTransform: "uppercase",
          fontFamily: "var(--font-playfair, Georgia, serif)",
        }}>
          Beyond Vision
        </span>

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
            }}
          >
            <Bell size={12} />
            <span>{openAlerts} alert{openAlerts !== 1 ? "s" : ""}</span>
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
          <span className="bv-desktop-name" style={{ fontSize: 13, color: "#b0b0b0" }}>
            {session.user?.name}
          </span>
        </div>
      </header>
    </>
  );
}
