PHASE 1: MVP - Psychology Session Manager
Overview
Automated payment collection system for remote therapy sessions that requires payment BEFORE sessions and eliminates manual follow-ups.

1. Problem Statement & Goals
The Problem

Current State: Patients pay AFTER sessions are completed
Pain Points:

High percentage of late payments or non-payments
Cash flow problems for psychologist
Time-consuming manual payment follow-ups
No automated way to ensure payment before sessions



Solution Goals

Require payment BEFORE the session
Automatically send payment links 24 hours before scheduled sessions
Send Google Meet links only AFTER payment confirmation
Eliminate manual payment follow-ups
Integrate seamlessly with existing workflow (Google Calendar)

Success Criteria

✅ Zero sessions without prior payment
✅ Automated workflow requiring no manual intervention
✅ Patient-friendly communication via WhatsApp
✅ Complete payment tracking and history
✅ Reliable delivery of meeting links


2. System Architecture
2.1 High-Level Architecture
┌─────────────────────────────────────────────────────────┐
│                  External Triggers                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Cron Job     │  │  Mercado Pago│  │ Google       │  │
│  │ (Hourly)     │  │  Webhook     │  │ Calendar API │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────┐
│              Service Layer (Business Logic)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Session      │  │ Payment      │  │ Notification │  │
│  │ Monitor      │  │ Service      │  │ Service      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│  ┌──────┴──────────────────┴──────────────────┴──────┐  │
│  │           Calendar Service (Google API)           │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│            Integration Layer (External APIs)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Google       │  │ Mercado Pago │  │ Twilio       │  │
│  │ Calendar     │  │ API          │  │ WhatsApp     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│         Data Access Layer (Repository Pattern)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Patient      │  │ Session      │  │ Notification │  │
│  │ Repository   │  │ Repository   │  │ Repository   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                PostgreSQL Database                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ patients     │  │ sessions     │  │ notifications│  │
│  │              │  │              │  │              │  │
│  │ payment_     │  │              │  │              │  │
│  │ preferences  │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
2.2 Component Responsibilities
Cron Job (Session Monitor):

Runs every hour
Fetches upcoming events from Google Calendar
Identifies therapy sessions
Determines which notifications to send based on time windows
Orchestrates payment reminder and meeting link delivery

Service Layer:

Calendar Service: Interacts with Google Calendar API
Payment Service: Creates payment links, verifies payment status
Notification Service: Sends WhatsApp messages via Twilio
Session Service: Business logic for session management

Integration Layer:

Google Calendar API: Read calendar events, extract meeting details
Mercado Pago API: Payment processing, webhook notifications
Twilio WhatsApp API: Message delivery

Data Access Layer:

Repositories: Abstract database operations
ORM (Drizzle): Type-safe database queries

Database:

PostgreSQL: Persistent storage for all data


3. Technology Stack
3.1 Core Technologies
Runtime & Language:

Node.js 20+: JavaScript runtime
TypeScript 5.3+: Type safety and better developer experience
Reason: Excellent async support, rich ecosystem, type safety

Web Framework:

Express 4.18+: HTTP server for webhooks
Reason: Lightweight, widely used, simple for webhook endpoints

Database:

PostgreSQL 15+: Relational database
Reason: ACID compliance, excellent for transactional data, mature

ORM:

Drizzle ORM 0.29+: Database queries
Reason: Type-safe, lightweight, excellent TypeScript integration

Validation:

Zod 3.22+: Schema validation
Reason: TypeScript-first, excellent error messages, composable

Scheduler:

node-cron 3.0+: Cron job scheduling
Reason: Simple, reliable, no external dependencies

Logging:

Pino 8.17+: Structured logging
Reason: Fast, low overhead, JSON output for log aggregation

Testing:

Vitest 1.1+: Test framework
Reason: Fast, Vite-powered, excellent TypeScript support

3.2 External Service SDKs
Google Calendar:

googleapis: Official Google API client
Authentication: OAuth2 with refresh token

Mercado Pago:

mercadopago SDK 2.0+: Payment processing
Features: Payment preferences, webhook handling, payment verification

WhatsApp Messaging:

Twilio 4.20+: WhatsApp Business API
Alternative: @green-api/whatsapp-api-client (more economical)

Date Handling:

date-fns 3.0+: Date manipulation and formatting
Reason: Lightweight, immutable, tree-shakeable

3.3 Stack Justification
Why Node.js + TypeScript?

Async-first architecture ideal for I/O-heavy operations (API calls)
Single language for entire stack (potential future web dashboard)
Rich ecosystem for integrations
Type safety prevents runtime errors

Why PostgreSQL?

ACID transactions critical for payment processing
Excellent query performance with proper indexing
JSON support for flexible data (notification logs)
Mature, reliable, well-documented

Why Express over alternatives?

Simple and focused (we only need webhooks in MVP)
Extensive middleware ecosystem
Easy to extend in Phase 2 for dashboard API

Why Drizzle over Prisma/TypeORM?

Lighter weight
Better TypeScript inference
SQL-like syntax (easier migration)
No schema drift issues


4. Design Patterns & Principles
4.1 Architectural Patterns
Layered Architecture:
Presentation Layer (Express routes, webhooks)
       ↓
Business Logic Layer (Services)
       ↓
Data Access Layer (Repositories)
       ↓
Database (PostgreSQL)
Benefits:

Separation of concerns
Testability (mock layers independently)
Maintainability (changes isolated to layers)
Scalability (can extract services later)

4.2 Service Layer Pattern
Structure:
SessionMonitorJob
    ↓
  uses ↓
CalendarService, PaymentService, NotificationService
    ↓
  uses ↓
Repositories (PatientRepo, SessionRepo, NotificationRepo)
    ↓
  uses ↓
Database
Principles:

Each service has single responsibility
Services are stateless (no instance variables)
Services coordinate between repositories and external APIs
Business logic stays in services, not repositories

4.3 Repository Pattern
Purpose:

Abstract database operations
Provide clean interface for data access
Enable easy testing with mocks
Centralize query logic

Methods Pattern:
Repository Interface:
- findById(id)
- findByX(criteria)
- create(data)
- update(id, data)
- delete(id)
- list(filters, pagination)
4.4 Error Handling Strategy
Three-Tier Error Handling:

External API Errors:

Always wrap in try-catch
Log with full context
Throw custom error types
Implement retry logic for transient failures


Business Logic Errors:

Validate inputs with Zod
Throw descriptive errors
Never crash the application


Cron Job Errors:

