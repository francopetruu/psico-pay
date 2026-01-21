/**
 * PsicoPay Type Definitions
 *
 * This module exports all shared types used across the application.
 * Types are organized by domain:
 * - Patient types
 * - Session types
 * - Payment types
 * - Notification types
 */

// Payment status enum
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// Notification types
export type NotificationType =
  | 'reminder_24h'
  | 'reminder_2h'
  | 'meet_link'
  | 'payment_confirmed';

// Notification channels
export type NotificationChannel = 'whatsapp' | 'email' | 'sms';

// Notification delivery status
export type NotificationStatus = 'pending' | 'sent' | 'failed';

// Base entity with timestamps
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Patient entity
export interface Patient extends BaseEntity {
  name: string;
  phone: string;
  email?: string;
  trusted: boolean;
}

// Session entity
export interface Session extends BaseEntity {
  patientId: string;
  calendarEventId: string;
  scheduledAt: Date;
  durationMinutes: number;
  amount: number;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  meetLink?: string;
  reminder24hSent: boolean;
  reminder2hSent: boolean;
  meetLinkSent: boolean;
}

// Payment preference entity
export interface PaymentPreference extends BaseEntity {
  sessionId: string;
  mpPreferenceId: string;
  paymentLink: string;
  expiresAt: Date;
}

// Notification entity
export interface Notification {
  id: string;
  sessionId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  sentAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

// Session with patient (for queries)
export interface SessionWithPatient extends Session {
  patient: Patient;
}
