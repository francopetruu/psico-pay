import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';
import {
  CalendarService,
  PaymentService,
  NotificationService,
} from '../services/index.js';
import {
  type Repositories,
  type SessionWithPatient,
} from '../repositories/index.js';

interface SessionMonitorConfig {
  sessionPrice: number;
  reminder24hMin: number;
  reminder24hMax: number;
  reminder2hMin: number;
  reminder2hMax: number;
  meetLinkMin: number;
  meetLinkMax: number;
}

export class SessionMonitorJob {
  private config: SessionMonitorConfig;

  constructor(
    private calendarService: CalendarService,
    private paymentService: PaymentService,
    private notificationService: NotificationService,
    private repositories: Repositories,
    configOverrides?: Partial<SessionMonitorConfig>
  ) {
    this.config = {
      sessionPrice: configOverrides?.sessionPrice ?? 15000,
      reminder24hMin: configOverrides?.reminder24hMin ?? config.timing.reminder24h.min,
      reminder24hMax: configOverrides?.reminder24hMax ?? config.timing.reminder24h.max,
      reminder2hMin: configOverrides?.reminder2hMin ?? config.timing.reminder2h.min,
      reminder2hMax: configOverrides?.reminder2hMax ?? config.timing.reminder2h.max,
      meetLinkMin: configOverrides?.meetLinkMin ?? config.timing.meetLink.min,
      meetLinkMax: configOverrides?.meetLinkMax ?? config.timing.meetLink.max,
    };
  }

