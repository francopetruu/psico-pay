# Changelog

All notable changes to PsicoPay will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

---

## [0.3.0] - 2026-01-27

### Added

#### Multi-Tenant Architecture (Phase 3 Foundation)
- `therapists` table for multi-tenant support
- Tenant-aware queries throughout the application
- Each therapist has isolated data (patients, sessions, pricing)
- Professional profile management per therapist

#### Google OAuth Authentication
- Google OAuth provider integration with NextAuth.js
- Automatic therapist account creation on first login
- Secure session management with JWT tokens
- Support for both OAuth and email/password authentication

#### Professional Profile Management
- Therapist profile page at `/dashboard/profile`
- Editable professional information:
  - License number and specialty
  - Business name and tax ID (CUIT)
  - Business address
  - Professional bio
- Profile completion indicators

#### Dynamic Pricing System
- Three-tier pricing priority:
  1. Patient-specific pricing (highest priority)
  2. Session type pricing (medium priority)
  3. Default/base pricing (lowest priority)
- `sessionTypes` table for custom session categories
- `patientPricing` table for individual patient rates
- `priceHistory` table for audit trail of price changes
- `calculatePrice` API for automatic price resolution

#### Tarifas Module (PR #24)
- New dedicated `/dashboard/tarifas` page with tabbed interface
- **Precio Base Tab**: Default session price and duration configuration
- **Tipos de Sesion Tab**: Predefined session types with dropdown selection
- **Por Paciente Tab**: Patient-specific pricing management

#### Predefined Session Types
21 session types organized in 6 categories based on Argentina's psychology field:
- **Individual**: Adulto, Adolescente, Niño, Adulto Mayor
- **Pareja**: Terapia de Pareja, Orientacion Prematrimonial
- **Familia**: Terapia Familiar, Orientacion a Padres
- **Grupo**: Adultos, Adolescentes, Niños
- **Evaluacion**: Primera Consulta, Psicodiagnostico, Orientacion Vocacional, Evaluacion Neuropsicologica
- **Especial**: Sesion Online, Sesion a Domicilio, Interconsulta, Supervision Clinica, Informe Psicologico

Each type includes:
- Standardized name and description
- Default duration (varies by type: 45-90 minutes)
- Category grouping for easy selection

#### Patient Pricing Features
- List patients with special pricing and status badges
- Add/edit/remove patient-specific prices
- Optional validity dates (validFrom/validUntil)
- Reason field for pricing notes (e.g., "Descuento estudiante")
- Status indicators: Activo, Vence pronto, Expirado, Pendiente
- Price comparison with base price (percentage difference)

#### UI Components
- `ConfirmationDialog`: Reusable confirmation modal replacing browser `confirm()`
  - Supports destructive and default variants
  - Loading state during async operations
  - Customizable title, description, and button labels
- `AlertDialog`: Base component from Radix UI for accessible modals
- Updated sidebar with "Tarifas" navigation item (Receipt icon)

#### API Endpoints (pricing router)
- `listPatientPricing`: Get all patients with special pricing
- `getPatientPricing`: Get pricing for specific patient
- `setPatientPricing`: Create/update patient pricing
- `removePatientPricing`: Delete patient pricing
- `calculatePrice`: Calculate effective price for session

#### Database Migrations
- Schema drift check in CI to prevent missing migrations
- Seed data for development/testing
- Test user migration for QA

### Changed
- Moved pricing configuration from `/dashboard/settings/pricing` to `/dashboard/tarifas`
- Session types now use dropdown selection instead of free text input
- Sidebar navigation updated: added Tarifas, removed Settings link

### Fixed
- Dropdown positioning issue where content was cut off by browser bookmark bar
- Auth 500 error on Vercel deployment
- Orphaned data migration for existing records

### Technical Details
- **Session Types**: Stored in `lib/session-types.ts` with TypeScript types
- **Pricing Priority**: Implemented in `pricing.calculatePrice` tRPC procedure
- **Component Architecture**: Modular components in `tarifas/components/`
- **State Management**: React Query (TanStack Query) via tRPC

---

## [0.2.1] - 2026-01-21

### Added

#### CI/CD Pipeline
- GitHub Actions workflow for continuous integration
  - Lint job: ESLint across all packages
  - Type check job: TypeScript strict mode
  - Test job: Vitest unit tests
  - Build job: Full monorepo build (requires all checks to pass)
- Automatic checks on push to main and pull requests

#### Testing Infrastructure
- Vitest configuration for `@psico-pay/web`
- Vitest configuration for `@psico-pay/db`
- React Testing Library integration
- Test setup with Next.js and NextAuth mocks
- Sample tests for utilities and schema

#### Documentation
- Updated root README with CI/CD section
- Comprehensive README for `apps/web` module
- Comprehensive README for `packages/db` module
- Testing documentation

