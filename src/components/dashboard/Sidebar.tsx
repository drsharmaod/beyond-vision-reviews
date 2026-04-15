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

const NAV = [
  { href: "/dashboard",  label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN","LOCATION_MANAGER","STAFF"] },
  { href: "/imports",    label: "CSV Import", icon: Upload,          roles: ["ADMIN","LOCATION_MANAGER"] },
  { href: "/alerts",     label: "Alerts",     icon: Bell,            roles: ["ADMIN","LOCATION_MANAGER"] },
  { href: "/locations",  label: "Locations",  icon: MapPin,          roles: ["ADMIN"] },
  { href: "/templates",  label: "Templates",  icon: Mail,            roles: ["ADMIN"] },
  { href: "/audit",      label: "Audit Log",  icon: FileText,        roles: ["ADMIN"] },
  { href: "/settings",   label: "Settings",   icon: Settings,        roles: ["ADMIN"] },
];

interface Props { session: Session; }

export function DashboardSidebar({ session }: Props) {
  const pathname = usePathname();
  const role     = (session.user as any).role as string;
  const visibleNav = NAV.filter((n) => n.roles.includes(role));

  return (
    <aside style={{
      width: 256,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      backgroundColor: "#141414",
      borderRight: "1px solid #2a2a2a",
      height: "100vh",
      overflowY: "auto",
    }}>
      {/* Logo */}
<div style={{
  padding: "20px 24px",
  borderBottom: "1px solid #2a2a2a",
  textAlign: "center",
}}>
  <img
    src="https://beyondvision.ca/wp-content/uploads/2017/08/logo-white.png"
    alt="Beyond Vision"
    style={{ width: "140px", maxWidth: "100%", display: "block", margin: "0 auto" }}
  />
  <div style={{
    fontSize: 9, color: "#C9A84C",
    letterSpacing: "0.4em", textTransform: "uppercase",
    marginTop: 8,
  }}>
    REVIEWS
  </div>
</div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {visibleNav.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 2,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "#C9A84C" : "#b0b0b0",
                backgroundColor: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                border: isActive ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#1a1a1a";
                  (e.currentTarget as HTMLElement).style.color = "#ffffff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#b0b0b0";
                }
              }}
            >
              <Icon size={15} style={{ flexShrink: 0, color: isActive ? "#C9A84C" : "inherit" }} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={11} style={{ color: "rgba(201,168,76,0.5)" }} />}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid #2a2a2a" }}>
        <div style={{ padding: "8px 12px", marginBottom: 4 }}>
          <p style={{ color: "#ffffff", fontSize: 13, fontWeight: 500, margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.user?.name ?? "User"}
          </p>
          <p style={{ color: "#888", fontSize: 11, margin: "0 0 6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.user?.email}
          </p>
          <span style={{
            display: "inline-block", fontSize: 9, color: "rgba(201,168,76,0.7)",
            textTransform: "uppercase", letterSpacing: "0.1em",
            border: "1px solid rgba(201,168,76,0.2)", padding: "2px 6px", borderRadius: 4,
          }}>
            {role.replace("_", " ")}
          </span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            display: "flex", width: "100%", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 8,
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "#888",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#f87171";
            (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#888";
            (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
          }}
        >
          <LogOut size={14} style={{ flexShrink: 0 }} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
