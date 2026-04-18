# Full App Template (Blueprint -> Next.js)

This folder is the generic scaffold used by the generator to build complete apps from blueprint JSON.

## Fill logic

1. Read `blueprint.pages`.
2. For each page, map section types to components:
- `hero` -> `Hero`
- `form` -> `DynamicForm`
- `table` -> `AutoCRUD`
3. Inject text fields (for example: `title`, `subtitle`, `cta_text`).
4. Bind `table`/`form` sections to Supabase tables and always pass `projectId`.
5. Write resolved files to `output/` (or another target folder).

## Expected runtime bindings

- `projectId` is required for all table/form sections.
- Supabase env vars must be set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Validation checklist (Feedback blueprint)

1. Landing page renders Hero content from landing section.
2. Form page renders `DynamicForm` bound to `feedback`.
3. Dashboard page renders `AutoCRUD` bound to `feedback` and `votes`.
