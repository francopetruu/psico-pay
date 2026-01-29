CREATE TYPE "public"."audit_action" AS ENUM('create', 'update', 'delete');--> statement-breakpoint
CREATE TYPE "public"."availability_exception_type" AS ENUM('block', 'available');--> statement-breakpoint
CREATE TYPE "public"."degree_type" AS ENUM('bachelor', 'master', 'phd', 'md', 'specialist', 'other');--> statement-breakpoint
CREATE TYPE "public"."language_proficiency" AS ENUM('native', 'fluent', 'conversational', 'basic');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('whatsapp', 'email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('reminder_24h', 'reminder_2h', 'meet_link', 'payment_confirmed');--> statement-breakpoint
CREATE TYPE "public"."oauth_provider" AS ENUM('google');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."price_entity_type" AS ENUM('therapist', 'session_type', 'patient');--> statement-breakpoint
CREATE TYPE "public"."session_status" AS ENUM('scheduled', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."specialization_category" AS ENUM('mental_health', 'age_group', 'modality', 'other');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'therapist');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"user_id" uuid,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_exceptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"exception_date" date NOT NULL,
	"start_time" time,
	"end_time" time,
	"all_day" boolean DEFAULT false NOT NULL,
	"exception_type" "availability_exception_type" DEFAULT 'block' NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"is_available" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp with time zone,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"provider" "oauth_provider" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"scope" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"therapist_id" uuid NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"reason" text,
	"valid_from" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(255),
	"trusted" boolean DEFAULT false NOT NULL,
	"notes" text,
	"total_sessions" integer DEFAULT 0 NOT NULL,
	"total_paid" numeric(12, 2) DEFAULT '0' NOT NULL,
	"last_session_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"mp_preference_id" varchar(255) NOT NULL,
	"payment_link" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_preferences_mp_preference_id_unique" UNIQUE("mp_preference_id")
);
--> statement-breakpoint
CREATE TABLE "price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"entity_type" "price_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"old_price" numeric(10, 2),
	"new_price" numeric(10, 2) NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"duration_minutes" integer DEFAULT 50 NOT NULL,
	"price" numeric(10, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid,
	"patient_id" uuid NOT NULL,
	"session_type_id" uuid,
	"calendar_event_id" varchar(255) NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer DEFAULT 50 NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "session_status" DEFAULT 'scheduled' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_id" varchar(255),
	"meet_link" text,
	"cancellation_reason" text,
	"cancelled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"reminder_24h_sent" boolean DEFAULT false NOT NULL,
	"reminder_2h_sent" boolean DEFAULT false NOT NULL,
	"meet_link_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_calendar_event_id_unique" UNIQUE("calendar_event_id")
);
--> statement-breakpoint
CREATE TABLE "specializations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"category" "specialization_category",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "specializations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "therapeutic_approaches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"acronym" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "therapeutic_approaches_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "therapist_approaches" (
	"therapist_id" uuid NOT NULL,
	"approach_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_certifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"issuing_organization" varchar(255),
	"issue_date" timestamp with time zone,
	"expiration_date" timestamp with time zone,
	"credential_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_degrees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"degree_type" "degree_type" NOT NULL,
	"field_of_study" varchar(200) NOT NULL,
	"institution" varchar(255) NOT NULL,
	"graduation_year" integer,
	"country" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"position" varchar(200) NOT NULL,
	"organization" varchar(255),
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"description" text,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"therapist_id" uuid NOT NULL,
	"language" varchar(50) NOT NULL,
	"proficiency" "language_proficiency" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapist_specializations" (
	"therapist_id" uuid NOT NULL,
	"specialization_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "therapists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"google_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"profile_picture_url" text,
	"bio" text,
	"specializations" text[],
	"credentials" jsonb,
	"experience_years" integer,
	"therapeutic_approaches" text[],
	"languages" text[],
	"default_session_price" numeric(10, 2) DEFAULT '15000' NOT NULL,
	"default_session_duration" integer DEFAULT 50 NOT NULL,
	"currency" varchar(3) DEFAULT 'ARS' NOT NULL,
	"timezone" varchar(50) DEFAULT 'America/Argentina/Buenos_Aires' NOT NULL,
	"google_calendar_id" varchar(255),
	"buffer_before_minutes" integer DEFAULT 0 NOT NULL,
	"buffer_after_minutes" integer DEFAULT 15 NOT NULL,
	"min_advance_booking_hours" integer DEFAULT 24 NOT NULL,
	"max_advance_booking_days" integer DEFAULT 60 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"slug" varchar(100),
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "therapists_google_id_unique" UNIQUE("google_id"),
	CONSTRAINT "therapists_email_unique" UNIQUE("email"),
	CONSTRAINT "therapists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'therapist' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_tokens" ADD CONSTRAINT "oauth_tokens_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_pricing" ADD CONSTRAINT "patient_pricing_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_pricing" ADD CONSTRAINT "patient_pricing_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_preferences" ADD CONSTRAINT "payment_preferences_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_notes" ADD CONSTRAINT "session_notes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_types" ADD CONSTRAINT "session_types_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_session_type_id_session_types_id_fk" FOREIGN KEY ("session_type_id") REFERENCES "public"."session_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_approaches" ADD CONSTRAINT "therapist_approaches_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_approaches" ADD CONSTRAINT "therapist_approaches_approach_id_therapeutic_approaches_id_fk" FOREIGN KEY ("approach_id") REFERENCES "public"."therapeutic_approaches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_certifications" ADD CONSTRAINT "therapist_certifications_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_degrees" ADD CONSTRAINT "therapist_degrees_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_experience" ADD CONSTRAINT "therapist_experience_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_languages" ADD CONSTRAINT "therapist_languages_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_specializations" ADD CONSTRAINT "therapist_specializations_therapist_id_therapists_id_fk" FOREIGN KEY ("therapist_id") REFERENCES "public"."therapists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapist_specializations" ADD CONSTRAINT "therapist_specializations_specialization_id_specializations_id_fk" FOREIGN KEY ("specialization_id") REFERENCES "public"."specializations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_user_id_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "availability_exceptions_therapist_id_idx" ON "availability_exceptions" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "availability_exceptions_date_idx" ON "availability_exceptions" USING btree ("exception_date");--> statement-breakpoint
CREATE INDEX "availability_exceptions_therapist_date_idx" ON "availability_exceptions" USING btree ("therapist_id","exception_date");--> statement-breakpoint
CREATE INDEX "availability_rules_therapist_id_idx" ON "availability_rules" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "availability_rules_day_of_week_idx" ON "availability_rules" USING btree ("day_of_week");--> statement-breakpoint
CREATE UNIQUE INDEX "availability_rules_therapist_day_time_idx" ON "availability_rules" USING btree ("therapist_id","day_of_week","start_time","end_time");--> statement-breakpoint
CREATE INDEX "notifications_session_id_idx" ON "notifications" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "notifications_status_idx" ON "notifications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_tokens_therapist_provider_idx" ON "oauth_tokens" USING btree ("therapist_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_pricing_patient_therapist_idx" ON "patient_pricing" USING btree ("patient_id","therapist_id");--> statement-breakpoint
CREATE INDEX "patient_pricing_therapist_id_idx" ON "patient_pricing" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "patient_pricing_patient_id_idx" ON "patient_pricing" USING btree ("patient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "patients_therapist_phone_idx" ON "patients" USING btree ("therapist_id","phone");--> statement-breakpoint
CREATE INDEX "patients_therapist_id_idx" ON "patients" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "patients_name_idx" ON "patients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "patients_last_session_at_idx" ON "patients" USING btree ("last_session_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_preferences_mp_preference_id_idx" ON "payment_preferences" USING btree ("mp_preference_id");--> statement-breakpoint
CREATE INDEX "payment_preferences_session_id_idx" ON "payment_preferences" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "price_history_therapist_id_idx" ON "price_history" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "price_history_entity_type_entity_id_idx" ON "price_history" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "price_history_changed_at_idx" ON "price_history" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "session_notes_session_id_idx" ON "session_notes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_notes_created_at_idx" ON "session_notes" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "session_types_therapist_name_idx" ON "session_types" USING btree ("therapist_id","name");--> statement-breakpoint
CREATE INDEX "session_types_therapist_id_idx" ON "session_types" USING btree ("therapist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_calendar_event_id_idx" ON "sessions" USING btree ("calendar_event_id");--> statement-breakpoint
CREATE INDEX "sessions_therapist_id_idx" ON "sessions" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "sessions_patient_id_idx" ON "sessions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "sessions_scheduled_at_idx" ON "sessions" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "sessions_payment_status_idx" ON "sessions" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "sessions_status_idx" ON "sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sessions_therapist_scheduled_idx" ON "sessions" USING btree ("therapist_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "therapist_approaches_therapist_id_idx" ON "therapist_approaches" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_approaches_approach_id_idx" ON "therapist_approaches" USING btree ("approach_id");--> statement-breakpoint
CREATE INDEX "therapist_certifications_therapist_id_idx" ON "therapist_certifications" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_degrees_therapist_id_idx" ON "therapist_degrees" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_experience_therapist_id_idx" ON "therapist_experience" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_languages_therapist_id_idx" ON "therapist_languages" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_specializations_therapist_id_idx" ON "therapist_specializations" USING btree ("therapist_id");--> statement-breakpoint
CREATE INDEX "therapist_specializations_specialization_id_idx" ON "therapist_specializations" USING btree ("specialization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "therapists_email_idx" ON "therapists" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "therapists_google_id_idx" ON "therapists" USING btree ("google_id");--> statement-breakpoint
CREATE UNIQUE INDEX "therapists_slug_idx" ON "therapists" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "therapists_user_id_idx" ON "therapists" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");