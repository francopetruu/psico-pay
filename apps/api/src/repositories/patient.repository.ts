import { eq } from 'drizzle-orm';
import { type Database, patients, type Patient, type NewPatient } from '@psico-pay/db';
import { logger } from '../lib/logger.js';

export class PatientRepository {
  constructor(private db: Database) {}

  /**
   * Find a patient by ID.
   */
  async findById(id: string): Promise<Patient | null> {
    const result = await this.db
      .select()
      .from(patients)
      .where(eq(patients.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find a patient by phone number.
   */
  async findByPhone(phone: string): Promise<Patient | null> {
    const result = await this.db
      .select()
      .from(patients)
      .where(eq(patients.phone, phone))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Find a patient by name (case insensitive partial match).
   */
  async findByName(name: string): Promise<Patient[]> {
    const result = await this.db
      .select()
      .from(patients)
      .where(eq(patients.name, name));

    return result;
  }

  /**
   * Create a new patient.
   */
  async create(data: NewPatient): Promise<Patient> {
    const result = await this.db
      .insert(patients)
      .values(data)
      .returning();

    logger.info(
      { patientId: result[0].id, name: data.name },
      'Created new patient'
    );

    return result[0];
  }

  /**
   * Update a patient.
   */
  async update(id: string, data: Partial<NewPatient>): Promise<Patient | null> {
    const result = await this.db
      .update(patients)
      .set(data)
      .where(eq(patients.id, id))
      .returning();

    if (result[0]) {
      logger.debug({ patientId: id }, 'Updated patient');
    }

    return result[0] || null;
  }

  /**
   * Find or create a patient by phone number.
   */
  async findOrCreate(data: NewPatient): Promise<{ patient: Patient; created: boolean }> {
    const existing = await this.findByPhone(data.phone);

    if (existing) {
      return { patient: existing, created: false };
    }

    const created = await this.create(data);
    return { patient: created, created: true };
  }

  /**
   * Find or create a patient by name (fallback when phone not available).
   */
  async findOrCreateByName(data: NewPatient): Promise<{ patient: Patient; created: boolean }> {
    // First try to find by phone if available
    if (data.phone) {
      const byPhone = await this.findByPhone(data.phone);
      if (byPhone) {
        return { patient: byPhone, created: false };
      }
    }

    // Then try to find by exact name match
    const byName = await this.findByName(data.name);
    if (byName.length === 1) {
      // If phone was provided, update the patient with the phone number
      if (data.phone && !byName[0].phone) {
        const updated = await this.update(byName[0].id, { phone: data.phone });
        return { patient: updated || byName[0], created: false };
      }
      return { patient: byName[0], created: false };
    }

    // Create new patient
    const created = await this.create(data);
    return { patient: created, created: true };
  }

  /**
   * List all patients.
   */
  async list(): Promise<Patient[]> {
    return this.db.select().from(patients);
  }
}
