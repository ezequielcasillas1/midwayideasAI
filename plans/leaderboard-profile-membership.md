---
name: Leaderboard Profile Membership
overview: Implement a seller leaderboard ranked by successful sales, user profile pages with shareable contact info, membership-gated contact viewing, and hCaptcha puzzle verification for spam protection.
todos:
  - id: db-schema
    content: Update Supabase users table with membership and contact fields
    status: pending
  - id: types-update
    content: Add UserProfile, MembershipTier types to src/types/index.ts
    status: pending
  - id: leaderboard-hook
    content: Create useLeaderboard.ts hook to fetch/aggregate top sellers
    status: pending
  - id: leaderboard-page
    content: Build leaderboard page with rankings UI
    status: pending
  - id: profile-hook
    content: Create useProfile.ts hook for profile data
    status: pending
  - id: profile-page
    content: Build public profile page with contact info section
    status: pending
  - id: profile-settings
    content: Build profile settings page to edit contact preferences
    status: pending
  - id: captcha-setup
    content: Install hCaptcha, create CaptchaUnlock component
    status: pending
  - id: captcha-api
    content: Create /api/verify-captcha backend route
    status: pending
  - id: membership-gate
    content: Create MembershipGate component for access control
    status: pending
  - id: navbar-update
    content: Add Leaderboard link to Navbar
    status: pending
isProject: false
---

# Leaderboard, Profile & Membership System

## Database Schema Updates

Extend `users` table in Supabase with:

- `membership_tier` ('free' | 'basic' | 'premium')
- `membership_expires_at` (timestamp)
- `is_contact_public` (boolean)
- `contact_email`, `contact_phone`, `contact_discord`, `contact_telegram`, `contact_twitter`, `contact_linkedin` (strings)

## Key Files to Create

- `src/app/leaderboard/page.tsx` - Leaderboard ranked by sold listings
- `src/app/profile/[id]/page.tsx` - Public profile with contact info
- `src/app/profile/settings/page.tsx` - Edit contact preferences
- `src/hooks/useLeaderboard.ts` - Fetch top sellers by sales count
- `src/hooks/useProfile.ts` - Profile data management
- `src/components/CaptchaUnlock.tsx` - hCaptcha puzzle component
- `src/components/MembershipGate.tsx` - Membership check wrapper
- `src/app/api/verify-captcha/route.ts` - Backend captcha verification

## Dependencies

```bash
npm install @hcaptcha/react-hcaptcha hcaptcha
```

## Environment Variables

```
NEXT_PUBLIC_HCAPTCHA_SITEKEY=<from hcaptcha.com>
HCAPTCHA_SECRET=<from hcaptcha.com>
```

## Contact Unlock Flow

1. User clicks "View Contact Info" on profile
2. Check if viewer has membership (not 'free')
3. If no membership → show upgrade modal
4. If has membership → show hCaptcha puzzle
5. On puzzle success → reveal contact details

## Leaderboard Query Logic

```typescript
// Aggregate sold listings by seller
supabase.from('listings')
  .select('seller_id, seller:users(*), price')
  .eq('status', 'sold')
// Then group and rank by count
```

