import "@/styles/dashboard.css";
import Sidebar from "@/src/app/components/Sidebar"; // keep this (your Sidebar is in root components)
import TopBar from "../components/TopBar";  // ✅ use the app/components TopBar


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashWrap autoSide">
  <div className="sideShell">
    <div className="sideHotZone" aria-hidden="true" />
    <aside className="sidebar sidePanel">
      <Sidebar />
    </aside>
  </div>

  <div className="main">
    <TopBar />
    <div className="content">{children}</div>
  </div>
</div>

  );
}