Catch all errors in job execution
Log and continue (don't crash)
Process remaining sessions even if one fails



Error Logging Pattern:
try {
  // operation
} catch (error) {
  logger.error('Operation failed', {
    operation: 'operationName',
    context: { id, data },
    error: error instanceof Error ? error.message : 'Unknown',
    stack: error instanceof Error ? error.stack : undefined
  });
  // decide: throw, return null, or continue
}
4.5 Dependency Injection
Constructor Injection:
Service receives dependencies via constructor
- Enables testing with mocks
- Makes dependencies explicit
- Facilitates composition
Example Structure:
class SessionMonitorJob {
  constructor(
    calendarService,
    paymentService,
    notificationService,
    repositories
  )
}

5. Data Model
5.1 Entity Relationship Diagram
┌─────────────────┐         ┌──────────────────┐
│    patients     │         │    sessions      │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │◄────────│ id (PK)          │
│ name            │  1:N    │ patient_id (FK)  │
│ phone           │         │ calendar_event_id│
│ email           │         │ scheduled_at     │
│ trusted         │         │ duration_minutes │
│ created_at      │         │ amount           │
│ updated_at      │         │ payment_status   │
└─────────────────┘         │ payment_id       │
                            │ meet_link        │
                            │ reminder_24h_sent│
                            │ reminder_2h_sent │
                            │ meet_link_sent   │
                            │ created_at       │
                            │ updated_at       │
                            └────────┬─────────┘
                                     │ 1:1
                            ┌────────▼─────────┐
                            │ payment_         │
                            │ preferences      │
                            ├──────────────────┤
                            │ id (PK)          │
                            │ session_id (FK)  │
                            │ mp_preference_id │
                            │ payment_link     │
                            │ expires_at       │
                            │ created_at       │
                            └──────────────────┘
                                     
┌──────────────────┐         ┌──────────────────┐
│  notifications   │         │    sessions      │
├──────────────────┤         ├──────────────────┤
│ id (PK)          │         │ id (PK)          │
│ session_id (FK)  │◄────────│ ...              │
│ type             │  N:1    │                  │
│ channel          │         │                  │
│ status           │         │                  │
│ sent_at          │         │                  │
│ error_message    │         │                  │
│ created_at       │         │                  │
└──────────────────┘         └──────────────────┘
5.2 Table Specifications
patients table:
Purpose: Store patient contact information

Columns:
- id: UUID (primary key)
- name: VARCHAR(255) - Patient full name
- phone: VARCHAR(20) - E.164 format (+54911XXXXXXXX)
- email: VARCHAR(255) - Optional
- trusted: BOOLEAN - For future Phase 2 (deferred payments)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Constraints:
- phone UNIQUE (one account per phone)
- phone format validation (E.164)

Indexes:
- PRIMARY KEY (id)
- UNIQUE INDEX (phone)
- INDEX (name) for search
sessions table:
Purpose: Track therapy sessions, payments, and notifications

Columns:
- id: UUID (primary key)
- patient_id: UUID (foreign key → patients.id)
- calendar_event_id: VARCHAR(255) - Google Calendar event ID
- scheduled_at: TIMESTAMP - Session date/time
- duration_minutes: INTEGER - Typically 50
- amount: DECIMAL(10,2) - Price in ARS
- payment_status: ENUM - 'pending', 'paid', 'failed', 'refunded'
- payment_id: VARCHAR(255) - Mercado Pago payment ID
- meet_link: TEXT - Google Meet URL
- reminder_24h_sent: BOOLEAN - Prevents duplicate 24h reminders
- reminder_2h_sent: BOOLEAN - Prevents duplicate 2h reminders
- meet_link_sent: BOOLEAN - Prevents duplicate Meet link sends
- created_at: TIMESTAMP
- updated_at: TIMESTAMP

Constraints:
- calendar_event_id UNIQUE (one session per calendar event)
- amount > 0
- duration_minutes > 0
- scheduled_at must be in future (at creation)
- ON DELETE CASCADE (if patient deleted, delete sessions)

Indexes:
- PRIMARY KEY (id)
- UNIQUE INDEX (calendar_event_id)
- INDEX (patient_id)
- INDEX (scheduled_at) - Critical for cron job queries
- INDEX (payment_status) - For filtering paid/pending sessions
payment_preferences table:
Purpose: Store Mercado Pago payment links and metadata

Columns:
- id: UUID (primary key)
- session_id: UUID (foreign key → sessions.id)
- mp_preference_id: VARCHAR(255) - Mercado Pago preference ID
- payment_link: TEXT - Checkout URL sent to patient
- expires_at: TIMESTAMP - Link expiration (24h from creation)
- created_at: TIMESTAMP

Constraints:
- mp_preference_id UNIQUE
- expires_at > created_at
- ON DELETE CASCADE (if session deleted, delete preference)

Indexes:
- PRIMARY KEY (id)
- UNIQUE INDEX (mp_preference_id)
- INDEX (session_id)
notifications table:
Purpose: Audit log of all notifications sent

Columns:
- id: UUID (primary key)
- session_id: UUID (foreign key → sessions.id)
- type: ENUM - 'reminder_24h', 'reminder_2h', 'meet_link', 'payment_confirmed'
- channel: ENUM - 'whatsapp', 'email', 'sms'
- status: ENUM - 'pending', 'sent', 'failed'
- sent_at: TIMESTAMP - When successfully sent
- error_message: TEXT - Error details if failed
- created_at: TIMESTAMP

Constraints:
- ON DELETE CASCADE (if session deleted, delete notifications)

Indexes:
- PRIMARY KEY (id)
- INDEX (session_id)
- INDEX (status) - For querying failed notifications
- INDEX (created_at) - For audit queries
5.3 Data Integrity Rules
Referential Integrity:

All foreign keys use CASCADE DELETE
No orphaned records allowed
Use database constraints, not application logic

Data Validation:

Phone numbers: E.164 format validation at DB level
Amounts: Must be positive
Dates: Future-dated sessions only at creation
Payment status: Only valid enum values

Idempotency:

calendar_event_id ensures no duplicate sessions
mp_preference_id ensures no duplicate payments
Notification flags prevent duplicate sends


6. Core Workflows & Operational Flows
6.1 Main System Flow (End-to-End)
┌────────────────────────────────────────────────────────────┐
│ 1. Psychologist creates calendar event                     │
│    - Title: "Sesión - [Patient Name]"                      │
│    - Time: 24+ hours in future                             │
│    - Google Meet auto-generated                            │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 2. Cron job runs (hourly)                                  │
│    - Fetches events from next 48 hours                     │
│    - Finds new therapy sessions                            │
│    - Creates session record in database                    │
│    - Creates patient record if new                         │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 3. 24 hours before session                                 │
│    - Cron job detects time window (1440-1380 min)          │
│    - Generates Mercado Pago payment link                   │
│    - Sends WhatsApp with payment link                      │
│    - Updates reminder_24h_sent = true                      │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 4. Patient pays                                            │
│    - Clicks Mercado Pago link                              │
│    - Completes payment                                     │
│    - Mercado Pago sends webhook to our server              │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 5. Webhook processing                                      │
│    - Responds 200 OK immediately                           │
│    - Verifies payment status = 'approved'                  │
│    - Updates session.payment_status = 'paid'               │
│    - Sends WhatsApp confirmation to patient                │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 6. 15 minutes before session                               │
│    - Cron job detects time window (15-0 min)               │
│    - Verifies payment_status = 'paid'                      │
│    - Sends WhatsApp with Google Meet link                  │
│    - Updates meet_link_sent = true                         │
└────────────────┬───────────────────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────────────────┐
│ 7. Session occurs                                          │
│    - Patient joins Google Meet                             │
│    - Therapy session completes                             │
└────────────────────────────────────────────────────────────┘
6.2 Cron Job Workflow (Session Monitor)
EVERY HOUR:
┌─────────────────────────────────────────┐
│ Session Monitor Job Starts             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Fetch Google Calendar Events            │
│ - Time range: now → 48 hours ahead      │
│ - Calendar ID: psychologist's primary   │
│ - Single events only (expand recurring) │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Filter for Therapy Sessions             │
│ - Title contains "Sesión"               │
│ - Has Google Meet link                  │
│ - Duration between 30-90 minutes        │
└──────────────┬───────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ For Each Event│
       └───────┬───────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Extract Event Data                       │
│ - Patient name (from title)             │
│ - Patient phone (from description)      │
│ - Session time                          │
│ - Google Meet link                      │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Find or Create Patient                  │
│ - Search by name or phone               │
│ - If not found, create new              │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Find or Create Session                  │
│ - Search by calendar_event_id           │
│ - If not found, create with:            │
│   * patient_id                          │
│   * scheduled_at                        │
│   * meet_link                           │
│   * amount (from env var)               │
│   * payment_status = 'pending'          │
│   * all flags = false                   │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Calculate Time Until Session            │
│ - minutesUntilSession = diff(now, time) │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Decision: Which Notification?           │
└──────────────┬───────────────────────────┘
               │
       ┌───────┼───────┬───────┐
       │       │       │       │
       ▼       ▼       ▼       ▼
    24h?    2h?    15min?   None
       │       │       │       │
       ▼       ▼       ▼       ▼
    Send    Send    Send    Skip
   Payment  Remind   Meet
    Link            Link
       │       │       │
       └───────┴───────┴────────┐
                                │
                                ▼
                    ┌────────────────────┐
                    │ Update Flags       │
                    │ Log Notification   │
                    └────────────────────┘
6.3 Payment Reminder Flow (24h Before)
CONDITIONS:
- minutesUntilSession <= 1440 (24 hours)
- minutesUntilSession > 1380 (23 hours)
- reminder_24h_sent = false

┌─────────────────────────────────────────┐
│ Payment Reminder Triggered              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Create Mercado Pago Payment Preference  │
│ Input:                                   │
│ - session_id (as external_reference)    │
│ - patient_name                          │
│ - amount                                │
│                                         │
│ Returns:                                │
│ - preference_id                         │
│ - payment_link (init_point)             │
│                                         │
│ Configuration:                          │
│ - Currency: ARS                         │
│ - Expiration: 24 hours                  │
│ - Webhook URL: /webhook/mercadopago     │
│ - Success URL: /payment/success         │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Save Payment Preference to Database     │
│ - payment_preferences table             │
│ - Links preference to session           │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Build WhatsApp Message                  │
│ Template:                               │
│ "Hola [Name]! 👋                        │
│                                         │
│ Tienes sesión programada para el       │
│ [formatted date/time].                  │
│                                         │
│ Para confirmar tu asistencia, completa │
│ el pago en el siguiente enlace:        │
│ [payment_link]                          │
│                                         │
│ Una vez confirmado el pago, recibirás  │
│ el link de videollamada 15 minutos     │
│ antes. ¡Gracias! 🙂"                    │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Send WhatsApp via Twilio                │
│ - To: patient.phone                     │
│ - From: TWILIO_WHATSAPP_NUMBER          │
│ - Body: formatted message               │
│                                         │
│ Returns:                                │
│ - message_sid (Twilio tracking ID)      │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Log Notification                        │
│ - Type: reminder_24h                    │
│ - Channel: whatsapp                     │
│ - Status: sent                          │
│ - sent_at: now                          │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Update Session                          │
│ - reminder_24h_sent = true              │
└──────────────────────────────────────────┘

ERROR HANDLING:
┌──────────────────────────────────────────┐
│ If Mercado Pago Fails:                  │
│ - Log error with session context        │
│ - DO NOT update reminder_24h_sent       │
│ - Will retry next hour                  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ If WhatsApp Send Fails:                 │
│ - Log error with patient/session info   │
│ - Save notification with status='failed'│
│ - Update reminder_24h_sent = true       │
│   (prevent infinite retries)            │
│ - Manual review needed                  │
└──────────────────────────────────────────┘
6.4 Webhook Flow (Payment Confirmation)
┌─────────────────────────────────────────┐
│ Mercado Pago Sends Webhook             │
│ POST /webhook/mercadopago               │
│                                         │
│ Headers:                                │
│ - Content-Type: application/json       │
│ - X-Signature: [hash] (validate this!) │
│                                         │
│ Body:                                   │
│ {                                       │
│   "action": "payment.created",          │
│   "type": "payment",                    │
│   "data": { "id": "123456789" }         │
│ }                                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ CRITICAL: Respond 200 OK Immediately    │
│ - Must respond within 5 seconds         │
│ - Mercado Pago retries if not 200       │
│ - Process webhook asynchronously        │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Async Processing Begins                 │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Validate Webhook Type                   │
│ - If type !== 'payment': ignore         │
└──────────────┬───────────────────────────┘
               │ type = 'payment'
               ▼
┌──────────────────────────────────────────┐
│ Extract Payment ID                      │
│ - payment_id = data.id                  │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Fetch Payment Details from Mercado Pago │
│ API Call: GET /v1/payments/{id}         │
│                                         │
│ Returns:                                │
│ - status: 'approved' | 'pending' | ...  │
│ - external_reference: session_id        │
│ - amount                                │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Check Payment Status                    │
│ - If status !== 'approved': ignore      │
└──────────────┬───────────────────────────┘
               │ status = 'approved'
               ▼
┌──────────────────────────────────────────┐
│ Find Session by external_reference      │
│ - session_id from payment details       │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Idempotency Check                       │
│ - If session.payment_status = 'paid':   │
│   * Log "already processed"             │
│   * Exit (prevent duplicate processing) │
└──────────────┬───────────────────────────┘
               │ status = 'pending'
               ▼
┌──────────────────────────────────────────┐
│ Update Session                          │
│ - payment_status = 'paid'               │
│ - payment_id = payment_id               │
│                                         │
│ Use database transaction for atomicity │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Fetch Patient Details                   │
│ - Get patient by session.patient_id     │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Build Confirmation Message              │
│ Template:                               │
│ "¡Pago confirmado! ✅                    │
│                                         │
│ Gracias [Name]. Tu sesión del          │
│ [date/time] está confirmada.            │
│                                         │
│ Recibirás el link de videollamada      │
│ 15 minutos antes de comenzar."          │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Send WhatsApp Confirmation              │
│ - To: patient.phone                     │
│ - Message: confirmation text            │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Log Notification                        │
│ - Type: payment_confirmed               │
│ - Channel: whatsapp                     │
│ - Status: sent                          │
└──────────────────────────────────────────┘

ERROR SCENARIOS:
┌──────────────────────────────────────────┐
│ Session Not Found:                      │
│ - Log error with payment_id             │
│ - Alert for manual reconciliation       │
│ - Payment succeeded but not tracked     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ WhatsApp Send Fails:                    │
│ - Log error                             │
│ - Save notification with status='failed'│
│ - Payment still marked as 'paid'        │
│ - Manual confirmation needed            │
└──────────────────────────────────────────┘
6.5 Meet Link Delivery Flow (15 Min Before)
CONDITIONS:
- minutesUntilSession <= 15
- minutesUntilSession > 0
- payment_status = 'paid'
- meet_link_sent = false

┌─────────────────────────────────────────┐
│ Meet Link Delivery Triggered            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Validate Preconditions                  │
│ - Session must be paid                  │
│ - Meet link must exist                  │
│ - Patient must have phone number        │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Build WhatsApp Message                  │
│ Template:                               │
│ "Hola [Name]!                           │
│                                         │
│ Tu sesión comienza en 15 minutos.      │
│                                         │
│ Ingresa aquí:                           │
│ [meet_link]                             │
│                                         │
│ ¡Te esperamos! 😊"                      │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Send WhatsApp via Twilio                │
│ - To: patient.phone                     │
│ - Message: meet link text               │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Log Notification                        │
│ - Type: meet_link                       │
│ - Channel: whatsapp                     │
│ - Status: sent                          │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Update Session                          │
│ - meet_link_sent = true                 │
└──────────────────────────────────────────┘

SKIP CONDITIONS:
┌──────────────────────────────────────────┐
│ If payment_status != 'paid':            │
│ - DO NOT send Meet link                │
│ - Patient must pay first                │
│ - Send late payment reminder instead   │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ If meet_link is null:                   │
│ - Log error (calendar event issue)      │
│ - DO NOT send notification              │
│ - Manual intervention required          │
└──────────────────────────────────────────┘
6.6 Edge Cases & Special Flows
Late Payment Reminder (2h before, not paid):
CONDITIONS:
- minutesUntilSession <= 120 (2 hours)
- minutesUntilSession > 60 (1 hour)
- payment_status = 'pending'
- reminder_24h_sent = true
- reminder_2h_sent = false

ACTION:
- Fetch existing payment link
- Send firmer reminder message:
  "Hola [Name],
  
  Tu sesión está programada para [time].
  
  Para acceder a la videollamada, necesitas
  completar el pago: [payment_link]
  
  El link de videollamada se enviará
  automáticamente al confirmar el pago."
  
- Update reminder_2h_sent = true
Courtesy Reminder (2h before, already paid):
CONDITIONS:
- minutesUntilSession <= 120
- minutesUntilSession > 60
- payment_status = 'paid'
- reminder_2h_sent = false

ACTION:
- Send friendly reminder:
  "Hola [Name]! 👋
  
  Tu sesión comienza en 2 horas ([time]).
  
  Recibirás el link de videollamada
  15 minutos antes. ¡Nos vemos pronto! 😊"
  
- Update reminder_2h_sent = true
Expired Payment Link:
SCENARIO: Patient doesn't pay within 24 hours

DETECTION:
- Payment preference expires_at < now
- payment_status still 'pending'

ACTION (Future Phase):
- Regenerate payment link
- Send new reminder
- Or: Session auto-cancelled

MVP BEHAVIOR:
- Link expires naturally
- Patient cannot pay
- Manual intervention by psychologist

7. External Service Integration Specifications
7.1 Google Calendar API Integration
Purpose: Read therapy session events from psychologist's calendar
Authentication:

OAuth 2.0 with refresh token
Scopes needed: https://www.googleapis.com/auth/calendar.readonly
Token refresh: Automatic via googleapis library

API Endpoints Used:
GET /calendar/v3/calendars/{calendarId}/events
Query Parameters:
- calendarId: 'primary' or specific calendar ID
- timeMin: ISO timestamp (now)
- timeMax: ISO timestamp (now + 48 hours)
- singleEvents: true (expand recurring events)
- orderBy: 'startTime'
- maxResults: 50
Event Structure to Extract:
{
  id: string,                    // calendar_event_id for deduplication
  summary: string,               // "Sesión - Patient Name"
  description: string,           // Patient phone (optional)
  start: {
    dateTime: string             // ISO timestamp
  },
  end: {
    dateTime: string
  },
  hangoutLink: string,           // Google Meet URL (primary)
  conferenceData: {              // Google Meet URL (fallback)
    entryPoints: [{
      uri: string
    }]
  }
}
Parsing Logic:
Patient Name Extraction:
- Regex: /sesión\s*[-:]\s*(.+)/i
- Captures everything after "Sesión -" or "Sesión:"
- Case insensitive

Patient Phone Extraction:
- Search description for E.164 format
- Regex: /\+\d{1,15}/
- Example: +5491112345678

Meet Link Extraction:
- Priority 1: event.hangoutLink
- Priority 2: event.conferenceData.entryPoints[0].uri
- Returns null if neither exists

Session Validation:
- Must contain "Sesión" (case insensitive)
- Must have Meet link
- Duration must be 30-90 minutes
Rate Limits:

1,000,000 queries per day
We query once per hour = 24/day
Well within limits

Error Handling:
Network Errors:
- Log error
- Throw "Calendar service unavailable"
- Job will retry next hour

Authentication Errors:
- Refresh token invalid: CRITICAL alert
- Requires manual token regeneration
- Job cannot proceed

Empty Results:
- Valid scenario (no sessions scheduled)
- Log info message
- Continue normally
7.2 Mercado Pago Integration
Purpose: Generate payment links and process payment confirmations
Authentication:

Access token in header
Environment: TEST (sandbox) or PROD

SDK Configuration:
mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});
Creating Payment Preferences:
Endpoint: POST /checkout/preferences
SDK Method: mercadopago.preferences.create()

