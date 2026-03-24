---
name: Universal Membership System
overview: Implement a tiered membership system (Citizen, Knight, Baron, Duke, Sovereign) with point caps, beta earning rate multipliers, Stripe payments, and user-controlled beta toggle.
todos:
  - id: types-config
    content: Add membership types to index.ts and create membership-config.ts
    status: pending
  - id: db-schema
    content: Create Supabase tables (memberships, subscriptions, point_transactions, sovereign_bans)
    status: pending
  - id: services
    content: Create membership-service, points-service, sovereign-service
    status: pending
  - id: hooks
    content: Create useMembership, usePoints, useSubscription hooks
    status: pending
  - id: stripe-api
    content: Create Stripe API routes (checkout, webhook, portal)
    status: pending
  - id: ui-components
    content: Create MembershipBadge, PointsDisplay, UpgradeModal, MembershipSettings
    status: pending
  - id: dashboard
    content: Integrate membership display into dashboard
    status: pending
  - id: testing
    content: "Test full flow: signup, upgrade, points earning, beta toggle"
    status: pending
isProject: false
---

# Universal Membership System

## Current State

- **Stack:** Next.js 14 + Supabase (PostgreSQL + Auth) + TypeScript
- **User model:** Basic fields in [src/types/index.ts](src/types/index.ts)
- **Payment:** None exists
- **API routes:** None - direct Supabase client usage

---

## Architecture

```mermaid
flowchart TB
    subgraph client [Client Layer]
        UI[Membership UI]
        Settings[User Settings]
        Points[Points Display]
    end
    
    subgraph hooks [React Hooks]
        useMembership[useMembership]
        usePoints[usePoints]
        useSubscription[useSubscription]
    end
    
    subgraph api [API Routes]
        Checkout[/api/stripe/checkout]
        Webhook[/api/stripe/webhook]
        Portal[/api/stripe/portal]
    end
    
    subgraph services [Services]
        PointsCalc[Points Calculator]
        MembershipSvc[Membership Service]
    end
    
    subgraph db [Supabase Tables]
        Users[(users)]
        Memberships[(memberships)]
        Subscriptions[(subscriptions)]
        PointsTx[(point_transactions)]
    end
    
    subgraph external [External]
        Stripe[Stripe API]
    end
    
    UI --> useMembership
    Settings --> useMembership
    Points --> usePoints
    
    useMembership --> MembershipSvc
    usePoints --> PointsCalc
    useSubscription --> api
    
    api --> Stripe
    Stripe --> Webhook
    
    MembershipSvc --> db
    PointsCalc --> db
    Webhook --> db
```



---

## Membership Tiers


| Tier               | Price             | Max Points | Earning Rate |
| ------------------ | ----------------- | ---------- | ------------ |
| Citizen (Free)     | $0                | 100 pts    | 1x           |
| Citizen (Verified) | $0                | 100 pts    | 1.1x         |
| Knight             | $3.99/wk          | 250 pts    | 1.25x        |
| Baron              | $11.99/mo         | 500 pts    | 1.5x         |
| Duke               | $59.99/yr         | 750 pts    | 2x           |
| Sovereign          | $1,000 (lifetime) | 1000 pts   | 3x           |


---

## Implementation Tasks

### 1. Types and Configuration

**File:** [src/types/index.ts](src/types/index.ts)

Add new types:

- `MembershipTier` enum
- `Membership` interface with tier, points, caps, beta toggle
- `Subscription` interface for payment tracking
- `PointTransaction` interface for audit trail
- Update `User` interface with membership fields
- Update `Database` interface with new tables

**File:** `src/lib/membership-config.ts` (new)

- Tier definitions (caps, rates, prices)
- Feature flag: `EARNING_RATE_ENABLED` (admin kill switch)

### 2. Database Schema (Supabase)

**New Tables:**

```sql
-- memberships table
memberships (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  tier text DEFAULT 'citizen',
  points integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  beta_earning_rate boolean DEFAULT true,
  created_at timestamp,
  updated_at timestamp
)

-- subscriptions table (Stripe sync)
subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  stripe_customer_id text,
  stripe_subscription_id text,
  tier text,
  status text,
  current_period_start timestamp,
  current_period_end timestamp,
  created_at timestamp
)

-- point_transactions table (audit)
point_transactions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  amount integer,
  reason text,
  multiplier_applied decimal,
  created_at timestamp
)

-- sovereign_bans table (elite refund tracking)
sovereign_bans (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  ban_count integer DEFAULT 0,
  cofounder_id uuid,
  refund_amount decimal,
  created_at timestamp
)
```

