 
## Purpose
To help users track what they eat and how it affects their digestion, so they can identify ingredients and habits that improve or worsen their gut health, while also monitoring nutrition, symptoms, and supplements over time.

## Project Rules
- Prefer minimal, targeted changes. Avoid broad refactors unless requested.
- Keep UX changes mobile-first and test for small screens.
- Avoid breaking Supabase types or schema alignment. If adding new DB fields, update `supabase/migrations` and regenerate `src/integrations/supabase/types.ts`.
- If an API call changes shape, update TypeScript types and add runtime safeguards.

## Coding Style
- TypeScript/React: functional components, hooks, and explicit types for public interfaces.
- Avoid `any` unless absolutely necessary; prefer `unknown` + safe parsing.
- Keep utility functions pure and colocate if only used in one component.
- Use `const` by default, `let` only when reassigning.
- Use `camelCase` for variables/functions and `PascalCase` for components/types.
- Tailwind: prefer small, composable utility classes; avoid inline styles.

## Data & Safety
- All Supabase queries must handle nulls and partial data.
- Add guardrails for missing fields (`??`, default values).
- CSV exports must escape/quote fields that can contain commas.

## Docs & References
- Supabase docs: https://supabase.com/docs
- Radix UI (Accordion/Drawer): https://www.radix-ui.com/docs/primitives
- shadcn/ui patterns: https://ui.shadcn.com
