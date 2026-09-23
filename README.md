# Almanac

Almanac is a private, personal archive for movies, TV shows, and books. It brings watchlists, reading lists, completed entries, reviews, and notes into one quiet place to record what you want to experience and what stayed with you afterward. Each account has its own archive; the product has no public profiles, feeds, or social features.

The interface is intentionally closer to an editorial ledger than a dashboard. Collections can be browsed as text lists or artwork rails, with responsive layouts and restrained interaction feedback on desktop and mobile.

## What You Can Do

- Search for movies and TV shows together, save them to a Watchlist, and move them to Watched. Movie and TV identities remain distinct even when their provider IDs overlap.
- Search for books, save them to Want to Read, and move them to Read. Open Library is the primary source, with Google Books as a fallback.
- Maintain one editable entry per title, including its status, rating, completion date, and review. Reviews support a limited, sanitized Markdown format.
- Write a private Archive Note for a movie, show, or book. Reusable account-scoped tags can be attached to notes and used to filter collections.
- Create personal movie and book lists. Only titles already in Watched or Read can be added to their respective custom lists; changing a title back to an unfinished status removes those memberships.
- Import Letterboxd Watched/Watchlist and Goodreads Read/Want to Read exports on demand. Raw files are parsed in the browser, and bounded, normalized batches are sent to the authenticated import endpoint. This is a migration tool, not ongoing synchronization.
- Sign in with email and password, with optional Google sign-in when OAuth credentials are configured. Manage profile details and account actions from My profile.

The Colors and Texts routes currently show authenticated "Coming soon" pages. They are not part of the working media archive yet.

## Technology

| Area | Implementation |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript, Server Components, and Route Handlers |
| Styling and interaction | Tailwind CSS 4, selectively used shadcn/ui primitives, GSAP, and Lenis |
| Authentication | Better Auth with email/password, database-backed sessions, and optional Google OAuth |
| Data | Neon Postgres, Drizzle ORM, and committed SQL migrations |
| Validation and reviews | Zod, React Markdown, GFM support, and HTML sanitization |
| Media metadata | TMDB for movies and TV; Open Library with Google Books fallback for books |
| Hosting | Vercel for the Next.js application; Neon for Postgres |

Provider requests and credentials stay on the server. Almanac stores provider identities, normalized metadata, and poster or cover URLs in Postgres rather than copying external artwork into first-party storage. User entries, lists, notes, tags, and imports are scoped to the authenticated account. The schema uses reusable tag identities so richer connections can be explored later without claiming a knowledge-graph interface today.

## Run Locally

You need a compatible Node.js and npm installation, a Postgres database (Neon or local), and a TMDB credential for movie and TV search. Google OAuth and a Google Books API key are optional.

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and set the required values below.
3. Apply the committed database migrations with `npm run db:migrate`.
4. Start the development server with `npm run dev`.
5. Open [http://localhost:3000](http://localhost:3000). The public landing page leads to `/login`; authenticated users enter at `/movies`.

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string used by the application and Drizzle migrations. Required. |
| `BETTER_AUTH_SECRET` | Secret used by Better Auth. Required; use a strong, unique value. |
| `BETTER_AUTH_URL` | Application base URL, such as `http://localhost:3000` locally. Set it to the deployed application URL in production. |
| `TMDB_API_READ_TOKEN` | TMDB API read access token for movie and TV metadata. Configure this or `TMDB_API_KEY`. |
| `TMDB_API_KEY` | Alternative TMDB API key when a read access token is not used. |
| `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` | Optional Google OAuth credentials. Both must be set to enable Google sign-in. |
| `OPEN_LIBRARY_CONTACT_EMAIL` | Contact address sent with Open Library requests. Recommended. |
| `GOOGLE_BOOKS_API_KEY` | Optional server-side Google Books key for more reliable fallback quota. |

Never commit `.env.local` or put database, authentication, or provider secrets in `NEXT_PUBLIC_` variables. For Google sign-in, configure the OAuth client with the application's Better Auth callback URL for each environment where it is enabled.

## Database and Verification

The Drizzle schema is in `lib/db/schema.ts`, with generated migrations in `drizzle/`. After a schema change, run `npm run db:generate`, review the generated SQL, and apply it with `npm run db:migrate`. Use a separate development database for local changes; migrations and integration checks should not be pointed at production casually.

| Command | Purpose |
| --- | --- |
| `npm run lint` | Run ESLint. |
| `npm run build` | Create a production Next.js build. |
| `npm run test:tmdb-normalization` | Check movie and TV provider normalization. |
| `npm run test:validation` | Check mutation validation rules. |
| `npm run test:imports` | Check import parsing and normalization. |
| `npm run test:movie-invariants` / `npm run test:book-invariants` | Check owner and custom-list database invariants. |
| `npm run test:movie-flow` / `npm run test:book-flow` | Exercise database-backed media flows. |
| `npm run test:archive-tags` | Check Archive Note and tag behavior. |

Database-backed verification scripts require a configured database and may create temporary test records. The movie and book flow scripts also require a running application at `http://localhost:3000` by default. Check their requirements before running them against a shared database.

## Repository Layout

| Path | Responsibility |
| --- | --- |
| `app/` | Public, authentication, and protected App Router pages; server Route Handlers under `app/api/`. |
| `components/` | Shared ledger, search, modal, form, and interface components. |
| `lib/` | Authentication, owner-scoped data access, metadata providers, validation, and review rendering. |
| `drizzle/` | Versioned Postgres migrations. |
| `scripts/` | Verification scripts for data rules and core flows. |
| `docs/plan.md` | Active implementation plan and current product direction. |

For product and implementation guardrails, see `AGENTS.md` and [the active plan](docs/plan.md). Older documents under `docs/.md/` provide supporting background; the active plan takes precedence where they differ.

## Deployment

Almanac is configured for Vercel with a Neon Postgres database. Set the environment variables for each intended Vercel environment, apply committed migrations to the corresponding database, and deploy the Next.js project. Keep production and preview database changes deliberate, and configure the correct application URL and Google OAuth redirect URI for each deployment that offers Google sign-in.
