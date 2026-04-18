# Micro-SaaS Launcher

Turn a plain-English idea into a **working Next.js website**—with optional **one-click deploy** to a connected GitHub repo and Vercel.

**Flow:** Idea → AI blueprint → generated app → (optional) git push → live URL

---

## Features

- **AI blueprint** from natural language (`/auth/ai/generate`, Groq)
- **Code generator** that packages templates into a runnable Next.js app
- **Templates:** `content-site`, `marketplace`, and legacy `full-app` (inferred from blueprint when `template` is omitted)
- **Supabase** for auth, projects, and optional data sync in generated apps
- **ZIP download** of generated apps (`/api/generate/download`)
- **Auto-deploy** (optional): copy generated files into a local git repo, commit, push—Vercel deploys from GitHub

---

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) (auth + database)
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript

---

## Prerequisites

- Node.js 20+
- npm (or pnpm/yarn)
- A [Supabase](https://supabase.com/) project (for auth and `projects` / `users` tables as used by this app)
- Optional: [Groq API key](https://console.groq.com/) for AI blueprint generation
- Optional: GitHub repo + Vercel project for auto-deploy

---

## Installation

```bash
git clone <your-repo-url>
cd micro-saas-launcher
npm install
```

---

## Environment Variables

Create `.env.local` in the project root (never commit real secrets).

### Required for the launcher app

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only routes if used) |

### AI blueprint generation

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for `generateBlueprintFromIdea` |

### Optional: auto-deploy (GitHub → Vercel)

| Variable | Description |
|----------|-------------|
| `AUTO_DEPLOY_ENABLED` | Set to `true` to enable deploy after generate |
| `AUTO_DEPLOY_REPO_PATH` | **Absolute** path to a local clone of the repo Vercel builds from |
| `AUTO_DEPLOY_BRANCH` | Branch to push (default: `main`) |
| `AUTO_DEPLOY_LIVE_URL` | Public URL to show after deploy (e.g. `https://your-app.vercel.app`) |

**Auto-deploy checklist**

1. Create a GitHub repo and connect it to Vercel.
2. Clone that repo locally; use that folder path as `AUTO_DEPLOY_REPO_PATH`.
3. Ensure `git push` works from your machine (SSH or HTTPS + credentials).
4. Set Supabase env vars on the **Vercel** project for the generated site if it uses Supabase.

---

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # eslint (may include generated artifacts if present under output/)
```

---

## Usage

### Builder (UI)

1. Sign in (email/Google via Supabase).
2. Open **Builder** (`/builder`).
3. Describe your idea and generate a blueprint.
4. With auto-deploy configured, generation can push to your deploy repo and surface a **live URL**.

### Generate from CLI

```bash
npx tsx scripts/generate.ts --blueprint ./my-blueprint.json --output ./output/my-app --project-id proj_123
```

Templates are chosen from `blueprint.template` or inferred (e.g. blog → `content-site`).

### Generate API

`POST /api/generate` — body: `{ blueprint, projectId?, deploy?: boolean }`  
Returns file manifest JSON; with `deploy: true` and env set, also runs auto-deploy.

### Download ZIP

`POST /api/generate/download` — same body shape; returns a ZIP of the generated app.

---

## Project Structure (high level)

```
app/                 # Next.js routes (dashboard, builder, auth, APIs)
components/          # Launcher UI
lib/                 # Generator, Supabase helpers, auto-deploy, AI
scripts/generate.ts  # CLI generator
templates/           # full-app, content-site, marketplace
```

---

## Generated Apps

Each template is a standalone Next.js app with its own `package.json`. After generation:

```bash
cd output/your-app
npm install
npm run dev
```

See each template’s `README.md` under `templates/<name>/` for table names and routes.

---

## Auto-Deploy Flow (detailed)

1. **One-time:** Create GitHub repo → import in Vercel → add env vars on Vercel for the deployed app.
2. **Local:** Clone that repo; set `AUTO_DEPLOY_REPO_PATH` to that folder’s absolute path.
3. **Launcher `.env.local`:** Set `AUTO_DEPLOY_ENABLED=true` and `AUTO_DEPLOY_LIVE_URL` to your Vercel URL.
4. **Restart** `npm run dev` after changing env.
5. Generate with `deploy: true` (Builder does this when configured).

On success, the API returns `deployment.liveUrl`. If deploy is disabled or misconfigured, you still get the blueprint and can use ZIP download or CLI output.

---

## Security Notes

- Do not commit `.env.local` or API keys.
- Rotate keys if they were ever committed.
- Service role keys must only run on the server.

---

## License

Private / your license — update this section when you publish the repo.
