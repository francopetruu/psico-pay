import twilio from 'twilio';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logger } from '../lib/logger.js';

export interface SendMessageInput {
  to: string;
  body: string;
}

export interface SendMessageResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

export interface PaymentReminderData {
  patientName: string;
  sessionDate: Date;
  paymentLink: string;
}

export interface PaymentConfirmationData {
  patientName: string;
  sessionDate: Date;
}

export interface MeetLinkData {
  patientName: string;
  meetLink: string;
}

export interface LateReminderData {
  patientName: string;
  sessionTime: string;
  paymentLink: string;
}

export interface CourtesyReminderData {
  patientName: string;
  sessionTime: string;
}

interface NotificationServiceConfig {
  accountSid: string;
  authToken: string;
  whatsappNumber: string;
}

export class NotificationService {
  private client: twilio.Twilio;
  private fromNumber: string;

  constructor(serviceConfig: NotificationServiceConfig) {
    this.client = twilio(serviceConfig.accountSid, serviceConfig.authToken);
    this.fromNumber = serviceConfig.whatsappNumber;
  }

  /**
   * Sends a WhatsApp message via Twilio.
   */
  async sendWhatsAppMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const toNumber = input.to.startsWith('whatsapp:')
      ? input.to
      : `whatsapp:${input.to}`;

    try {
      const message = await this.client.messages.create({
        from: this.fromNumber,
        to: toNumber,
        body: input.body,
      });

      logger.info(
        {
          messageSid: message.sid,
          to: this.maskPhone(input.to),
          status: message.status,
        },
        'WhatsApp message sent'
      );

      return {
        success: true,
        messageSid: message.sid,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error(
        {
          error: errorMessage,
          to: this.maskPhone(input.to),
        },
        'Failed to send WhatsApp message'
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Sends 24h payment reminder with payment link.
   */
  async sendPaymentReminder(
    phone: string,
    data: PaymentReminderData
  ): Promise<SendMessageResult> {
    const formattedDate = this.formatSessionDate(data.sessionDate);

    const message = `Hola ${data.patientName}!

Tienes sesión programada para el ${formattedDate}.

Para confirmar tu asistencia, completa el pago en el siguiente enlace:
${data.paymentLink}

Una vez confirmado el pago, recibirás el link de videollamada 15 minutos antes. ¡Gracias!`;

    return this.sendWhatsAppMessage({ to: phone, body: message });
  }

  /**
   * Sends payment confirmation message.
   */
  async sendPaymentConfirmation(
    phone: string,
    data: PaymentConfirmationData
  ): Promise<SendMessageResult> {
    const formattedDate = this.formatSessionDate(data.sessionDate);

    const message = `¡Pago confirmado!

Gracias ${data.patientName}. Tu sesión del ${formattedDate} está confirmada.

Recibirás el link de videollamada 15 minutos antes de comenzar.`;

    return this.sendWhatsAppMessage({ to: phone, body: message });
  }

  /**
   * Sends Google Meet link 15 minutes before session.
   */
  async sendMeetLink(
    phone: string,
    data: MeetLinkData
  ): Promise<SendMessageResult> {
    const message = `Hola ${data.patientName}!

Tu sesión comienza en 15 minutos.

Ingresa aquí:
${data.meetLink}

¡Te esperamos!`;

    return this.sendWhatsAppMessage({ to: phone, body: message });
  }

  /**
   * Sends late payment reminder (2h before, payment still pending).
   */
  async sendLatePaymentReminder(
    phone: string,
    data: LateReminderData
  ): Promise<SendMessageResult> {
    const message = `Hola ${data.patientName},

Tu sesión está programada para ${data.sessionTime}.

Para acceder a la videollamada, necesitas completar el pago:
${data.paymentLink}

El link de videollamada se enviará automáticamente al confirmar el pago.`;

    return this.sendWhatsAppMessage({ to: phone, body: message });
  }

  /**
   * Sends courtesy reminder (2h before, already paid).
   */
  async sendCourtesyReminder(
    phone: string,
    data: CourtesyReminderData
  ): Promise<SendMessageResult> {
    const message = `Hola ${data.patientName}!

Tu sesión comienza en 2 horas (${data.sessionTime}).

Recibirás el link de videollamada 15 minutos antes. ¡Nos vemos pronto!`;

    return this.sendWhatsAppMessage({ to: phone, body: message });
  }

  /**
   * Validates phone number is in E.164 format.
   */
  isValidPhoneNumber(phone: string): boolean {
    const pattern = /^\+[1-9]\d{1,14}$/;
    return pattern.test(phone);
  }

  /**
   * Formats session date in Spanish locale.
   */
  private formatSessionDate(date: Date): string {
    return format(date, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es });
  }

  /**
   * Masks phone number for logging (privacy).
   */
  private maskPhone(phone: string): string {
    if (phone.length < 8) return '****';
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  }
}

/**
 * Factory function to create NotificationService with environment configuration.
 */
export function createNotificationService(envConfig: {
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsappNumber: string;
}): NotificationService {
  return new NotificationService({
    accountSid: envConfig.twilioAccountSid,
    authToken: envConfig.twilioAuthToken,
    whatsappNumber: envConfig.twilioWhatsappNumber,
  });
}
