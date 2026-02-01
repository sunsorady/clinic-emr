"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabaseClient";
 // <-- adjust if your path differs
async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}
type StaffRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "doctor" | "nurse" | "reception" | string;
  created_at: string;
  last_seen?: string | null; // optional if you added it
};

const ROLE_OPTIONS = ["admin", "doctor", "nurse", "reception"] as const;

function isOnline(lastSeenISO?: string | null) {
  if (!lastSeenISO) return false;
  const last = new Date(lastSeenISO).getTime();
  const now = Date.now();
  return now - last <= 2 * 60 * 1000; // 2 minutes
}

function timeAgo(lastSeenISO?: string | null) {
  if (!lastSeenISO) return "—";
  const diff = Math.max(0, Date.now() - new Date(lastSeenISO).getTime());
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

export default function AdminPage() {
  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<(typeof ROLE_OPTIONS)[number]>("doctor");

  // Staff list
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Admin guard
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // UX state
  const [busyInvite, setBusyInvite] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const meId = useMemo(() => staff.find(() => false)?.id, [staff]); // unused placeholder

  async function loadStaff() {
    setLoadingStaff(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to load staff");
      setStaff(data.staff ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load staff");
    } finally {
      setLoadingStaff(false);
    }
  }

  async function sendInvite() {
    setBusyInvite(true);
    setError(null);
    setInfo(null);

    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setError("Please enter an email.");
      setBusyInvite(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Invite failed");

      setInviteEmail("");
      setInfo(`Invitation sent to ${email}`);
      await loadStaff();
    } catch (e: any) {
      setError(e?.message ?? "Invite failed");
    } finally {
      setBusyInvite(false);
    }
  }

  async function deleteStaff(userId: string, email?: string | null) {
    setError(null);
    setInfo(null);

    const ok = window.confirm(
      `Permanently delete this staff account?\n\n${email ?? userId}\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setBusyDeleteId(userId);
    try {
      const res = await fetch("/api/admin/staff/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Delete failed");

      setInfo("Staff account deleted.");
      await loadStaff();
    } catch (e: any) {
      setError(e?.message ?? "Delete failed");
    } finally {
      setBusyDeleteId(null);
    }
  }

  // Admin check (client-side) — still enforce server-side in API route (important)
  async function checkAdmin() {
    setCheckingAdmin(true);
    setError(null);
    try {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const user = auth.user;
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: prof, error: profErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profErr) throw profErr;
      setIsAdmin(prof?.role === "admin");
    } catch (e: any) {
      setIsAdmin(false);
      setError(e?.message ?? "Failed to verify admin role");
    } finally {
      setCheckingAdmin(false);
    }
  }

  // Presence ping (optional): only works if you created /api/presence/ping + last_seen column
  useEffect(() => {
    const ping = () => fetch("/api/presence/ping", { method: "POST" }).catch(() => {});
    ping();
    const t = setInterval(ping, 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    checkAdmin();
  }, []);

  useEffect(() => {
    if (!checkingAdmin && isAdmin) loadStaff();
  }, [checkingAdmin, isAdmin]);

  if (checkingAdmin) {
    return (
      <div style={pageWrap}>
        <h1 style={h1Style}>Settings</h1>
        <div style={cardStyle}>Checking permissions…</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={pageWrap}>
        <div style={{ marginBottom: 14 }}>
          <Link href="/dashboard" style={backLinkStyle}>
            ← Back to Dashboard
          </Link>
        </div>

        <h1 style={h1Style}>Staff Management</h1>

        <div style={cardStyle}>
          <p style={{ margin: 0, fontWeight: 800, color: "#b91c1c" }}>
            Access denied. Admins only.
          </p>
          <p style={{ marginTop: 8, color: "#334155" }}>
            If you believe this is a mistake, make sure your account has role = <b>admin</b> in the{" "}
            <code>profiles</code> table.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrap}>
      <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
        <Link href="/dashboard" style={backLinkStyle}>
          ← Back to Dashboard
        </Link>

        {/* Optional sign out */}
        <button
          onClick={() => supabase.auth.signOut()}
          style={{ ...smallBtnStyle, borderRadius: 999, padding: "10px 14px" }}
        >
          Sign Out
        </button>
      </div>

      <h1 style={h1Style}>Staff Management</h1>

      <div style={gridStyle}>
        {/* Invite */}
        <div style={cardStyle}>
          <h2 style={h2Style}>Invite New Staff Member</h2>

          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="doctor@clinic.com"
              style={inputStyle}
              autoComplete="email"
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Role</label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as any)} style={inputStyle}>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r[0].toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={sendInvite}
            disabled={busyInvite || !inviteEmail.trim()}
            style={{
              ...primaryBtnStyle,
              opacity: busyInvite || !inviteEmail.trim() ? 0.6 : 1,
              marginTop: 18,
            }}
          >
            {busyInvite ? "Sending…" : "Send Invitation"}
          </button>

          {info && <p style={{ marginTop: 12, color: "#0f766e", fontWeight: 800 }}>{info}</p>}
          {error && <p style={{ marginTop: 12, color: "#dc2626", fontWeight: 900 }}>{error}</p>}
        </div>

        {/* Current staff */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <h2 style={h2Style}>Current Staff</h2>

            <button onClick={loadStaff} style={smallBtnStyle} disabled={loadingStaff}>
              {loadingStaff ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
              <thead>
                <tr>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Action</th>
                </tr>
              </thead>

              <tbody>
                {staff.map((s) => {
                  const online = isOnline(s.last_seen ?? null);
                  return (
                    <tr key={s.id}>
                      <td style={tdStyle}>{s.full_name ?? "—"}</td>
                      <td style={tdStyle}>{s.email ?? "—"}</td>
                      <td style={tdStyle}>{s.role}</td>

                      <td style={tdStyle}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            fontWeight: 800,
                            color: online ? "#047857" : "#475569",
                          }}
                        >
                          <span
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: 999,
                              background: online ? "#10b981" : "#94a3b8",
                              display: "inline-block",
                            }}
                          />
                          {online ? "Online" : `Last seen ${timeAgo(s.last_seen ?? null)}`}
                        </span>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <button
                          onClick={() => deleteStaff(s.id, s.email)}
                          disabled={busyDeleteId === s.id}
                          style={{
                            ...dangerBtnStyle,
                            opacity: busyDeleteId === s.id ? 0.6 : 1,
                          }}
                          title="Permanently delete staff"
                        >
                          {busyDeleteId === s.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {staff.length === 0 && (
                  <tr>
                    <td style={tdStyle} colSpan={5}>
                      No staff found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {error && <p style={{ marginTop: 12, color: "#dc2626", fontWeight: 900 }}>{error}</p>}
        </div>
      </div>

      <div style={{ marginTop: 18, color: "#64748b", fontSize: 13 }}>
        <p style={{ margin: 0 }}>
          Tip: Online status requires <code>profiles.last_seen</code> + the <code>/api/presence/ping</code> route.
          Otherwise it will show “—”.
        </p>
      </div>
    </div>
  );
}

/* ------------------ styles (inline, works immediately) ------------------ */

const pageWrap: React.CSSProperties = {
  maxWidth: 1120,
  margin: "0 auto",
  padding: "24px 16px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 24,
  alignItems: "start",
};

const h1Style: React.CSSProperties = {
  fontSize: 38,
  fontWeight: 950,
  letterSpacing: "-0.02em",
  margin: "10px 0 18px",
  color: "#0f172a",
};

const h2Style: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  margin: 0,
  color: "#0f172a",
};

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.95)",
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
  border: "1px solid rgba(15,23,42,0.08)",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 900,
  marginBottom: 6,
  color: "#0f172a",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 12px",
  borderRadius: 12,
  border: "1px solid rgba(15,23,42,0.15)",
  outline: "none",
  background: "white",
};

const primaryBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "none",
  background: "#0f766e",
  color: "white",
  fontWeight: 950,
  cursor: "pointer",
};

const smallBtnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid rgba(15,23,42,0.15)",
  background: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const dangerBtnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid rgba(220, 38, 38, 0.25)",
  background: "rgba(220,38,38,0.08)",
  color: "#b91c1c",
  fontWeight: 950,
  cursor: "pointer",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  fontWeight: 950,
  padding: "10px 8px",
  borderBottom: "1px solid rgba(15,23,42,0.12)",
  color: "#0f172a",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 8px",
  borderBottom: "1px solid rgba(15,23,42,0.08)",
  color: "#0f172a",
};

const backLinkStyle: React.CSSProperties = {
  fontWeight: 900,
  color: "#0f766e",
  textDecoration: "none",
};