Request Body:
{
  items: [{
    title: "Sesión de Psicología - [Patient Name]",
    unit_price: 15000,            // Amount in ARS
    quantity: 1,
    currency_id: "ARS"
  }],
  back_urls: {
    success: "https://yourdomain.com/payment/success",
    failure: "https://yourdomain.com/payment/failure",
    pending: "https://yourdomain.com/payment/pending"
  },
  auto_return: "approved",
  external_reference: "[session_id]",  // CRITICAL for linking
  notification_url: "https://yourdomain.com/webhook/mercadopago",
  expires: true,
  expiration_date_from: "[now]",
  expiration_date_to: "[now + 24h]",
  metadata: {
    session_id: "[session_id]",
    patient_name: "[patient_name]"
  }
}

Response:
{
  id: "1234567890",              // mp_preference_id
  init_point: "https://...",     // Payment link to send
  sandbox_init_point: "https://..." // For testing
}
Webhook Notification Structure:
POST /webhook/mercadopago

Headers:
- Content-Type: application/json
- X-Signature: [HMAC signature] (validate this!)
- X-Request-Id: [unique request ID]

Body:
{
  action: "payment.created" | "payment.updated",
  api_version: "v1",
  data: {
    id: "123456789"              // Payment ID
  },
  date_created: "2025-01-15T10:30:00Z",
  id: 987654321,                 // Notification ID
  live_mode: true | false,
  type: "payment",
  user_id: "USER_ID"
}
Fetching Payment Status:
Endpoint: GET /v1/payments/{id}
SDK Method: mercadopago.payment.get(paymentId)