### 3. Services Layer

**File:** `src/lib/services/membership-service.ts` (new)

- `getMembership(userId)` - fetch user's membership
- `upgradeTier(userId, tier)` - change tier after payment
- `downgradeTier(userId)` - on subscription cancel
- `checkTierAccess(userId, requiredTier)` - authorization

**File:** `src/lib/services/points-service.ts` (new)

- `calculatePoints(basePoints, userId)` - applies multiplier if beta enabled
- `addPoints(userId, amount, reason)` - with cap check
- `getPointsCap(tier)` - returns max for tier
- `getEarningRate(tier, betaEnabled)` - returns multiplier

### 4. React Hooks

**File:** `src/hooks/useMembership.ts` (new)

- Current tier, points, cap, beta toggle state
- `toggleBetaEarningRate()` - user toggle

**File:** `src/hooks/usePoints.ts` (new)

- Real-time points display
- Points history

**File:** `src/hooks/useSubscription.ts` (new)

- Subscription status
- `createCheckout(tier)` - initiate Stripe
- `openPortal()` - manage subscription

### 5. API Routes (Stripe Integration)

**File:** `src/app/api/stripe/checkout/route.ts` (new)

- Create Stripe checkout session for tier

**File:** `src/app/api/stripe/webhook/route.ts` (new)

- Handle: `checkout.session.completed`
- Handle: `customer.subscription.updated`
- Handle: `customer.subscription.deleted`
- Update memberships table on events

**File:** `src/app/api/stripe/portal/route.ts` (new)

- Create billing portal session

### 6. UI Components

**File:** `src/components/membership/MembershipBadge.tsx` (new)

- Display tier badge (Citizen, Knight, Baron, Duke, Sovereign)

**File:** `src/components/membership/PointsDisplay.tsx` (new)

- Show current points / cap
- Beta badge if earning rate enabled

**File:** `src/components/membership/UpgradeModal.tsx` (new)

- Tier comparison cards
- Checkout buttons

**File:** `src/components/membership/MembershipSettings.tsx` (new)

- Beta earning rate toggle
- Subscription management link

### 7. Dashboard Integration

**File:** [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)

- Add membership status section
- Points display widget
- Upgrade CTA for lower tiers

### 8. Sovereign Ban Policy

**File:** `src/lib/services/sovereign-service.ts` (new)

- `banSovereign(userId)` - handle ban with refund logic
- `assignCofounder(userId, cofounderId)` - transfer option
- `processRefund(userId, amount)` - Stripe refund

Refund logic:

- First ban: $100 refund OR co-founder option
- Choose co-founder: No refund
- Co-founder banned: $50 refund only

---

## Decoupling Strategy

The earning rate multiplier is **beta** and user-controllable:

1. **User toggle:** `memberships.beta_earning_rate` (default: true)
2. **Admin kill switch:** `EARNING_RATE_ENABLED` env var
3. **UI label:** "Beta" badge on earning rate features
4. **Fallback:** If disabled, all users get 1x rate (caps still apply)

```typescript
// Points calculation with decoupling
function calculatePoints(base: number, tier: string, betaEnabled: boolean) {
  const cap = TIER_CAPS[tier];
  
  // Check both admin flag and user toggle
  if (!EARNING_RATE_ENABLED || !betaEnabled) {
    return Math.min(base, cap);
  }
  
  const rate = EARNING_RATES[tier];
  return Math.min(base * rate, cap);
}
```

---

## File Summary


| Action | Path                                               |
| ------ | -------------------------------------------------- |
| Modify | `src/types/index.ts`                               |
| Create | `src/lib/membership-config.ts`                     |
| Create | `src/lib/services/membership-service.ts`           |
| Create | `src/lib/services/points-service.ts`               |
| Create | `src/lib/services/sovereign-service.ts`            |
| Create | `src/hooks/useMembership.ts`                       |
| Create | `src/hooks/usePoints.ts`                           |
| Create | `src/hooks/useSubscription.ts`                     |
| Create | `src/app/api/stripe/checkout/route.ts`             |
| Create | `src/app/api/stripe/webhook/route.ts`              |
| Create | `src/app/api/stripe/portal/route.ts`               |
| Create | `src/components/membership/MembershipBadge.tsx`    |
| Create | `src/components/membership/PointsDisplay.tsx`      |
| Create | `src/components/membership/UpgradeModal.tsx`       |
| Create | `src/components/membership/MembershipSettings.tsx` |
| Modify | `src/app/dashboard/page.tsx`                       |
| Create | Supabase SQL migrations                            |


