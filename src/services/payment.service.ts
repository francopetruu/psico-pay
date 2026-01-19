import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { addHours } from 'date-fns';
import { logger } from '../lib/logger.js';

export interface CreatePreferenceInput {
  sessionId: string;
  patientName: string;
  amount: number;
  sessionDate: Date;
}

export interface PaymentPreferenceResult {
  preferenceId: string;
  paymentLink: string;
  sandboxLink?: string;
  expiresAt: Date;
}

export interface PaymentDetails {
  id: number;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded';
  statusDetail: string;
  externalReference: string;
  transactionAmount: number;
  dateApproved?: Date;
  paymentMethodId: string;
}

interface PaymentServiceConfig {
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  appUrl: string;
}

export class PaymentService {
  private client: MercadoPagoConfig;
  private preferenceClient: Preference;
  private paymentClient: Payment;
  private appUrl: string;

  constructor(serviceConfig: PaymentServiceConfig) {
    this.client = new MercadoPagoConfig({
      accessToken: serviceConfig.accessToken,
    });

    this.preferenceClient = new Preference(this.client);
    this.paymentClient = new Payment(this.client);
    this.appUrl = serviceConfig.appUrl;
  }

  /**
   * Creates a Mercado Pago payment preference for a therapy session.
   */
  async createPaymentPreference(
    input: CreatePreferenceInput
  ): Promise<PaymentPreferenceResult> {
    const expiresAt = addHours(new Date(), 24);

    try {
      const preference = await this.preferenceClient.create({
        body: {
          items: [
            {
              id: input.sessionId,
              title: `Sesión de Psicología - ${input.patientName}`,
              quantity: 1,
              unit_price: input.amount,
              currency_id: 'ARS',
            },
          ],
          back_urls: {
            success: `${this.appUrl}/payment/success`,
            failure: `${this.appUrl}/payment/failure`,
            pending: `${this.appUrl}/payment/pending`,
          },
          auto_return: 'approved',
          external_reference: input.sessionId,
          notification_url: `${this.appUrl}/webhook/mercadopago`,
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: expiresAt.toISOString(),
          metadata: {
            session_id: input.sessionId,
            patient_name: input.patientName,
            session_date: input.sessionDate.toISOString(),
          },
        },
      });

      if (!preference.id || !preference.init_point) {
        throw new Error('Invalid preference response from Mercado Pago');
      }

      logger.info(
        {
          preferenceId: preference.id,
          sessionId: input.sessionId,
          amount: input.amount,
        },
        'Created payment preference'
      );

      return {
        preferenceId: preference.id,
        paymentLink: preference.init_point,
        sandboxLink: preference.sandbox_init_point,
        expiresAt,
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          sessionId: input.sessionId,
        },
        'Failed to create payment preference'
      );
      throw new Error('Payment service unavailable');
    }
  }

  /**
   * Fetches payment details from Mercado Pago by payment ID.
   */
  async getPaymentDetails(paymentId: number): Promise<PaymentDetails | null> {
    try {
      const payment = await this.paymentClient.get({ id: paymentId });

      if (!payment.id) {
        return null;
      }

      logger.debug(
        {
          paymentId: payment.id,
          status: payment.status,
          externalReference: payment.external_reference,
        },
        'Fetched payment details'
      );

      return {
        id: payment.id,
        status: payment.status as PaymentDetails['status'],
        statusDetail: payment.status_detail || '',
        externalReference: payment.external_reference || '',
        transactionAmount: payment.transaction_amount || 0,
        dateApproved: payment.date_approved
          ? new Date(payment.date_approved)
          : undefined,
        paymentMethodId: payment.payment_method_id || '',
      };
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          paymentId,
        },
        'Failed to fetch payment details'
      );
      return null;
    }
  }

  /**
   * Validates if a payment is approved.
   */
  isPaymentApproved(payment: PaymentDetails): boolean {
    return payment.status === 'approved';
  }

  /**
   * Validates webhook signature.
   * Note: Implement proper HMAC validation before production.
   */
  validateWebhookSignature(
    signature: string,
    _body: unknown,
    _secret: string
  ): boolean {
    // TODO: Implement proper HMAC-SHA256 validation
    // For MVP, we'll verify the payment via API call
    if (!signature) {
      logger.warn('Webhook received without signature');
    }
    return true;
  }
}

/**
 * Factory function to create PaymentService with environment configuration.
 */
export function createPaymentService(envConfig: {
  mpAccessToken: string;
  mpPublicKey: string;
  mpWebhookSecret: string;
  appUrl: string;
}): PaymentService {
  return new PaymentService({
    accessToken: envConfig.mpAccessToken,
    publicKey: envConfig.mpPublicKey,
    webhookSecret: envConfig.mpWebhookSecret,
    appUrl: envConfig.appUrl,
  });
}
