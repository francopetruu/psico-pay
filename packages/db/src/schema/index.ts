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
  jsonb,
  time,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);

export const sessionStatusEnum = pgEnum('session_status', [
  'scheduled',
  'completed',
  'cancelled',
  'no_show',
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

export const userRoleEnum = pgEnum('user_role', [
  'admin',
  'therapist',
]);

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
]);

export const oauthProviderEnum = pgEnum('oauth_provider', [
  'google',
]);

export const degreeTypeEnum = pgEnum('degree_type', [
  'bachelor',
  'master',
  'phd',
  'md',
  'specialist',
  'other',
]);

export const languageProficiencyEnum = pgEnum('language_proficiency', [
  'native',
  'fluent',
  'conversational',
  'basic',
]);

export const specializationCategoryEnum = pgEnum('specialization_category', [
  'mental_health',
  'age_group',
  'modality',
  'other',
]);

export const priceEntityTypeEnum = pgEnum('price_entity_type', [
  'therapist',
  'session_type',
  'patient',
]);

export const availabilityExceptionTypeEnum = pgEnum('availability_exception_type', [
  'block',      // Time off / unavailable
  'available',  // Extra availability outside normal hours
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',    // Awaiting confirmation/payment
  'confirmed',  // Confirmed (paid or trusted patient)
  'cancelled',  // Cancelled by patient or therapist
  'completed',  // Session completed
  'no_show',    // Patient didn't show up
]);

// Users table (for dashboard authentication)
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').notNull().default('therapist'),
    isActive: boolean('is_active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
  ]
);

// Therapists table (multi-tenant root)
export const therapists = pgTable(
  'therapists',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Google OAuth
    googleId: varchar('google_id', { length: 255 }).unique(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    profilePictureUrl: text('profile_picture_url'),

    // Professional info
    bio: text('bio'),
    specializations: text('specializations').array(),
    credentials: jsonb('credentials'), // {degrees: [], certifications: []}
    experienceYears: integer('experience_years'),
    therapeuticApproaches: text('therapeutic_approaches').array(),
    languages: text('languages').array(),

    // Business settings
    defaultSessionPrice: decimal('default_session_price', { precision: 10, scale: 2 }).notNull().default('15000'),
    defaultSessionDuration: integer('default_session_duration').notNull().default(50),
    currency: varchar('currency', { length: 3 }).notNull().default('ARS'),
    timezone: varchar('timezone', { length: 50 }).notNull().default('America/Argentina/Buenos_Aires'),

    // Calendar configuration
    googleCalendarId: varchar('google_calendar_id', { length: 255 }),

    // Availability & booking configuration
    bufferBeforeMinutes: integer('buffer_before_minutes').notNull().default(0),
    bufferAfterMinutes: integer('buffer_after_minutes').notNull().default(15),
    minAdvanceBookingHours: integer('min_advance_booking_hours').notNull().default(24),
    maxAdvanceBookingDays: integer('max_advance_booking_days').notNull().default(60),

    // Status
    isActive: boolean('is_active').notNull().default(true),
    onboardingCompleted: boolean('onboarding_completed').notNull().default(false),

    // Public URL slug
    slug: varchar('slug', { length: 100 }).unique(),

    // Linked user account (for credentials login)
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('therapists_email_idx').on(table.email),
    uniqueIndex('therapists_google_id_idx').on(table.googleId),
    uniqueIndex('therapists_slug_idx').on(table.slug),
    index('therapists_user_id_idx').on(table.userId),
  ]
);

// OAuth tokens table (for storing refresh tokens)
export const oauthTokens = pgTable(
  'oauth_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    provider: oauthProviderEnum('provider').notNull(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    scope: text('scope'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('oauth_tokens_therapist_provider_idx').on(table.therapistId, table.provider),
  ]
);

// Therapeutic approaches reference table
export const therapeuticApproaches = pgTable(
  'therapeutic_approaches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    acronym: varchar('acronym', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
);

// Specializations reference table
export const specializations = pgTable(
  'specializations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    category: specializationCategoryEnum('category'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  }
);

