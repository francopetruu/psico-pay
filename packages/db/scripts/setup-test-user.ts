/**
 * Setup Test User Script
 *
 * Creates a credentials-based user linked to an existing Google-authenticated
 * therapist. This allows testing with both:
 * - Credentials login (works on Vercel preview without OAuth setup)
 * - Google OAuth login (when available)
 *
 * The same therapist profile is used, so Google Calendar integration works
 * regardless of login method.
 *
 * Usage:
 *   npx tsx scripts/setup-test-user.ts [therapist-email] [password]
 *
 * Examples:
 *   npx tsx scripts/setup-test-user.ts                           # Use defaults
 *   npx tsx scripts/setup-test-user.ts petruu.fi@gmail.com       # Specify email
 *   npx tsx scripts/setup-test-user.ts petruu.fi@gmail.com mypass # Specify both
 */

import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Default configuration
const DEFAULT_EMAIL = 'petruu.fi@gmail.com';
const DEFAULT_PASSWORD = 'tester1234';

async function setupTestUser() {
  const client = await pool.connect();

  // Get config from command line or use defaults
  const targetEmail = process.argv[2] || DEFAULT_EMAIL;
  const password = process.argv[3] || DEFAULT_PASSWORD;

  try {
    console.log('='.repeat(60));
    console.log('SETUP: Add credentials login to existing therapist');
    console.log('='.repeat(60));

    await client.query('BEGIN');

    // 1. Find existing therapist (preferably with Google OAuth)
    console.log(`\n🔍 Looking for therapist: ${targetEmail}`);
    const therapistResult = await client.query(
      `SELECT id, email, name, google_id, user_id
       FROM therapists
       WHERE email = $1`,
      [targetEmail]
    );

    if (therapistResult.rows.length === 0) {
      console.log(`\n❌ Therapist not found: ${targetEmail}`);
      console.log('   Please login with Google OAuth first to create the therapist.');
      await client.query('ROLLBACK');
      return;
    }

    const therapist = therapistResult.rows[0];
    console.log(`   ✓ Found therapist: ${therapist.name}`);
    console.log(`   → ID: ${therapist.id}`);
    console.log(`   → Has Google OAuth: ${therapist.google_id ? 'Yes' : 'No'}`);
    console.log(`   → Has User link: ${therapist.user_id ? 'Yes' : 'No'}`);

    // 2. Check if therapist has Google OAuth tokens (for Calendar access)
    const tokensResult = await client.query(
      `SELECT id, provider, scope FROM oauth_tokens WHERE therapist_id = $1`,
      [therapist.id]
    );
    if (tokensResult.rows.length > 0) {
      console.log(`   → OAuth tokens: Yes (${tokensResult.rows[0].provider})`);
    } else {
      console.log(`   → OAuth tokens: No (Calendar sync won't work)`);
    }

    // 3. Create or update user with credentials
    console.log('\n📝 Creating/updating credentials user...');
    const passwordHash = await bcrypt.hash(password, 12);

    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, 'therapist', true)
       ON CONFLICT (email) DO UPDATE SET
         password_hash = $2,
         name = $3,
         is_active = true,
         updated_at = NOW()
       RETURNING id, email, name`,
      [targetEmail, passwordHash, therapist.name]
    );
    const user = userResult.rows[0];
    console.log(`   ✓ User: ${user.email} (ID: ${user.id})`);

    // 4. Link user to therapist
    console.log('\n🔗 Linking user to therapist...');
    await client.query(
      `UPDATE therapists SET user_id = $1, updated_at = NOW() WHERE id = $2`,
      [user.id, therapist.id]
    );
    console.log(`   ✓ Linked user ${user.id} to therapist ${therapist.id}`);

    // 5. Migrate orphaned data to this therapist
    console.log('\n🔄 Migrating orphaned data...');

    const orphanedPatients = await client.query(
      `UPDATE patients
       SET therapist_id = $1, updated_at = NOW()
       WHERE therapist_id IS NULL
       RETURNING id, name`,
      [therapist.id]
    );
    if (orphanedPatients.rowCount && orphanedPatients.rowCount > 0) {
      console.log(`   ✓ Migrated ${orphanedPatients.rowCount} orphaned patients`);
      orphanedPatients.rows.forEach((p: any) => console.log(`     - ${p.name}`));
    }

    const orphanedSessions = await client.query(
      `UPDATE sessions
       SET therapist_id = $1, updated_at = NOW()
       WHERE therapist_id IS NULL
       RETURNING id, amount, payment_status`,
      [therapist.id]
    );
    if (orphanedSessions.rowCount && orphanedSessions.rowCount > 0) {
      console.log(`   ✓ Migrated ${orphanedSessions.rowCount} orphaned sessions`);
      orphanedSessions.rows.forEach((s: any) => console.log(`     - $${s.amount} (${s.payment_status})`));
    }

    // 6. Transfer data from other test therapists (like tester@psicopay.com)
    console.log('\n🔄 Consolidating data from other test therapists...');

    // Find and transfer patients from other therapists
    const otherTherapists = await client.query(
      `SELECT id, email FROM therapists
       WHERE email LIKE '%@psicopay.com'
       AND id != $1`,
      [therapist.id]
    );

    for (const other of otherTherapists.rows) {
      // Transfer patients
      const transferred = await client.query(
        `UPDATE patients
         SET therapist_id = $1, updated_at = NOW()
         WHERE therapist_id = $2
         RETURNING name`,
        [therapist.id, other.id]
      );
      if (transferred.rowCount && transferred.rowCount > 0) {
        console.log(`   ✓ Transferred ${transferred.rowCount} patients from ${other.email}`);
      }

      // Transfer sessions
      const transferredSessions = await client.query(
        `UPDATE sessions
         SET therapist_id = $1, updated_at = NOW()
         WHERE therapist_id = $2
         RETURNING id`,
        [therapist.id, other.id]
      );
      if (transferredSessions.rowCount && transferredSessions.rowCount > 0) {
        console.log(`   ✓ Transferred ${transferredSessions.rowCount} sessions from ${other.email}`);
      }
    }

    // 7. Cleanup old test therapists and users
    console.log('\n🧹 Cleaning up old test accounts...');

    // Delete old test therapists (after transferring data)
    const deletedTherapists = await client.query(
      `DELETE FROM therapists
       WHERE email LIKE '%@psicopay.com'
       AND id != $1
       RETURNING email`,
      [therapist.id]
    );
    if (deletedTherapists.rowCount && deletedTherapists.rowCount > 0) {
      deletedTherapists.rows.forEach((t: any) => console.log(`   ✓ Deleted therapist: ${t.email}`));
    }

    // Delete old test users
    const deletedUsers = await client.query(
      `DELETE FROM users
       WHERE email LIKE '%@psicopay.com'
       AND email != $1
       RETURNING email`,
      [targetEmail]
    );
    if (deletedUsers.rowCount && deletedUsers.rowCount > 0) {
      deletedUsers.rows.forEach((u: any) => console.log(`   ✓ Deleted user: ${u.email}`));
    }

    await client.query('COMMIT');

    // 8. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SETUP COMPLETE!');
    console.log('='.repeat(60));

    console.log('\n📋 Credentials Login:');
    console.log(`   Email:    ${targetEmail}`);
    console.log(`   Password: ${password}`);

    console.log('\n📋 Google OAuth Login:');
    if (therapist.google_id) {
      console.log(`   ✓ Available (same therapist profile)`);
    } else {
      console.log(`   ✗ Not configured yet`);
    }

    // Verify final state
    const finalPatients = await client.query(
      `SELECT name FROM patients WHERE therapist_id = $1`,
      [therapist.id]
    );
    const finalSessions = await client.query(
      `SELECT amount, payment_status FROM sessions WHERE therapist_id = $1`,
      [therapist.id]
    );

    console.log('\n📋 Associated Data:');
    console.log(`   Patients: ${finalPatients.rowCount}`);
    finalPatients.rows.forEach((p: any) => console.log(`     - ${p.name}`));
    console.log(`   Sessions: ${finalSessions.rowCount}`);
    finalSessions.rows.forEach((s: any) => console.log(`     - $${s.amount} (${s.payment_status})`));

    console.log('\n🔐 Test URLs:');
    console.log('   Production: https://psico-pay-web.vercel.app/login');
    console.log('   Preview:    Use any Vercel preview URL + /login');
    console.log('\n💡 Tip: Use credentials login on preview deployments');
    console.log('        (Google OAuth requires manual URL authorization)\n');

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
