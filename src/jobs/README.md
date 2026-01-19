# Jobs Module

This directory contains scheduled job definitions for PsicoPay.

## Jobs

### SessionMonitorJob (`session-monitor.job.ts`)
**Status: Implemented**

Main cron job that orchestrates the entire payment collection workflow.

**Execution Steps:**
1. **Sync Calendar Events**: Fetch events from Google Calendar (next 48h)
   - Filter for therapy sessions (title contains "Sesión")
   - Create/update patient records
   - Create/update session records

2. **Process 24h Reminders**: For sessions 23-24 hours away
   - Create Mercado Pago payment preference
   - Send WhatsApp with payment link
   - Log notification

3. **Process 2h Reminders**: For sessions 1-2 hours away
   - If paid: Send courtesy reminder
   - If pending: Send late payment reminder with link
   - Log notification

4. **Process Meet Link Delivery**: For paid sessions 0-15 minutes away
   - Validate session is paid
   - Send Google Meet link via WhatsApp
   - Log notification

**Error Handling:**
- Each session processed independently
- Errors logged but don't stop other sessions
- Notification flags prevent duplicate sends

### Scheduler (`scheduler.ts`)
**Status: Implemented**

Manages cron job scheduling with node-cron.

**Features:**
- Configurable cron schedule (default: hourly)
- Argentina timezone support
- Concurrency protection (prevents overlapping runs)
- Optional run-on-start
- Manual trigger support for testing

## Configuration

```typescript
// Default: Run every hour at minute 0
const scheduler = createScheduler(job, {
  cronSchedule: '0 * * * *',
  runOnStart: false,
});
```

### Environment Variables
- `CRON_SCHEDULE`: Cron expression (default: `0 * * * *`)

## Usage

```typescript
import { createDb } from './db/index.js';
import { createRepositories } from './repositories/index.js';
import { createCalendarService, createPaymentService, createNotificationService } from './services/index.js';
import { createSessionMonitorJob, createScheduler } from './jobs/index.js';

// Create dependencies
const db = createDb(process.env.DATABASE_URL);
const repos = createRepositories(db);
const calendarService = createCalendarService({...});
const paymentService = createPaymentService({...});
const notificationService = createNotificationService({...});

// Create job
const job = createSessionMonitorJob(
  calendarService,
  paymentService,
  notificationService,
  repos
);

// Create and start scheduler
const scheduler = createScheduler(job, {
  cronSchedule: process.env.CRON_SCHEDULE,
  runOnStart: true,
});

scheduler.start();
```

## Manual Testing

```typescript
// Run job manually
await scheduler.runNow();

// Or run job directly
await job.run();
```
