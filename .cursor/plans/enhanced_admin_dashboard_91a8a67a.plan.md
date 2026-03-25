---
name: Enhanced Admin Dashboard
overview: Add comprehensive admin features including detail modals, edit capabilities, search/filter, user management, listing management, data export, and activity log viewing.
todos:
  - id: base-components
    content: Create AdminModal and InfoTooltip base components
    status: pending
  - id: search-filter
    content: Create AdminSearchBar and AdminFilters shared components
    status: pending
  - id: user-modal
    content: Create UserDetailModal with profile, listings, points history, and management actions
    status: pending
  - id: edit-announcements
    content: Add edit functionality to AnnouncementsManager
    status: pending
  - id: listings-page
    content: Create listings management page with ListingDetailModal
    status: pending
  - id: export
    content: Create export service and ExportButton for CSV downloads
    status: pending
  - id: activity-log
    content: Create activity log page to view admin actions
    status: pending
  - id: enhanced-cofounders
    content: Add admin notes, email link, and user profile link to co-founder requests
    status: pending
isProject: false
---

# Enhanced Admin Dashboard

## Current State

- Basic admin with 4 pages: Overview, Sovereigns, Co-founders, Announcements
- Limited actions: view lists, change co-founder status, create/delete announcements
- No search, filtering, detail views, or user management

## New Features

### 1. Reusable Detail Modal Component

Create a shared modal component for viewing/editing details across admin.

**Files:**

- `src/features/admin/ui/AdminModal.tsx` - Base modal with header, body, footer slots
- `src/features/admin/ui/InfoTooltip.tsx` - Info button that shows tooltip on hover

### 2. User Detail Modal

Click any user to see full profile and management options.

**Shows:**

- Full profile (name, email, avatar, join date)
- Membership tier and history
- Points balance and transaction history
- Their listings (with quick feature/remove actions)
- Co-founder request status (if any)
- Admin notes field (editable)

**Actions:**

- Edit display name
- Change membership tier manually
- Add/deduct points
- Ban/suspend user
- View as user (opens their dashboard in new tab)

**Files:**

- `src/features/admin/ui/UserDetailModal.tsx`
- `src/features/admin/services/admin-service.ts` (add user management functions)

### 3. Search and Filter System

Add search bar and filters to all admin list pages.

**Sovereigns page:**

- Search by name/email
- Sort by: join date, points, name
- Filter by: has co-founder request, active listings count

**Co-founders page:**

- Search by name/email
- Filter by status: all, pending, in_discussion, approved, rejected
- Sort by: date submitted, status

**Announcements page:**

- Search by title/content
- Filter by: published, draft, pinned
- Sort by: created date, published date

**Files:**

- `src/features/admin/ui/AdminSearchBar.tsx`
- `src/features/admin/ui/AdminFilters.tsx`
- Update each admin page to use filters

### 4. Edit Announcements

Add inline editing for existing announcements.

**Features:**

- Edit button opens edit mode (same form as create)
- Toggle pin status
- Schedule publish date (optional)

**Files:**

- Update `src/features/admin/ui/AnnouncementsManager.tsx`

### 5. Listing Management Page

New admin page to manage all listings platform-wide.

**Features:**

- View all listings (not just user's own)
- Search by title, seller name
- Filter by: status (active/sold/draft), category, featured
- Feature/unfeature any listing
- Remove listing (with reason)
- View listing details modal

**Files:**

- `src/app/admin/listings/page.tsx`
- `src/features/admin/ui/ListingsManager.tsx`
- `src/features/admin/ui/ListingDetailModal.tsx`
- Update `AdminLayout.tsx` to add nav item

### 6. Export Data

Add export buttons to download CSV files.

**Exportable:**

- Sovereign members list
- Co-founder requests
- All users
- All listings
- Announcements

**Files:**

- `src/features/admin/services/export-service.ts`
- `src/features/admin/ui/ExportButton.tsx`

### 7. Activity Log Page

New admin page to view all admin actions.

**Shows:**

- Action type (e.g., "Changed co-founder status")
- Target (user/listing/announcement affected)
- Admin who performed action
- Timestamp
- Details (old value -> new value)

**Features:**

- Filter by action type
- Filter by admin
- Filter by date range
- Search by target

**Files:**

- `src/app/admin/activity/page.tsx`
- `src/features/admin/ui/ActivityLog.tsx`
- `src/features/admin/hooks/useActivityLog.ts`
- Update `AdminLayout.tsx` to add nav item

### 8. Enhanced Co-founder Requests

Add more management features.

**Features:**

- Add/edit admin notes
- Email user directly (mailto link)
- View user's full profile (opens UserDetailModal)
- Bulk actions (approve/reject multiple)

**Files:**

- Update `src/features/admin/ui/CofounderRequestsList.tsx`

## Architecture

```mermaid
flowchart TB
    subgraph pages [Admin Pages]
        Overview[/admin]
        Sovereigns[/admin/sovereigns]
        Cofounders[/admin/cofounders]
        Announcements[/admin/announcements]
        Listings[/admin/listings - NEW]
        Activity[/admin/activity - NEW]
    end

    subgraph modals [Detail Modals]
        UserModal[UserDetailModal]
        ListingModal[ListingDetailModal]
        AdminModal[Base AdminModal]
    end

    subgraph shared [Shared Components]
        SearchBar[AdminSearchBar]
        Filters[AdminFilters]
        Export[ExportButton]
        InfoTip[InfoTooltip]
    end

    Sovereigns --> UserModal
    Cofounders --> UserModal
    Listings --> ListingModal
    Listings --> UserModal

    Overview --> Export
    Sovereigns --> SearchBar
    Sovereigns --> Filters
    Sovereigns --> Export
    Cofounders --> SearchBar
    Cofounders --> Filters
    Announcements --> SearchBar
    Listings --> SearchBar
    Listings --> Filters
    Activity --> SearchBar
    Activity --> Filters
```



## Implementation Order

1. AdminModal + InfoTooltip (base components)
2. AdminSearchBar + AdminFilters (shared utilities)
3. UserDetailModal (most reused)
4. Edit announcements functionality
5. Listings management page + ListingDetailModal
6. Export service + ExportButton
7. Activity log page
8. Enhanced co-founder requests

