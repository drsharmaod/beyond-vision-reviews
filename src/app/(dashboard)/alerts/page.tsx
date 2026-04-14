"use client";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, ChevronUp, CheckCircle2, Clock, MapPin, Star, MessageSquare, Phone, Mail } from "lucide-react";

const ff = "var(--font-inter, system-ui, sans-serif)";

function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" });
}

type ResolutionStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

const STATUS_COLORS: Record<ResolutionStatus, { text: string; bg: string; border: string }> = {
  OPEN:        { text: "#f87171", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.2)" },
  IN_PROGRESS: { text: "#facc15", bg: "rgba(234,179,8,0.1)",    border: "rgba(234,179,8,0.2)" },
  RESOLVED:    { text: "#4ade80", bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.2)" },
  DISMISSED:   { text: "#555555", bg: "rgba(42,42,42,0.5)",     border: "#2a2a2a" },
};

function AlertCard({ alert }: { alert: any }) {
  const [open,   setOpen]   = useState(false);
  const [notes,  setNotes]  = useState(alert.managerNotes ?? "");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const response = alert.feedbackResponse;
  const visit    = response?.feedbackRequest?.examVisit;
  const patient  = visit?.patient;
  const status   = alert.resolutionStatus as ResolutionStatus;
  const sc       = STATUS_COLORS[status];

  async function updateAlert(newStatus?: ResolutionStatus) {
    setSaving(true);
    try {
      await fetch(`/api/alerts/${alert.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(newStatus && { resolutionStatus: newStatus }), managerNotes: notes }),
      });
      qc.invalidateQueries({ queryKey: ["alerts"] });
    } finally { setSaving(false); }
  }

  return (
    <div style={{
      backgroundColor: "#1a1a1a",
      border: `1px solid ${status === "OPEN" ? "rgba(239,68,68,0.2)" : "#2a2a2a"}`,
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Summary row */}
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#f87171", fontWeight: 700, fontSize: 13,
        }}>
          {response?.rating}★
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p style={{ color: "#ffffff", fontWeight: 500, fontSize: 14, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
              {patient?.firstName} {patient?.lastName}
            </p>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 9999, flexShrink: 0,
              color: sc.text, backgroundColor: sc.bg, border: `1px solid ${sc.border}`,
            }}>
              {status.replace("_", " ")}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#666" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={10} /> {alert.location?.name}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> {formatDate(alert.createdAt)}</span>
            {response?.comment && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(234,179,8,0.6)" }}>
                <MessageSquare size={10} /> Has comment
              </span>
            )}
          </div>
        </div>
        {open ? <ChevronUp size={15} color="#555" /> : <ChevronDown size={15} color="#555" />}
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: "1px solid #2a2a2a", padding: 20 }}>
          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { icon: Mail,   label: "Email",    value: patient?.email },
              { icon: Phone,  label: "Phone",    value: patient?.phone ?? "—" },
              { icon: MapPin, label: "Location", value: alert.location?.name },
              { icon: Clock,  label: "Exam Date",value: formatDate(visit?.examDate) },
              { icon: Star,   label: "Rating",   value: `${response?.rating} / 5 stars` },
              { icon: Clock,  label: "Submitted",value: formatDate(response?.respondedAt) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{ backgroundColor: "#141414", borderRadius: 8, padding: 12, border: "1px solid #2a2a2a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#555", fontSize: 10, marginBottom: 6 }}>
                  <Icon size={10} /> {label}
                </div>
                <p style={{ color: "#ffffff", fontSize: 13, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Comment */}
          {response?.comment && (
            <div style={{
              backgroundColor: "#141414",
              borderLeft: "2px solid rgba(239,68,68,0.4)",
              borderRadius: "0 8px 8px 0",
              padding: 16, marginBottom: 16,
            }}>
              <p style={{ fontSize: 10, color: "rgba(248,113,113,0.7)", textTransform: "uppercase" as const, letterSpacing: "0.1em", marginBottom: 8 }}>Patient Comment</p>
              <p style={{ color: "#b0b0b0", fontSize: 13, lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>"{response.comment}"</p>
            </div>
          )}

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 10, color: "#666", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 8, fontWeight: 500 }}>
              Manager Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add follow-up notes, actions taken, outcome…"
              style={{
                width: "100%", boxSizing: "border-box" as const,
                backgroundColor: "#111", border: "1px solid #2a2a2a",
                borderRadius: 8, padding: "12px 16px",
                color: "#ffffff", fontSize: 13, lineHeight: 1.6,
                resize: "none" as const, outline: "none", fontFamily: ff,
              }}
              onFocus={(e) => { e.target.style.borderColor = "#C9A84C"; }}
              onBlur={(e) => { e.target.style.borderColor = "#2a2a2a"; }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {(["OPEN", "IN_PROGRESS", "RESOLVED", "DISMISSED"] as ResolutionStatus[])
              .filter((s) => s !== status)
              .map((s) => {
                const c = STATUS_COLORS[s];
                return (
                  <button key={s} onClick={() => updateAlert(s)} disabled={saving} style={{
                    fontSize: 11, padding: "8px 14px", borderRadius: 8,
                    border: `1px solid ${c.border}`,
                    backgroundColor: c.bg, color: c.text,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.5 : 1,
                    fontFamily: ff,
                    transition: "opacity 0.15s",
                  }}>
                    {saving ? "Saving…" : `Mark ${s.replace("_", " ").toLowerCase()}`}
                  </button>
                );
              })}
            <button onClick={() => updateAlert()} disabled={saving || notes === alert.managerNotes} style={{
              fontSize: 11, padding: "8px 14px", borderRadius: 8,
              background: "linear-gradient(135deg, #C9A84C, #a8862e)",
              color: "#000", border: "none", fontWeight: 600,
              cursor: saving || notes === alert.managerNotes ? "not-allowed" : "pointer",
              opacity: saving || notes === alert.managerNotes ? 0.4 : 1,
              fontFamily: ff,
            }}>
              Save Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const [statusFilter,   setStatusFilter]   = useState<string>("OPEN");
  const [locationFilter, setLocationFilter] = useState<string>("");

  const locationsQ = useQuery({
    queryKey: ["locations"],
    queryFn: async () => (await (await fetch("/api/locations")).json()).data,
  });

  const alertsQ = useQuery({
    queryKey: ["alerts", statusFilter, locationFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "50" });
      if (statusFilter)   params.set("status",   statusFilter);
      if (locationFilter) params.set("location", locationFilter);
      return (await (await fetch(`/api/alerts?${params}`)).json()).data;
    },
    refetchInterval: 30_000,
  });

  const alerts = alertsQ.data?.alerts ?? [];
  const total  = alertsQ.data?.pagination?.total ?? 0;

  return (
    <div style={{ maxWidth: 900, fontFamily: ff }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 26, fontWeight: 600, color: "#ffffff", margin: "0 0 4px" }}>Feedback Alerts</h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>Private negative feedback requiring follow-up</p>
        </div>
        {total > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8 }}>
            <AlertTriangle size={13} color="#f87171" />
            <span style={{ color: "#f87171", fontSize: 13, fontWeight: 500 }}>{total} alert{total !== 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {["OPEN", "IN_PROGRESS", "RESOLVED", ""].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              fontSize: 11, padding: "7px 14px", borderRadius: 8,
              border: `1px solid ${statusFilter === s ? "rgba(201,168,76,0.3)" : "#2a2a2a"}`,
              backgroundColor: statusFilter === s ? "rgba(201,168,76,0.1)" : "transparent",
              color: statusFilter === s ? "#C9A84C" : "#888",
              cursor: "pointer", fontFamily: ff, transition: "all 0.15s",
            }}>
              {s || "All"}
            </button>
          ))}
        </div>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{
            backgroundColor: "#141414", border: "1px solid #2a2a2a",
            color: "#b0b0b0", fontSize: 11, borderRadius: 8,
            padding: "7px 14px", outline: "none", fontFamily: ff,
          }}
        >
          <option value="">All Locations</option>
          {locationsQ.data?.map((l: any) => (
            <option key={l.id} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* Alert list */}
      {alertsQ.isLoading ? (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 32, textAlign: "center", color: "#444", fontSize: 13 }}>
          Loading alerts…
        </div>
      ) : alerts.length === 0 ? (
        <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: 48, textAlign: "center" }}>
          <CheckCircle2 size={32} color="rgba(74,222,128,0.4)" style={{ margin: "0 auto 12px" }} />
          <p style={{ color: "#ffffff", fontWeight: 500, margin: "0 0 6px" }}>No alerts found</p>
          <p style={{ color: "#555", fontSize: 13, margin: 0 }}>
            {statusFilter === "OPEN" ? "All feedback has been addressed." : "No alerts match this filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map((alert: any) => <AlertCard key={alert.id} alert={alert} />)}
        </div>
      )}
    </div>
  );
}
