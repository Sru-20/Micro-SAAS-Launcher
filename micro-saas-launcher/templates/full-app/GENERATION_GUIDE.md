# Step 6 — Code Template Generation Guide

This is the **template engine** for converting blueprints into full Next.js applications.

## How the Generator Works

### 1. **Input: Blueprint JSON**
The AI reads a blueprint like this:

```json
{
  "name": "Feedback App",
  "project_id": "proj_123",
  "pages": [
    {
      "name": "Landing",
      "type": "landing",
      "sections": [
        {
          "type": "hero",
          "title": "Feedback Platform",
          "subtitle": "Share your thoughts",
          "cta_text": "Start Now"
        }
      ]
    },
    {
      "name": "Feedback",
      "type": "form",
      "sections": [
        {
          "type": "form",
          "table": "feedback",
          "fields": [
            { "name": "title", "type": "text" },
            { "name": "description", "type": "text" },
            { "name": "rating", "type": "integer" }
          ]
        }
      ]
    }
  ],
  "tables": [
    {
      "name": "feedback",
      "fields": [
        { "name": "title", "type": "text" },
        { "name": "description", "type": "text" },
        { "name": "rating", "type": "integer" }
      ]
    }
  ]
}
```

### 2. **Template Processing**

The generator:

1. **Reads each page** from the blueprint
2. **Determines component type**:
   - `hero` → Uses `Hero.tsx`
   - `form` → Uses `DynamicForm.tsx` with blueprint fields
   - `table` → Uses `AutoCRUD.tsx` with table data
   - `landing` → Renders `page.tsx` with hero section
3. **Populates config** in `app/[dynamic_page]/page.tsx`:
   ```typescript
   const pageConfigs: Record<string, PageConfig> = {
     feedback: {
       name: "Feedback",
       type: "form",
       sections: [{...blueprint data...}]
     }
   }
   ```
4. **Updates `Navbar.tsx`** with links from `blueprint.pages`
5. **Copies components** (`AutoCRUD.tsx`, `DynamicForm.tsx`)

### 3. **Output: Full Next.js App**

**Generated folder structure:**

```
output/generated-app/
├── app/
│   ├── page.tsx                 # Landing page
│   ├── dashboard/page.tsx        # Dashboard
│   └── [dynamic_page]/page.tsx   # Form/Table pages (filled with blueprint)
├── components/
│   ├── Navbar.tsx               # Navigation (filled with pages)
│   ├── Footer.tsx               # Footer
│   ├── Hero.tsx                 # Hero section
│   ├── AutoCRUD.tsx             # Table component
│   └── DynamicForm.tsx          # Form component
├── lib/
│   ├── supabase.ts              # Supabase client
│   └── blueprint-config.ts      # Config types
├── package.json
├── next.config.js
├── tsconfig.json
└── .env.local                   # Populated with Supabase keys
```

## Step-by-Step Generation Process

### Phase 1: Parse Blueprint

```typescript
function parseBlueprint(blueprintJson: string) {
  const blueprint = JSON.parse(blueprintJson);
  return {
    name: blueprint.name,
    projectId: blueprint.project_id,
    pages: blueprint.pages,
    tables: blueprint.tables,
  };
}
```

### Phase 2: Generate Page Configs

For each page in blueprint:

```typescript
function generatePageConfigs(pages: Page[]): PageConfig[] {
  return pages
    .filter((p) => p.type !== "landing") // Landing is already in page.tsx
    .map((page) => ({
      name: page.slug || "/" + page.name.toLowerCase(),
      type: page.type,
      sections: page.sections,
    }));
}
```

### Phase 3: Fill Dynamic Page Handler

Replace placeholder in `app/[dynamic_page]/page.tsx`:

