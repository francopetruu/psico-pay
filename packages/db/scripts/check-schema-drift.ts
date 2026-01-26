/**
 * Schema Drift Check Script
 *
 * This script checks if there are pending database schema changes that haven't
 * been pushed to production. It's used in CI to prevent deploying code that
 * depends on schema changes that don't exist in the database.
 *
 * Exit codes:
 * - 0: Schema is in sync (no pending changes)
 * - 1: Schema drift detected (pending changes need to be pushed)
 * - 2: Script error (connection issues, etc.)
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageRoot = join(__dirname, '..');

async function checkSchemaDrift(): Promise<void> {
  console.log('🔍 Checking for database schema drift...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(2);
  }

  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';

    // Run drizzle-kit push with stdin closed so it can't wait for input
    const child = spawn('npx', ['drizzle-kit', 'push', '--strict'], {
      cwd: packageRoot,
      stdio: ['ignore', 'pipe', 'pipe'], // Close stdin, capture stdout/stderr
      shell: true,
      env: { ...process.env },
    });

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Set a timeout - drizzle-kit will hang waiting for input after showing pending changes
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
    }, 30000); // 30 second timeout

    child.on('close', (code) => {
      clearTimeout(timeout);

      const fullOutput = output + errorOutput;

      // Check for indicators of pending changes
      const hasPendingChanges =
        fullOutput.includes('You are about to execute current statements') ||
        fullOutput.includes('CREATE TABLE') ||
        fullOutput.includes('ALTER TABLE') ||
        fullOutput.includes('CREATE TYPE') ||
        fullOutput.includes('DROP TABLE') ||
        fullOutput.includes('CREATE INDEX');

      // Check if the only changes are constraint renames (false positive from PostgreSQL 63-char name truncation)
      // This happens when drizzle generates constraint names longer than 63 chars - PG truncates them,
      // then drizzle-kit sees a mismatch and tries to rename, but PG truncates again = infinite loop
      const isOnlyConstraintRename = (() => {
        if (!hasPendingChanges) return false;

        // Look for the pattern of ALTER TABLE statements
        const alterStatements = fullOutput.match(/ALTER TABLE[^;]+;/g) || [];

        if (alterStatements.length === 0) return false;

        // Check if all statements are DROP CONSTRAINT + ADD CONSTRAINT pairs
        const dropConstraints = alterStatements.filter(s => s.includes('DROP CONSTRAINT'));
        const addConstraints = alterStatements.filter(s => s.includes('ADD CONSTRAINT'));

        // If we have equal numbers of drop and add, and they're the only statements, it's a rename
        if (dropConstraints.length > 0 &&
            dropConstraints.length === addConstraints.length &&
            alterStatements.length === dropConstraints.length + addConstraints.length) {

          // Extra check: verify the constraint names differ only by truncation (_fk suffix vs truncated)
          const allAreTruncationRenames = dropConstraints.every((dropStmt, idx) => {
            const addStmt = addConstraints[idx];
            // Drop has truncated name (ends with _), add has _fk suffix
            return dropStmt.includes('_id_"') && addStmt.includes('_id_fk"');
          });

          if (allAreTruncationRenames) {
            console.log('ℹ️  Detected constraint rename statements (PostgreSQL 63-char name truncation)');
            console.log('   This is a known drizzle-kit false positive - treating as in-sync.\n');
            return true;
          }
        }

        return false;
      })();

      // Check if schema is already in sync
      const isInSync =
        fullOutput.includes('No changes detected') ||
        fullOutput.includes('already in sync') ||
        (code === 0 && !hasPendingChanges) ||
        isOnlyConstraintRename;

      if (isInSync) {
        console.log('✅ Database schema is in sync with code. No pending changes.\n');
        process.exit(0);
      }

      if (hasPendingChanges && !isOnlyConstraintRename) {
        console.log('❌ Schema drift detected! The following changes need to be pushed:\n');
        console.log('─'.repeat(60));

        // Extract and display the SQL statements
        const sqlMatch = fullOutput.match(/Warning.*?You are about to execute current statements:([\s\S]*?)(?:\[|$)/);
        if (sqlMatch) {
          console.log(sqlMatch[1].trim());
        } else {
          // Show relevant parts of the output
          const lines = fullOutput.split('\n').filter(line =>
            line.includes('CREATE') ||
            line.includes('ALTER') ||
            line.includes('DROP') ||
            line.includes('ADD COLUMN') ||
            line.includes('ADD CONSTRAINT')
          );
          if (lines.length > 0) {
            console.log(lines.join('\n'));
          } else {
            console.log(fullOutput);
          }
        }

        console.log('─'.repeat(60));
        console.log('\n⚠️  ACTION REQUIRED:');
        console.log('   Run `pnpm --filter @psico-pay/db db:push` to apply these changes');
        console.log('   to the production database before merging this PR.\n');
        process.exit(1);
      }

      // If we get here with a non-zero exit code but no clear indication, treat as error
      if (code !== 0) {
        console.error('❌ Schema check failed with unexpected error:\n');
        console.error(fullOutput);
        process.exit(2);
      }

      // If code is 0 and no pending changes detected, we're in sync
      console.log('✅ Database schema is in sync with code.\n');
      process.exit(0);
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      console.error('❌ Failed to run schema check:', err.message);
      process.exit(2);
    });
  });
}

checkSchemaDrift().catch((err) => {
  console.error('❌ Schema check failed:', err);
  process.exit(2);
});
