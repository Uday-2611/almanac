# Tech Stack & Architecture Recommendation

Consistent with your existing stack choices (Forge, Archive, Ledger) so you can reuse patterns, auth setup, and DB conventions across projects.

## 1. Frontend

- **Framework:** Next.js 14 (App Router) — same as your other projects, good SSR/SEO isn't needed here but you still benefit from file-based routing, server actions, and easy Vercel deploys.
- **Styling:** Tailwind CSS + shadcn/ui — shadcn gives you unstyled-by-default primitives (dialogs, dropdowns, toggles) that you can strip down to match the hairline-minimal look in your reference image, rather than fighting a pre-styled component library.
- **Typography:** Since this leans editorial/minimal like your other builds — a serif or condensed sans for the wordmark/titles (e.g., Playfair Display or a grotesk like Söhne/Inter for body) would fit; reuse your IBM Plex Mono + Playfair pairing from Forge if you want visual consistency across your personal app suite.
- **State/data fetching:** Server Components for list pages (fetch directly from DB on the server), React Query (TanStack Query) only where you need client-side mutation/optimistic UI (e.g., toggling watchlist→watched, star ratings).

## 2. Backend / API

- **API layer:** Next.js Route Handlers (`app/api/.../route.ts`) — no need for a separate backend service at this scale. Handles: movie/book search proxy (TMDB, Open Library), CRUD for movies/books/colors, extension auth token issuance/verification.
- **Auth:** Better Auth with Google OAuth only (matches your Forge setup) — simplest for a single-user-per-account personal tool, and Better Auth's session tokens can be reused for extension auth (issue a long-lived API token from the web app's settings page, extension stores and sends it as a Bearer token).

## 3. Data Storage

- **Database:** Neon Postgres (serverless Postgres, matches your existing stack) — one project can hold all three domains (movies, books, colors) as separate tables, scoped by `user_id`.
- **ORM:** Drizzle ORM — you're already using this; migrations are cheap and the schema in the PRD maps directly to Drizzle table definitions.
- **File/image storage:** You mostly don't need your own image storage — TMDB and Open Library/Google Books both serve poster/cover images directly from their CDNs, so you can just store the URL. The one place you *do* need storage is the optional color-pickup screenshot thumbnail — Vercel Blob or Cloudinary (you've used Cloudinary before, in Archive) would both work fine for that, low volume.

## 4. External APIs

- **Movies:** TMDB API (The Movie Database) — you've already integrated this in your TMDB project, so this is a direct reuse of that integration knowledge. Free tier is generous enough for personal use.
- **Books:** Open Library API (fully free, no key required, good coverage) or Google Books API (needs an API key, slightly richer metadata/covers in some cases) — Open Library is the simpler default; fall back to Google Books if a lookup misses.

## 5. Browser Extension

- **Manifest V3** (required for Chrome Web Store as of 2024+).
- **Color picking:** native `EyeDropper` browser API (Chrome/Edge support it; no need for a custom canvas-based picker).
- **Communication with backend:** simple `fetch` POST from the extension's background/service worker to your Next.js API routes, authenticated with a personal access token issued from `/settings` in the web app (simplest possible auth handshake — avoids implementing a full OAuth redirect flow inside the extension).
- **Local state:** `chrome.storage.local` for the auth token and a small pending-sync queue (for offline tolerance).
- **Build tooling:** Plasmo or WXT (both are modern, TypeScript-first extension frameworks) if you want React components inside the popup UI; a bare Manifest V3 setup with vanilla TS also works fine given how small the extension's UI surface is (a button and a short list).

## 6. Hosting / Deployment

- **Web app:** Vercel (matches your existing deploy pattern for Forge/Archive/Ledger).
- **Database:** Neon (serverless Postgres, pairs natively with Vercel).
- **Extension:** Chrome Web Store listing (can stay "unlisted"/unpublished for personal use if you don't want it public — Chrome allows loading unpacked extensions locally, or you can publish as unlisted).

## 7. Suggested Repo Structure

```
/app
  /movies
  /books
  /colors
  /settings
  /api
    /movies
    /books
    /colors
    /auth
/lib
  /db          (Drizzle schema + client)
  /tmdb.ts
  /books-api.ts
/components
  ListRow.tsx
  TextToggle.tsx
  StarRating.tsx
/extension       (separate package, own manifest.json, own build)
```

## 8. Why this stack fits

- Every piece reuses tooling you already know from Forge/Archive/Ledger (Next.js 14, Neon, Drizzle, Better Auth, Tailwind + shadcn, Vercel) — so almost none of your setup time goes to learning new infrastructure, and you can copy config/auth boilerplate directly from a previous project.
- The only genuinely new surface area is the browser extension, which is intentionally kept as simple as possible (one API call, one native browser API, one auth token) rather than a full extension framework with its own state management.
