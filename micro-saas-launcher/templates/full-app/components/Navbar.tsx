"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ENABLE_AUTH } from "@/lib/blueprint-config";
import { useAuth } from "@/lib/auth";

interface NavPage {
  name: string;
  type: string;
}

interface NavbarProps {
  pages: NavPage[];
  logoText: string;
}

function pageHref(page: NavPage): string {
  const name = page.name.toLowerCase().replace(/\s+/g, "-");
  if (page.type === "landing") return "/";
  if (page.type === "dashboard") return "/dashboard";
  return `/${name}`;
}

export default function Navbar({ pages, logoText }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = pages.map((page) => ({
    label: page.name,
    href: pageHref(page),
  }));

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <span className="navbar-logo-icon">⚡</span>
          {logoText}
        </Link>

        <ul className="navbar-links">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`navbar-link${isActive ? " navbar-link-active" : ""}`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="navbar-right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/dashboard" className="navbar-cta">
            Dashboard
          </Link>
          {ENABLE_AUTH ? (
            user ? (
              <>
                <span className="user-pill" style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  {user.name}
                </span>
                <button type="button" className="btn-outline" onClick={() => void logout()}>
                  Logout
                </button>
              </>
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
