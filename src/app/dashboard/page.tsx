import { redirect } from "next/navigation";
import PatientsTable from "../../components/PatientsTable";

export default function DashboardIndex() {
  redirect("/dashboard/patients");
}
<button className="btn btnPrimary">＋ New Patient</button>
