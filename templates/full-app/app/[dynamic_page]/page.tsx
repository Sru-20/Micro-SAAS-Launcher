import { notFound } from "next/navigation";
import { pageConfigs, PROJECT_ID } from "@/lib/blueprint-config";
import AutoCRUD from "@/components/AutoCRUD";
import DynamicForm from "@/components/DynamicForm";
import Hero from "@/components/Hero";

interface DynamicPageProps {
  params: Promise<{ dynamic_page: string }>;
}

export async function generateStaticParams() {
  return Object.keys(pageConfigs).map((slug) => ({
    dynamic_page: slug,
  }));
}

export default async function DynamicPage({ params }: DynamicPageProps) {
  const { dynamic_page: slug } = await params;
  const page = pageConfigs[slug];

  if (!page) {
    notFound();
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">{page.name}</h1>
      </div>

      <div className="page-sections">
        {page.sections.map((section, i) => {
          if (section.type === "hero") {
            return (
              <Hero
                key={i}
                title={section.title ?? page.name}
                subtitle={section.subtitle ?? ""}
                ctaText={section.cta_text}
                ctaLink={section.cta_link}
              />
            );
          }

          if (section.type === "form" && section.table && section.fields) {
            return (
              <div key={i} className="section-card">
                <h2 className="section-title">
                  {section.title ?? `Submit ${section.table}`}
                </h2>
                {section.subtitle && (
                  <p className="section-subtitle">{section.subtitle}</p>
                )}
                {/* Standalone mode: DynamicForm writes directly to Supabase */}
                <DynamicForm
                  fields={section.fields}
                  tableName={section.table}
                  projectId={PROJECT_ID}
                  submitLabel={section.cta_text ?? "Submit"}
                />
              </div>
            );
          }

          if (section.type === "table" && section.table && section.fields) {
            return (
              <div key={i} className="section-card">
                {section.title && (
                  <h2 className="section-title">{section.title}</h2>
                )}
                <AutoCRUD
                  tableName={section.table}
                  projectId={PROJECT_ID}
                  fields={section.fields}
                />
              </div>
            );
          }

          return null;
        })}
      </div>
    </main>
  );
}
