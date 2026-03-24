---
name: Prospects Dashboard Feature
overview: Add a Prospects system where buyers can express interest in projects, sellers can view/approve prospects from a dashboard, and approved prospects gain access to repo/demo URLs on the listing page.
todos:
  - id: types
    content: Add Prospect interface, ProspectStatus type, and purchases_count to User in types/index.ts
    status: pending
  - id: mock-data
    content: Add mockProspects data and getProspectTrustLevel helper in mockData.ts
    status: pending
  - id: hooks
    content: Create useProspects.ts with useProspects, useUpdateProspectStatus, useExpressInterest hooks
    status: pending
  - id: trust-badge
    content: Create TrustBadge.tsx component for displaying buyer trust levels
    status: pending
  - id: prospects-page
    content: Create /dashboard/prospects/page.tsx with prospect list and approve/reject actions
    status: pending
  - id: navbar
    content: Add Prospects link to Navbar for logged-in sellers
    status: pending
  - id: listing-page
    content: Update listing page with Request Access button and conditional repo/demo visibility
    status: pending
isProject: false
---

# Prospects Dashboard Feature

## Overview

Sellers get a `/dashboard/prospects` page to manage interested buyers. Approved prospects can see repo/demo URLs on the listing page.

## 1. Database Types (`src/types/index.ts`)

- Add `ProspectStatus`: `'pending' | 'approved' | 'rejected'`
- Add `Prospect` interface:
  - `id`, `listing_id`, `user_id`, `status`, `created_at`
  - `user?: User` (prospect details)
  - `listing?: Listing`
- Add `purchases_count` to `User` for trust calculation

## 2. Mock Data (`src/lib/mockData.ts`)

- Add `mockProspects` array with sample prospects
- Add helper function `getProspectTrustLevel(purchasesCount)`

## 3. New Hooks (`src/hooks/useProspects.ts`)

- `useProspects()` - fetch all prospects for seller's listings
- `useUpdateProspectStatus()` - approve/reject prospects
- `useExpressInterest()` - buyer requests access to a listing

Export from `src/hooks/index.ts`

## 4. Prospects Dashboard Page (`src/app/dashboard/prospects/page.tsx`)

- Stats cards: Total prospects, Pending, Approved
- List of prospects showing:
  - Prospect name/email
  - Which listing they're interested in
  - Trust badge (Newbie/Buyer/Active/Trusted)
  - Whether they're also a seller
  - Approve/Reject buttons
- Filter by listing, status

## 5. Update Navbar (`src/components/Navbar.tsx`)

- Add "Prospects" link under Dashboard dropdown for logged-in sellers

## 6. Update Listing Page (`src/app/listing/[id]/page.tsx`)

- Add "Request Access" button for non-approved buyers
- Show repo/demo buttons ONLY if:
  - User is the seller, OR
  - User has approved prospect status
- Show "Access Pending" state if prospect status is pending
- Show "Access Denied" if rejected

## 7. Trust Level Component (`src/components/ui/TrustBadge.tsx`)

- Displays trust level based on purchase count
- Badges: Newbie (0), Buyer (1-2), Active Buyer (3-5), Trusted Buyer (6+)

## Key Files to Create

- `src/app/dashboard/prospects/page.tsx`
- `src/hooks/useProspects.ts`
- `src/components/ui/TrustBadge.tsx`

## Key Files to Modify

- `src/types/index.ts`
- `src/lib/mockData.ts`
- `src/hooks/index.ts`
- `src/components/Navbar.tsx`
- `src/app/listing/[id]/page.tsx`

