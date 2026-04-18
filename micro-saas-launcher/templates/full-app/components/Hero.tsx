import Link from "next/link";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export default function Hero({
  title,
  subtitle,
  ctaText = "Get Started",
  ctaLink = "/dashboard",
  secondaryCtaText,
  secondaryCtaLink,
}: HeroProps) {
  return (
    <section className="hero-section">
      {/* Animated gradient orbs */}
      <div className="hero-orb hero-orb-1" aria-hidden="true" />
      <div className="hero-orb hero-orb-2" aria-hidden="true" />

      <div className="hero-content">
        <div className="hero-badge">✦ Powered by AI</div>

        <h1 className="hero-title">{title}</h1>

        <p className="hero-subtitle">{subtitle}</p>

        <div className="hero-actions">
          <Link href={ctaLink} className="btn-primary">
            {ctaText}
            <span className="btn-arrow">→</span>
          </Link>
          {secondaryCtaText && secondaryCtaLink && (
            <Link href={secondaryCtaLink} className="btn-secondary">
              {secondaryCtaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
