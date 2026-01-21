import { eq } from 'drizzle-orm';
import {
  type Database,
  paymentPreferences,
  type PaymentPreference,
  type NewPaymentPreference,
} from '@psico-pay/db';
import { logger } from '../lib/logger.js';

export class PaymentPreferenceRepository {
  constructor(private db: Database) {}

  /**
   * Find a payment preference by ID.
   */
  async findById(id: string): Promise<PaymentPreference | null> {
    const result = await this.db
      .select()
      .from(paymentPreferences)
      .where(eq(paymentPreferences.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find a payment preference by session ID.
   */
  async findBySessionId(sessionId: string): Promise<PaymentPreference | null> {
    const result = await this.db
      .select()
      .from(paymentPreferences)
      .where(eq(paymentPreferences.sessionId, sessionId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find a payment preference by Mercado Pago preference ID.
   */
  async findByMpPreferenceId(mpPreferenceId: string): Promise<PaymentPreference | null> {
    const result = await this.db
      .select()
      .from(paymentPreferences)
      .where(eq(paymentPreferences.mpPreferenceId, mpPreferenceId))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Create a new payment preference.
   */
  async create(data: NewPaymentPreference): Promise<PaymentPreference> {
    const result = await this.db
      .insert(paymentPreferences)
      .values(data)
      .returning();

    logger.info(
      {
        preferenceId: result[0].id,
        sessionId: data.sessionId,
        mpPreferenceId: data.mpPreferenceId,
      },
      'Created payment preference'
    );

    return result[0];
  }

  /**
   * Delete a payment preference by session ID.
   * Used when regenerating expired preferences.
   */
  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.db
      .delete(paymentPreferences)
      .where(eq(paymentPreferences.sessionId, sessionId));

    logger.debug({ sessionId }, 'Deleted payment preference');
  }

  /**
   * Check if a payment preference is expired.
   */
  isExpired(preference: PaymentPreference): boolean {
    return new Date() > preference.expiresAt;
  }

  /**
   * Find or create a payment preference for a session.
   */
  async findOrCreate(
    data: NewPaymentPreference
  ): Promise<{ preference: PaymentPreference; created: boolean }> {
    const existing = await this.findBySessionId(data.sessionId);

    if (existing && !this.isExpired(existing)) {
      return { preference: existing, created: false };
    }

    // If expired, delete and create new
    if (existing) {
      await this.deleteBySessionId(data.sessionId);
    }

    const created = await this.create(data);
    return { preference: created, created: true };
  }
}
