# Universal Prospects & Stripe Escrow Implementation

**Status:** COMPLETED  
**Date:** 2026-03-25

## Summary

Implemented universal user model with captcha bypass (3 points), comprehensive prospects system with rich profiles and scoring, and full Stripe Connect escrow for marketplace payments.

## Completed Tasks

### Phase 1: Foundation
| Task | Status |
|------|--------|
| Add CAPTCHA_BYPASS_COST constant to membership-config.ts | ✅ |
| Create spendPoints() function in points-service.ts | ✅ |
| Create migration 009 for extended user profile fields | ✅ |
| Update User interface with profile fields + add Prospect type | ✅ |
| Create useCaptchaBypass hook | ✅ |
| Update HCaptcha component with bypass option | ✅ |

### Phase 2: Prospects System
| Task | Status |
|------|--------|
| Create migration 010 for prospects table | ✅ |
| Create prospect-service.ts with CRUD + scoring | ✅ |
| Create InterestButton component | ✅ |
| Create ProspectScoreBadge component | ✅ |
| Create /dashboard/prospects page | ✅ |
| Create /dashboard/interests page for buyers | ✅ |
| Create notification service for prospect alerts | ✅ |

### Phase 3: Stripe Connect Escrow
| Task | Status |
|------|--------|
| Create migration 011 for Stripe Connect tables | ✅ |
| Add ConnectedAccount, Transaction types | ✅ |
| Create /api/stripe/connect route | ✅ |
| Update webhook to handle account.updated | ✅ |
| Create /api/stripe/payment route with escrow | ✅ |
| Create /api/stripe/escrow/release route | ✅ |
| Create SellerOnboarding component | ✅ |
| Create BuyNowButton component | ✅ |
| Create /dashboard/transactions page | ✅ |

### Integration
| Task | Status |
|------|--------|
| Integrate bypass into listing creation, contact reveal, cofounder | ✅ |
| Add Interest + Buy Now buttons to listing detail | ✅ |

## Key Files Created

### Database Migrations
- `supabase/migrations/009_user_profile_extended.sql`
- `supabase/migrations/010_prospects.sql`
- `supabase/migrations/011_stripe_connect.sql`

### API Routes
- `src/app/api/points/spend/route.ts`
- `src/app/api/stripe/connect/route.ts`
- `src/app/api/stripe/payment/route.ts`
- `src/app/api/stripe/escrow/release/route.ts`
- `src/app/api/email/prospect/route.ts`

### Services
- `src/features/membership/services/points-service.ts` (modified)
- `src/features/prospects/services/prospect-service.ts`
- `src/features/notifications/services/notification-service.ts`

### Hooks
- `src/hooks/useCaptchaBypass.ts`

### Components
- `src/components/InterestButton.tsx`
- `src/components/BuyNowButton.tsx`
- `src/features/prospects/ui/ProspectScoreBadge.tsx`
- `src/features/payments/ui/SellerOnboarding.tsx`

### Pages
- `src/app/dashboard/prospects/page.tsx`
- `src/app/dashboard/interests/page.tsx`
- `src/app/dashboard/transactions/page.tsx`

## Architecture

### Captcha Bypass Flow
```
User wants to skip captcha
  └─► Check membership points (>= 3)
      └─► Call /api/points/spend
          └─► Deduct 3 points
              └─► Bypass captcha verification
```

### Prospect Flow
```
Buyer clicks "I'm Interested" or sends message
  └─► Create prospect record (idempotent)
      └─► Calculate prospect score (Hot/Warm/Cold)
          └─► Notify seller (in-app + email)
              └─► Seller views prospect on dashboard
```

### Stripe Connect Escrow Flow
```
1. Seller onboards via Stripe Express
2. Buyer clicks "Buy Now" → PaymentIntent created with escrow
3. Funds held until buyer confirms delivery
4. Buyer confirms → Transfer to seller (minus platform fee)
5. Both parties notified of completion
```

## Configuration

- `CAPTCHA_BYPASS_COST = 3` (points)
- `PLATFORM_FEE_PERCENT = 5%`
- `ESCROW_RELEASE_DAYS = 14` (auto-release)

## Extended User Profile Fields

- `bio` - User biography
- `website` - Personal website URL
- `linkedin_url`, `twitter_url`, `instagram_url` - Social links
- `budget_range` - Purchase power indicator
- `investment_timeline` - Buying intent timeline
