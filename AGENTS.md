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
- Current product focus: movies, TV shows, books, and private standalone Texts notes. TV shows live inside the Movies section rather than a separate product route.
- Do not add any social features: no public profiles, sharing, comments, follows, likes, feeds, or collaboration.
- Prefer fast entry flows and quiet browsing over decorative UI or engagement mechanics.
- Keep external API calls server-side through Route Handlers. Do not call TMDB or books APIs directly from client components.
- Support lightweight markdown in reviews from the start.
- Treat each movie or book as a single editable entry in v1 rather than a repeated logging history model.
- Preserve the manual migration importer in Settings: accept Letterboxd Watched/Watchlist exports and Goodreads Read/Want to Read exports without adding recurring provider synchronization.
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
- Reuse one row primitive pattern across movies and books:
  - muted left metadata column
  - bold title
  - muted subline
  - hairline divider by default; the movie list is an explicit borderless exception
- Text toggles such as `List view / Image view / Canvas view` and `Watchlist / Watched` must render as plain text controls with `/` separators.
- `Search` should remain a text affordance, not a filled button.
- Use monochrome, restrained UI chrome. Artwork supplies the color on media pages.
- Reserve the self-hosted Boska family exclusively for the visible `Almanac` website wordmark. Use Geist Sans for every other visible heading, title, label, control, metadata line, poster or spine caption, search result, information pane, review, and Archive Note. Do not use Boska as a general display or content face.
- Use one subtle `4px` corner radius across interactive controls, menus, inputs, media artwork, overlays, inset surfaces, and other elements that would otherwise have sharp corners. Do not mix square corners, pills, circles, or larger radii unless the shape itself conveys essential meaning.
- Black text controls must not gain a black border, outline, or ring when clicked or keyboard-focused. Preserve an accessible visible focus state with a quiet tonal background or comparable non-border treatment, and never remove focus feedback entirely.
- Respect the accessibility requirements in `docs/.md/FRONTEND_GUIDELINES.md`, especially semantic controls, focus states, contrast, and real text for color values.

## Apple Design Principles

- Use Apple's Human Interface Guidelines design principles as a decision framework for Almanac: Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, and Delight. Reference: https://developer.apple.com/design/human-interface-guidelines/design-principles.
- Apply the principles to the web and to Almanac's established ledger language; do not imitate Apple platform chrome, Liquid Glass, or decorative effects when they conflict with the product's no-card, no-shadow, monochrome rules.
- Purpose: optimize every screen for quickly logging, finding, and reflecting on movies, TV shows, and books. Reject features or decoration that compete for attention without helping that job.
- Agency: keep people in control. Preserve context across overlays and navigation, provide clear exits, avoid trapping users in modes, and make reversible actions easy to undo. Reserve confirmation for destructive or difficult-to-recover actions.
- Responsibility: keep the product private by default, collect only data needed for the feature, explain permissions or external-provider behavior at the moment it matters, and never use manipulative engagement patterns.
- Familiarity: use semantic web controls and established browser conventions. Elements that look the same must behave the same; keep navigation, close actions, editing, feedback, and movie/book patterns consistent.
- Flexibility: design responsively for phone, tablet, and desktop; support touch, precise pointer, and keyboard input; preserve usable focus order and context as layouts adapt; treat accessibility and reduced-motion support as first-class requirements.
- Simplicity: simplicity is clarity, not visual emptiness. Keep the common path obvious, use concise and specific labels, establish hierarchy through order, spacing, typography, and contrast, and disclose secondary options only when needed.
- Craft: make spacing, alignment, typography, wording, loading, empty, success, warning, and error states deliberate. Prototype and test interactions in the browser, and keep scrolling and animation smooth.
- Interaction feedback must be immediate, causal, and proportional. Prefer natural, interruptible, reversible motion that starts from the current on-screen state; do not lock input while a transition finishes. Preserve spatial continuity by returning overlays and menus along the path or toward the source from which they appeared.
- Default motion should be quiet and critically damped with no ornamental bounce. Momentum-based interactions may carry velocity, but motion must never obstruct the task. Under `prefers-reduced-motion`, replace spatial movement, parallax, and springs with brief fades or static state changes while retaining meaningful feedback.
- Delight should emerge from calm confidence, fast response, thoughtful typography, and polished details—not confetti, gamification, novelty, sound, or decoration that competes with the ledger.

