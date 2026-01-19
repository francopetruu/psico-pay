# Repositories Module

This directory contains the data access layer implementing the Repository pattern.

## Usage

```typescript
import { createDb } from './db/index.js';
import { createRepositories } from './repositories/index.js';

const db = createDb(process.env.DATABASE_URL);
const repos = createRepositories(db);

// Use repositories
const patient = await repos.patients.findByPhone('+5491112345678');
const sessions = await repos.sessions.getSessionsNeeding24hReminder(1380, 1440);
```

## Repositories

### PatientRepository (`patient.repository.ts`)
**Status: Implemented**

Manages patient data access.

**Methods:**
- `findById(id)`: Find patient by ID
- `findByPhone(phone)`: Find patient by phone number
- `findByName(name)`: Find patients by exact name
- `create(data)`: Create new patient
- `update(id, data)`: Update patient
- `findOrCreate(data)`: Find by phone or create new
- `findOrCreateByName(data)`: Find by name or create (fallback)
- `list()`: List all patients

### SessionRepository (`session.repository.ts`)
**Status: Implemented**

Manages therapy session data access with time-based queries.

**Methods:**
- `findById(id)`: Find session by ID
- `findByCalendarEventId(eventId)`: Find by calendar event (deduplication)
- `findByIdWithPatient(id)`: Find session with patient data
- `create(data)`: Create new session
- `update(id, data)`: Update session
- `findOrCreate(data)`: Find by event ID or create
- `getSessionsInTimeRange(from, to)`: Get sessions in date range
- `getSessionsNeeding24hReminder(min, max)`: Sessions needing 24h reminder
- `getSessionsNeeding2hReminder(min, max)`: Sessions needing 2h reminder
- `getSessionsNeedingMeetLink(min, max)`: Paid sessions needing Meet link
- `markReminder24hSent(id)`: Update 24h reminder flag
- `markReminder2hSent(id)`: Update 2h reminder flag
- `markMeetLinkSent(id)`: Update Meet link sent flag
- `updatePaymentStatus(id, status, paymentId)`: Update payment status
- `list(filters)`: List sessions with optional filters

### PaymentPreferenceRepository (`payment-preference.repository.ts`)
**Status: Implemented**

Manages Mercado Pago payment preference records.

**Methods:**
- `findById(id)`: Find preference by ID
- `findBySessionId(sessionId)`: Find preference for session
- `findByMpPreferenceId(mpId)`: Find by Mercado Pago ID
- `create(data)`: Create new preference
- `deleteBySessionId(sessionId)`: Delete expired preference
- `isExpired(preference)`: Check if preference is expired
- `findOrCreate(data)`: Find valid or create new

### NotificationRepository (`notification.repository.ts`)
**Status: Implemented**

Manages notification audit logs.

**Methods:**
- `findById(id)`: Find notification by ID
- `findBySessionId(sessionId)`: Get all notifications for session
- `create(data)`: Create notification log
- `update(id, data)`: Update notification
- `markSent(id)`: Mark as successfully sent
- `markFailed(id, error)`: Mark as failed with error
- `logSuccess(sessionId, type, channel)`: Log successful notification
- `logFailure(sessionId, type, error, channel)`: Log failed notification
- `getFailedNotifications()`: Get failed notifications for audit
- `wasNotificationSent(sessionId, type)`: Check if notification was sent

## Factory Function

```typescript
import { createRepositories } from './repositories/index.js';

const repos = createRepositories(db);
// repos.patients, repos.sessions, repos.paymentPreferences, repos.notifications
```

## Design Principles

1. **Abstraction**: Hide Drizzle ORM implementation details
2. **Clean Interface**: Standard CRUD + domain-specific queries
3. **Testability**: Easy to mock for unit tests
4. **Type Safety**: Full TypeScript types from schema
5. **Logging**: All write operations logged for debugging
