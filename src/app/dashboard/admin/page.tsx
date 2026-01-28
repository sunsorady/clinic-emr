"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";

type RoleUI = "Admin" | "Doctor" | "Nurse" | "Reception";
type RoleDB = "admin" | "doctor" | "nurse" | "reception";

type Status = "Active" | "Invited" | "Disabled";

type Staff = {
  id: string;
  name: string;
  email: string;
  role: RoleUI;
  status: Status;
};

function uiRoleToDb(role: RoleUI): RoleDB {
  switch (role) {
    case "Admin":
      return "admin";
    case "Doctor":
      return "doctor";
    case "Nurse":
      return "nurse";
    case "Reception":
      return "reception";
  }
}

function dbRoleToUi(role: string): RoleUI {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "Admin";
  if (r === "nurse") return "Nurse";
  if (r === "reception") return "Reception";
  return "Doctor";
}

function statusFromProfile(p: any): Status {
  // If you later add a "disabled" column in profiles, update here.
  // For now: invited users may have no "last_sign_in_at" info from profiles.
  // We'll infer "Invited" if full_name is empty AND created recently, but better is storing a status column.
  // We'll take a simple rule:
  // - If profile has "role" but no name yet => Invited
  // - else => Active
  const hasName = Boolean(p?.full_name && String(p.full_name).trim());
  return hasName ? "Active" : "Invited";
}

export default function AdminPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<RoleUI>("Doctor");

  const [staff, setStaff] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  const roleOptions = useMemo<RoleUI[]>(
    () => ["Admin", "Doctor", "Nurse", "Reception"],
    []
  );

  async function loadStaff() {
    setLoadingStaff(true);
    setStaffError(null);

    try {
      const res = await fetch("/api/admin/staff", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load staff");

      const mapped: Staff[] = (data.staff ?? []).map((p: any) => ({
        id: p.id,
        name: p.full_name?.trim() ? p.full_name : "Pending user",
        email: p.email ?? "",
        role: dbRoleToUi(p.role),
        status: statusFromProfile(p),
      }));

      setStaff(mapped);
    } catch (e: any) {
      setStaffError(e?.message ?? "Failed to load staff");
      setStaff([]);
    } finally {
      setLoadingStaff(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function sendInvitation(e: React.FormEvent) {
    e.preventDefault();
    setInviteMsg(null);

    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    // Client-side duplicate check (still also enforce on server/db)
    if (staff.some((s) => s.email.toLowerCase() === email)) {
      setInviteMsg("❌ This email is already in the staff list.");
      return;
    }

    setInviteLoading(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          role: uiRoleToDb(inviteRole),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invite failed");

      setInviteMsg("✅ Invitation sent.");
      setInviteEmail("");
      setInviteRole("Doctor");

      await loadStaff();
    } catch (err: any) {
      setInviteMsg(`❌ ${err?.message ?? "Invite failed"}`);
    } finally {
      setInviteLoading(false);
    }
  }

  async function removeStaff(id: string) {
    // Optional: You can change this to "Disable" instead of deleting
    const ok = confirm("Remove this staff member?");
    if (!ok) return;

    try {
      const res = await fetch("/api/admin/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Remove failed");

      await loadStaff();
    } catch (e: any) {
      alert(e?.message ?? "Remove failed");
    }
  }

  return (
    <div className="pageShell">
      {/* ✅ FULL-WIDTH container (not centered max-width) */}
      <div className="pageFluid">
        <Link className="backLink" href="/dashboard/patients">
          ← Back to Dashboard
        </Link>

        <h1 className="pageTitle">Staff Management</h1>

        {/* Invite card */}
        <div className="section">
          <div className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">Invite New Staff Member</h2>
            </div>

            <div className="cardBody">
              <form className="adminGrid" onSubmit={sendInvitation}>
                <div className="field">
                  <label className="labelRow" htmlFor="inviteEmail">
                    <span className="labelIcon" aria-hidden="true">
                      ✉
                    </span>
                    Email Address
                  </label>
                  <input
                    id="inviteEmail"
                    className="input"
                    placeholder="doctor@clinic.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    type="email"
                    required
                  />
                </div>

                <div className="field">
                  <label className="labelRow" htmlFor="inviteRole">
                    Role
                  </label>
                  <select
                    id="inviteRole"
                    className="select"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as RoleUI)}
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="adminActions">
                  <button
                    className="btn btnTeal btnWide"
                    type="submit"
                    disabled={inviteLoading}
                    aria-disabled={inviteLoading}
                    title={inviteLoading ? "Sending..." : "Send Invitation"}
                  >
                    <span aria-hidden="true">👤+</span>
                    {inviteLoading ? "Sending..." : "Send Invitation"}
                  </button>

                  {inviteMsg && (
                    <div className="muted" style={{ marginTop: 10 }}>
                      {inviteMsg}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Staff table */}
        <div className="section">
          <div className="card">
            <div className="cardHeader">
              <h2 className="cardTitle">Current Staff</h2>
              <button className="btnMini" type="button" onClick={loadStaff}>
                Refresh
              </button>
            </div>

            <div className="cardBody">
              {loadingStaff ? (
                <div className="muted">Loading…</div>
              ) : staffError ? (
                <div className="muted" style={{ color: "crimson" }}>
                  {staffError}
                </div>
              ) : null}
            </div>

            {/* Keeps table inside rounded card */}
            <div className="tableClip">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Name</th>
                    <th className="th">Email</th>
                    <th className="th">Role</th>
                    <th className="th">Status</th>
                    <th className="th" style={{ width: 130, textAlign: "right" }}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {staff.map((s) => (
                    <tr key={s.id} className="trHover">
                      <td className="td">{s.name}</td>
                      <td className="td">{s.email}</td>
                      <td className="td">{s.role}</td>
                      <td className="td">
                        <StatusPill status={s.status} />
                      </td>
                      <td className="td" style={{ textAlign: "right" }}>
                        <button
                          className="btnMini"
                          type="button"
                          onClick={() => removeStaff(s.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loadingStaff && staff.length === 0 && (
                    <tr>
                      <td className="td muted" colSpan={5}>
                        No staff yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "Active" | "Invited" | "Disabled" }) {
  const cls =
    status === "Active"
      ? "statusPill statusActive"
      : status === "Invited"
      ? "statusPill statusInvited"
      : "statusPill statusDisabled";

  return <span className={cls}>{status}</span>;
}
