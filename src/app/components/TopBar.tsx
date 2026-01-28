"use client";

import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function TopBar() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <header className="topbar">
      <div className="topbarTitle">Patients</div>

      <button className="btnGhost" onClick={handleLogout}>
        ⎋ Sign Out
      </button>
    </header>
  );
}
