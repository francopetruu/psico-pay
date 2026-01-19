# PsicoPay

Automated payment collection system for remote therapy sessions.

## Overview

PsicoPay automates the payment collection process for psychology sessions by:
- Monitoring Google Calendar for upcoming therapy sessions
- Sending payment reminders via WhatsApp 24 hours before sessions
- Processing payments through Mercado Pago
- Delivering Google Meet links only after payment confirmation

## Features

- **Automated Payment Reminders**: 24-hour and 2-hour payment reminders via WhatsApp
- **Payment Verification**: Sessions only proceed after confirmed payment
- **Google Calendar Integration**: Automatic session detection from calendar events
- **WhatsApp Notifications**: Patient communication via Twilio
- **Mercado Pago Integration**: Secure payment processing with webhooks
- **Audit Logging**: Complete notification history for tracking

## How It Works

1. **Psychologist creates calendar event** with title "Sesión - [Patient Name]"
2. **Cron job detects session** and creates database record
3. **24h before**: Payment link sent via WhatsApp
4. **Patient pays**: Webhook confirms payment, confirmation sent
5. **15 min before**: Google Meet link sent to paid patients

## Tech Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5.3+ |
| Database | PostgreSQL 15+ |
| ORM | Drizzle ORM |
| Web Framework | Express.js |
| Scheduler | node-cron |
| Logging | Pino |
| Calendar | Google Calendar API |
| Payments | Mercado Pago |
| Messaging | Twilio WhatsApp |

## Project Structure

```
src/
├── config/         # Environment validation and app config
├── db/             # Database schema (Drizzle) and connection
├── lib/            # Shared utilities (logger)
├── repositories/   # Data access layer (Repository pattern)
├── services/       # Business logic (Calendar, Payment, Notification)
├── jobs/           # Cron job (SessionMonitor, Scheduler)
├── routes/         # Express routes (webhooks, health)
├── types/          # TypeScript type definitions
├── index.ts        # Application entry point
└── server.ts       # Express server setup
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Google Cloud Project with Calendar API enabled
- Mercado Pago Developer Account
- Twilio Account with WhatsApp enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/francopetruu/psico-pay.git
cd psico-pay

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your credentials in .env

# Generate database migration
npm run db:generate

# Apply migration to database
npm run db:push

# Start development server
npm run dev
```

### External Services Setup

#### Google Calendar API
1. Create project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Generate refresh token using OAuth playground
5. Add credentials to `.env`

#### Mercado Pago
1. Create developer account at [Mercado Pago Developers](https://www.mercadopago.com.ar/developers/)
2. Get sandbox/production credentials
3. Configure webhook URL: `https://yourdomain.com/webhook/mercadopago`
4. Add credentials to `.env`

#### Twilio WhatsApp
1. Create account at [Twilio](https://www.twilio.com/)
2. Enable WhatsApp sandbox or production number
3. Join sandbox (for development): Send "join [keyword]" to sandbox number
4. Add credentials to `.env`

### Calendar Event Format

Events must follow this format to be detected:
- **Title**: `Sesión - Patient Name` (case insensitive)
- **Description**: Include patient phone in E.164 format (+5491112345678)
- **Google Meet**: Must have Meet link enabled
- **Duration**: 30-90 minutes

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/webhook/mercadopago` | Payment webhook |
| GET | `/payment/success` | Payment success redirect |
| GET | `/payment/failure` | Payment failure redirect |
| GET | `/payment/pending` | Payment pending redirect |

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database management
npm run db:generate  # Generate migration
npm run db:push      # Apply schema
npm run db:studio    # Visual DB browser
```

## Environment Variables

See [.env.example](./.env.example) for all required variables:

- **Database**: `DATABASE_URL`
- **Google**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- **Mercado Pago**: `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`
- **Twilio**: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- **App**: `PORT`, `APP_URL`, `SESSION_PRICE`, `CRON_SCHEDULE`

## Documentation

- [Phase 1 MVP Specification](./PHASE%201%20MVP.md) - Complete technical spec
- [Branching Strategy](./BRANCHING_STRATEGY.md) - Git workflow
- [Changelog](./CHANGELOG.md) - Version history

### Module Documentation
- [Database Schema](./src/db/README.md)
- [Services](./src/services/README.md)
- [Repositories](./src/repositories/README.md)
- [Jobs](./src/jobs/README.md)
- [Routes](./src/routes/README.md)

## Deployment

### Railway/Render (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Configure PostgreSQL add-on
4. Deploy

### Manual (VPS)
```bash
# Build
npm run build

# Start with PM2
pm2 start dist/index.js --name psico-pay
```

## License

MIT

## Author

Created by [francopetruu](https://github.com/francopetruu)
