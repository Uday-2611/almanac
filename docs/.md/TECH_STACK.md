# Tech Stack & Architecture Recommendation

Consistent with your existing stack choices (Forge, Archive, Ledger) so you can reuse patterns, auth setup, and DB conventions across projects.

## 1. Frontend

- **Framework:** Next.js 14 (App Router) — same as your other projects, good SSR/SEO isn't needed here but you still benefit from file-based routing, server actions, and easy Vercel deploys.
- **Styling:** Tailwind CSS + shadcn/ui — shadcn gives you unstyled-by-default primitives (dialogs, dropdowns, toggles) that you can strip down to match the hairline-minimal look in your reference image, rather than fighting a pre-styled component library.
- **Typography:** Since this leans editorial/minimal like your other builds — a serif or condensed sans for the wordmark/titles (e.g., Playfair Display or a grotesk like Söhne/Inter for body) would fit; reuse your IBM Plex Mono + Playfair pairing from Forge if you want visual consistency across your personal app suite.
- **State/data fetching:** Server Components for list pages (fetch directly from DB on the server), React Query (TanStack Query) only where you need client-side mutation/optimistic UI (e.g., toggling watchlist→watched, star ratings).

## 2. Backend / API

- **API layer:** Next.js Route Handlers (`app/api/.../route.ts`) handle movie/book search, authenticated media mutations, and Texts notes and folders.
- **Auth:** Better Auth with email/password and optional Google OAuth protects each account's private archive.

## 3. Data Storage

- **Database:** Neon Postgres stores owner-scoped movies, books, Texts notes, folders, and memberships.
- **ORM:** Drizzle ORM — you're already using this; migrations are cheap and the schema in the PRD maps directly to Drizzle table definitions.
- **File/image storage:** TMDB and Open Library/Google Books serve poster and cover images, so Almanac stores their URLs rather than copying artwork.

## 4. External APIs

- **Movies:** TMDB API (The Movie Database) — you've already integrated this in your TMDB project, so this is a direct reuse of that integration knowledge. Free tier is generous enough for personal use.
- **Books:** Open Library API (fully free, no key required, good coverage) or Google Books API (needs an API key, slightly richer metadata/covers in some cases) — Open Library is the simpler default; fall back to Google Books if a lookup misses.

## 5. Hosting / Deployment

- **Web app:** Vercel (matches your existing deploy pattern for Forge/Archive/Ledger).
- **Database:** Neon (serverless Postgres, pairs natively with Vercel).

## 6. Suggested Repo Structure

```
/app
  /movies
  /books
  /texts
  /settings
  /api
    /movies
    /books
    /texts
    /auth
/lib
  /db          (Drizzle schema + client)
  /tmdb.ts
  /books-api.ts
/components
  ListRow.tsx
  TextToggle.tsx
  StarRating.tsx
```

## 7. Why this stack fits

- Every piece reuses tooling you already know from Forge/Archive/Ledger (Next.js 14, Neon, Drizzle, Better Auth, Tailwind + shadcn, Vercel) — so almost none of your setup time goes to learning new infrastructure, and you can copy config/auth boilerplate directly from a previous project.
- Texts shares the existing authentication, database, and Route Handler patterns while retaining separate notes and folder memberships.
