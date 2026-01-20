import { createDb, closePool, sessions } from '../src/db/index.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function resetReminder() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const db = createDb(connectionString);
  const sessionId = 'f05c7dc3-cf7d-4faa-85a2-4d5e77ccb571';

  console.log('Resetting reminder_24h_sent flag...');

  await db
    .update(sessions)
    .set({ reminder24hSent: false })
    .where(eq(sessions.id, sessionId));

  console.log('Done! Restart the server to resend the reminder.');
  await closePool();
  process.exit(0);
}

resetReminder().catch(console.error);
