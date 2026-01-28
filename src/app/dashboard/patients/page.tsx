import PatientsTable from "@/components/PatientsTable";
export default function PatientsPage() {
  return (
    <>
      <h1 className="pageTitle">Patients</h1>
        <div className="pageShell">
  <div className="pageMaxWide">
    {/* Patients content + table */}
  </div>
</div>

      <div className="toolbarRow">
        <div className="inputWrap">
          <span className="inputIcon" aria-hidden="true">🔎</span>
          <input className="input" placeholder="Search by name or phone..." />
        </div>

        <button className="btn btnPrimary">
          ＋ New Patient
        </button>
      </div>

      <div className="card">
        <PatientsTable />
      </div>
    </>
  );
}
