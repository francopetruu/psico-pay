PHASE 3: Advanced Features - Multi-Tenant SaaS Platform
Overview
Transform PsicoPay from a single-therapist solution into a multi-tenant SaaS platform with patient self-scheduling, flexible payment options, and automated session management.

1. Vision & Objectives
Primary Vision
6-12 Month Goal: Fully functional SaaS product serving multiple psychologists with minimal manual intervention.
Phase 3 Objectives (Priority Order)

Scale to Multiple Therapists - Multi-tenant architecture with data isolation
Reduce Manual Work - Patient self-scheduling and recurring session automation
Improve Patient Retention - Trust levels and enhanced profiles
Optimize Revenue - Reduce payment gateway fees with bank transfers

Success Criteria

✅ 5+ therapists actively using the platform
✅ 70%+ sessions scheduled by patients (not therapists)
✅ 50%+ payments via bank transfer (zero fees)
✅ 90%+ recurring sessions configured
✅ <5 minutes for patient to complete booking
✅ Zero scheduling conflicts
✅ 100% therapists using Google OAuth login


2. Phase Structure & Timeline
Phase 3A: Multi-Tenant Foundation
Duration: 4-5 weeks
Goal: Enable multiple therapists to use the platform independently
Features:

Google OAuth Authentication (1 week)
Multi-Therapist Architecture (2 weeks)
Professional Profile Management (1 week)
Dynamic Pricing System (1 week)

Phase 3B: Patient Empowerment & Automation
Duration: 5-6 weeks
Goal: Automate scheduling and reduce therapist workload to near-zero
Features:

Availability Management System (2 weeks)
Patient Self-Scheduling Portal (3 weeks)
Enhanced Patient Profiles (1 week)
Recurring Sessions Automation (1 week)

Phase 3C: Payment Optimization & Trust
Duration: 3-4 weeks
Goal: Reduce payment fees and provide flexibility for trusted patients
Features:

Bank Transfer Integration (2 weeks)
Bank Transfer Management UI (1 week)
Patient Trust Level System (1 week)
Payment Analytics Dashboard (1 week)

Total Duration: 12-15 weeks (~3.5 months)

3. PHASE 3A: Multi-Tenant Foundation
3.1 Google OAuth Authentication
Purpose: Simplify onboarding and automatically sync therapist calendars
Current Pain Points:

Manual account creation is friction
Calendar must be manually configured (hardcoded)
No connection between user account and Google Calendar

Solution Architecture:
User Flow:
┌─────────────────────────────────────────┐
│ 1. Therapist clicks "Sign in with Google"│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Google OAuth Consent Screen          │
│    - Access to profile info             │
│    - Read/write Google Calendar         │
│    - Email address                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Google returns auth code             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Backend exchanges code for tokens    │
│    - Access token (1 hour)              │
│    - Refresh token (long-lived)         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. Fetch user profile from Google       │
│    - Email                              │
│    - Name                               │
│    - Profile picture                    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. Check if therapist exists in DB      │
│    - If exists: Update tokens           │
│    - If new: Create therapist record    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 7. Fetch user's Google Calendars        │
│    - List all calendars                 │
│    - Store calendar IDs                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 8. Create JWT session token             │
│    - Include therapist_id               │
│    - 7-day expiration                   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 9. Redirect to dashboard                │
│    - Calendars already synced           │
│    - Profile pre-filled                 │
└─────────────────────────────────────────┘
OAuth Scopes Required:
https://www.googleapis.com/auth/userinfo.email
https://www.googleapis.com/auth/userinfo.profile
https://www.googleapis.com/auth/calendar.readonly
https://www.googleapis.com/auth/calendar.events.readonly
Security Considerations:

Store refresh tokens encrypted at rest
Rotate tokens on each use
Implement token refresh logic (auto-renew before expiration)
Validate OAuth state parameter (CSRF protection)
Use HTTPS only for OAuth callbacks

Database Schema:
sql-- OAuth tokens table
CREATE TABLE oauth_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google'
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  scope TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(therapist_id, provider)
);

