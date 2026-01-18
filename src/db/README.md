# Database Module

This directory contains the database schema and connection configuration.

## Files

### schema.ts
Drizzle ORM schema definitions for all tables:
- `patients` - Patient contact information
- `sessions` - Therapy sessions with payment tracking
- `paymentPreferences` - Mercado Pago payment links
- `notifications` - Notification audit log

### index.ts
Database connection and Drizzle client initialization.

## Migrations

Migrations are generated and managed by Drizzle Kit:

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Open Drizzle Studio for visual DB management
npm run db:studio
```

## Schema Conventions

- All tables use UUID primary keys
- Timestamps: `createdAt`, `updatedAt`
- Foreign keys use CASCADE DELETE
- Indexes on frequently queried columns

## Table Details

### patients
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Patient full name |
| phone | VARCHAR(20) | E.164 format (+5491112345678) |
| email | VARCHAR(255) | Optional email |
| trusted | BOOLEAN | For deferred payments (Phase 2) |

### sessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| patient_id | UUID | FK to patients |
| calendar_event_id | VARCHAR(255) | Google Calendar event ID |
| scheduled_at | TIMESTAMP | Session date/time |
| duration_minutes | INTEGER | Default 50 |
| amount | DECIMAL(10,2) | Price in ARS |
| payment_status | ENUM | pending/paid/failed/refunded |
| payment_id | VARCHAR(255) | Mercado Pago payment ID |
| meet_link | TEXT | Google Meet URL |
| reminder_24h_sent | BOOLEAN | 24h reminder flag |
| reminder_2h_sent | BOOLEAN | 2h reminder flag |
| meet_link_sent | BOOLEAN | Meet link sent flag |

### payment_preferences
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | FK to sessions |
| mp_preference_id | VARCHAR(255) | Mercado Pago preference ID |
| payment_link | TEXT | Checkout URL |
| expires_at | TIMESTAMP | Link expiration |

### notifications
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | FK to sessions |
| type | ENUM | reminder_24h/reminder_2h/meet_link/payment_confirmed |
| channel | ENUM | whatsapp/email/sms |
| status | ENUM | pending/sent/failed |
| sent_at | TIMESTAMP | When delivered |
| error_message | TEXT | Error details if failed |
