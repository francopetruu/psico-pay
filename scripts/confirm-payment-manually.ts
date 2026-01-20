import 'dotenv/config';
import { createDb, closePool, sessions, patients } from '../src/db/index.js';
import { eq } from 'drizzle-orm';
import { createNotificationService } from '../src/services/notification.service.js';

async function confirmPaymentManually() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  const db = createDb(connectionString);
  const sessionId = 'f05c7dc3-cf7d-4faa-85a2-4d5e77ccb571';

  console.log('Fetching session...');

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
  console.log(`Current payment status: ${session.paymentStatus}`);
  console.log(`Meet link: ${session.meetLink}`);

  // Update payment status to paid
  console.log('\nUpdating payment status to PAID...');
  await db
    .update(sessions)
    .set({
      paymentStatus: 'paid',
      paymentId: 'manual-confirmation',
      updatedAt: new Date()
    })
    .where(eq(sessions.id, sessionId));

  console.log('✅ Payment status updated to PAID');

  // Send payment confirmation WhatsApp
  console.log('\nSending payment confirmation...');
  const notificationService = createNotificationService({
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
    twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER!,
  });

  const confirmResult = await notificationService.sendPaymentConfirmation(patient.phone!, {
    patientName: patient.name,
    sessionDate: session.scheduledAt,
  });

  if (confirmResult.success) {
    console.log('✅ Payment confirmation sent!');
  } else {
    console.error('❌ Failed to send confirmation:', confirmResult.error);
  }

  // Send Meet link
  console.log('\nSending Meet link...');
  const meetResult = await notificationService.sendMeetLink(patient.phone!, {
    patientName: patient.name,
    meetLink: session.meetLink!,
  });

  if (meetResult.success) {
    console.log('✅ Meet link sent!');
    console.log(`   ${session.meetLink}`);
  } else {
    console.error('❌ Failed to send Meet link:', meetResult.error);
  }

  // Mark meet link as sent
  await db
    .update(sessions)
    .set({ meetLinkSent: true, updatedAt: new Date() })
    .where(eq(sessions.id, sessionId));

  console.log('\n🎉 Payment confirmation complete!');
  console.log('The patient should receive:');
  console.log('  1. Payment confirmation message');
  console.log('  2. Google Meet link for the session');

  await closePool();
  process.exit(0);
}

confirmPaymentManually().catch(console.error);
