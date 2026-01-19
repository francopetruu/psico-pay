import { Router, Request, Response } from 'express';
import { logger } from '../lib/logger.js';
import { PaymentService } from '../services/index.js';
import { NotificationService } from '../services/index.js';
import { type Repositories } from '../repositories/index.js';

interface WebhookPayload {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

export function createWebhookRoutes(
  paymentService: PaymentService,
  notificationService: NotificationService,
  repositories: Repositories
): Router {
  const router = Router();

  /**
   * Mercado Pago webhook handler
   * POST /webhook/mercadopago
   */
  router.post('/mercadopago', async (req: Request, res: Response) => {
    const startTime = Date.now();

    // CRITICAL: Respond 200 immediately to prevent retries
    res.status(200).send('OK');

    // Process webhook asynchronously
    processWebhook(req.body, paymentService, notificationService, repositories).catch(
      (error) => {
        logger.error(
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            durationMs: Date.now() - startTime,
          },
          'Webhook processing failed'
        );
      }
    );
  });

  return router;
}

/**
 * Async webhook processing
 */
async function processWebhook(
  payload: WebhookPayload,
  paymentService: PaymentService,
  notificationService: NotificationService,
  repositories: Repositories
): Promise<void> {
  logger.info(
    {
      type: payload.type,
      action: payload.action,
      dataId: payload.data?.id,
    },
    'Processing Mercado Pago webhook'
  );

  // Only process payment notifications
  if (payload.type !== 'payment') {
    logger.debug({ type: payload.type }, 'Ignoring non-payment webhook');
    return;
  }

  // Extract payment ID
  const paymentId = parseInt(payload.data.id, 10);

  if (isNaN(paymentId)) {
    logger.error({ dataId: payload.data.id }, 'Invalid payment ID in webhook');
    return;
  }

  // Fetch payment details from Mercado Pago API
  const payment = await paymentService.getPaymentDetails(paymentId);

  if (!payment) {
    logger.error({ paymentId }, 'Could not fetch payment details');
    return;
  }

  // Only process approved payments
  if (!paymentService.isPaymentApproved(payment)) {
    logger.debug(
      { paymentId, status: payment.status },
      'Payment not approved, ignoring'
    );
    return;
  }

  // Extract session ID from external_reference
  const sessionId = payment.externalReference;

  if (!sessionId) {
    logger.error({ paymentId }, 'Payment has no external_reference (session ID)');
    return;
  }

  // Find session
  const session = await repositories.sessions.findByIdWithPatient(sessionId);

  if (!session) {
    logger.error(
      { sessionId, paymentId },
      'Session not found for payment - manual reconciliation needed'
    );
    return;
  }

  // Idempotency check - already processed?
  if (session.paymentStatus === 'paid') {
    logger.info(
      { sessionId, paymentId },
      'Payment already processed, skipping'
    );
    return;
  }

  // Update session payment status
  await repositories.sessions.updatePaymentStatus(
    sessionId,
    'paid',
    paymentId.toString()
  );

  logger.info(
    {
      sessionId,
      paymentId,
      amount: payment.transactionAmount,
      patientName: session.patient.name,
    },
    'Payment confirmed and session updated'
  );

  // Send confirmation message to patient
  if (
    session.patient.phone &&
    notificationService.isValidPhoneNumber(session.patient.phone)
  ) {
    const result = await notificationService.sendPaymentConfirmation(
      session.patient.phone,
      {
        patientName: session.patient.name,
        sessionDate: session.scheduledAt,
      }
    );

    // Log notification
    if (result.success) {
      await repositories.notifications.logSuccess(
        sessionId,
        'payment_confirmed',
        'whatsapp'
      );
      logger.info(
        { sessionId, patientName: session.patient.name },
        'Sent payment confirmation'
      );
    } else {
      await repositories.notifications.logFailure(
        sessionId,
        'payment_confirmed',
        result.error || 'Unknown error',
        'whatsapp'
      );
      logger.warn(
        { sessionId, error: result.error },
        'Failed to send payment confirmation'
      );
    }
  } else {
    logger.warn(
      { sessionId, patientId: session.patient.id },
      'Patient has no valid phone, skipping confirmation message'
    );
  }
}