#### New Scripts
- `pnpm typecheck` - TypeScript type checking
- `pnpm test:coverage` - Tests with coverage report

### Changed
- Updated turbo.json with test and typecheck pipelines
- Added test dependencies to web and db packages

---

## [0.2.0] - 2026-01-20

### Added

#### Monorepo Structure
- pnpm workspaces + Turborepo configuration
- Shared `@psico-pay/db` package for database schemas
- Apps structure: `apps/api` (existing), `apps/web` (new)

#### Dashboard (Next.js 14)
- Full management dashboard for therapists
- Authentication with NextAuth.js v5 (email/password)
- Protected routes via middleware

#### Sessions Module
- List all sessions with filtering (status, payment, date)
- Session detail view with actions
- Mark sessions as paid, completed, or cancelled
- Add session notes

#### Patients Module
- Patient directory with search
- Create, edit, delete patients
- Patient profile with session history
- Contact information management

#### Payments Module
- Monthly payment statistics dashboard
- Payment history with filtering
- Collection rate metrics
- Manual payment registration

#### Reports Module
- Revenue trends (line chart)
- Payment status distribution (pie chart)
- Monthly revenue breakdown
- Top patients by revenue
- Export to CSV functionality

#### Database Schema Extensions
- `users` table for dashboard authentication
- `session_notes` table for session annotations
- `audit_log` table for change tracking
- Extended `sessions` table (status, cancellation fields)
- Extended `patients` table (notes, statistics)

#### Tech Stack Additions
- tRPC for type-safe API routes
- TanStack Query for data fetching
- shadcn/ui component library
- Recharts for analytics
- bcrypt for password hashing

### Fixed
- Package exports for @psico-pay/db CommonJS compatibility

---

## [0.1.1] - 2026-01-20

### Added

#### Deployment
- Docker configuration for containerized deployment
- Fly.io configuration (São Paulo region, always-on)
- Production deployment at https://psico-pay.fly.dev

#### Admin Scripts
- `scripts/reset-reminder.ts`: Reset reminder flags for re-sending
- `scripts/send-reminder-now.ts`: Manual reminder outside time window
- `scripts/send-new-payment-link.ts`: Regenerate payment links
- `scripts/confirm-payment-manually.ts`: Manual payment confirmation
- `scripts/README.md`: Script documentation

### Fixed
- TypeScript strict mode compilation errors (unused imports/params)

---

## [0.1.0] - 2025-01-18

### Added

#### Core Infrastructure
- Project foundation with TypeScript 5.3+ and Node.js 20+
- PostgreSQL database with Drizzle ORM
- Environment variable validation with Zod
- Pino structured logging

#### Database Schema
- `patients` table for patient contact information
- `sessions` table for therapy session tracking
- `payment_preferences` table for Mercado Pago links
- `notifications` table for audit logging
- Type-safe schema with relations and indexes

#### Services
- **CalendarService**: Google Calendar API integration
  - Fetch upcoming events (48h window)
  - Parse patient info from event title/description
  - Extract Google Meet links
- **PaymentService**: Mercado Pago integration
  - Create payment preferences with 24h expiration
  - Verify payment status via API
  - Webhook support
- **NotificationService**: Twilio WhatsApp integration
  - Payment reminder templates
  - Payment confirmation
  - Meet link delivery
  - Late/courtesy reminders

#### Repository Layer
- PatientRepository with find/create operations
- SessionRepository with time-based queries
- PaymentPreferenceRepository with expiration handling
- NotificationRepository with audit logging

#### Cron Job
- SessionMonitorJob running hourly
  - Sync calendar events with database
  - Send 24h payment reminders
  - Send 2h reminders (paid/pending)
  - Deliver Meet links to paid sessions
- Scheduler with node-cron
  - Argentina timezone support
  - Concurrency protection

#### HTTP Server
- Express server for webhooks
- Mercado Pago webhook handler (async processing)
- Payment redirect pages (success/failure/pending)
- Health check endpoint

#### Documentation
- Comprehensive README with setup instructions
- Module-level README files
- Branching strategy documentation
- Environment variable template

### Technical Details

- **Architecture**: Layered (Routes → Services → Repositories → Database)
- **Patterns**: Repository pattern, Dependency Injection, Factory functions
- **Error Handling**: Try-catch with structured logging, graceful degradation
- **Idempotency**: Notification flags prevent duplicate sends

---

## Version History

- **0.3.0** - Phase 3: Multi-tenant architecture, dynamic pricing, Tarifas module
- **0.2.1** - CI/CD pipeline, testing infrastructure, documentation
- **0.2.0** - Phase 2: Dashboard & Management System
- **0.1.1** - Production deployment (Fly.io) and admin scripts
- **0.1.0** - Initial MVP release (Phase 1)
