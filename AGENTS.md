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

## User Flow

- Treat `/` as the session-aware entry point.
- Visitors without a valid session see the landing page, whose primary path leads to `/login`.
- Successful authentication sends the user to `/movies`.
- Visitors with a valid active session who open `/` go directly to `/movies`.
- Protect `/movies`, `/books`, and `/settings`; unauthenticated access to those routes redirects to `/login` once authentication is implemented.
- "Existing user" in this flow means a user with a valid active session. A signed-out returning user follows the public landing and login flow.

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
  - hairline divider by default; the movie list is an explicit borderless exception
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
- Use Better Auth with email/password for v1; Google OAuth is deferred until explicitly requested.
- Use Neon Postgres through Drizzle ORM. Commit generated migrations under `drizzle/` and never expose `DATABASE_URL` or `BETTER_AUTH_SECRET` to client code.
- The Vercel project `almanac` is connected to the `almanac-postgres` Neon database in Production, Preview, and Development; the initial migration is `drizzle/0000_tiresome_gargoyle.sql`.
- Prefer Server Components for list pages and server-side data access by default.
- Add client components only when interactivity genuinely requires them.
- Scope all user data access by `user_id` at the query layer.
- A movie may belong to a user-created list only while it belongs to the same user and has `watched` status. Preserve the API validation and database triggers that enforce this; moving a movie back to `watchlist` must remove its custom-list memberships.
- A book may belong to a user-created list only while it belongs to the same user and has `read` status. Preserve the equivalent API validation and database triggers; moving a book back to `want_to_read` must remove its custom-list memberships.
- Preserve owner-scoped movie-list CRUD. Deleting a custom list must delete only its memberships, not the watched movies it contained; movie deletion remains a separate confirmed action.
- Render reviews through the sanitized markdown component. Do not enable raw HTML in user-authored review content.
- Keep the extension as a separate package when that milestone begins.

## Current UI Foundation

- The movies page implements the four approved Figma states through query parameters: `status=watchlist|watched|lists` and `view=list|images`.
- Reuse the movie ledger row, text-toggle, and horizontal poster-rail patterns when connecting real data or mirroring the experience for books.
- Preserve the large quiet space above movie content; it is an intentional part of the approved layout, not missing content.
- Preserve the movie and book list interaction signature: straight, silent borderless rows with GSAP hover isolation applied to the active row's date, title, and creator together.
- Preserve the movies image-view signature: a single smoothly scrolling, closely spaced horizontal rail of 2:3 posters whose GSAP hover/focus motion enlarges them evenly from the center, reveals title and director below, and softly desaturates neighboring posters.
- Preserve the books image-view signature: narrow, varied-height cover-derived book spines at the bottom of the viewport in a smoothly scrolling horizontal shelf; use a quiet typographic spine when cover art is unavailable, and keep the GSAP hover/focus motion that enlarges each spine evenly from the center and reveals title and author above.
- Movie and book detail routes use the same dark, scrollable journal-modal layout, with artwork occupying the entire left pane and the right-side sequence adapted to director/cast or author/contributors.
- Movie links use an intercepted parallel route so details open as a modal over the movies ledger; preserve direct `/movies/[movieId]` page rendering as the hard-navigation fallback.
- Reuse one global search overlay from the nav and the Movies/Books `Add New +` controls.
- Preserve the Frame 50 search signature: a light white-blurred overlay, centered full-width white borderless input with four-pixel corners and an icon close control, followed by individually separated white result strips with artwork, title, creator/year metadata, and right-aligned add actions.
- Book search uses the server-only Open Library client first and automatically falls back to the server-only Google Books client when Open Library fails or has no results. Preserve provider-scoped identities, normalized metadata, `OPEN_LIBRARY_CONTACT_EMAIL`, and the server-only `GOOGLE_BOOKS_API_KEY`; keyless requests are supported, but a key is recommended because unauthenticated quota can be unavailable.
- Book detail artwork uses a 2:3 frame and preserves each source cover's natural aspect ratio with containment rather than cropping.
- Preserve parity between the movie and book journal modals: dark scrim, transparent glass pane, title/creator/year, directly editable rating and logged date, overview, sanitized-markdown review, credits, and eligible custom lists.
- `TMDB_API_READ_TOKEN` is configured as an encrypted Vercel variable for Production, Preview, and Development; never expose it to client code or logs.
- Preserve the accessible animated open/close disclosure on Movie and Book My Lists sections. Use only a slightly enlarged plus/minus icon for the disclosure control; keep Rename and Delete free of underlines, with Delete turning red on hover.
- Preserve the authenticated navbar signature: the Almanac wordmark sits beside a three-line menu control that morphs into a close icon; the compact square-cornered menu uses subtle open/close motion, monochrome item hovers, and outside-click/Escape dismissal.
- Preserve the 2:3 movie artwork ratio in both image view and the information modal. Separate the fixed desktop poster from the scrollable, colorless transparent information pane with a narrow gap; use an icon close control and a subtly rounded review inset. Show the smooth GSAP ledger confirmation only after a Watchlist or Watched add request succeeds.
- Use quiet ledger-style skeletons for route loading, provider search, and authenticated mutations; retain accessible live status text for assistive technology.
- Preserve the movie modal's film-journal sequence: a large title using the Almanac wordmark's Geist family and tight tracking, director/year, directly editable stars, watched date, overview, editable sanitized-markdown review, Archive Note entry, compact cast, then custom lists. Keep the borderless pane completely free of background color, with dark type six pixels from the fixed 2:3 poster over a light white-blurred scrim.
- Treat `/movies/[movieId]/archive-note` as an A4 editorial writing surface. It is a design-only prototype until persistence and reusable tag editing are explicitly implemented.
