"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

type Item = { label: string; href: string };

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // ✅ Close dropdown when tapping outside
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (
        open &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
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
        <div className="topbarDropdown" ref={dropdownRef}>
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
                  className={`menuItem ${
                    pathname?.startsWith(it.href) ? "active" : ""
                  }`}
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
