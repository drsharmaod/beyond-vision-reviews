// src/app/(dashboard)/audit/page.tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cn, formatDate } from "@/lib/utils";

const EVENT_COLORS: Record<string, string> = {
  USER_LOGIN:         "text-blue-400",
  IMPORT_CREATED:     "text-gold-400",
  EMAIL_SENT:         "text-green-400",
  RATING_SUBMITTED:   "text-yellow-400",
  REVIEW_LINK_CLICKED:"text-green-400",
  REVIEW_PROMPT_SENT: "text-gold-400",
  INTERNAL_ALERT_SENT:"text-red-400",
  ALERT_UPDATED:      "text-yellow-400",
  LOCATION_CREATED:   "text-gold-400",
  LOCATION_UPDATED:   "text-gold-400",
  SETTINGS_UPDATED:   "text-blue-400",
  TEMPLATE_UPDATED:   "text-blue-400",
};

async function fetchLogs(page: number, event: string) {
  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (event) params.set("eventType", event);
  const r = await fetch(`/api/audit?${params}`);
  return (await r.json()).data;
}

export default function AuditPage() {
  const [page, setPage]   = useState(1);
  const [event, setEvent] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit", page, event],
    queryFn:  () => fetchLogs(page, event),
  });

  const logs  = data?.logs ?? [];
  const total = data?.pagination?.total ?? 0;
  const pages = data?.pagination?.pages ?? 1;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Audit Log</h1>
          <p className="text-brand-text text-sm mt-0.5">{total} events recorded</p>
        </div>
        <select
          value={event}
          onChange={(e) => { setEvent(e.target.value); setPage(1); }}
          className="bg-brand-dark border border-brand-border text-brand-text text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-gold-500"
        >
          <option value="">All Events</option>
          {Object.keys(EVENT_COLORS).map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="card-dark overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border">
              {["Event", "Entity", "Actor", "Details", "Date"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs text-brand-text/50 uppercase tracking-wider font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={5} className="px-5 py-8 text-center text-brand-text/40">Loading…</td></tr>
              : logs.length === 0
              ? <tr><td colSpan={5} className="px-5 py-8 text-center text-brand-text/40">No events found</td></tr>
              : logs.map((log: any) => (
                <tr key={log.id} className="border-b border-brand-border/40 hover:bg-brand-card/30 transition">
                  <td className="px-5 py-3">
                    <span className={cn("text-xs font-mono font-medium", EVENT_COLORS[log.eventType] ?? "text-brand-text")}>
                      {log.eventType}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-brand-text/70 text-xs">
                    <span>{log.entityType}</span>
                    {log.entityId && <span className="text-brand-text/30 ml-1">…{log.entityId.slice(-6)}</span>}
                  </td>
                  <td className="px-5 py-3 text-brand-text/70 text-xs">
                    {log.actor?.name ?? log.actor?.email ?? "System"}
                  </td>
                  <td className="px-5 py-3 text-brand-text/50 text-xs font-mono max-w-[260px] truncate">
                    {log.metadata ? JSON.stringify(log.metadata).slice(0, 80) : "—"}
                  </td>
                  <td className="px-5 py-3 text-brand-text/50 text-xs">
                    {formatDate(log.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-brand-border">
            <span className="text-xs text-brand-text/50">Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-xs px-3 py-1.5 border border-brand-border rounded text-brand-text hover:text-white disabled:opacity-30 transition">
                Previous
              </button>
              <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                className="text-xs px-3 py-1.5 border border-brand-border rounded text-brand-text hover:text-white disabled:opacity-30 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