## shadcn/ui Guardrails

- Use shadcn/ui only for low-level primitives and keep them visually stripped down to match the ledger aesthetic.
- Initialize shadcn non-interactively.
- Prefer only the components needed for the current milestone instead of bulk-installing everything.
- After shadcn initialization, verify that Tailwind v4 font tokens still point to literal font families rather than circular CSS variables.

## Architecture Guardrails

- Use the App Router structure in `app/`.
- Use Better Auth with email/password and Google OAuth. Keep OAuth credentials server-only, hide the Google option unless both credentials are configured, allow verified Google identities to link to existing same-email accounts, and return users to `/movies` after successful authentication.
- Keep browser constraints and Zod mutation schemas aligned. Reject future watched/read dates, whitespace-only or duplicate list names, oversized reviews/notes/tags, and unknown mutation fields with concise user-facing errors; every client mutation must recover from network failures without leaving controls pending or optimistic state stale.
- Use Neon Postgres through Drizzle ORM. Commit generated migrations under `drizzle/` and never expose `DATABASE_URL` or `BETTER_AUTH_SECRET` to client code.
- The Vercel project `almanac` is connected to the `almanac-postgres` Neon database in Production, Preview, and Development; the initial migration is `drizzle/0000_tiresome_gargoyle.sql`.
- Prefer Server Components for list pages and server-side data access by default.
- Add client components only when interactivity genuinely requires them.
- Keep `getCurrentUser()` wrapped in React `cache()` so layouts and pages deduplicate session lookup within one server render.
- Do not pair `router.push()` or `router.replace()` with an immediate `router.refresh()`; navigation already requests fresh server output. Keep membership controls optimistic and refresh only when the current view genuinely needs server data reloaded.
- Scope all user data access by `user_id` at the query layer.
- Keep migration imports idempotent and owner-scoped. Watched/Read may promote an existing unfinished entry, but imports must not demote entries or overwrite existing ratings, reviews, logged dates, Archive Notes, tags, or custom-list memberships.
- Parse raw Letterboxd and Goodreads exports locally in the browser; only validated, bounded normalized batches may reach the authenticated import Route Handler. Never guess ambiguous movie matches.
- Keep migration requests resumable and tolerant of brief provider or database interruptions: use smaller Letterboxd batches, retry only transient request failures, and resume after the last server-confirmed batch.
- Prefer Goodreads `Exclusive Shelf` over the broader `Bookshelves` column, retain ISBNs for matching, and enrich imported books server-side through Open Library with Google Books fallback. Preserve the Goodreads identity and only backfill missing provider metadata on an existing book.
- A movie or TV show may belong to a user-created movie list only while it belongs to the same user and has `watched` status. Preserve the API validation and database triggers that enforce this; moving either title back to `watchlist` must remove its custom-list memberships.
- A book may belong to a user-created list only while it belongs to the same user and has `read` status. Preserve the equivalent API validation and database triggers; moving a book back to `want_to_read` must remove its custom-list memberships.
- Preserve owner-scoped movie-list CRUD. Deleting a custom list must delete only its memberships, not the watched movies it contained; movie deletion remains a separate confirmed action.
- Render reviews through the sanitized markdown component. Do not enable raw HTML in user-authored review content.
- Persist one Archive Note directly on each singular movie or book entry. Keep Archive Note reads and writes owner-scoped, preserve explicit saving and unsaved-exit protection, and do not expose note content through public or provider routes.
- Keep standalone Texts notes separate from movie and book Archive Notes. Texts use client-generated UUIDs for idempotent creation, monotonic client revisions for stale-write rejection, debounced autosave with navigation flushes, and account-and-note-scoped local draft recovery. Do not claim that a request at browser close is guaranteed to finish.
- Texts folders are optional many-to-many organization. Enforce same-owner note/folder memberships through composite database foreign keys as well as authenticated API checks; deleting a folder must cascade only its memberships, never its notes.
- Keep Texts top-level navigation compact: show only `All notes / All folders`. The All folders ledger owns folder creation, per-row rename, and confirmed deletion; folder creation may attach multiple owner-scoped notes through a searchable picker. An opened folder must show its name, note count, and a direct Back to all folders control. In the note editor, folder membership and note deletion are Write-mode actions and must not appear in Preview.
- Texts view navigation must provide immediate pending feedback using the shared monochrome route-progress treatment: soften only the selected destination, keep the current content visible, and announce the destination accessibly until navigation commits.
- Preserve reusable account-scoped tag identities and case-insensitive normalized-name uniqueness. Attaching or removing a tag must verify ownership of the entry and tag, and the database ownership triggers must continue to reject cross-account movie-tag or book-tag relationships. Detaching a tag must not delete the reusable tag identity.

