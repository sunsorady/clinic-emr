const patients = [
  { name: "John Smith", sex: "M", age: 45, phone: "(555) 123-4567", lastVisit: "2026-01-25" },
  { name: "Sarah Johnson", sex: "F", age: 32, phone: "(555) 234-5678", lastVisit: "2026-01-24" },
  { name: "Michael Brown", sex: "M", age: 58, phone: "(555) 345-6789", lastVisit: "2026-01-23" },
  { name: "Emily Davis", sex: "F", age: 41, phone: "(555) 456-7890", lastVisit: "2026-01-22" },
  { name: "David Wilson", sex: "M", age: 67, phone: "(555) 567-8901", lastVisit: "2026-01-20" },
  { name: "Lisa Martinez", sex: "F", age: 29, phone: "(555) 678-9012", lastVisit: "2026-01-19" },
  { name: "Robert Taylor", sex: "M", age: 53, phone: "(555) 789-0123", lastVisit: "2026-01-18" },
  { name: "Jennifer Anderson", sex: "F", age: 38, phone: "(555) 890-1234", lastVisit: "2026-01-17" },
];

export default function PatientsTable() {
  return (
    <table className="table" aria-label="Patients table">
      <thead>
        <tr>
          <th className="th">Patient Name</th>
          <th className="th">Sex</th>
          <th className="th">Age</th>
          <th className="th">Phone</th>
          <th className="th">Last Visit</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((p) => (
          <tr key={p.name}>
            <td className="td" style={{ fontWeight: 700 }}>{p.name}</td>
            <td className="td muted">{p.sex}</td>
            <td className="td muted">{p.age}</td>
            <td className="td muted">{p.phone}</td>
            <td className="td muted">{p.lastVisit}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
