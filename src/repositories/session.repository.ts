import { eq, and, between } from 'drizzle-orm';
import {
  type Database,
  sessions,
  patients,
  type Session,
  type NewSession,
  type Patient,
} from '../db/index.js';
import { logger } from '../lib/logger.js';

export interface SessionWithPatient extends Session {
  patient: Patient;
}

export interface SessionFilters {
  patientId?: string;
  paymentStatus?: Session['paymentStatus'];
  fromDate?: Date;
  toDate?: Date;
}

export class SessionRepository {
  constructor(private db: Database) {}

  /**
   * Find a session by ID.
   */
  async findById(id: string): Promise<Session | null> {
    const result = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find a session by calendar event ID (for deduplication).
   */
  async findByCalendarEventId(calendarEventId: string): Promise<Session | null> {
    const result = await this.db
      .select()
      .from(sessions)
      .where(eq(sessions.calendarEventId, calendarEventId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find a session with patient data.
   */
  async findByIdWithPatient(id: string): Promise<SessionWithPatient | null> {
    const result = await this.db
      .select()
      .from(sessions)
      .innerJoin(patients, eq(sessions.patientId, patients.id))
      .where(eq(sessions.id, id))
      .limit(1);

    if (!result[0]) return null;

    return {
      ...result[0].sessions,
      patient: result[0].patients,
    };
  }

  /**
   * Create a new session.
   */
  async create(data: NewSession): Promise<Session> {
    const result = await this.db
      .insert(sessions)
      .values(data)
      .returning();

    logger.info(
      {
        sessionId: result[0].id,
        calendarEventId: data.calendarEventId,
        scheduledAt: data.scheduledAt,
      },
      'Created new session'
    );

    return result[0];
  }

  /**
   * Update a session.
   */
  async update(id: string, data: Partial<NewSession>): Promise<Session | null> {
    const result = await this.db
      .update(sessions)
      .set(data)
      .where(eq(sessions.id, id))
      .returning();

    if (result[0]) {
      logger.debug({ sessionId: id, updates: Object.keys(data) }, 'Updated session');
    }

    return result[0] || null;
  }

  /**
   * Find or create a session by calendar event ID.
   */
  async findOrCreate(data: NewSession): Promise<{ session: Session; created: boolean }> {
    const existing = await this.findByCalendarEventId(data.calendarEventId);

    if (existing) {
      return { session: existing, created: false };
    }

    const created = await this.create(data);
    return { session: created, created: true };
  }

  /**
   * Get sessions within a time range with patient data.
   * Used by cron job to find sessions needing notifications.
   */
  async getSessionsInTimeRange(
    fromDate: Date,
    toDate: Date
  ): Promise<SessionWithPatient[]> {
    const result = await this.db
      .select()
      .from(sessions)
      .innerJoin(patients, eq(sessions.patientId, patients.id))
      .where(between(sessions.scheduledAt, fromDate, toDate))
      .orderBy(sessions.scheduledAt);

    return result.map((row) => ({
      ...row.sessions,
      patient: row.patients,
    }));
  }

  /**
   * Get sessions needing 24h reminder.
   */
  async getSessionsNeeding24hReminder(
    minMinutes: number,
    maxMinutes: number
  ): Promise<SessionWithPatient[]> {
    const now = new Date();
    const minTime = new Date(now.getTime() + minMinutes * 60 * 1000);
    const maxTime = new Date(now.getTime() + maxMinutes * 60 * 1000);

    const result = await this.db
      .select()
      .from(sessions)
      .innerJoin(patients, eq(sessions.patientId, patients.id))
      .where(
        and(
          between(sessions.scheduledAt, minTime, maxTime),
          eq(sessions.reminder24hSent, false)
        )
      )
      .orderBy(sessions.scheduledAt);

    return result.map((row) => ({
      ...row.sessions,
      patient: row.patients,
    }));
  }

  /**
   * Get sessions needing 2h reminder.
   */
  async getSessionsNeeding2hReminder(
    minMinutes: number,
    maxMinutes: number
  ): Promise<SessionWithPatient[]> {
    const now = new Date();
    const minTime = new Date(now.getTime() + minMinutes * 60 * 1000);
    const maxTime = new Date(now.getTime() + maxMinutes * 60 * 1000);

    const result = await this.db
      .select()
      .from(sessions)
      .innerJoin(patients, eq(sessions.patientId, patients.id))
      .where(
        and(
          between(sessions.scheduledAt, minTime, maxTime),
          eq(sessions.reminder24hSent, true),
          eq(sessions.reminder2hSent, false)
        )
      )
      .orderBy(sessions.scheduledAt);

    return result.map((row) => ({
      ...row.sessions,
      patient: row.patients,
    }));
  }

  /**
   * Get paid sessions needing Meet link (15 min before).
   */
  async getSessionsNeedingMeetLink(
    minMinutes: number,
    maxMinutes: number
  ): Promise<SessionWithPatient[]> {
    const now = new Date();
    const minTime = new Date(now.getTime() + minMinutes * 60 * 1000);
    const maxTime = new Date(now.getTime() + maxMinutes * 60 * 1000);

    const result = await this.db
      .select()
      .from(sessions)
      .innerJoin(patients, eq(sessions.patientId, patients.id))
      .where(
        and(
          between(sessions.scheduledAt, minTime, maxTime),
          eq(sessions.paymentStatus, 'paid'),
          eq(sessions.meetLinkSent, false)
        )
      )
      .orderBy(sessions.scheduledAt);

    return result.map((row) => ({
      ...row.sessions,
      patient: row.patients,
    }));
  }

  /**
   * Mark 24h reminder as sent.
   */
  async markReminder24hSent(id: string): Promise<void> {
    await this.update(id, { reminder24hSent: true });
  }

  /**
   * Mark 2h reminder as sent.
   */
  async markReminder2hSent(id: string): Promise<void> {
    await this.update(id, { reminder2hSent: true });
  }

  /**
   * Mark Meet link as sent.
   */
  async markMeetLinkSent(id: string): Promise<void> {
    await this.update(id, { meetLinkSent: true });
  }

  /**
   * Update payment status.
   */
  async updatePaymentStatus(
    id: string,
    status: Session['paymentStatus'],
    paymentId?: string
  ): Promise<Session | null> {
    return this.update(id, {
      paymentStatus: status,
      paymentId: paymentId,
    });
  }

  /**
   * List sessions with optional filters.
   */
  async list(filters?: SessionFilters): Promise<Session[]> {
    let query = this.db.select().from(sessions);

    // Apply filters if provided
    const conditions = [];

    if (filters?.patientId) {
      conditions.push(eq(sessions.patientId, filters.patientId));
    }

    if (filters?.paymentStatus) {
      conditions.push(eq(sessions.paymentStatus, filters.paymentStatus));
    }

    if (filters?.fromDate && filters?.toDate) {
      conditions.push(between(sessions.scheduledAt, filters.fromDate, filters.toDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    return query.orderBy(sessions.scheduledAt);
  }
}
