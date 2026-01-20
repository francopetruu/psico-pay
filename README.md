# PsicoPay

Automated payment collection system for remote therapy sessions with a management dashboard.

## Overview

PsicoPay automates the payment collection process for psychology sessions by:
- Monitoring Google Calendar for upcoming therapy sessions
- Sending payment reminders via WhatsApp 24 hours before sessions
- Processing payments through Mercado Pago
- Delivering Google Meet links only after payment confirmation
- Providing a management dashboard for therapists

## Features

- **Automated Payment Reminders**: 24-hour and 2-hour payment reminders via WhatsApp
- **Payment Verification**: Sessions only proceed after confirmed payment
- **Google Calendar Integration**: Automatic session detection from calendar events
- **WhatsApp Notifications**: Patient communication via Twilio
- **Mercado Pago Integration**: Secure payment processing with webhooks
- **Management Dashboard**: View sessions, patients, payments, and reports
- **Authentication**: Secure login with NextAuth.js
- **Analytics**: Revenue reports, payment status distribution, and trends

## How It Works

1. **Psychologist creates calendar event** with title "Sesion - [Patient Name]"
2. **Cron job detects session** and creates database record
3. **24h before**: Payment link sent via WhatsApp
4. **Patient pays**: Webhook confirms payment, confirmation sent
5. **15 min before**: Google Meet link sent to paid patients

## Tech Stack

| Component | Technology |
|-----------|------------|
| Monorepo | pnpm workspaces + Turborepo |
| Runtime | Node.js 20+ |
| Language | TypeScript 5.3+ |
| Database | PostgreSQL 15+ (Neon) |
| ORM | Drizzle ORM |
| API Server | Express.js |
| Dashboard | Next.js 14 (App Router) |
| UI | Tailwind CSS + shadcn/ui |
| API Layer | tRPC |
| Auth | NextAuth.js v5 |
| Charts | Recharts |
| Scheduler | node-cron |
| Logging | Pino |
| Calendar | Google Calendar API |
| Payments | Mercado Pago |
| Messaging | Twilio WhatsApp |

## Project Structure

```
psico-pay/
├── apps/
│   ├── api/                 # Express API + Cron jobs
│   │   ├── src/
│   │   │   ├── config/      # Environment validation
│   │   │   ├── lib/         # Logger, utilities
│   │   │   ├── repositories/# Data access layer
│   │   │   ├── services/    # Business logic
│   │   │   ├── jobs/        # Cron jobs
│   │   │   ├── routes/      # Express routes
│   │   │   └── types/       # TypeScript types
│   │   └── scripts/         # Admin scripts
│   │
│   └── web/                 # Next.js Dashboard
│       ├── src/
│       │   ├── app/         # App Router pages
│       │   ├── components/  # UI components
│       │   ├── lib/         # Utils, auth, db, trpc
│       │   └── server/      # tRPC routers
│       └── scripts/         # Admin scripts
│
├── packages/
│   └── db/                  # Shared Drizzle schemas
│       ├── src/
│       │   ├── schema/      # Database tables
│       │   └── migrations/  # SQL migrations
│       └── drizzle.config.ts
│
├── package.json             # Root workspace
├── pnpm-workspace.yaml
└── turbo.json
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (or Neon serverless)
- Google Cloud Project with Calendar API
- Mercado Pago Developer Account
- Twilio Account with WhatsApp

### Installation

```bash
# Clone the repository
git clone https://github.com/francopetruu/psico-pay.git
cd psico-pay

# Install pnpm if needed
npm install -g pnpm

# Install dependencies
pnpm install

# Copy environment templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Configure your credentials in .env files

# Apply database schema
pnpm db:push

# Start development (all apps)
pnpm dev

# Or start individually
pnpm dev:api   # API on port 3000
pnpm dev:web   # Dashboard on port 3001
```

### Create Admin User

```bash
cd apps/web
pnpm create-admin admin@psicopay.com yourpassword "Admin Name"
```

## Development

```bash
# Development with hot reload
pnpm dev

# Build all packages
pnpm build

# Build specific package
pnpm build:api
pnpm build:web

# Database management
pnpm db:generate  # Generate migration
pnpm db:push      # Apply schema
pnpm db:studio    # Visual DB browser

# Linting
pnpm lint
```

## Dashboard Features

### Sessions
- View all scheduled and completed sessions
- Filter by status, payment status, date
- Mark sessions as paid, completed, or cancelled

### Patients
- Patient directory with search
- Contact information and session history
- Total sessions and payments per patient

### Payments
- Monthly payment statistics
- Payment history with filtering
- Collection rate metrics

### Reports
- Revenue trends over time
- Payment status distribution (pie chart)
- Monthly revenue (line chart)
- Top patients by revenue

## Environment Variables

### API (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- `PORT`, `APP_URL`, `SESSION_PRICE`, `CRON_SCHEDULE`

### Web (.env)
- `DATABASE_URL` - PostgreSQL connection string
- `AUTH_SECRET` - NextAuth secret (generate with `openssl rand -base64 32`)
- `AUTH_URL` - Dashboard URL (http://localhost:3001)

## Deployment

### Vercel (Dashboard)
1. Import the repository to Vercel
2. Set root directory to `apps/web`
3. Configure environment variables
4. Deploy

### Fly.io (API)
See [Fly.io deployment guide](./apps/api/README.md)

### Manual
```bash
# Build
pnpm build

# Start API with PM2
cd apps/api && pm2 start dist/index.js --name psico-pay-api

# Dashboard (use Vercel or similar)
```

## Documentation

- [Phase 1 MVP Specification](./PHASE%201%20MVP.md)
- [Phase 2 Dashboard Specification](./PHASE%202%20Dashboard%20%26%20Management%20Syst.md)
- [Branching Strategy](./BRANCHING_STRATEGY.md)
- [Changelog](./CHANGELOG.md)

## License

MIT

## Author

Created by [francopetruu](https://github.com/francopetruu)
