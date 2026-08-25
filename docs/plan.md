# Plan

Define the MVP architecture for Almanac as a private movies-and-books logging app that fits the existing Next.js codebase and the repo's ledger-style product rules. The first version should stay intentionally narrow, fetch metadata through server-side routes only, use Postgres-backed user data, and leave clean extension points for a later knowledge-graph system without forcing graph complexity into the MVP.

## Scope
- In: MVP planning for movies and books only, Next.js App Router + Postgres + server-side API routes, metadata sourcing, image storage strategy, review and logging data model, visible simple tags, and a future-ready knowledge-graph foundation.
- Out: Colors, browser extension, social features, public profiles, recommendation systems, multi-log history per title, and full knowledge-graph UX in v1.

## Product decisions
- The first version includes movies and books only.
- Reviews should support lightweight markdown from the start.
- Each movie or book should be a single editable entry rather than a repeatable log history model.
- Dates, review text, rating, status, and tags can be edited over time on the same entry.
- Tags should be visible in the UI as simple labels in v1.
- The longer-term direction for tags is a knowledge-graph style system, so the schema should preserve reusable tag identities and connections.
- The stack direction for implementation is Next.js App Router + Postgres + server-side API routes.

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
- Reuse one row primitive across movies and books with muted left metadata, bold title, muted subline, and a hairline divider.
- Keep `List view / Images view` and status toggles as plain text controls with slash separators.
- Keep `Add new +` as a text affordance rather than a styled button.
- Show tags as simple textual labels in v1 without turning them into a noisy taxonomy surface.

## Delivery phases
- Phase 1: Confirm stack choices already present in the repo, add the database/auth/ORM foundation, and document environment requirements.
- Phase 2: Implement the data layer and user-scoped schema for movies, books, tags, and preferences.
- Phase 3: Build the movie flow with TMDB-backed server-side search, add flow, detail page, editable markdown review, and watchlist/watched transitions.
- Phase 4: Mirror the same experience for books with Open Library-first search and provider fallback planning.
- Phase 5: Add visible simple tags, tag filtering foundations, and schema-safe hooks for future knowledge-graph work.
- Phase 6: Polish the ledger UI, validation states, accessibility, caching behavior, and editing flows.

## Validation checklist
- Verify every data query is scoped by `user_id`.
- Verify client code never calls TMDB or book providers directly.
- Verify list pages remain mostly server-rendered and lightweight.
- Verify markdown review rendering is safe and intentionally limited.
- Verify tags are reusable entities, not just comma-separated strings.
- Verify the schema still supports later graph relationships without a migration-heavy rewrite.

## Open questions to revisit later
- Whether v1 should support provider fallback automatically in the UI or only as an internal implementation path.
- Whether tags should appear on list rows, detail pages, or both in the first shipped UI.
- Whether editing the date field should preserve a separate audit timestamp, even though the entry itself stays singular.
