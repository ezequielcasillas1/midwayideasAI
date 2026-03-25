# Implementations Log

### [2026-03-24] - Negative Points System
**Status:** SUCCESS
**Files:** 
- src/features/membership/services/points-service.ts (deductPoints function)
- src/lib/membership-config.ts (NEGATIVE_REVIEW_PENALTY, NEGATIVE_REVIEW_THRESHOLD)
- src/types/index.ts (ListingReview, UserFlag, FlagStatus)
- src/features/listings/services/review-service.ts (new)
- src/features/membership/services/flag-service.ts (new)
**Result:** Implemented point deduction for low ratings (≤2 stars = -5 pts), user flagging, and ban system. Points floor at 0.

### [2026-03-24] - Membership Point Cap Fix
**Status:** SUCCESS
**Files:** src/lib/membership-config.ts, PointsDisplay.tsx, MembershipTiers.tsx
**Result:** All tiers now have 1000 point cap. Free users can reach Sovereign status. Paid tiers only affect earning rate.