Response:
{
  id: 123456789,
  status: "approved" | "pending" | "rejected" | "cancelled" | "refunded",
  status_detail: "accredited",
  transaction_amount: 15000,
  currency_id: "ARS",
  external_reference: "[session_id]",
  date_approved: "2025-01-15T10:30:00Z",
  payment_method_id: "credit_card",
  // ... more fields
}
Payment Status Values:
approved:  Payment successful (use this)
pending:   Payment in process (wait)
rejected:  Payment failed (ignore)
cancelled: Payment cancelled by user
refunded:  Payment was refunded (Phase 2)
Webhook Response Requirements:
CRITICAL TIMING:
- Respond 200 OK within 5 seconds
- Mercado Pago retries on timeout
- Process webhook asynchronously

Retry Behavior:
- MP retries up to 12 times over 48 hours
- Exponential backoff
- Must handle duplicate notifications (idempotency)
Security - Signature Validation (MUST IMPLEMENT BEFORE PROD):
Algorithm: HMAC-SHA256

Steps:
1. Extract X-Signature header
2. Concatenate: id + date_created + request body
3. Generate HMAC with webhook secret
4. Compare with X-Signature
5. Reject if mismatch

Code Pattern:
const signature = req.headers['x-signature'];
const secret = process.env.MP_WEBHOOK_SECRET;
const hash = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(req.body))
  .digest('hex');
  
