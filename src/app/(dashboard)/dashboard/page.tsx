"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Star, TrendingUp, TrendingDown, Mail, MessageSquare,
  AlertTriangle, ExternalLink, RefreshCw, Minus,
} from "lucide-react";

const ff = "var(--font-inter, system-ui, sans-serif)";
const ffD = "var(--font-playfair, Georgia, serif)";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, trend, trendLabel, color = "gold" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; trend?: number; trendLabel?: string;
  color?: "gold" | "green" | "red" | "blue";
}) {
  const colorMap: Record<string, { text: string; bg: string; border: string }> = {
    gold:  { text: "#e4ae3b", bg: "rgba(201,168,76,0.1)",   border: "rgba(201,168,76,0.2)" },
    green: { text: "#4ade80", bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.2)" },
    red:   { text: "#f87171", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.2)" },
    blue:  { text: "#60a5fa", bg: "rgba(59,130,246,0.1)",   border: "rgba(59,130,246,0.2)" },
  };
  const c = colorMap[color];
  const isUp = trend !== undefined && trend > 0;
  const isDn = trend !== undefined && trend < 0;

  return (
    <div style={{
      backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12,
      padding: 20, transition: "border-color 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: "#b0b0b0", textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
        <div style={{ padding: 8, borderRadius: 8, backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
          <Icon size={14} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontFamily: ffD, fontWeight: 600, color: "#ffffff", marginBottom: 4 }}>{value}</div>
      {sub && <p style={{ fontSize: 11, color: "#888", margin: "0 0 4px" }}>{sub}</p>}
      {trend !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
          {isUp ? <TrendingUp size={11} color="#4ade80" /> : isDn ? <TrendingDown size={11} color="#f87171" /> : <Minus size={11} color="#555" />}
          <span style={{ fontSize: 11, color: isUp ? "#4ade80" : isDn ? "#f87171" : "#555" }}>
            {isUp ? "+" : ""}{trend} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Chart tooltip ─────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <p style={{ color: "#888", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, margin: 0 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ── Star bar ──────────────────────────────────────────────────────────────────
function StarBar({ star, count, pct }: { star: number; count: number; pct: number }) {
  const isHigh = star >= 4;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 11, color: "#888", width: 24, textAlign: "right" }}>{star}★</span>
      <div style={{ flex: 1, backgroundColor: "#141414", borderRadius: 9999, height: 8, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 9999,
          width: `${pct}%`,
          background: isHigh ? "linear-gradient(90deg, #C9A84C, #e4c06e)" : star === 3 ? "#f59e0b" : "#ef4444",
          transition: "width 0.7s ease",
        }} />
      </div>
      <span style={{ fontSize: 11, color: "#666", width: 28, textAlign: "right" }}>{count}</span>
      <span style={{ fontSize: 11, color: "#444", width: 36, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [days, setDays] = useState(30);

  const summaryQ = useQuery({
    queryKey: ["dashboard-summary", days],
    queryFn: async () => { const r = await fetch(`/api/dashboard/summary?days=${days}`); return (await r.json()).data; },
  });
  const ratingsQ = useQuery({
    queryKey: ["dashboard-ratings", days],
    queryFn: async () => { const r = await fetch(`/api/dashboard/ratings?days=${days}`); return (await r.json()).data; },
  });
  const locationsQ = useQuery({
    queryKey: ["dashboard-locations", days],
    queryFn: async () => { const r = await fetch(`/api/dashboard/locations?days=${days}`); return (await r.json()).data; },
  });

  const s = summaryQ.data;
  const r = ratingsQ.data;
  const isLoading = summaryQ.isLoading;

  return (
    <div style={{ maxWidth: 1200, fontFamily: ff }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: ffD, fontSize: 26, fontWeight: 600, color: "#ffffff", margin: "0 0 4px" }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>
            {s?.lastImportDate ? `Last import ${formatDate(s.lastImportDate)}` : "No imports yet"}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} style={{
              fontSize: 12, padding: "6px 12px", borderRadius: 8,
              border: `1px solid ${days === d ? "rgba(201,168,76,0.3)" : "#2a2a2a"}`,
              backgroundColor: days === d ? "rgba(201,168,76,0.1)" : "transparent",
              color: days === d ? "#C9A84C" : "#888",
              cursor: "pointer", transition: "all 0.15s", fontFamily: ff,
            }}>{d}d</button>
          ))}
          <button
            onClick={() => { summaryQ.refetch(); ratingsQ.refetch(); locationsQ.refetch(); }}
            style={{
              padding: 8, borderRadius: 8, border: "1px solid #2a2a2a",
              backgroundColor: "transparent", color: "#888", cursor: "pointer",
              display: "flex", alignItems: "center",
            }}
          >
            <RefreshCw size={13} style={{ animation: summaryQ.isFetching ? "spin 1s linear infinite" : "none" }} />
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        <KpiCard label="Feedback Sent" value={isLoading ? "—" : s?.totalFeedbackSent ?? 0}
          sub={`${days}-day window`} icon={Mail} color="blue" />
        <KpiCard label="Response Rate" value={isLoading ? "—" : `${s?.responseRate ?? 0}%`}
          sub={`${s?.totalResponses ?? 0} responses`} icon={MessageSquare}
          trend={s?.weekOverWeek?.responses} trendLabel="vs prev period" color="gold" />
        <KpiCard label="Average Rating" value={isLoading ? "—" : `${s?.averageRating ?? "—"} ★`}
          sub={`${s?.positiveCount ?? 0} positive · ${s?.negativeCount ?? 0} negative`}
          icon={Star} trend={s?.weekOverWeek?.rating} trendLabel="stars" color="gold" />
        <KpiCard label="Open Alerts" value={isLoading ? "—" : s?.openAlerts ?? 0}
          sub="Require follow-up" icon={AlertTriangle}
          color={s?.openAlerts > 0 ? "red" : "green"} />
      </div>

      {/* Google clicks banner */}
      {s?.googleReviewClicks > 0 && (
        <div style={{
          backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12,
          padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ padding: 8, borderRadius: 8, backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <ExternalLink size={14} color="#4ade80" />
            </div>
            <div>
              <p style={{ color: "#ffffff", fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>
                {s.googleReviewClicks} Google review click{s.googleReviewClicks !== 1 ? "s" : ""}
              </p>
              <p style={{ color: "#888", fontSize: 11, margin: 0 }}>Patients directed to leave a public review</p>
            </div>
          </div>
          <span style={{ fontSize: 11, color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", padding: "4px 10px", borderRadius: 9999, backgroundColor: "rgba(34,197,94,0.05)" }}>
            {s.totalResponses > 0 ? `${Math.round((s.googleReviewClicks / s.totalResponses) * 100)}% click-through` : ""}
          </span>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 24 }}>
        {/* Trend */}
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", margin: "0 0 16px" }}>Feedback Trend</h3>
          {r?.trend?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={r.trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="positive" name="Positive" stroke="#C9A84C" fill="url(#gPos)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" fill="url(#gNeg)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 13 }}>
              No data for this period
            </div>
          )}
        </div>

        {/* Rating distribution */}
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", margin: "0 0 20px" }}>Rating Distribution</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {r?.distribution?.length
              ? [...r.distribution].reverse().map((d: any) => <StarBar key={d.star} {...d} />)
              : [5,4,3,2,1].map((s) => <StarBar key={s} star={s} count={0} pct={0} />)
            }
          </div>
        </div>
      </div>

      {/* Location table */}
      <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #2a2a2a" }}>
          <h3 style={{ fontSize: 13, fontWeight: 500, color: "#ffffff", margin: 0 }}>Location Performance</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                {["Location", "Sent", "Responses", "Resp. Rate", "Avg Rating", "Positive", "Negative", "Open Alerts"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 20px", fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locationsQ.data?.map((loc: any) => (
                <tr key={loc.locationId} style={{ borderBottom: "1px solid rgba(42,42,42,0.5)" }}>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ fontWeight: 500, color: "#ffffff" }}>{loc.locationName}</div>
                    <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{loc.locationCode}</div>
                  </td>
                  <td style={{ padding: "12px 20px", color: "#b0b0b0" }}>{loc.totalSent}</td>
                  <td style={{ padding: "12px 20px", color: "#b0b0b0" }}>{loc.totalResponses}</td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: loc.responseRate >= 30 ? "#4ade80" : "#facc15" }}>
                      {loc.responseRate}%
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={11} fill="#C9A84C" color="#C9A84C" />
                      <span style={{ color: "#ffffff", fontWeight: 500 }}>{loc.averageRating || "—"}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <span style={{ fontSize: 11, backgroundColor: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 8px", borderRadius: 9999 }}>
                      {loc.positiveCount}
                    </span>
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    {loc.negativeCount > 0
                      ? <span style={{ fontSize: 11, backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", padding: "2px 8px", borderRadius: 9999 }}>{loc.negativeCount}</span>
                      : <span style={{ fontSize: 11, color: "#444" }}>0</span>
                    }
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    {loc.openAlerts > 0
                      ? <span style={{ fontSize: 11, backgroundColor: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)", padding: "2px 8px", borderRadius: 9999 }}>{loc.openAlerts}</span>
                      : <span style={{ fontSize: 11, color: "rgba(74,222,128,0.6)" }}>✓ Clear</span>
                    }
                  </td>
                </tr>
              ))}
              {!locationsQ.data?.length && (
                <tr>
                  <td colSpan={8} style={{ padding: "32px 20px", textAlign: "center", color: "#444", fontSize: 13 }}>
                    No location data yet — import patients to see performance metrics
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
