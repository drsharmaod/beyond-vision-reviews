"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserPlus, Pencil, Trash2, ShieldCheck, ShieldOff,
  X, Check, Loader2, AlertCircle, KeyRound, Users,
} from "lucide-react";

const ff = "var(--font-inter, system-ui, sans-serif)";

const ROLES = ["ADMIN", "LOCATION_MANAGER", "STAFF"];

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ADMIN:            { bg: "rgba(201,168,76,0.1)",  text: "#C9A84C", border: "rgba(201,168,76,0.2)" },
  LOCATION_MANAGER: { bg: "rgba(96,165,250,0.1)",  text: "#60a5fa", border: "rgba(96,165,250,0.2)" },
  STAFF:            { bg: "rgba(156,163,175,0.1)", text: "#9ca3af", border: "rgba(156,163,175,0.2)" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box" as const,
  backgroundColor: "#141414", border: "1px solid #2a2a2a",
  borderRadius: 8, padding: "10px 14px",
  color: "#ffffff", fontSize: 13, fontFamily: ff,
  outline: "none",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none" as const,
};

interface User {
  id: string; name: string; email: string;
  role: string; isActive: boolean; createdAt: string;
}

interface ModalProps {
  onClose: () => void;
  onSuccess: () => void;
  user?: User;
}

