interface FooterProps {
  appName?: string;
}

export default function Footer({ appName = "App" }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="footer-brand">
          <span className="footer-icon">⚡</span> {appName}
        </span>
        <span className="footer-copy">
          © {year} {appName}. Built with Micro-SaaS Launcher.
        </span>
        <div className="footer-links">
          <a href="/" className="footer-link">Home</a>
          <a href="/dashboard" className="footer-link">Dashboard</a>
        </div>
      </div>
    </footer>
  );
}