## Current UI Foundation

- Collection pages must use lean owner-scoped projections instead of loading review, overview, cast/contributor, and Archive Note bodies for every row. Keep custom-list grouping linear as collections grow.
- Remote movie and book artwork must fall back to readable text when its URL is missing, unsupported by image optimization, or fails to load. Public and authenticated route errors must use Next.js `retry()` so a failed server read is actually re-fetched.
- Keep the patched Next.js and matching ESLint config versions aligned. Do not use `npm audit fix --force` to downgrade Drizzle Kit for its remaining dev-loader advisory.

- Movie and Book collections show a quiet status heading with the current item count near the first entry. List rows are ordered by their recorded date and grouped under muted year labels; preserve the generous top space and plain-text toggles.
- Horizontal poster and cover rails show subtle edge cues only when more artwork is off-screen. Keep direct wheel and touch tracking. Book covers retain their source aspect ratio inside a 2:3 frame; missing or failed artwork uses a readable typographic fallback.
- Movie and Book journals follow one editing order: title and creator, rating/date, overview, review, Archive Note, credits, then custom lists. Keep save progress visible, and treat empty or filtered collections and long titles as deliberate readable states.

- Hide visible scrollbar chrome on desktop and mobile, including the scrollable movie/book information panes and horizontal rails. Keep wheel, touch, keyboard, and Lenis scrolling functional.

- Lenis smooths root document scrolling across routes. Respect reduced motion and keep independent modal scrolling and the Movies/Books horizontal artwork rails native and directly responsive to input.

- Alternate the landing page's white sections with neutral gray-white (`#f5f5f5`), without a cream or yellow cast. Keep the footer surround neutral gray as well.

- The landing page includes a responsive product preview using the supplied desktop image-view and mobile list-view screenshots, followed by an editorial image spread using the newly supplied film still, film poster, and book cover. Keep these as open page sections rather than cards, and preserve the screenshots' natural proportions and readable captions.

- The landing footer is a compact, dark three-column inset within the light page, inspired by the supplied footer reference: Almanac and a brief description, useful links, and direct contact. The social directory links to Instagram, Goodreads, Letterboxd, and Twitter, with no LinkedIn or GitHub social link. Contact us and the muted inline address form one control that copies the real email; a small anchored box briefly confirms success or failure above the address without replacing the text. Maintain the site's 4px corner language, white inset frame, and no-shadow treatment.

- The Almanac icon uses the exact capital `A` outline from the self-hosted Boska Regular font, in white on a flat `#111111` square with 4px corners. `app/icon.svg` is the favicon source; keep the mark free of gradients, shadows, and extra symbols.

- Colors and its former `/colors` placeholder route have been removed from the product. Do not restore a Colors navigation item, route, API, data model, or browser extension without a new user request. `/texts` is a working private journal with month and folder browsing, Markdown preview, automatic saving, local recovery, and mobile-first writing controls.

- Texts lists group notes by editable journal month, newest first, while retaining separate created and updated audit timestamps. Empty titles render as `Untitled note`; the visible byline always comes from the current account profile rather than note data.
- Keep the standalone Texts editor as one document-scrolling surface on mobile and desktop. The body textarea expands to its content and must not create an independently scrolling text region.

