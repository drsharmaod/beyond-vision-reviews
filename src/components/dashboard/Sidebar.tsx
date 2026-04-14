// src/components/dashboard/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Session } from "next-auth";
import {
  LayoutDashboard, Upload, MapPin, Bell, Mail, Settings,
  LogOut, Eye, ChevronRight, FileText,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",   label: "Dashboard",  icon: LayoutDashboard, roles: ["ADMIN","LOCATION_MANAGER","STAFF"] },
  { href: "/imports",     label: "CSV Import",  icon: Upload,          roles: ["ADMIN","LOCATION_MANAGER"] },
  { href: "/alerts",      label: "Alerts",      icon: Bell,            roles: ["ADMIN","LOCATION_MANAGER"] },
  { href: "/locations",   label: "Locations",   icon: MapPin,          roles: ["ADMIN"] },
  { href: "/templates",   label: "Templates",   icon: Mail,            roles: ["ADMIN"] },
  { href: "/audit",       label: "Audit Log",   icon: FileText,        roles: ["ADMIN"] },
  { href: "/settings",    label: "Settings",    icon: Settings,        roles: ["ADMIN"] },
];

interface Props { session: Session; }

export function DashboardSidebar({ session }: Props) {
  const pathname = usePathname();
  const role     = (session.user as any).role as string;

  const visibleNav = NAV.filter((n) => n.roles.includes(role));

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-brand-dark border-r border-brand-border shrink-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Eye size={16} className="text-black" />
          </div>
          <div>
            <div className="font-display text-sm font-bold text-white tracking-widest uppercase">Beyond Vision</div>
            <div className="text-gold-500 text-[9px] tracking-[0.4em] uppercase">Reviews</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                isActive
                  ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                  : "text-brand-text hover:text-white hover:bg-brand-card"
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "shrink-0 transition-colors",
                  isActive ? "text-gold-400" : "text-brand-text group-hover:text-white"
                )}
              />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={12} className="text-gold-500/60" />}
            </Link>
          );
        })}
      </nav>

      {/* User + Sign out */}
      <div className="px-3 py-4 border-t border-brand-border space-y-1">
        <div className="px-3 py-2">
          <p className="text-white text-sm font-medium truncate">{session.user?.name ?? "User"}</p>
          <p className="text-brand-text text-xs truncate">{session.user?.email}</p>
          <span className="inline-block mt-1 text-[10px] text-gold-500/70 uppercase tracking-wider border border-gold-500/20 px-1.5 py-0.5 rounded">
            {role.replace("_", " ")}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-brand-text hover:text-red-400 hover:bg-red-500/5 transition-all group"
        >
          <LogOut size={15} className="shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
