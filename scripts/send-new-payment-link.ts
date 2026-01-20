import 'dotenv/config';
import { createDb, closePool, sessions, patients, paymentPreferences } from '../src/db/index.js';
import { eq } from 'drizzle-orm';
import { createPaymentService } from '../src/services/payment.service.js';
import { createNotificationService } from '../src/services/notification.service.js';

async function sendNewPaymentLink() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const db = createDb(connectionString);
  const sessionId = 'f05c7dc3-cf7d-4faa-85a2-4d5e77ccb571';

  console.log('Fetching session and patient...');

  // Get session with patient
  const result = await db
    .select()
    .from(sessions)
    .innerJoin(patients, eq(sessions.patientId, patients.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (result.length === 0) {
    console.error('Session not found');
    process.exit(1);
  }

  const session = result[0].sessions;
  const patient = result[0].patients;

  console.log(`Patient: ${patient.name}`);
  console.log(`Phone: ${patient.phone}`);
  console.log(`Session: ${session.scheduledAt}`);

  // Create NEW payment preference with production credentials
  console.log('Creating new payment preference with PRODUCTION credentials...');
  const paymentService = createPaymentService({
    mpAccessToken: process.env.MP_ACCESS_TOKEN!,
    mpPublicKey: process.env.MP_PUBLIC_KEY!,
    mpWebhookSecret: process.env.MP_WEBHOOK_SECRET!,
    appUrl: process.env.APP_URL!,
  });

  const preference = await paymentService.createPaymentPreference({
    sessionId: session.id,
    patientName: patient.name,
    amount: parseFloat(session.amount),
    sessionDate: session.scheduledAt,
  });

  console.log(`✅ Created PRODUCTION payment link:`);
  console.log(`   ${preference.paymentLink}`);

  // Save new preference
  await db.insert(paymentPreferences).values({
    sessionId: session.id,
    mpPreferenceId: preference.preferenceId,
    paymentLink: preference.paymentLink,
    expiresAt: preference.expiresAt,
  });

  // Send WhatsApp
  console.log('Sending WhatsApp message...');
  const notificationService = createNotificationService({
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
    twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER!,
  });

  const sendResult = await notificationService.sendPaymentReminder(patient.phone!, {
    patientName: patient.name,
    sessionDate: session.scheduledAt,
    paymentLink: preference.paymentLink,
  });

  if (sendResult.success) {
    console.log('✅ WhatsApp message sent successfully!');
    console.log(`Message SID: ${sendResult.messageSid}`);
  } else {
    console.error('❌ Failed to send WhatsApp message');
    console.error(`Error: ${sendResult.error}`);
  }

  await closePool();
  process.exit(0);
}

sendNewPaymentLink().catch(console.error);
