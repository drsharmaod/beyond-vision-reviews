// src/app/(dashboard)/dashboard/page.tsx
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Star, TrendingUp, TrendingDown, Mail, MessageSquare,
  AlertTriangle, ExternalLink, RefreshCw, Minus,
} from "lucide-react";
import { cn, formatPercent, formatDate } from "@/lib/utils";

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, trend, trendLabel, color = "gold",
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; trend?: number; trendLabel?: string;
  color?: "gold" | "green" | "red" | "blue";
}) {
  const colorMap = {
    gold:  "text-gold-400 bg-gold-500/10 border-gold-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    red:   "text-red-400 bg-red-500/10 border-red-500/20",
    blue:  "text-blue-400 bg-blue-500/10 border-blue-500/20",
  };
  const isUp = trend !== undefined && trend > 0;
  const isDn = trend !== undefined && trend < 0;

  return (
    <div className="card-dark card-hover p-5">
      <div className="flex items-start justify-between mb-4">
        <span className="text-xs text-brand-text uppercase tracking-wider">{label}</span>
        <div className={cn("p-2 rounded-lg border", colorMap[color])}>
          <Icon size={14} />
        </div>
      </div>
      <div className="text-3xl font-display font-semibold text-white mb-1">{value}</div>
      {sub && <p className="text-xs text-brand-text/70">{sub}</p>}
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {isUp ? <TrendingUp size={11} className="text-green-400" />
            : isDn ? <TrendingDown size={11} className="text-red-400" />
            : <Minus size={11} className="text-brand-text/50" />}
          <span className={cn("text-xs", isUp ? "text-green-400" : isDn ? "text-red-400" : "text-brand-text/50")}>
            {isUp ? "+" : ""}{trend} {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-brand-card border border-brand-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-brand-text mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ── Star distribution bar ─────────────────────────────────────────────────────
function StarBar({ star, count, pct }: { star: number; count: number; pct: number }) {
  const isHigh = star >= 4;
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-xs text-brand-text w-6 text-right">{star}★</span>
      <div className="flex-1 bg-brand-dark rounded-full h-2.5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: isHigh
              ? "linear-gradient(90deg, #C9A84C, #e4c06e)"
              : star === 3 ? "#f59e0b"
              : "#ef4444",
          }}
        />
      </div>
      <span className="text-xs text-brand-text/70 w-8 text-right">{count}</span>
      <span className="text-xs text-brand-text/40 w-9 text-right">{pct}%</span>
    </div>
  );
}

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const [days, setDays] = useState(30);

  const summaryQ = useQuery({
    queryKey: ["dashboard-summary", days],
    queryFn: async () => {
      const r = await fetch(`/api/dashboard/summary?days=${days}`);
      return (await r.json()).data;
    },
  });

  const ratingsQ = useQuery({
    queryKey: ["dashboard-ratings", days],
    queryFn: async () => {
      const r = await fetch(`/api/dashboard/ratings?days=${days}`);
      return (await r.json()).data;
    },
  });

  const locationsQ = useQuery({
    queryKey: ["dashboard-locations", days],
    queryFn: async () => {
      const r = await fetch(`/api/dashboard/locations?days=${days}`);
      return (await r.json()).data;
    },
  });

  const s = summaryQ.data;
  const r = ratingsQ.data;
  const isLoading = summaryQ.isLoading;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Dashboard</h1>
          <p className="text-brand-text text-sm mt-0.5">
            {s?.lastImportDate
              ? `Last import ${formatDate(s.lastImportDate)}`
              : "No imports yet"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg border transition",
                days === d
                  ? "bg-gold-500/10 text-gold-400 border-gold-500/20"
                  : "text-brand-text border-brand-border hover:text-white hover:border-brand-muted"
              )}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={() => { summaryQ.refetch(); ratingsQ.refetch(); locationsQ.refetch(); }}
            className="p-1.5 rounded-lg text-brand-text hover:text-white border border-brand-border hover:border-brand-muted transition"
          >
            <RefreshCw size={14} className={cn(summaryQ.isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Feedback Sent"
          value={isLoading ? "—" : s?.totalFeedbackSent ?? 0}
          sub={`${days}-day window`}
          icon={Mail}
          color="blue"
        />
        <KpiCard
          label="Response Rate"
          value={isLoading ? "—" : `${s?.responseRate ?? 0}%`}
          sub={`${s?.totalResponses ?? 0} responses`}
          icon={MessageSquare}
          trend={s?.weekOverWeek?.responses}
          trendLabel="vs prev period"
          color="gold"
        />
        <KpiCard
          label="Average Rating"
          value={isLoading ? "—" : `${s?.averageRating ?? "—"} ★`}
          sub={`${s?.positiveCount ?? 0} positive · ${s?.negativeCount ?? 0} negative`}
          icon={Star}
          trend={s?.weekOverWeek?.rating}
          trendLabel="stars"
          color="gold"
        />
        <KpiCard
          label="Open Alerts"
          value={isLoading ? "—" : s?.openAlerts ?? 0}
          sub="Require follow-up"
          icon={AlertTriangle}
          color={s?.openAlerts > 0 ? "red" : "green"}
        />
      </div>

      {/* Review clicks banner */}
      {s?.googleReviewClicks > 0 && (
        <div className="card-dark p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <ExternalLink size={14} className="text-green-400" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">{s.googleReviewClicks} Google review click{s.googleReviewClicks !== 1 ? "s" : ""}</p>
              <p className="text-brand-text text-xs">Patients directed to leave a public review</p>
            </div>
          </div>
          <span className="text-xs text-green-400 border border-green-500/20 px-2 py-1 rounded-full bg-green-500/5">
            {s.totalResponses > 0
              ? `${Math.round((s.googleReviewClicks / s.totalResponses) * 100)}% click-through`
              : ""}
          </span>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="lg:col-span-2 card-dark p-5">
          <h3 className="text-sm font-medium text-white mb-4">Feedback Trend</h3>
          {r?.trend?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={r.trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPositive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gNegative" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#555", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="positive" name="Positive" stroke="#C9A84C" fill="url(#gPositive)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" fill="url(#gNegative)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-brand-text/40 text-sm">
              No data for this period
            </div>
          )}
        </div>

        {/* Star distribution */}
        <div className="card-dark p-5">
          <h3 className="text-sm font-medium text-white mb-5">Rating Distribution</h3>
          <div className="space-y-3">
            {r?.distribution?.length
              ? [...r.distribution].reverse().map((d: any) => (
                  <StarBar key={d.star} {...d} />
                ))
              : [5, 4, 3, 2, 1].map((s) => <StarBar key={s} star={s} count={0} pct={0} />)
            }
          </div>
        </div>
      </div>

      {/* Location performance table */}
      <div className="card-dark overflow-hidden">
        <div className="px-5 py-4 border-b border-brand-border">
          <h3 className="text-sm font-medium text-white">Location Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border">
                {["Location", "Sent", "Responses", "Resp. Rate", "Avg Rating", "Positive", "Negative", "Open Alerts"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-brand-text/60 uppercase tracking-wider font-normal">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {locationsQ.data?.map((loc: any) => (
                <tr key={loc.locationId} className="border-b border-brand-border/50 hover:bg-brand-card/50 transition">
                  <td className="px-5 py-3">
                    <div className="font-medium text-white">{loc.locationName}</div>
                    <div className="text-xs text-brand-text/50 mt-0.5">{loc.locationCode}</div>
                  </td>
                  <td className="px-5 py-3 text-brand-text">{loc.totalSent}</td>
                  <td className="px-5 py-3 text-brand-text">{loc.totalResponses}</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs font-medium", loc.responseRate >= 30 ? "text-green-400" : "text-yellow-400")}>
                      {loc.responseRate}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-gold-500" fill="#C9A84C" />
                      <span className="text-white font-medium">{loc.averageRating || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="badge-positive">{loc.positiveCount}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={loc.negativeCount > 0 ? "badge-negative" : "text-brand-text/40 text-xs"}>
                      {loc.negativeCount > 0 ? loc.negativeCount : "0"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {loc.openAlerts > 0
                      ? <span className="badge-negative">{loc.openAlerts}</span>
                      : <span className="text-green-400/60 text-xs">✓ Clear</span>
                    }
                  </td>
                </tr>
              ))}
              {!locationsQ.data?.length && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-brand-text/40 text-sm">
                    No location data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
