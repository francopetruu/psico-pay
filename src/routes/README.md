# Routes Module

This directory contains Express route definitions.

## Endpoints

### POST /webhook/mercadopago
Mercado Pago payment webhook handler.

**Behavior:**
1. Validate webhook signature
2. Respond 200 OK immediately
3. Process payment notification asynchronously
4. Update session payment status
5. Send confirmation message to patient

### GET /health
Health check endpoint for monitoring.

### GET /payment/success
Redirect destination after successful payment.

### GET /payment/failure
Redirect destination after failed payment.

### GET /payment/pending
Redirect destination for pending payments.

## Security

- Webhook signature validation (HMAC-SHA256)
- Rate limiting on all endpoints
- HTTPS required in production
