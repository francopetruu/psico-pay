# Database Module

This directory contains the database schema and connection configuration.

## Files

### schema.ts
Drizzle ORM schema definitions for all tables:
- `patients` - Patient contact information
- `sessions` - Therapy sessions with payment tracking
- `paymentPreferences` - Mercado Pago payment links
- `notifications` - Notification audit log

### index.ts
Database connection and Drizzle client initialization.

## Migrations

Migrations are generated and managed by Drizzle Kit:

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Open Drizzle Studio for visual DB management
npm run db:studio
```

## Schema Conventions

- All tables use UUID primary keys
- Timestamps: `createdAt`, `updatedAt`
- Foreign keys use CASCADE DELETE
- Indexes on frequently queried columns
