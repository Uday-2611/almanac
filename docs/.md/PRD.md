# Product Requirements Document
## Personal Media & Color Log (working title — rename before build)

---

## 1. Vision

A private, single-user-per-account logging tool for three things: movies, books, and colors. No feeds, no followers, no likes, no comments, no public profiles. The entire product is "you, quietly keeping records." Visual language: minimal, editorial, typographic — matching the reference screenshot (all-caps wordmark, hairline dividers, plain list rows, restrained UI chrome, generous whitespace).

Design cues taken directly from the reference image:
- Top bar: site wordmark (left) + a hamburger/list icon; on the right, two toggle pairs rendered as text links separated by "/" — `List view / Images view` and `Watchlist / Watched`.
- Below that, an "Add new +" text link (not a button with a background).
- Rows: date/month-year on the left in a light gray, title in bold black + director/author in gray directly underneath, no borders except a thin rule between rows, no cards, no shadows.
- Typography: two-tier hierarchy per row (bold title, muted metadata line) is the core repeating pattern — reuse this exact row pattern for books and colors too, swapping the metadata line's content.

---

## 2. Core Principles

1. **No social layer, ever.** No usernames visible to others, no sharing links, no comments, no public pages. Single-tenant per account.
2. **Minimal by default.** Every screen should be readable as plain text first; imagery (posters/covers) is an optional view mode, not the default assumption.
3. **Fast entry, slow browsing.** Adding an item should take seconds (search → pick → save). Browsing the log should feel like reading a personal ledger.
4. **Two list rendering modes everywhere a list exists:** `List view` (text only, dense) and `Images view` (poster/cover grid or thumbnail rows). Both are permanent toggles at the top of any listing page.

---

## 3. Feature Set (v1 scope)

### 3.1 Movies

**Two states, toggled the same way as the reference image (`Watchlist / Watched`):**

- **Watchlist** — movies the user wants to watch.
  - Fields shown in the row: Title, Director.
  - Clicking the title expands/navigates to a detail view showing: Director, Cast (list of actor names), Short synopsis, Release year, Runtime (optional), Poster.
  - Action: "Mark as watched" — moves the item to Watched and opens the review form.
- **Watched** — movies the user has seen and rated.
  - Everything in Watchlist detail, plus: User's own written review (free text), Star rating (1–5, half-star optional), Date watched.
  - Row metadata line shows Director (list view) or nothing extra beyond poster (images view). Rating can show as small stars next to the title.

**Adding a movie:** search box hitting TMDB, user picks from results (poster + year to disambiguate), title/director/cast/synopsis/poster auto-fill from TMDB, user only has to add their own review + rating when marking watched.

### 3.2 Books

Structurally identical to Movies, with author instead of director, no "cast" equivalent (or optionally: illustrator/translator as a secondary credit field).

- **Watchlist (Want to Read)** — Title, Author shown in row; detail view adds: Author, Short synopsis/blurb, Page count, Publish year, Cover.
- **Watched → "Read"** — adds User's review, Star rating, Date finished.

**Adding a book:** search hitting Open Library or Google Books API, same auto-fill pattern.

### 3.3 Colors

A page listing every color the user has ever clipped from anywhere on the web via the browser extension.

- Each saved color entry stores: hex value, the source URL it was picked from, page title (if available), a screenshot thumbnail of the pixel area it was picked from (optional, nice-to-have), and the timestamp saved.
- List view: hex code + source domain, in the same title/metadata row pattern as movies/books.
- Images view: grid of solid color swatches (each swatch is literally the color) with hex on hover/below.
- User can rename a color with a personal label, delete it, or copy the hex/RGB to clipboard.
- Optional (v1.5): group colors into user-created palettes.

### 3.4 Browser Extension (Chrome/Edge, Manifest V3)

- Uses the browser's native `EyeDropper` API to let the user pick any pixel on any page.
- On pick: extension grabs the hex value, the active tab's URL and title, and sends it to the website's API (authenticated).
- Small popup UI: shows the last few colors picked in that session, a "pick color" button, and a login state indicator.
- Auth: user logs into the extension once (OAuth against the same backend as the website), token stored in extension local storage, refreshed as needed.
- No color storage lives only in the extension — everything is synced immediately to the backend so the website is always the source of truth.

