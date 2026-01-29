PHASE 3B: Patient Empowerment & Automation - Implementation Specification
Document Overview
Version: 1.0
Status: Ready for Implementation
Prerequisites: Phase 3A completed (Multi-Tenant Foundation)
Duration: 5-6 weeks
Goal: Eliminate manual scheduling by enabling patient self-service booking

Table of Contents

Executive Summary
Business Context & Objectives
System Architecture
Core Features Specification
Data Model & Database Design
Business Rules & Logic
Integration Points
Security & Performance
Implementation Plan
Testing Strategy
Success Criteria


1. Executive Summary
Problem Statement
Current Pain Points (from therapist feedback):

"Le molesta tener que hacer manualmente el agendado de las sesiones"
"Quizá estaría bueno que lo hagan los pacientes viendo la disponibilidad de la psicóloga"
"La psicóloga debería tener la capacidad de definir su disponibilidad horaria"
Sessions require manual coordination via WhatsApp/email
Time-consuming back-and-forth to find suitable times
No visibility into therapist availability

Impact:

2-3 hours per week spent on scheduling coordination
Delayed bookings due to communication lag
Scheduling errors and double-bookings
Poor patient experience

Solution Overview
Phase 3B transforms PsicoPay from therapist-driven to patient-driven scheduling through four interconnected systems:
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. AVAILABILITY MANAGEMENT                         │
│     Therapists define when they're available        │
│                                                     │
│  ↓                                                  │
│                                                     │
│  2. PATIENT SELF-SCHEDULING PORTAL                  │
│     Patients book sessions independently            │
│                                                     │
│  ↓                                                  │
│                                                     │
│  3. ENHANCED PATIENT PROFILES                       │
│     Rich patient data for better care               │
│                                                     │
│  ↓                                                  │
│                                                     │
│  4. RECURRING SESSIONS AUTOMATION                   │
│     Long-term patients auto-scheduled               │
│                                                     │
└─────────────────────────────────────────────────────┘
Expected Outcomes
Quantitative:

70%+ of sessions booked by patients (vs 0% currently)
80% reduction in therapist admin time (from ~3h to ~30min per week)
< 5 minutes for patient to complete booking
90%+ of recurring patients configured for auto-scheduling
< 1% scheduling conflict rate

Qualitative:

Improved patient satisfaction (24/7 booking access)
Reduced no-shows (patients choose their own times)
Better work-life balance for therapists
Professional public presence per therapist
Foundation for scaling to 100+ therapists


2. Business Context & Objectives
2.1 Strategic Alignment
Phase 3B fits into overall product vision:
Phase 1 (MVP) → Phase 2 (Dashboard) → Phase 3A (Multi-Tenant) → Phase 3B (Automation)
                                                                        ↓
                                                              Phase 3C (Payments)
                                                                        ↓
                                                              Full SaaS Platform
Why Phase 3B is critical now:

Foundation for Scale: Can't scale to 100+ therapists with manual scheduling
Competitive Advantage: Similar platforms (Doctoralia, ZocDoc) offer self-booking
User Demand: Therapist explicitly requested this feature
Revenue Impact: More bookings = more revenue (reduced friction)

2.2 Target Users
Primary User: Patients

Age: 25-55 years old
Tech-savvy enough to use WhatsApp and bank apps
Prefer convenience (book at midnight vs calling during business hours)
Want transparency in pricing and availability

Secondary User: Therapists

Need to maintain control over their schedule
Want to block personal time easily
Require visibility into booking pipeline
Need efficient exception management

2.3 Feature Prioritization
Must Have (Phase 3B):

✅ Weekly availability schedule
✅ Patient booking portal
✅ Automatic session creation in Google Calendar
✅ Conflict prevention
✅ Recurring session automation

Should Have (Phase 3B):

✅ One-time availability exceptions (vacations)
✅ Enhanced patient profiles
✅ Buffer time between sessions
✅ Booking request expiration

Nice to Have (Future):

⏳ Multi-timezone support (Phase 4)
⏳ Waitlist management (Phase 4)
⏳ Group session scheduling (Phase 5)
⏳ AI-powered scheduling suggestions (Phase 6)


3. System Architecture
3.1 High-Level Architecture
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐      ┌──────────────────────┐    │
│  │  Dashboard (Next.js) │      │ Public Portal (Next) │    │
│  │  - Therapist UI      │      │ - Patient booking    │    │
│  │  - Availability mgmt │      │ - Public profiles    │    │
│  │  - Patient profiles  │      │ - Calendar widget    │    │
│  └──────────┬───────────┘      └──────────┬───────────┘    │
│             │                             │                 │
└─────────────┼─────────────────────────────┼─────────────────┘
              │                             │
              │        ┌────────────────────┘
              │        │
              ▼        ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (tRPC)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ Availability API  │  │  Booking API     │               │
│  │ - Get slots       │  │ - Create booking │               │
│  │ - Set schedule    │  │ - Confirm        │               │
│  │ - Add exceptions  │  │ - Cancel         │               │
│  └────────┬──────────┘  └────────┬─────────┘               │
│           │                      │                          │
└───────────┼──────────────────────┼──────────────────────────┘
            │                      │
            ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────┐      │
│  │        AvailabilityService                       │      │
│  │  - calculateAvailableSlots()                     │      │
│  │  - checkConflicts()                              │      │
│  │  - applyBufferTime()                             │      │
│  └───────────────────┬──────────────────────────────┘      │
│                      │                                      │
│  ┌──────────────────────────────────────────────────┐      │
│  │        BookingService                            │      │
│  │  - createBookingRequest()                        │      │
│  │  - lockSlot()                                    │      │
│  │  - confirmBooking()                              │      │
│  │  - createSessionAndCalendarEvent()               │      │
│  └───────────────────┬──────────────────────────────┘      │
│                      │                                      │
│  ┌──────────────────────────────────────────────────┐      │
│  │        RecurringSessionService                   │      │
│  │  - generateUpcomingSessions()                    │      │
│  │  - detectConflicts()                             │      │
│  │  - handleExceptions()                            │      │
│  └───────────────────┬──────────────────────────────┘      │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              INTEGRATION LAYER                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐      │
│  │ Google       │  │ Mercado Pago │  │ Twilio      │      │
│  │ Calendar API │  │ Payment API  │  │ WhatsApp    │      │
│  └──────────────┘  └──────────────┘  └─────────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 DATA LAYER (PostgreSQL + Redis)             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [therapists] [patients] [sessions] [availability_rules]   │
│  [availability_exceptions] [booking_requests]              │
│  [recurring_sessions] [patient_preferences]                │
│                                                             │
│  Redis Cache: availability_slots, therapist_profiles       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
3.2 Technology Stack
Frontend:

Next.js 14+ (App Router) - SSR for SEO on public booking pages
React Server Components - Performance optimization
Tailwind CSS + shadcn/ui - Consistent design system
TanStack Query - Server state management
React Hook Form + Zod - Form validation

Backend:

tRPC - Type-safe API (existing stack)
Node.js 20+ - Runtime (existing stack)
PostgreSQL 15+ - Primary database (existing stack)
Redis - Caching for availability slots (new)
Drizzle ORM - Database queries (existing stack)

External Services:

Google Calendar API - Session storage and Meet links (existing)
Mercado Pago - Payment processing (existing)
Twilio WhatsApp - Notifications (existing)

Infrastructure:

Vercel - Frontend hosting
Railway/Render - Backend hosting
Neon/Supabase - PostgreSQL hosting
Upstash/Redis Cloud - Redis hosting

3.3 Architecture Decisions & Rationale
Decision 1: Redis for Availability Caching
Rationale:

Availability calculation is CPU-intensive (check rules + exceptions + existing sessions)
Public booking page will receive high traffic (patients browsing)
Fresh data not critical (15-minute staleness acceptable)
80%+ cache hit rate expected → 10x faster response times

Alternatives Considered:

❌ Calculate on-demand: Too slow (500ms+ per request)
❌ Pre-calculate in DB: Complex triggers, harder to maintain
✅ Redis cache with smart invalidation: Best balance

Decision 2: Separate Booking Request Entity
Rationale:

Session should only exist after payment confirmation
Need to track pending bookings (in payment process)
Allows cleanup of abandoned bookings
Clear state machine: booking_request → session

Alternatives Considered:

❌ Create session immediately: Clutters session table with unpaid bookings
❌ Use payment_preferences table: Not semantic (preference ≠ booking)
✅ Dedicated booking_requests table: Clean separation of concerns

Decision 3: Cron Job for Recurring Sessions (Not Webhooks)
Rationale:

Predictable generation schedule (daily at midnight)
Can batch process all therapists efficiently
Easier error handling and retry logic
Don't need real-time generation

Alternatives Considered:

❌ On-demand generation: Risk of forgetting to generate
❌ Calendar webhooks: Unreliable, complex to implement
✅ Scheduled cron job: Reliable, simple, sufficient

Decision 4: PostgreSQL Row-Level Security (RLS)
Rationale:

Multi-tenant data isolation at database level
Can't accidentally query wrong therapist's data
Security breach prevention (even if application code has bug)
No performance penalty with proper indexes

Alternatives Considered:

❌ Application-level filtering: Prone to developer errors
❌ Separate databases per tenant: Over-engineering for 10-100 therapists
✅ RLS policies: Industry best practice for multi-tenant SaaS


4. Core Features Specification
4.1 Feature 1: Availability Management System
User Story:

As a therapist, I want to define my weekly availability and block specific dates, so that patients can only book when I'm actually available.

Functional Requirements:

Weekly Schedule Configuration

Define availability by day of week (Monday-Sunday)
Multiple time blocks per day (e.g., 9am-12pm and 2pm-6pm)
Specify unavailable days (e.g., no sessions on Sundays)
Set default session duration (typically 50 minutes)


One-Time Exceptions

Block entire days (vacations, conferences)
Block specific time ranges (appointments, personal time)
Add reason for exception (optional, helps with organization)
Future-dated exceptions (plan vacations in advance)


Buffer Time Management

Configurable buffer before sessions (default: 0 minutes)
Configurable buffer after sessions (default: 10 minutes)
Prevents back-to-back burnout
Allows time for notes/preparation


Calendar Integration

Sync with Google Calendar (read existing events)
Automatically detect conflicts with non-therapy events
Two-way sync: bookings → Google Calendar



Business Rules:
BR-AV-001: Time Block Validation
- End time must be after start time
- Time blocks on same day cannot overlap
- Minimum block duration: 30 minutes (shorter than session duration not useful)

BR-AV-002: Session Duration Constraints
- Must be between 30-120 minutes
- Should be divisible by 5 (common: 30, 45, 50, 60, 90)
- Affects slot generation algorithm

BR-AV-003: Exception Priority
- Specific date exceptions override weekly rules
- All-day exceptions block entire day
- Partial exceptions block specific times

BR-AV-004: Buffer Time Application
- Buffer before = no bookings allowed X minutes before
- Buffer after = no bookings allowed Y minutes after
- Applies to both manual and recurring sessions

BR-AV-005: Conflict Detection Order
1. Check weekly availability rules
2. Check date-specific exceptions
3. Check existing sessions in Google Calendar
4. Check buffer time requirements
5. Apply all → determine final availability
Data Flow:
Therapist configures availability
    ↓
Store in availability_rules + availability_exceptions tables
    ↓
Invalidate Redis cache for this therapist
    ↓
Next availability request:
    1. Check Redis cache (MISS)
    2. Calculate available slots
        a. Get weekly rules
        b. Get exceptions for date range
        c. Get existing sessions from Google Calendar
        d. Apply buffer time
        e. Generate time slots
    3. Store result in Redis (15-minute TTL)
    4. Return to requester
    ↓
Subsequent requests hit Redis cache (fast)
UI Wireframe Principles:
Dashboard > Settings > Availability

Section 1: Weekly Schedule
- Visual calendar-like interface
- Click day to expand
- Toggle availability on/off
- Add multiple time blocks per day
- Clear visual indication of blocked days

Section 2: Exceptions
- Calendar view showing next 90 days
- Color-coded: Available (green), Blocked (red), Booked (blue)
- Click date to add exception
- List view of upcoming exceptions with edit/delete

Section 3: Buffer Settings
- Simple number inputs for before/after
- Live preview showing how slots change
- Suggested defaults based on session type

Section 4: Preview
- "View as patient sees it" button
- Shows next 7 days of available slots
- Helps therapist verify configuration
Edge Cases & Handling:
EC-AV-001: Overlapping Availability Rules
Problem: Therapist accidentally creates overlapping time blocks
Solution: Database constraint prevents overlap (GIST exclusion)
User Experience: Show error "This time overlaps with existing block"

EC-AV-002: Exception on Day with Existing Bookings
Problem: Therapist blocks day that already has confirmed sessions
Solution: Warning modal "You have 2 sessions on this day, cancel them first?"
Options: [Cancel Sessions] [Keep Exception, Keep Sessions]

