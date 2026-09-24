# Implementation Plan

Sequenced so each milestone is independently testable. Written to be handed to Codex step by step — you can paste one milestone at a time as a prompt, or give it the whole doc and let it work through in order.

---

## Milestone 0 — Project Setup

1. Scaffold Next.js 14 (App Router) + TypeScript + Tailwind project.
2. Install and configure shadcn/ui (init only the primitives actually needed: dialog, dropdown, button-as-link-styled, input).
3. Set up Neon Postgres project + connection string in env.
4. Install Drizzle ORM, configure `drizzle.config.ts`, create `/lib/db` with client + empty schema file.
5. Set up Better Auth with Google OAuth only; confirm login/logout round-trip works against a blank page before building any real UI.
6. Set up Vercel project, confirm a "hello world" deploy succeeds end-to-end (env vars included).

**Done when:** a logged-in user lands on an empty authenticated page, deployed and reachable on a real URL.

---

## Milestone 1 — Data Layer

1. Implement Drizzle schema for accounts, movies, books, standalone texts, and user preferences per the active plan.
2. Run initial migration against Neon.
3. Write typed query helpers in `/lib/db` for owner-scoped movie, book, and Texts reads and mutations.
4. Add a lightweight test (or manual script) that inserts a row for one fake user and confirms a second fake user's query never returns it — this is the one thing to get provably right before building UI on top.

**Done when:** you can manually insert/query rows via a script and confirm per-user isolation.

---

## Milestone 2 — Movies (core loop)

1. Build `/lib/tmdb.ts` — server-only TMDB client (search-by-title, get-details-by-id).
2. Build `/api/movies/search` route — proxies TMDB search, returns trimmed result shape (title, year, poster, tmdb_id) to the client.
3. Build `/app/movies` page:
   - `TextToggle` for Watchlist/Watched (query param driven, e.g. `?status=watchlist`).
   - `TextToggle` for List view/Images view (persisted via `user_preferences`, falls back to List).
   - `ListRow`-based list, server-fetched.
   - `AddNewLink` → opens search modal → TMDB search → pick result → inserts a `watchlist` movie row with auto-filled fields.
4. Build `/app/movies/[id]` detail page/panel:
   - Shows director, cast, synopsis, poster, release year.
   - If status is `watchlist`: show a "Mark as watched" action that flips status and reveals the review/rating form.
   - If status is `watched`: show review text + `StarRating` (editable).
5. Wire empty state, loading skeleton, and error state per Frontend Guidelines §5.

**Done when:** you can search a movie, add it to your watchlist, open it, mark it watched, write a review, rate it, and see it reflected correctly in both List and Images view.

---

## Milestone 3 — Books (mirror of Milestone 2)

1. Build `/lib/books-api.ts` — Open Library client (search-by-title, get-details), with Google Books as a documented fallback path (can stub the fallback and leave a TODO if you want to ship Open Library-only first).
2. Build `/api/books/search` route.
3. Build `/app/books` page — same structure as movies, swap Director→Author, Cast→(optional secondary credit or omit).
4. Build `/app/books/[id]` detail page — Author, synopsis, cover, page count, publish year; Want to Read → Read flow with review + rating.

**Done when:** feature-parity with Milestone 2, confirmed by manually repeating the same test flow for a book.

---

## Milestone 4 — Texts and Polish Pass

1. Keep standalone Texts notes private, owner-scoped, automatically saved, and recoverable from local drafts; organize them with optional folders.
2. Per-section view-mode memory may retain the List/Image/Canvas choice independently for Movies and Books.
3. Keyboard-first add flow: `/` or a shortcut to open Add New from anywhere on a list page (nice-to-have, skip if time-constrained).
4. Data export: a simple "Export my data" action in Settings that dumps the user's movies, books, and Texts notes as one JSON file.
5. Full pass against Frontend Guidelines: audit every screen for stray shadows, cards, and colored buttons.
6. Accessibility pass: keyboard-only walkthrough of every flow (add, mark watched/read, rate, toggle views, write a note), fixing non-focusable interactive elements.
7. Mobile responsive pass: verify the top-bar toggles wrap sensibly on narrow screens.

**Done when:** the product feels finished and quiet — no loose ends, no visual noise that snuck in during feature milestones.

---

## Suggested Order of Operations for Codex Sessions

Because each milestone is testable in isolation, feed them one at a time rather than the whole plan at once — this keeps Codex's context focused and makes it easy to catch drift from the Frontend Guidelines early (e.g., catch a stray shadow or card in Milestone 2 before that pattern gets copy-pasted into Milestone 3 and 4). Review the diff after each milestone against `FRONTEND_GUIDELINES.md` before moving to the next.