if (hash !== signature) {
  return res.status(401).send('Invalid signature');
}
Rate Limits:

10,000 requests per month (free tier)
We create ~200-400 preferences/month
Well within limits

Testing:
Sandbox Environment:
- Use TEST-* credentials
- Use sandbox_init_point for payments
- Test cards provided by Mercado Pago

Webhook Simulator:
- Available in MP dashboard
- Simulates payment notifications
- Use for local testing
7.3 Twilio WhatsApp Integration
Purpose: Send WhatsApp messages to patients
Authentication:

Account SID + Auth Token (Basic Auth)
Credentials in environment variables

SDK Configuration:
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
Sending Messages:
Endpoint: POST /2010-04-01/Accounts/{AccountSid}/Messages
SDK Method: client.messages.create()

Request:
{
  from: 'whatsapp:+14155238886',   // Twilio number
  to: 'whatsapp:+5491112345678',   // Patient number
  body: 'Message text'             // Max 1600 characters
}

Response:
{
  sid: 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // Message ID
  status: 'queued' | 'sent' | 'delivered' | 'failed',
  to: 'whatsapp:+5491112345678',
  from: 'whatsapp:+14155238886',
  body: 'Message text',
  date_created: '2025-01-15T10:30:00Z',
  // ... more fields
}
Phone Number Format:
CRITICAL: Must use E.164 format
- Start with +
- Country code (Argentina: 54)
- Area code without leading 0 (Buenos Aires: 11)
- Local number

Examples:
✅ +5491112345678
✅ +5491187654321
❌ 011-1234-5678
❌ +54 9 11 1234-5678
❌ 5491112345678 (missing +)

Validation Regex:
^\+[1-9]\d{1,14}$
Message Status Flow:
queued → sent → delivered
           ↓
        failed
Status Webhooks (Optional for MVP):
Twilio can send status updates to your endpoint:
- Message delivered
- Message failed
- Delivery receipt

Configure in Twilio Console if needed
WhatsApp Sandbox (Development):
Setup:
1. Go to Twilio Console
2. Navigate to Messaging > Try it out > Try WhatsApp
3. Get sandbox number: whatsapp:+14155238886
4. Join sandbox:
   - Send "join [keyword]" to sandbox number
   - Example: "join happy-tiger"

Limitations:
- 24-hour session window (send message to restart)
- Cannot initiate conversation after 24h
- Must respond to patient first

For Production:
- Request WhatsApp Business approval
- Get dedicated phone number
- No 24-hour limitation
Character Limits:
WhatsApp: 1600 characters
Our messages: ~300-500 characters
Safe buffer maintained
Emojis:
Supported emojis (tested):
✅ 👋 😊 🙂 ⏰ 📅

Avoid:
- Complex emojis (may not render)
- Skin tone modifiers
- Country flags
- New emojis (compatibility issues)
Rate Limits:
Free Trial:
- Limited messages
- Upgrade required for production

Pay-as-you-go:
- No hard limit
- Subject to abuse detection
- ~$0.005 USD per message (Argentina)
Error Codes:
21211: Invalid 'To' phone number
21408: Permission to send denied
21610: Message blocked (spam detected)
30003: Unreachable destination
30005: Unknown destination
30008: Message delivery failed
Error Handling:
Invalid Phone:
- Log error
- Mark notification as failed
- Manual correction needed

Network Error:
- Retry up to 3 times
- Exponential backoff (1s, 2s, 4s)
- Log if all retries fail

Sandbox Not Joined:
- Patient sees "not authorized" error
- Requires manual sandbox join
- Or: Production WhatsApp needed
7.4 Integration Error Recovery
General Strategy:
External API Call Pattern:

try {
  const result = await externalAPI.call();
  return result;
} catch (error) {
  logger.error('API call failed', {
    api: 'serviceName',
    operation: 'operationName',
    error: error.message,
    context: { relevant, data }
  });
  
  // Decide: throw, return null, or retry
}
Retry Logic (for transient failures):
Max Retries: 3
Backoff: Exponential (1s, 2s, 4s)

