# Jobs Module

This directory contains scheduled job definitions.

## Jobs

### SessionMonitorJob
Main cron job that runs hourly to:
1. Fetch upcoming calendar events (next 48 hours)
2. Create/update session records
3. Determine which notifications to send
4. Trigger payment reminders (24h before)
5. Send courtesy reminders (2h before)
6. Deliver meeting links (15 min before, if paid)

## Cron Schedule

Default schedule: `0 * * * *` (every hour at minute 0)

Configurable via `CRON_SCHEDULE` environment variable.

## Error Handling

- Each session is processed independently
- Errors are logged but don't stop processing of other sessions
- Failed notifications can be retried on next run
