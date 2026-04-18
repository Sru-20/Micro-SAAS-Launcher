# Content Site Template

This template generates a polished blog/news style app with a working posts flow:

- Homepage with latest posts (`/`)
- Blog index and search (`/blog`)
- Post page (`/blog/[id]`)
- Admin editor (`/admin/posts`)
- Optional fake-auth module for protecting admin routes (`/login`)

## Required env

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Required tables (Supabase)

Create at least:

- `posts`: `id`, `project_id`, `title`, `content`, `author_name`, `created_at`

