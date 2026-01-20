# Changelog

All notable changes to PsicoPay will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Nothing yet.

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

- **0.1.1** - Production deployment (Fly.io) and admin scripts
- **0.1.0** - Initial MVP release (Phase 1)
