import { describe, it, expect } from 'vitest';
import {
  users,
  patients,
  sessions,
  paymentPreferences,
  notifications,
  sessionNotes,
  auditLog,
  paymentStatusEnum,
  sessionStatusEnum,
  notificationTypeEnum,
  notificationChannelEnum,
  notificationStatusEnum,
  userRoleEnum,
  auditActionEnum,
} from './index.js';

describe('Database Schema', () => {
  describe('Enums', () => {
    it('should have correct payment status values', () => {
      expect(paymentStatusEnum.enumValues).toEqual([
        'pending',
        'paid',
        'failed',
        'refunded',
      ]);
    });

    it('should have correct session status values', () => {
      expect(sessionStatusEnum.enumValues).toEqual([
        'scheduled',
        'completed',
        'cancelled',
        'no_show',
      ]);
    });

    it('should have correct notification type values', () => {
      expect(notificationTypeEnum.enumValues).toEqual([
        'reminder_24h',
        'reminder_2h',
        'meet_link',
        'payment_confirmed',
      ]);
    });

    it('should have correct notification channel values', () => {
      expect(notificationChannelEnum.enumValues).toEqual([
        'whatsapp',
        'email',
        'sms',
      ]);
    });

    it('should have correct notification status values', () => {
      expect(notificationStatusEnum.enumValues).toEqual([
        'pending',
        'sent',
        'failed',
      ]);
    });

    it('should have correct user role values', () => {
      expect(userRoleEnum.enumValues).toEqual(['admin', 'therapist']);
    });

    it('should have correct audit action values', () => {
      expect(auditActionEnum.enumValues).toEqual(['create', 'update', 'delete']);
    });
  });

  describe('Tables', () => {
    it('users table should have required columns', () => {
      const columns = Object.keys(users);
      expect(columns).toContain('id');
      expect(columns).toContain('email');
      expect(columns).toContain('passwordHash');
      expect(columns).toContain('name');
      expect(columns).toContain('role');
      expect(columns).toContain('isActive');
      expect(columns).toContain('createdAt');
      expect(columns).toContain('updatedAt');
    });

    it('patients table should have required columns', () => {
      const columns = Object.keys(patients);
      expect(columns).toContain('id');
      expect(columns).toContain('name');
      expect(columns).toContain('phone');
      expect(columns).toContain('email');
      expect(columns).toContain('trusted');
      expect(columns).toContain('notes');
      expect(columns).toContain('totalSessions');
      expect(columns).toContain('totalPaid');
    });

    it('sessions table should have required columns', () => {
      const columns = Object.keys(sessions);
      expect(columns).toContain('id');
      expect(columns).toContain('patientId');
      expect(columns).toContain('calendarEventId');
      expect(columns).toContain('scheduledAt');
      expect(columns).toContain('amount');
      expect(columns).toContain('status');
      expect(columns).toContain('paymentStatus');
      expect(columns).toContain('meetLink');
    });

    it('paymentPreferences table should have required columns', () => {
      const columns = Object.keys(paymentPreferences);
      expect(columns).toContain('id');
      expect(columns).toContain('sessionId');
      expect(columns).toContain('mpPreferenceId');
      expect(columns).toContain('paymentLink');
      expect(columns).toContain('expiresAt');
    });

    it('notifications table should have required columns', () => {
      const columns = Object.keys(notifications);
      expect(columns).toContain('id');
      expect(columns).toContain('sessionId');
      expect(columns).toContain('type');
      expect(columns).toContain('channel');
      expect(columns).toContain('status');
    });

    it('sessionNotes table should have required columns', () => {
      const columns = Object.keys(sessionNotes);
      expect(columns).toContain('id');
      expect(columns).toContain('sessionId');
      expect(columns).toContain('note');
      expect(columns).toContain('createdById');
    });

    it('auditLog table should have required columns', () => {
      const columns = Object.keys(auditLog);
      expect(columns).toContain('id');
      expect(columns).toContain('entityType');
      expect(columns).toContain('entityId');
      expect(columns).toContain('action');
      expect(columns).toContain('oldValues');
      expect(columns).toContain('newValues');
      expect(columns).toContain('userId');
    });
  });
});
