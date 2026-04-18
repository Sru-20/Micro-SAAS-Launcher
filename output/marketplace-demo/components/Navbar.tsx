"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
          {user ? (
            <div className="user-menu">
              <span className="user-pill">{user.name}</span>
              <button className="btn-outline" onClick={() => logout()}>
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-primary-sm">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

