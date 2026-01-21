# Phase 3A Implementation Plan: Multi-Tenant Foundation

## Overview

Transform PsicoPay from a single-therapist solution into a multi-tenant SaaS platform.

**Duration:** 4-5 weeks
**Goal:** Enable multiple therapists to use the platform independently

## PRs Breakdown

### PR #16: Database Schema - Therapists & Multi-Tenant Foundation
**Branch:** `feature/phase3a-therapists-schema`

**Changes:**
1. Create `therapists` table with:
   - Basic info (google_id, email, name, profile_picture_url)
   - Professional info (bio, specializations, credentials, experience)
   - Business settings (default_session_price, default_session_duration, currency, timezone)
   - Calendar config (google_calendar_id)
   - Status (is_active, onboarding_completed)
   - Public URL (slug)

2. Add `therapist_id` foreign key to:
   - `patients` table
   - `sessions` table

3. Create indexes for multi-tenant queries

4. Update type exports

**Files:**
- `packages/db/src/schema/index.ts` - Add therapists table and relations
- `packages/db/drizzle/migrations/` - New migration

---

### PR #17: Google OAuth Authentication
**Branch:** `feature/phase3a-google-oauth`

**Changes:**
1. Create `oauth_tokens` table for storing refresh tokens
2. Add NextAuth Google provider configuration
3. Implement OAuth scopes for:
   - Email and profile info
   - Google Calendar read access
4. Create/update therapist record on login
5. Store and manage OAuth tokens securely

**Files:**
- `packages/db/src/schema/index.ts` - Add oauth_tokens table
- `apps/web/src/lib/auth.ts` - Add Google provider
- `apps/web/src/lib/auth.config.ts` - Update auth config
- `apps/web/src/app/(auth)/login/page.tsx` - Add Google login button

**Environment Variables:**
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

---

### PR #18: Multi-Therapist Context & Tenant Isolation
**Branch:** `feature/phase3a-multi-tenant-context`

**Changes:**
1. Update NextAuth JWT to include therapist_id
2. Create middleware to set tenant context
3. Update all tRPC routers to filter by therapist_id
4. Update dashboard queries to use tenant context
5. Migrate existing users to therapist records

**Files:**
- `apps/web/src/lib/auth.ts` - Add therapist_id to JWT
- `apps/web/src/server/context.ts` - Add tenant context
- `apps/web/src/server/routers/*.ts` - Update all routers
- `apps/web/scripts/migrate-to-multi-tenant.ts` - Migration script

---

### PR #19: Professional Profile Management
**Branch:** `feature/phase3a-profile-management`

**Changes:**
1. Create tables:
   - `therapist_degrees`
   - `therapist_certifications`
   - `therapist_experience`
   - `specializations` (seed data)
   - `therapist_specializations` (join table)
   - `therapeutic_approaches` (seed data)
   - `therapist_approaches` (join table)

2. Create Profile Management UI:
   - Basic Info tab
   - Credentials tab
   - Experience tab
   - Specializations tab
   - About Me tab
   - Public Profile settings

3. Create public profile page at `/[slug]`

**Files:**
- `packages/db/src/schema/profile.ts` - Profile-related tables
- `apps/web/src/app/(dashboard)/dashboard/profile/page.tsx`
- `apps/web/src/app/[slug]/page.tsx` - Public profile
- `apps/web/src/server/routers/profile.ts`

---

### PR #20: Dynamic Pricing System
**Branch:** `feature/phase3a-dynamic-pricing`

**Changes:**
1. Create tables:
   - `session_types` (Individual, Couples, Family, etc.)
   - `patient_pricing` (per-patient price overrides)
   - `price_history` (audit trail)

2. Create Pricing UI:
   - Default session price setting
   - Session types management
   - Patient-specific pricing on patient profile

3. Implement price calculation logic:
   - Check patient override first
   - Then session type price
   - Finally default price

**Files:**
- `packages/db/src/schema/pricing.ts` - Pricing tables
- `apps/web/src/app/(dashboard)/dashboard/settings/pricing/page.tsx`
- `apps/web/src/server/routers/pricing.ts`
- `apps/web/src/lib/calculate-price.ts`

---

## Branching Strategy

```
main
  └── feature/phase3a-therapists-schema (PR #16)
       └── feature/phase3a-google-oauth (PR #17)
            └── feature/phase3a-multi-tenant-context (PR #18)
                 └── feature/phase3a-profile-management (PR #19)
                      └── feature/phase3a-dynamic-pricing (PR #20)
```

Each PR will be:
1. Created from the latest main (or previous feature branch if dependent)
2. Tested locally
3. Verified in Vercel preview deployment
4. Verified GitHub Actions CI passes
5. Merged to main after approval

## Non-Breaking Changes Strategy

To ensure no breaking changes:

1. **Database migrations are additive** - New tables and columns, not removing existing ones
2. **therapist_id is nullable initially** - Allows existing data to work
3. **Migration scripts** - To backfill existing data with therapist references
4. **Feature flags** - OAuth login optional (credentials still works)
5. **Backward compatibility** - Existing single-tenant functionality preserved

## Testing Strategy

Each PR will include:
- Unit tests for new functions
- Integration tests for tRPC routers
- Schema tests for new tables
- Manual testing checklist

## Next Steps

1. Start with PR #16: Create therapists table
2. Verify schema works with existing code
3. Proceed to PR #17: Add Google OAuth
4. Continue incrementally through remaining PRs