- The public landing page is a navbar-free, light editorial archive. Its hero is the explicit visual exception to the white canvas: a near-full-viewport, tightly separated 3×3 archival image mosaic inspired by the supplied Studio Aton reference, with the oversized self-hosted Boska `Almanac` wordmark, one-line private-archive description, edition metadata, and entry action integrated over the lower image row. The mosaic, six-step process grid, and three-image feature spread now use the supplied cinematic stills, posters, sculpture, architecture, and archival artwork rather than the former generated still-life placeholder, with crops assigned to each slot's geometry. Geist Sans remains the family for every other landing-page label, heading, description, and control. On phones the hero reduces to a deliberate two-column mosaic without horizontal overflow. The process grid collapses to a single readable sequence. The feature explanation remains one open editorial spread rather than cards. Follow it with an open editorial principles index: Privacy, Simplicity, Continuity, Connection, Ownership, and Longevity rotate automatically while visible, updating the active ledger row, position, short statement, and explanation together. Each term remains a real button for direct selection; rotation pauses on hover or focus and becomes static under reduced motion. Keep this section monochrome, cardless, and aligned with the adjacent editorial headers and hairline rules. Preserve the private-first product difference, closing entry path, and Contact us footer with its social directory. Keep interface chrome monochrome and reserve muted burgundy, blue-gray, forest, mauve, and ochre tinting for the cultural imagery. Use 4px corners, no shadows, and only brief reveal, hover, and press feedback with reduced-motion equivalents; do not add a navbar or autonomous looping hero motion.

- Preserve the authentication page's full-viewport split composition: a supplied cinematic image field fills the left side edge to edge and the existing email/password and optional Google authentication flow fills a white pane on the right. Do not place the composition inside an outer card, frame, margin, dark surround, or rounded shell. Neither sign-in nor sign-up may scroll the page; lock the route to the dynamic viewport, clip the moving field within its pane, and use compact height-aware spacing so every form control remains visible on short screens. The image field uses four columns of supplied posters and stills moving continuously from top to bottom at subtly different speeds. Scale every reel image proportionally to its column while preserving its intrinsic aspect ratio; do not force imagery into arbitrary fixed-height crops. The panel, reel, gaps, and text legibility layers have no dark or gray backing fills or gradient overlays; only the image content occupies each tile, with surrounding gaps inheriting white. Keep the duplicated tracks seamless, compositor-only, non-interactive, and static under `prefers-reduced-motion`. Keep the Boska wordmark, Geist interface text, the subtle 4px-rounded tonal kicker above the form title, in-field placeholders instead of visible external field labels, a recognizable Google mark in the Google action, monochrome controls, immediate press feedback, and the mobile layout that reduces the image field to a short full-width header above the form.

- Preserve the mobile-responsive layer across every public and authenticated surface. Keep the established desktop geometry from `sm`/`md` upward while phones use compact ledger columns, full-viewport scrollable modals, wrapped controls, 44px touch targets, and visible image-rail metadata when hover is unavailable.

- Keep Movies and Books Image/List switching client-local and synchronize its query parameter through the native History API so display changes do not re-run server data access. For collection-status changes, preserve immediate pending feedback: soften only the clicked destination, announce it to assistive technology, and show the thin monochrome route-progress line without replacing or blocking the current ledger; keep the reduced-motion state static.

- Preserve `/settings` as the My profile page. It uses an open, cardless ledger composition with one deterministic account-derived gradient orb as the profile image, inline editing for name and email, the existing local-first Letterboxd and Goodreads import tools, then clearly separated sign-out and delete-account actions. The orb is a soft, single-hue atmospheric sphere with a broad diffused light pool, opposing shadow, and restrained grain; derive its hue and light coordinates from the account ID so it is distinct per user but stable between visits without storing or uploading an image. Profile mutations must validate on the server and remain owner-scoped. Email changes clear the verified flag. Account deletion must stay behind explicit `DELETE` confirmation and Better Auth's sensitive-session/password checks, and database cascades remove the user's private archive.
- Show the Google account connection control only on My profile, directly below the Email row in Personal details. Preserve linked, pending, and error states and hide it when server-side Google credentials are incomplete. Redirect the former `/settings/accounts` route to `/settings`.