function AddUserModal({ onClose, onSuccess }: ModalProps) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ADMIN" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      const r = await fetch("/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16,
        padding: 28, width: "100%", maxWidth: 440, fontFamily: ff,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ color: "#ffffff", fontSize: 16, fontWeight: 600, margin: 0 }}>Add New User</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 16, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { label: "Full Name", key: "name", type: "text", placeholder: "Dr. Jane Smith" },
            { label: "Email Address", key: "email", type: "email", placeholder: "jane@beyondvision.ca" },
            { label: "Temporary Password", key: "password", type: "password", placeholder: "Min. 8 characters" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 11, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
                onBlur={(e) => e.target.style.borderColor = "#2a2a2a"}
              />
            </div>
          ))}

          <div>
            <label style={{ display: "block", fontSize: 11, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              style={selectStyle}
              onFocus={(e) => e.target.style.borderColor = "#C9A84C"}
              onBlur={(e) => e.target.style.borderColor = "#2a2a2a"}
            >
              {ROLES.map(r => <option key={r} value={r} style={{ backgroundColor: "#141414" }}>{r.replace("_", " ")}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "10px 16px", borderRadius: 8,
            background: "none", border: "1px solid #2a2a2a",
            color: "#888", fontSize: 13, cursor: "pointer", fontFamily: ff,
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: "10px 16px", borderRadius: 8,
            background: "linear-gradient(135deg, #C9A84C, #a8862e)",
            border: "none", color: "#000", fontSize: 13, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: ff,
          }}>
            {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <UserPlus size={13} />}
            {loading ? "Creating…" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose, onSuccess }: ModalProps & { user: User }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    if (password !== confirm) { setError("Passwords do not match"); return; }
    setError(""); setLoading(true);
    try {
      const r = await fetch(`/api/users/${user.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const j = await r.json();
      if (!j.success) throw new Error(j.error);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 16,
        padding: 28, width: "100%", maxWidth: 400, fontFamily: ff,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ color: "#ffffff", fontSize: 16, fontWeight: 600, margin: 0 }}>Reset Password</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 13, color: "#888", margin: "0 0 20px" }}>Resetting password for <strong style={{ color: "#fff" }}>{user.name}</strong></p>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 16, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
            <AlertCircle size={13} /> {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>New Password</label>
            <input type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "#C9A84C"} onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 11, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Confirm Password</label>
            <input type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = "#C9A84C"} onBlur={(e) => e.target.style.borderColor = "#2a2a2a"} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 16px", borderRadius: 8, background: "none", border: "1px solid #2a2a2a", color: "#888", fontSize: 13, cursor: "pointer", fontFamily: ff }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: "10px 16px", borderRadius: 8,
            background: "linear-gradient(135deg, #C9A84C, #a8862e)",
            border: "none", color: "#000", fontSize: 13, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: ff,
          }}>
            {loading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <KeyRound size={13} />}
            {loading ? "Saving…" : "Reset Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd]           = useState(false);
  const [resetUser, setResetUser]       = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionError, setActionError]   = useState("");

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const r = await fetch("/api/users");
      const j = await r.json();
      return j.data ?? [];
    },
  });

  async function toggleActive(user: User) {
    setActionError("");
    const r = await fetch(`/api/users/${user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    const j = await r.json();
    if (!j.success) { setActionError(j.error); return; }
    qc.invalidateQueries({ queryKey: ["users"] });
  }

  async function changeRole(user: User, role: string) {
    setActionError("");
    const r = await fetch(`/api/users/${user.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const j = await r.json();
    if (!j.success) { setActionError(j.error); return; }
    qc.invalidateQueries({ queryKey: ["users"] });
  }

  async function deleteUser(id: string) {
    setActionError("");
    const r = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const j = await r.json();
    if (!j.success) { setActionError(j.error); return; }
    setDeleteConfirm(null);
    qc.invalidateQueries({ queryKey: ["users"] });
  }

  return (
    <div style={{ maxWidth: 860, fontFamily: ff }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: 26, fontWeight: 600, color: "#ffffff", margin: "0 0 4px" }}>
            User Management
          </h1>
          <p style={{ fontSize: 13, color: "#888", margin: 0 }}>{users.length} account{users.length !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 8,
            background: "linear-gradient(135deg, #C9A84C, #a8862e)",
            border: "none", color: "#000", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: ff,
          }}
        >
          <UserPlus size={14} /> Add User
        </button>
      </div>

      {actionError && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", marginBottom: 20, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#f87171", fontSize: 13 }}>
          <AlertCircle size={13} /> {actionError}
        </div>
      )}

      {/* Users table */}
      <div style={{ backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#555", fontSize: 13 }}>Loading users…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Users size={32} color="#333" style={{ marginBottom: 12 }} />
            <p style={{ color: "#555", fontSize: 13, margin: 0 }}>No users found</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2a2a2a" }}>
                {["User", "Role", "Status", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 10, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => {
                const rc = ROLE_COLORS[user.role] ?? ROLE_COLORS.STAFF;
                return (
                  <tr key={user.id} style={{ borderBottom: i < users.length - 1 ? "1px solid #222" : "none" }}>
                    {/* User info */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "linear-gradient(135deg, #C9A84C, #a8862e)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#000", fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>
                          {(user.name ?? "U")[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ color: "#ffffff", fontSize: 13, fontWeight: 500, margin: "0 0 2px" }}>{user.name}</p>
                          <p style={{ color: "#888", fontSize: 11, margin: 0 }}>{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role dropdown */}
                    <td style={{ padding: "14px 16px" }}>
                      <select
                        value={user.role}
                        onChange={(e) => changeRole(user, e.target.value)}
                        style={{
                          backgroundColor: rc.bg, border: `1px solid ${rc.border}`,
                          borderRadius: 6, padding: "4px 8px",
                          color: rc.text, fontSize: 11, fontWeight: 600,
                          cursor: "pointer", fontFamily: ff,
                          textTransform: "uppercase", letterSpacing: "0.05em",
                          appearance: "none" as const,
                        }}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r} style={{ backgroundColor: "#141414", color: "#fff" }}>
                            {r.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 9999, fontSize: 11, fontWeight: 500,
                        backgroundColor: user.isActive ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        border: `1px solid ${user.isActive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                        color: user.isActive ? "#4ade80" : "#f87171",
                      }}>
                        {user.isActive ? <Check size={10} /> : <X size={10} />}
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* Toggle active */}
                        <button
                          onClick={() => toggleActive(user)}
                          title={user.isActive ? "Deactivate" : "Activate"}
                          style={{
                            padding: 7, borderRadius: 6, border: "1px solid #2a2a2a",
                            backgroundColor: "transparent", cursor: "pointer",
                            color: user.isActive ? "#f87171" : "#4ade80",
                            display: "flex", alignItems: "center",
                          }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#222"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                        >
                          {user.isActive ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                        </button>

                        {/* Reset password */}
                        <button
                          onClick={() => setResetUser(user)}
                          title="Reset password"
                          style={{
                            padding: 7, borderRadius: 6, border: "1px solid #2a2a2a",
                            backgroundColor: "transparent", cursor: "pointer",
                            color: "#C9A84C", display: "flex", alignItems: "center",
                          }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "#222"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"}
                        >
                          <KeyRound size={13} />
                        </button>

                        {/* Delete */}
                        {deleteConfirm === user.id ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 11, color: "#f87171" }}>Sure?</span>
                            <button onClick={() => deleteUser(user.id)} style={{ padding: "4px 8px", borderRadius: 5, border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: 11, cursor: "pointer", fontFamily: ff }}>Yes</button>
                            <button onClick={() => setDeleteConfirm(null)} style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid #2a2a2a", backgroundColor: "transparent", color: "#888", fontSize: 11, cursor: "pointer", fontFamily: ff }}>No</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(user.id)}
                            title="Delete user"
                            style={{
                              padding: 7, borderRadius: 6, border: "1px solid #2a2a2a",
                              backgroundColor: "transparent", cursor: "pointer",
                              color: "#888", display: "flex", alignItems: "center",
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(239,68,68,0.08)"; (e.currentTarget as HTMLElement).style.color = "#f87171"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.2)"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; (e.currentTarget as HTMLElement).style.color = "#888"; (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} onSuccess={() => qc.invalidateQueries({ queryKey: ["users"] })} />}
      {resetUser && <ResetPasswordModal user={resetUser} onClose={() => setResetUser(null)} onSuccess={() => qc.invalidateQueries({ queryKey: ["users"] })} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
