"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link href={href} className={`navItem khmer ${active ? "navItemActive" : ""}`}>
      <span className="navIcon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <div>
      {/* Brand */}
      <div className="brand">
        <div className="brandIcon logoBox">
          <img
            src="/logo/logo.png"
            alt="Clinic logo"
            className="brandLogo"
          />
        </div>

        <div>
          <div className="brandSub khmer">អ្នកគ្រប់គ្រង</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav" aria-label="Dashboard navigation">
        <NavItem href="/dashboard/patients" label="អំពីអ្នកជំងឺ" icon="👥" />
        <NavItem href="/dashboard/appointments" label="អំពីការណាត់ជួប" icon="📅" />
        <NavItem href="/dashboard/admin" label="អេដមីន" icon="⚙️" />
      </nav>
    </div>
  );
}
