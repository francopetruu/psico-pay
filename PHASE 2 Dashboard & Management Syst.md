PHASE 2: Dashboard & Management System
Overview
Build a web-based dashboard for the psychologist to manage patients, sessions, and payments with manual intervention capabilities.

1. Goals & Objectives
Primary Goals

Provide visibility into all sessions and payments
Enable manual intervention for edge cases
Allow patient management (CRUD operations)
Generate reports and analytics
Handle exceptions (refunds, cancellations, manual payments)

Success Criteria

Psychologist can view all upcoming sessions in one place
Manual payment marking works correctly
Session cancellations update calendar and notify patients
Reports export correctly (PDF/CSV)
Dashboard loads in < 2 seconds


2. Architecture & Design
2.1 System Architecture
┌─────────────────────────────────────────────┐
│         Frontend (Next.js)                  │
│  ┌──────────────────────────────────────┐   │
│  │  Dashboard Pages                     │   │
│  │  - Sessions List                     │   │
│  │  - Patient Management                │   │
│  │  - Payment History                   │   │
│  │  - Reports & Analytics               │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│                 │ tRPC / REST API            │
│                 ▼                            │
└─────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│      Backend API (Express + tRPC)           │
│  ┌──────────────────────────────────────┐   │
│  │  API Routes                          │   │
│  │  - /api/sessions                     │   │
│  │  - /api/patients                     │   │
│  │  - /api/payments                     │   │
│  │  - /api/reports                      │   │
│  └──────────────┬───────────────────────┘   │
└─────────────────┼───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│      Existing MVP Services                  │
│  (Calendar, Payment, Notification, DB)      │
└─────────────────────────────────────────────┘
2.2 Technology Stack
Frontend:

Next.js 14+ (App Router)
TypeScript
Tailwind CSS for styling
shadcn/ui component library
TanStack Query (React Query) for data fetching
Zod for validation
Recharts for analytics visualization

Backend Extensions:

tRPC for type-safe API
Express middleware for REST endpoints
JWT authentication
Rate limiting
CORS configuration

Authentication:

NextAuth.js with JWT strategy
Password hashing with bcrypt
Session management
Role-based access (future: admin vs viewer)


3. Design Patterns & Principles
3.1 Frontend Patterns
Server Components First:

Use React Server Components by default
Client components only when needed (interactivity, hooks)
Streaming for data-heavy pages

Data Fetching Strategy:

Server-side data fetching for initial render
Client-side mutations with optimistic updates
Automatic cache invalidation on mutations

Component Architecture:
app/
├── (auth)/              # Auth pages (login)
├── (dashboard)/         # Protected dashboard pages
│   ├── sessions/
│   ├── patients/
│   ├── payments/
│   └── reports/
├── api/                 # API routes
└── components/
    ├── ui/              # shadcn/ui components
    ├── sessions/        # Session-specific components
    ├── patients/        # Patient-specific components
    └── shared/          # Shared components
State Management:

Server state: TanStack Query
URL state: Next.js searchParams
Form state: React Hook Form + Zod
UI state: React useState (minimal)

3.2 Backend Patterns
API Design:

RESTful endpoints for CRUD operations
tRPC procedures for type-safe operations
Consistent error responses
Pagination for list endpoints
Filtering and sorting support

Service Layer Pattern:
Controller → Service → Repository → Database
Repository Pattern:

Abstract database operations
Reuse existing MVP repositories
Add new methods for dashboard needs


4. Key Features & Workflows
4.1 Session Management
View Sessions:

List view with filters (date range, payment status, patient)
Calendar view (month/week/day)
Search by patient name or session ID
Sort by date, payment status, created date

Session Details:

Patient information
Payment status and history
Notification history (what was sent, when, status)
Google Calendar link
Google Meet link

Manual Actions:

Mark payment as received (manual confirmation)
Cancel session (with patient notification)
Reschedule session (updates calendar + notifications)
Add notes to session

Workflow: Cancel Session
1. User clicks "Cancel Session"
2. Confirmation modal appears
3. User selects reason and notification preference
4. System:
   - Updates session status to 'cancelled'
   - Cancels Google Calendar event
   - Sends WhatsApp notification to patient
   - Processes refund if payment received
   - Logs all actions
