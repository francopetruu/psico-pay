export { PatientRepository } from './patient.repository.js';
export { SessionRepository, type SessionWithPatient, type SessionFilters } from './session.repository.js';
export { PaymentPreferenceRepository } from './payment-preference.repository.js';
export { NotificationRepository } from './notification.repository.js';

import { type Database } from '../db/index.js';
import { PatientRepository } from './patient.repository.js';
import { SessionRepository } from './session.repository.js';
import { PaymentPreferenceRepository } from './payment-preference.repository.js';
import { NotificationRepository } from './notification.repository.js';

export interface Repositories {
  patients: PatientRepository;
  sessions: SessionRepository;
  paymentPreferences: PaymentPreferenceRepository;
  notifications: NotificationRepository;
}

/**
 * Creates all repositories with the given database instance.
 */
export function createRepositories(db: Database): Repositories {
  return {
    patients: new PatientRepository(db),
    sessions: new SessionRepository(db),
    paymentPreferences: new PaymentPreferenceRepository(db),
    notifications: new NotificationRepository(db),
  };
}