// Therapist degrees table
export const therapistDegrees = pgTable(
  'therapist_degrees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    degreeType: degreeTypeEnum('degree_type').notNull(),
    fieldOfStudy: varchar('field_of_study', { length: 200 }).notNull(),
    institution: varchar('institution', { length: 255 }).notNull(),
    graduationYear: integer('graduation_year'),
    country: varchar('country', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('therapist_degrees_therapist_id_idx').on(table.therapistId),
  ]
);

// Therapist certifications table
export const therapistCertifications = pgTable(
  'therapist_certifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    issuingOrganization: varchar('issuing_organization', { length: 255 }),
    issueDate: timestamp('issue_date', { withTimezone: true }),
    expirationDate: timestamp('expiration_date', { withTimezone: true }),
    credentialId: varchar('credential_id', { length: 100 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('therapist_certifications_therapist_id_idx').on(table.therapistId),
  ]
);

// Therapist work experience table
export const therapistExperience = pgTable(
  'therapist_experience',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    position: varchar('position', { length: 200 }).notNull(),
    organization: varchar('organization', { length: 255 }),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }),
    description: text('description'),
    isCurrent: boolean('is_current').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('therapist_experience_therapist_id_idx').on(table.therapistId),
  ]
);

// Therapist specializations join table
export const therapistSpecializations = pgTable(
  'therapist_specializations',
  {
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    specializationId: uuid('specialization_id')
      .notNull()
      .references(() => specializations.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('therapist_specializations_therapist_id_idx').on(table.therapistId),
    index('therapist_specializations_specialization_id_idx').on(table.specializationId),
  ]
);

// Therapist approaches join table
export const therapistApproaches = pgTable(
  'therapist_approaches',
  {
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    approachId: uuid('approach_id')
      .notNull()
      .references(() => therapeuticApproaches.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('therapist_approaches_therapist_id_idx').on(table.therapistId),
    index('therapist_approaches_approach_id_idx').on(table.approachId),
  ]
);

// Therapist languages table
export const therapistLanguages = pgTable(
  'therapist_languages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    language: varchar('language', { length: 50 }).notNull(),
    proficiency: languageProficiencyEnum('proficiency').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('therapist_languages_therapist_id_idx').on(table.therapistId),
  ]
);

// Session types table (for custom pricing per session type)
export const sessionTypes = pgTable(
  'session_types',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    durationMinutes: integer('duration_minutes').notNull().default(50),
    price: decimal('price', { precision: 10, scale: 2 }), // NULL = use default price
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('session_types_therapist_name_idx').on(table.therapistId, table.name),
    index('session_types_therapist_id_idx').on(table.therapistId),
  ]
);

// Patients table
export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Multi-tenant: therapist_id is nullable for backward compatibility
    therapistId: uuid('therapist_id')
      .references(() => therapists.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    email: varchar('email', { length: 255 }),
    trusted: boolean('trusted').notNull().default(false),
    notes: text('notes'),
    totalSessions: integer('total_sessions').notNull().default(0),
    totalPaid: decimal('total_paid', { precision: 12, scale: 2 }).notNull().default('0'),
    lastSessionAt: timestamp('last_session_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Phone is unique per therapist, not globally
    uniqueIndex('patients_therapist_phone_idx').on(table.therapistId, table.phone),
    index('patients_therapist_id_idx').on(table.therapistId),
    index('patients_name_idx').on(table.name),
    index('patients_last_session_at_idx').on(table.lastSessionAt),
  ]
);

// Patient-specific pricing overrides
export const patientPricing = pgTable(
  'patient_pricing',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    reason: text('reason'), // Optional note: 'Student discount', etc.
    validFrom: timestamp('valid_from', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }), // NULL = indefinite
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('patient_pricing_patient_therapist_idx').on(table.patientId, table.therapistId),
    index('patient_pricing_therapist_id_idx').on(table.therapistId),
    index('patient_pricing_patient_id_idx').on(table.patientId),
  ]
);

// Price history (audit trail)
export const priceHistory = pgTable(
  'price_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    entityType: priceEntityTypeEnum('entity_type').notNull(), // 'therapist', 'session_type', 'patient'
    entityId: uuid('entity_id').notNull(), // ID of therapist/session_type/patient
    oldPrice: decimal('old_price', { precision: 10, scale: 2 }),
    newPrice: decimal('new_price', { precision: 10, scale: 2 }).notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('price_history_therapist_id_idx').on(table.therapistId),
    index('price_history_entity_type_entity_id_idx').on(table.entityType, table.entityId),
    index('price_history_changed_at_idx').on(table.changedAt),
  ]
);

