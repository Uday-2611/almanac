# Plan

Define the MVP architecture for Almanac as a private movies, TV shows, and books logging app that fits the existing Next.js codebase and the repo's ledger-style product rules. The first version should stay intentionally narrow, fetch metadata through server-side routes only, use Postgres-backed user data, and leave clean extension points for a later knowledge-graph system without forcing graph complexity into the MVP.

## Scope
- In: MVP planning for movies and TV shows in one shared section plus books, Next.js App Router + Postgres + server-side API routes, metadata sourcing, image storage strategy, review and logging data model, visible simple tags, and a future-ready knowledge-graph foundation.
- Out: Colors, browser extension, social features, public profiles, recommendation systems, multi-log history per title, and full knowledge-graph UX in v1.

## Product decisions
- The first version includes movies, TV shows, and books. TV shows share the Movies route, search, Watchlist/Watched collections, and custom lists.
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
- Model screen titles and books as separate user-scoped content records with a shared conceptual structure: title, creator, provider ID, provider name, status, rating, review, review format, logged date, and updated timestamps. Screen-title identity includes TMDB media type so movie and TV IDs cannot collide.
- Treat each title as one editable record per user in v1 rather than a diary of repeated watches or rereads.
- Support markdown-capable review content from the start, with a lightweight format choice documented in the schema and rendering pipeline.
- Add visible reusable tags through tables shaped like `tags` and `entry_tags`, even if the first UI only shows them as plain labels.
- Keep room for future graph expansion by avoiding hard-coded tag strings on entries and by preserving stable IDs for tags and source entities.

## Metadata and images
- Use TMDB as the primary movie and TV metadata source, with both result types normalized into the Movies section.
- Use Open Library as the primary books metadata source and automatically fall back to Google Books when Open Library fails or returns no matches. Keep `GOOGLE_BOOKS_API_KEY` server-only; public requests are supported by the client, but configuring a key is recommended because unauthenticated quota can be unavailable.
- Fetch search and detail data through server-side Route Handlers that return trimmed response shapes tailored to the UI.
- Store poster and cover URLs from the source providers in Postgres instead of copying assets into first-party storage in v1.
- Introduce owned blob storage only if a later phase requires user-uploaded media, cached copies, or provider-independent asset durability.

## UI and interaction direction
- Keep the product visually aligned with the ledger rules in `docs/.md/FRONTEND_GUIDELINES.md`: no cards, no shadows, no colored primary buttons, no dashboard chrome.
- Use Apple's Human Interface Guidelines principles—Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, and Delight—as the design decision framework, translated to the web and Almanac's established ledger aesthetic rather than copied as Apple platform styling.
- Make calm confidence the intended emotional outcome. Delight should come from fast response, clear hierarchy, preserved context, forgiving actions, careful typography, and polished states rather than added decoration or engagement mechanics.
- Keep interactions familiar, consistent, and under the user's control: semantic controls, predictable placement and behavior, clear exits, recoverable actions, and confirmations reserved for destructive or difficult-to-recover changes.
- Treat privacy, transparency, responsive layouts, touch/pointer/keyboard parity, visible focus, and reduced-motion behavior as design requirements from the start.
- Make feedback immediate and proportional. Motion should be natural, interruptible, reversible, spatially consistent, and quiet; it must begin from the current visual state and never lock input while a transition completes. Replace spatial motion with brief fades or static feedback when reduced motion is requested.
- Reserve Boska exclusively for the visible Almanac wordmark. Use Geist Sans everywhere else, including page and media titles, search results, rows, poster and spine metadata, controls, reviews, and Archive Notes; express hierarchy with size, weight, leading, and tracking instead of another typeface.
- Use one restrained 4px radius for controls, menus, inputs, artwork, overlays, inset surfaces, and other formerly sharp corners. Avoid pills, circles, square corners, and larger mixed radii unless a shape communicates essential meaning.
- Do not show black borders, outlines, or rings around black text controls on click or keyboard focus. Keep focus accessible through a subtle tonal background or another clear non-border treatment.
- Reuse one row primitive across movies and books with muted left metadata, bold title, and muted subline. Keep the standard hairline divider available, with the movie list using the approved borderless interaction treatment.
- Keep `List view / Images view` and status toggles as plain text controls with slash separators.
- Keep `Add new +` as a text affordance rather than a styled button.
- Show tags as simple textual labels in v1 without turning them into a noisy taxonomy surface.

## Delivery phases
- Phase 0 (complete): Initialize shadcn/ui, establish the App Router folder/file structure, reserve server API boundaries, and document the user flow.
- Phase 1 (complete): Implement the landing page and Better Auth foundation, including session lookup, protected-route enforcement, post-login redirect to `/movies`, and Vercel-managed secrets for Production, Preview, and Development.
- Phase 2 (complete): Provision Neon through Vercel, implement the Drizzle data layer and user-scoped schema for movies, books, tags, and preferences, and apply the initial committed migration.
- Phase 3 (complete): Build the movie and TV flow with combined TMDB-backed server-side search, add flow, database-backed list and detail pages, editable review/rating/date, watchlist/watched transitions, watched-only custom lists, list lifecycle management, and title deletion.
- Phase 4 (complete): Mirror the movie experience for books with Open Library search, automatic Google Books fallback, persisted Want to Read/Read entries, editable read details, deletion, and Read-only custom lists.
- Phase 5 (complete): Persist Archive Notes, add reusable cross-media tags with owner-safe attachment and removal, show tags as quiet labels, and support URL-driven tag filtering in movie and book collections.
- Phase 6 (in progress): Polish the ledger UI, validation states, accessibility, caching behavior, editing flows, and measured production performance.

