"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Role = "Admin" | "Doctor" | "Nurse" | "Reception";
type Status = "Active" | "Invited" | "Disabled";

type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
};

export default function AdminPage() {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("Doctor");

  const [staff, setStaff] = useState<Staff[]>([
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      email: "sjohnson@clinic.com",
      role: "Doctor",
      status: "Active",
    },
    {
      id: "2",
      name: "Dr. Michael Chen",
      email: "mchen@clinic.com",
      role: "Doctor",
      status: "Active",
    },
    {
      id: "3",
      name: "Nurse Emily Davis",
      email: "edavis@clinic.com",
      role: "Nurse",
      status: "Active",
    },
  ]);

  const roleOptions = useMemo<Role[]>(
    () => ["Admin", "Doctor", "Nurse", "Reception"],
    []
  );

  function sendInvitation(e: React.FormEvent) {
    e.preventDefault();

    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    // Demo duplicate check
    if (staff.some((s) => s.email.toLowerCase() === email)) {
      alert("This email is already in the staff list.");
      return;
    }

    setStaff((prev) => [
      {
        id: crypto.randomUUID(),
        name: "Pending user",
        email,
        role: inviteRole,
        status: "Invited",
      },
      ...prev,
    ]);

    setInviteEmail("");
    setInviteRole("Doctor");
  }

  function removeStaff(id: string) {
    setStaff((prev) => prev.filter((s) => s.id !== id));
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
                    onChange={(e) => setInviteRole(e.target.value as Role)}
                  >
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="adminActions">
                  <button className="btn btnTeal btnWide" type="submit">
                    <span aria-hidden="true">👤+</span>
                    Send Invitation
                  </button>
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

                  {staff.length === 0 && (
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

function StatusPill({ status }: { status: Status }) {
  const cls =
    status === "Active"
      ? "statusPill statusActive"
      : status === "Invited"
      ? "statusPill statusInvited"
      : "statusPill statusDisabled";

  return <span className={cls}>{status}</span>;
}
