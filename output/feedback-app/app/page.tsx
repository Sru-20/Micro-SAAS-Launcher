import Hero from "@/components/Hero";

interface LandingPageProps {
  blueprint?: {
    pages?: Array<{
      type?: string;
      sections?: Array<{
        title?: string;
        subtitle?: string;
        cta_text?: string;
      }>;
    }>;
  };
}

export default function LandingPage({ blueprint }: LandingPageProps = {}) {
  // Find the landing page section from blueprint
  const section = blueprint?.pages?.find(
    (p) => p.type === "landing"
  )?.sections?.[0] || {};

  const title = section.title || "Welcome to Your App";
  const subtitle =
    section.subtitle ||
    "Build something amazing with our platform";
  const ctaText = section.cta_text || "Get Started";

  return (
    <div className="min-h-screen">
      <Hero
        title={title}
        subtitle={subtitle}
        ctaText={ctaText}
        ctaLink="/dashboard"
      />
    </div>
  );
}
