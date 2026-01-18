# Services Module

This directory contains the business logic services for PsicoPay.

## Services

### CalendarService
- Fetches events from Google Calendar
- Parses session information (patient name, phone, meet link)
- Filters therapy sessions based on title pattern

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
