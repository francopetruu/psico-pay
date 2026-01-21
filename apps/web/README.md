# @psico-pay/web

Next.js 14 dashboard for PsicoPay - the management interface for therapists to manage sessions, patients, payments, and view analytics.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **API**: tRPC for type-safe API routes
- **Auth**: NextAuth.js v5 (Credentials provider)
- **Database**: Drizzle ORM + PostgreSQL (Neon)
- **Charts**: Recharts
- **Testing**: Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (Neon recommended)

### Environment Variables

Create a `.env` file in this directory:

```env
# Database - Neon PostgreSQL
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# NextAuth
AUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32
AUTH_URL=http://localhost:3001
```

### Development

```bash
# From monorepo root
pnpm dev:web

# Or from this directory
pnpm dev
```

The dashboard will be available at http://localhost:3001

### Create Admin User

```bash
pnpm create-admin <email> <password> [name]

# Example
pnpm create-admin admin@psicopay.com mypassword123 "Dr. Smith"
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   │   └── login/         # Login page
│   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── sessions/      # Sessions management
│   │   ├── patients/      # Patients management
│   │   ├── payments/      # Payments overview
│   │   └── reports/       # Analytics & reports
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth endpoints
│   │   └── trpc/          # tRPC endpoint
│   └── layout.tsx         # Root layout
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard-specific components
│   └── providers/        # Context providers
│
├── lib/                  # Utilities
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Database connection
│   ├── trpc.ts          # tRPC client
│   └── utils.ts         # Helper functions
│
├── server/              # Server-side code
│   ├── trpc.ts         # tRPC router setup
│   └── routers/        # tRPC routers
│       ├── sessions.ts
│       ├── patients.ts
│       ├── payments.ts
│       └── reports.ts
│
└── test/               # Test utilities
    └── setup.ts       # Vitest setup
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm create-admin` | Create admin user |

## Testing

Tests are written using Vitest and React Testing Library.

```bash
# Run tests in watch mode
pnpm test

# Run tests once (for CI)
pnpm test:run

# Run with coverage
pnpm test:coverage
```

### Test Structure

- Unit tests are co-located with source files (`*.test.ts`, `*.test.tsx`)
- Test utilities in `src/test/setup.ts`

## Deployment

### Vercel (Recommended)

1. Import repository to Vercel
2. Set **Root Directory** to `apps/web`
3. Configure environment variables:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL` (your Vercel domain)
4. Deploy

### Vercel Configuration

The project includes automatic configuration for:
- Preview deployments for every PR
- Production deployment on main branch merge

## Features

### Sessions Management
- View all scheduled and completed sessions
- Filter by status, payment status, date range
- Mark sessions as paid, completed, or cancelled
- Add session notes

### Patients Management
- Patient directory with search
- Create, edit, delete patients
- View patient history and statistics
- Contact information management

### Payments Overview
- Monthly payment statistics
- Payment history with filtering
- Collection rate metrics
- Manual payment registration

### Reports & Analytics
- Revenue trends over time (line chart)
- Payment status distribution (pie chart)
- Monthly revenue breakdown
- Top patients by revenue
- Export to CSV

## Authentication

Uses NextAuth.js v5 with credentials provider:

- Email/password authentication
- Session-based auth with JWT
- Role-based access (admin, therapist)
- Protected routes via middleware

## API (tRPC)

Type-safe API using tRPC:

```typescript
// Client usage example
const { data } = trpc.sessions.list.useQuery({
  status: 'scheduled',
  page: 1,
  limit: 10,
});
```

### Available Routers

- `sessions` - CRUD for sessions
- `patients` - CRUD for patients
- `payments` - Payment queries and actions
- `reports` - Analytics and statistics
