# Frontend Guidelines

This is the visual and interaction spec, derived directly from your Figma reference screenshot. It's meant to be handed to Codex alongside the PRD so the UI it builds actually matches the reference instead of drifting toward a generic dashboard look.

---

## 1. Design Thesis

The whole product is a **ledger, not a dashboard**. No cards, no shadows, no colored buttons, no badges, no icons unless functionally necessary. The page should look almost like a plain-text file that happens to be clickable. Every visual choice should ask: "does a ledger need this?" If not, cut it.

**Signature element:** the repeating text row (date · title · muted subline) is the one thing this product is built from, everywhere — movies, books, and colors all render through the same row primitive. Consistency of that row *is* the design.

---

## 2. Design Tokens

### Color

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#FFFFFF` | Page background |
| `--ink` | `#111111` | Primary text (titles, active toggle state, wordmark) |
| `--muted` | `#9A9A9A` | Secondary text (dates, director/author names, inactive toggle state) |
| `--rule` | `#EAEAEA` | Hairline dividers between rows |
| `--accent` | *derived per color entry* | Only used on the Colors page, where the "accent" of a row is the actual saved hex — never a fixed brand color |

Do not introduce a brand accent color (no terracotta, no acid green, no blue links). The one place color is allowed to be loud is the Colors section itself, where the content *is* color — everywhere else stays black/white/gray. This is a deliberate constraint: a logging tool for color should not compete with the colors it stores.

### Type

- **Display / wordmark:** a condensed or slightly geometric sans in all-caps, tight tracking — used only for the site wordmark ("ARCHIVE"-style lockup) and page-level section labels. Keep it small (14–16px); this is not a hero-headline product.
- **Body / titles:** a plain grotesk (Inter, Söhne, or system sans) at regular weight for metadata and semibold for titles. Reuse IBM Plex Mono or a similar mono face for numeric/date fields (dates, star ratings, hex codes) if you want a data-forward texture consistent with your other projects — this is optional but fits the ledger feel.
- **Scale:** keep it tight. Titles ~15–16px, metadata/dates ~13–14px, wordmark ~14px. This product should never feel like it has a "hero" font size — nothing on the page should be dramatically larger than anything else. Restraint in scale is the point.

### Layout

- **Grid:** single column list, left-aligned, generous left margin, no max-width card container — content runs edge-to-edge with page padding, the way a text document does.
- **Row anatomy** (reuse everywhere):
  ```
  [ date/meta, gray, fixed-width left column ]   [ Title, bold, black ]
                                                  [ subline, gray, e.g. director/author/domain ]
  ```
  followed by a 1px `--rule` divider, full width.
- **Vertical rhythm:** consistent row height/padding (don't let rows with reviews grow taller than rows without — keep review/rating as an on-click reveal, not inline row content).
- **Top bar:** wordmark + menu icon on the left; on the right, two independent text-toggle groups (`List view / Images view` and `Watchlist / Watched`), rendered as plain text with a `/` separator, active state = black+bold, inactive = gray, no pill/button background, no border.
- **"Add new +"**: plain text link with a `+` glyph, left-aligned above the list, same weight as a metadata line — never a filled button.

### Spacing

- Base unit: 8px. Row vertical padding: 16–20px. Section top padding before the first row: 32–40px. Keep horizontal page margin consistent across all three sections (movies/books/colors) so the eye doesn't have to recalibrate switching pages.

### Radius / Elevation

- **Radius:** 0 everywhere except small functional affordances (e.g. the color-swatch squares in Images view can have a 2–4px radius, nothing else needs one).
- **Elevation:** none. No shadows, no card backgrounds, no borders around content blocks — only hairline row dividers.

---

## 3. Components

### `TextToggle`
Two labels separated by `/`. Click a label to switch state. Active = `--ink`, bold; inactive = `--muted`, regular. No background, no underline, no icon. Used for List/Images and Watchlist/Watched.

### `ListRow`
The core primitive. Props roughly: `{ meta: string, title: string, subline?: string, thumbnail?: string, rating?: number, onClick }`. Renders as the two-line text block described above, with a bottom hairline divider. In Images view, the same component renders `thumbnail` prominently (poster/cover/swatch) with `title` beneath it in a lighter-weight caption style — same data, different emphasis, not a different component.

### `AddNewLink`
Plain text `+` affordance, opens a search-driven add flow (modal or dedicated route — recommend a modal so the list context is never lost).

### `StarRating`
Minimal, monochrome. Filled = `--ink`, empty = `--rule`/light gray outline. No colored stars. Read-only in list rows; editable (click/hover to set) only in the detail/review view.

### `DetailPanel` (movie/book detail)
Opens on row click — recommend a slide-over panel or a dedicated route rather than a modal, since detail content (synopsis, cast, review) can be long. Same typographic rules apply: no card chrome, just a page with a clear back affordance (text link, e.g. "← Movies").

### `ColorSwatch`
Used in Colors Images view — a solid rectangle filled with the actual stored hex, hex code printed below in mono type, 0–4px radius max.

---

## 4. Interaction & Motion

- Motion should be nearly invisible: quick opacity/height transitions (150–200ms) for toggling List/Images view or expanding a row into detail. No page-transition flourishes, no hover-lift, no bounce.
- Hover state on a row: subtle background tint (e.g. `#FAFAFA`) is enough — do not add shadows or scale transforms.
- Respect `prefers-reduced-motion`: disable the transitions above entirely when set.

---

## 5. States

- **Empty states** (no movies in watchlist yet, etc.): plain text, in the interface's voice, telling the user what to do next — e.g. "Nothing here yet. Add a movie to start your watchlist." — styled identically to a normal row's subline, no illustration, no icon.
- **Loading:** skeleton rows using the same row geometry (gray blocks where text will appear) rather than a spinner, so the list never visually "jumps" once data arrives.
- **Errors** (e.g. TMDB search fails): plain inline text stating what happened and what to do ("Couldn't reach the movie database. Try again."), no toast animation, no red alert box — a muted-gray inline message is enough, reserving `--ink` for content, not chrome.

---

## 6. Copy Voice

- Active voice, plain verbs: "Mark as watched," not "Update status." "Add new," not "Create item."
- Never refer to system internals ("record," "entity," "object") — use the words the user thinks in: movie, book, color, review, rating.
- No exclamation points, no encouragement copy, no gamification language ("Great job!", "streak"). This product doesn't cheer you on — it just keeps the record straight.

---

## 7. Accessibility Floor

- All text-toggle and add-new affordances must be real buttons/links (keyboard-operable, visible focus ring in `--ink`), not divs with click handlers.
- Contrast: `--ink` on `--bg` easily passes; verify `--muted` on `--bg` meets at least 4.5:1 for body-sized metadata text — if the exact gray above fails, darken it slightly rather than compromise on contrast for the sake of the look.
- Poster/cover images need real `alt` text (title + type), not decorative-empty alt.
- Color swatches need their hex value present as real text nearby, never conveyed by color alone.