5. Dashboard updates optimistically
4.2 Patient Management
Patient List:

Searchable and filterable
Shows: Name, phone, email, total sessions, last session
Quick actions: View, Edit, Delete

Patient Profile:

Contact information
Session history
Payment history
Total revenue from patient
Notes field
Trust level indicator (for Phase 3)

Patient CRUD:

Create: Form with validation
Read: Profile page with all details
Update: Edit form (same as create)
Delete: Soft delete with confirmation

Workflow: Add New Patient
1. Click "Add Patient"
2. Fill form:
   - Name (required)
   - Phone (required, E.164 format)
   - Email (optional)
   - Notes (optional)
3. Validate phone format
4. Check for duplicates
5. Save to database
6. Redirect to patient profile
4.3 Payment Management
Payment Dashboard:

Summary cards: Total revenue, pending payments, refunds
Recent payments list
Filter by date range, status, patient
Export to CSV

Payment Details:

Mercado Pago payment ID
Amount and currency
Status and status detail
Transaction date
Associated session
Refund capability

Manual Payment Recording:

For cash/transfer payments outside Mercado Pago
Requires: Amount, payment method, date, notes
Updates session status
Sends confirmation to patient

Workflow: Process Refund
1. Navigate to payment details
2. Click "Refund Payment"
3. Enter refund reason
4. System:
   - Calls Mercado Pago refund API
   - Updates payment status to 'refunded'
   - Updates session status to 'cancelled'
   - Logs refund in notifications table
   - Sends notification to patient
5. Dashboard reflects changes
4.4 Reports & Analytics
Available Reports:

Revenue Report (daily/weekly/monthly)
Session Attendance Report
Payment Status Report
Patient Activity Report
No-Show Analysis

Report Features:

Date range selection
Export formats: PDF, CSV, Excel
Email delivery option
Scheduled reports (future)

Analytics Dashboard:

Revenue trend chart (line chart)
Payment status breakdown (pie chart)
Sessions per day (bar chart)
Top patients by revenue (table)
Conversion rate: Scheduled → Paid → Completed