EC-AV-003: Buffer Time Causes No Available Slots
Problem: Session=50min, Buffer=15min → 65min blocks → no slots fit in 1-hour availability
Solution: Warning when saving "Your buffer settings may limit bookable slots"
Suggestion: "Consider 10-minute buffer for more flexibility"

EC-AV-004: Recurring Session Conflicts with New Exception
Problem: Weekly recurring session on Mondays, therapist blocks next Monday for vacation
Solution: Recurring session generation detects conflict, skips that week
Notification: "Recurring session for [Patient] skipped on [Date] due to vacation"

4.2 Feature 2: Patient Self-Scheduling Portal
User Story:

As a patient, I want to view available appointment times and book a session online, so I don't have to coordinate schedules via messaging.

Functional Requirements:

Public Therapist Profile Page

Unique URL per therapist: psicopay.com/[slug]
Professional information (from Phase 3A profiles)
Pricing transparency
"Book Session" call-to-action


Availability Calendar Widget

Monthly calendar view showing available days
Visual indicators: Available (green), Fully booked (gray)
Select date → show available time slots
Real-time availability (no double-booking)


Booking Flow (4-Step Process)

   Step 1: Select Date & Time
   - Calendar widget
   - Choose from available slots
   
   Step 2: Patient Information
   - Name, email, phone (WhatsApp)
   - First-time patient checkbox
   - Brief reason for consultation (optional)
   
   Step 3: Review & Confirm
   - Summary of session details
   - Total price
   - Cancellation policy
   
   Step 4: Payment
   - Choose method (Mercado Pago or Bank Transfer)
   - Complete payment
   - Receive confirmation

Booking Confirmation

Email confirmation with details
WhatsApp confirmation
"Add to Calendar" link (.ics file)
Meet link delivery (15 minutes before session)


Booking Expiration

Booking request expires after 1 hour if payment not completed
Slot released back to availability
Patient can create new booking if needed



Business Rules:
BR-BK-001: Slot Locking Mechanism
- When patient selects slot, soft-lock for 10 minutes
- Other patients see slot as "being booked"
- If payment incomplete after 10 min, release lock
- Prevents race conditions without hard locks

BR-BK-002: Minimum Advance Booking
- Cannot book sessions less than 2 hours in future
- Prevents last-minute chaos
- Therapist needs preparation time
- Configurable per therapist

BR-BK-003: Maximum Advance Booking
- Can book up to 60 days in advance
- Prevents calendar clutter
- Therapist availability may change
- Configurable per therapist

BR-BK-004: Patient Information Validation
- Phone must be E.164 format (+54911XXXXXXXX)
- Email must be valid format
- Name must be at least 2 characters
- All required fields must be filled

BR-BK-005: First-Time Patient Flow
- If patient email/phone not in system → create new patient record
- If exists → link booking to existing patient
- De-duplication by phone number (primary) or email (secondary)

BR-BK-006: Payment Integration
- Booking status: pending_payment → payment_processing → confirmed
- If Mercado Pago: webhook updates status automatically
- If Bank Transfer: manual confirmation by therapist
- Expired bookings: Auto-cleanup after 24 hours

BR-BK-007: Session Creation Timing
- Session record created ONLY after payment confirmation
- Before payment: Only booking_request exists
- Prevents cluttering sessions table with unpaid bookings
Data Flow:
Patient visits psicopay.com/dra-maria
    ↓
Frontend fetches therapist profile + availability
    ↓
GET /api/therapists/[slug]/availability?start=2026-01-27&end=2026-02-03
    ↓
Backend:
    1. Lookup therapist by slug
    2. Check Redis cache: availability:[therapist_id]:[date_range]
    3. If MISS: Calculate availability (see Feature 1)
    4. Return available slots
    ↓
Patient selects slot: Monday 2026-01-27 at 09:00
    ↓
POST /api/bookings/create
    {
      therapist_id: "uuid",
      patient_name: "Juan Pérez",
      patient_email: "juan@email.com",
      patient_phone: "+5491112345678",
      requested_date: "2026-01-27",
      requested_time: "09:00",
      is_new_patient: true
    }
    ↓
Backend BookingService:
    1. Validate slot still available (race condition check)
    2. Create booking_request record (status: pending_payment)
    3. Set expiration: NOW() + 1 hour
    4. If Mercado Pago selected:
        a. Create payment preference
        b. Return payment_link
    5. If Bank Transfer selected:
        a. Return bank details
        b. Create bank_transfer_confirmation record
    ↓
Patient completes payment
    ↓
Webhook received OR therapist confirms transfer
    ↓
Backend BookingService.confirmBooking():
    1. Find or create patient record
    2. Create session record
    3. Update booking_request: status = confirmed, session_id = [new_session_id]
    4. Create Google Calendar event
    5. Generate Google Meet link
    6. Send confirmations (email + WhatsApp)
    7. Invalidate availability cache for that day
Conflict Prevention Strategy:
Scenario: Two patients try to book same slot simultaneously

Patient A                          Patient B
    |                                  |
    | GET availability                 |
    | (sees 9am available)             |
    |                                  | GET availability
    |                                  | (sees 9am available)
    |                                  |
    | POST /bookings/create (9am)      |
    | → Creates booking_request_A      |
    | → Soft-locks slot for 10 min     |
    |                                  |
    |                                  | POST /bookings/create (9am)
    |                                  | → Checks availability
    |                                  | → Sees booking_request_A with status pending
    |                                  | → Returns "Slot no longer available"
    |                                  | → Suggest alternative times
    |                                  |
    | Completes payment                |
    | → booking_request_A confirmed    |
    | → Session created                |
    |                                  |
    |                                  | Patient B selects alternative slot
    |                                  | → Creates booking_request_B
    |                                  | → Success
    
Implementation:
- Use PostgreSQL transaction isolation: SERIALIZABLE
- Before creating booking_request, check for:
  * Existing booking_request (status: pending_payment OR payment_processing) for same slot
  * Existing session for same slot
- If conflict: Return 409 Conflict with alternative slots
UI/UX Principles:
Public Booking Page:

1. Mobile-First Design
   - 60%+ of traffic will be mobile
   - Large touch targets (min 44x44px)
   - Simple, linear flow
   - No horizontal scrolling

2. Performance
   - Initial load: < 2 seconds
   - Calendar interaction: < 200ms
   - Skeleton loaders while fetching
   - Optimistic UI updates

3. Clarity & Transparency
   - Show total price upfront (no surprises)
   - Display therapist credentials prominently
   - Clear cancellation policy
   - Estimated response time for confirmations

4. Accessibility
   - WCAG 2.1 AA compliance
   - Keyboard navigation support
   - Screen reader friendly
   - Color contrast ratios met

5. Trust Signals
   - Therapist professional photo
   - Credentials and certifications visible
   - Secure payment badges
   - Privacy policy linked

4.3 Feature 3: Enhanced Patient Profiles
User Story:

As a therapist, I want detailed patient profiles with session history and preferences, so I can provide personalized care and track progress.

Functional Requirements:

Comprehensive Patient Data

Basic Information: Name, DOB, gender, contact details
Emergency Contact: Name and phone
Preferences: Preferred contact method, session times, language
Demographics: Occupation, location (city), referral source


Session History & Statistics

Total sessions: Attended, cancelled, no-shows
Attendance rate: % of scheduled sessions attended
Last session date, next session date
Payment history and outstanding balance


Administrative Notes

Non-clinical notes (preferences, accommodations)
Pinned notes for quick reference
Note types: General, Preferences, Administrative
Full history with timestamps and author


Calculated Metrics (Auto-Updated)

Session count triggers after each session
Attendance rate recalculated
Next/last session dates from sessions table
Revenue totals from payments



Business Rules:
BR-PP-001: Data Separation - Clinical vs Administrative
- System stores ONLY administrative data
- NO therapy notes, diagnoses, or clinical information
- Complies with healthcare data regulations
- Notes are for preferences/logistics only

BR-PP-002: Auto-Calculated Fields
- total_sessions_attended: COUNT(sessions WHERE scheduled_at < NOW() AND payment_status = 'paid')
- attendance_rate: (attended / (attended + cancelled)) * 100
- last_session_date: MAX(scheduled_at WHERE scheduled_at < NOW())
- next_session_date: MIN(scheduled_at WHERE scheduled_at > NOW())
- Updated via database triggers on session INSERT/UPDATE

BR-PP-003: Patient De-Duplication
- Primary key: Phone number (most reliable identifier)
- Secondary: Email address
- Before creating patient, check if phone/email exists
- If exists: Link to existing patient, update information

BR-PP-004: Patient Ownership
- Each patient belongs to ONE therapist (in Phase 3B)
- Future Phase 4: Shared patients for group practices
- Enforced by therapist_id foreign key + RLS

BR-PP-005: Data Retention
- Active patients: Keep indefinitely
- Inactive 2+ years: Archive but don't delete
- Patient can request deletion (GDPR right to be forgotten)
- Payment data retained per tax law (10 years in Argentina)
Data Model Design Rationale:
Decision: Denormalized Calculated Fields

Why store calculated fields (total_sessions, attendance_rate) instead of computing on-demand?

Pros of Denormalization:
✓ 10x faster queries (no complex joins/aggregations)
✓ Simpler application code
✓ Better UI performance (dashboard loads fast)
✓ Enables sorting/filtering by these fields

Cons:
✗ Risk of data inconsistency
✗ Additional storage (negligible: ~50 bytes per patient)

Solution: Database Triggers
- Automatic updates on session changes
- Consistency guaranteed at DB level
- No application code complexity

Decision: JSONB for Preferences

Why use JSONB instead of separate tables?

Pros:
✓ Flexible schema (preferences evolve over time)
✓ No migration needed to add new preference
✓ Single query to fetch all preferences
✓ PostgreSQL JSONB is performant (indexed)

Cons:
✗ Less type-safe than columns
✗ Harder to enforce constraints

Use Case Fit:
Patient preferences are:
- Optional (not all patients have all preferences)
- Evolving (new preference types added)
- Read frequently, written rarely
→ JSONB is ideal
UI Organization:
Patient Profile Page (Dashboard)

Header Section:
- Patient name (large, prominent)
- Contact info (email, phone with click-to-call/message)
- Age (calculated from DOB)
- Quick actions: [Edit] [Send Message] [Schedule Session]

Tabs:
1. Overview (default)
   - Statistics cards (sessions, attendance, revenue)
   - Upcoming sessions
   - Recent activity
   - Pinned notes

2. History
   - Chronological list of all sessions
   - Filter by: Status, Payment, Date range
   - Export to CSV

3. Notes
   - Add/edit administrative notes
   - Pin important notes
   - Search notes
   - Note categories/tags

4. Preferences
   - Preferred session times
   - Contact preferences
   - Special accommodations
   - Custom pricing (if any)

Visual Hierarchy:
- Most important info above the fold
- Progressive disclosure (show more on click)
- Color-coded status indicators
- Responsive layout (mobile-friendly)

4.4 Feature 4: Recurring Sessions Automation
User Story:

As a therapist, I want to automatically schedule regular weekly/biweekly sessions for my long-term patients, so I don't have to manually create each appointment.

Functional Requirements:

Recurring Session Configuration

Define frequency: Weekly, Biweekly, Monthly, Custom (every N days)
Select day of week (for weekly/biweekly)
Set time and duration
Specify start date and optional end date
Configure price per session


Automatic Session Generation

Cron job runs daily at midnight (Argentina timezone)
Generates sessions 7 days in advance
Creates session records in database
Creates Google Calendar events
Schedules payment reminders


Conflict Detection & Handling

Check therapist availability before generating
Check existing sessions (no double-booking)
Skip generation if conflict detected
Notify therapist of skipped sessions


Lifecycle Management

Pause recurring schedule (vacations, breaks)
Resume from pause (recalculates next date)
Modify configuration (applies to future sessions only)
Stop permanently (keeps existing sessions)


Patient Notifications

Payment reminders sent automatically (2-3 days before)
Earlier reminders than manual sessions (advance generation)
Session confirmation after payment
Meet link before session (existing Phase 1 logic)



Business Rules:
BR-RS-001: Generation Window
- Generate sessions exactly 7 days in advance
- Example: Today is Monday Jan 20, generate session for Monday Jan 27
- Ensures patient has time to pay (2-3 day payment window)
- Prevents generating too far ahead (therapist availability may change)

BR-RS-002: Conflict Priority
- Existing manual session > Recurring session generation
- Availability exception > Recurring session
- If conflict detected:
  * Do NOT generate recurring session
  * Log conflict
  * Notify therapist in dashboard
  * Do NOT notify patient (no session expected)