Retryable Errors:
- Network timeout
- 5xx server errors
- Rate limit errors (429)

Non-retryable Errors:
- 4xx client errors (except 429)
- Authentication errors
- Validation errors
Circuit Breaker (Future):
If external service fails repeatedly:
- Open circuit after 5 consecutive failures
- Half-open after 60 seconds
- Close after 3 successful requests

Prevents cascading failures

8. Security & Compliance
8.1 Data Security
Sensitive Data:

Patient names
Phone numbers
Email addresses
Payment information (reference IDs only, not card numbers)

Storage Security:
Encryption at Rest:
- PostgreSQL: Enable disk encryption
- Backups: Encrypted

Encryption in Transit:
- All external API calls: HTTPS
- Database connection: SSL/TLS
- Webhook endpoint: HTTPS only
Access Control:
Database:
- Dedicated user per environment
- Least privilege principle
- No root/admin access for app

Environment Variables:
- Never commit to git
- Use secret management (env files in production)
- Rotate credentials periodically
Logging Security:
NEVER LOG:
- Full phone numbers (mask: +549********5678)
- Email addresses in full
- Payment tokens
- API credentials

DO LOG:
- Request IDs
- Operation types
- Error messages (sanitized)
- Timestamps
8.2 Webhook Security
Mercado Pago Webhook:
MUST VALIDATE before production:
- X-Signature header validation
- HMAC-SHA256 with webhook secret
- Reject if signature invalid

IP Whitelist (Optional):
- Mercado Pago known IP ranges
- Adds defense-in-depth
- Not substitute for signature validation
Rate Limiting:
Protect webhook endpoint:
- Max 100 requests/minute per IP
- Use express-rate-limit middleware
- Prevents DOS attacks
Idempotency:
Critical for webhooks:
- Check payment_status before updating
- Use database transactions
- Prevent duplicate processing

Pattern:
BEGIN TRANSACTION;
  SELECT payment_status WHERE id = X FOR UPDATE;
  IF payment_status = 'pending' THEN
    UPDATE payment_status = 'paid';
  END IF;
COMMIT;
8.3 Environment Variable Management
Required Variables:
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Google Calendar
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REFRESH_TOKEN=xxx
GOOGLE_CALENDAR_ID=primary

# Mercado Pago
MP_ACCESS_TOKEN=TEST-xxx (dev) or APP-xxx (prod)
MP_PUBLIC_KEY=TEST-xxx or APP-xxx
MP_WEBHOOK_SECRET=xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Application
NODE_ENV=development | production
PORT=3000
APP_URL=https://yourdomain.com

# Timing
REMINDER_24H_OFFSET=1440
REMINDER_2H_OFFSET=120
MEET_LINK_OFFSET=15
SESSION_PRICE=15000
Validation on Startup:
Check all required vars are present
Exit with error if any missing
Log which var is missing (not its value)
8.4 HTTPS Requirements
Production:
ALL endpoints must use HTTPS:
- Webhook endpoint (Mercado Pago requirement)
- Any future API endpoints

SSL Certificate:
- Use Let's Encrypt (free)
- Auto-renewal configured
- Or: Cloudflare SSL
Development:
Use ngrok for webhook testing:
- Exposes localhost via HTTPS
- Provides public URL for webhooks
- Free tier sufficient

Command:
ngrok http 3000
8.5 Compliance Considerations
Data Protection (Argentina):
Personal Data Law (PDPA):
- Patient data is personal information
- Must have consent to store
- Must provide access/deletion mechanism (Phase 2)
- Must secure data appropriately

Current Approach:
- Minimal data collection
- Secured storage
- No sharing with third parties
- Use for business purpose only
Healthcare Data:
Therapy session = healthcare context
Extra sensitivity required:
- No session notes/content in MVP
- Only administrative data (time, payment)
- Meet link is temporary (Google manages)
Retention Policy:
MVP Behavior:
- Data kept indefinitely
- No auto-deletion

Future (Phase 2):
- Sessions older than 2 years archived
- Patient deletion on request
- Audit log maintained

9. Testing Strategy
9.1 Testing Pyramid
         ▲
        /E2E\         Few (2-3 critical flows)
       /─────\
      / Integ-\       Some (10-15 scenarios)
     / ration \
    /───────────\
   /    Unit     \    Many (50+ tests)
  /───────────────\
9.2 Unit Testing
Scope: Individual functions and services
Test Framework: Vitest
What to Test:
Services:
- CalendarService methods (with mocked googleapis)
- PaymentService methods (with mocked mercadopago)
- NotificationService methods (with mocked twilio)
- Data parsing functions
- Date calculations
- Message template building

Repositories:
- CRUD operations (with in-memory DB)
- Query methods
- Transaction handling

Utilities:
- Phone number validation
- Date formatting
- Error handling functions
Mocking Strategy:
External APIs:
- Mock googleapis, mercadopago, twilio
- Use vitest.mock()
- Return predefined responses

Database:
- Use in-memory SQLite for speed
- Or: Test containers with real PostgreSQL

Example:
vi.mock('googleapis', () => ({
  google: {
    calendar: vi.fn(() => ({
      events: {
        list: vi.fn().mockResolvedValue({
          data: { items: [...] }
        })
      }
    }))
  }
}));
Coverage Target:

Overall: 70%+
Services: 80%+
Critical paths: 100%

9.3 Integration Testing
Scope: Component interaction and external API integration
What to Test:
Cron Job:
- Full session monitoring cycle
- Time window calculations
- Notification triggering logic

Webhook Processing:
- Payment webhook handling
- Database updates
- Notification sending

Calendar Integration:
- Fetch events from real test calendar
- Parse patient information
- Extract meeting links

Payment Integration:
- Create payment preference (sandbox)
- Verify webhook structure
- Status verification

WhatsApp Integration:
- Send test messages (sandbox)
- Verify delivery status
Test Environment:
Use real external services with test credentials:
- Google Calendar: Dedicated test calendar
- Mercado Pago: Sandbox environment
- Twilio: Sandbox number
- PostgreSQL: Dedicated test database
Test Data Management:
Setup:
- Create test calendar events
- Seed test patient data
- Prepare test scenarios

Teardown:
- Clear test data after each run
- Reset database state
- Don't pollute production calendar
9.4 End-to-End Testing
Scope: Complete user journeys
Test Framework: Playwright (manual for MVP)
Critical Flows to Test:
1. Happy Path:
   - Create calendar event
   - Cron job detects event
   - Payment reminder sent
   - Patient pays
   - Payment confirmed
   - Meet link sent
   - Session occurs

2. Late Payment:
   - Reminder sent at 24h
   - Patient doesn't pay
   - Late reminder at 2h
   - Patient pays
   - Meet link sent

