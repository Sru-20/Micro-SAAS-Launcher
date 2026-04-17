# Marketplace Template

This template generates a polished marketplace-style app with a working listings flow:

- Browse listings (`/`, `/listings`)
- View listing detail (`/listings/[id]`)
- Manage listings in an admin page (`/admin/listings`)
- Optional fake-auth module for protecting admin routes (`/login`)

## Required env

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Required tables (Supabase)

Create at least:

- `listings`: `id`, `project_id`, `title`, `description`, `price`, `seller_name`, `created_at`

