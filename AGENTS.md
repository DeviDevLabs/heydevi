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

## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.
### Available skills
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: /Users/devi/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: /Users/devi/.codex/skills/.system/skill-installer/SKILL.md)
### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
- After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
- When `SKILL.md` references relative paths (e.g., `scripts/foo.py`), resolve them relative to the skill directory listed above first, and only consider other paths if needed.
- If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
- If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
- If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
- If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
- Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
- Context hygiene:
- Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
- Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
- When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