3. Payment Failure:
   - Reminder sent
   - Payment attempted and fails
   - Status remains pending
   - No Meet link sent
Manual Testing Checklist:
□ Create test calendar event 25 hours ahead
□ Run cron job manually
□ Verify payment link received on WhatsApp
□ Click link and make test payment
□ Verify webhook received and processed
□ Verify payment confirmation sent
□ Update event to 20 minutes from now
□ Run cron job again
□ Verify Meet link received
□ Join Meet to verify link works
9.5 Testing Tools & Commands
Test Scripts (package.json):
json{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run src/**/*.test.ts",
    "test:integration": "vitest run tests/integration/**/*.test.ts",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:calendar": "node scripts/test-calendar.js",
    "test:payment": "node scripts/test-payment.js",
    "test:notification": "node scripts/test-notification.js"
  }
}
```

**Environment for Tests:**
```
.env.test:
- Separate test credentials
- Test database URL
- Sandbox API keys
- Mock external services where needed
```

---

## 10. Deployment & Operations

### 10.1 Deployment Options

**Option 1: Single Platform (Recommended for MVP)**
```
Railway or Render:
- Deploy backend + cron job
- Managed PostgreSQL included
- Built-in logging
- Easy setup

Pros:
- Simple deployment
- One place to manage
- Auto-restarts on crash

Cons:
- Costs $5-10/month
- Less control
```

**Option 2: VPS (DigitalOcean, Linode)**
```
Self-managed server:
- Install PostgreSQL
- Run Node.js app with PM2
- Configure nginx as reverse proxy
- Setup SSL with Let's Encrypt

Pros:
- Full control
- Potentially cheaper long-term

Cons:
- More setup work
- Manual maintenance
- Need DevOps knowledge
```

**Option 3: Serverless (Not Recommended)**
```
Vercel + Supabase:
- Cron jobs: Vercel Cron (limited)
- Database: Supabase PostgreSQL
- Webhooks: Serverless functions

Pros:
- Scalable
- Free tier available

Cons:
- Cold starts
- Complex cron job management
- Not ideal for scheduled tasks
10.2 Process Management
PM2 Configuration (if using VPS):
javascript// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'psy-session-manager',
    script: 'dist/index.js',
    instances: 1,  // Single instance (cron job)
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    restart_delay: 4000
  }]
};
Start/Stop Commands:
bashpm2 start ecosystem.config.js
pm2 stop psy-session-manager
pm2 restart psy-session-manager
pm2 logs psy-session-manager
pm2 monit
10.3 Database Management
Migrations:
bash# Run migrations
npm run db:migrate

# Rollback (if needed)
npm run db:migrate:down

# Create new migration
npm run db:migrate:create add_column_name
```

**Backup Strategy:**
```
Automated Backups:
- Daily automated backups (platform feature)
- Retention: 7 days
- Test restore process monthly

Manual Backup:
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

Restore:
psql $DATABASE_URL < backup-20250115.sql
```

**Connection Pooling:**
```
Configuration:
- Min connections: 2
- Max connections: 10
- Idle timeout: 30 seconds

Monitoring:
- Watch active connections
- Alert if > 8 connections consistently
```

### 10.4 Monitoring & Logging

**Logging Strategy:**
```
Pino Logger Configuration:
- Format: JSON (for parsing)
- Levels: debug, info, warn, error
- Include: timestamp, level, msg, context

Log Aggregation (Phase 2):
- Ship logs to external service
- Options: Datadog, LogRocket, Sentry
- MVP: File-based logs sufficient
```

**Metrics to Monitor:**
```
Application:
- Cron job execution time (target: < 5 min)
- Number of sessions processed per run
- Notification success rate
- Webhook response time

System:
- CPU usage
- Memory usage
- Disk space
- Database connection count

External APIs:
- Google Calendar API errors
- Mercado Pago API errors
- Twilio API errors
- API response times
```

**Alerting (Future):**
```
Critical Alerts:
- Cron job failure
- Database connection lost
- All notifications failing

Warning Alerts:
- High error rate (> 10%)
- Slow cron job (> 10 min)
- Low disk space

Setup:
- Email/SMS alerts
- Integration with PagerDuty or similar
- Slack notifications
```

### 10.5 Maintenance & Updates

**Update Strategy:**
```
Rolling Updates (Zero Downtime):
1. Deploy new version to staging
2. Test thoroughly
3. Deploy to production during low-traffic window
4. Monitor for 1 hour
5. Rollback if issues detected

Blue-Green Deployment (Future):
- Two identical environments
- Switch traffic instantly
- Quick rollback capability
```

**Database Migrations:**
```
Safe Migration Process:
1. Backup database
2. Test migration on staging
3. Apply to production (low-traffic time)
4. Verify data integrity
5. Monitor for errors

Rollback Plan:
- Keep rollback script ready
- Test rollback process
- Document steps clearly
```

**Dependency Updates:**
```
Regular Updates:
- Check weekly for security updates
- Test in development first
- Update staging, then production

Critical Security Updates:
- Apply immediately
- Test minimally but quickly
- Monitor closely after deployment
```

---

## 11. Performance Optimization

### 11.1 Database Optimization

**Indexing Strategy:**
```
Critical Indexes (must have):
- sessions(scheduled_at) - Cron job queries
- sessions(payment_status) - Filtering paid/pending
- sessions(calendar_event_id) - Deduplication
- patients(phone) - Lookup by phone

Composite Indexes (future):
- sessions(scheduled_at, payment_status) - Combined filters
```

**Query Optimization:**
```
Cron Job Query:
SELECT s.*, p.name, p.phone
FROM sessions s
JOIN patients p ON s.patient_id = p.id
WHERE s.scheduled_at BETWEEN $1 AND $2
  AND (
    (s.reminder_24h_sent = false AND scheduled_at - NOW() <= '24 hours')
    OR (s.reminder_2h_sent = false AND scheduled_at - NOW() <= '2 hours')
    OR (s.meet_link_sent = false AND scheduled_at - NOW() <= '15 minutes')
  )
ORDER BY s.scheduled_at ASC;

Benefits:
- Single query for all time windows
- Join eliminates N+1 queries
- Indexed columns for fast lookup
```

**Connection Management:**
```
Pool Configuration:
- Min: 2 connections
- Max: 10 connections
- Acquire timeout: 30s
- Idle timeout: 30s

Why:
- MVP has low concurrency
- Cron job + webhooks only
- Prevent connection exhaustion
```

### 11.2 Cron Job Optimization

**Execution Time Target:**
```
Current: < 5 minutes
Optimal: < 2 minutes

Breakdown:
- Calendar API call: ~500ms
- Process 20 sessions: ~2-4 seconds each
- Total: ~40-80 seconds typical

