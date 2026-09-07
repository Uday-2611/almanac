# Plan

Define the MVP architecture for Almanac as a private movies-and-books logging app that fits the existing Next.js codebase and the repo's ledger-style product rules. The first version should stay intentionally narrow, fetch metadata through server-side routes only, use Postgres-backed user data, and leave clean extension points for a later knowledge-graph system without forcing graph complexity into the MVP.

## Scope
- In: MVP planning for movies and books only, Next.js App Router + Postgres + server-side API routes, metadata sourcing, image storage strategy, review and logging data model, visible simple tags, and a future-ready knowledge-graph foundation.
- Out: Colors, browser extension, social features, public profiles, recommendation systems, multi-log history per title, and full knowledge-graph UX in v1.

## Product decisions
- The first version includes movies and books only.
- The root route is session-aware: visitors without an active session see the landing page, while visitors with an active session go directly to `/movies`.
- The public flow is landing page to `/login`, then to `/movies` after successful authentication.
- `/movies`, `/books`, and `/settings` are protected product routes.
- A signed-out returning user follows the public landing and login flow; "existing user" routing applies when a valid session is present.
- Reviews should support lightweight markdown from the start.
- Each movie or book should be a single editable entry rather than a repeatable log history model.
- Dates, review text, rating, status, and tags can be edited over time on the same entry.
- Tags should be visible in the UI as simple labels in v1.
- The longer-term direction for tags is a knowledge-graph style system, so the schema should preserve reusable tag identities and connections.
- The stack direction for implementation is Next.js App Router + Postgres + server-side API routes.
- Authentication uses Better Auth with email and password for v1. Google OAuth is deferred.
- Neon is the managed Postgres provider and Drizzle ORM owns the application schema and migrations.

## Architecture decisions
- Use the App Router in `app/` with Server Components as the default for list and detail pages.
- Add Client Components only where interactivity truly requires them, such as search flows, text toggles, and editable review inputs.
- Use Postgres as the primary data store, with all reads and writes scoped by `user_id` at the query layer.
- Keep metadata provider calls on the server through Route Handlers so client components never call TMDB or books providers directly.
- Store provider IDs and normalized metadata in the database so fetched records are stable even if provider responses change later.

## Data model direction
- Model movies and books as separate user-scoped content records with a shared conceptual structure: title, creator, provider ID, provider name, status, rating, review, review format, logged date, and updated timestamps.
- Treat each title as one editable record per user in v1 rather than a diary of repeated watches or rereads.
- Support markdown-capable review content from the start, with a lightweight format choice documented in the schema and rendering pipeline.
- Add visible reusable tags through tables shaped like `tags` and `entry_tags`, even if the first UI only shows them as plain labels.
- Keep room for future graph expansion by avoiding hard-coded tag strings on entries and by preserving stable IDs for tags and source entities.

## Metadata and images
- Use TMDB as the primary movie metadata source.
- Use Open Library as the primary books metadata source, with Google Books as a documented fallback path if coverage or cover quality is insufficient.
- Fetch search and detail data through server-side Route Handlers that return trimmed response shapes tailored to the UI.
- Store poster and cover URLs from the source providers in Postgres instead of copying assets into first-party storage in v1.
- Introduce owned blob storage only if a later phase requires user-uploaded media, cached copies, or provider-independent asset durability.

## UI and interaction direction
- Keep the product visually aligned with the ledger rules in `docs/.md/FRONTEND_GUIDELINES.md`: no cards, no shadows, no colored primary buttons, no dashboard chrome.
- Reuse one row primitive across movies and books with muted left metadata, bold title, and muted subline. Keep the standard hairline divider available, with the movie list using the approved borderless interaction treatment.
- Keep `List view / Images view` and status toggles as plain text controls with slash separators.
- Keep `Add new +` as a text affordance rather than a styled button.
- Show tags as simple textual labels in v1 without turning them into a noisy taxonomy surface.

