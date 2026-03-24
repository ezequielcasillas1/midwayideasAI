---
name: Listing view counts
overview: Add a persisted `view_count` on listings, increment it safely when the detail page is viewed (with basic duplicate suppression), surface the count and a "Hot" badge in the UI when above a threshold, and align TypeScript + mock data + Supabase.
todos:
  - id: db-migration
    content: "Supabase: view_count column + increment_listing_views RPC + RLS/execute grants"
    status: pending
  - id: types-mock
    content: Listing + Database types; mockListings view_count + HOT_PROJECT_MIN_VIEWS
    status: pending
  - id: hook-increment
    content: "useListing: RPC increment with sessionStorage dedupe; mock skip; optional seller skip"
    status: pending
  - id: ui
    content: "ListingCard + listing detail: views label + Hot badge; strip view_count from seller updates"
    status: pending
  - id: docs
    content: request.md bullet; implementations.md entry after manual verify
    status: pending
isProject: false
---

# Plan: Project view counts and "Hot" badge

## Context

- Projects are `**Listing**` in `[src/types/index.ts](src/types/index.ts)`; data loads via `[src/hooks/useListings.ts](src/hooks/useListings.ts)` from Supabase `listings` or `[src/lib/mockData.ts](src/lib/mockData.ts)` in dev (`USE_MOCK_DATA`).
- Detail route: `[src/app/listing/[id]/page.tsx](src/app/listing/[id]/page.tsx)` uses `useListing(id)`.
- Grid cards: `[src/components/ListingCard.tsx](src/components/ListingCard.tsx)`.

## 1. Database (Supabase)

- Add column `listings.view_count` — `integer not null default 0`.
- Add SQL function e.g. `increment_listing_views(listing_id uuid)` that runs `UPDATE listings SET view_count = view_count + 1 WHERE id = listing_id` (single statement, atomic).
- **RLS**: keep existing read rules; **do not** allow anonymous `UPDATE` on `view_count`. Grant `execute` on the function to `anon` + `authenticated` (or only `authenticated` if you prefer logged-in-only counts).
- Document the migration SQL in-repo if you already keep migrations (e.g. `supabase/migrations/`); otherwise a single `.sql` snippet the user runs in the SQL editor.

## 2. Types and mock data

- Extend `Listing` with `view_count: number` and update `Database` table row shape in `[src/types/index.ts](src/types/index.ts)`.
- Add realistic `view_count` values to entries in `[src/lib/mockData.ts](src/lib/mockData.ts)` so browse/detail work in dev; define a shared constant e.g. `HOT_PROJECT_MIN_VIEWS = 100` (or similar) in a small util or next to types.

## 3. Increment on detail view

- In `[useListing](src/hooks/useListings.ts)` (or a tiny hook used only by the detail page): after a successful fetch, call `supabase.rpc('increment_listing_views', { listing_id: id })` **once per browser session per listing** using `sessionStorage` key like `listing_viewed:${id}`.
- **Mock path**: if `USE_MOCK_DATA`, skip RPC; optionally no-op or client-only increment is unnecessary for static mocks.
- Optional: skip increment when `listing.seller_id === currentUser.id` (needs `getUser()` in that effect).

## 4. UI

- **Detail** (`[src/app/listing/[id]/page.tsx](src/app/listing/[id]/page.tsx)`): show read-only "X views" near metadata; if `view_count >= HOT_PROJECT_MIN_VIEWS`, show a `Badge` (e.g. "Hot project") using existing `[Badge](src/components/ui/Badge.tsx)`.
- **Card** (`[src/components/ListingCard.tsx](src/components/ListingCard.tsx)`): compact view count + hot badge on overlay or footer row (match existing spacing/colors).
- **Optional follow-up** (scope control): add `SortOption` + `useListings` order branch for `views` descending.

## 5. CRUD / create-update paths

- Ensure `[useCreateListing](src/hooks/useListings.ts)` insert does not require `view_count` if DB default handles it; if the client sends full `Listing`-shaped payloads, omit `view_count` on insert or set `0`.
- `[useUpdateListing](src/hooks/useListings.ts)`: do not allow sellers to set `view_count` from the dashboard form (strip if present in `updates`).

## 6. Project docs (per your conventions)

- Add a **short** numbered item to `[instructions/request.md](instructions/request.md)` for this feature (bullets only).
- After you verify behavior, log a brief entry to `implementations.md` (not `refresh.md`).

## Risk notes

- Without session de-duplication, refresh spam inflates counts — `sessionStorage` is the minimal fix.
- If RPC is missing in a dev environment pointing at real Supabase, detail page should still render; handle RPC error silently or log once.

