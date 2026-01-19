# Routes Module

This directory contains Express route definitions for PsicoPay.

## Endpoints

### Health (`health.routes.ts`)
**Status: Implemented**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check endpoint |

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-18T00:00:00.000Z",
  "uptime": 3600
}
```

### Payment (`payment.routes.ts`)
**Status: Implemented**

Mercado Pago redirect endpoints after payment completion.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/payment/success` | Successful payment redirect |
| GET | `/payment/failure` | Failed payment redirect |
| GET | `/payment/pending` | Pending payment redirect |

Each endpoint displays a styled HTML page with appropriate messaging.

### Webhook (`webhook.routes.ts`)
**Status: Implemented**

Mercado Pago webhook handler for payment notifications.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook/mercadopago` | Payment notification webhook |

**Behavior:**
1. Responds 200 OK immediately (required by MP)
2. Processes webhook asynchronously
3. Validates payment type (only `payment`)
4. Fetches payment details from MP API
5. Verifies payment is `approved`
6. Updates session payment status
7. Sends WhatsApp confirmation to patient
8. Logs notification result

**Security:**
- TODO: HMAC signature validation before production
- Idempotency check (prevents duplicate processing)

## Server Setup

```typescript
import { createServer, startServer } from './server.js';

const app = createServer(
  {
    paymentService,
    notificationService,
    repositories,
  },
  { port: 3000 }
);

await startServer(app, { port: 3000 });
```

## Request Logging

All requests are logged with:
- Method
- Path
- Status code
- Duration (ms)