  /**
   * Main job execution - runs hourly.
   */
  async run(): Promise<void> {
    const startTime = Date.now();
    logger.info('Session monitor job started');

    try {
      // Step 1: Sync calendar events with database
      await this.syncCalendarEvents();

      // Step 2: Process 24h reminders
      await this.process24hReminders();

      // Step 3: Process 2h reminders
      await this.process2hReminders();

      // Step 4: Process Meet link delivery
      await this.processMeetLinkDelivery();

      const duration = Date.now() - startTime;
      logger.info({ durationMs: duration }, 'Session monitor job completed');
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Session monitor job failed'
      );
    }
  }

  /**
   * Step 1: Fetch calendar events and sync with database.
   */
  private async syncCalendarEvents(): Promise<void> {
    logger.debug('Syncing calendar events...');

    try {
      // Fetch events from Google Calendar (next 48 hours)
      const events = await this.calendarService.getUpcomingEvents(
        config.calendar.lookAheadHours
      );

      // Filter for therapy sessions
      const therapySessions = this.calendarService.filterTherapySessions(events);

      logger.info(
        { total: events.length, therapySessions: therapySessions.length },
        'Fetched calendar events'
      );

      // Process each session
      for (const event of therapySessions) {
        try {
          await this.processCalendarEvent(event);
        } catch (error) {
          logger.error(
            {
              eventId: event.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            'Failed to process calendar event'
          );
          // Continue processing other events
        }
      }
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Failed to sync calendar events'
      );
    }
  }

  /**
   * Process a single calendar event - create/update session and patient.
   */
  private async processCalendarEvent(event: {
    id: string;
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    meetLink?: string;
  }): Promise<void> {
    // Parse session info from event
    const sessionInfo = this.calendarService.parseSessionInfo(event);

    if (!sessionInfo) {
      logger.debug({ eventId: event.id }, 'Could not parse session info');
      return;
    }

    // Find or create patient
    const { patient, created: patientCreated } =
      await this.repositories.patients.findOrCreateByName({
        name: sessionInfo.patientName,
        phone: sessionInfo.patientPhone || '',
      });

    if (patientCreated) {
      logger.info(
        { patientId: patient.id, name: patient.name },
        'Created new patient from calendar'
      );
    }

    // Find or create session
    const { session, created: sessionCreated } =
      await this.repositories.sessions.findOrCreate({
        patientId: patient.id,
        calendarEventId: sessionInfo.calendarEventId,
        scheduledAt: sessionInfo.scheduledAt,
        durationMinutes: sessionInfo.durationMinutes,
        amount: this.config.sessionPrice.toString(),
        meetLink: sessionInfo.meetLink,
      });

    if (sessionCreated) {
      logger.info(
        {
          sessionId: session.id,
          patientName: patient.name,
          scheduledAt: sessionInfo.scheduledAt,
        },
        'Created new session from calendar'
      );
    }
  }

  /**
   * Step 2: Send 24h payment reminders.
   */
  private async process24hReminders(): Promise<void> {
    logger.debug('Processing 24h reminders...');

    try {
      const sessions = await this.repositories.sessions.getSessionsNeeding24hReminder(
        this.config.reminder24hMin,
        this.config.reminder24hMax
      );

      logger.info({ count: sessions.length }, 'Sessions needing 24h reminder');

      for (const session of sessions) {
        try {
          await this.send24hReminder(session);
        } catch (error) {
          logger.error(
            {
              sessionId: session.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            'Failed to send 24h reminder'
          );
        }
      }
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Failed to process 24h reminders'
      );
    }
  }

  /**
   * Send 24h reminder with payment link.
   */
  private async send24hReminder(session: SessionWithPatient): Promise<void> {
    const { patient } = session;

    // Validate phone number
    if (!patient.phone || !this.notificationService.isValidPhoneNumber(patient.phone)) {
      logger.warn(
        { sessionId: session.id, patientId: patient.id },
        'Patient has no valid phone number, skipping 24h reminder'
      );
      await this.repositories.sessions.markReminder24hSent(session.id);
      return;
    }

    // Create payment preference
    const preferenceResult = await this.paymentService.createPaymentPreference({
      sessionId: session.id,
      patientName: patient.name,
      amount: parseFloat(session.amount),
      sessionDate: session.scheduledAt,
    });

    // Save payment preference
    await this.repositories.paymentPreferences.create({
      sessionId: session.id,
      mpPreferenceId: preferenceResult.preferenceId,
      paymentLink: preferenceResult.paymentLink,
      expiresAt: preferenceResult.expiresAt,
    });

    // Send WhatsApp message
    const result = await this.notificationService.sendPaymentReminder(patient.phone, {
      patientName: patient.name,
      sessionDate: session.scheduledAt,
      paymentLink: preferenceResult.paymentLink,
    });

    // Log notification
    if (result.success) {
      await this.repositories.notifications.logSuccess(
        session.id,
        'reminder_24h',
        'whatsapp'
      );
      logger.info(
        { sessionId: session.id, patientName: patient.name },
        'Sent 24h payment reminder'
      );
    } else {
      await this.repositories.notifications.logFailure(
        session.id,
        'reminder_24h',
        result.error || 'Unknown error',
        'whatsapp'
      );
    }

    // Mark reminder as sent (even if failed, to prevent infinite retries)
    await this.repositories.sessions.markReminder24hSent(session.id);
  }

  /**
   * Step 3: Send 2h reminders (different for paid vs pending).
   */
  private async process2hReminders(): Promise<void> {
    logger.debug('Processing 2h reminders...');

    try {
      const sessions = await this.repositories.sessions.getSessionsNeeding2hReminder(
        this.config.reminder2hMin,
        this.config.reminder2hMax
      );

      logger.info({ count: sessions.length }, 'Sessions needing 2h reminder');

      for (const session of sessions) {
        try {
          await this.send2hReminder(session);
        } catch (error) {
          logger.error(
            {
              sessionId: session.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            'Failed to send 2h reminder'
          );
        }
      }
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Failed to process 2h reminders'
      );
    }
  }

  /**
   * Send 2h reminder - late payment or courtesy depending on status.
   */
  private async send2hReminder(session: SessionWithPatient): Promise<void> {
    const { patient } = session;

    // Validate phone number
    if (!patient.phone || !this.notificationService.isValidPhoneNumber(patient.phone)) {
      logger.warn(
        { sessionId: session.id, patientId: patient.id },
        'Patient has no valid phone number, skipping 2h reminder'
      );
      await this.repositories.sessions.markReminder2hSent(session.id);
      return;
    }

    const sessionTime = format(session.scheduledAt, 'HH:mm', { locale: es });
    let result;

    if (session.paymentStatus === 'paid') {
      // Courtesy reminder for paid sessions
      result = await this.notificationService.sendCourtesyReminder(patient.phone, {
        patientName: patient.name,
        sessionTime,
      });
    } else {
      // Late payment reminder for pending sessions
      const preference = await this.repositories.paymentPreferences.findBySessionId(
        session.id
      );

      if (!preference) {
        logger.warn(
          { sessionId: session.id },
          'No payment preference found for late reminder'
        );
        await this.repositories.sessions.markReminder2hSent(session.id);
        return;
      }

      result = await this.notificationService.sendLatePaymentReminder(patient.phone, {
        patientName: patient.name,
        sessionTime,
        paymentLink: preference.paymentLink,
      });
    }

    // Log notification
    if (result.success) {
      await this.repositories.notifications.logSuccess(
        session.id,
        'reminder_2h',
        'whatsapp'
      );
      logger.info(
        { sessionId: session.id, patientName: patient.name, paid: session.paymentStatus === 'paid' },
        'Sent 2h reminder'
      );
    } else {
      await this.repositories.notifications.logFailure(
        session.id,
        'reminder_2h',
        result.error || 'Unknown error',
        'whatsapp'
      );
    }

    // Mark reminder as sent
    await this.repositories.sessions.markReminder2hSent(session.id);
  }

  /**
   * Step 4: Send Meet links to paid sessions.
   */
  private async processMeetLinkDelivery(): Promise<void> {
    logger.debug('Processing Meet link delivery...');

    try {
      const sessions = await this.repositories.sessions.getSessionsNeedingMeetLink(
        this.config.meetLinkMin,
        this.config.meetLinkMax
      );

      logger.info({ count: sessions.length }, 'Sessions needing Meet link');

      for (const session of sessions) {
        try {
          await this.sendMeetLink(session);
        } catch (error) {
          logger.error(
            {
              sessionId: session.id,
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            'Failed to send Meet link'
          );
        }
      }
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Failed to process Meet link delivery'
      );
    }
  }

  /**
   * Send Meet link to patient.
   */
  private async sendMeetLink(session: SessionWithPatient): Promise<void> {
    const { patient } = session;

    // Validate preconditions
    if (!patient.phone || !this.notificationService.isValidPhoneNumber(patient.phone)) {
      logger.warn(
        { sessionId: session.id, patientId: patient.id },
        'Patient has no valid phone number, skipping Meet link'
      );
      await this.repositories.sessions.markMeetLinkSent(session.id);
      return;
    }

    if (!session.meetLink) {
      logger.error(
        { sessionId: session.id },
        'Session has no Meet link, cannot send'
      );
      await this.repositories.sessions.markMeetLinkSent(session.id);
      return;
    }

    // Send Meet link
    const result = await this.notificationService.sendMeetLink(patient.phone, {
      patientName: patient.name,
      meetLink: session.meetLink,
    });

    // Log notification
    if (result.success) {
      await this.repositories.notifications.logSuccess(
        session.id,
        'meet_link',
        'whatsapp'
      );
      logger.info(
        { sessionId: session.id, patientName: patient.name },
        'Sent Meet link'
      );
    } else {
      await this.repositories.notifications.logFailure(
        session.id,
        'meet_link',
        result.error || 'Unknown error',
        'whatsapp'
      );
    }

    // Mark as sent
    await this.repositories.sessions.markMeetLinkSent(session.id);
  }
}

/**
 * Factory function to create SessionMonitorJob with dependencies.
 */
export function createSessionMonitorJob(
  calendarService: CalendarService,
  paymentService: PaymentService,
  notificationService: NotificationService,
  repositories: Repositories,
  config?: Partial<SessionMonitorConfig>
): SessionMonitorJob {
  return new SessionMonitorJob(
    calendarService,
    paymentService,
    notificationService,
    repositories,
    config
  );
}
