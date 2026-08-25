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

1. Implement Drizzle schema for `users`, `movies`, `books`, `colors`, `user_preferences` per the PRD's data model section.
2. Run initial migration against Neon.
3. Write typed query helpers in `/lib/db` for: create/list/update/delete on movies and books (scoped by `user_id` on every query — no query should ever be written without a `where user_id = ...` clause), and create/list/delete for colors.
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

## Milestone 4 — Colors (web app side)

1. Build `/api/colors` routes: `POST` (create — accepts hex, source_url, source_title, optional screenshot), `GET` (list, scoped to user), `PATCH` (label/rename), `DELETE`.
2. Build `/app/colors` page:
   - `ListRow`-based List view (hex + source domain).
   - Images view = grid of `ColorSwatch`.
   - Rename and delete actions per row (simple inline affordances, no modal needed for rename).
   - Copy-hex-to-clipboard on click.
3. Build a personal-access-token flow in `/app/settings`: user generates a token there, which the extension will use — implement token issuance + storage (hashed) + a verification middleware for the colors API routes that accepts either the normal session or a valid bearer token.

**Done when:** you can `POST` a fake color via `curl` with a generated token and see it appear correctly in both view modes on the Colors page.

---

## Milestone 5 — Browser Extension

1. Scaffold a Manifest V3 extension (Plasmo, WXT, or plain TS — pick based on how much you want React in the popup).
2. Popup UI: "Pick a color" button → calls `new EyeDropper().open()` → on result, capture hex + `chrome.tabs.query` active tab's URL/title.
3. Settings screen in the popup: paste the personal access token from `/settings`, store in `chrome.storage.local`.
4. On pick: `POST` to `/api/colors` with the bearer token; on network failure, push to a local pending-queue in `chrome.storage.local` and retry on next successful pick or on an interval.
5. Show the last 3–5 colors picked this session in the popup for immediate confirmation.
6. Manual test: load unpacked in Chrome, pick colors from a few different real sites, confirm they land correctly on `/colors`.

**Done when:** picking a color anywhere in the browser reliably produces a new row on the Colors page within a couple seconds, and a picked color survives a brief offline period via the retry queue.

---

## Milestone 6 — Polish Pass

1. Per-section view-mode memory (confirm List/Images choice persists per movies/books/colors independently, per the schema's `user_preferences` table).
2. Keyboard-first add flow: `/` or a shortcut to open Add New from anywhere on a list page (nice-to-have, skip if time-constrained).
3. Data export: a simple "Export my data" action in Settings that dumps the user's movies/books/colors as one JSON file.
4. Full pass against Frontend Guidelines: audit every screen for stray shadows/cards/colored buttons that crept in during feature building — this is the point to actively remove, not add.
5. Accessibility pass: keyboard-only walkthrough of every flow (add, mark watched, rate, rename color, toggle views), fix any non-focusable interactive elements.
6. Mobile responsive pass — single column already helps here, but verify the top-bar toggles wrap sensibly on narrow screens.

**Done when:** the product feels finished and quiet — no loose ends, no visual noise that snuck in during feature milestones.

---

## Suggested Order of Operations for Codex Sessions

Because each milestone is testable in isolation, feed them one at a time rather than the whole plan at once — this keeps Codex's context focused and makes it easy to catch drift from the Frontend Guidelines early (e.g., catch a stray shadow or card in Milestone 2 before that pattern gets copy-pasted into Milestone 3 and 4). Review the diff after each milestone against `FRONTEND_GUIDELINES.md` before moving to the next.
