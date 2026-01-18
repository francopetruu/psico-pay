# Repositories Module

This directory contains the data access layer implementing the Repository pattern.

## Repositories

### PatientRepository
- CRUD operations for patients
- Find by phone number
- Find or create pattern for new patients

### SessionRepository
- CRUD operations for sessions
- Find by calendar event ID (deduplication)
- Query sessions by time window
- Query sessions by payment status

### PaymentPreferenceRepository
- CRUD operations for payment preferences
- Find by Mercado Pago preference ID
- Find by session ID

### NotificationRepository
- Create notification logs
- Query by session
- Query failed notifications for retry

## Design Principles

1. **Abstraction**: Hide database implementation details
2. **Clean Interface**: Standard CRUD + domain-specific queries
3. **Testability**: Easy to mock for unit tests
4. **Transaction Support**: Methods can participate in transactions
