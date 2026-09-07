# Almanac project structure

This is the intended MVP layout. Files gain implementation detail as each milestone begins, while these boundaries remain stable.

```text
app/
  (marketing)/page.tsx              # Session-aware landing page at /
  (auth)/login/page.tsx             # Public login route
  (authenticated)/                  # Private product routes
    layout.tsx                       # Shared auth boundary and app shell
    movies/                          # Movie list, detail, loading, and error routes
    books/                           # Book list, detail, loading, and error routes
    settings/page.tsx                # Account and preferences
  api/
    auth/[...all]/route.ts           # Authentication provider endpoint
    movies/                          # Movie CRUD and TMDB search
    books/                           # Book CRUD and provider search
    tags/route.ts                    # Reusable tag operations
    preferences/route.ts             # Per-user preferences
components/
  forms/                             # Entry and review controls
  layout/                            # Product shell and navigation
  ledger/                            # Shared rows and text controls
  media/                             # Media presentation primitives
  search/                            # External media search composition
  states/                            # Empty, loading, and error states
  ui/                                # shadcn/ui low-level primitives
lib/
  auth/                              # Provider-neutral session adapter
  constants/                         # Shared constants
  db/                                # Drizzle client, schema, and user-scoped queries
  http/                              # Route Handler response helpers
  markdown/                          # Review markdown rendering and sanitization
  providers/                         # Server-only external API clients
  types/                             # Shared domain types
  validation/                        # Request and form schemas
drizzle/                             # Generated database migrations
```

## Route flow

```text
No active session:  / -> landing -> /login -> /movies
Active session:     / ------------------------> /movies
Protected routes:   /movies, /books, /settings
```

The session lookup is currently a provider-neutral stub. Route protection and successful login redirection become active during the authentication milestone.