BR-RS-003: Pause Behavior
- When paused: is_active = false
- Stop generating new sessions immediately
- Existing generated sessions remain untouched
- Therapist can manually cancel existing sessions if needed

BR-RS-004: Resume Behavior
- When resumed: is_active = true
- Calculate next_generation_date from TODAY + frequency
- Example: Paused on Jan 10, Resumed on Feb 5 (weekly on Mondays)
  → Next generation: Feb 10 (next Monday)
- Does NOT backfill missed sessions during pause

BR-RS-005: Modification Propagation
- When therapist changes time/day/price:
  * Future not-yet-generated sessions: Use new config
  * Already-generated pending sessions: Option to update or keep
  * Paid sessions: Never modify (historical record)
  * Ask therapist: "Update 3 pending sessions? [Yes] [No]"

BR-RS-006: End Date Handling
- If end_date is NULL: Generate indefinitely (until manually stopped)
- If end_date is set: Stop generating after that date
- Auto-mark recurring_session as inactive when end_date reached
- Send notification: "Recurring sessions for [Patient] completed"

BR-RS-007: Payment Reminder Timing
- Regular sessions: Payment reminder 24h before (Phase 1 logic)
- Recurring sessions: Payment reminder 2-3 days before (configurable)
- Rationale: Recurring = planned, patient needs more advance notice
- advance_payment_days field in recurring_sessions table
Generation Algorithm:
Pseudocode for Recurring Session Generation:

CRON JOB: Daily at 00:00 Argentina/Buenos_Aires timezone

FUNCTION generateRecurringSessions():
  1. Fetch all active recurring_sessions
     WHERE is_active = true
     AND next_generation_date <= CURRENT_DATE
  
  2. For each recurring_session:
  
     a. Calculate target session date
        IF frequency = 'weekly':
          target_date = next_generation_date + 7 days
        ELSE IF frequency = 'biweekly':
          target_date = next_generation_date + 14 days
        ELSE IF frequency = 'monthly':
          target_date = same day next month
        ELSE IF frequency = 'custom':
          target_date = next_generation_date + interval_days
     
     b. Check if target_date exceeds end_date
        IF end_date NOT NULL AND target_date > end_date:
          Mark recurring_session as inactive
          Log completion
          Send notification to therapist
          CONTINUE to next recurring_session
     
     c. Check for conflicts
        conflicts = checkConflicts(therapist_id, target_date, time, duration)
        IF conflicts EXISTS:
          Log conflict with details
          Create dashboard notification for therapist
          CONTINUE to next recurring_session (skip generation)
     
     d. Create session record
        session = INSERT INTO sessions (
          therapist_id: recurring_session.therapist_id,
          patient_id: recurring_session.patient_id,
          scheduled_at: target_date + time,
          duration_minutes: recurring_session.duration_minutes,
          amount: recurring_session.price,
          payment_status: 'pending',
          is_recurring: true,
          recurring_session_id: recurring_session.id
        )
     
     e. Create Google Calendar event
        calendarEvent = createGoogleCalendarEvent(
          therapist_google_calendar_id,
          patient_name,
          target_date + time,
          duration,
          generate_meet_link: true
        )
        
        UPDATE sessions SET meet_link = calendarEvent.hangoutLink
        WHERE id = session.id
     
     f. Create payment preference (Mercado Pago)
        paymentPreference = createPaymentPreference(
          session_id: session.id,
          amount: recurring_session.price,
          patient_name
        )
        
        INSERT INTO payment_preferences (...)
     
     g. Schedule payment reminder
        reminder_date = target_date - recurring_session.advance_payment_days
        CREATE notification job to send payment reminder on reminder_date
     
     h. Update recurring_session
        UPDATE recurring_sessions SET
          last_generated_date = target_date,
          next_generation_date = calculateNextDate(target_date, frequency)
        WHERE id = recurring_session.id
     
     i. Log success
        INSERT INTO audit_log (
          action: 'recurring_session_generated',
          entity_type: 'session',
          entity_id: session.id,
          details: {...}
        )
  
  3. Generate summary report
     Log: Total configs processed, sessions created, conflicts skipped, errors

FUNCTION checkConflicts(therapist_id, date, time, duration):
  conflicts = []
  
  // Check availability rules
  day_of_week = getDayOfWeek(date)
  rules = SELECT * FROM availability_rules
          WHERE therapist_id = therapist_id AND day_of_week = day_of_week
  
  time_in_range = FALSE
  FOR EACH rule IN rules:
    IF time >= rule.start_time AND time < rule.end_time AND rule.is_available:
      time_in_range = TRUE
      BREAK
  
  IF NOT time_in_range:
    conflicts.ADD('Outside availability hours')
  
  // Check exceptions
  exception = SELECT * FROM availability_exceptions
              WHERE therapist_id = therapist_id
              AND exception_date = date
              AND is_available = false
  
  IF exception EXISTS:
    IF exception.all_day OR (time between exception.start_time and exception.end_time):
      conflicts.ADD('Date blocked by exception: ' + exception.reason)
  
  // Check existing sessions
  existing = SELECT * FROM sessions
             WHERE therapist_id = therapist_id
             AND scheduled_at::date = date
             AND (
               // Session overlaps with proposed time
               scheduled_at::time < (time + duration) AND
               (scheduled_at::time + (duration_minutes || ' minutes')::interval)::time > time
             )
  
  IF existing EXISTS:
    conflicts.ADD('Overlaps with existing session at ' + existing.scheduled_at)
  
  // Check buffer time
  buffer_before = therapist.buffer_before_minutes
  buffer_after = therapist.buffer_after_minutes
  
  conflicting_with_buffer = SELECT * FROM sessions
                            WHERE therapist_id = therapist_id
                            AND scheduled_at::date = date
                            AND (
                              // Within buffer before
                              scheduled_at::time > (time - buffer_before) AND scheduled_at::time < time
                              OR
                              // Within buffer after
                              scheduled_at::time < (time + duration + buffer_after) AND
                              scheduled_at::time > (time + duration)
                            )
  
  IF conflicting_with_buffer EXISTS:
    conflicts.ADD('Violates buffer time requirements')
  
  RETURN conflicts
UI Management:
Dashboard > Patients > [Patient Profile] > Recurring Sessions

View Mode (existing recurring):
┌─────────────────────────────────────────┐
│  ✅ Sesión Recurrente Activa            │
│                                         │
│  📅 Cada Lunes a las 09:00              │
│  ⏱️  50 minutos                          │
│  💰 $15,000 por sesión                  │
│                                         │
│  📊 Próximas 3 sesiones:                │
│   • 27/01/2026 09:00 - 🟡 Pago pendiente│
│   • 03/02/2026 09:00 - 📅 Generada      │
│   • 10/02/2026 09:00 - 📅 Generada      │
│                                         │
│  🗓️  Inicio: 06/01/2026                 │
│  🏁 Fin: Sin fecha límite               │
│                                         │
│  [Pausar] [Modificar] [Detener]         │
└─────────────────────────────────────────┘

Create/Edit Mode:
┌─────────────────────────────────────────┐
│  Nueva Sesión Recurrente                │
│                                         │
│  Frecuencia: *                          │
│  ○ Semanal    ○ Quincenal               │
│  ○ Mensual    ○ Personalizado           │
│                                         │
│  Día: [Lunes ▼]  Hora: [09]:[00]        │
│                                         │
│  Duración: [50] minutos                 │
│  Precio: $[15000] ARS                   │
│                                         │
│  📅 Inicio: [27/01/2026]                │
│                                         │
│  Fecha fin:                             │
│  ⦿ Sin fecha límite                     │
│  ○ Hasta: [__/__/____]                  │
│                                         │
│  ⚙️  Avanzado:                           │
│  Enviar recordatorio de pago [3] días   │
│  antes de cada sesión                   │
│                                         │
│  [Guardar] [Cancelar]                   │
└─────────────────────────────────────────┘

Conflict Notification (in dashboard):
┌─────────────────────────────────────────┐
│  ⚠️ Conflictos en Sesiones Recurrentes  │
│                                         │
│  No se pudo generar sesión:             │
│  • Juan Pérez - 27/01/2026 09:00        │
│    Motivo: Bloqueado por vacaciones     │
│                                         │
│  • Ana López - 28/01/2026 14:00         │
│    Motivo: Conflicto con otra sesión    │
│                                         │
│  [Ver Detalles] [Resolver]              │
└─────────────────────────────────────────┘

5. Data Model & Database Design
5.1 Core Tables
availability_rules (Weekly schedule)
sqlCREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  -- Schedule definition
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_day CHECK (day_of_week BETWEEN 0 AND 6),
  
  -- Prevent overlapping time blocks on same day
  EXCLUDE USING gist (
    therapist_id WITH =,
    day_of_week WITH =,
    tsrange(start_time, end_time, '[)') WITH &&
  )
);

CREATE INDEX idx_availability_rules_therapist_dow 
  ON availability_rules(therapist_id, day_of_week);
availability_exceptions (One-time blocks)
sqlCREATE TABLE availability_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  -- Exception details
  exception_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT false, -- Usually blocking
  reason VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT all_day_logic CHECK (
    (all_day = true AND start_time IS NULL AND end_time IS NULL) OR
    (all_day = false AND start_time IS NOT NULL AND end_time IS NOT NULL)
  ),
  CONSTRAINT valid_time_range CHECK (all_day = true OR end_time > start_time)
);

CREATE INDEX idx_availability_exceptions_therapist_date 
  ON availability_exceptions(therapist_id, exception_date);
booking_requests (Pre-payment bookings)
sqlCREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  -- Patient info (may not exist in patients table yet)
  patient_name VARCHAR(255) NOT NULL,
  patient_email VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL, -- E.164 format
  is_new_patient BOOLEAN DEFAULT true,
  reason_for_consultation TEXT,
  
  -- Session details
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  session_type_id UUID REFERENCES session_types(id),
  price_at_booking DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_method VARCHAR(50), -- 'mercadopago', 'bank_transfer'
  payment_preference_id VARCHAR(255), -- MP preference ID
  payment_link TEXT,
  
  -- Status lifecycle
  status VARCHAR(50) DEFAULT 'pending_payment',
  -- 'pending_payment' → 'payment_processing' → 'confirmed' → 'expired' → 'cancelled'
  
  -- Expiration
  expires_at TIMESTAMP NOT NULL, -- Usually NOW() + 1 hour
  confirmed_at TIMESTAMP,
  
  -- Link to final session (once confirmed)
  session_id UUID REFERENCES sessions(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

CREATE INDEX idx_booking_requests_therapist_date 
  ON booking_requests(therapist_id, requested_date);
CREATE INDEX idx_booking_requests_status 
  ON booking_requests(status) WHERE status IN ('pending_payment', 'payment_processing');
CREATE INDEX idx_booking_requests_expires 
  ON booking_requests(expires_at) WHERE status = 'pending_payment';
recurring_sessions (Auto-generation config)
sqlCREATE TABLE recurring_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Schedule configuration
  frequency VARCHAR(50) NOT NULL, -- 'weekly', 'biweekly', 'monthly', 'custom'
  interval_days INTEGER, -- For 'custom' frequency
  day_of_week INTEGER, -- 0-6 for weekly/biweekly
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Session details
  session_type_id UUID REFERENCES session_types(id),
  price DECIMAL(10,2) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Generation tracking
  last_generated_date DATE,
  next_generation_date DATE,
  
  -- Payment automation
  auto_send_payment_reminders BOOLEAN DEFAULT true,
  advance_payment_days INTEGER DEFAULT 3, -- Send payment link N days before
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES therapists(id),
  
  -- Constraints
  CONSTRAINT valid_frequency CHECK (
    (frequency = 'custom' AND interval_days IS NOT NULL) OR
    (frequency != 'custom' AND interval_days IS NULL)
  ),
  CONSTRAINT valid_weekly CHECK (
    (frequency IN ('weekly', 'biweekly') AND day_of_week IS NOT NULL) OR
    (frequency NOT IN ('weekly', 'biweekly'))
  ),
  CONSTRAINT valid_day CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6)
);

CREATE INDEX idx_recurring_next_gen 
  ON recurring_sessions(next_generation_date, is_active) 
  WHERE is_active = true;
patient_preferences (Session preferences)
sqlCREATE TABLE patient_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  preferred_session_duration INTEGER,
  preferred_days INTEGER[], -- [1,3,5] = Mon, Wed, Fri
  preferred_time_start TIME,
  preferred_time_end TIME,
  session_frequency VARCHAR(50), -- 'weekly', 'biweekly', 'monthly'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(patient_id, therapist_id)
);
patient_notes (Administrative notes)
sqlCREATE TABLE patient_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'preferences', 'administrative'
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES therapists(id)
);

