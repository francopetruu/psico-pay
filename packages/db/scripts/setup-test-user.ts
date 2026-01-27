/**
 * Setup Test User Script
 *
 * Creates a test user with credentials auth and associated therapist record.
 * Also migrates any orphaned data to this therapist.
 *
 * Usage:
 *   npx tsx scripts/setup-test-user.ts
 *
 * Default credentials:
 *   Email: tester@psicopay.com
 *   Password: tester1234
 */

import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test user configuration
const TEST_USER = {
  email: 'tester@psicopay.com',
  password: 'tester1234',
  name: 'Usuario de Prueba',
};

async function setupTestUser() {
  const client = await pool.connect();

  try {
    console.log('='.repeat(60));
    console.log('SETUP: Creating test user with therapist profile');
    console.log('='.repeat(60));

    await client.query('BEGIN');

    // 1. Hash the password
    const passwordHash = await bcrypt.hash(TEST_USER.password, 12);
    console.log('\n✓ Password hashed');

    // 2. Create or update user in users table
    console.log('\n📝 Creating/updating user...');
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, 'therapist', true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = $2,
         name = $3,
         is_active = true,
         updated_at = NOW()
       RETURNING id, email, name`,
      [TEST_USER.email, passwordHash, TEST_USER.name]
    );
    const user = userResult.rows[0];
    console.log(`   ✓ User: ${user.email} (ID: ${user.id})`);

    // 3. Create or update therapist linked to this user
    console.log('\n📝 Creating/updating therapist...');
    const therapistResult = await client.query(
      `INSERT INTO therapists (email, name, user_id, is_active, onboarding_completed)
       VALUES ($1, $2, $3, true, true)
       ON CONFLICT (email) DO UPDATE SET
         name = $2,
         user_id = $3,
         is_active = true,
         updated_at = NOW()
       RETURNING id, email, name`,
      [TEST_USER.email, TEST_USER.name, user.id]
    );
    const therapist = therapistResult.rows[0];
    console.log(`   ✓ Therapist: ${therapist.email} (ID: ${therapist.id})`);

    // 4. Migrate orphaned patients to this therapist
    console.log('\n🔄 Migrating orphaned patients...');
    const patientResult = await client.query(
      `UPDATE patients
       SET therapist_id = $1, updated_at = NOW()
       WHERE therapist_id IS NULL
       RETURNING id, name`,
      [therapist.id]
    );
    if (patientResult.rowCount && patientResult.rowCount > 0) {
      console.log(`   ✓ Migrated ${patientResult.rowCount} patients:`);
      patientResult.rows.forEach((p: any) => {
        console.log(`     - ${p.name}`);
      });
    } else {
      console.log('   (no orphaned patients found)');
    }

    // 5. Migrate orphaned sessions to this therapist
    console.log('\n🔄 Migrating orphaned sessions...');
    const sessionResult = await client.query(
      `UPDATE sessions
       SET therapist_id = $1, updated_at = NOW()
       WHERE therapist_id IS NULL
       RETURNING id, amount, payment_status`,
      [therapist.id]
    );
    if (sessionResult.rowCount && sessionResult.rowCount > 0) {
      console.log(`   ✓ Migrated ${sessionResult.rowCount} sessions:`);
      sessionResult.rows.forEach((s: any) => {
        console.log(`     - $${s.amount} (${s.payment_status})`);
      });
    } else {
      console.log('   (no orphaned sessions found)');
    }

    // 6. Cleanup: remove old admin user if different email
    console.log('\n🧹 Cleaning up old test users...');
    const cleanupResult = await client.query(
      `DELETE FROM users
       WHERE email = 'admin@psicopay.com'
       AND email != $1
       RETURNING email`,
      [TEST_USER.email]
    );
    if (cleanupResult.rowCount && cleanupResult.rowCount > 0) {
      console.log(`   ✓ Removed old user: admin@psicopay.com`);
    } else {
      console.log('   (no cleanup needed)');
    }

    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✅ SETUP COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Test User Credentials:');
    console.log(`   Email:    ${TEST_USER.email}`);
    console.log(`   Password: ${TEST_USER.password}`);
    console.log('\n📋 Associated Data:');

    // Verify final state
    const verifyPatients = await client.query(
      `SELECT name FROM patients WHERE therapist_id = $1`,
      [therapist.id]
    );
    console.log(`   Patients: ${verifyPatients.rowCount}`);
    verifyPatients.rows.forEach((p: any) => {
      console.log(`     - ${p.name}`);
    });

    const verifySessions = await client.query(
      `SELECT amount, payment_status FROM sessions WHERE therapist_id = $1`,
      [therapist.id]
    );
    console.log(`   Sessions: ${verifySessions.rowCount}`);
    verifySessions.rows.forEach((s: any) => {
      console.log(`     - $${s.amount} (${s.payment_status})`);
    });

    console.log('\n🔐 Login URL: https://psico-pay-web.vercel.app/login');
    console.log('   (Use credentials login, not Google)\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestUser();
