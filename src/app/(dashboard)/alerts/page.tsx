// src/app/(dashboard)/alerts/page.tsx
"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle, ChevronDown, ChevronUp, CheckCircle2,
  Clock, MapPin, Star, MessageSquare, Phone, Mail,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

type ResolutionStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

const STATUS_STYLES: Record<ResolutionStatus, string> = {
  OPEN:        "text-red-400 bg-red-500/10 border-red-500/20",
  IN_PROGRESS: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  RESOLVED:    "text-green-400 bg-green-500/10 border-green-500/20",
  DISMISSED:   "text-brand-text/50 bg-brand-dark border-brand-border",
};

// ── Alert detail card ─────────────────────────────────────────────────────────
function AlertCard({ alert }: { alert: any }) {
  const [open,  setOpen]  = useState(false);
  const [notes, setNotes] = useState(alert.managerNotes ?? "");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const response = alert.feedbackResponse;
  const visit    = response?.feedbackRequest?.examVisit;
  const patient  = visit?.patient;

  async function updateAlert(status?: ResolutionStatus) {
    setSaving(true);
    try {
      await fetch(`/api/alerts/${alert.id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...(status && { resolutionStatus: status }),
          managerNotes: notes,
        }),
      });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    } finally {
      setSaving(false);
    }
  }

  const isOpen = alert.resolutionStatus === "OPEN";

  return (
    <div className={cn(
      "card-dark overflow-hidden transition-all",
      isOpen && "border-red-500/20"
    )}>
      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-brand-card/50 transition"
        onClick={() => setOpen(!open)}
      >
        {/* Rating badge */}
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 font-bold text-sm shrink-0">
          {response?.rating}★
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-medium truncate">
              {patient?.firstName} {patient?.lastName}
            </p>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full border shrink-0",
              STATUS_STYLES[alert.resolutionStatus as ResolutionStatus]
            )}>
              {alert.resolutionStatus.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-brand-text/60">
            <span className="flex items-center gap-1">
              <MapPin size={10} /> {alert.location?.name}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} /> {formatDate(alert.createdAt)}
            </span>
            {response?.comment && (
              <span className="flex items-center gap-1 text-yellow-500/60">
                <MessageSquare size={10} /> Has comment
              </span>
            )}
          </div>
        </div>

        {open ? <ChevronUp size={16} className="text-brand-text/40 shrink-0" />
               : <ChevronDown size={16} className="text-brand-text/40 shrink-0" />}
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-brand-border px-5 py-5 space-y-5 animate-fadeIn">
          {/* Patient info grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: Mail,    label: "Email",      value: patient?.email },
              { icon: Phone,   label: "Phone",      value: patient?.phone ?? "—" },
              { icon: MapPin,  label: "Location",   value: alert.location?.name },
              { icon: Clock,   label: "Exam Date",  value: formatDate(visit?.examDate) },
              { icon: Star,    label: "Rating",     value: `${response?.rating} / 5 stars` },
              { icon: Clock,   label: "Submitted",  value: formatDate(response?.respondedAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-brand-dark rounded-lg p-3 border border-brand-border">
                <div className="flex items-center gap-1.5 text-brand-text/50 text-xs mb-1">
                  <Icon size={10} /> {label}
                </div>
                <p className="text-white text-sm font-medium truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Patient comment */}
          {response?.comment && (
            <div className="bg-brand-dark border-l-2 border-red-500/40 rounded-r-lg p-4">
              <p className="text-xs text-red-400/70 uppercase tracking-wider mb-2">Patient Comment</p>
              <p className="text-brand-text text-sm leading-relaxed italic">"{response.comment}"</p>
            </div>
          )}

          {/* Manager notes */}
          <div>
            <label className="block text-xs text-brand-text uppercase tracking-wider mb-2">
              Manager Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add follow-up notes, actions taken, outcome…"
              className="w-full bg-brand-dark border border-brand-border rounded-lg px-4 py-3 text-white text-sm placeholder:text-brand-text/40 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/20 transition resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            {(["OPEN", "IN_PROGRESS", "RESOLVED", "DISMISSED"] as ResolutionStatus[])
              .filter((s) => s !== alert.resolutionStatus)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => updateAlert(s)}
                  disabled={saving}
                  className={cn(
                    "text-xs px-3 py-2 rounded-lg border transition disabled:opacity-50",
                    s === "RESOLVED"
                      ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/15"
                      : s === "IN_PROGRESS"
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/15"
                      : "text-brand-text border-brand-border hover:text-white hover:border-brand-muted"
                  )}
                >
                  {saving ? "Saving…" : `Mark ${s.replace("_", " ").toLowerCase()}`}
                </button>
              ))
            }
            <button
              onClick={() => updateAlert()}
              disabled={saving || notes === alert.managerNotes}
              className="text-xs px-3 py-2 rounded-lg gold-gradient text-black font-medium disabled:opacity-40 transition"
            >
              Save Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AlertsPage() {
  const [statusFilter,   setStatusFilter]   = useState<string>("OPEN");
  const [locationFilter, setLocationFilter] = useState<string>("");

  const locationsQ = useQuery({
    queryKey: ["locations"],
    queryFn:  async () => (await (await fetch("/api/locations")).json()).data,
  });

  const alertsQ = useQuery({
    queryKey: ["alerts", statusFilter, locationFilter],
    queryFn:  async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter)   params.set("status",   statusFilter);
      if (locationFilter) params.set("location", locationFilter);
      return (await (await fetch(`/api/alerts?${params}`)).json()).data;
    },
    refetchInterval: 30_000,
  });

  const alerts    = alertsQ.data?.alerts ?? [];
  const total     = alertsQ.data?.pagination?.total ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white">Feedback Alerts</h1>
          <p className="text-brand-text text-sm mt-0.5">
            Private negative feedback requiring follow-up
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertTriangle size={13} className="text-red-400" />
            <span className="text-red-400 text-sm font-medium">{total} alert{total !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1">
          {["OPEN", "IN_PROGRESS", "RESOLVED", ""].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg border transition",
                statusFilter === s
                  ? "bg-gold-500/10 text-gold-400 border-gold-500/20"
                  : "text-brand-text border-brand-border hover:text-white"
              )}
            >
              {s || "All"}
            </button>
          ))}
        </div>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="bg-brand-dark border border-brand-border text-brand-text text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-gold-500"
        >
          <option value="">All Locations</option>
          {locationsQ.data?.map((l: any) => (
            <option key={l.id} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Alert list */}
      {alertsQ.isLoading ? (
        <div className="card-dark p-8 text-center text-brand-text/40 text-sm">Loading alerts…</div>
      ) : alerts.length === 0 ? (
        <div className="card-dark p-12 text-center">
          <CheckCircle2 size={32} className="text-green-400/40 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">No alerts found</p>
          <p className="text-brand-text/50 text-sm">
            {statusFilter === "OPEN" ? "All feedback has been addressed." : "No alerts match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert: any) => <AlertCard key={alert.id} alert={alert} />)}
        </div>
      )}
    </div>
  );
}