CREATE INDEX idx_patient_notes_patient ON patient_notes(patient_id);
CREATE INDEX idx_patient_notes_pinned ON patient_notes(is_pinned) WHERE is_pinned = true;
5.2 Extended Existing Tables
patients table extensions:
sqlALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'es';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation VARCHAR(200);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referral_source VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Calculated fields (updated by triggers)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_sessions_attended INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_sessions_cancelled INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_session_date TIMESTAMP;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_session_date TIMESTAMP;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(5,2);
sessions table extensions:
sqlALTER TABLE sessions ADD COLUMN IF NOT EXISTS recurring_session_id UUID REFERENCES recurring_sessions(id);
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

CREATE INDEX idx_sessions_recurring ON sessions(recurring_session_id) WHERE is_recurring = true;
therapists table extensions:
sqlALTER TABLE therapists ADD COLUMN IF NOT EXISTS buffer_before_minutes INTEGER DEFAULT 0;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS buffer_after_minutes INTEGER DEFAULT 10;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS min_advance_booking_hours INTEGER DEFAULT 2;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS max_advance_booking_days INTEGER DEFAULT 60;
5.3 Database Triggers
Auto-update patient statistics:
sqlCREATE OR REPLACE FUNCTION update_patient_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE patients
  SET 
    total_sessions_attended = (
      SELECT COUNT(*) FROM sessions 
      WHERE patient_id = NEW.patient_id 
      AND scheduled_at < NOW() 
      AND payment_status = 'paid'
      AND status != 'cancelled'
    ),
    total_sessions_cancelled = (
      SELECT COUNT(*) FROM sessions 
      WHERE patient_id = NEW.patient_id 
      AND status = 'cancelled'
    ),
    last_session_date = (
      SELECT MAX(scheduled_at) FROM sessions
      WHERE patient_id = NEW.patient_id
      AND scheduled_at < NOW()
    ),
    next_session_date = (
      SELECT MIN(scheduled_at) FROM sessions
      WHERE patient_id = NEW.patient_id
      AND scheduled_at > NOW()
    ),
    attendance_rate = (
      SELECT CASE 
        WHEN COUNT(*) = 0 THEN 100.00
        ELSE (COUNT(*) FILTER (WHERE status != 'cancelled') * 100.0 / COUNT(*))::DECIMAL(5,2)
      END
      FROM sessions
      WHERE patient_id = NEW.patient_id AND scheduled_at < NOW()
    )
  WHERE id = NEW.patient_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_stats
