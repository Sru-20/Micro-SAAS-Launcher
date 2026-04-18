"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENABLE_AUTH } from "@/lib/blueprint-config";
import { useAuth } from "@/lib/auth";

function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link href={href} className={`navbar-link${active ? " navbar-link-active" : ""}`}>
      {label}
    </Link>
  );
}

export default function Navbar({ logoText }: { logoText: string }) {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <span className="navbar-logo-icon">▦</span>
          {logoText}
        </Link>

        <div className="navbar-links">
          <NavLink href="/listings" label="Listings" />
          <NavLink href="/manage/listings" label="Manage" />
        </div>

        <div className="navbar-right">
          {ENABLE_AUTH ? (
            user ? (
              <div className="user-menu">
                <span className="user-pill">{user.name}</span>
                <button type="button" className="btn-outline" onClick={() => void logout()}>
                  Logout
                </button>
              </div>
            ) : (
              <Link href="/login" className="btn-primary-sm">
                Login
              </Link>
            )
          ) : null}
        </div>
      </div>
    </nav>
  );
}

