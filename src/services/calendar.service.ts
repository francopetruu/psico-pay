import { google, calendar_v3 } from 'googleapis';
import { addHours } from 'date-fns';
import { logger } from '../lib/logger.js';
import { config } from '../config/index.js';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  meetLink?: string;
}

export interface ParsedSessionInfo {
  patientName: string;
  patientPhone?: string;
  meetLink?: string;
  scheduledAt: Date;
  durationMinutes: number;
  calendarEventId: string;
}

interface CalendarServiceConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
}

export class CalendarService {
  private calendar: calendar_v3.Calendar;
  private calendarId: string;

  constructor(serviceConfig: CalendarServiceConfig) {
    const oauth2Client = new google.auth.OAuth2(
      serviceConfig.clientId,
      serviceConfig.clientSecret
    );

    oauth2Client.setCredentials({
      refresh_token: serviceConfig.refreshToken,
    });

    this.calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    this.calendarId = serviceConfig.calendarId;
  }

  /**
   * Fetches upcoming events from Google Calendar within the specified time range.
   * Default: next 48 hours
   */
  async getUpcomingEvents(hoursAhead: number = 48): Promise<CalendarEvent[]> {
    const now = new Date();
    const timeMax = addHours(now, hoursAhead);

    try {
      const response = await this.calendar.events.list({
        calendarId: this.calendarId,
        timeMin: now.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 50,
      });

      const events = response.data.items || [];

      logger.debug(
        { count: events.length, hoursAhead },
        'Fetched calendar events'
      );

      return events.map((event) => this.mapToCalendarEvent(event));
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        'Failed to fetch calendar events'
      );
      throw new Error('Calendar service unavailable');
    }
  }

  /**
   * Filters events to only include therapy sessions based on title pattern.
   */
  filterTherapySessions(events: CalendarEvent[]): CalendarEvent[] {
    return events.filter((event) => {
      // Must contain "Sesión" or "Sesion" (case insensitive)
      if (!config.calendar.sessionTitlePattern.test(event.summary)) {
        return false;
      }

      // Must have a Meet link
      if (!event.meetLink) {
        logger.debug(
          { eventId: event.id, summary: event.summary },
          'Skipping event without Meet link'
        );
        return false;
      }

      // Duration must be within valid range
      const durationMinutes = this.calculateDuration(
        event.startTime,
        event.endTime
      );
      if (
        durationMinutes < config.calendar.minDurationMinutes ||
        durationMinutes > config.calendar.maxDurationMinutes
      ) {
        logger.debug(
          { eventId: event.id, durationMinutes },
          'Skipping event with invalid duration'
        );
        return false;
      }

      return true;
    });
  }

  /**
   * Parses a calendar event to extract session information.
   */
  parseSessionInfo(event: CalendarEvent): ParsedSessionInfo | null {
    const patientName = this.extractPatientName(event.summary);

    if (!patientName) {
      logger.warn(
        { eventId: event.id, summary: event.summary },
        'Could not extract patient name from event'
      );
      return null;
    }

    const patientPhone = event.description
      ? this.extractPhoneNumber(event.description)
      : undefined;

    const durationMinutes = this.calculateDuration(
      event.startTime,
      event.endTime
    );

    return {
      patientName,
      patientPhone,
      meetLink: event.meetLink,
      scheduledAt: event.startTime,
      durationMinutes,
      calendarEventId: event.id,
    };
  }

  /**
   * Extracts patient name from event title.
   * Expected format: "Sesión - Patient Name" or "Sesión: Patient Name"
   */
  private extractPatientName(summary: string): string | null {
    // Pattern: "Sesión" followed by separator (- or :) and name
    const pattern = /sesi[oó]n\s*[-:]\s*(.+)/i;
    const match = summary.match(pattern);

    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  }

  /**
   * Extracts phone number in E.164 format from text.
   */
  private extractPhoneNumber(text: string): string | undefined {
    // E.164 format: + followed by 1-15 digits
    const pattern = /\+[1-9]\d{1,14}/;
    const match = text.match(pattern);

    if (match && config.phone.pattern.test(match[0])) {
      return match[0];
    }

    return undefined;
  }

  /**
   * Calculates duration in minutes between two dates.
   */
  private calculateDuration(start: Date, end: Date): number {
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  }

  /**
   * Maps Google Calendar API event to our CalendarEvent type.
   */
  private mapToCalendarEvent(event: calendar_v3.Schema$Event): CalendarEvent {
    const startTime = event.start?.dateTime
      ? new Date(event.start.dateTime)
      : new Date(event.start?.date || '');

    const endTime = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : new Date(event.end?.date || '');

    // Extract Meet link from hangoutLink or conferenceData
    let meetLink = event.hangoutLink;
    if (!meetLink && event.conferenceData?.entryPoints) {
      const videoEntry = event.conferenceData.entryPoints.find(
        (ep) => ep.entryPointType === 'video'
      );
      meetLink = videoEntry?.uri;
    }

    return {
      id: event.id || '',
      summary: event.summary || '',
      description: event.description || undefined,
      startTime,
      endTime,
      meetLink: meetLink || undefined,
    };
  }
}

/**
 * Factory function to create CalendarService with environment configuration.
 */
export function createCalendarService(envConfig: {
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  googleCalendarId: string;
}): CalendarService {
  return new CalendarService({
    clientId: envConfig.googleClientId,
    clientSecret: envConfig.googleClientSecret,
    refreshToken: envConfig.googleRefreshToken,
    calendarId: envConfig.googleCalendarId,
  });
}
