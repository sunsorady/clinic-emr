"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/* =======================
   TYPES
======================= */
type AppointmentStatus = "Confirmed" | "Waiting" | "Cancelled";

type Row = {
  id: string;
  starts_at: string;
  doctor_name: string;
  department: string;
  status: AppointmentStatus;
  patients: {
    patient_code: string;
    full_name: string;
    age: number | null;
    sex: string | null;
  } | null;
};

type PatientOption = {
  id: string;
  patient_code: string;
  full_name: string;
  age: number | null;
  sex: string | null;
};

/* =======================
   HELPERS
======================= */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toISOFromDateTime(date: string, time: string) {
  // date: YYYY-MM-DD, time: HH:mm
  // Use local time then convert to ISO for Postgres timestamptz
  const dt = new Date(`${date}T${time}:00`);
  return dt.toISOString();
}

/* =======================
   STATUS BADGE
======================= */
function StatusBadge({ status }: { status: AppointmentStatus }) {
  const styles: Record<AppointmentStatus, React.CSSProperties> = {
    Confirmed: { background: "#dcfce7", color: "#166534" },
    Waiting: {
      background: "#fff3d6",
      color: "#7a5400",
      border: "1px solid rgba(243,177,27,.35)",
    },
    Cancelled: { background: "#e5e7eb", color: "#374151" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 12px",
        borderRadius: 999,
        fontWeight: 900,
        fontSize: 12,
        whiteSpace: "nowrap",
        ...styles[status],
      }}
    >
      {status}
    </span>
  );
}

