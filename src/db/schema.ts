import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  decimal,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'reminder_24h',
  'reminder_2h',
  'meet_link',
  'payment_confirmed',
]);

export const notificationChannelEnum = pgEnum('notification_channel', [
  'whatsapp',
  'email',
  'sms',
]);

export const notificationStatusEnum = pgEnum('notification_status', [
  'pending',
  'sent',
  'failed',
]);

// Patients table
export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull().unique(),
    email: varchar('email', { length: 255 }),
    trusted: boolean('trusted').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('patients_phone_idx').on(table.phone),
    index('patients_name_idx').on(table.name),
  ]
);

// Sessions table
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    calendarEventId: varchar('calendar_event_id', { length: 255 })
      .notNull()
      .unique(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(50),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('pending'),
    paymentId: varchar('payment_id', { length: 255 }),
    meetLink: text('meet_link'),
    reminder24hSent: boolean('reminder_24h_sent').notNull().default(false),
    reminder2hSent: boolean('reminder_2h_sent').notNull().default(false),
    meetLinkSent: boolean('meet_link_sent').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('sessions_calendar_event_id_idx').on(table.calendarEventId),
    index('sessions_patient_id_idx').on(table.patientId),
    index('sessions_scheduled_at_idx').on(table.scheduledAt),
    index('sessions_payment_status_idx').on(table.paymentStatus),
  ]
);

// Payment preferences table
export const paymentPreferences = pgTable(
  'payment_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    mpPreferenceId: varchar('mp_preference_id', { length: 255 })
      .notNull()
      .unique(),
    paymentLink: text('payment_link').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('payment_preferences_mp_preference_id_idx').on(
      table.mpPreferenceId
    ),
    index('payment_preferences_session_id_idx').on(table.sessionId),
  ]
);

// Notifications table
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    status: notificationStatusEnum('status').notNull().default('pending'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('notifications_session_id_idx').on(table.sessionId),
    index('notifications_status_idx').on(table.status),
    index('notifications_created_at_idx').on(table.createdAt),
  ]
);

// Relations
export const patientsRelations = relations(patients, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  patient: one(patients, {
    fields: [sessions.patientId],
    references: [patients.id],
  }),
  paymentPreference: one(paymentPreferences, {
    fields: [sessions.id],
    references: [paymentPreferences.sessionId],
  }),
  notifications: many(notifications),
}));

export const paymentPreferencesRelations = relations(
  paymentPreferences,
  ({ one }) => ({
    session: one(sessions, {
      fields: [paymentPreferences.sessionId],
      references: [sessions.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  session: one(sessions, {
    fields: [notifications.sessionId],
    references: [sessions.id],
  }),
}));

// Type exports
export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type PaymentPreference = typeof paymentPreferences.$inferSelect;
export type NewPaymentPreference = typeof paymentPreferences.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