## Delivery phases
- Phase 0 (complete): Initialize shadcn/ui, establish the App Router folder/file structure, reserve server API boundaries, and document the user flow.
- Phase 1 (complete): Implement the landing page and Better Auth foundation, including session lookup, protected-route enforcement, post-login redirect to `/movies`, and Vercel-managed secrets for Production, Preview, and Development.
- Phase 2 (complete): Provision Neon through Vercel, implement the Drizzle data layer and user-scoped schema for movies, books, tags, and preferences, and apply the initial committed migration.
- Phase 3 (implemented): Build the movie flow with TMDB-backed server-side search, add flow, database-backed list and detail pages, editable review/rating/date, watchlist/watched transitions, and watched-only custom lists.
- Phase 4: Mirror the same experience for books with Open Library-first search and provider fallback planning.
- Phase 5: Add visible simple tags, tag filtering foundations, and schema-safe hooks for future knowledge-graph work.
- Phase 6: Polish the ledger UI, validation states, accessibility, caching behavior, and editing flows.

## Validation checklist
- Verify visitors without a session see the landing page and authenticated visitors opening `/` are redirected to `/movies`.
- Verify successful login redirects to `/movies` and protected routes redirect signed-out visitors to `/login`.
- Verify every data query is scoped by `user_id`.
- Verify client code never calls TMDB or book providers directly.
- Verify list pages remain mostly server-rendered and lightweight.
- Verify markdown review rendering is safe and intentionally limited.
- Verify tags are reusable entities, not just comma-separated strings.
- Verify the schema still supports later graph relationships without a migration-heavy rewrite.

## Open questions to revisit later
- Whether the landing page needs a separate sign-up path or one combined authentication entry point.
- Whether v1 should support provider fallback automatically in the UI or only as an internal implementation path.
- Whether tags should appear on list rows, detail pages, or both in the first shipped UI.
- Whether editing the date field should preserve a separate audit timestamp, even though the entry itself stays singular.

## Current implementation state
- The `/movies` visual foundation now mirrors the four Figma states: watched/watchlist ledger views, single-row horizontally scrolling poster views, and My Lists in both display modes.
- Movie navigation is query-driven with `status=watchlist|watched|lists` and `view=list|images`, keeping the page server-rendered and ready for database-backed data.
- Movie pages now read authenticated, user-scoped records from Neon; the former movie seed catalog is no longer used for movie browsing or movie search.
- Movie and book list browsing uses straight, borderless rows with GSAP hover isolation: the active row's date, title, and creator move outward and grow together while neighboring rows recede. The interaction is silent.
- Movie image browsing uses a smooth horizontal rail of enlarged posters; GSAP scales each poster evenly from its center and reveals its title and director below on hover or focus.
- The books image view is a bottom-anchored, smoothly scrolling horizontal shelf of narrow book spines; GSAP scales a focused or hovered spine evenly from its center and reveals its title and author above.
- Movie and book selections open a shared, scrollable information card: a full-bleed poster occupies the modal's complete left pane; title, creator, year, user rating, review, logged date, and tags sit on the right; cast or contributor credits continue below.
- Movie detail navigation is intercepted into a modal over the existing movies ledger, with a blurred background, Escape/backdrop dismissal, and a direct-URL standalone page fallback.
- A shared global media-search overlay is available from navigation and from Movies/Books `Add New +` controls. Navigation searches both types; entry controls pre-filter by type.
- Movie search now queries TMDB through `/api/movies/search`, and each result can be saved explicitly to Watchlist or Watched. Book search remains on the typed local catalog until Phase 4.
- Movie My Lists sections use an accessible open/close control with a subtle animated disclosure while preserving the ledger header.
- The authenticated navbar pairs the Almanac wordmark with a three-line menu control. Its compact rectangular menu animates open and closed, supports outside-click and Escape dismissal, and lists Movies, Books, Colors, Texts, and My profile with monochrome hover states.
- Better Auth email/password flows, database-backed sessions, protected product routes, and sign-out are implemented locally.
- The Drizzle schema includes Better Auth's core tables plus user-scoped movies, books, reusable tags, join tables, and view preferences.
- User-created movie lists are persisted through `movie_lists` and `movie_list_items`. Both the query layer and Postgres enforce that only the owner's Watched movies can be added; moving a movie back to Watchlist clears watched-only fields and automatically removes all custom-list memberships.
- The server-only `TMDB_API_READ_TOKEN` is encrypted in Vercel for Production, Preview, and Development, is available locally through the ignored `.env.local`, and has passed an authenticated TMDB request.
- The repository is linked to the Vercel project `almanac`. The `almanac-postgres` Neon database is connected to Production, Preview, and Development, `BETTER_AUTH_SECRET` is stored as a sensitive Vercel variable in each environment, and `drizzle/0000_tiresome_gargoyle.sql` has been applied successfully.