// Availability rules table (weekly schedule)
export const availabilityRules = pgTable(
  'availability_rules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 1=Monday, ..., 6=Saturday
    startTime: time('start_time').notNull(), // e.g., '09:00'
    endTime: time('end_time').notNull(), // e.g., '18:00'
    isAvailable: boolean('is_available').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('availability_rules_therapist_id_idx').on(table.therapistId),
    index('availability_rules_day_of_week_idx').on(table.dayOfWeek),
    // Unique constraint: one rule per therapist per day/time slot
    uniqueIndex('availability_rules_therapist_day_time_idx').on(
      table.therapistId,
      table.dayOfWeek,
      table.startTime,
      table.endTime
    ),
  ]
);

// Availability exceptions table (one-time blocks or extra availability)
export const availabilityExceptions = pgTable(
  'availability_exceptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    exceptionDate: date('exception_date').notNull(),
    startTime: time('start_time'), // NULL if all_day is true
    endTime: time('end_time'), // NULL if all_day is true
    allDay: boolean('all_day').notNull().default(false),
    exceptionType: availabilityExceptionTypeEnum('exception_type').notNull().default('block'),
    reason: text('reason'), // e.g., "Vacaciones", "Feriado", "Congreso"
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('availability_exceptions_therapist_id_idx').on(table.therapistId),
    index('availability_exceptions_date_idx').on(table.exceptionDate),
    index('availability_exceptions_therapist_date_idx').on(table.therapistId, table.exceptionDate),
  ]
);

// Bookings table (patient self-scheduling)
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    therapistId: uuid('therapist_id')
      .notNull()
      .references(() => therapists.id, { onDelete: 'cascade' }),
    // Patient can be null for new patients booking for first time
    patientId: uuid('patient_id')
      .references(() => patients.id, { onDelete: 'set null' }),
    sessionTypeId: uuid('session_type_id')
      .references(() => sessionTypes.id, { onDelete: 'set null' }),

    // Scheduled time
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(50),

    // Patient info (for new patients or to store at booking time)
    patientName: varchar('patient_name', { length: 255 }).notNull(),
    patientEmail: varchar('patient_email', { length: 255 }),
    patientPhone: varchar('patient_phone', { length: 20 }).notNull(),

    // Booking details
    notes: text('notes'), // Notes from patient
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    status: bookingStatusEnum('status').notNull().default('pending'),

    // Status timestamps
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancellationReason: text('cancellation_reason'),

    // Link to created session (after confirmation)
    sessionId: uuid('session_id')
      .references(() => sessions.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('bookings_therapist_id_idx').on(table.therapistId),
    index('bookings_patient_id_idx').on(table.patientId),
    index('bookings_scheduled_at_idx').on(table.scheduledAt),
    index('bookings_status_idx').on(table.status),
    index('bookings_therapist_scheduled_idx').on(table.therapistId, table.scheduledAt),
  ]
);

// Sessions table
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Multi-tenant: therapist_id is nullable for backward compatibility
    therapistId: uuid('therapist_id')
      .references(() => therapists.id, { onDelete: 'cascade' }),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    sessionTypeId: uuid('session_type_id')
      .references(() => sessionTypes.id, { onDelete: 'set null' }),
    calendarEventId: varchar('calendar_event_id', { length: 255 })
      .notNull()
      .unique(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
    durationMinutes: integer('duration_minutes').notNull().default(50),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    status: sessionStatusEnum('status').notNull().default('scheduled'),
    paymentStatus: paymentStatusEnum('payment_status')
      .notNull()
      .default('pending'),
    paymentId: varchar('payment_id', { length: 255 }),
    meetLink: text('meet_link'),
    cancellationReason: text('cancellation_reason'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
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
    index('sessions_therapist_id_idx').on(table.therapistId),
    index('sessions_patient_id_idx').on(table.patientId),
    index('sessions_scheduled_at_idx').on(table.scheduledAt),
    index('sessions_payment_status_idx').on(table.paymentStatus),
    index('sessions_status_idx').on(table.status),
    index('sessions_therapist_scheduled_idx').on(table.therapistId, table.scheduledAt),
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

// Session notes table
export const sessionNotes = pgTable(
  'session_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    note: text('note').notNull(),
    createdById: uuid('created_by_id')
      .references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('session_notes_session_id_idx').on(table.sessionId),
    index('session_notes_created_at_idx').on(table.createdAt),
  ]
);

// Audit log table
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    action: auditActionEnum('action').notNull(),
    oldValues: jsonb('old_values'),
    newValues: jsonb('new_values'),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'set null' }),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('audit_log_entity_type_entity_id_idx').on(table.entityType, table.entityId),
    index('audit_log_user_id_idx').on(table.userId),
    index('audit_log_created_at_idx').on(table.createdAt),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  sessionNotes: many(sessionNotes),
  auditLogs: many(auditLog),
  therapist: one(therapists, {
    fields: [users.id],
    references: [therapists.userId],
  }),
}));