AFTER INSERT OR UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_patient_stats();
Invalidate Redis cache on availability change:
sqlCREATE OR REPLACE FUNCTION invalidate_availability_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify application to invalidate Redis cache
  -- Application listens to PostgreSQL NOTIFY channel
  PERFORM pg_notify(
    'availability_changed',
    json_build_object(
      'therapist_id', COALESCE(NEW.therapist_id, OLD.therapist_id),
      'change_type', TG_OP
    )::text
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invalidate_availability_rules
AFTER INSERT OR UPDATE OR DELETE ON availability_rules
FOR EACH ROW
EXECUTE FUNCTION invalidate_availability_cache();

CREATE TRIGGER trigger_invalidate_availability_exceptions
AFTER INSERT OR UPDATE OR DELETE ON availability_exceptions
FOR EACH ROW
EXECUTE FUNCTION invalidate_availability_cache();
5.4 Indexes Strategy
Performance-critical indexes:
sql-- Availability calculation (most frequent query)
CREATE INDEX idx_availability_therapist_dow_time 
  ON availability_rules(therapist_id, day_of_week, start_time, end_time);

-- Session conflict detection
CREATE INDEX idx_sessions_therapist_date_time 
  ON sessions(therapist_id, scheduled_at) 
  WHERE scheduled_at > NOW() - INTERVAL '7 days';

-- Booking expiration cleanup
CREATE INDEX idx_booking_expired 
  ON booking_requests(expires_at, status) 
  WHERE status = 'pending_payment';

-- Recurring session generation
CREATE INDEX idx_recurring_active_next 
  ON recurring_sessions(is_active, next_generation_date) 
  WHERE is_active = true;

-- Patient profile queries
CREATE INDEX idx_patients_therapist_active 
  ON patients(therapist_id) 
  WHERE next_session_date IS NOT NULL;
```

---

## 6. Business Rules & Logic

### 6.1 Availability Calculation Algorithm

**Conceptual Flow:**
```
INPUT: therapist_id, date_range (start_date, end_date)
OUTPUT: Array of available time slots

STEP 1: Get base weekly availability
  SELECT * FROM availability_rules 
  WHERE therapist_id = ? 
  AND is_available = true

STEP 2: For each date in date_range:
  
  2.1 Get day_of_week from date
  
  2.2 Find applicable weekly rule
      - Match on day_of_week
      - Get start_time and end_time
  
  2.3 Check for date-specific exception
      - SELECT * FROM availability_exceptions
        WHERE therapist_id = ? AND exception_date = date
      - If all_day exception AND is_available = false:
          Mark entire day unavailable, SKIP to next date
      - If partial exception:
          Exclude exception time range from available hours
  
  2.4 Generate time slots within available hours
      - Start from availability start_time
      - Create slots of duration = therapist.default_session_duration
      - Include buffer_before and buffer_after
      - Example: If 9am-5pm available, 50min sessions, 10min buffer:
        Slots: 9:00-9:50, 10:00-10:50, 11:00-11:50, ... 4:00-4:50
  
  2.5 Fetch existing sessions for this date
      - SELECT * FROM sessions
        WHERE therapist_id = ? AND scheduled_at::date = date
      - Mark those time slots as BOOKED
  
  2.6 Fetch pending booking_requests
      - SELECT * FROM booking_requests
        WHERE therapist_id = ? AND requested_date = date
        AND status IN ('pending_payment', 'payment_processing')
        AND expires_at > NOW()
      - Mark those time slots as LOCKED (temporarily unavailable)
  
  2.7 Apply min/max advance booking constraints
      - If date < (TODAY + min_advance_booking_hours): Mark unavailable
      - If date > (TODAY + max_advance_booking_days): Mark unavailable

STEP 3: Aggregate results
  - Return array of objects:
    { date, time, status: 'available' | 'booked' | 'locked' | 'unavailable' }

STEP 4: Cache result in Redis
  - Key: availability:[therapist_id]:[start_date]:[end_date]
  - TTL: 15 minutes
  - Invalidate on: availability rule change, session booked, exception added
```

### 6.2 Booking Confirmation Logic

**State Machine:**
```
booking_request.status lifecycle:

pending_payment
    ↓ (payment initiated)
payment_processing
    ↓ (webhook received / transfer confirmed)
confirmed
    ↓
session created

OR

pending_payment
    ↓ (expires_at reached)
expired
    ↓
cleaned up (deleted after 24h)

OR

pending_payment
    ↓ (patient cancels OR therapist rejects)
cancelled
    ↓
slot released, cleaned up
```

**Confirmation Steps:**
```
FUNCTION confirmBooking(booking_request_id):
  
  1. Validate booking_request exists and status = 'payment_processing'
  
  2. BEGIN TRANSACTION (SERIALIZABLE isolation level)
  
  3. Lock booking_request for update
     SELECT * FROM booking_requests WHERE id = ? FOR UPDATE
  
  4. Verify slot still available (race condition check)
     conflicts = checkSlotAvailable(
       therapist_id,
       requested_date,
       requested_time,
       duration_minutes
     )
     IF conflicts EXIST:
       ROLLBACK
       RETURN error: "Slot no longer available"
  
  5. Find or create patient record
     patient = findPatientByPhone(patient_phone)
     IF patient NOT EXISTS:
       patient = createPatient({
         therapist_id,
         name: patient_name,
         email: patient_email,
         phone: patient_phone,
         ...
       })
  
  6. Create session record
     session = INSERT INTO sessions (
       therapist_id,
       patient_id,
       scheduled_at: requested_date + requested_time,
       duration_minutes,
       amount: price_at_booking,
       payment_status: 'paid',
       payment_id: (from booking_request or bank_transfer),
       is_recurring: false,
       created_at: NOW()
     )
  
  7. Create Google Calendar event
     calendarEvent = googleCalendar.createEvent({
       calendar_id: therapist.google_calendar_id,
       summary: "Sesión - " + patient.name,
       start: requested_date + requested_time,
       end: start + duration_minutes,
       description: patient.phone,
       conferenceData: { createRequest: { requestId: randomUUID() } }
     })
     
     UPDATE sessions SET meet_link = calendarEvent.hangoutLink
     WHERE id = session.id
  
  8. Update booking_request
     UPDATE booking_requests SET
       status = 'confirmed',
       confirmed_at = NOW(),
       session_id = session.id
     WHERE id = booking_request_id
  
  9. COMMIT TRANSACTION
  
  10. Send confirmations (async, after commit)
      - WhatsApp confirmation to patient
      - Email confirmation to patient
      - Dashboard notification to therapist (new booking)
  
  11. Invalidate availability cache
      - Redis: DEL availability:[therapist_id]:[date]
  
  12. Schedule automatic reminders
      - 15min before: Send Meet link
      - (Phase 1 cron job handles this)
  
  13. Return success
```

### 6.3 Recurring Session Generation Logic

**Detailed Algorithm:**
```
CRON JOB: Daily at 00:00 (Argentina/Buenos_Aires)

FUNCTION generateRecurringSessions():
  
  1. Fetch due recurring configs
     configs = SELECT * FROM recurring_sessions
               WHERE is_active = true
               AND next_generation_date <= CURRENT_DATE
               ORDER BY therapist_id, next_generation_date
  
  2. Group by therapist (for batching)
     grouped = groupBy(configs, 'therapist_id')
  
  3. For each therapist's configs:
     
     3.1 Fetch therapist details (calendar_id, buffer times, etc.)
     
     3.2 Fetch therapist's Google Calendar events (next 7 days)
         - Cache to avoid repeated API calls
     
     3.3 For each config in therapist's configs:
         
         a. Calculate target_date based on frequency
            SWITCH config.frequency:
              CASE 'weekly':
                target_date = config.next_generation_date + 7 days
              CASE 'biweekly':
                target_date = config.next_generation_date + 14 days
              CASE 'monthly':
                target_date = same day of next month
              CASE 'custom':
                target_date = config.next_generation_date + config.interval_days
         
         b. Check end_date
            IF config.end_date IS NOT NULL AND target_date > config.end_date:
              UPDATE recurring_sessions SET is_active = false
              INSERT INTO audit_log (...)
              CONTINUE to next config
         
         c. Build full datetime
            session_datetime = target_date + config.time
         
         d. Check conflicts
            conflicts = []
            
            // Check availability rules
            dow = getDayOfWeek(target_date)
            rule = SELECT * FROM availability_rules
                   WHERE therapist_id = config.therapist_id
                   AND day_of_week = dow
                   AND config.time BETWEEN start_time AND end_time
                   AND is_available = true
            
            IF rule NOT EXISTS:
              conflicts.push('Outside availability hours')
            
            // Check exceptions
            exception = SELECT * FROM availability_exceptions
                        WHERE therapist_id = config.therapist_id
                        AND exception_date = target_date
                        AND is_available = false
            
            IF exception.all_day OR 
               config.time BETWEEN exception.start_time AND exception.end_time:
              conflicts.push('Blocked by exception: ' + exception.reason)
            
            // Check existing sessions (from DB and cached calendar events)
            existing_sessions = SELECT * FROM sessions
                               WHERE therapist_id = config.therapist_id
                               AND scheduled_at::date = target_date
                               AND tsrange(scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval)
                                   &&
                                   tsrange(session_datetime, session_datetime + (config.duration_minutes || ' minutes')::interval)
            
            IF existing_sessions EXISTS:
              conflicts.push('Overlaps with existing session')
            
            // Check buffer violations
            sessions_with_buffer = SELECT * FROM sessions
                                  WHERE therapist_id = config.therapist_id
                                  AND scheduled_at::date = target_date
                                  AND (
                                    // Within buffer before
                                    session_datetime - (buffer_before || ' minutes')::interval < scheduled_at
                                    AND scheduled_at < session_datetime
                                    OR
                                    // Within buffer after
                                    session_datetime + (config.duration_minutes + buffer_after || ' minutes')::interval > scheduled_at
                                    AND scheduled_at > session_datetime + (config.duration_minutes || ' minutes')::interval
                                  )
            
            IF sessions_with_buffer EXISTS:
              conflicts.push('Buffer time violation')
         
         e. Handle conflicts
            IF conflicts.length > 0:
              // Log conflict
              INSERT INTO audit_log (
                action: 'recurring_session_skipped',
                entity_type: 'recurring_session',
                entity_id: config.id,
                details: json_build_object(
                  'target_date', target_date,
                  'conflicts', conflicts
                )
              )
              
              // Create dashboard notification
              INSERT INTO notifications (
                therapist_id: config.therapist_id,
                type: 'recurring_conflict',
                message: 'Could not generate session for ' + patient.name + ' on ' + target_date,
                data: json_build_object('conflicts', conflicts)
              )
              
              // Update next_generation_date anyway (skip this occurrence)
              UPDATE recurring_sessions 
              SET next_generation_date = calculateNextDate(target_date, frequency)
              WHERE id = config.id
              
              CONTINUE to next config
         
         f. Generate session (no conflicts)
            session_id = INSERT INTO sessions (
              therapist_id: config.therapist_id,
              patient_id: config.patient_id,
              scheduled_at: session_datetime,
              duration_minutes: config.duration_minutes,
              amount: config.price,
              payment_status: 'pending',
              is_recurring: true,
              recurring_session_id: config.id,
              session_type_id: config.session_type_id
            ) RETURNING id
         
         g. Create Google Calendar event
            calendar_event = googleCalendar.createEvent({
              calendar_id: therapist.google_calendar_id,
              summary: "Sesión - " + patient.name + " (Recurrente)",
              start: session_datetime,
              end: session_datetime + duration_minutes,
              description: "Paciente: " + patient.name + "\nTeléfono: " + patient.phone,
              conferenceData: { createRequest: { requestId: randomUUID() } }
            })
            
            UPDATE sessions SET meet_link = calendar_event.hangoutLink
            WHERE id = session_id
         
         h. Create payment preference
            payment_pref_id = INSERT INTO payment_preferences (
              session_id: session_id,
              mp_preference_id: ...,
              payment_link: ...,
              expires_at: session_datetime - 1 hour
            ) RETURNING id
         
         i. Schedule payment reminder
            IF config.auto_send_payment_reminders:
              reminder_datetime = session_datetime - (config.advance_payment_days || ' days')::interval
              
              CREATE scheduled job to send payment reminder at reminder_datetime
              // Implementation: Insert into jobs table, or use cron with timestamp check
         
         j. Update recurring_sessions tracking
            UPDATE recurring_sessions SET
              last_generated_date = target_date,
              next_generation_date = calculateNextDate(target_date, config.frequency),
              updated_at = NOW()
            WHERE id = config.id
         
         k. Log success
            INSERT INTO audit_log (
              action: 'recurring_session_generated',
              entity_type: 'session',
              entity_id: session_id,
              details: json_build_object(
                'recurring_config_id', config.id,
                'patient_id', config.patient_id,
                'scheduled_at', session_datetime
              )
            )
  
  4. Generate summary report
     total_processed = configs.length
     total_generated = count successful generations
     total_skipped = count conflicts
     total_errors = count exceptions/errors
     
     Log summary:
     "Recurring session generation completed:
      - Processed: {total_processed}
      - Generated: {total_generated}
      - Skipped (conflicts): {total_skipped}
      - Errors: {total_errors}"
     
     Send notification to admin/monitoring if total_errors > 0

HELPER FUNCTION calculateNextDate(current_date, frequency):
  SWITCH frequency:
    CASE 'weekly': RETURN current_date + 7 days
    CASE 'biweekly': RETURN current_date + 14 days
    CASE 'monthly': RETURN same day next month
    CASE 'custom': RETURN current_date + interval_days
```

### 6.4 Conflict Prevention Strategies

**Strategy 1: Database-Level Locking**
- Use `SELECT FOR UPDATE NOWAIT` when creating bookings
- Transaction isolation level: SERIALIZABLE
- Prevents two concurrent bookings for same slot

**Strategy 2: Soft-Locking with Expiration**
- When patient selects slot → create `booking_request` with `expires_at`
- Other patients checking availability see this slot as "locked"
- If payment not completed by `expires_at` → release lock
- Balance between preventing double-booking and not blocking slots indefinitely

**Strategy 3: Cache Invalidation**
- Availability cached in Redis for performance
- Invalidate cache immediately when:
  * New session booked
  * Availability rule changed
  * Exception added
  * Recurring session generated
- Ensures fresh data for conflict detection

**Strategy 4: Calendar Sync as Source of Truth**
- Google Calendar is authoritative for therapist's schedule
- Before confirming booking → check Google Calendar
- Handles edge case: therapist manually adds event in Google Calendar

---

## 7. Integration Points

### 7.1 Google Calendar API

**Operations Required:**

**1. Fetch Events (for conflict detection)**
```
Endpoint: GET /calendar/v3/calendars/{calendarId}/events
Parameters:
  - timeMin: ISO timestamp
  - timeMax: ISO timestamp
  - singleEvents: true
  - orderBy: startTime

Frequency: 
  - During availability calculation (if not cached)
  - During recurring session generation (daily)

Rate Limits:
  - 1,000,000 queries/day (quota)
  - Batch multiple therapists where possible

Error Handling:
  - Network timeout: Retry up to 3 times
  - 401 Unauthorized: Refresh OAuth token
  - 403 Forbidden: Check OAuth scopes
  - 429 Rate limit: Exponential backoff
```

**2. Create Events (when booking confirmed)**
```
Endpoint: POST /calendar/v3/calendars/{calendarId}/events
Body:
  {
    summary: "Sesión - [Patient Name]",
    description: "Teléfono: [phone]",
    start: { dateTime: "2026-01-27T09:00:00-03:00" },
    end: { dateTime: "2026-01-27T09:50:00-03:00" },
    conferenceData: {
      createRequest: {
        requestId: "[uuid]",
        conferenceSolutionKey: { type: "hangoutsMeet" }
      }
    }
  }

Response:
  - Extract hangoutLink (Google Meet URL)
  - Store in sessions.meet_link

Error Handling:
  - Creation fails: Rollback booking, notify therapist
  - Meet link not generated: Retry with new requestId
```

**3. Update Events (when session rescheduled)**
```
Endpoint: PATCH /calendar/v3/calendars/{calendarId}/events/{eventId}
Body: (partial update)
  {
    start: { dateTime: "..." },
    end: { dateTime: "..." }
  }

Use Case: Patient requests reschedule (Phase 2.5 feature)
```

**4. Delete Events (when session cancelled)**
```
Endpoint: DELETE /calendar/v3/calendars/{calendarId}/events/{eventId}

Use Case: 
  - Patient cancels booking before session
  - Therapist cancels session

Note: Soft-delete in our DB (status='cancelled'), hard-delete in Calendar
```

### 7.2 Redis Caching Layer

**Cache Structure:**
```
Key Pattern 1: availability:[therapist_id]:[start_date]:[end_date]
Value: JSON array of available slots
TTL: 900 seconds (15 minutes)
Invalidate On:
  - availability_rules INSERT/UPDATE/DELETE
  - availability_exceptions INSERT/UPDATE/DELETE
  - sessions INSERT (new booking)
  - booking_requests INSERT (new pending booking)

Example:
  Key: availability:uuid-123:2026-01-27:2026-02-03
  Value: [
    {"date":"2026-01-27","time":"09:00","status":"available"},
    {"date":"2026-01-27","time":"10:00","status":"booked"},
    ...
  ]

Key Pattern 2: therapist_profile:[therapist_id]
Value: JSON object with therapist details
TTL: 3600 seconds (1 hour)
Invalidate On:
  - therapists UPDATE

Key Pattern 3: booking_lock:[therapist_id]:[date]:[time]
Value: booking_request_id
TTL: 600 seconds (10 minutes)
Purpose: Soft-lock slot during payment process
```

**Cache Invalidation Flow:**
```
Option A: PostgreSQL LISTEN/NOTIFY

1. Database trigger sends notification
   PERFORM pg_notify('availability_changed', json_object)

2. Application listens to channel
   const client = await pool.connect()
   await client.query('LISTEN availability_changed')
   client.on('notification', async (msg) => {
     const data = JSON.parse(msg.payload)
     await redis.del(`availability:${data.therapist_id}:*`)
   })

3. Redis keys invalidated automatically

Option B: Application-Level (simpler for MVP)

1. After any operation that affects availability:
   await redis.del(`availability:${therapistId}:*`)
   
2. Pattern-based deletion:
   const keys = await redis.keys(`availability:${therapistId}:*`)
   if (keys.length > 0) await redis.del(...keys)

Recommendation: Use Option B for Phase 3B (simpler), consider Option A in Phase 4
```

### 7.3 Payment Integration (Existing)

Phase 3B reuses existing Mercado Pago integration from Phase 1:

**Changes Needed:**
- Link `payment_preferences.external_reference` to `booking_request.id` (instead of `session.id`)
- Webhook handler: After confirming payment, call `BookingService.confirmBooking()`
- No changes to Mercado Pago API calls themselves

**Bank Transfer (Phase 3C):**
- Will be added in Phase 3C, not 3B
- Phase 3B focuses on booking flow, payment already working

---

## 8. Security & Performance

### 8.1 Security Considerations

**Multi-Tenant Data Isolation:**
- All queries filtered by `therapist_id` (enforced by RLS)
- Public booking page: Only show therapist's own data
- Patient data: Only accessible by their therapist
- Booking requests: Scoped to therapist

**Input Validation:**
```
Phone Number:
  - Format: E.164 (+54911XXXXXXXX)
  - Validation: Regex + length check
  - Sanitization: Remove spaces, dashes, parentheses

Email:
  - Format: RFC 5322 compliant
  - Validation: Email validator library
  - Sanitization: Lowercase, trim

Date/Time:
  - Format: ISO 8601
  - Validation: Valid date, time in future (for bookings)
  - Timezone: Convert to therapist's timezone

Text Fields (name, reason):
  - Sanitization: Trim, remove HTML tags
  - Length limits: Enforce at DB and application level
  - XSS prevention: Escape on display
```

**Rate Limiting:**
```
Public Booking Endpoint:
  - 100 requests per IP per hour
  - Prevents scraping and abuse
  - Use express-rate-limit or similar

Availability Endpoint:
  - 300 requests per IP per hour
  - Higher limit (calendar browsing)

Dashboard API:
  - 1000 requests per therapist per hour
  - Authenticated endpoints less restrictive
```

**SQL Injection Prevention:**
- Use parameterized queries only (Drizzle ORM handles this)
- Never concatenate user input into SQL strings
- Validate all input with Zod schemas

**CSRF Protection:**
- Public booking form: CSRF token required
- SameSite cookies for session management
- Verify Origin/Referer headers

### 8.2 Performance Optimization

**Response Time Targets:**
```
Public Booking Page:
  - Initial load: < 1.5s (including profile + availability)
  - Calendar interaction: < 300ms
  - Slot selection: < 200ms
  - Booking submission: < 2s

Dashboard:
  - Availability page load: < 1s
  - Patient profile load: < 800ms
  - Save availability: < 500ms
```

**Optimization Techniques:**

**1. Availability Calculation Caching:**
```
Without Redis:
  - Every request calculates availability fresh
  - Query DB (rules, exceptions, sessions)
  - 500ms+ per request

With Redis:
  - First request: Calculate + cache (500ms)
  - Subsequent requests: Serve from cache (50ms)
  - 10x faster for 99% of requests
  - Cache hit rate target: 85%+
```

**2. Database Query Optimization:**
```
Avoid N+1 Queries:
  - Fetch patient with sessions in single query (JOIN)
  - Fetch recurring config with patient details (JOIN)
  
Use Indexes:
  - All foreign keys indexed
  - Composite indexes on frequent filters
  - Partial indexes on status fields

Connection Pooling:
  - Min: 5 connections
  - Max: 20 connections
  - Idle timeout: 30s
```

**3. Frontend Optimization:**
```
Code Splitting:
  - Separate bundle for public booking page
  - Separate bundle for dashboard
  - Load only what's needed

Lazy Loading:
  - Patient profiles: Load list first, details on click
  - Calendar events: Load visible month only
  - Images: Lazy load below fold

Debouncing:
  - Search inputs: Debounce 300ms
  - Autosave: Debounce 1000ms
```

**4. API Response Optimization:**
```
Pagination:
  - Patient list: 25 per page
  - Session history: 50 per page
  - Cursor-based pagination for large datasets

Selective Fields:
  - Only return fields needed by frontend
  - Use GraphQL-style field selection
  - Example: List view doesn't need full patient details

Compression:
  - gzip compression for API responses
  - Reduces bandwidth by 70%+
```

---

## 9. Implementation Plan

### 9.1 Timeline Overview

**Total Duration:** 5-6 weeks
```
Week 1-2: Availability Management System
Week 2-3: Patient Self-Scheduling Portal  
Week 3-4: Enhanced Patient Profiles
Week 4-5: Recurring Sessions Automation
Week 5-6: Integration, Testing, Deployment
```

### 9.2 Week-by-Week Breakdown

**Week 1: Availability Management Foundation**

**Days 1-2: Database & Backend**
- [ ] Create `availability_rules` table with constraints
- [ ] Create `availability_exceptions` table
- [ ] Implement `AvailabilityService.calculateSlots()`
- [ ] Add buffer time fields to `therapists` table
- [ ] Write unit tests for slot calculation logic
- [ ] Set up Redis connection and caching

**Days 3-4: API Layer**
- [ ] Create tRPC routes:
  - `availability.getRules` - Get therapist's weekly schedule
  - `availability.setRules` - Update weekly schedule
  - `availability.getExceptions` - Get blocked dates
  - `availability.addException` - Block date/time
  - `availability.deleteException` - Remove block
  - `availability.getSlots` - Calculate available slots (with cache)
- [ ] Implement cache invalidation logic
- [ ] Test API endpoints with Postman/Insomnia

**Days 5-7: Dashboard UI**
- [ ] Create "Availability" settings page
- [ ] Weekly schedule editor component
  - Day-by-day toggle and time inputs
  - Add/remove time blocks
  - Visual feedback for overlaps
- [ ] Exceptions manager component
  - Calendar view showing exceptions
  - Add/edit/delete modals
  - Reason field
- [ ] Buffer time configuration
- [ ] "Preview as patient" feature
- [ ] Integration testing with backend

**Deliverable:** Therapists can define and manage their availability

---

**Week 2: Patient Self-Scheduling - Backend & Data Layer**

**Days 1-2: Database & Business Logic**
- [ ] Create `booking_requests` table
- [ ] Extend `sessions` table (link to booking_request)
- [ ] Extend `patients` table (demographic fields)
- [ ] Implement `BookingService`:
  - `createBookingRequest()`
  - `checkSlotAvailability()` (with locking)
  - `confirmBooking()` (create session + calendar event)
  - `expireBooking()` (cleanup)
- [ ] Write comprehensive tests for conflict prevention

**Days 3-4: API Endpoints**
- [ ] Public booking endpoints (no auth required):
  - `public.getTherapistProfile(slug)` - Public profile data
  - `public.getAvailability(therapistId, dateRange)` - Available slots
  - `public.createBooking(data)` - Initiate booking
- [ ] Protected endpoints:
  - `bookings.confirm(id)` - Confirm after payment (webhook calls this)
  - `bookings.cancel(id)` - Cancel booking
- [ ] Rate limiting middleware
- [ ] Input validation with Zod

**Days 5: Google Calendar Integration**
- [ ] Implement `GoogleCalendarService.createEvent()` in booking flow
- [ ] Test event creation with Meet links
- [ ] Handle errors and retries
- [ ] Test with multiple therapists

**Deliverable:** Backend can handle booking requests and create sessions

---

**Week 3: Patient Self-Scheduling - Frontend (Public Portal)**

**Days 1-3: Public Booking Page**
- [ ] Create Next.js route: `/[therapistSlug]`
- [ ] Therapist profile section component
  - Photo, name, bio
  - Credentials display
  - Pricing
- [ ] Availability calendar widget
  - Month view with available days highlighted
  - Click day → show time slots
  - Real-time availability (React Query)
  - Loading states and skeleton loaders
- [ ] Mobile-responsive design (mobile-first)

**Days 4-5: Booking Flow (4 Steps)**
- [ ] Step 1: Date & Time selection
  - Visual confirmation of selected slot
  - "Slot is held for 10 minutes" message
- [ ] Step 2: Patient information form
  - Name, email, phone inputs
  - Form validation
  - First-time patient checkbox
- [ ] Step 3: Review & Confirm
  - Summary of booking details
  - Terms acceptance checkbox
- [ ] Step 4: Payment method selection
  - Redirect to Mercado Pago (existing)
  - Bank transfer instructions (Phase 3C)
- [ ] Booking confirmation page
  - Success message
  - Calendar download (.ics file)
  - Email/WhatsApp notifications

**Days 6-7: Polish & Optimization**
- [ ] Loading states and error handling
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
  - Code splitting
  - Image optimization
  - Bundle size analysis
- [ ] SEO optimization
  - Meta tags per therapist
  - Open Graph images
  - Structured data (schema.org)
- [ ] Cross-browser testing

**Deliverable:** Patients can book sessions independently via public URL

---

**Week 4: Enhanced Patient Profiles & Recurring Sessions Setup**

**Days 1-2: Enhanced Patient Profiles - Backend**
- [ ] Create `patient_notes` table
- [ ] Create `patient_preferences` table
- [ ] Add demographic fields to `patients` table
- [ ] Implement auto-update triggers for calculated fields
- [ ] Create API endpoints:
  - `patients.getProfile(id)` - Full profile with stats
  - `patients.update(id, data)` - Update demographics
  - `patients.addNote(id, note)` - Add administrative note
  - `patients.updatePreferences(id, prefs)` - Session preferences

**Days 3-4: Enhanced Patient Profiles - Frontend**
- [ ] Redesign patient profile page
- [ ] Tabs: Overview, History, Notes, Preferences
- [ ] Statistics cards (sessions, attendance, revenue)
- [ ] Notes component with pin/unpin
- [ ] Session history table with filters
- [ ] Preferences editor
- [ ] Mobile-responsive layout

**Days 5: Recurring Sessions - Database**
- [ ] Create `recurring_sessions` table
- [ ] Add `is_recurring` and `recurring_session_id` to `sessions`
- [ ] Write database functions for conflict detection
- [ ] Write tests for recurring logic

**Days 6-7: Recurring Sessions - Backend Logic**
- [ ] Implement `RecurringSessionService`:
  - `createRecurringConfig()`
  - `generateUpcomingSessions()` (will be called by cron)
  - `detectConflicts()`
  - `pauseRecurring()`
  - `resumeRecurring()`
  - `modifyRecurring()` (handles propagation logic)
- [ ] Write comprehensive tests
- [ ] Create cron job script (to be scheduled in Week 5)

**Deliverable:** Enhanced patient profiles + recurring session foundation

---

**Week 5: Recurring Sessions Automation & Integration**

**Days 1-2: Recurring Sessions - Dashboard UI**
- [ ] Recurring sessions manager component
  - View existing recurring configs
  - Create new recurring config form
  - Edit/pause/stop actions
  - Conflict warnings
- [ ] Visual indicators for recurring vs one-time sessions
- [ ] Upcoming sessions preview (generated from recurring)
- [ ] Conflict notification system in dashboard

**Days 3: Cron Job Implementation**
- [ ] Create scheduled job for recurring session generation
- [ ] Configure cron schedule (daily at midnight)
- [ ] Implement batch processing for efficiency
- [ ] Add error handling and logging
- [ ] Test cron job execution
- [ ] Monitor execution time (target: < 5 minutes for 100 configs)

**Days 4-5: Integration Testing**
- [ ] End-to-end test: Patient books session via portal
- [ ] End-to-end test: Recurring session generation
- [ ] Test conflict scenarios:
  - Double booking prevention
  - Availability exception conflicts
  - Buffer time conflicts
- [ ] Test payment integration (Mercado Pago webhook)
- [ ] Test Google Calendar sync
- [ ] Test WhatsApp notifications
- [ ] Cross-feature testing (all Phase 3B features together)

**Days 6-7: Bug Fixes & Polish**
- [ ] Fix bugs found during integration testing
- [ ] Performance testing and optimization
- [ ] Security audit
- [ ] Accessibility audit
- [ ] Documentation updates

**Deliverable:** Fully integrated and tested Phase 3B system

---

**Week 6: Testing, Deployment & Monitoring**

**Days 1-2: Final Testing**
- [ ] User acceptance testing with therapist
- [ ] Load testing (simulate 100 concurrent bookings)
- [ ] Security testing (penetration testing basics)
- [ ] Mobile device testing (iOS Safari, Android Chrome)
- [ ] Edge case testing

**Days 3-4: Deployment Preparation**
- [ ] Database migration scripts finalized
- [ ] Environment variables documented
- [ ] Deployment checklist created
- [ ] Rollback plan documented
- [ ] Monitoring dashboards configured
  - Availability endpoint response times
  - Booking success rate
  - Cron job execution time
  - Error rates

**Day 5: Deployment**
- [ ] Database migration (with backup)
- [ ] Deploy backend to production
- [ ] Deploy frontend to production
- [ ] Verify all integrations working
- [ ] Test in production (with real data)
- [ ] Monitor for first 6 hours intensively

**Days 6-7: Post-Deployment**
- [ ] Monitor metrics and logs
- [ ] Address any issues found
- [ ] Gather initial user feedback
- [ ] Create handoff documentation
- [ ] Plan Phase 3C kickoff

**Deliverable:** Phase 3B live in production and stable

---

### 9.3 Team Organization

**Recommended Team Size:** 2-3 developers

**Role Distribution:**

**Developer 1: Backend + Database Lead**
- Availability system backend
- Booking service logic
- Recurring sessions service
- Database schema and migrations
- API endpoints
- Cron job implementation

**Developer 2: Frontend Lead**
- Public booking portal
- Dashboard availability UI
- Enhanced patient profiles UI
- Recurring sessions UI
- Mobile responsiveness
- Accessibility

**Developer 3 (Optional): Integration & DevOps**
- Google Calendar integration
- Payment integration updates
- Cron job deployment
- Monitoring setup
- Testing automation
- Deployment pipeline

**If Solo Developer:**
Follow week-by-week plan sequentially, may extend to 7-8 weeks

---

### 9.4 Risk Management

**High-Risk Areas:**

**1. Conflict Prevention (Double-Booking)**
- **Risk:** Two patients book same slot simultaneously
- **Mitigation:** 
  - Database-level locking with SERIALIZABLE transactions
  - Comprehensive tests for race conditions
  - Soft-locking with booking_requests
- **Contingency:** Manual therapist intervention if conflict occurs

**2. Cron Job Reliability**
- **Risk:** Cron job fails, recurring sessions not generated
- **Mitigation:**
  - Robust error handling
  - Alerting on job failures
  - Idempotent job (safe to re-run)
  - Manual generation UI as backup
- **Contingency:** Therapist manually creates sessions if needed

**3. Google Calendar Sync Issues**
- **Risk:** Calendar events not created, Meet links missing
- **Mitigation:**
  - Retry logic for API failures
  - Store calendar_event_id for verification
  - Fallback: Manual Meet link generation
- **Contingency:** Therapist sends Meet link manually via WhatsApp

**4. Performance Degradation**
- **Risk:** Slow availability calculation affects booking experience
- **Mitigation:**
  - Redis caching (15-min TTL)
  - Database query optimization
  - Performance monitoring
- **Contingency:** Increase cache TTL, optimize queries

**5. Cache Invalidation Bugs**
- **Risk:** Stale availability shown, bookings for unavailable slots
- **Mitigation:**
  - Conservative cache invalidation (invalidate more rather than less)
  - Conflict detection at booking time (double-check)
  - Monitoring for mismatches
- **Contingency:** Reduce cache TTL or disable caching temporarily

---

### 9.5 Testing Milestones

**End of Week 1:**
- [ ] Availability system works for single therapist
- [ ] Can define weekly schedule
- [ ] Can add exceptions
- [ ] Available slots calculated correctly
- [ ] Dashboard UI functional

**End of Week 2:**
- [ ] Booking requests can be created
- [ ] Payment integration works
- [ ] Sessions created after payment
- [ ] Google Calendar events created
- [ ] Conflict prevention tested

**End of Week 3:**
- [ ] Public booking page loads
- [ ] Patients can complete booking
- [ ] Mobile experience is good
- [ ] Payment flow end-to-end works

**End of Week 4:**
- [ ] Patient profiles show statistics
- [ ] Notes can be added
- [ ] Recurring sessions can be configured
- [ ] Conflict detection works

**End of Week 5:**
- [ ] Recurring sessions auto-generate
- [ ] Cron job executes successfully
- [ ] All features work together
- [ ] No critical bugs

**End of Week 6:**
- [ ] Production deployment successful
- [ ] No major issues reported
- [ ] Monitoring shows healthy metrics
- [ ] User feedback positive

---

## 10. Testing Strategy

### 10.1 Unit Testing

**Coverage Targets:**
- Services: 80%+
- Repositories: 70%+
- Utilities: 90%+
- Critical paths: 100%

**Test Framework:** Vitest

**Key Test Scenarios:**

**AvailabilityService:**
```
✓ calculateSlots() returns correct slots for simple schedule
✓ calculateSlots() respects exceptions
✓ calculateSlots() applies buffer time correctly
✓ calculateSlots() marks booked slots as unavailable
✓ calculateSlots() marks locked slots (pending bookings) as unavailable
✓ checkConflicts() detects overlap with existing session
✓ checkConflicts() detects buffer time violation
✓ checkConflicts() allows adjacent sessions with no buffer
✓ applyBufferTime() adds correct minutes before/after
```

**BookingService:**
```
✓ createBookingRequest() validates patient data
✓ createBookingRequest() checks slot availability
✓ createBookingRequest() creates booking_request record
✓ confirmBooking() creates patient if not exists
✓ confirmBooking() creates session record
✓ confirmBooking() creates Google Calendar event
✓ confirmBooking() sends notifications
✓ confirmBooking() handles race condition (slot taken)
✓ expireBooking() cleans up expired bookings
RecurringSessionService:
✓ generateUpcomingSessions() calculates next date correctly (weekly)
✓ generateUpcomingSessions() calculates next date correctly (biweekly)
✓ generateUpcomingSessions() calculates next date correctly (monthly)
✓ generateUpcomingSessions() generates session with correct data
✓ detectConflicts() finds availability rule conflicts
✓ detectConflicts() finds existing session conflicts
✓ detectConflicts() finds exception conflicts
✓ detectConflicts() finds buffer time conflicts
✓ pauseRecurring() stops generation
✓ resumeRecurring() recalculates next date from today
✓ modifyRecurring() updates future sessions only
✓ generateUpcomingSessions() respects end_date
✓ generateUpcomingSessions() skips generation when conflict detected

### 10.2 Integration Testing

**Test Environment:**
- Dedicated test database (PostgreSQL)
- Redis test instance
- Mock Google Calendar API (or sandbox calendar)
- Mock Mercado Pago (test credentials)
- Mock Twilio (test phone numbers)

**Critical Integration Flows:**

**Flow 1: Complete Booking Journey**
```javascript
describe('Patient Booking Flow', () => {
  it('should complete full booking journey', async () => {
    // 1. Patient visits public page
    const therapist = await createTestTherapist()
    const profile = await api.public.getTherapistProfile(therapist.slug)
    expect(profile).toBeDefined()
    
    // 2. Patient checks availability
    const availability = await api.public.getAvailability({
      therapistId: therapist.id,
      startDate: '2026-01-27',
      endDate: '2026-02-03'
    })
    expect(availability).toHaveLength(7) // 7 days
    const availableSlot = availability[0].slots.find(s => s.status === 'available')
    expect(availableSlot).toBeDefined()
    
    // 3. Patient creates booking
    const booking = await api.public.createBooking({
      therapistId: therapist.id,
      patientName: 'Juan Pérez',
      patientEmail: 'juan@test.com',
      patientPhone: '+5491112345678',
      requestedDate: availability[0].date,
      requestedTime: availableSlot.time,
      isNewPatient: true,
      paymentMethod: 'mercadopago'
    })
    expect(booking.status).toBe('pending_payment')
    expect(booking.paymentLink).toBeDefined()
    
    // 4. Simulate payment webhook
    const webhookPayload = createMockMercadoPagoWebhook({
      paymentId: 'test-payment-123',
      status: 'approved',
      externalReference: booking.id
    })
    await api.webhooks.mercadopago(webhookPayload)
    
    // 5. Verify session created
    const session = await db.sessions.findByBookingRequestId(booking.id)
    expect(session).toBeDefined()
    expect(session.paymentStatus).toBe('paid')
    expect(session.meetLink).toContain('meet.google.com')
    
    // 6. Verify patient created
    const patient = await db.patients.findByPhone('+5491112345678')
    expect(patient).toBeDefined()
    expect(patient.name).toBe('Juan Pérez')
    
    // 7. Verify Google Calendar event created
    const calendarEvent = await googleCalendarMock.getEvent(session.calendarEventId)
    expect(calendarEvent).toBeDefined()
    expect(calendarEvent.summary).toContain('Juan Pérez')
    
    // 8. Verify notifications sent
    const notifications = await db.notifications.findBySessionId(session.id)
    expect(notifications.some(n => n.type === 'payment_confirmed')).toBe(true)
  })
})
```

**Flow 2: Recurring Session Generation**
```javascript
describe('Recurring Session Generation', () => {
  it('should generate recurring sessions correctly', async () => {
    // Setup
    const therapist = await createTestTherapist()
    const patient = await createTestPatient(therapist.id)
    
    // Create availability
    await db.availabilityRules.create({
      therapistId: therapist.id,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true
    })
    
    // Create recurring config
    const recurring = await db.recurringsessions.create({
      therapistId: therapist.id,
      patientId: patient.id,
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '09:00',
      durationMinutes: 50,
      price: 15000,
      startDate: '2026-01-20',
      isActive: true,
      nextGenerationDate: '2026-01-20'
    })
    
    // Run generation
    await RecurringSessionService.generateUpcomingSessions()
    
    // Verify session created
    const sessions = await db.sessions.findByRecurringId(recurring.id)
    expect(sessions).toHaveLength(1)
    expect(sessions[0].scheduledAt).toBe('2026-01-27T09:00:00-03:00')
    expect(sessions[0].isRecurring).toBe(true)
    
    // Verify next_generation_date updated
    const updatedRecurring = await db.recurringSession.findById(recurring.id)
    expect(updatedRecurring.nextGenerationDate).toBe('2026-01-27')
    
    // Verify calendar event created
    expect(googleCalendarMock.createEvent).toHaveBeenCalled()
  })
  
  it('should skip generation when conflict exists', async () => {
    // Setup with existing session at same time
    const therapist = await createTestTherapist()
    const patient = await createTestPatient(therapist.id)
    
    // Create manual session at 9am Monday
    await db.sessions.create({
      therapistId: therapist.id,
      patientId: patient.id,
      scheduledAt: '2026-01-27T09:00:00-03:00',
      durationMinutes: 50
    })
    
    // Create recurring config for same time
    const recurring = await db.recurringSession.create({
      therapistId: therapist.id,
      patientId: patient.id,
      frequency: 'weekly',
      dayOfWeek: 1,
      time: '09:00',
      durationMinutes: 50,
      price: 15000,
      nextGenerationDate: '2026-01-20'
    })
    
    // Run generation
    await RecurringSessionService.generateUpcomingSessions()
    
    // Verify no new session created (conflict)
    const sessions = await db.sessions.findByRecurringId(recurring.id)
    expect(sessions).toHaveLength(0)
    
    // Verify conflict logged
    const auditLog = await db.auditLog.findByAction('recurring_session_skipped')
    expect(auditLog.length).toBeGreaterThan(0)
    expect(auditLog[0].details.conflicts).toContain('existing session')
  })
})
```

**Flow 3: Conflict Prevention**
```javascript
describe('Booking Conflict Prevention', () => {
  it('should prevent double booking with database lock', async () => {
    const therapist = await createTestTherapist()
    await setupAvailability(therapist.id)
    
    // Simulate two concurrent booking attempts
    const bookingData = {
      therapistId: therapist.id,
      patientName: 'Test Patient',
      patientEmail: 'test@test.com',
      patientPhone: '+5491112345678',
      requestedDate: '2026-01-27',
      requestedTime: '09:00'
    }
    
    const [result1, result2] = await Promise.allSettled([
      api.public.createBooking(bookingData),
      api.public.createBooking(bookingData)
    ])
    
    // One should succeed, one should fail
    const succeeded = [result1, result2].filter(r => r.status === 'fulfilled')
    const failed = [result1, result2].filter(r => r.status === 'rejected')
    
    expect(succeeded).toHaveLength(1)
    expect(failed).toHaveLength(1)
    expect(failed[0].reason.message).toContain('no longer available')
  })
})
```

### 10.3 End-to-End Testing

**Tool:** Playwright

**Test Scenarios:**

**E2E Test 1: Therapist Sets Availability**
```typescript
test('therapist can set weekly availability', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('[name="email"]', 'therapist@test.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  // Navigate to availability
  await page.goto('/dashboard/settings/availability')
  
  // Configure Monday availability
  await page.click('[data-testid="day-monday"]')
  await page.fill('[data-testid="monday-start-time"]', '09:00')
  await page.fill('[data-testid="monday-end-time"]', '17:00')
  await page.click('[data-testid="monday-available-toggle"]')
  
  // Save
  await page.click('button:has-text("Guardar Cambios")')
  
  // Verify success message
  await expect(page.locator('.toast-success')).toContainText('Disponibilidad actualizada')
  
  // Verify saved in database
  const rules = await db.availabilityRules.findByTherapist(therapistId)
  expect(rules.find(r => r.dayOfWeek === 1)).toBeDefined()
})
```

**E2E Test 2: Patient Books Session**
```typescript
test('patient can book session via public portal', async ({ page }) => {
  // Visit public booking page
  await page.goto('/dra-maria')
  
  // Verify profile loads
  await expect(page.locator('h1')).toContainText('Dra. María González')
  
  // Click "Book Session"
  await page.click('button:has-text("Agendar Sesión")')
  
  // Select date
  await page.click('[data-date="2026-01-27"]')
  
  // Select time slot
  await page.click('[data-time="09:00"]')
  
  // Fill patient information
  await page.fill('[name="name"]', 'Juan Pérez')
  await page.fill('[name="email"]', 'juan@test.com')
  await page.fill('[name="phone"]', '+5491112345678')
  
  // Continue to payment
  await page.click('button:has-text("Continuar")')
  
  // Review and confirm
  await expect(page.locator('.booking-summary')).toContainText('27/01/2026')
  await expect(page.locator('.booking-summary')).toContainText('09:00')
  await expect(page.locator('.booking-summary')).toContainText('$15,000')
  
  // Select payment method
  await page.click('[data-payment="mercadopago"]')
  await page.click('button:has-text("Confirmar y Pagar")')
  
  // Redirected to Mercado Pago (in test, mock the return)
  // Simulate successful payment return
  await page.goto('/payment/success?payment_id=test-123&external_reference=booking-abc')
  
  // Verify confirmation page
  await expect(page.locator('.confirmation')).toContainText('Sesión Confirmada')
  await expect(page.locator('.confirmation')).toContainText('27/01/2026 09:00')
})
```

**E2E Test 3: Recurring Session in Dashboard**
```typescript
test('therapist can configure recurring sessions', async ({ page }) => {
  await loginAsTherapist(page)
  
  // Navigate to patient profile
  await page.goto('/dashboard/patients/test-patient-id')
  
  // Go to recurring sessions tab
  await page.click('text=Sesiones Recurrentes')
  
  // Click "Add Recurring Session"
  await page.click('button:has-text("Nueva Sesión Recurrente")')
  
  // Configure frequency
  await page.click('input[value="weekly"]')
  await page.selectOption('[name="dayOfWeek"]', '1') // Monday
  await page.fill('[name="time"]', '09:00')
  await page.fill('[name="duration"]', '50')
  await page.fill('[name="price"]', '15000')
  await page.fill('[name="startDate"]', '2026-01-20')
  
  // Save
  await page.click('button:has-text("Guardar")')
  
  // Verify success
  await expect(page.locator('.toast-success')).toContainText('Sesión recurrente creada')
  
  // Verify displays in list
  await expect(page.locator('.recurring-list')).toContainText('Cada Lunes a las 09:00')
})
```

### 10.4 Performance Testing

**Tool:** k6 or Artillery

**Load Test Scenarios:**

**Scenario 1: Public Booking Page Load**
```javascript
// Simulate 100 concurrent users browsing availability
export const options = {
  vus: 100,
  duration: '5m'
}

export default function() {
  // Visit public page
  const profileResponse = http.get('https://psicopay.com/dra-maria')
  check(profileResponse, {
    'profile loads in < 1.5s': (r) => r.timings.duration < 1500,
    'status is 200': (r) => r.status === 200
  })
  
  sleep(2)
  
  // Fetch availability
  const availabilityResponse = http.get(
    'https://psicopay.com/api/public/availability?therapistId=xxx&start=2026-01-27&end=2026-02-03'
  )
  check(availabilityResponse, {
    'availability loads in < 500ms': (r) => r.timings.duration < 500,
    'status is 200': (r) => r.status === 200
  })
  
  sleep(5)
}
```

**Scenario 2: Concurrent Booking Attempts**
```javascript
// Simulate 50 concurrent booking attempts (stress test conflict prevention)
export const options = {
  vus: 50,
  duration: '2m'
}

export default function() {
  const bookingData = {
    therapistId: 'test-therapist-id',
    patientName: `Patient ${__VU}`,
    patientEmail: `patient${__VU}@test.com`,
    patientPhone: `+54911${String(__VU).padStart(8, '0')}`,
    requestedDate: '2026-01-27',
    requestedTime: '09:00' // Everyone trying to book same slot
  }
  
  const response = http.post(
    'https://psicopay.com/api/public/bookings',
    JSON.stringify(bookingData),
    { headers: { 'Content-Type': 'application/json' } }
  )
  
  // Most should get 409 Conflict (slot taken)
  // Only one should get 200 OK
  check(response, {
    'response received': (r) => r.status === 200 || r.status === 409
  })
}
```

**Scenario 3: Recurring Session Generation (Cron Job Performance)**
```javascript
// Test cron job performance with 100 recurring configs
test('cron job completes in < 5 minutes with 100 configs', async () => {
  // Setup: Create 100 recurring session configs
  const configs = []
  for (let i = 0; i < 100; i++) {
    configs.push(await db.recurringSession.create({
      therapistId: `therapist-${i % 10}`, // 10 therapists
      patientId: `patient-${i}`,
      frequency: 'weekly',
      dayOfWeek: i % 7,
      time: '09:00',
      durationMinutes: 50,
      nextGenerationDate: '2026-01-20'
    }))
  }
  
  // Run cron job
  const startTime = Date.now()
  await RecurringSessionService.generateUpcomingSessions()
  const duration = Date.now() - startTime
  
  // Verify performance
  expect(duration).toBeLessThan(5 * 60 * 1000) // 5 minutes
  
  // Verify all processed
  const updatedConfigs = await db.recurringSession.findAll()
  expect(updatedConfigs.every(c => c.nextGenerationDate > '2026-01-20')).toBe(true)
})
```

### 10.5 Security Testing

**Manual Security Checklist:**
Authentication & Authorization:
✓ Public booking page accessible without auth
✓ Dashboard requires authentication
✓ Therapist can only see own patients
✓ Therapist cannot access other therapist's data
✓ Admin can access all data (if admin role exists)
Input Validation:
✓ Phone number validation (E.164 format)
✓ Email validation
✓ Date/time validation
✓ SQL injection attempts blocked
✓ XSS attempts sanitized
Rate Limiting:
✓ Public booking endpoint rate limited
✓ Availability endpoint rate limited
✓ Login attempts rate limited (Phase 3A)
Data Privacy:
✓ Patient data only visible to their therapist
✓ Booking requests scoped to therapist
✓ No patient data leaked in error messages
CSRF Protection:
✓ CSRF tokens on all forms
✓ SameSite cookies configured
✓ Origin/Referer headers validated
HTTPS:
✓ All endpoints HTTPS only
✓ HSTS headers configured
✓ Redirect HTTP to HTTPS

**Automated Security Scan:**
```bash
# Run OWASP ZAP scan
zap-cli quick-scan --self-contained \
  --start-options '-config api.disablekey=true' \
  https://psicopay.com

# Run npm audit
npm audit --production

# Run Snyk scan
snyk test
```

---

## 11. Success Criteria

### 11.1 Technical Success Metrics

**Performance:**
✓ Public booking page loads in < 1.5s (p95)
✓ Availability calendar interaction < 300ms (p95)
✓ Booking submission completes in < 2s (p95)
✓ Dashboard loads in < 1s (p95)
✓ Cron job completes in < 5 minutes (100 recurring configs)
✓ Redis cache hit rate > 80%
✓ Database query time < 100ms (p95)

**Reliability:**
✓ 99.5%+ uptime during business hours (9am-9pm)
✓ Zero data loss incidents
✓ < 1% booking conflicts (double-booking)
✓ Cron job 100% success rate
✓ Google Calendar sync 99%+ success rate

**Code Quality:**
✓ 80%+ test coverage (services)
✓ Zero critical security vulnerabilities
✓ All TypeScript strict mode enabled
✓ ESLint passes with no errors
✓ Lighthouse score > 90 (public booking page)

### 11.2 Business Success Metrics

**Adoption:**
✓ 100% of therapists set up availability within first week
✓ 70%+ of sessions booked by patients (not therapists) within 1 month
✓ 50%+ of regular patients (5+ sessions) configured for recurring
✓ 5+ patient bookings per week via public portal

**Efficiency:**
✓ 80% reduction in therapist admin time (from ~3h to ~30min per week)
✓ Average booking time < 5 minutes (patient perspective)
✓ Time to confirm booking < 12 hours average (including payment)
✓ Scheduling conflicts reduced by 90%

**User Satisfaction:**
✓ Therapist satisfaction > 8/10 (post-implementation survey)
✓ Patient satisfaction > 8/10 (booking experience survey)
✓ < 5% booking abandonment rate (start but don't complete)
✓ Zero complaints about double-booking
✓ Positive feedback on public portal design

### 11.3 Readiness for Phase 3C

**Technical Readiness:**
✓ Database schema supports payment method variations
✓ Booking flow can accommodate dual payment methods
✓ Patient trust level calculation ready (fields in place)
✓ Architecture scales to 10+ therapists
✓ Monitoring and alerting operational

**Documentation:**
✓ API documentation complete
✓ User guide for therapists
✓ Technical architecture documented
✓ Database schema documented
✓ Deployment runbook updated

---

## 12. Appendices

### Appendix A: Database Schema Diagram
┌─────────────────────┐
│     therapists      │
│──────────────────── │
│ id                  │──┐
│ google_id           │  │
│ email               │  │
│ name                │  │
│ slug                │  │
│ buffer_before_mins  │  │
│ buffer_after_mins   │  │
│ ...                 │  │
└─────────────────────┘  │
│
┌───────────────┼───────────────┬────────────────┐
│               │               │                │
▼               ▼               ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐
│availability_ │  │availability_ │  │ patients │  │ recurring_   │
│   rules      │  │ exceptions   │  │          │  │  sessions    │
│────────────  │  │────────────  │  │──────────│  │──────────────│
│ therapist_id │  │ therapist_id │  │ id       │──│ patient_id   │
│ day_of_week  │  │ exception_   │  │therapist │  │ therapist_id │
│ start_time   │  │   date       │  │  id     │  │ frequency    │
│ end_time     │  │ start_time   │  │ name     │  │ time         │
│ is_available │  │ end_time     │  │ phone    │  │ next_gen_date│
└──────────────┘  │ all_day      │  │ ...      │  │ ...          │
│ is_available │  └────┬─────┘  └──────┬───────┘
│ reason       │       │               │
└──────────────┘       │               │
│               │
┌──────────────────────┴───────────────┘
│
▼
┌──────────────┐
│  sessions    │
│────────────  │
│ id           │
│ therapist_id │
│ patient_id   │
│ scheduled_at │
│ duration_mins│
│ payment     │
│   status     │
│ is_recurring │
│ recurring_   │
│   session_id │
│ meet_link    │
└──────┬───────┘
│
┌────────┴────────┬──────────────┐
▼                 ▼              ▼
┌─────────────┐   ┌──────────────┐  ┌─────────┐
│ booking_    │   │ payment_     │  │patient_ │
│ requests    │   │ preferences  │  │ notes   │
│─────────────│   │──────────────│  │─────────│
│ session_id  │   │ session_id   │  │patient_ │
│ patient_name│   │ mp_pref_id   │  │  id    │
│ patient    │   │ payment_link │  │ content │
│   phone     │   │ expires_at   │  │ is_     │
│ requested_  │   └──────────────┘  │ pinned  │
│   date/time │                     └─────────┘
│ status      │
│ expires_at  │
└─────────────┘

### Appendix B: Key Algorithms Pseudocode

**Available Slots Calculation:**
FUNCTION calculateAvailableSlots(therapistId, startDate, endDate):
slots = []
FOR date IN dateRange(startDate, endDate):
dayOfWeek = getDayOfWeek(date)
// Get base availability
rules = getAvailabilityRules(therapistId, dayOfWeek)
IF rules.isEmpty():
  CONTINUE // No availability this day

// Check for exceptions
exception = getException(therapistId, date)
IF exception AND exception.allDay AND NOT exception.isAvailable:
  CONTINUE // Entire day blocked

// Generate time slots
FOR rule IN rules:
  timeSlots = generateTimeSlots(
    rule.startTime,
    rule.endTime,
    sessionDuration,
    bufferBefore,
    bufferAfter
  )
  
  // Filter out exception times
  IF exception AND NOT exception.allDay:
    timeSlots = filterOutTimeRange(
      timeSlots,
      exception.startTime,
      exception.endTime
    )
  
  // Mark booked/locked slots
  FOR slot IN timeSlots:
    IF hasExistingSession(therapistId, date, slot.time):
      slot.status = 'booked'
    ELSE IF hasPendingBooking(therapistId, date, slot.time):
      slot.status = 'locked'
    ELSE IF violatesBufferTime(therapistId, date, slot.time):
      slot.status = 'unavailable'
    ELSE:
      slot.status = 'available'
  
  slots.push(...timeSlots)
RETURN slots

**Booking Confirmation:**
FUNCTION confirmBooking(bookingRequestId):
BEGIN TRANSACTION
bookingRequest = findById(bookingRequestId) FOR UPDATE
IF bookingRequest.status != 'payment_processing':
ROLLBACK
THROW 'Invalid status'
// Race condition check
conflicts = checkSlotAvailable(
bookingRequest.therapistId,
bookingRequest.requestedDate,
bookingRequest.requestedTime
)
IF conflicts.length > 0:
ROLLBACK
THROW 'Slot no longer available'
// Find or create patient
patient = findPatientByPhone(bookingRequest.patientPhone)
IF NOT patient:
patient = createPatient(bookingRequest)
// Create session
session = createSession({
therapistId: bookingRequest.therapistId,
patientId: patient.id,
scheduledAt: bookingRequest.requestedDate + bookingRequest.requestedTime,
durationMinutes: bookingRequest.durationMinutes,
amount: bookingRequest.priceAtBooking,
paymentStatus: 'paid'
})
// Create calendar event
calendarEvent = createGoogleCalendarEvent(session)
session.meetLink = calendarEvent.hangoutLink
saveSession(session)
// Update booking request
bookingRequest.status = 'confirmed'
bookingRequest.sessionId = session.id
bookingRequest.confirmedAt = NOW()
saveBookingRequest(bookingRequest)
COMMIT TRANSACTION
// Post-commit actions (async)
sendConfirmationNotifications(session, patient)
invalidateAvailabilityCache(therapistId, date)
RETURN session

### Appendix C: Environment Variables Reference
```bash
# Phase 3B Specific Variables

# Redis (new)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_TTL_AVAILABILITY=900 # 15 minutes
REDIS_TTL_PROFILE=3600 # 1 hour

# Public Portal
PUBLIC_PORTAL_BASE_URL=https://psicopay.com
PUBLIC_PORTAL_ENABLED=true

# Booking Configuration
BOOKING_EXPIRATION_MINUTES=60
BOOKING_SOFT_LOCK_MINUTES=10
MIN_ADVANCE_BOOKING_HOURS=2
MAX_ADVANCE_BOOKING_DAYS=60

# Recurring Sessions
RECURRING_GENERATION_ENABLED=true
RECURRING_ADVANCE_GENERATION_DAYS=7
RECURRING_DEFAULT_PAYMENT_REMINDER_DAYS=3

# Performance
AVAILABILITY_CACHE_ENABLED=true
DATABASE_CONNECTION_POOL_MIN=5
DATABASE_CONNECTION_POOL_MAX=20

# Existing Variables (from Phase 1-3A)
DATABASE_URL=postgresql://...
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
MP_ACCESS_TOKEN=...
TWILIO_ACCOUNT_SID=...
TWILIO_WHATSAPP_NUMBER=...
```

### Appendix D: API Endpoints Summary

**Public Endpoints (No Auth Required):**
GET    /api/public/therapists/:slug         - Get therapist profile
GET    /api/public/availability              - Get available slots
POST   /api/public/bookings                  - Create booking request
GET    /api/public/booking/:id               - Get booking status

**Protected Endpoints (Therapist Auth Required):**
Availability Management
GET    /api/availability/rules               - Get weekly schedule
POST   /api/availability/rules               - Create/update rules
DELETE /api/availability/rules/:id           - Delete rule
GET    /api/availability/exceptions          - Get exceptions
POST   /api/availability/exceptions          - Add exception
DELETE /api/availability/exceptions/:id      - Delete exception
GET    /api/availability/preview             - Preview as patient sees
Patient Management
GET    /api/patients                         - List patients
GET    /api/patients/:id                     - Get patient profile
PUT    /api/patients/:id                     - Update patient
POST   /api/patients/:id/notes               - Add note
PUT    /api/patients/:id/preferences         - Update preferences
Recurring Sessions
GET    /api/recurring/:patientId             - Get recurring configs
POST   /api/recurring                        - Create recurring config
PUT    /api/recurring/:id                    - Update recurring config
POST   /api/recurring/:id/pause              - Pause recurring
POST   /api/recurring/:id/resume             - Resume recurring
DELETE /api/recurring/:id                    - Stop recurring
Bookings (Therapist View)
GET    /api/bookings                         - List all bookings
POST   /api/bookings/:id/confirm             - Manual confirmation
POST   /api/bookings/:id/cancel              - Cancel booking

---

## Document Control

**Version:** 1.0  
**Last Updated:** January 28, 2026  
**Author:** Product & Engineering Team  
**Status:** Approved for Implementation  

**Change Log:**
- v1.0 (2026-01-28): Initial comprehensive specification for Phase 3B
