# Services Module

This directory contains the business logic services for PsicoPay.

## Services

### CalendarService (`calendar.service.ts`)
**Status: Implemented**

Integrates with Google Calendar API to fetch and parse therapy sessions.

**Methods:**
- `getUpcomingEvents(hoursAhead)`: Fetches events within time range
- `filterTherapySessions(events)`: Filters for valid therapy sessions
- `parseSessionInfo(event)`: Extracts patient info from event

**Event Parsing:**
- Patient name: Extracted from title (e.g., "Sesión - Juan Pérez")
- Patient phone: Extracted from description (E.164 format)
- Meet link: From `hangoutLink` or `conferenceData`

**Filtering Criteria:**
- Title must contain "Sesión" (case insensitive)
- Must have Google Meet link
- Duration between 30-90 minutes

### PaymentService
- Creates Mercado Pago payment preferences
- Verifies payment status
- Handles payment webhook processing

### NotificationService
- Sends WhatsApp messages via Twilio
- Manages message templates
- Handles delivery status

### SessionService
- Orchestrates session-related business logic
- Coordinates between services and repositories

## Design Principles

1. **Single Responsibility**: Each service handles one domain
2. **Stateless**: Services don't maintain state between calls
3. **Dependency Injection**: Dependencies passed via constructor
4. **Error Handling**: All external calls wrapped in try-catch