-- Encrypt tokens at rest
-- Use pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt before insert
CREATE OR REPLACE FUNCTION encrypt_oauth_tokens()
RETURNS TRIGGER AS $$
BEGIN
  NEW.access_token = pgp_sym_encrypt(NEW.access_token, current_setting('app.encryption_key'));
  NEW.refresh_token = pgp_sym_encrypt(NEW.refresh_token, current_setting('app.encryption_key'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Google Calendar Sync:**
```
On Login:
1. Fetch list of calendars via Calendar API
2. Store calendar metadata:
   - Calendar ID
   - Calendar name
   - Primary flag
   - Access role (owner, reader, writer)
3. Let therapist select which calendar to use for sessions

On Cron Job:
1. Use stored calendar ID (not hardcoded)
2. Use therapist's refresh token for API calls
3. Fetch events per therapist
4. Process notifications per therapist
Configuration:
env# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_OAUTH_REDIRECT_URI=https://psicopay.com/auth/google/callback

# Encryption
ENCRYPTION_KEY=your-secure-encryption-key-32-chars
```

---

### 3.2 Multi-Therapist Architecture

**Purpose:** Support multiple independent therapists with complete data isolation

**Current State:**
- Single therapist hardcoded
- No tenant separation
- Global configuration

**Target Architecture:**
```
Multi-Tenant Data Model:

therapists (tenant root)
    ↓
    ├─> patients (belongs to therapist)
    │       ↓
    │       └─> sessions (belongs to patient & therapist)
    │               ↓
    │               ├─> payments
    │               └─> notifications
    │
    ├─> availability_rules (therapist's schedule)
    ├─> availability_exceptions (vacations, etc.)
    ├─> payment_methods (therapist's payment config)
    └─> settings (therapist preferences)
Database Schema:
sql-- Core therapist table
CREATE TABLE therapists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id VARCHAR(255) UNIQUE NOT NULL, -- From Google OAuth
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  profile_picture_url TEXT,
  
  -- Professional info (from Profile Management)
  bio TEXT,
  specializations TEXT[], -- Array of specializations
  credentials JSONB, -- {degrees: [], certifications: []}
  experience_years INTEGER,
  therapeutic_approaches TEXT[], -- ['CBT', 'Psychoanalysis', etc.]
  languages TEXT[], -- ['Spanish', 'English']
  
  -- Business settings
  default_session_price DECIMAL(10,2) NOT NULL DEFAULT 15000,
  default_session_duration INTEGER NOT NULL DEFAULT 50, -- minutes
  currency VARCHAR(3) DEFAULT 'ARS',
  timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires',
  
  -- Calendar configuration
  google_calendar_id VARCHAR(255), -- Selected calendar for sessions
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  
  -- Public URL slug (for patient portal)
  slug VARCHAR(100) UNIQUE, -- psicopay.com/dra-maria
  
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- Update existing tables to include therapist_id
ALTER TABLE patients ADD COLUMN therapist_id UUID NOT NULL REFERENCES therapists(id);
ALTER TABLE sessions ADD COLUMN therapist_id UUID NOT NULL REFERENCES therapists(id);

-- Indexes for multi-tenant queries
CREATE INDEX idx_patients_therapist ON patients(therapist_id);
CREATE INDEX idx_sessions_therapist ON sessions(therapist_id);
CREATE INDEX idx_sessions_therapist_scheduled ON sessions(therapist_id, scheduled_at);

-- Row Level Security (RLS) for data isolation
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Therapists can only see their own data
CREATE POLICY therapist_isolation_patients ON patients
  FOR ALL
  USING (therapist_id = current_setting('app.current_therapist_id')::UUID);

CREATE POLICY therapist_isolation_sessions ON sessions
  FOR ALL
  USING (therapist_id = current_setting('app.current_therapist_id')::UUID);
```

**Backend Architecture:**
```
Request Flow with Tenant Context:

1. User makes request with JWT
   ↓
2. Auth middleware validates JWT
   ↓
3. Extract therapist_id from JWT
   ↓
4. Set PostgreSQL session variable:
   SET app.current_therapist_id = 'therapist-uuid'
   ↓
5. All queries automatically filtered by RLS
   ↓
6. Response sent to user
Middleware Pattern:
typescript// Conceptual structure - no implementation code

Middleware: authenticateTherapist
- Validate JWT token
- Extract therapist_id
- Attach to request context

Middleware: setTenantContext
- Get therapist_id from request
- Set PostgreSQL session variable
- Enable RLS policies

Service Layer:
- No need to manually filter by therapist_id
- RLS handles it automatically
- Prevents accidental data leaks
```

**Cron Job Multi-Tenant:**
```
Session Monitor Job Changes:

BEFORE (Phase 1-2):
- Fetch events from hardcoded calendar
- Process all sessions globally

AFTER (Phase 3):
- Fetch list of active therapists
- For each therapist:
  ├─> Set tenant context
  ├─> Fetch events from their calendar
  ├─> Process their sessions
  └─> Log results per therapist
Admin Super-User:
sql-- Admin users table (for platform management)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt
  role VARCHAR(50) DEFAULT 'admin', -- admin, support, developer
  can_access_all_data BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin can bypass RLS
ALTER TABLE patients FORCE ROW LEVEL SECURITY;

CREATE POLICY admin_bypass_patients ON patients
  FOR ALL
  TO admin_role
  USING (true);

-- Create admin role in PostgreSQL
CREATE ROLE admin_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_role;
```

**Dashboard Filtering:**
```
Frontend Dashboard:
- Show only current therapist's data
- API endpoints scoped to therapist
- No cross-tenant data visible

Admin Dashboard:
- View all therapists
- Switch context between therapists
- Platform-wide analytics
```

---

### 3.3 Professional Profile Management

**Purpose:** Allow therapists to showcase credentials and build trust with patients

**Therapist Feedback:**
- "Le molesta no tener su perfil, con información como su trayectoria, formación, estudios, certificaciones, experiencia, enfoques terapéuticos"

**Profile Sections:**
```
1. Basic Information
   - Name
   - Profile photo
   - Contact info (email, phone - optional)
   - Location (city, country)

2. Professional Credentials
   - Degrees (Psychology, Psychiatry, etc.)
   - University/Institution
   - Graduation year
   - License/Registration numbers

3. Certifications & Training
   - Additional certifications
   - Specialized training courses
   - Workshops attended
   - Continuing education

4. Experience
   - Years of practice
   - Previous positions
   - Areas of expertise
   - Patient demographics worked with

5. Therapeutic Approaches
   - CBT (Cognitive Behavioral Therapy)
   - Psychoanalysis
   - Gestalt
   - Humanistic
   - Systemic
   - Other (custom)

6. Specializations
   - Anxiety
   - Depression
   - Trauma/PTSD
   - Relationships
   - Eating disorders
   - Addiction
   - Child/adolescent
   - Couples therapy
   - Other (custom)

7. Languages
   - Spanish (native, fluent, conversational)
   - English
   - Portuguese
   - Other

8. About Me (Bio)
   - Free-text description
   - Therapeutic philosophy
   - What to expect in sessions

9. Public Availability
   - Toggle: Make profile public
   - Public URL: psicopay.com/[slug]
Database Schema:
sql-- Professional credentials (degrees)
CREATE TABLE therapist_degrees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  degree_type VARCHAR(100) NOT NULL, -- 'Bachelor', 'Master', 'PhD', 'MD'
  field_of_study VARCHAR(200) NOT NULL, -- 'Psychology', 'Psychiatry'
  institution VARCHAR(255) NOT NULL,
  graduation_year INTEGER,
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Certifications
CREATE TABLE therapist_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  issue_date DATE,
  expiration_date DATE,
  credential_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Work experience
CREATE TABLE therapist_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  position VARCHAR(200) NOT NULL,
  organization VARCHAR(255),
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if current
  description TEXT,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Specializations (many-to-many)
CREATE TABLE specializations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(50) -- 'mental_health', 'age_group', 'modality'
);

CREATE TABLE therapist_specializations (
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  specialization_id UUID REFERENCES specializations(id) ON DELETE CASCADE,
  PRIMARY KEY (therapist_id, specialization_id)
);

-- Therapeutic approaches (many-to-many)
CREATE TABLE therapeutic_approaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  acronym VARCHAR(20) -- 'CBT', 'DBT', etc.
);

CREATE TABLE therapist_approaches (
  therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
  approach_id UUID REFERENCES therapeutic_approaches(id) ON DELETE CASCADE,
  PRIMARY KEY (therapist_id, approach_id)
);

-- Seed common approaches
INSERT INTO therapeutic_approaches (name, acronym) VALUES
  ('Cognitive Behavioral Therapy', 'CBT'),
  ('Psychoanalysis', 'PA'),
  ('Gestalt Therapy', 'GT'),
  ('Humanistic Therapy', 'HT'),
  ('Systemic Therapy', 'ST'),
  ('Dialectical Behavior Therapy', 'DBT'),
  ('EMDR', 'EMDR'),
  ('Acceptance and Commitment Therapy', 'ACT');
```

**Profile UI Sections:**
```
Dashboard > My Profile

Tabs:
1. Basic Info
   - Name, photo, contact
   - Edit inline

2. Credentials
   - Add/edit degrees
   - Upload diploma images (optional)
   - License verification

3. Experience
   - Timeline view
   - Add positions
   - Current role

4. Specializations & Approaches
   - Multi-select checkboxes
   - Add custom entries

5. About Me
   - Rich text editor
   - Preview mode
   - Character limit: 500-1000 words

6. Public Profile
   - Toggle visibility
   - Preview public page
   - Custom URL slug
   - SEO fields (meta description)
```

**Public Profile Page:**
```
URL: psicopay.com/[slug]

Layout:
┌─────────────────────────────────────────┐
│  [Photo]  Dra. María González           │
│           Psicóloga Clínica             │
│           10 años de experiencia        │
│                                         │
│  [Agendar Sesión]                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Sobre Mí                               │
│  [Bio text...]                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Especialidades                         │
│  • Ansiedad                             │
│  • Depresión                            │
│  • Terapia de Pareja                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Enfoques Terapéuticos                  │
│  • Terapia Cognitivo-Conductual (TCC)  │
│  • Terapia Gestalt                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Formación                              │
│  🎓 Licenciatura en Psicología          │
│     Universidad de Buenos Aires (2012)  │
│  🎓 Maestría en Psicología Clínica      │
│     UBA (2015)                          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Idiomas                                │
│  • Español (nativo)                     │
│  • Inglés (fluido)                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Tarifa                                 │
│  $15,000 ARS por sesión (50 min)        │
│                                         │
│  [Ver Disponibilidad]                   │
└─────────────────────────────────────────┘
```

**Validation Rules:**
```
Required fields:
- Name
- At least 1 degree
- At least 1 therapeutic approach
- Bio (minimum 100 characters)

Optional fields:
- Profile photo (recommended)
- Certifications
- Experience
- Languages

Slug generation:
- Auto-generate from name
- Format: lowercase, hyphens, no special chars
- Check uniqueness
- Allow manual override
```

---

### 3.4 Dynamic Pricing System

**Purpose:** Allow flexible pricing per therapist and per patient

**Therapist Feedback:**
- "Le molesta no poder modificar el valor de su sesión de manera global, y también poder hacerlo para pacientes específicos"

**Pricing Hierarchy:**
```
Pricing Decision Flow:

1. Check: Does patient have specific price override?
   YES → Use patient-specific price
   NO → Continue

2. Check: Does session type have specific price?
   (e.g., couples therapy vs individual)
   YES → Use session-type price
   NO → Continue

3. Use therapist's default price
Database Schema:
sql-- Therapist default pricing (already in therapists table)
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS default_session_price DECIMAL(10,2);
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS default_session_duration INTEGER;
ALTER TABLE therapists ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ARS';

-- Session types with custom pricing
CREATE TABLE session_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL, -- 'Individual', 'Couples', 'Family', 'Group'
  duration_minutes INTEGER NOT NULL DEFAULT 50,
  price DECIMAL(10,2), -- NULL = use default price
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(therapist_id, name)
);

-- Patient-specific pricing overrides
CREATE TABLE patient_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  reason TEXT, -- Optional note: 'Student discount', 'Financial hardship', etc.
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE, -- NULL = indefinite
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES therapists(id),
  
  UNIQUE(patient_id, therapist_id)
);

-- Price history (audit trail)
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'therapist', 'session_type', 'patient'
  entity_id UUID NOT NULL, -- ID of therapist/session_type/patient
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  changed_by UUID REFERENCES therapists(id),
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);
```

**Pricing UI - Dashboard:**
```
Dashboard > Settings > Pricing

┌─────────────────────────────────────────┐
│  Precio Base por Sesión                │
│                                         │
│  $ [15000] ARS                          │
│  Duración: [50] minutos                 │
│                                         │
│  [Guardar Cambios]                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Precios por Tipo de Sesión            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Individual                      │   │
│  │ 50 min - Usar precio base       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Parejas                         │   │
│  │ 60 min - $20,000 ARS            │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [+ Agregar Tipo de Sesión]             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Historial de Cambios                  │
│                                         │
│  21/01/2026 - Base: $14,000 → $15,000  │
│  15/12/2025 - Base: $12,000 → $14,000  │
└─────────────────────────────────────────┘
```

**Patient-Specific Pricing UI:**
```
Dashboard > Patients > [Patient Detail] > Pricing

┌─────────────────────────────────────────┐
│  Precio Personalizado                   │
│                                         │
│  ☐ Usar precio base ($15,000)           │
│  ☑ Precio especial                      │
│                                         │
│  $ [10000] ARS por sesión               │
│                                         │
│  Motivo (opcional):                     │
│  [Estudiante con dificultades económicas]│
│                                         │
│  Válido desde: [21/01/2026]             │
│  Válido hasta: [_________] (indefinido) │
│                                         │
│  [Guardar]  [Cancelar]                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Historial de Precios                   │
│                                         │
│  21/01/2026 - $15,000 → $10,000         │
│    Motivo: Estudiante                   │
└─────────────────────────────────────────┘
```

**Price Calculation Logic:**
```
Function: calculateSessionPrice(sessionId)

Input: sessionId
Output: price (Decimal)

Steps:
1. Get session details
   - patient_id
   - therapist_id
   - session_type_id (if set)

2. Check patient-specific pricing
   - Query patient_pricing table
   - Filter by patient_id, therapist_id
   - Check valid_from <= today <= valid_until (or NULL)
   - If found: RETURN patient_price

3. Check session-type pricing
   - If session has session_type_id
   - Get session_type price
   - If price is NOT NULL: RETURN session_type_price

4. Return therapist default price
   - Get therapists.default_session_price
   - RETURN default_price

Example Query:
SELECT COALESCE(
  (SELECT price FROM patient_pricing 
   WHERE patient_id = $1 AND therapist_id = $2 
   AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
   AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
   LIMIT 1),
  
  (SELECT st.price FROM session_types st
   JOIN sessions s ON s.session_type_id = st.id
   WHERE s.id = $3 AND st.price IS NOT NULL
   LIMIT 1),
  
  (SELECT default_session_price FROM therapists WHERE id = $2)
) as final_price;
```

**Payment Link Generation:**
```
When creating Mercado Pago payment preference:

1. Calculate final price using calculateSessionPrice()
2. Create preference with calculated amount
3. Store reference to pricing used:
   - If patient_pricing: store patient_pricing_id
   - If session_type: store session_type_id
   - If default: NULL

This allows auditing which price was used at payment time
Multi-Currency Support (Future):
sql-- Prepare for future international expansion
ALTER TABLE therapists ADD COLUMN currency VARCHAR(3) DEFAULT 'ARS';

-- Supported currencies
-- ARS - Argentine Peso
-- USD - US Dollar
-- EUR - Euro
-- BRL - Brazilian Real
-- MXN - Mexican Peso

-- Store all prices in therapist's currency
-- Convert at payment time if needed
```

---

## 4. PHASE 3B: Patient Empowerment & Automation

### 4.1 Availability Management System

**Purpose:** Let therapists define when they're available for sessions

**Therapist Feedback:**
- "Le molesta tener que hacer manualmente el agendado de las sesiones"
- "La psicóloga debería tener la capacidad de definir su disponibilidad horaria (horarios ocupados por otras sesiones, horarios en los que directamente no está disponible)"

**Availability Types:**
```
1. Regular Availability (Weekly Schedule)
   - Define availability by day of week
   - Example: Monday 9am-5pm, Tuesday 2pm-8pm
   - Repeats every week

2. Exceptions (One-time blocks)
   - Vacations
   - Conferences
   - Personal days
   - Public holidays

3. Session Conflicts (Auto-detected)
   - Existing sessions in Google Calendar
   - Buffer time before/after sessions
   - Travel time (if needed)
Database Schema:
sql-- Weekly availability rules
CREATE TABLE availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0=Sunday, 1=Monday, ..., 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true, -- false = blocked time
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent overlapping slots
  CONSTRAINT no_overlap EXCLUDE USING gist (
    therapist_id WITH =,
    day_of_week WITH =,
    tsrange(start_time::time, end_time::time) WITH &&
  ),
  
  -- Validate times
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- One-time availability exceptions
CREATE TABLE availability_exceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT false, -- Usually blocking time
  reason VARCHAR(255), -- 'Vacation', 'Conference', 'Holiday'
  all_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- If all_day is true, start_time and end_time should be NULL
  CONSTRAINT all_day_logic CHECK (
    (all_day = true AND start_time IS NULL AND end_time IS NULL) OR
    (all_day = false AND start_time IS NOT NULL AND end_time IS NOT NULL)
  ),
  
  CONSTRAINT valid_time_range CHECK (
    all_day = true OR end_time > start_time
  )
);

-- Indexes for performance
CREATE INDEX idx_availability_rules_therapist_dow ON availability_rules(therapist_id, day_of_week);
CREATE INDEX idx_availability_exceptions_therapist_date ON availability_exceptions(therapist_id, exception_date);
```

**Availability UI - Dashboard:**
```
Dashboard > Settings > Availability

┌─────────────────────────────────────────┐
│  Horario Semanal                        │
│                                         │
│  Lunes                                  │
│  ☑ Disponible                           │
│  🕐 09:00 - 🕔 17:00                     │
│  [+ Agregar horario]                    │
│                                         │
│  Martes                                 │
│  ☑ Disponible                           │
│  🕐 14:00 - 🕗 20:00                     │
│                                         │
│  Miércoles                              │
│  ☑ Disponible                           │
│  🕐 09:00 - 🕔 17:00                     │
│                                         │
│  Jueves                                 │
│  ☐ No disponible                        │
│                                         │
│  Viernes                                │
│  ☑ Disponible                           │
│  🕐 09:00 - 🕜 13:00                     │
│                                         │
│  Sábado / Domingo                       │
│  ☐ No disponible                        │
│                                         │
│  [Guardar Cambios]                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Excepciones                            │
│                                         │
│  📅 25/01/2026 - 30/01/2026             │
│     Vacaciones de verano                │
│     [Editar] [Eliminar]                 │
│                                         │
│  📅 15/02/2026                           │
│     Conferencia (todo el día)           │
│     [Editar] [Eliminar]                 │
│                                         │
│  [+ Agregar Excepción]                  │
└─────────────────────────────────────────┘
```

**Calendar View with Availability:**
```
Vista Calendario (Dashboard):

┌─────────────────────────────────────────┐
│  Enero 2026               [<] [Hoy] [>] │
├─────────────────────────────────────────┤
│  Lun   Mar   Mié   Jue   Vie   Sáb  Dom│
│                                   1    2│
│   3     4     5     6     7     8    9 │
│  10    11    12    13    14    15   16 │
│  17    18    19    20    21    22   23 │
│  24    25    26    27    28    29   30 │
│  31                                     │
└─────────────────────────────────────────┘

Legend:
🟢 Available slots
🔴 Blocked (unavailable)
🟡 Booked sessions
🔵 Vacation/exception

Day View (click on a day):
┌─────────────────────────────────────────┐
│  Lunes 20 de Enero                      │
├─────────────────────────────────────────┤
│  09:00 - 09:50  🟢 Disponible           │
│  10:00 - 10:50  🟡 Sesión: Juan Pérez   │
│  11:00 - 11:50  🟢 Disponible           │
│  12:00 - 12:50  🟢 Disponible           │
│  13:00 - 13:50  🔴 Almuerzo (bloqueado) │
│  14:00 - 14:50  🟢 Disponible           │
│  15:00 - 15:50  🟡 Sesión: María García │
│  16:00 - 16:50  🟢 Disponible           │
│  17:00 - 17:50  🟢 Disponible           │
└─────────────────────────────────────────┘
```

**Availability Calculation Algorithm:**
```
Function: getAvailableSlots(therapistId, date)

Input: 
  - therapistId: UUID
  - date: Date (e.g., 2026-01-20)

Output:
  - Array of time slots with availability status

Steps:

1. Get day of week from date
   dayOfWeek = date.getDayOfWeek() // 0-6

2. Get base availability for this day
   SELECT * FROM availability_rules 
   WHERE therapist_id = $1 AND day_of_week = $2

3. Get exceptions for this specific date
   SELECT * FROM availability_exceptions
   WHERE therapist_id = $1 AND exception_date = $3

4. Get existing sessions from Google Calendar
   - Fetch events for this date
   - Include buffer time (e.g., 10 minutes between sessions)

5. Generate time slots
   - Start from base availability times
   - Duration = therapist.default_session_duration
   - Generate slots every duration minutes

6. Mark each slot:
   - If covered by exception (blocked): UNAVAILABLE
   - If overlaps with existing session: BOOKED
   - If outside base availability: UNAVAILABLE
   - Otherwise: AVAILABLE

7. Return slots array

Example Output:
[
  { start: "09:00", end: "09:50", status: "available" },
  { start: "10:00", end: "10:50", status: "booked", sessionId: "xyz" },
  { start: "11:00", end: "11:50", status: "available" },
  { start: "12:00", end: "12:50", status: "unavailable", reason: "lunch" }
]
```

**Google Calendar Sync:**
```
Two-way sync considerations:

FROM Google Calendar → System:
- Cron job fetches new/updated events
- Mark those times as booked in availability
- Already implemented in Phase 1

TO System → Google Calendar:
- When patient books via portal (Phase 3B.2)
- Create event in therapist's Google Calendar
- Include patient name, Meet link, payment status

Conflict Detection:
- Before booking, check Google Calendar
- Ensure no double-booking
- Warn if slot was just taken
Buffer Time:
sql-- Add buffer configuration to therapists table
ALTER TABLE therapists ADD COLUMN buffer_before_minutes INTEGER DEFAULT 0;
ALTER TABLE therapists ADD COLUMN buffer_after_minutes INTEGER DEFAULT 10;

-- Example: 10-minute buffer after each session
-- Session: 10:00-10:50
-- Next available slot: 11:00 (not 10:50)

-- Adjust availability calculation to include buffers
```

---

### 4.2 Patient Self-Scheduling Portal

**Purpose:** Allow patients to book sessions directly without therapist involvement

**Therapist Feedback:**
- "Le molesta tener que hacer manualmente el agendado de las sesiones"
- "Quizá estaría bueno que lo hagan los pacientes viendo la disponibilidad de la psicóloga"

**User Flow - Patient Booking:**
```
┌─────────────────────────────────────────┐
│ 1. Patient visits therapist public page│
│    psicopay.com/dra-maria               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. Views therapist profile              │
│    - Photo, bio, credentials            │
│    - Specializations                    │
│    - Price per session                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Clicks "Ver Disponibilidad"          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Selects date from calendar           │
│    - Shows next 30 days                 │
│    - Days with availability highlighted │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 5. Selects time slot                    │
│    - Shows all available times for day  │
│    - Each slot shows duration & price   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 6. Enters patient information           │
│    - Name                               │
│    - Email                              │
│    - Phone (WhatsApp)                   │
│    - First time? Yes/No                 │
│    - Brief reason for consultation      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 7. Reviews booking details              │
│    - Date & time                        │
│    - Therapist name                     │
│    - Session duration                   │
│    - Total price                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 8. Selects payment method               │
│    - Mercado Pago                       │
│    - Transferencia Bancaria             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 9. Completes payment                    │
│    - Redirected to payment gateway      │
│    - Or shows bank transfer instructions│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 10. Payment confirmation                │
│     - If Mercado Pago: Instant          │
│     - If Transfer: Pending verification │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 11. Session confirmed                   │
│     - Email confirmation sent           │
│     - WhatsApp confirmation sent        │
│     - Added to Google Calendar          │
│     - Meet link generated               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 12. Reminders sent automatically        │
│     - 24h before (existing flow)        │
│     - 15 min before (existing flow)     │
└─────────────────────────────────────────┘
Database Schema:
sql-- Booking requests (before payment confirmation)
CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  -- Patient info (may not exist in patients table yet)
  patient_name VARCHAR(255) NOT NULL,
  patient_email VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL, -- E.164 format
  is_new_patient BOOLEAN DEFAULT true,
  reason_for_consultation TEXT,
  
  -- Session details
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  session_type_id UUID REFERENCES session_types(id),
  
  -- Pricing
  price_at_booking DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_method VARCHAR(50), -- 'mercadopago', 'bank_transfer'
  payment_preference_id VARCHAR(255), -- Mercado Pago preference ID
  payment_link TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending_payment', 
  -- 'pending_payment', 'payment_processing', 'confirmed', 'cancelled', 'expired'
  
  -- Metadata
  expires_at TIMESTAMP NOT NULL, -- Payment must be completed by this time
  created_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  
  -- Once confirmed, link to actual session
  session_id UUID REFERENCES sessions(id),
  
  CONSTRAINT valid_expiration CHECK (expires_at > created_at)
);

-- Index for cleanup of expired bookings
CREATE INDEX idx_booking_requests_expires ON booking_requests(expires_at) 
  WHERE status = 'pending_payment';
```

**Public Booking Page Structure:**
```
URL: psicopay.com/[therapist-slug]/book

┌─────────────────────────────────────────┐
│  🏥 Agendar Sesión con Dra. María      │
│                                         │
│  Paso 1 de 4: Selecciona Fecha         │
├─────────────────────────────────────────┤
│                                         │
│  [Calendario]                           │
│  Enero 2026                             │
│                                         │
│  Dom Lun Mar Mié Jue Vie Sáb           │
│      20  21  22  23  24  25  26        │
│  🟢  🟢  🔴  🟢  🔴  🟢  🔴           │
│                                         │
│  🟢 = Disponible                        │
│  🔴 = Sin disponibilidad                │
│                                         │
│  [Siguiente]                            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Paso 2 de 4: Selecciona Horario       │
├─────────────────────────────────────────┤
│                                         │
│  Lunes 20 de Enero, 2026                │
│                                         │
│  ⏰ 09:00 - 09:50  [Seleccionar]        │
│  ⏰ 11:00 - 11:50  [Seleccionar]        │
│  ⏰ 14:00 - 14:50  [Seleccionar]        │
│  ⏰ 16:00 - 16:50  [Seleccionar]        │
│                                         │
│  [Atrás]                                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Paso 3 de 4: Tus Datos                │
├─────────────────────────────────────────┤
│                                         │
│  Nombre Completo: *                     │
│  [_________________________________]    │
│                                         │
│  Email: *                               │
│  [_________________________________]    │
│                                         │
│  Teléfono (WhatsApp): *                 │
│  [+54] [911] [________]                 │
│                                         │
│  ☐ Es mi primera sesión                 │
│                                         │
│  Motivo de consulta (opcional):         │
│  [_________________________________]    │
│  [_________________________________]    │
│                                         │
│  [Atrás]  [Continuar]                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Paso 4 de 4: Confirmación y Pago      │
├─────────────────────────────────────────┤
│                                         │
│  Resumen de tu Sesión                   │
│                                         │
│  📅 Lunes 20 de Enero, 2026             │
│  🕐 09:00 - 09:50 (50 minutos)          │
│  👩‍⚕️ Dra. María González               │
│  💰 $15,000 ARS                          │
│                                         │
│  ─────────────────────────────────      │
│                                         │
│  Método de Pago:                        │
│                                         │
│  ○ Mercado Pago                         │
│     Tarjeta de crédito/débito           │
│                                         │
│  ○ Transferencia Bancaria               │
│     Confirmación manual                 │
│                                         │
│  [Confirmar y Pagar]                    │
│                                         │
│  Al confirmar aceptas los términos      │
│  y política de privacidad               │
└─────────────────────────────────────────┘
```

**Payment Flow - Mercado Pago:**
```
After clicking "Confirmar y Pagar":

1. Create booking_request record (status: pending_payment)
2. Create Mercado Pago payment preference
   - Amount: price_at_booking
   - External reference: booking_request.id
   - Expiration: 1 hour
3. Redirect to Mercado Pago checkout
4. Patient completes payment
5. Webhook received (existing Phase 1 logic)
6. Find booking_request by external_reference
7. Create/update patient record
8. Create session record
9. Update booking_request:
   - status: confirmed
   - session_id: [new session ID]
10. Create event in Google Calendar
11. Send confirmation email + WhatsApp
```

**Payment Flow - Bank Transfer:**
```
After clicking "Confirmar y Pagar" (with Transfer selected):

1. Create booking_request record (status: pending_payment)
2. Display bank transfer instructions:
   
   ┌─────────────────────────────────────┐
   │  Transferencia Bancaria             │
   ├─────────────────────────────────────┤
   │  Banco: Banco Galicia               │
   │  CBU: 0070098930000012345678        │
   │  Alias: DRA.MARIA.PSI               │
   │  CUIT: 27-12345678-9                │
   │  Titular: María González            │
   │  Monto: $15,000.00                  │
   │                                     │
   │  Referencia: BK-ABC123              │
   │  (Incluir en concepto)              │
   │                                     │
   │  📸 Subir Comprobante               │
   │  [Seleccionar archivo...]           │
   │                                     │
   │  [Enviar Comprobante]               │
   └─────────────────────────────────────┘

3. Patient uploads proof of transfer
4. booking_request status: payment_processing
5. Therapist receives notification in dashboard
6. Therapist manually confirms payment
7. Continue with steps 7-11 from MP flow
```

**Conflict Prevention:**
```
Race Condition Protection:

Problem: Two patients try to book same slot simultaneously

Solution: Database-level locking

1. When patient selects slot, soft-lock it
   - Create temporary reservation (5 minutes)
   - Other patients see slot as "being booked"

2. If payment not completed in 5 minutes
   - Release lock
   - Slot becomes available again

3. Use PostgreSQL advisory locks or serializable transactions

Implementation:
BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

-- Check if slot is available
SELECT * FROM availability WHERE ...
FOR UPDATE NOWAIT;

-- If successful, create booking
INSERT INTO booking_requests ...

COMMIT;

-- If NOWAIT fails, slot is locked by another transaction
-- Return "Slot no longer available" error
```

**Email & WhatsApp Confirmations:**
```
Confirmation Message (WhatsApp):

"¡Sesión confirmada! ✅

Hola [Patient Name],

Tu sesión con Dra. María González está confirmada:

📅 Lunes 20 de Enero, 2026
🕐 09:00 - 09:50
💰 Pagado: $15,000

Recibirás el link de videollamada 15 minutos antes de la sesión.

Si necesitas reprogramar o cancelar, responde a este mensaje.

¡Nos vemos pronto! 😊"

Email Confirmation:

Subject: Sesión Confirmada - [Date] a las [Time]

[HTML email with:]
- Therapist photo and name
- Session details
- Payment receipt
- Add to calendar button (.ics file)
- Cancellation policy
- Contact information
```

---

### 4.3 Enhanced Patient Profiles

**Purpose:** Store comprehensive patient information for better care

**Therapist Feedback:**
- "Le molesta no tener un perfil de cada uno de sus pacientes con información básica (no confidencial)"

**Patient Profile Sections:**
```
1. Basic Information
   - Full name
   - Date of birth
   - Gender
   - Email
   - Phone (WhatsApp)
   - Emergency contact

2. Contact Preferences
   - Preferred contact method (WhatsApp, Email, SMS)
   - Best time to contact
   - Language preference

3. Session History
   - Total sessions attended
   - Total sessions cancelled
   - Last session date
   - Next session date
   - Attendance rate

4. Payment Information
   - Total paid
   - Outstanding balance
   - Payment method preferences
   - Custom pricing (if any)

5. Administrative Notes
   - General notes (non-clinical)
   - Preferences (e.g., prefers morning sessions)
   - Special accommodations needed
   - Communication notes

6. Demographics (Optional)
   - Occupation
   - Referral source (how they found therapist)
   - Location (city)

7. Session Preferences
   - Preferred session duration
   - Preferred day/time
   - Session frequency (weekly, biweekly)
Database Schema:
sql-- Enhanced patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_contact_method VARCHAR(20) DEFAULT 'whatsapp';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'es';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS occupation VARCHAR(200);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS referral_source VARCHAR(255);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Administrative notes (non-clinical)
CREATE TABLE patient_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'preferences', 'administrative'
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES therapists(id)
);

-- Session preferences
CREATE TABLE patient_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  preferred_session_duration INTEGER, -- Override therapist default
  preferred_days INTEGER[], -- Array of day numbers [1,3,5] = Mon, Wed, Fri
  preferred_time_start TIME,
  preferred_time_end TIME,
  session_frequency VARCHAR(50), -- 'weekly', 'biweekly', 'monthly'
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(patient_id, therapist_id)
);

-- Calculated fields (updated by triggers)
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_sessions_attended INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_sessions_cancelled INTEGER DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS last_session_date TIMESTAMP;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS next_session_date TIMESTAMP;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS attendance_rate DECIMAL(5,2); -- Percentage
ALTER TABLE patients ADD COLUMN IF NOT EXISTS total_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(10,2) DEFAULT 0;

-- Triggers to keep calculated fields updated
CREATE OR REPLACE FUNCTION update_patient_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update session counts
  UPDATE patients
  SET 
    total_sessions_attended = (
      SELECT COUNT(*) FROM sessions 
      WHERE patient_id = NEW.patient_id 
      AND scheduled_at < NOW() 
      AND payment_status = 'paid'
    ),
    total_sessions_cancelled = (
      SELECT COUNT(*) FROM sessions 
      WHERE patient_id = NEW.patient_id 
      AND status = 'cancelled'
    ),
    last_session_date = (
      SELECT MAX(scheduled_at) FROM sessions
      WHERE patient_id = NEW.patient_id
      AND scheduled_at < NOW()
    ),
    next_session_date = (
      SELECT MIN(scheduled_at) FROM sessions
      WHERE patient_id = NEW.patient_id
      AND scheduled_at > NOW()
    )
  WHERE id = NEW.patient_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_patient_stats
AFTER INSERT OR UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_patient_stats();
```

**Patient Profile UI - Dashboard:**
```
Dashboard > Patients > [Patient Name]

┌─────────────────────────────────────────┐
│  👤 Juan Pérez                          │
│                                         │
│  📧 juan.perez@email.com                │
│  📱 +54 911 1234-5678                   │
│  🎂 35 años (15/03/1990)                │
│                                         │
│  [Editar]  [Enviar Mensaje]             │
└─────────────────────────────────────────┘

Tabs:
┌─────────────────────────────────────────┐
│ [Resumen] [Sesiones] [Pagos] [Notas]   │
├─────────────────────────────────────────┤
│                                         │
│  📊 Estadísticas                        │
│  ┌───────────────────────────────────┐ │
│  │ Total Sesiones: 12                │ │
│  │ Asistencia: 91.6% (11 de 12)      │ │
│  │ Cancelaciones: 1                  │ │
│  │ Última sesión: 15/01/2026         │ │
│  │ Próxima sesión: 22/01/2026 09:00  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  💰 Información de Pago                │
│  ┌───────────────────────────────────┐ │
│  │ Total pagado: $165,000            │ │
│  │ Precio actual: $15,000/sesión     │ │
│  │ Método preferido: Mercado Pago    │ │
│  │ Saldo pendiente: $0               │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📝 Preferencias                        │
│  ┌───────────────────────────────────┐ │
│  │ Horarios preferidos:              │ │
│  │ Lunes/Miércoles 09:00-12:00       │ │
│  │                                   │ │
│  │ Frecuencia: Semanal               │ │
│  │ Duración: 50 minutos              │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📌 Notas Destacadas                   │
│  ┌───────────────────────────────────┐ │
│  │ Prefiere sesiones por la mañana  │ │
│  │ Estudiante - descuento aplicado  │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘

Tab: Sesiones
┌─────────────────────────────────────────┐
│  Historial de Sesiones                  │
│                                         │
│  🟢 22/01/2026 09:00 - Próxima          │
│                                         │
│  ✅ 15/01/2026 09:00 - Completada       │
│     Pagado: $15,000 (Mercado Pago)      │
│                                         │
│  ✅ 08/01/2026 09:00 - Completada       │
│     Pagado: $15,000 (Transferencia)     │
│                                         │
│  ❌ 18/12/2025 09:00 - Cancelada        │
│     Motivo: Paciente enfermo            │
│                                         │
│  [Ver todas las sesiones]               │
└─────────────────────────────────────────┘

Tab: Notas
┌─────────────────────────────────────────┐
│  Notas Administrativas                  │
│                                         │
│  [+ Agregar Nota]                       │
│                                         │
│  📌 Preferencias de horario             │
│  21/01/2026 - Dra. María                │
│  Prefiere sesiones tempranas (antes     │
│  de 12pm) por trabajo. Flexible con     │
│  días de semana.                        │
│  [Editar] [Desanclar]                   │
│                                         │
│  📝 Descuento estudiantil               │
│  10/12/2025 - Dra. María                │
│  Aplicado descuento estudiantil.        │
│  Precio: $10,000 por sesión.            │
│  [Editar]                               │
│                                         │
│  📝 Fuente de referencia                │
│  01/10/2025 - Dra. María                │
│  Referido por Dra. Laura Rodríguez      │
│  [Editar]                               │
└─────────────────────────────────────────┘
```

**Privacy & GDPR Compliance:**
```
Important Considerations:

1. Non-Clinical Data Only
   - DO NOT store therapy session notes
   - DO NOT store diagnoses or clinical information
   - Only administrative and preference data

2. Data Access Control
   - Patient can request to view their data (Phase 2.5: Patient Portal)
   - Patient can request data deletion
   - Export patient data in JSON/CSV format

3. Audit Trail
   - Log all access to patient profiles
   - Log all changes to patient data
   - Include who, when, what changed

4. Data Retention
   - Keep data while patient is active
   - After 2 years of inactivity, archive
   - After 5 years, offer deletion
   - Comply with local healthcare regulations
```

---

### 4.4 Recurring Sessions Automation

**Purpose:** Automatically schedule regular therapy sessions

**Therapist Feedback:**
- "Sesiones recurrentes requieren re-agendado manual"
- Patients in long-term therapy (weekly/biweekly) shouldn't need to re-book each time

**Recurring Session Types:**
```
1. Weekly
   - Same day and time every week
   - Example: Every Monday at 9:00 AM

2. Biweekly
   - Every other week
   - Example: Every other Wednesday at 2:00 PM

3. Monthly
   - Same day of month
   - Example: First Monday of each month at 10:00 AM

4. Custom Frequency
   - Every N days
   - Example: Every 10 days
Database Schema:
sql-- Recurring session configurations
CREATE TABLE recurring_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  
  -- Schedule configuration
  frequency VARCHAR(50) NOT NULL, -- 'weekly', 'biweekly', 'monthly', 'custom'
  interval_days INTEGER, -- For 'custom' frequency
  day_of_week INTEGER, -- 0-6 for weekly/biweekly
  time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Session details
  session_type_id UUID REFERENCES session_types(id),
  price DECIMAL(10,2) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = indefinite
  
  -- Generated sessions tracking
  last_generated_date DATE, -- Last date a session was created
  next_generation_date DATE, -- Next date to create a session
  
  -- Payment automation
  auto_send_payment_reminders BOOLEAN DEFAULT true,
  advance_payment_days INTEGER DEFAULT 2, -- Send payment link N days before
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES therapists(id),
  
  CONSTRAINT valid_frequency CHECK (
    (frequency = 'custom' AND interval_days IS NOT NULL) OR
    (frequency != 'custom' AND interval_days IS NULL)
  ),
  
  CONSTRAINT valid_weekly CHECK (
    (frequency IN ('weekly', 'biweekly') AND day_of_week IS NOT NULL) OR
    (frequency NOT IN ('weekly', 'biweekly'))
  )
);

-- Track which sessions came from recurring config
ALTER TABLE sessions ADD COLUMN recurring_session_id UUID REFERENCES recurring_sessions(id);
ALTER TABLE sessions ADD COLUMN is_recurring BOOLEAN DEFAULT false;

-- Indexes
CREATE INDEX idx_recurring_sessions_next_gen ON recurring_sessions(next_generation_date)
  WHERE is_active = true;
```

**Recurring Session UI - Dashboard:**
```
Dashboard > Patients > [Patient] > Sesiones

┌─────────────────────────────────────────┐
│  Sesiones Recurrentes                   │
│                                         │
│  ✅ ACTIVA                               │
│  Cada Lunes a las 09:00                 │
│  Inicio: 08/01/2026                     │
│  50 minutos - $15,000                   │
│                                         │
│  Próximas 3 sesiones generadas:         │
│  • 20/01/2026 09:00 ✅ Pagada           │
│  • 27/01/2026 09:00 🟡 Pendiente pago   │
│  • 03/02/2026 09:00 📅 Generada         │
│                                         │
│  [Editar]  [Pausar]  [Detener]          │
└─────────────────────────────────────────┘

Crear Nueva Sesión Recurrente:
┌─────────────────────────────────────────┐
│  Configurar Sesiones Recurrentes        │
│                                         │
│  Frecuencia: *                          │
│  ○ Semanal                              │
│  ○ Quincenal                            │
│  ○ Mensual                              │
│  ○ Personalizado (cada X días)          │
│                                         │
│  Día de la semana: *                    │
│  [Lunes    ▼]                           │
│                                         │
│  Hora: *                                │
│  [09] : [00]                            │
│                                         │
│  Duración:                              │
│  [50] minutos                           │
│                                         │
│  Precio por sesión:                     │
│  $ [15000] ARS                          │
│                                         │
│  Fecha de inicio: *                     │
│  [20/01/2026]                           │
│                                         │
│  Fecha de fin:                          │
│  ☐ Sin fecha de fin                     │
│  ☐ Hasta: [__/__/____]                  │
│                                         │
│  ☑ Enviar recordatorios de pago         │
│     automáticamente [2] días antes      │
│                                         │
│  [Guardar]  [Cancelar]                  │
└─────────────────────────────────────────┘
```

**Automatic Generation Logic:**
```
Cron Job: Generate Recurring Sessions
Frequency: Daily at 00:00 (midnight)

Algorithm:

1. Fetch all active recurring_sessions
   WHERE is_active = true
   AND next_generation_date <= CURRENT_DATE

2. For each recurring_session:
   
   a. Calculate session date based on frequency
      - Weekly: next_generation_date + 7 days
      - Biweekly: next_generation_date + 14 days
      - Monthly: same day next month
      - Custom: next_generation_date + interval_days
   
   b. Check if session date exceeds end_date
      - If yes: mark recurring_session as inactive
      - Skip this recurring_session
   
   c. Check for conflicts (availability, existing sessions)
      - Query Google Calendar for therapist
      - Check sessions table for patient
      - If conflict: log warning, skip (don't auto-create)
   
   d. Create session record
      - therapist_id, patient_id from recurring_session
      - scheduled_at = calculated date + time
      - duration, price from recurring_session
      - payment_status = 'pending'
      - is_recurring = true
      - recurring_session_id = recurring_session.id
   
   e. Create Google Calendar event
      - Title: "Sesión - [Patient Name]"
      - Time: calculated date + time
      - Duration: from recurring_session
      - Add Google Meet
   
   f. Create payment preference (Mercado Pago)
      - If auto_send_payment_reminders = true
      - Schedule payment reminder for (session_date - advance_payment_days)
   
   g. Update recurring_session
      - last_generated_date = calculated date
      - next_generation_date = calculate next occurrence
   
   h. Log success

3. Report generation summary
   - Total recurring configs processed
   - Sessions created
   - Conflicts skipped
   - Errors encountered
```

**Conflict Handling:**
```
When conflict detected during automatic generation:

1. Log conflict details:
   - Recurring session ID
   - Intended date/time
   - Conflict type (availability, existing session)

2. Notify therapist via dashboard:
   "⚠️ No se pudo generar sesión recurrente para [Patient]
   el [Date] a las [Time] debido a conflicto de horario.
   Por favor, revisa y agenda manualmente."

3. Send notification to therapist (email/WhatsApp):
   "Hola Dra. María,
   
   La sesión recurrente de Juan Pérez para el lunes 27/01 
   a las 9:00 no se pudo generar automáticamente debido a 
   un conflicto en tu calendario.
   
   Por favor, agenda manualmente o ajusta la configuración.
   
   Ver detalles: [link to dashboard]"

4. Mark in recurring_session:
   - Add to conflict_count
   - If conflict_count > 3: pause recurring_session
   - Notify therapist to review configuration
```

**Patient Notification Flow:**
```
For recurring sessions with auto_send_payment_reminders = true:

1. Session created (e.g., 7 days in advance)
2. Schedule payment reminder for (session_date - advance_payment_days)
   - If advance_payment_days = 2
   - Session on Monday 27/01
   - Send reminder on Saturday 25/01

3. Payment reminder sent automatically (existing Phase 1 logic)
4. If patient pays: confirmation sent
5. If patient doesn't pay by 24h before: late reminder
6. 15 min before: Meet link sent (if paid)

Difference from manual sessions:
- Recurring sessions generate further in advance (7 days)
- Payment reminders sent earlier (2-3 days before, not 24h before)
- Patient can see multiple upcoming sessions
```

**Pause/Resume Recurring Sessions:**
```
Use Cases:
- Therapist vacation
- Patient temporary break
- Change in schedule

Pause Action:
1. Set recurring_session.is_active = false
2. Keep configuration intact (don't delete)
3. Stop generating new sessions
4. Existing generated sessions remain
   - Can be cancelled individually if needed

Resume Action:
1. Set recurring_session.is_active = true
2. Recalculate next_generation_date
   - Based on current date + frequency
3. Resume automatic generation

Example:
- Recurring: Every Monday 9:00
- Paused on: 20/01/2026
- Resumed on: 10/02/2026
- Next session generated: 17/02/2026 (next Monday)
```

**Modify Recurring Session:**
```
When therapist modifies recurring configuration:

1. Update recurring_session record with new values
2. Future sessions (not yet started):
   - Option A: Update all future sessions
   - Option B: Keep existing, apply changes to new only
   - Let therapist choose

3. Past/completed sessions:
   - Never modify (historical record)

4. Currently booked/paid sessions:
   - Show warning if modification affects these
   - Require confirmation to change

UI Flow:
"⚠️ Existen 3 sesiones futuras con la configuración actual.
¿Qué deseas hacer?

○ Actualizar solo sesiones futuras nuevas (recomendado)
○ Actualizar TODAS las sesiones futuras
○ Cancelar cambio

[Continuar]  [Cancelar]"
```

---

## 5. PHASE 3C: Payment Optimization & Trust

### 5.1 Dual Payment System

**Purpose:** Offer Mercado Pago AND bank transfers to reduce fees

**Therapist Feedback:**
- "Le molesta las comisiones tan altas de Mercado Pago (4.99% + IVA)"
- "¿Habrá otras opciones? Otros proveedores de pagos?"
- "Hacer directamente transferencias bancarias (habría que ver cómo confirmar que la transferencia llegó, de manera automática o manual)"

**Payment Methods Comparison:**
```
┌─────────────────┬──────────────┬─────────────┬──────────────┐
│ Method          │ Fee          │ Confirmation│ Patient UX   │
├─────────────────┼──────────────┼─────────────┼──────────────┤
│ Mercado Pago    │ ~5% + IVA    │ Instant     │ Very Easy    │
│                 │ ($750/sesión)│ (webhook)   │ (credit card)│
├─────────────────┼──────────────┼─────────────┼──────────────┤
│ Bank Transfer   │ $0           │ Manual      │ Moderate     │
│                 │              │ (1-24h)     │ (bank app)   │
└─────────────────┴──────────────┴─────────────┴──────────────┘

For $15,000 session:
- Mercado Pago: ~$750 fee → Therapist receives ~$14,250
- Bank Transfer: $0 fee → Therapist receives $15,000

Monthly savings (20 sessions):
- If 50% use transfers: Save ~$7,500/month
- If 70% use transfers: Save ~$10,500/month
Database Schema:
sql-- Payment methods configuration per therapist
CREATE TABLE therapist_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL, -- 'mercadopago', 'bank_transfer'
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- Order in payment selection UI
  
  -- Method-specific configuration (JSONB)
  config JSONB NOT NULL,
  /*
  For mercadopago:
  {
    "access_token": "encrypted_token",
    "public_key": "public_key"
  }
  
  For bank_transfer:
  {
    "bank_name": "Banco Galicia",
    "account_type": "Cuenta Corriente",
    "cbu": "0070098930000012345678",
    "alias": "DRA.MARIA.PSI",
    "cuit": "27-12345678-9",
    "account_holder": "María González"
  }
  */
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(therapist_id, method_type)
);

-- Bank transfer confirmations
CREATE TABLE bank_transfer_confirmations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- Link to session
  booking_request_id UUID REFERENCES booking_requests(id), -- Or booking if not yet confirmed
  
  -- Transfer details
  transfer_amount DECIMAL(10,2) NOT NULL,
  transfer_date DATE NOT NULL,
  transfer_reference VARCHAR(255), -- Patient's transfer reference/description
  
  -- Proof of payment
  proof_image_url TEXT, -- S3/storage URL for uploaded image
  proof_uploaded_at TIMESTAMP,
  
  -- Verification
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verified_by UUID REFERENCES therapists(id),
  verified_at TIMESTAMP,
  verification_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_amount CHECK (transfer_amount > 0)
);

-- Update payment_preferences to support multiple methods
ALTER TABLE payment_preferences 
  ADD COLUMN payment_method VARCHAR(50) DEFAULT 'mercadopago';
  -- 'mercadopago', 'bank_transfer'
```

**Payment Method Configuration UI:**
```
Dashboard > Settings > Métodos de Pago

┌─────────────────────────────────────────┐
│  Mercado Pago                           │
│  ☑ Activo                               │
│                                         │
│  Access Token: ****************************│
│  Public Key: TEST-**********************  │
│                                         │
│  Comisión: ~5% + IVA                    │
│  Confirmación: Instantánea              │
│                                         │
│  [Reconectar Mercado Pago]              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Transferencia Bancaria                 │
│  ☑ Activo                               │
│                                         │
│  Banco: [Banco Galicia      ▼]          │
│  Tipo: [Cuenta Corriente    ▼]          │
│                                         │
│  CBU: [0070098930000012345678]          │
│  Alias: [DRA.MARIA.PSI]                 │
│  CUIT: [27-12345678-9]                  │
│  Titular: [María González]              │
│                                         │
│  Comisión: $0                           │
│  Confirmación: Manual (tú verificas)    │
│                                         │
│  [Guardar Cambios]                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Orden de Preferencia                   │
│  (para pacientes en portal de reserva)  │
│                                         │
│  1. ☑ Transferencia Bancaria            │
│  2. ☑ Mercado Pago                      │
│                                         │
│  💡 Los pacientes verán primero la      │
│     opción de transferencia (sin costo) │
└─────────────────────────────────────────┘
```

**Patient Payment Selection UI:**
```
During booking (Patient Portal):

┌─────────────────────────────────────────┐
│  Método de Pago                         │
│                                         │
│  ○ Transferencia Bancaria (Recomendado)│
│     ✅ Sin cargos adicionales            │
│     ⏱️ Confirmación en 24 horas         │
│                                         │
│  ○ Mercado Pago                         │
│     💳 Tarjeta de crédito/débito        │
│     ⚡ Confirmación instantánea         │
│     ⚠️ Comisión incluida en el precio   │
│                                         │
│  [Continuar]                            │
└─────────────────────────────────────────┘
```

---

### 5.2 Bank Transfer Management

**Purpose:** Handle manual verification of bank transfers

**Bank Transfer Flow (Patient Side):**
```
Step 1: Patient selects "Transferencia Bancaria"

Step 2: Display transfer instructions
┌─────────────────────────────────────────┐
│  Realiza la Transferencia               │
│                                         │
│  Banco: Banco Galicia                   │
│  CBU: 0070098930000012345678            │
│  Alias: DRA.MARIA.PSI                   │
│  CUIT: 27-12345678-9                    │
│  Titular: María González                │
│                                         │
│  Monto: $15,000.00                      │
│                                         │
│  ⚠️ IMPORTANTE:                          │
│  Incluye este código en el concepto:    │
│  📋 REF-ABC123                          │
│  (Copiar al portapapeles)               │
│                                         │
│  Una vez realizada la transferencia,    │
│  sube el comprobante aquí:              │
│                                         │
│  📸 Subir Comprobante                   │
│  [Seleccionar archivo...]               │
│                                         │
│  Formatos: JPG, PNG, PDF (max 5MB)      │
│                                         │
│  [Enviar Comprobante]                   │
└─────────────────────────────────────────┘

Step 3: Patient uploads proof
- Take photo of transfer receipt from bank app
- Or screenshot of transaction
- Or download PDF receipt

Step 4: Confirmation message
┌─────────────────────────────────────────┐
│  ✅ Comprobante Recibido                 │
│                                         │
│  Tu comprobante ha sido enviado.        │
│  La psicóloga verificará el pago en     │
│  las próximas 24 horas.                 │
│                                         │
│  Recibirás una confirmación por         │
│  WhatsApp cuando se verifique el pago.  │
│                                         │
│  Referencia: REF-ABC123                 │
│                                         │
│  [Volver al Inicio]                     │
└─────────────────────────────────────────┘
```

**Bank Transfer Flow (Therapist Side):**
```
Dashboard > Pagos > Transferencias Pendientes

┌─────────────────────────────────────────┐
│  Transferencias Por Verificar (3)       │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Juan Pérez                      │   │
│  │ Sesión: 27/01/2026 09:00        │   │
│  │ Monto: $15,000                  │   │
│  │ Ref: REF-ABC123                 │   │
│  │ Subido: 21/01/2026 14:30        │   │
│  │                                 │   │
│  │ 📎 Comprobante.jpg              │   │
│  │ [Ver Imagen]                    │   │
│  │                                 │   │
│  │ [✅ Confirmar] [❌ Rechazar]     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ María García                    │   │
│  │ Sesión: 28/01/2026 14:00        │   │
│  │ Monto: $10,000 (descuento)      │   │
│  │ Ref: REF-XYZ789                 │   │
│  │ Subido: 21/01/2026 10:15        │   │
│  │                                 │   │
│  │ 📎 Transferencia.pdf            │   │
│  │ [Ver PDF]                       │   │
│  │                                 │   │
│  │ [✅ Confirmar] [❌ Rechazar]     │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘

Click [Ver Imagen]:
┌─────────────────────────────────────────┐
│  Comprobante de Transferencia           │
│                                         │
│  [Transfer receipt image displayed]     │
│                                         │
│  Detalles esperados:                    │
│  • Monto: $15,000.00                    │
│  • CBU destino: 0070...5678             │
│  • Referencia: REF-ABC123               │
│                                         │
│  ✅ Todo correcto                        │
│  ○ Monto incorrecto                     │
│  ○ CBU incorrecto                       │
│  ○ Imagen ilegible                      │
│  ○ Otro problema                        │
│                                         │
│  Notas (opcional):                      │
│  [_________________________________]    │
│                                         │
│  [Confirmar Pago]  [Rechazar]           │
└─────────────────────────────────────────┘
```

**Confirmation Action:**
```
When therapist clicks "Confirmar Pago":

1. Update bank_transfer_confirmations
   - status = 'verified'
   - verified_by = therapist_id
   - verified_at = NOW()

2. If linked to booking_request:
   a. Create patient record (if new)
   b. Create session record
   c. Update booking_request:
      - status = 'confirmed'
      - confirmed_at = NOW()
   d. Create Google Calendar event
   e. Generate Google Meet link

3. If linked to existing session:
   a. Update sessions table:
      - payment_status = 'paid'
      - payment_id = bank_transfer_confirmations.id

4. Send WhatsApp confirmation to patient:
   "✅ Pago Confirmado
   
   Hola [Patient Name],
   
   Tu transferencia de $15,000 ha sido verificada.
   Tu sesión del [Date] a las [Time] está confirmada.
   
   Recibirás el link de videollamada 15 minutos antes.
   
   ¡Gracias!"

5. Send email confirmation with receipt

6. Log in notifications table

7. Update dashboard stats
```

**Rejection Action:**
```
When therapist clicks "Rechazar":

1. Show rejection reason dialog:
┌─────────────────────────────────────────┐
│  Rechazar Comprobante                   │
│                                         │
│  Motivo: *                              │
│  ○ Monto incorrecto                     │
│  ○ CBU destino incorrecto               │
│  ○ Imagen ilegible                      │
│  ○ Comprobante falso/manipulado         │
│  ○ Otro                                 │
│                                         │
│  Mensaje al paciente:                   │
│  [Por favor envía un comprobante con   │
│   el monto correcto de $15,000]         │
│                                         │
│  [Enviar Rechazo]  [Cancelar]           │
└─────────────────────────────────────────┘

2. Update bank_transfer_confirmations
   - status = 'rejected'
   - verified_by = therapist_id
   - verified_at = NOW()
   - verification_notes = reason + message

3. Send WhatsApp to patient:
   "❌ Comprobante Rechazado
   
   Hola [Patient Name],
   
   No pudimos verificar tu comprobante de pago.
   Motivo: [Selected reason]
   
   [Custom message from therapist]
   
   Por favor, sube un nuevo comprobante o contacta
   a la psicóloga para resolver el problema.
   
   [Link to re-upload]"

4. Booking remains in 'pending_payment' status

5. Patient can re-upload proof or choose different payment method
```

**Automatic Reminder for Unverified Transfers:**
```
Cron Job: Remind therapist of pending verifications
Frequency: Every 6 hours

Logic:
1. Find bank_transfer_confirmations
   WHERE status = 'pending'
   AND proof_uploaded_at < NOW() - INTERVAL '12 hours'

2. For each pending confirmation:
   - Send notification to therapist dashboard
   - Send email/WhatsApp reminder:
     "⏰ Tienes [N] transferencias pendientes de verificar
     
     • Juan Pérez - $15,000 (hace 14 horas)
     • María García - $10,000 (hace 18 horas)
     
     Verifica los pagos aquí: [Dashboard link]"

3. If pending > 24 hours:
   - Send additional reminder to patient:
     "⏳ Tu comprobante está en verificación
     
     La psicóloga verificará tu pago pronto.
     Si tienes dudas, puedes contactarla directamente."
```

**Image Storage:**
```
Proof of Payment Image Handling:

1. Patient uploads image
   ↓
2. Validate file:
   - Format: JPG, PNG, PDF only
   - Size: Max 5MB
   - Scan for malware (optional)
   ↓
3. Upload to secure storage:
   - AWS S3 or similar
   - Bucket: psicopay-transfer-proofs
   - Path: therapist_id/year/month/booking_id.ext
   - Set private access (not public)
   ↓
4. Generate signed URL (expires in 30 days)
   - Allows therapist to view without making file public
   ↓
5. Store URL in bank_transfer_confirmations.proof_image_url
   ↓
6. After verification (approved or rejected):
   - Keep file for audit purposes
   - Retention: 2 years (tax/legal requirements)
   ↓
7. After 2 years:
   - Archive or delete based on policy
```

---

### 5.3 Patient Trust Level System

**Purpose:** Reward loyal patients with payment flexibility

**Therapist Feedback:**
- "Pacientes de confianza obligados a pagar adelantado"
- Long-term patients shouldn't always need to prepay

**Trust Level Definitions:**
```
Level 1: NEW
- 0-3 completed sessions
- Must prepay for ALL sessions
- No payment flexibility

Level 2: REGULAR
- 4-9 completed sessions
- Must prepay for ALL sessions
- Can request payment plan (manual approval)

Level 3: TRUSTED
- 10-19 completed sessions
- Can defer payment 1 time
- Must pay before next session
- Automatic approval

Level 4: VIP
- 20+ completed sessions
- Can defer payment 2 times simultaneously
- Extended payment deadline (7 days post-session)
- Automatic approval
Database Schema:
sql-- Trust levels table
CREATE TABLE trust_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  -- Current level
  level VARCHAR(20) NOT NULL DEFAULT 'new', -- 'new', 'regular', 'trusted', 'vip'
  
  -- Metrics for level calculation
  total_sessions_completed INTEGER DEFAULT 0,
  total_sessions_cancelled INTEGER DEFAULT 0,
  on_time_payment_rate DECIMAL(5,2) DEFAULT 100.00, -- Percentage
  
  -- Deferred payment tracking
  deferred_payments_available INTEGER DEFAULT 0,
  deferred_payments_used INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- History
  last_level_change_date DATE,
  previous_level VARCHAR(20),
  
  -- Metadata
  calculated_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(patient_id, therapist_id)
);

-- Deferred payment records
CREATE TABLE deferred_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES therapists(id) ON DELETE CASCADE,
  
  -- Deferred amount and deadline
  amount DECIMAL(10,2) NOT NULL,
  original_due_date TIMESTAMP NOT NULL, -- When payment was originally due
  deferred_due_date TIMESTAMP NOT NULL, -- Extended deadline
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paid', 'overdue', 'cancelled'
  
  -- Payment tracking
  paid_at TIMESTAMP,
  payment_method VARCHAR(50),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT valid_deferral CHECK (deferred_due_date > original_due_date)
);

-- Indexes
CREATE INDEX idx_deferred_payments_due ON deferred_payments(deferred_due_date, status)
  WHERE status = 'active';
CREATE INDEX idx_trust_levels_patient ON trust_levels(patient_id, therapist_id);
```

**Trust Level Calculation Logic:**
```
Function: calculateTrustLevel(patientId, therapistId)

Input: patientId, therapistId
Output: trustLevel

Steps:

1. Get patient session statistics:
   - total_completed = COUNT(*) FROM sessions 
     WHERE patient_id AND status = 'completed'
   - total_cancelled = COUNT(*) WHERE status = 'cancelled'
   - total_paid_late = COUNT(*) WHERE payment was late

2. Calculate metrics:
   - completion_rate = completed / (completed + cancelled)
   - on_time_payment_rate = (total_completed - total_paid_late) / total_completed * 100

3. Determine level based on completed sessions:
   IF total_completed >= 20:
     level = 'vip'
     deferred_available = 2
   ELSE IF total_completed >= 10:
     level = 'trusted'
     deferred_available = 1
   ELSE IF total_completed >= 4:
     level = 'regular'
     deferred_available = 0
   ELSE:
     level = 'new'
     deferred_available = 0

4. Apply penalties if needed:
   - If on_time_payment_rate < 80%: downgrade one level
   - If cancellation_rate > 20%: downgrade one level

5. Update or create trust_levels record

6. Return level
```

**Trust Level UI - Patient Profile:**
```
Dashboard > Patients > [Patient Name] > Trust Level

┌─────────────────────────────────────────┐
│  Nivel de Confianza                     │
│                                         │
│  🌟🌟🌟 CONFIABLE                        │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 12 sesiones completadas           │ │
│  │ 91.6% puntualidad en pagos        │ │
│  │ 1 cancelación                     │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Beneficios Actuales:                   │
│  ✅ Puede diferir pago 1 vez            │
│  ✅ Pago hasta 24h post-sesión          │
│                                         │
│  Próximo Nivel (VIP) en:                │
│  8 sesiones más                         │
│                                         │
│  Beneficios VIP:                        │
│  • Diferir hasta 2 pagos                │
│  • Pago hasta 7 días post-sesión        │
│                                         │
│  [Ver Historial]                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Pagos Diferidos                        │
│                                         │
│  Disponibles: 1 de 1                    │
│  Usados actualmente: 0                  │
│                                         │
│  📊 Historial:                          │
│  • Dic 2025: 1 pago diferido, pagado    │
│  • Nov 2025: 0 pagos diferidos          │
│                                         │
│  ℹ️ Este paciente puede diferir el      │
│     pago de una sesión hasta 24 horas   │
│     después de completada.              │
└─────────────────────────────────────────┘
```

**Patient Portal - Trust Level Display:**
```
When patient books session (if TRUSTED or VIP):

┌─────────────────────────────────────────┐
│  Método de Pago                         │
│                                         │
│  🌟 Eres paciente CONFIABLE             │
│                                         │
│  ○ Pagar Ahora                          │
│     Transferencia o Mercado Pago        │
│                                         │
│  ○ Diferir Pago (1 disponible)          │
│     Pagar hasta 24h después de la       │
│     sesión                              │
│                                         │
│  [Continuar]                            │
└─────────────────────────────────────────┘

If patient selects "Diferir Pago":

┌─────────────────────────────────────────┐
│  Pago Diferido                          │
│                                         │
│  ✅ Sesión reservada                     │
│                                         │
│  Podrás pagar hasta:                    │
│  🕐 21/01/2026 23:59                    │
│  (24 horas después de la sesión)        │
│                                         │
│  Recibirás el link de videollamada      │
│  15 minutos antes de la sesión.         │
│                                         │
│  Te enviaremos un recordatorio de       │
│  pago después de la sesión.             │
│                                         │
│  [Confirmar Reserva]                    │
└─────────────────────────────────────────┘
```

**Deferred Payment Workflow:**
```
Session Lifecycle with Deferred Payment:

1. Patient books session (TRUSTED level)
   - Selects "Diferir Pago"
   ↓
2. Create session record:
   - payment_status = 'deferred'
   - deferred_payment_due = session_time + 24h (or 7 days for VIP)
   ↓
3. Create deferred_payments record:
   - amount = session price
   - original_due_date = session_time - 24h (when payment would be due normally)
   - deferred_due_date = session_time + 24h
   - status = 'active'
   ↓
4. Update trust_levels:
   - deferred_payments_used += 1
   ↓
5. Add to Google Calendar (session is confirmed)
   ↓
6. 15 min before session:
   - Send Meet link (even without payment)
   ↓
7. Session occurs
   ↓
8. After session (within 1 hour):
   - Send payment reminder via WhatsApp:
     "Hola [Name] 👋
     
     Gracias por tu sesión de hoy.
     
     Recuerda que tienes hasta el [Date] a las [Time]
     para completar el pago de $15,000.
     
     Pagar aquí: [Payment link]
     
     ¡Gracias por tu confianza! 😊"
   ↓
9. Patient pays within deadline:
   - Update session: payment_status = 'paid'
   - Update deferred_payments: status = 'paid', paid_at = NOW()
   - Update trust_levels: deferred_payments_used -= 1
   - Send confirmation
   ↓
10. OR Patient doesn't pay by deadline:
    - Update deferred_payments: status = 'overdue'
    - Send overdue notice
    - Trigger penalties (see below)
```

**Overdue Payment Handling:**
```
If deferred payment becomes overdue:

1. Immediate Actions:
   - Update session: payment_status = 'overdue'
   - Log in audit_log
   - Send urgent reminder:
     "⚠️ Pago Vencido
     
     Hola [Name],
     
     El pago de tu sesión del [Date] está vencido.
     Monto: $15,000
     
     Por favor, realiza el pago lo antes posible:
     [Payment link]
     
     Si tienes algún problema, contáctame."

2. Daily Reminders:
   - Send reminder every 24h while overdue
   - Escalate tone after 3 days

3. After 7 Days Overdue:
   - Downgrade trust level:
     * VIP → TRUSTED
     * TRUSTED → REGULAR
     * REGULAR → NEW
   - Suspend deferred payment privilege
   - Send notification:
     "Tu nivel de confianza ha sido actualizado debido
     al pago pendiente. Una vez que completes el pago,
     tu nivel será revisado."

4. After 30 Days Overdue:
   - Flag account for manual review
   - Therapist decides:
     * Accept payment plan
     * Mark as bad debt
     * Other resolution

5. When Overdue Payment is Completed:
   - Update all records
   - Restore trust level after 1 successful payment
   - Send thank you message
```

**Trust Level Automation:**
```
Cron Job: Update Trust Levels
Frequency: Daily at 01:00

Algorithm:

1. Fetch all patients with sessions
   
2. For each patient:
   a. Calculate statistics
   b. Determine new trust level
   c. Compare with current level
   d. If changed:
      - Update trust_levels table
      - Log change in audit_log
      - If upgrade: send congratulations message
        "🎉 ¡Felicitaciones!
        
        Has alcanzado el nivel CONFIABLE.
        
        Beneficios:
        • Diferir pago de 1 sesión
        • Pagar hasta 24h post-sesión
        
        ¡Gracias por tu confianza!"
      
      - If downgrade: send explanation
        "Tu nivel de confianza ha cambiado.
        
        Nivel anterior: CONFIABLE
        Nivel actual: REGULAR
        
        Para recuperar beneficios, mantén una
        buena puntualidad en pagos y asistencia.
        
        Cualquier duda, contáctame."

3. Check for overdue deferred payments:
   - Find deferred_payments WHERE status = 'active' AND deferred_due_date < NOW()
   - Trigger overdue workflow (see above)

4. Log summary:
   - Patients processed
   - Trust levels upgraded
   - Trust levels downgraded
   - Overdue payments detected
```

**Manual Trust Level Override:**
```
Dashboard > Patients > [Patient] > Trust Level

[Editar Nivel] button opens:

┌─────────────────────────────────────────┐
│  Editar Nivel de Confianza              │
│                                         │
│  Nivel Calculado: REGULAR               │
│  (basado en 5 sesiones completadas)     │
│                                         │
│  ☐ Usar nivel calculado (recomendado)   │
│  ☑ Establecer nivel manual              │
│                                         │
│  Nivel Manual: [CONFIABLE  ▼]           │
│                                         │
│  Razón (requerida):                     │
│  [Paciente de largo plazo de otra      │
│   psicóloga. Transferido con buena     │
│   reputación.]                          │
│                                         │
│  ⚠️ El nivel manual se mantendrá hasta  │
│     que lo cambies o el sistema lo      │
│     degrade por incumplimiento.         │
│                                         │
│  [Guardar]  [Cancelar]                  │
└─────────────────────────────────────────┘

Use Cases for Manual Override:
- Patient transferred from another therapist with good payment history
- Special circumstances (financial hardship, but trustworthy)
- Long-time patient from pre-PsicoPay days
- Professional courtesy (colleague, family member)
```

---

### 5.4 Payment Analytics Dashboard

**Purpose:** Provide insights into payment patterns and optimize revenue

**Analytics Sections:**
```
Dashboard > Analytics > Pagos

┌─────────────────────────────────────────┐
│  Resumen de Pagos - Enero 2026          │
│                                         │
│  💰 Ingresos Totales                    │
│     $285,000                            │
│     ↗️ +15% vs Diciembre                 │
│                                         │
│  💳 Por Método de Pago                  │
│     ┌─────────────────────────────┐    │
│     │ Transferencia: $180,000     │    │
│     │ (63% - $0 en comisiones)    │    │
│     │                             │    │
│     │ Mercado Pago: $105,000      │    │
│     │ (37% - ~$5,250 en comisiones)│   │
│     └─────────────────────────────┘    │
│                                         │
│  💡 Ahorro en Comisiones: $9,000        │
│     (transferencias vs todo MP)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Eficiencia de Cobro                    │
│                                         │
│  ⏱️ Tiempo Promedio de Pago              │
│     Transferencia: 8.5 horas            │
│     Mercado Pago: Instantáneo           │
│                                         │
│  ✅ Tasa de Pago Puntual                │
│     95.2% (20 de 21 sesiones)           │
│     🎯 Meta: 90%                         │
│                                         │
│  ⚠️ Pagos Vencidos                      │
│     1 pago diferido vencido             │
│     $15,000 pendiente                   │
│     [Ver Detalle]                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Tendencias de Pago                     │
│                                         │
│  📊 Ingresos por Semana                 │
│  [Line chart: Week 1-4 of January]     │
│                                         │
│  Semana 1: $60,000                      │
│  Semana 2: $75,000                      │
│  Semana 3: $72,000                      │
│  Semana 4: $78,000                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Adopción de Métodos de Pago           │
│                                         │
│  📈 Últimos 3 Meses                     │
│  [Stacked bar chart]                    │
│                                         │
│  Noviembre:  MP 80% | Transfer 20%      │
│  Diciembre:  MP 65% | Transfer 35%      │
│  Enero:      MP 37% | Transfer 63%      │
│                                         │
│  💡 Tendencia: Los pacientes están      │
│     adoptando transferencias (sin costo)│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Análisis por Nivel de Confianza       │
│                                         │
│  Nivel      Pacientes  Ingresos  Mora  │
│  ────────────────────────────────────  │
│  VIP        3          $90,000   0%    │
│  CONFIABLE  5          $105,000  2%    │
│  REGULAR    8          $72,000   0%    │
│  NUEVO      5          $18,000   20%   │
│                                         │
│  💡 Insight: Pacientes confiables       │
│     generan 68% de ingresos con menor   │
│     riesgo de mora.                     │
└─────────────────────────────────────────┘
```

**Exportable Reports:**
```
Export Options:

1. Payment Summary Report (PDF)
   - Date range selector
   - Summary cards
   - Charts and graphs
   - Detailed transaction list
   - Payment method breakdown

2. Payment Details (CSV/Excel)
   Columns:
   - Date
   - Patient Name
   - Session Date/Time
   - Amount
   - Payment Method
   - Status
   - Confirmation Time
   - Late Days (if applicable)
   - Fees (if Mercado Pago)
   - Net Amount

3. Commission Analysis (CSV)
   Columns:
   - Month
   - Total Revenue
   - Mercado Pago Volume
   - MP Fees Paid
   - Transfer Volume
   - Total Fees Saved

4. Trust Level Performance (CSV)
   Columns:
   - Trust Level
   - Number of Patients
   - Total Revenue
   - Average Session Value
   - Payment Delay Rate
   - Cancellation Rate
```

---

## 6. Implementation Roadmap

### 6.1 Phase 3A Timeline (Weeks 1-5)
```
Week 1: Google OAuth & Authentication
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Configure Google OAuth app       │
│ □ Implement OAuth flow (backend)   │
│ □ Create OAuth callback handler    │
│ □ Token storage & encryption       │
│ □ Token refresh logic              │
│ □ Calendar sync on login           │
│ □ Update login UI                  │
│ □ Testing & QA                     │
└────────────────────────────────────┘

Week 2-3: Multi-Tenant Architecture
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Database schema updates          │
│ □ Implement Row Level Security     │
│ □ Add therapist_id to all tables   │
│ □ Tenant context middleware        │
│ □ Update all queries for tenancy   │
│ □ Cron job multi-tenant support    │
│ □ Admin user system                │
│ □ Data migration for existing data │
│ □ Testing multi-tenant isolation   │
└────────────────────────────────────┘

Week 4: Professional Profile
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Profile schema (degrees, certs)  │
│ □ Profile edit UI (dashboard)      │
│ □ Public profile page              │
│ □ Image upload (profile photo)     │
│ □ Slug generation & validation     │
│ □ SEO optimization                 │
│ □ Testing & QA                     │
└────────────────────────────────────┘

Week 5: Dynamic Pricing
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Pricing tables (session types)   │
│ □ Patient-specific pricing         │
│ □ Price calculation function       │
│ □ Pricing UI (therapist settings)  │
│ □ Price history/audit trail        │
│ □ Update payment link generation   │
│ □ Testing edge cases               │
└────────────────────────────────────┘
```

### 6.2 Phase 3B Timeline (Weeks 6-11)
```
Week 6-7: Availability Management
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Availability schema (rules, exc) │
│ □ Weekly schedule UI               │
│ □ Exception management UI          │
│ □ Calendar view with availability  │
│ □ Slot calculation algorithm       │
│ □ Google Calendar conflict detect  │
│ □ Buffer time configuration        │
│ □ Testing availability logic       │
└────────────────────────────────────┘

Week 8-10: Patient Self-Scheduling
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Booking request schema           │
│ □ Public booking page UI           │
│ □ Date/time selection flow         │
│ □ Patient info form                │
│ □ Payment method selection         │
│ □ Conflict prevention (locking)    │
│ □ Booking confirmation flow        │
│ □ Google Calendar event creation   │
│ □ Email & WhatsApp confirmations   │
│ □ Testing complete booking flow    │
└────────────────────────────────────┘

Week 11: Enhanced Profiles & Recurring
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Enhanced patient schema          │
│ □ Patient profile UI updates       │
│ □ Session preferences              │
│ □ Recurring session schema         │
│ □ Recurring config UI              │
│ □ Automatic generation cron job    │
│ □ Conflict handling                │
│ □ Pause/resume/modify flows        │
│ □ Testing recurring automation     │
└────────────────────────────────────┘
```

### 6.3 Phase 3C Timeline (Weeks 12-15)
```
Week 12-13: Bank Transfer Integration
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Payment method config schema     │
│ □ Bank transfer confirmation schema│
│ □ Transfer instructions display    │
│ □ Proof upload (image storage)     │
│ □ Therapist verification UI        │
│ □ Approval/rejection flow          │
│ □ Payment link generation (both)   │
│ □ Testing both payment methods     │
└────────────────────────────────────┘

Week 14: Trust Level System
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Trust level schema               │
│ □ Deferred payment schema          │
│ □ Trust calculation algorithm      │
│ □ Trust level display (dashboard)  │
│ □ Deferred payment workflow        │
│ □ Overdue handling                 │
│ □ Trust level automation cron      │
│ □ Manual override functionality    │
│ □ Testing trust scenarios          │
└────────────────────────────────────┘

Week 15: Payment Analytics
┌────────────────────────────────────┐
│ Tasks:                             │
│ □ Analytics queries                │
│ □ Dashboard visualizations         │
│ □ Export functionality (CSV, PDF)  │
│ □ Commission savings calculator    │
│ □ Trust level performance metrics  │
│ □ Trend analysis                   │
│ □ Testing & optimization           │
│ □ Final Phase 3 QA                 │
└────────────────────────────────────┘
```

---

## 7. Testing Strategy for Phase 3

### 7.1 Multi-Tenant Testing
```
Critical Tests:

1. Data Isolation
   □ Therapist A cannot see Therapist B's patients
   □ Therapist A cannot see Therapist B's sessions
   □ API endpoints filter correctly by therapist
   □ Cron job processes each therapist separately

2. OAuth Flow
   □ New therapist can sign up with Google
   □ Existing therapist can login
   □ Calendar syncs correctly on login
   □ Tokens refresh automatically
   □ Logout clears tokens

3. Profile Management
   □ Therapist can update professional profile
   □ Public profile displays correctly
   □ Slug generation works
   □ Slug conflicts handled

4. Pricing
   □ Default price used correctly
   □ Session type price overrides default
   □ Patient-specific price takes precedence
   □ Price history tracked
```

### 7.2 Self-Scheduling Testing
```
Critical Tests:

1. Availability Calculation
   □ Weekly rules applied correctly
   □ Exceptions override weekly rules
   □ Existing sessions marked as booked
   □ Buffer time respected
   □ Timezone handling correct

2. Booking Flow
   □ Patient can select available slot
   □ Slot locks during booking process
   □ Payment required before confirmation
   □ Double-booking prevented
   □ Conflicts detected

3. Payment Methods
   □ Mercado Pago flow works end-to-end
   □ Bank transfer instructions display
   □ Proof upload succeeds
   □ Therapist can verify/reject
   □ Notifications sent correctly

4. Session Confirmation
   □ Session created in database
   □ Google Calendar event created
   □ Meet link generated
   □ Confirmations sent (WhatsApp, email)
   □ Reminders scheduled
```

### 7.3 Recurring Sessions Testing
```
Critical Tests:

1. Configuration
   □ Weekly recurring config saves correctly
   □ Biweekly calculation accurate
   □ Monthly logic works
   □ Custom frequency respected

2. Generation
   □ Sessions auto-created on schedule
   □ Future sessions generated correctly
   □ Payment reminders scheduled
   □ Calendar events created

3. Conflict Handling
   □ Conflicts detected before creation
   □ Therapist notified of conflicts
   □ Manual resolution prompted
   □ Generation skips conflicting slots

4. Modification
   □ Pause stops generation
   □ Resume restarts correctly
   □ Time changes applied
   □ Future sessions updated (optional)
```

### 7.4 Trust Level Testing
```
Critical Tests:

1. Level Calculation
   □ NEW assigned to new patients
   □ REGULAR after 4 sessions
   □ TRUSTED after 10 sessions
   □ VIP after 20 sessions
   □ Penalties applied correctly

2. Deferred Payments
   □ TRUSTED can defer 1 payment
   □ VIP can defer 2 payments
   □ Deadline calculated correctly
   □ Reminders sent post-session
   □ Overdue detected and flagged

3. Level Changes
   □ Upgrades happen automatically
   □ Downgrades on late payment
   □ Manual override works
   □ Notifications sent on changes

4. Payment Restrictions
   □ NEW must prepay always
   □ TRUSTED deferred option shown
   □ Deferred limit enforced
   □ Overdue blocks future deferrals
```

---

## 8. Migration from Phase 2 to Phase 3

### 8.1 Database Migration
```
Migration Steps:

1. Backup Current Database
   □ Full PostgreSQL dump
   □ Test restore to staging
   □ Verify data integrity

2. Run Phase 3A Migrations
   □ Add therapist_id columns
   □ Create OAuth tables
   □ Create profile tables
   □ Enable Row Level Security
   □ Migrate existing data to first therapist

3. Run Phase 3B Migrations
   □ Create availability tables
   □ Create booking request tables
   □ Create recurring session tables
   □ Create enhanced patient fields

4. Run Phase 3C Migrations
   □ Create payment method tables
   □ Create bank transfer tables
   □ Create trust level tables
   □ Create deferred payment tables

5. Data Migration Script
   □ Assign all existing data to primary therapist
   □ Calculate initial trust levels for patients
   □ Set default pricing for therapist
   □ Verify all foreign keys

6. Validation
   □ Count records before/after
   □ Verify no data loss
   □ Check referential integrity
   □ Test queries with RLS enabled
```

### 8.2 Application Migration
```
Deployment Strategy:

1. Deploy to Staging
   □ Run all migrations
   □ Deploy Phase 3 code
   □ Test all features end-to-end
   □ Performance testing

2. User Acceptance Testing
   □ Therapist tests OAuth login
   □ Therapist tests profile setup
   □ Test patient creates booking
   □ Test bank transfer flow
   □ Verify trust levels

3. Production Deployment
   □ Maintenance window (low traffic)
   □ Run migrations
   □ Deploy new code
   □ Verify health checks
   □ Monitor errors closely

4. Rollback Plan
   □ Keep previous version deployed
   □ Database rollback scripts ready
   □ Feature flags to disable new features
   □ Quick switch if critical issues
```

### 8.3 User Communication
```
For Existing Therapist:

Email 1 Week Before:
"Hola Dra. María,

Estamos actualizando PsicoPay con nuevas funcionalidades:

- Ingreso con Google (más fácil y seguro)
- Perfil profesional público
- Reservas automáticas de pacientes
- Transferencias bancarias (sin comisiones)

La actualización será el [Fecha] a las [Hora].
El sistema estará en mantenimiento por ~2 horas.

Te enviaremos una guía paso a paso.

¡Gracias!
El equipo de PsicoPay"

Email Day Of:
"El mantenimiento comenzó. Te avisaremos cuando esté listo."

Email After Deployment:
"✅ ¡Actualización completada!

Nuevas funcionalidades disponibles:
1. Ingresa con tu cuenta de Google
2. Completa tu perfil profesional
3. Comparte tu link público con pacientes
4. Configura tu horario semanal
5. Activa transferencias bancarias

Guía completa: [Link]
¿Necesitas ayuda? Responde este email.

¡Disfruta las mejoras!"
```

---

## 9. Future Enhancements (Phase 4+)

### 9.1 Phase 4: Advanced Features
```
Patient Portal Evolution:
□ Patient login system
□ View session history
□ Reschedule sessions (self-service)
□ Download invoices/receipts
□ Manage payment methods
□ View progress over time

Therapist Features:
□ Team collaboration (supervisors, trainees)
□ Session notes templates (still non-clinical)
□ Bulk operations (reschedule multiple)
□ Advanced reporting
□ Integration with accounting software

Payment Enhancements:
□ Payment plans (installments)
□ Subscription model (monthly packages)
□ Loyalty rewards
□ Referral discounts
□ Sliding scale pricing automation
```

### 9.2 Phase 5: Platform Expansion
```
Multi-Language Support:
□ Spanish (current)
□ English
□ Portuguese
□ Interface translation
□ Automatic detection

Additional Payment Methods:
□ Credit card direct (Stripe)
□ PayPal
□ Cryptocurrency (Bitcoin, USDC)
□ Buy now, pay later (Affirm, Klarna)

Geographic Expansion:
□ Multi-currency support
□ International payment gateways
□ Local payment methods per country
□ Tax compliance per jurisdiction
```

### 9.3 Phase 6: AI & Automation
```
AI-Powered Features:
□ Intelligent scheduling suggestions
□ Patient risk prediction (no-shows)
□ Optimal pricing recommendations
□ Automated session summaries (admin only)
□ Chatbot for common patient questions

Advanced Analytics:
□ Predictive revenue modeling
□ Patient lifetime value calculation
□ Churn risk identification
□ Marketing campaign effectiveness
□ A/B testing for messaging
```

---

## 10. Success Metrics for Phase 3

### 10.1 Adoption Metrics
```
Multi-Tenant Success:
□ 5+ therapists onboarded within 3 months
□ 90%+ use Google OAuth login
□ 80%+ complete professional profile
□ 70%+ make profile public

Self-Scheduling Success:
□ 70%+ sessions booked by patients (not therapist)
□ < 5 minute average booking time
□ < 2% double-booking incidents
□ 85%+ patient satisfaction with process

Payment Method Success:
□ 50%+ payments via bank transfer by month 3
□ 40%+ reduction in payment processing fees
□ 95%+ bank transfer verification within 12h
□ < 3% disputed/rejected transfers
```

### 10.2 Performance Metrics
```
Technical Performance:
□ < 2 second page load time (booking portal)
□ < 200ms API response time (p95)
□ 99.5%+ uptime
□ 0 data breaches or leaks

Financial Performance:
□ 15%+ reduction in payment fees (vs all Mercado Pago)
□ 10%+ increase in revenue per therapist
□ 5%+ improvement in collection rate

User Experience:
□ < 5% cancellation rate for booked sessions
□ 90%+ therapist satisfaction (survey)
□ 85%+ patient satisfaction (survey)
□ < 2% support ticket rate
```

### 10.3 Business Metrics
```
Platform Growth:
□ 10+ active therapists by month 6
□ 200+ patients using self-scheduling
□ 1000+ sessions processed through platform
□ $500,000+ in payments processed

Retention:
□ 95%+ therapist retention (after onboarding)
□ 90%+ patient retention month-over-month
□ < 10% churn rate

Operational Efficiency:
□ 90%+ sessions require zero manual intervention
□ 95%+ payments confirmed automatically
□ < 5 support hours per therapist per month
```

---

## 11. Documentation Requirements

### 11.1 User Documentation
```
For Therapists:
□ Getting Started Guide (Google OAuth, profile setup)
□ How to Configure Availability
□ How to Manage Recurring Sessions
□ How to Verify Bank Transfers
□ How to Manage Patient Trust Levels
□ FAQ Section
□ Video Tutorials (key workflows)

For Patients:
□ How to Book a Session
□ Payment Methods Explained
□ How to Upload Transfer Proof
□ How to Reschedule/Cancel
□ FAQ Section
□ Troubleshooting Guide
```

### 11.2 Technical Documentation
```
Developer Documentation:
□ Architecture Overview (multi-tenant)
□ API Reference (all new endpoints)
□ Database Schema Diagram
□ Authentication Flow (OAuth)
□ Payment Flow Diagrams
□ Trust Level Calculation Algorithm
□ Cron Job Specifications
□ Testing Guide
□ Deployment Guide
□ Troubleshooting Guide

Operations Documentation:
□ Monitoring Setup
□ Alert Configuration
□ Backup & Restore Procedures
□ Disaster Recovery Plan
□ Security Incident Response
□ Data Privacy Compliance
```

---

## 12. Risk Management

### 12.1 Technical Risks
```
Risk: Data Isolation Failure
Probability: Low
Impact: Critical
Mitigation:
- Extensive testing of RLS policies
- Code review for all tenant-aware queries
- Automated tests for data leakage
- Regular security audits

Risk: Google OAuth Service Disruption
Probability: Low
Impact: High
Mitigation:
- Fallback to email/password login
- Multiple OAuth providers (future)
- Clear user communication during outages

Risk: Bank Transfer Fraud
Probability: Medium
Impact: Medium
Mitigation:
- Manual verification by therapist
- Image proof requirement
- Reference code matching
- Alert for suspicious patterns
- Therapist training on fraud detection
```

### 12.2 Business Risks
```
Risk: Low Patient Adoption of Self-Scheduling
Probability: Medium
Impact: Medium
Mitigation:
- User-friendly interface design
- Clear instructions and tutorials
- Incentive for first self-booked session
- Therapist promotion of feature
- Patient education via WhatsApp

Risk: Therapists Prefer Manual Payment Verification
Probability: Medium
Impact: Low
Mitigation:
- Make verification UI very simple
- Mobile-friendly verification
- Push notifications for pending verifications
- Show time savings data
- Option to auto-approve trusted patients (future)

Risk: Payment Method Preference Doesn't Shift to Transfers
Probability: Medium
Impact: Medium
Mitigation:
- Display savings clearly to therapists
- Default to transfer in booking UI
- Patient education on transfer benefits
- Therapist communication templates
- Monitor adoption and iterate
```

---

## 13. Maintenance & Support Plan

### 13.1 Ongoing Maintenance
```
Daily:
□ Monitor error logs
□ Check cron job execution
□ Review failed payments
□ Check pending bank transfer verifications

Weekly:
□ Review system performance metrics
□ Check database backups
□ Review user support tickets
□ Update documentation as needed

Monthly:
□ Security updates (dependencies)
□ Performance optimization review
□ User feedback analysis
□ Feature request prioritization
□ Trust level algorithm review
```

### 13.2 Support Channels
```
For Therapists:
- Email: support@psicopay.com
- WhatsApp: +54 911 XXXX-XXXX
- In-app chat (dashboard)
- Response time: < 4 hours (business hours)

For Patients:
- Contact therapist directly
- Help center: help.psicopay.com
- FAQ page
- Email support (for technical issues)

For Developers:
- GitHub Issues
- Documentation site
- Slack/Discord community
- Stack Overflow tag
```

---

## Appendix A: Google OAuth Setup Guide
```
1. Create Google Cloud Project
   - Go to console.cloud.google.com
   - Create new project "PsicoPay"
   - Enable Google Calendar API
   - Enable Google People API

2. Configure OAuth Consent Screen
   - User Type: External
   - App name: PsicoPay
   - User support email: your@email.com
   - Scopes:
     * userinfo.email
     * userinfo.profile
     * calendar.readonly
     * calendar.events.readonly

3. Create OAuth Credentials
   - Application type: Web application
   - Name: PsicoPay Web Client
   - Authorized redirect URIs:
     * https://psicopay.com/auth/google/callback
     * http://localhost:3001/auth/google/callback (dev)
   - Save Client ID and Client Secret

4. Environment Variables
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   GOOGLE_OAUTH_REDIRECT_URI=https://psicopay.com/auth/google/callback
```

---

## Appendix B: Bank Transfer Configuration Template
```
For Therapists to Complete:

Banco: _____________________________
Tipo de Cuenta: _____________________
CBU: _______________________________
Alias: _____________________________
CUIT/CUIL: _________________________
Titular: ___________________________

Optional:
CVU (Mercado Pago): _________________
Cuenta DNI: _________________________

Instructions for Patients:
_____________________________________
_____________________________________
_____________________________________

This information will be shown to patients when they select "Transferencia Bancaria" during booking.

PHASE 3 Document Version: 1.0
Status: Ready for Development
Last Updated: January 21, 2026

Summary
Phase 3 transforms PsicoPay from a single-therapist automation tool into a multi-tenant SaaS platform. Key achievements:
Phase 3A establishes the foundation with Google OAuth login, multi-therapist architecture with data isolation, professional profiles, and dynamic pricing.
Phase 3B empowers patients with self-scheduling capabilities, reduces therapist workload with recurring session automation, and enhances patient profiles for better care.
Phase 3C optimizes revenue through dual payment methods (Mercado Pago + bank transfers), implements patient trust levels for flexible payment options, and provides comprehensive payment analytics.
Together, these features enable PsicoPay to scale from supporting one psychologist to serving dozens or hundreds, while maintaining the core automation benefits and dramatically reducing manual work for both therapists and patients.
The 12-15 week development timeline provides a realistic roadmap for systematic implementation, with each sub-phase building on previous work and delivering incremental value.