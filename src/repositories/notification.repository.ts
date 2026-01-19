import { eq, and, desc } from 'drizzle-orm';
import {
  type Database,
  notifications,
  type Notification,
  type NewNotification,
} from '../db/index.js';
import { logger } from '../lib/logger.js';

export class NotificationRepository {
  constructor(private db: Database) {}

  /**
   * Find a notification by ID.
   */
  async findById(id: string): Promise<Notification | null> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find all notifications for a session.
   */
  async findBySessionId(sessionId: string): Promise<Notification[]> {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.sessionId, sessionId))
      .orderBy(desc(notifications.createdAt));
  }

  /**
   * Create a notification log entry.
   */
  async create(data: NewNotification): Promise<Notification> {
    const result = await this.db
      .insert(notifications)
      .values(data)
      .returning();

    logger.debug(
      {
        notificationId: result[0].id,
        sessionId: data.sessionId,
        type: data.type,
        channel: data.channel,
        status: data.status,
      },
      'Created notification log'
    );

    return result[0];
  }

  /**
   * Update notification status.
   */
  async update(
    id: string,
    data: Partial<Pick<Notification, 'status' | 'sentAt' | 'errorMessage'>>
  ): Promise<Notification | null> {
    const result = await this.db
      .update(notifications)
      .set(data)
      .where(eq(notifications.id, id))
      .returning();

    return result[0] || null;
  }

  /**
   * Mark notification as sent.
   */
  async markSent(id: string): Promise<Notification | null> {
    return this.update(id, {
      status: 'sent',
      sentAt: new Date(),
    });
  }

  /**
   * Mark notification as failed.
   */
  async markFailed(id: string, errorMessage: string): Promise<Notification | null> {
    return this.update(id, {
      status: 'failed',
      errorMessage,
    });
  }

  /**
   * Log a successful notification.
   */
  async logSuccess(
    sessionId: string,
    type: Notification['type'],
    channel: Notification['channel'] = 'whatsapp'
  ): Promise<Notification> {
    return this.create({
      sessionId,
      type,
      channel,
      status: 'sent',
      sentAt: new Date(),
    });
  }

  /**
   * Log a failed notification.
   */
  async logFailure(
    sessionId: string,
    type: Notification['type'],
    errorMessage: string,
    channel: Notification['channel'] = 'whatsapp'
  ): Promise<Notification> {
    return this.create({
      sessionId,
      type,
      channel,
      status: 'failed',
      errorMessage,
    });
  }

  /**
   * Get failed notifications (for retry or audit).
   */
  async getFailedNotifications(): Promise<Notification[]> {
    return this.db
      .select()
      .from(notifications)
      .where(eq(notifications.status, 'failed'))
      .orderBy(desc(notifications.createdAt));
  }

  /**
   * Check if a notification type was already sent for a session.
   */
  async wasNotificationSent(
    sessionId: string,
    type: Notification['type']
  ): Promise<boolean> {
    const result = await this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.sessionId, sessionId),
          eq(notifications.type, type),
          eq(notifications.status, 'sent')
        )
      )
      .limit(1);

    return result.length > 0;
  }
}
