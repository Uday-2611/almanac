<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Almanac Project Rules

## Source Of Truth

- Read these documents before making product or UI decisions:
  - `docs/plan.md`
  - `docs/.md/PRD.md`
  - `docs/.md/IMPLEMENTATION_PLAN.md`
  - `docs/.md/FRONTEND_GUIDELINES.md`
  - `docs/.md/TECH_STACK.md`
- Treat `docs/plan.md` as the active working plan for this project.
- Use `docs/.md/PRD.md`, `docs/.md/IMPLEMENTATION_PLAN.md`, `docs/.md/FRONTEND_GUIDELINES.md`, and `docs/.md/TECH_STACK.md` as supporting product constraints unless the user explicitly overrides them.
- If `docs/plan.md` conflicts with the older supporting docs, prefer `docs/plan.md` for current implementation direction and preserve the user's latest explicit decisions there.
- Keep both `AGENTS.md` and `docs/plan.md` updated as the project evolves so future sessions inherit the latest plan and guardrails.
- Before writing framework-specific code, read the relevant guide in `node_modules/next/dist/docs/` for this installed Next.js version.

## Product Guardrails

- Build a private, single-user-per-account logging tool.
- Current MVP focus: movies and books only.
- Do not add any social features: no public profiles, sharing, comments, follows, likes, feeds, or collaboration.
- Prefer fast entry flows and quiet browsing over decorative UI or engagement mechanics.
- Keep external API calls server-side through Route Handlers. Do not call TMDB or books APIs directly from client components.
- Support lightweight markdown in reviews from the start.
- Treat each movie or book as a single editable entry in v1 rather than a repeated logging history model.
- Make tags visible as simple labels in v1, but design them as reusable entities that can grow into a future knowledge-graph system.

## Frontend Guardrails

- The product is a ledger, not a dashboard.
- Default visual language:
  - no cards
  - no shadows
  - no badges
  - no colored primary buttons
  - no unnecessary icons
- Reuse one row primitive pattern across movies, books, and colors:
  - muted left metadata column
  - bold title
  - muted subline
  - hairline divider
- Text toggles such as `List view / Images view` and `Watchlist / Watched` must render as plain text controls with `/` separators.
- `Add new +` should remain a text affordance, not a filled button.
- Use monochrome, restrained UI chrome. The only loud color should come from saved color content on the Colors section.
- Respect the accessibility requirements in `docs/.md/FRONTEND_GUIDELINES.md`, especially semantic controls, focus states, contrast, and real text for color values.

## shadcn/ui Guardrails

- Use shadcn/ui only for low-level primitives and keep them visually stripped down to match the ledger aesthetic.
- Initialize shadcn non-interactively.
- Prefer only the components needed for the current milestone instead of bulk-installing everything.
- After shadcn initialization, verify that Tailwind v4 font tokens still point to literal font families rather than circular CSS variables.

## Architecture Guardrails

- Use the App Router structure in `app/`.
- Prefer Server Components for list pages and server-side data access by default.
- Add client components only when interactivity genuinely requires them.
- Scope all user data access by `user_id` at the query layer.
- Keep the extension as a separate package when that milestone begins.
