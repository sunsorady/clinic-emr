"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type Item = { label: string; href: string };

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: Item[] = useMemo(
    () => [
      { label: "អ្នកជំងឺ", href: "/dashboard/patients" },
      { label: "ការណាត់ជួប", href: "/dashboard/appointments" },
      { label: "Settings", href: "/dashboard/admin" },
    ],
    []
  );

  const title = useMemo(() => {
    const found = items.find((x) => pathname?.startsWith(x.href));
    return found?.label ?? "Dashboard";
  }, [items, pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <header className="topbar">
      <div className="topbarLeft">
        <div className="topbarTitle">{title}</div>

        {/* Mobile dropdown */}
        <div className="topbarDropdown">
          <button
            type="button"
            className="btnGhost menuBtn"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
          >
            Menu ▾
          </button>

          {open && (
            <div className="menuPanel" role="menu">
              {items.map((it) => (
                <button
                  key={it.href}
                  role="menuitem"
                  className={`menuItem ${pathname?.startsWith(it.href) ? "active" : ""}`}
                  onClick={() => go(it.href)}
                >
                  {it.label}
                </button>
              ))}

              <div className="menuDivider" />

              <button role="menuitem" className="menuItem danger" onClick={handleLogout}>
                ⎋ Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop sign out button stays */}
      <button className="btnGhost desktopOnly" onClick={handleLogout}>
        ⎋ Sign Out
      </button>
    </header>
  );
}