export const therapistsRelations = relations(therapists, ({ one, many }) => ({
  user: one(users, {
    fields: [therapists.userId],
    references: [users.id],
  }),
  patients: many(patients),
  sessions: many(sessions),
  oauthTokens: many(oauthTokens),
  degrees: many(therapistDegrees),
  certifications: many(therapistCertifications),
  experience: many(therapistExperience),
  specializations: many(therapistSpecializations),
  approaches: many(therapistApproaches),
  languages: many(therapistLanguages),
  sessionTypes: many(sessionTypes),
  patientPricing: many(patientPricing),
  priceHistory: many(priceHistory),
  availabilityRules: many(availabilityRules),
  availabilityExceptions: many(availabilityExceptions),
  bookings: many(bookings),
}));

export const oauthTokensRelations = relations(oauthTokens, ({ one }) => ({
  therapist: one(therapists, {
    fields: [oauthTokens.therapistId],
    references: [therapists.id],
  }),
}));

export const therapeuticApproachesRelations = relations(therapeuticApproaches, ({ many }) => ({
  therapistApproaches: many(therapistApproaches),
}));

export const specializationsRelations = relations(specializations, ({ many }) => ({
  therapistSpecializations: many(therapistSpecializations),
}));

export const therapistDegreesRelations = relations(therapistDegrees, ({ one }) => ({
  therapist: one(therapists, {
    fields: [therapistDegrees.therapistId],
    references: [therapists.id],
  }),
}));

export const therapistCertificationsRelations = relations(therapistCertifications, ({ one }) => ({
  therapist: one(therapists, {
    fields: [therapistCertifications.therapistId],
    references: [therapists.id],
  }),
}));

export const therapistExperienceRelations = relations(therapistExperience, ({ one }) => ({
  therapist: one(therapists, {
    fields: [therapistExperience.therapistId],
    references: [therapists.id],
  }),
}));

export const therapistSpecializationsRelations = relations(therapistSpecializations, ({ one }) => ({
  therapist: one(therapists, {
    fields: [therapistSpecializations.therapistId],
    references: [therapists.id],
  }),
  specialization: one(specializations, {
    fields: [therapistSpecializations.specializationId],
    references: [specializations.id],
  }),
}));

export const therapistApproachesRelations = relations(therapistApproaches, ({ one }) => ({
  therapist: one(therapists, {
    fields: [therapistApproaches.therapistId],
    references: [therapists.id],
  }),
  approach: one(therapeuticApproaches, {
    fields: [therapistApproaches.approachId],
    references: [therapeuticApproaches.id],
  }),
}));

export const therapistLanguagesRelations = relations(therapistLanguages, ({ one }) => ({
  therapist: one(therapists, {
    fields: [therapistLanguages.therapistId],
    references: [therapists.id],
  }),
}));

export const sessionTypesRelations = relations(sessionTypes, ({ one, many }) => ({
  therapist: one(therapists, {
    fields: [sessionTypes.therapistId],
    references: [therapists.id],
  }),
  sessions: many(sessions),
}));

export const patientPricingRelations = relations(patientPricing, ({ one }) => ({
  patient: one(patients, {
    fields: [patientPricing.patientId],
    references: [patients.id],
  }),
  therapist: one(therapists, {
    fields: [patientPricing.therapistId],
    references: [therapists.id],
  }),
}));

