import Link from "next/link";

export default function Footer({ appName }: { appName: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">
          <span className="footer-icon">✎</span> {appName}
        </span>
        <span className="footer-copy">
          © {year} {appName}. Content template.
        </span>
        <div className="footer-links">
          <Link href="/" className="footer-link">
            Home
          </Link>
          <Link href="/blog" className="footer-link">
            Blog
          </Link>
          <Link href="/manage/posts" className="footer-link">
            Manage
          </Link>
        </div>
      </div>
    </footer>
  );
}

