import Hero from "@/components/Hero";
import { pageConfigs, APP_NAME } from "@/lib/blueprint-config";

// Find the landing page config from navPages + pageConfigs
function getLandingHero() {
  // Check pageConfigs for a landing-type page
  for (const config of Object.values(pageConfigs)) {
    if (config.type === "landing") {
      const heroSection = config.sections.find((s) => s.type === "hero");
      if (heroSection) return heroSection;
    }
  }
  // Fall back to navPages landing entry (no detailed config)
  return null;
}

export default function LandingPage() {
  const hero = getLandingHero();

  const title = hero?.title ?? `Welcome to ${APP_NAME}`;
  const subtitle = hero?.subtitle ?? "Build something amazing with our platform.";
  const ctaText = hero?.cta_text ?? "Get Started";
  const ctaLink = hero?.cta_link ?? "/dashboard";

  return (
    <div className="min-h-screen">
      <Hero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink={ctaLink}
      />
    </div>
  );
}