/* =======================
   PAGE
======================= */
export default function AppointmentsPage() {
  /* ---- sort / filter ---- */
  const [statusFilter, setStatusFilter] = useState<"All" | AppointmentStatus>(
    "All"
  );
  const [statusSort, setStatusSort] = useState<"time" | "status">("time");

  /* ---- data ---- */
  const [rows, setRows] = useState<Row[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  /* ---- modal ---- */
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /* ---- patient mode ---- */
  const [patientMode, setPatientMode] = useState<"existing" | "new">("new");

  // existing
  const [patientSearch, setPatientSearch] = useState("");
  const [patientId, setPatientId] = useState("");

  // new patient fields
  const [newPatientCode, setNewPatientCode] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newSex, setNewSex] = useState<"M" | "F">("M");
  const [newAge, setNewAge] = useState("");

  /* ---- appointment fields ---- */
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [doctorName, setDoctorName] = useState("");
  const [department, setDepartment] = useState("General Medicine");
  const [status, setStatus] = useState<AppointmentStatus>("Waiting");

  /* =======================
     LOADERS
  ======================= */
  async function loadAppointments() {
    setLoading(true);
    setPageError(null);

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
          id,
          starts_at,
          doctor_name,
          department,
          status,
          patients:patient_id (
            patient_code,
            full_name,
            age,
            sex
          )
        `
      )
      .order("starts_at", { ascending: true });

    if (error) {
  setPageError(error.message);
  setRows([]);
} else {
  const normalized: Row[] = (data ?? []).map((r: any) => {
    const p = r.patients;

    return {
      id: String(r.id),
      starts_at: String(r.starts_at),
      doctor_name: String(r.doctor_name ?? ""),
      department: String(r.department ?? ""),
      status: (r.status as AppointmentStatus) ?? "Waiting",

      // ✅ Supabase sometimes returns array — take first
      patients: Array.isArray(p) ? (p[0] ?? null) : (p ?? null),
    };
  });

  setRows(normalized);
}


    setLoading(false);
  }

  async function loadPatients() {
    const { data, error } = await supabase
      .from("patients")
      .select("id, patient_code, full_name, age, sex")
      .order("patient_code", { ascending: true })
      .limit(500);

    if (!error) setPatients((data ?? []) as PatientOption[]);
  }

  useEffect(() => {
    loadAppointments();
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =======================
     DERIVED
  ======================= */
  const filteredPatients = useMemo(() => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(
      (p) =>
        p.patient_code.toLowerCase().includes(q) ||
        p.full_name.toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  const visibleRows = useMemo(() => {
    const filtered =
      statusFilter === "All"
        ? rows
        : rows.filter((r) => r.status === statusFilter);

    if (statusSort === "time") {
      return [...filtered].sort(
        (a, b) =>
          new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
    }

    // Waiting -> Confirmed -> Cancelled
    const priority: Record<AppointmentStatus, number> = {
      Waiting: 0,
      Confirmed: 1,
      Cancelled: 2,
    };

    return [...filtered].sort((a, b) => {
      const p = priority[a.status] - priority[b.status];
      if (p !== 0) return p;
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime();
    });
  }, [rows, statusFilter, statusSort]);

  /* =======================
     MODAL HELPERS
  ======================= */
  function resetForm() {
    setFormError(null);

    // default date = today (YYYY-MM-DD)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);

    setTime("09:00");
    setDoctorName("");
    setDepartment("General Medicine");
    setStatus("Waiting");

    setPatientMode("new");
    setPatientSearch("");
    setPatientId("");

    setNewPatientCode("");
    setNewFullName("");
    setNewSex("M");
    setNewAge("");
  }

  function openModal() {
    resetForm();
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  /* =======================
     CREATE
  ======================= */
  async function handleCreate() {
    setFormError(null);

    if (!date) return setFormError("Please choose a date.");
    if (!time) return setFormError("Please choose a time.");
    if (!doctorName.trim()) return setFormError("Doctor name is required.");
    if (!department.trim()) return setFormError("Department is required.");

    setSaving(true);

    try {
      let finalPatientId = patientId;

      // NEW patient → insert into patients first
      if (patientMode === "new") {
        if (!newPatientCode.trim()) {
          setSaving(false);
          return setFormError("Patient ID is required.");
        }
        if (!newFullName.trim()) {
          setSaving(false);
          return setFormError("Patient name is required.");
        }

        const ageNum = newAge.trim() === "" ? null : Number(newAge.trim());
        if (newAge.trim() !== "" && Number.isNaN(ageNum)) {
          setSaving(false);
          return setFormError("Age must be a number.");
        }

        const { data: pData, error: pErr } = await supabase
          .from("patients")
          .insert({
            patient_code: newPatientCode.trim(),
            full_name: newFullName.trim(),
            sex: newSex,
            age: ageNum,
          })
          .select("id")
          .single();

        if (pErr) {
          setSaving(false);
          return setFormError(pErr.message);
        }

        finalPatientId = pData.id;
      }

      // EXISTING patient → must pick one
      if (patientMode === "existing" && !finalPatientId) {
        setSaving(false);
        return setFormError("Please select a patient.");
      }

      const startsAtISO = toISOFromDateTime(date, time);

      const { error: aErr } = await supabase.from("appointments").insert({
        patient_id: finalPatientId,
        doctor_name: doctorName.trim(),
        department: department.trim(),
        starts_at: startsAtISO,
        status,
      });

      if (aErr) {
        setSaving(false);
        return setFormError(aErr.message);
      }

      await loadPatients();
      await loadAppointments();

      setSaving(false);
      setOpen(false);
    } catch (e: any) {
      setSaving(false);
      setFormError(e?.message ?? "Unknown error");
    }
  }

  /* =======================
     TABLE
  ======================= */
  const table = useMemo(() => {
    if (loading) return <div>Loading...</div>;
    if (pageError)
      return <div style={{ color: "#b42318", fontWeight: 800 }}>Error: {pageError}</div>;
    if (!visibleRows.length) return <div>No appointments found</div>;

    return (
      <table className="emrTable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Patient name</th>
            <th>ID</th>
            <th>Age / Sex</th>
            <th>Doctor</th>
            <th>Department</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Action</th>
          </tr>
        </thead>

        <tbody>
          {visibleRows.map((r) => {
            const p = r.patients;
            return (
              <tr key={r.id}>
                <td>{formatDate(r.starts_at)}</td>
                <td>{formatTime(r.starts_at)}</td>
                <td style={{ fontWeight: 900 }}>{p?.full_name ?? "-"}</td>
                <td style={{ color: "#475569" }}>{p?.patient_code ?? "-"}</td>
                <td>
                  {(p?.age ?? "-")} / {(p?.sex ?? "-")}
                </td>
                <td>{r.doctor_name}</td>
                <td>{r.department}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td className="emrActions" style={{ textAlign: "right" }}>
                  <button type="button">View</button>
                  <button type="button">Edit</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }, [loading, pageError, visibleRows]);

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="emrWrap">
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <h1 className="pageTitle" style={{ marginBottom: 0 }}>
          Appointments
        </h1>

        <button
          type="button"
          onClick={openModal}
          className="btn btnTeal"
          style={{ height: 44, borderRadius: 14 }}
        >
          + New appointment
        </button>
      </div>

      <div style={{ height: 14 }} />

      {/* Sort / Filter toolbar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ fontWeight: 900, color: "#334155" }}>Sort / Filter:</div>

        <select
          className="select"
          style={{ width: 220, height: 44 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="All">All statuses</option>
          <option value="Waiting">Waiting</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          className="select"
          style={{ width: 260, height: 44 }}
          value={statusSort}
          onChange={(e) => setStatusSort(e.target.value as any)}
        >
          <option value="time">Sort by time</option>
          <option value="status">Sort by status (Waiting first)</option>
        </select>
      </div>

      {/* Table */}
      <div className="emrTableBox">{table}</div>

      {/* MODAL */}
      {open && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="cardHeader">
              <div className="modalHeaderRow">
                <div>
                  <h3 className="cardTitle" style={{ margin: 0 }}>
                    New Appointment
                  </h3>
                  <div className="modalSub">
                    Create a new patient or select existing, then choose date/time.
                  </div>
                </div>

                <button type="button" onClick={closeModal} className="btnGhost">
                  Close
                </button>
              </div>
            </div>

            <div className="cardBody">
              {formError && (
                <div
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    color: "#7f1d1d",
                    padding: "10px 12px",
                    borderRadius: 14,
                    marginBottom: 14,
                    fontWeight: 900,
                    fontSize: 13,
                  }}
                >
                  {formError}
                </div>
              )}

              <div className="modalGrid">
                {/* Patient */}
                <div className="modalGridFull">
                  <label className="modalLabel">Patient</label>

                  <div className="segRow">
                    <button
                      type="button"
                      onClick={() => setPatientMode("new")}
                      className={`seg ${patientMode === "new" ? "segActive" : ""}`}
                    >
                      + New patient
                    </button>

                    <button
                      type="button"
                      onClick={() => setPatientMode("existing")}
                      className={`seg ${
                        patientMode === "existing" ? "segActive" : ""
                      }`}
                    >
                      Select existing
                    </button>
                  </div>

                  {patientMode === "new" ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 12,
                      }}
                    >
                      <div>
                        <label className="modalLabel">Patient ID</label>
                        <input
                          className="input"
                          value={newPatientCode}
                          onChange={(e) => setNewPatientCode(e.target.value)}
                          placeholder="e.g., H001240"
                        />
                      </div>

                      <div>
                        <label className="modalLabel">Sex</label>
                        <select
                          className="select"
                          value={newSex}
                          onChange={(e) => setNewSex(e.target.value as "M" | "F")}
                        >
                          <option value="M">M</option>
                          <option value="F">F</option>
                        </select>
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label className="modalLabel">Full name</label>
                        <input
                          className="input"
                          value={newFullName}
                          onChange={(e) => setNewFullName(e.target.value)}
                          placeholder="Patient name"
                        />
                      </div>

                      <div>
                        <label className="modalLabel">Age</label>
                        <input
                          className="input"
                          value={newAge}
                          onChange={(e) => setNewAge(e.target.value)}
                          placeholder="e.g., 35"
                          inputMode="numeric"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="modalLabel">Search</label>
                      <input
                        className="input"
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        placeholder="Search by ID or name…"
                        style={{ marginBottom: 10 }}
                      />

                      <label className="modalLabel">Select patient</label>
                      <select
                        className="select"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                      >
                        <option value="">Select patient…</option>
                        {filteredPatients.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.patient_code} — {p.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="modalLabel">Date</label>
                  <input
                    className="input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="modalLabel">Time</label>
                  <input
                    className="input"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>

                {/* Doctor */}
                <div>
                  <label className="modalLabel">Doctor</label>
                  <input
                    className="input"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g., Dr. Kim Sun"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="modalLabel">Department</label>
                  <input
                    className="input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., Cardiology"
                  />
                </div>

                {/* Status */}
                <div className="modalGridFull">
                  <label className="modalLabel">Status</label>
                  <select
                    className="select"
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as AppointmentStatus)
                    }
                  >
                    <option value="Waiting">Waiting</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="modalFooter">
                <button type="button" onClick={closeModal} className="btnMiniSoft">
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreate}
                  className="btnPrimaryWide"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Create appointment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