export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  therapist: one(therapists, {
    fields: [priceHistory.therapistId],
    references: [therapists.id],
  }),
}));

export const availabilityRulesRelations = relations(availabilityRules, ({ one }) => ({
  therapist: one(therapists, {
    fields: [availabilityRules.therapistId],
    references: [therapists.id],
  }),
}));

export const availabilityExceptionsRelations = relations(availabilityExceptions, ({ one }) => ({
  therapist: one(therapists, {
    fields: [availabilityExceptions.therapistId],
    references: [therapists.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  therapist: one(therapists, {
    fields: [bookings.therapistId],
    references: [therapists.id],
  }),
  patient: one(patients, {
    fields: [bookings.patientId],
    references: [patients.id],
  }),
  sessionType: one(sessionTypes, {
    fields: [bookings.sessionTypeId],
    references: [sessionTypes.id],
  }),
  session: one(sessions, {
    fields: [bookings.sessionId],
    references: [sessions.id],
  }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  therapist: one(therapists, {
    fields: [patients.therapistId],
    references: [therapists.id],
  }),
  sessions: many(sessions),
  pricing: many(patientPricing),
  bookings: many(bookings),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  therapist: one(therapists, {
    fields: [sessions.therapistId],
    references: [therapists.id],
  }),
  patient: one(patients, {
    fields: [sessions.patientId],
    references: [patients.id],
  }),
  sessionType: one(sessionTypes, {
    fields: [sessions.sessionTypeId],
    references: [sessionTypes.id],
  }),
  paymentPreference: one(paymentPreferences, {
    fields: [sessions.id],
    references: [paymentPreferences.sessionId],
  }),
  notifications: many(notifications),
  notes: many(sessionNotes),
  booking: one(bookings, {
    fields: [sessions.id],
    references: [bookings.sessionId],
  }),
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

export const sessionNotesRelations = relations(sessionNotes, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionNotes.sessionId],
    references: [sessions.id],
  }),
  createdBy: one(users, {
    fields: [sessionNotes.createdById],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Therapist = typeof therapists.$inferSelect;
export type NewTherapist = typeof therapists.$inferInsert;

export type OAuthToken = typeof oauthTokens.$inferSelect;
export type NewOAuthToken = typeof oauthTokens.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type NewPatient = typeof patients.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type PaymentPreference = typeof paymentPreferences.$inferSelect;
export type NewPaymentPreference = typeof paymentPreferences.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type SessionNote = typeof sessionNotes.$inferSelect;
export type NewSessionNote = typeof sessionNotes.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;

export type TherapeuticApproach = typeof therapeuticApproaches.$inferSelect;
export type NewTherapeuticApproach = typeof therapeuticApproaches.$inferInsert;

export type Specialization = typeof specializations.$inferSelect;
export type NewSpecialization = typeof specializations.$inferInsert;

export type TherapistDegree = typeof therapistDegrees.$inferSelect;
export type NewTherapistDegree = typeof therapistDegrees.$inferInsert;

export type TherapistCertification = typeof therapistCertifications.$inferSelect;
export type NewTherapistCertification = typeof therapistCertifications.$inferInsert;

export type TherapistExperience = typeof therapistExperience.$inferSelect;
export type NewTherapistExperience = typeof therapistExperience.$inferInsert;

export type TherapistSpecialization = typeof therapistSpecializations.$inferSelect;
export type NewTherapistSpecialization = typeof therapistSpecializations.$inferInsert;

export type TherapistApproach = typeof therapistApproaches.$inferSelect;
export type NewTherapistApproach = typeof therapistApproaches.$inferInsert;

export type TherapistLanguage = typeof therapistLanguages.$inferSelect;
export type NewTherapistLanguage = typeof therapistLanguages.$inferInsert;

export type SessionType = typeof sessionTypes.$inferSelect;
export type NewSessionType = typeof sessionTypes.$inferInsert;

export type PatientPricing = typeof patientPricing.$inferSelect;
export type NewPatientPricing = typeof patientPricing.$inferInsert;

export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;

export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type NewAvailabilityRule = typeof availabilityRules.$inferInsert;

export type AvailabilityException = typeof availabilityExceptions.$inferSelect;
export type NewAvailabilityException = typeof availabilityExceptions.$inferInsert;

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
