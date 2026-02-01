"use client";

import { useEffect, useState } from "react";

type Patient = {
  id: string;
  patient_code: string | null;
  full_name: string | null;
  sex: string | null;
  dob: string | null;
  age: number | null;
  created_at: string | null;
};

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export default function PatientsPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      const data = await safeJson(res);

      if (!res.ok) throw new Error(data?.error ?? "Failed to load patients");

      setPatients(data?.patients ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <h1 className="pageTitle">Patients</h1>

      <div className="toolbarRow">
        <div className="inputWrap">
          <span className="inputIcon" aria-hidden="true">🔎</span>
          <input
            className="input"
            placeholder="Search by name..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>

        <button className="btn btnPrimary" onClick={() => alert("New Patient form next")}>
          ＋ New Patient
        </button>

        <button className="btn" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      {err && <div style={{ color: "crimson", marginTop: 12 }}>{err}</div>}

      <div className="card" style={{ marginTop: 12, overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 16 }}>Loading…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 12 }}>Code</th>
                <th style={{ textAlign: "left", padding: 12 }}>Name</th>
                <th style={{ textAlign: "left", padding: 12 }}>Sex</th>
                <th style={{ textAlign: "left", padding: 12 }}>Age</th>
                <th style={{ textAlign: "left", padding: 12 }}>DOB</th>
                <th style={{ textAlign: "left", padding: 12 }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 12, opacity: 0.7 }}>
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                    <td style={{ padding: 12 }}>{p.patient_code ?? "—"}</td>
                    <td style={{ padding: 12 }}>{p.full_name ?? "—"}</td>
                    <td style={{ padding: 12 }}>{p.sex ?? "—"}</td>
                    <td style={{ padding: 12 }}>{p.age ?? "—"}</td>
                    <td style={{ padding: 12 }}>{p.dob ?? "—"}</td>
                    <td style={{ padding: 12 }}>
                      {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
