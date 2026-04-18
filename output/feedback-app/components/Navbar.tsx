"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

  const navLinks = pages.map((page) => ({
    label: page.name,
    href: pageHref(page),
  }));

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <span className="navbar-logo-icon">⚡</span>
          {logoText}
        </Link>

        {/* Links */}
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

        {/* CTA */}
        <Link href="/dashboard" className="navbar-cta">
          Dashboard
        </Link>
      </div>
    </nav>
  );
}
