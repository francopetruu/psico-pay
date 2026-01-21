# @psico-pay/db

Shared database schemas and utilities for PsicoPay using Drizzle ORM.

## Tech Stack

- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)
- **Migrations**: Drizzle Kit
- **Testing**: Vitest

## Installation

This package is used internally by other packages in the monorepo:

```json
{
  "dependencies": {
    "@psico-pay/db": "workspace:*"
  }
}
```

## Usage

### Basic Usage

```typescript
import { createDb, patients, sessions } from '@psico-pay/db';

// Create database connection
const db = createDb(process.env.DATABASE_URL);

// Query patients
const allPatients = await db.select().from(patients);

// Insert a session
await db.insert(sessions).values({
  patientId: 'uuid-here',
  calendarEventId: 'google-calendar-id',
  scheduledAt: new Date(),
  amount: '15000.00',
});
```

### Schema-Only Import

```typescript
import { patients, sessions, users } from '@psico-pay/db/schema';
```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | Dashboard users (therapists, admins) |
| `patients` | Patient records |
| `sessions` | Therapy sessions |
| `payment_preferences` | Mercado Pago payment links |
| `notifications` | WhatsApp/email notification log |
| `session_notes` | Notes attached to sessions |
| `audit_log` | Audit trail for changes |

### Enums

- `payment_status`: pending, paid, failed, refunded
- `session_status`: scheduled, completed, cancelled, no_show
- `notification_type`: reminder_24h, reminder_2h, meet_link, payment_confirmed
- `notification_channel`: whatsapp, email, sms
- `notification_status`: pending, sent, failed
- `user_role`: admin, therapist
- `audit_action`: create, update, delete

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm build` | Build TypeScript |
| `pnpm dev` | Watch mode |
| `pnpm typecheck` | Run type checking |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio |

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## Database Management

### Push Schema (Development)

```bash
pnpm db:push
```

### Generate Migration

```bash
pnpm db:generate
```

### Open Drizzle Studio

```bash
pnpm db:studio
```

## Project Structure

```
src/
├── index.ts           # Main exports (createDb, createPool, etc.)
└── schema/
    └── index.ts       # All table definitions and relations

drizzle/               # Generated migrations
drizzle.config.ts      # Drizzle Kit configuration
```

## Type Exports

```typescript
import type { 
  User, 
  NewUser, 
  Patient, 
  NewPatient,
  Session,
  NewSession,
  // ... etc
} from '@psico-pay/db';
```

## Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests once (for CI)
pnpm test:run

# Run with coverage
pnpm test:coverage
```

## Relations

The schema includes Drizzle relations for type-safe joins:

```typescript
// Example: Get sessions with patient data
const sessionsWithPatient = await db.query.sessions.findMany({
  with: {
    patient: true,
  },
});
```
