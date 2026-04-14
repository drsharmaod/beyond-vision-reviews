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
    queryFn:  async () => {
      const r = await fetch("/api/alerts?status=OPEN&limit=1");
      const j = await r.json();
      return j.data?.pagination?.total ?? 0;
    },
    refetchInterval: 60_000,
  });

  const openAlerts = data ?? 0;

  return (
    <header className="h-14 bg-brand-dark border-b border-brand-border flex items-center px-6 gap-4 shrink-0">
      {/* Mobile menu trigger (omitted handler for brevity) */}
      <button className="lg:hidden text-brand-text hover:text-white transition">
        <Menu size={20} />
      </button>

      <div className="flex-1" />

      {/* Alert badge */}
      {openAlerts > 0 && (
        <Link
          href="/alerts"
          className="relative flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs hover:bg-red-500/15 transition"
        >
          <Bell size={13} className="animate-pulse" />
          <span>{openAlerts} open alert{openAlerts !== 1 ? "s" : ""}</span>
        </Link>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-black text-xs font-bold">
          {(session.user?.name ?? "U")[0].toUpperCase()}
        </div>
        <span className="hidden md:block text-sm text-brand-text">{session.user?.name}</span>
      </div>
    </header>
  );
}