- Movies and Books support `view=list|images|canvas` within their existing status routes. Display-mode changes remain client-local and URL-synchronized.
- Canvas view is an image-only, two-dimensional repeating field for the current collection. Pointer drag, wheel/trackpad, touch, and keyboard arrows move it; activating a poster or cover opens the existing intercepted detail modal. Keep a bounded number of visible tiles and suppress opening a detail after a drag. Respect the existing 2:3 artwork ratio, readable missing-artwork fallback, and reduced-motion behavior.
- Reuse the movie ledger row, text-toggle, and horizontal poster-rail patterns when connecting real data or mirroring the experience for books.
- Preserve the large quiet space above movie content; it is an intentional part of the approved layout, not missing content.
- Preserve the movie and book list interaction signature: straight, silent borderless rows with GSAP hover isolation applied to the active row's date, title, and creator together.
- Preserve the movies image-view signature: a single closely spaced horizontal rail of 2:3 posters whose GSAP hover/focus motion enlarges them evenly from the center, reveals title and director below, and softly desaturates neighboring posters. Rail scrolling must track wheel or touchpad input directly and must not continue through app-controlled easing after input ends.
- Keep Books image view visually and behaviorally identical to Movies image view: an input-tracked horizontal rail of uniform 2:3 covers with the same spacing, centered GSAP hover/focus enlargement, neighboring-artwork desaturation, intent-based detail prefetch, and metadata reveal below. Adapt metadata only to title and author; use a quiet typographic cover when artwork is unavailable.
- Movie and book detail routes use the same light, scrollable journal-modal layout, with artwork occupying the entire left pane and the transparent dark-type information sequence adapted to director/cast or author/contributors.
- Movie links use an intercepted parallel route so details open as a modal over the movies ledger; preserve direct `/movies/[movieId]` page rendering as the hard-navigation fallback.
- Reuse one global search overlay from the nav and the Movies/Books `Search` controls.
- Keep movie search status-aware in both result rows and provider-information previews. Show whether a title is not saved, in Watchlist, or Watched. Label the action `Watch` until the title is watched; only then show `Watched`. The `Watch` action must open rating, watched-date, and review entry before saving directly to Watched; promote an existing Watchlist title without duplication and do not require an unsaved title to pass through Watchlist first.
- Preserve the Frame 50 search signature: a light white-blurred overlay, centered full-width white borderless input with four-pixel corners and an icon close control, followed by individually separated white result strips with artwork, title, creator/year metadata, and right-aligned add actions.
- Treat global search as a persistent browsing workspace. Clicking a result opens a read-only provider-information modal above the still-mounted search; closing the preview must restore the exact query and results.
- Adding a result must not close search or navigate to its saved detail route. Adds use per-result pending state so different results can save concurrently. Briefly animate `Added` above only the successful action, then leave that action greyed out; refresh the underlying collection once when search closes. Do not restore the bottom-screen add confirmation.
- Book search uses the server-only Open Library client first and automatically falls back to the server-only Google Books client when Open Library fails or has no results. Preserve provider-scoped identities, normalized metadata, `OPEN_LIBRARY_CONTACT_EMAIL`, and the server-only `GOOGLE_BOOKS_API_KEY`; keyless requests are supported, but a key is recommended because unauthenticated quota can be unavailable.
- Book detail artwork uses a 2:3 frame and preserves each source cover's natural aspect ratio with containment rather than cropping.
- Preserve parity between the movie and book journal modals: dark scrim, transparent glass pane, title/creator/year, directly editable rating and logged date, overview, sanitized-markdown review, credits, and eligible custom lists.
- `TMDB_API_READ_TOKEN` is configured as an encrypted Vercel variable for Production, Preview, and Development; never expose it to client code or logs.
- Keep movies and TV shows together in `/movies`, including search, Watchlist/Watched, image and list views, details, Archive Notes, and custom lists. Persist TMDB identity as `(media_type, tmdb_id)` because movie and TV IDs can overlap.
- Preserve the accessible animated open/close disclosure on Movie and Book My Lists sections. Use only a slightly enlarged plus/minus icon for the disclosure control; keep Rename and Delete free of underlines, with Delete turning red on hover.
- Preserve the authenticated navbar signature: the Boska Almanac wordmark sits beside a three-line menu control that morphs into a close icon; the compact 4px-rounded menu uses subtle open/close motion, monochrome item hovers, and outside-click/Escape dismissal.
- Preserve the 2:3 movie artwork ratio in both image view and the information modal. Separate the fixed desktop poster from the scrollable, colorless transparent information pane with a narrow gap; use an icon close control and a subtly rounded review inset. Show the smooth GSAP ledger confirmation only after a Watchlist or Watched add request succeeds.
- Use quiet ledger-style skeletons for route loading, provider search, and authenticated mutations; retain accessible live status text for assistive technology.
- Preserve intercepted detail-route `loading.tsx` fallbacks so dynamic movie and book modals can partially prefetch and respond immediately while Neon data loads.
- Keep external metadata requests bounded by timeouts and retain the in-session recent-query cache in global media search.
- Keep routine UI motion quick and interruptible: hover/focus feedback should settle in roughly 160–180ms, modal transitions in roughly 150–200ms, and ordinary interface transitions should not exceed 240ms without a deliberate spatial reason. Preserve reduced-motion behavior.
- Ledger list hover/focus isolation is an intentionally faster exception: settle sibling-row opacity in about 110ms with a symmetric ease-in-out curve and without translating or scaling the active row, so rapid pointer movement remains smooth and unblocked.
- Movies and Books `Search` controls share a quick, centered underline reveal on hover and keyboard focus using an ease-in-out curve. Keep the affordance as plain text without a filled background, border, or hover lift.
- Begin global media search after no more than a 120ms input pause, publish movie and book results independently as each provider responds, and prefetch provider previews plus saved-entry detail routes on user intent (hover or focus). Do not make a fast provider wait for a slow one.
- Treat provider-preview warming as demonstrated intent, not incidental pointer travel: wait about 220ms before starting a hover/focus preview request, cancel unsent work when intent leaves, and keep clicks immediate.
- Resolve book preview and add metadata through the shared server-only loader. Preserve its bounded successful-result cache and in-flight request deduplication so a warmed preview can make a subsequent add immediate without trusting client metadata.
- When an Open Library work-detail request fails, use validated search-result title and author hints to try Google Books, but retain the originally selected Open Library provider and work ID as the saved identity. Keep supplemental Open Library enrichment short and optional.
- Never cache failed provider searches as empty result sets. Retry short-lived TMDB DNS failures within a bounded request, and distinguish provider failures from genuine zero-result searches with a visible retry action.
- Detail modals must use lightweight list-option queries; never load every list membership item merely to render list names in an entry editor.
- Preserve the movie modal's film-journal sequence: a large, tightly tracked Geist Sans title, director/year, directly editable stars, watched date, overview, editable sanitized-markdown review, Archive Note entry, compact cast, then custom lists. Keep the borderless pane completely free of background color, with dark type six pixels from the fixed 2:3 poster over a light white-blurred scrim.
- Keep Boska exclusive to the Almanac wordmark. Use Geist Sans for all visible movie and book titles across ledger rows, image browsing metadata, search results, information panes, and Archive Notes, with hierarchy created through size, weight, leading, and tracking.
- Preserve the same light, transparent, dark-type journal treatment for movie and book information panes; adapt only domain language and metadata.
- Treat `/movies/[movieId]/archive-note` and `/books/[bookId]/archive-note` as clean, white, borderless editorial writing surfaces with persistent text and reusable tag editing.
- Keep Archive Note tags visible as quiet slash-separated text rather than badges. Movie and book collections filter through the owner-scoped `tag=<uuid>` query parameter, preserve the filter when switching List/Image/Canvas views, and only offer tags used by the active collection status.