### 3.5 View Modes (applies to Movies, Books, Colors lists)

- `List view`: plain rows, text-only, dense, sorted by date added/watched (most recent first) by default.
- `Images view`: poster/cover/swatch grid, same sort order, lazy-loaded.
- Toggle state can be remembered per-section (e.g., user can prefer List for books and Images for movies) — store as a per-user, per-section preference.

### 3.6 Explicitly Out of Scope for v1

- Any social/sharing feature, comments, follows, public profiles.
- Multi-user collaboration on a single list.
- Mobile native apps (responsive web is enough for v1; extension is desktop-browser only).
- Recommendations/algorithmic suggestions.
- TV shows (can be a v2 addition using the same movie pattern).

---

## 4. Information Architecture / Routes

```
/                       → redirect to /movies (or a minimal dashboard, TBD)
/movies                 → Movies list, tab state = watchlist | watched (query param)
/movies/[id]            → Movie detail (view + edit if watched: review/rating)
/books                  → Books list, tab state = want-to-read | read
/books/[id]             → Book detail
/colors                 → Colors list
/colors/[id]            → Color detail (rare — may just be a modal instead of a route)
/settings               → account, extension pairing/token, view-mode defaults
/login                  → Google OAuth entry
```

---

## 5. Data Model (draft)

```
User
- id
- email
- name
- created_at

Movie
- id
- user_id (FK)
- tmdb_id
- title
- director
- cast (string[] or joined table)
- synopsis
- poster_url
- release_year
- runtime_minutes
- status: 'watchlist' | 'watched'
- review (nullable, text)
- rating (nullable, 1-5 or 1-10)
- date_added
- date_watched (nullable)

Book
- id
- user_id (FK)
- source_id (Open Library / Google Books id)
- title
- author
- synopsis
- cover_url
- page_count
- publish_year
- status: 'want_to_read' | 'read'
- review (nullable, text)
- rating (nullable)
- date_added
- date_finished (nullable)

Color
- id
- user_id (FK)
- hex
- rgb (derived, or stored)
- source_url
- source_title
- label (nullable, user-given)
- screenshot_thumb_url (nullable)
- created_at

UserPreference
- user_id (FK)
- section: 'movies' | 'books' | 'colors'
- view_mode: 'list' | 'images'
```

---

## 6. Non-Functional Requirements

- **Privacy-first:** each user's data is fully isolated; no endpoint should ever be able to return another user's rows. Enforce at the query layer (row-level scoping on every query, not just at the UI).
- **Fast search-to-save flow:** external API search (TMDB/Books) should return results in under ~1s perceived, with debounced input.
- **Offline-tolerant extension:** if the network is down when a color is picked, queue locally and retry sync (simple local queue is enough for v1).
- **Accessible minimalism:** despite the pared-back visual style, maintain proper contrast, focus states, and semantic HTML — minimal ≠ inaccessible.
- **No dark patterns, no analytics-driven engagement loops** — this is intentionally the opposite of a social app.

---

## 7. Suggested Build Phases

**Phase 1 — Core logging (movies + books, no extension)**
- Auth, DB schema, movies CRUD + TMDB search, books CRUD + Open Library search, list/images view toggle, watchlist/watched-review flow.

**Phase 2 — Colors + extension**
- Colors page + API endpoints, Chrome extension with EyeDropper, auth handshake between extension and web app.

**Phase 3 — Polish**
- Per-section view-mode memory, empty states, keyboard shortcuts for fast add, review formatting (optional markdown), export data (JSON dump) as a personal-data-portability nicety.

---

## 8. Handoff Notes for Implementation (e.g., for Codex)

- Treat the reference screenshot's row pattern (date-left / bold-title + gray-subline / hairline divider) as the base component (`ListRow`) reused across movies, books, and colors — build it once, generic over a small props shape (`{ leftMeta, title, subline, thumbnail?, onClick }`).
- Build the `Watchlist/Watched`-style and `List view/Images view`-style toggles as one shared `TextToggle` component (plain text links, active state = bold/black, inactive = gray, separated by "/").
- External API calls (TMDB, Open Library/Google Books) should go through backend API routes, never directly from the client, to keep API keys server-side and allow response shaping/caching.
