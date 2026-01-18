# PsicoPay

Automated payment collection system for remote therapy sessions.

## Overview

PsicoPay automates the payment collection process for psychology sessions by:
- Monitoring Google Calendar for upcoming therapy sessions
- Sending payment reminders via WhatsApp 24 hours before sessions
- Processing payments through Mercado Pago
- Delivering Google Meet links only after payment confirmation

## Features

- **Automated Payment Reminders**: 24-hour and 2-hour payment reminders
- **Payment Verification**: Sessions only proceed after confirmed payment
- **Google Calendar Integration**: Automatic session detection
- **WhatsApp Notifications**: Patient communication via Twilio
- **Mercado Pago Integration**: Secure payment processing

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.3+
- **Database**: PostgreSQL 15+ with Drizzle ORM
- **Web Framework**: Express.js
- **Scheduler**: node-cron
- **Logging**: Pino

## Project Structure

```
src/
├── config/         # Environment and app configuration
├── db/             # Database schema and connection
├── lib/            # Shared utilities (logger, etc.)
├── repositories/   # Data access layer
├── services/       # Business logic services
├── jobs/           # Cron job definitions
├── routes/         # Express routes (webhooks)
└── types/          # TypeScript type definitions
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Google Cloud Project (Calendar API)
- Mercado Pago Account
- Twilio Account (WhatsApp)

### Installation

```bash
# Clone the repository
git clone https://github.com/francopetruu/psico-pay.git
cd psico-pay

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure environment variables
# Edit .env with your credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

See `.env.example` for all required configuration variables.

## Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Start production server
npm start
```

## Documentation

- [Phase 1 MVP Specification](./PHASE%201%20MVP.md)
- [Branching Strategy](./BRANCHING_STRATEGY.md)
- [Changelog](./CHANGELOG.md)

## License

MIT