```typescript
// BEFORE:
const pageConfigs: Record<string, PageConfig> = {
  feedback: { /* placeholder */ }
}

// AFTER (generated):
const pageConfigs: Record<string, PageConfig> = {
  feedback: { /* actual blueprint data */ },
  contact: { /* actual blueprint data */ },
  testimonials: { /* actual blueprint data */ }
}
```

### Phase 4: Update Navbar

Pass blueprint pages to `<Navbar pages={blueprint.pages} />`:

```typescript
// In app/layout.tsx or components that use Navbar:
<Navbar 
  pages={blueprint.pages}
  logoText={blueprint.name}
/>
```

This auto-generates navigation links.

### Phase 5: Copy & Configure

1. Copy template structure to `output/`
2. Replace environment variables in `.env.local`
3. Install dependencies
4. Done! 🚀

## Usage Example

### Input Blueprint (feedback-app.json):

```json
{
  "name": "Feedback Board",
  "project_id": "proj_feedback_001",
  "pages": [
    {
      "name": "Landing",
      "type": "landing",
      "sections": [
        {
          "type": "hero",
          "title": "Share Your Feedback",
          "subtitle": "Help us improve with your insights",
          "cta_text": "Submit Feedback"
        }
      ]
    },
    {
      "name": "Submit",
      "type": "form",
      "sections": [
        {
          "type": "form",
          "table": "feedback",
          "fields": [
            { "name": "title", "type": "text" },
            { "name": "comment", "type": "text" },
            { "name": "category", "type": "text" }
          ]
        }
      ]
    },
    {
      "name": "Reviews",
      "type": "table",
      "sections": [
        {
          "type": "table",
          "table": "feedback",
          "fields": [
            { "name": "title", "type": "text" },
            { "name": "comment", "type": "text" },
            { "name": "category", "type": "text" }
          ]
        }
      ]
    }
  ],
  "tables": [
    {
      "name": "feedback",
      "fields": [
        { "name": "title", "type": "text" },
        { "name": "comment", "type": "text" },
        { "name": "category", "type": "text" }
      ]
    }
  ]
}
```

### AI Generator Command:

```bash
npm run generate -- --blueprint ./feedback-app.json --output ./output/feedback-app
```

### Generated Output:

```
output/feedback-app/
├── app/page.tsx           # "Share Your Feedback" hero
├── app/submit/page.tsx    # Form to submit feedback
├── app/reviews/page.tsx   # Table showing all feedback
├── app/layout.tsx         # Nav with links to submit, reviews
└── [all other files...]
```

### What You Get:

✅ **Landing page** with hero section  
✅ **Form page** with `DynamicForm` bound to `feedback` table  
✅ **Table page** with `AutoCRUD` showing all feedback  
✅ **Navigation** auto-generated from pages  
✅ **Supabase integration** ready to go  
✅ **Tailwind styling** applied throughout

## File Patterns

### Pages Template Pattern:

```typescript
// Key placeholders the generator fills:

// 1. Page config array
const pageConfigs = { /* filled from blueprint.pages */ }

// 2. Dynamic section rendering
{section.type === "form" && <DynamicForm {...blueprint.fields} />}
{section.type === "table" && <AutoCRUD {...blueprint.fields} />}

// 3. Navigation
<Navbar pages={blueprint.pages} />
```

### Component Pattern:

```typescript
// Hero.tsx
<Hero
  title={section.title}
  subtitle={section.subtitle}
  ctaText={section.cta_text}
/>

// DynamicForm.tsx
<DynamicForm
  tableName={section.table}
  fields={section.fields}
/>

// AutoCRUD.tsx
<AutoCRUD
  tableName={section.table}
  fields={section.fields}
/>
```

## Integration with Grok AI

The AI generator (in Step 6.6) will:

1. **Accept** blueprint JSON
2. **Generate** page configs by mapping blueprint pages → component props
3. **Create** output folder with all files
4. **Set** environment variables in `.env.local`
5. **Return** deployment-ready Next.js app

---

See Step 7 for **GitHub Integration & Deployment** 🚀