Optimization:
- Parallel processing (future)
- Batch database updates
- Cache calendar results (1 hour)
```

**Parallel Processing (Phase 2):**
```
Current: Sequential processing
- Process one session at a time
- Safe but slower

Future: Parallel processing
- Process 5 sessions concurrently
- Use Promise.allSettled()
- Reduce job time to ~30 seconds
```

### 11.3 External API Optimization

**Request Timeouts:**
```
Configuration:
- Google Calendar: 10 seconds
- Mercado Pago: 10 seconds
- Twilio: 15 seconds (message delivery)

Prevents:
- Hanging requests
- Job execution stalls
```

**Caching Strategy (Future):**
```
Calendar Events:
- Cache for 1 hour
- Invalidate on calendar webhook (Phase 2)
- Reduces API calls

Payment Status:
- No caching (always fresh)
- Critical for accuracy
```

### 11.4 Webhook Performance

**Response Time Target:**
```
< 1 second for 200 OK response

Achieved by:
- Immediate 200 OK response
- Async processing in background
- No blocking operations in handler
```

**Async Processing:**
```
Pattern:
1. Receive webhook
2. Validate minimally (signature, type)
3. Respond 200 OK
4. Queue processing task
5. Process in background

Benefits:
- Fast webhook response
- Prevents retries
- Resilient to processing errors
```

---

## 12. Migration & Rollout Plan

### 12.1 Pre-Launch Checklist

**Infrastructure:**
```
□ PostgreSQL database provisioned
□ Database user created with correct permissions
□ Database migrations run successfully
□ Backup system configured and tested
```

**External Service Configuration:**
```
□ Google Calendar OAuth token generated and tested
□ Mercado Pago production credentials obtained
□ Mercado Pago webhook URL configured
□ Twilio WhatsApp Business approved
□ Twilio production credentials configured
```

**Application Setup:**
```
□ Environment variables configured
□ Application deployed to production server
□ Process manager (PM2) configured
□ Auto-restart on crash verified
□ Cron job running every hour
□ Webhook endpoint accessible (HTTPS)
```

**Testing:**
```
□ Create test calendar event
□ Verify cron job processes it
□ Make test payment in production
□ Verify webhook received and processed
□ Verify all notifications sent
□ End-to-end test successful
```

**Documentation:**
```
□ Deployment guide written
□ Troubleshooting guide prepared
□ Psychologist training completed
□ Support contact information documented
```

### 12.2 Launch Strategy

**Phase 1: Soft Launch (Week 1-2)**
```
Scope:
- 3-5 test patients only
- Psychologist monitoring closely
- Manual fallback ready

Goals:
- Verify automation works
- Catch any edge cases
- Adjust messaging if needed

Success Criteria:
- All notifications sent correctly
- Payments processed without issues
- No manual intervention needed
```

**Phase 2: Gradual Rollout (Week 3-4)**
```
Scope:
- All new sessions automated
- Existing patients informed
- Monitoring continues

Communication:
- Inform patients about new payment process
- Provide support contact
- Assure data privacy

Success Criteria:
- 90%+ payment completion rate
- <5% error rate
- Positive patient feedback
```

**Phase 3: Full Production (Week 5+)**
```
Scope:
- 100% automated
- Manual process deprecated
- Continuous monitoring

Optimization:
- Tune message timing if needed
- Adjust wording based on feedback
- Document common issues
```

### 12.3 Rollback Plan

**When to Rollback:**
```
Immediate rollback if:
- Multiple payment failures
- Notifications not sending
- Database errors
- Critical bug discovered

Criteria:
- >20% error rate
- Complete service failure
- Data integrity issues
```

**Rollback Steps:**
```
1. Stop cron job (PM2 stop)
2. Revert to previous code version
3. Rollback database if needed
4. Restart with old version
5. Resume manual process
6. Investigate root cause
7. Fix and redeploy
```

**Manual Fallback Process:**
```
If automation fails:
1. Psychologist manually sends payment links
2. Manually verifies payments
3. Manually sends Meet links
4. System remains read-only (data intact)
5. Fix automation ASAP
```

---

## 13. Success Criteria & Metrics

### 13.1 Technical Success Criteria

**Reliability:**
```
Target: 99% uptime
- Cron job runs successfully every hour
- Webhook processes 100% of payments
- Database always accessible
```

**Performance:**
```
Target: Fast notification delivery
- Payment links sent within 1 hour of trigger time
- Meet links sent within 5 minutes of trigger time
- Webhook processing < 5 seconds
```

**Accuracy:**
```
Target: Zero payment errors
- 100% of paid sessions get Meet links
- 0% of unpaid sessions get Meet links
- No duplicate notifications
```

### 13.2 Business Success Criteria

**Payment Collection:**
```
Target: 95%+ payment before session
Baseline (before MVP): ~60% payment before session

Measurement:
- Track payment_status at session time
- Compare before vs after MVP
```

**Time Savings:**
```
Target: 80% reduction in manual follow-ups
Baseline: ~30 minutes/day on payment follow-ups

Measurement:
- Count manual payment requests (should be near zero)
- Psychologist time tracking
```

**Patient Satisfaction:**
```
Target: Positive feedback
Measurement:
- Direct patient feedback
- No increase in cancellations
- No complaints about automation
```

### 13.3 Monitoring Dashboard (Future)

**Key Metrics to Track:**
```
Daily:
- Sessions scheduled
- Payments received
- Notifications sent
- Error rate

Weekly:
- Payment completion rate
- Average time to payment
- No-show rate
- Revenue collected

Monthly:
- System uptime
- Total sessions processed
- Total revenue
- Patient retention
```

---

## 14. Post-MVP: Transition to Phase 2

### 14.1 Phase 1 Completion Checklist

**Before moving to Phase 2:**
```
□ MVP in production for 4+ weeks
□ All success criteria met
□ No critical bugs
□ Stable error rate (< 5%)
□ Positive psychologist feedback
□ Payment collection rate > 90%
□ Documentation complete
```

### 14.2 Lessons Learned Review

**Conduct retrospective:**
```
Questions:
- What worked well?
- What didn't work?
- What was unexpected?
- What should we change?
- What should we add in Phase 2?

Document:
- Technical challenges faced
- Solutions implemented
- Best practices discovered
- Mistakes to avoid
```

### 14.3 Phase 2 Preparation

**Prerequisites for Phase 2:**
```
□ MVP stable and running
□ Database schema supports Phase 2 features
□ Codebase well-structured for extension
□ Testing framework established
□ Monitoring in place
```

**Phase 2 Scope Preview:**
```
Dashboard features:
- View all sessions
- Manage patients
- Handle cancellations
- Process manual payments
- Generate reports

Technical additions:
- Web frontend (Next.js)
- Authentication system
- REST API or tRPC
- Extended database schema