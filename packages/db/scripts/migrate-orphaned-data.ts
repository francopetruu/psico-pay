/**
 * Migration script to associate orphaned data with a therapist
 *
 * This fixes data that was created before the multi-tenant system
 * was implemented in Phase 3A.
 *
 * Usage:
 *   npx tsx scripts/migrate-orphaned-data.ts [therapist-email]
 *
 * If no email is provided, defaults to the first Google-authenticated therapist.
 */

import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrateOrphanedData(targetEmail?: string) {
  const client = await pool.connect();

  try {
    console.log('='.repeat(60));
    console.log('MIGRATION: Associate orphaned data with therapist');
    console.log('='.repeat(60));

    // Start transaction
    await client.query('BEGIN');

    // 1. Find the target therapist
    let therapist;
    if (targetEmail) {
      const result = await client.query(
        'SELECT id, email, name FROM therapists WHERE email = $1',
        [targetEmail]
      );
      therapist = result.rows[0];
    } else {
      // Default: first Google-authenticated therapist
      const result = await client.query(
        'SELECT id, email, name FROM therapists WHERE google_id IS NOT NULL ORDER BY created_at LIMIT 1'
      );
      therapist = result.rows[0];
    }

    if (!therapist) {
      console.log('❌ No therapist found. Please create a therapist account first.');
      await client.query('ROLLBACK');
      return;
    }

    console.log(`\n📌 Target therapist: ${therapist.name} (${therapist.email})`);
    console.log(`   ID: ${therapist.id}\n`);

    // 2. Count orphaned data
    const orphanedPatients = await client.query(
      'SELECT COUNT(*) as count FROM patients WHERE therapist_id IS NULL'
    );
    const orphanedSessions = await client.query(
      'SELECT COUNT(*) as count FROM sessions WHERE therapist_id IS NULL'
    );

    console.log('📊 Orphaned data found:');
    console.log(`   Patients: ${orphanedPatients.rows[0].count}`);
    console.log(`   Sessions: ${orphanedSessions.rows[0].count}`);

    if (orphanedPatients.rows[0].count === '0' && orphanedSessions.rows[0].count === '0') {
      console.log('\n✅ No orphaned data to migrate!');
      await client.query('ROLLBACK');
      return;
    }

    // 3. Migrate patients
    if (orphanedPatients.rows[0].count !== '0') {
      console.log('\n🔄 Migrating patients...');
      const patientResult = await client.query(
        `UPDATE patients
         SET therapist_id = $1, updated_at = NOW()
         WHERE therapist_id IS NULL
         RETURNING id, name`,
        [therapist.id]
      );
      console.log(`   ✓ Updated ${patientResult.rowCount} patients:`);
      patientResult.rows.forEach((p: any) => {
        console.log(`     - ${p.name} (${p.id})`);
      });
    }

    // 4. Migrate sessions
    if (orphanedSessions.rows[0].count !== '0') {
      console.log('\n🔄 Migrating sessions...');
      const sessionResult = await client.query(
        `UPDATE sessions
         SET therapist_id = $1, updated_at = NOW()
         WHERE therapist_id IS NULL
         RETURNING id, scheduled_at, amount, payment_status`,
        [therapist.id]
      );
      console.log(`   ✓ Updated ${sessionResult.rowCount} sessions:`);
      sessionResult.rows.forEach((s: any) => {
        console.log(`     - ${s.id} | ${s.scheduled_at} | $${s.amount} | ${s.payment_status}`);
      });
    }

    // 5. Commit transaction
    await client.query('COMMIT');

    console.log('\n' + '='.repeat(60));
    console.log('✅ Migration completed successfully!');
    console.log('='.repeat(60));

    // 6. Verify
    console.log('\n📋 Verification:');
    const verifyPatients = await client.query(
      `SELECT p.name, t.email as therapist_email
       FROM patients p
       JOIN therapists t ON p.therapist_id = t.id
       WHERE p.therapist_id = $1`,
      [therapist.id]
    );
    console.log(`   Patients now assigned to ${therapist.email}:`);
    verifyPatients.rows.forEach((p: any) => {
      console.log(`     - ${p.name}`);
    });

    const verifySessions = await client.query(
      `SELECT s.id, s.amount, s.payment_status, p.name as patient_name
       FROM sessions s
       JOIN patients p ON s.patient_id = p.id
       WHERE s.therapist_id = $1`,
      [therapist.id]
    );
    console.log(`   Sessions now assigned to ${therapist.email}:`);
    verifySessions.rows.forEach((s: any) => {
      console.log(`     - ${s.patient_name} | $${s.amount} | ${s.payment_status}`);
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get target email from command line args
const targetEmail = process.argv[2];
migrateOrphanedData(targetEmail);