## Validation checklist
- Verify visitors without a session see the landing page and authenticated visitors opening `/` are redirected to `/movies`.
- Verify successful login redirects to `/movies` and protected routes redirect signed-out visitors to `/login`.
- Verify every data query is scoped by `user_id`.
- Verify client code never calls TMDB or book providers directly.
- Verify list pages remain mostly server-rendered and lightweight.
- Verify markdown review rendering is safe and intentionally limited.
- Verify create, rename, delete, and membership changes for movie lists remain owner-scoped and preserve the watched-only invariant.
- Verify route transitions, search, and data mutations show quiet skeleton feedback without replacing semantic status text.
- Verify tags are reusable entities, not just comma-separated strings.
- Verify the schema still supports later graph relationships without a migration-heavy rewrite.

## Open questions to revisit later
- Whether the landing page needs a separate sign-up path or one combined authentication entry point.
- Whether editing the date field should preserve a separate audit timestamp, even though the entry itself stays singular.

## Current implementation state
- The `/movies` visual foundation now mirrors the four Figma states: watched/watchlist ledger views, single-row horizontally scrolling poster views, and My Lists in both display modes.
- Movies and TV shows share `/movies` end to end. Combined TMDB search identifies each result as movie or TV, and persisted identity uses `(media_type, tmdb_id)` so overlapping provider IDs remain distinct.
- Movie navigation is query-driven with `status=watchlist|watched|lists` and `view=list|images`, keeping the page server-rendered and ready for database-backed data.
- Movie pages now read authenticated, user-scoped records from Neon; the former movie seed catalog is no longer used for movie browsing or movie search.
- Movie and book list browsing uses straight, borderless rows with GSAP hover isolation: the active row's date, title, and creator move outward and grow together while neighboring rows recede. The interaction is silent.
- Movie and book image rails track wheel and touchpad input directly with no app-controlled easing or autonomous settling after input ends. Their hover/focus artwork and metadata transitions remain separate from scrolling.
- The books image view matches the movies image view: an input-tracked horizontal rail of uniform 2:3 covers with identical spacing, centered hover/focus enlargement, neighboring-artwork desaturation, and title/author metadata revealed below. Missing artwork falls back to a restrained typographic cover.
- Movie and book selections open the same light, scrollable journal modal: artwork occupies the complete left pane while a transparent, dark-type information pane presents the title, creator/year, direct rating and date editing, overview, sanitized review, credits, and eligible custom lists.
- Movie detail navigation is intercepted into a modal over the existing movies ledger, with a light white-blurred background, Escape/backdrop dismissal, and a direct-URL standalone page fallback.
- A shared global media-search overlay is available from navigation and from Movies/Books `Add New +` controls. Frame 50 defines its signature: a light white-blurred overlay, a full-width white search field with four-pixel corners and an icon close control, followed by individually separated white result strips with artwork, two-line creator/year metadata, and right-aligned add actions. Navigation searches both types; entry controls pre-filter by type.
- Search is a persistent multi-add workspace: selecting result artwork or metadata opens a read-only provider-information modal over the search, and closing that preview returns to the unchanged query and results. Per-result pending state permits concurrent additions; each success briefly animates `Added` directly above its matching action, leaves that action greyed out, and defers one collection refresh until search closes. No bottom-screen add notice is used.
- Movie search queries TMDB through `/api/movies/search`. Book search queries Open Library first through `/api/books/search`, then automatically falls back to Google Books when the primary provider fails or has no matches; results retain provider-scoped identities when saved.
- Movie and book My Lists sections use accessible, slightly enlarged plus/minus icon controls with a subtle animated disclosure. Rename and Delete remain unadorned text actions without underlines, and Delete turns red on hover.
- Movie posters use a consistent 2:3 ratio in image view and the movie information modal. The poster is visually separated from a colorless transparent information pane; on desktop, the poster remains fixed while only the information scrolls. The modal uses an icon close control and a subtly rounded review inset. Successful Watchlist or Watched additions receive a brief GSAP-confirmed ledger notice after the server mutation succeeds.
- Boska is self-hosted solely for the Almanac wordmark. Geist Sans is the single content and interface family across movie and book rows, image browsing, search, detail views, reviews, controls, and Archive Notes.
- Movie and book information panes share the same light journal sequence and monochrome treatment: a tightly tracked Geist Sans title, creator/year, editable star rating and logged date, overview, editable sanitized-markdown review, Archive Note entry, compact credits, and custom lists. Their borderless panes have no background color, use dark type, and sit six pixels from the fixed artwork over a light white-blurred modal scrim.
- `/movies/[movieId]/archive-note` and `/books/[bookId]/archive-note` share a clean white, borderless long-form writing surface. Notes persist on the single editable media entry, protect unsaved browser exits and internal link navigation, and expose explicit save, success, and error states.
- Archive Note tag editing creates or reuses account-scoped tag identities, suggests existing tags from both media types, attaches them to the current entry, and detaches them without deleting the reusable tag. Postgres ownership triggers prevent cross-account movie-tag and book-tag relationships.
- Movie and book list and image views show attached tags as restrained text labels. Collection pages expose URL-driven `tag=<uuid>` filters scoped to the active status and account, with clear filtered empty states and filter state preserved across display-mode changes.
- The authenticated navbar pairs the Almanac wordmark with a three-line menu control. Its compact rectangular menu animates open and closed, supports outside-click and Escape dismissal, and lists Movies, Books, Colors, Texts, and My profile with monochrome hover states.
- Better Auth email/password flows, database-backed sessions, protected product routes, and sign-out are implemented locally.
- The Drizzle schema includes Better Auth's core tables plus user-scoped movies, books, persistent Archive Notes, reusable tags, owner-guarded join tables, and view preferences.
- User-created movie lists are persisted through `movie_lists` and `movie_list_items`. Both the query layer and Postgres enforce that only the owner's Watched movies can be added; moving a movie back to Watchlist clears watched-only fields and automatically removes all custom-list memberships.
- Movie list management is complete: users can create lists from My Lists or directly from a watched movie, add and remove watched movies, rename lists, delete lists without deleting their movies, and view every item in a list. Movie entries can also be permanently deleted through a two-step confirmation.
- Reviews render a deliberately limited, sanitized markdown subset. Raw HTML is not rendered, external links open safely, and the stored source remains editable.
- Route loading, TMDB search, and movie/list mutations use restrained ledger-style skeleton states with accessible status labels.
- Performance pass foundations are implemented: server-render session lookup is request-deduplicated, movie creation avoids a redundant existence query while remaining race-safe, redirecting mutations avoid double refreshes, custom-list membership stays optimistic, and recent search results are cached for the browser session.
- Interaction performance baseline: hover/focus feedback settles in roughly 160–180ms, modal transitions in 150–200ms, search begins after a 120ms input pause, movie and book result groups publish independently, and preview/detail data warms on hover or focus.
- Ledger list hover/focus isolation uses a faster 110ms symmetric ease-in-out opacity response with no row translation or scale, keeping rapid movement between entries smooth and quiet. Movies and Books share the same centered ease-in-out underline reveal on `Add New +` hover/focus.
- Provider failures are never cached as empty searches. TMDB retries brief DNS failures within a bounded request, while the search UI differentiates an unavailable provider from a genuine no-results response and offers an explicit retry.
- Provider preview warming now waits for roughly 220ms of sustained pointer or keyboard intent and cancels before dispatch when that intent leaves. Direct clicks still load immediately, preventing fast result scanning from flooding the book providers.
- Book previews and additions share one server-only metadata loader with in-flight deduplication and a bounded ten-minute success cache. Open Library supplemental enrichment is optional and limited to a shorter wait; validated title/author hints avoid redundant author lookups and enable a Google Books detail fallback when the selected Open Library work is temporarily unavailable.
- Google fallback metadata never changes the selected result's provider-scoped identity: an Open Library result remains keyed and persisted by its original Open Library work ID, preserving duplicate prevention while allowing a resilient metadata response.
- Detail editors query only list IDs and names for their selectors rather than hydrating every item in every custom list.
- TMDB, Open Library, and Google Books requests now have bounded timeouts. Intercepted movie and book detail routes include dedicated loading fallbacks so clicks transition immediately while private Neon data is still loading.
- Book pages now read user-scoped Neon records instead of the seed catalog. Open Library work IDs and Google Books volume IDs provide provider-scoped stable identities, while authors, cover URLs, descriptions, publication dates, contributors, and page counts are normalized and persisted when selected.
- Book list management mirrors movie lists through `book_lists` and `book_list_items`: only the owner's Read books are eligible, moving a book to Want to Read removes memberships, and deleting a list never deletes its books.
- Book search, adds, status changes, read details, list mutations, and deletion use the shared accessible loading and confirmation patterns. Both direct and intercepted book-detail routes use the movie modal's light, transparent journal layout and sanitized review renderer.
- Book detail covers render inside a consistent 2:3 frame with their natural source ratio preserved, avoiding stretched or cropped editions.
- Book adds are idempotent and race-safe: selecting an already-saved work returns the existing entry without changing its status or clearing journal data, while the detail controls remain the explicit place for status transitions.
- The server-only `TMDB_API_READ_TOKEN` is encrypted in Vercel for Production, Preview, and Development, is available locally through the ignored `.env.local`, and has passed an authenticated TMDB request.
- The repository is linked to the Vercel project `almanac`. The `almanac-postgres` Neon database is connected to Production, Preview, and Development, `BETTER_AUTH_SECRET` is stored as a sensitive Vercel variable in each environment, and `drizzle/0000_tiresome_gargoyle.sql` has been applied successfully.