5. Data Models & Extensions
5.1 New Database Tables
users table (for dashboard authentication):
sqlCREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW()
);
session_notes table:
sqlCREATE TABLE session_notes (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  note TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
audit_log table:
sqlCREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL, -- 'session', 'patient', 'payment'
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'cancel'
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
5.2 Extended Existing Tables
sessions table additions:
sqlALTER TABLE sessions ADD COLUMN status VARCHAR(50) DEFAULT 'scheduled';
ALTER TABLE sessions ADD COLUMN cancellation_reason TEXT;
ALTER TABLE sessions ADD COLUMN cancelled_at TIMESTAMP;
ALTER TABLE sessions ADD COLUMN cancelled_by UUID REFERENCES users(id);
patients table additions:
sqlALTER TABLE patients ADD COLUMN notes TEXT;
ALTER TABLE patients ADD COLUMN last_session_at TIMESTAMP;
ALTER TABLE patients ADD COLUMN total_sessions INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN total_revenue DECIMAL(10,2) DEFAULT 0;
```

---

## 6. API Endpoints Specification

### 6.1 REST API Endpoints

**Authentication:**
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
```

**Sessions:**
```
GET    /api/sessions              # List with filters
GET    /api/sessions/:id          # Get details
POST   /api/sessions              # Create (manual)
PATCH  /api/sessions/:id          # Update
DELETE /api/sessions/:id          # Cancel
POST   /api/sessions/:id/mark-paid    # Manual payment
POST   /api/sessions/:id/reschedule   # Reschedule
```

**Patients:**
```
GET    /api/patients              # List with search
GET    /api/patients/:id          # Get profile
POST   /api/patients              # Create
PUT    /api/patients/:id          # Update
DELETE /api/patients/:id          # Soft delete
GET    /api/patients/:id/sessions # Patient session history
```

**Payments:**
```
GET    /api/payments              # List with filters
GET    /api/payments/:id          # Get details
POST   /api/payments/manual       # Record manual payment
POST   /api/payments/:id/refund   # Process refund
```

**Reports:**
```
GET    /api/reports/revenue?from=X&to=Y
GET    /api/reports/sessions?from=X&to=Y
GET    /api/reports/payments?from=X&to=Y
POST   /api/reports/export        # Generate export file
6.2 tRPC Procedures (Type-Safe Alternative)
typescript// Example tRPC router structure
export const appRouter = router({
  sessions: router({
    list: procedure.input(z.object({...})).query(),
    get: procedure.input(z.string()).query(),
    create: procedure.input(sessionSchema).mutation(),
    update: procedure.input(updateSchema).mutation(),
    cancel: procedure.input(cancelSchema).mutation(),
  }),
  patients: router({...}),
  payments: router({...}),
  reports: router({...}),
});
```

---

## 7. Security & Authorization

### 7.1 Authentication Flow
```
1. User enters email/password
2. Backend validates credentials
3. Generate JWT token (expires in 24h)
4. Return token + refresh token
5. Frontend stores in httpOnly cookie
6. All requests include token in header
7. Backend validates token on each request
7.2 Authorization Rules
Role: Admin (Psychologist)

Full access to all features
Can create, read, update, delete all resources
Can process refunds
Can view all reports

Role: Viewer (Future)

Read-only access
Cannot modify data
Can view reports
Cannot process payments/refunds

7.3 Security Best Practices
Password Requirements:

Minimum 12 characters
Must include: uppercase, lowercase, number, special char
Hashed with bcrypt (cost factor: 12)

Session Management:

JWT stored in httpOnly cookie
Refresh token rotation
Session expiration: 24 hours
Logout clears all tokens

API Security:

Rate limiting: 100 requests/minute per IP
CORS: Whitelist dashboard domain only
Input validation on all endpoints
SQL injection prevention (parameterized queries)
XSS prevention (sanitize inputs)


8. UI/UX Guidelines
8.1 Design Principles
Simplicity:

Clean, uncluttered interface
Clear visual hierarchy
Obvious call-to-action buttons

Efficiency:

Minimal clicks to complete tasks
Keyboard shortcuts for common actions
Bulk actions where appropriate

Feedback:

Loading states for all async operations
Success/error toasts for actions
Optimistic updates with rollback on error

8.2 Component Library
Use shadcn/ui components:

Button, Input, Select, Checkbox, etc.
Dialog, Alert, Toast
Table with sorting and pagination
Calendar component
Charts (via Recharts)

Custom Components:

SessionCard
PatientCard
PaymentStatusBadge
NotificationTimeline
RevenueChart

8.3 Responsive Design
Breakpoints:

Mobile: < 640px
Tablet: 640px - 1024px
Desktop: > 1024px

Mobile Considerations:

Simplified navigation (hamburger menu)
Stack cards vertically
Hide non-essential columns in tables
Touch-friendly button sizes (min 44x44px)

8.4 Color Scheme
Primary Colors:

Primary: Blue (#3B82F6) - Actions, links
Success: Green (#10B981) - Paid, completed
Warning: Yellow (#F59E0B) - Pending
Danger: Red (#EF4444) - Cancelled, failed
Neutral: Gray (#6B7280) - Text, borders

Semantic Colors:

Payment pending: Yellow
Payment confirmed: Green
Session cancelled: Red
Session completed: Blue


9. Performance Optimization
9.1 Frontend Optimization
Code Splitting:

Route-based splitting (automatic with Next.js)
Component lazy loading for modals
Dynamic imports for charts

Image Optimization:

Use Next.js Image component
Lazy load images below the fold
Serve WebP format

Caching Strategy:

Static pages: Cache indefinitely
API responses: Stale-while-revalidate
User data: Cache for 5 minutes

9.2 Backend Optimization
Database:

Index all foreign keys
Composite indexes for common queries
Connection pooling (max 10 connections)

API Response Time:

Target: < 200ms for list endpoints
Target: < 100ms for detail endpoints
Pagination: Max 50 items per page

Caching:

Redis for session data (future)
Memoize expensive calculations
Cache static reports for 1 hour


10. Testing Strategy
10.1 Frontend Testing
Unit Tests:

Component rendering
User interactions (click, input)
Form validation
Utility functions

Integration Tests:

API integration
Form submissions
Navigation flows
Authentication flow

Tools:

Vitest for unit tests
React Testing Library
MSW (Mock Service Worker) for API mocking

10.2 Backend Testing
Unit Tests:

Service layer logic
Validation schemas
Utility functions

Integration Tests:

API endpoints
Database operations
Authentication middleware

E2E Tests:

Critical user flows
Payment processing
Session cancellation

Tools:

Vitest for unit/integration
Playwright for E2E

10.3 Manual Testing Checklist

 Login/logout flow
 Create patient
 Schedule session
 Mark payment as received
 Cancel session
 Generate report
 Mobile responsiveness
 Error handling (network failure, validation)


11. Deployment Considerations
11.1 Environment Variables
env# Frontend (.env.local)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://dashboard.yourdomain.com

# Backend (existing .env + additions)
DASHBOARD_CORS_ORIGIN=https://dashboard.yourdomain.com
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
```

### 11.2 Deployment Architecture

**Option 1: Monorepo**
```
Vercel (Frontend + Backend API Routes)
└── Connected to PostgreSQL
```

**Option 2: Separate Deployments**
```
Vercel (Frontend)
└── Calls ──> Railway/Render (Backend API)
              └── Connected to PostgreSQL
```

### 11.3 CI/CD Pipeline

**GitHub Actions Workflow:**
```
1. On push to main:
   - Run tests
   - Run linter
   - Build frontend
   - Build backend
   - Deploy to staging
2. On manual trigger:
   - Deploy to production

12. Migration from MVP
12.1 Migration Steps

Database Migration:

Run new table migrations
Add columns to existing tables
No data loss (additive changes only)


Backend Extension:

Add new API routes alongside existing webhook
Existing MVP cron job continues running
New dashboard queries read from same DB


Authentication Setup:

Create initial admin user
Configure JWT secrets
Set up CORS for dashboard


Frontend Deployment:

Deploy Next.js dashboard
Configure environment variables
Test authentication


Testing:

Verify MVP still works (cron job, webhooks)
Test dashboard functionality
End-to-end testing



12.2 Rollback Plan
If dashboard causes issues:

Frontend can be taken offline without affecting MVP
Backend API routes don't interfere with webhooks
Cron job continues independently
Database changes are backward compatible


13. Success Metrics
13.1 Technical Metrics

Dashboard load time: < 2 seconds
API response time: < 200ms (p95)
Uptime: 99.5%+
Zero data loss

13.2 User Metrics

Time to view session details: < 30 seconds
Time to cancel session: < 1 minute
Time to mark payment as received: < 30 seconds
User satisfaction: Positive feedback from psychologist

13.3 Business Metrics

Reduction in manual payment follow-ups: 80%+
Session cancellation process time: 50% reduction
Payment reconciliation time: 70% reduction


14. Future Enhancements (Phase 2.5)
Multi-user Support:

Multiple psychologists using same system
Each psychologist sees only their data
Shared patient database (optional)

Advanced Scheduling:

Recurring sessions (weekly therapy)
Waitlist management
Automated rescheduling suggestions

Patient Portal:

Patients can view their upcoming sessions
Request cancellations/reschedules
View payment history

Notification Templates:

Customizable WhatsApp message templates
A/B testing for message effectiveness
Multi-language support


15. Documentation Requirements
15.1 User Documentation
Create these guides:

Getting started guide
How to cancel a session
How to process a refund
How to generate reports
FAQ section

15.2 Technical Documentation
Developer documentation:

API reference (auto-generated from tRPC/OpenAPI)
Database schema diagram
Architecture decision records (ADRs)
Deployment guide

15.3 Training Materials
For the psychologist:

Video walkthrough of dashboard
Quick reference card (PDF)
Troubleshooting guide
Contact info for support


Phase 2 Document Version: 1.0
Status: Ready for implementation after Phase 1 MVP completion