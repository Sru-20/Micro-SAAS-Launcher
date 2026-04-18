import Link from "next/link";

export default function Footer({ appName }: { appName: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">
          <span className="footer-icon">▦</span> {appName}
        </span>
        <span className="footer-copy">
          © {year} {appName}. Marketplace template.
        </span>
        <div className="footer-links">
          <Link href="/" className="footer-link">
            Home
          </Link>
          <Link href="/listings" className="footer-link">
            Listings
          </Link>
          <Link href="/manage/listings" className="footer-link">
            Manage
          </Link>
        </div>
      </div>
    </footer>
  );
}

