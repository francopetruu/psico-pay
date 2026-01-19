import { logger } from './lib/logger.js';
import { env } from './config/env.js';
import { createDb, closePool } from './db/index.js';
import { createRepositories } from './repositories/index.js';
import {
  createCalendarService,
  createPaymentService,
  createNotificationService,
} from './services/index.js';
import { createSessionMonitorJob, createScheduler } from './jobs/index.js';
import { createServer, startServer } from './server.js';

async function main() {
  logger.info('Starting PsicoPay...');

  // Initialize database
  logger.info('Connecting to database...');
  const db = createDb(env.DATABASE_URL);
  const repositories = createRepositories(db);

  // Initialize services
  logger.info('Initializing services...');
  const calendarService = createCalendarService({
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    googleRefreshToken: env.GOOGLE_REFRESH_TOKEN,
    googleCalendarId: env.GOOGLE_CALENDAR_ID,
  });

  const paymentService = createPaymentService({
    mpAccessToken: env.MP_ACCESS_TOKEN,
    mpPublicKey: env.MP_PUBLIC_KEY,
    mpWebhookSecret: env.MP_WEBHOOK_SECRET,
    appUrl: env.APP_URL,
  });

  const notificationService = createNotificationService({
    twilioAccountSid: env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: env.TWILIO_AUTH_TOKEN,
    twilioWhatsappNumber: env.TWILIO_WHATSAPP_NUMBER,
  });

  // Initialize cron job
  logger.info('Initializing session monitor job...');
  const sessionMonitorJob = createSessionMonitorJob(
    calendarService,
    paymentService,
    notificationService,
    repositories,
    { sessionPrice: env.SESSION_PRICE }
  );

  const scheduler = createScheduler(sessionMonitorJob, {
    cronSchedule: env.CRON_SCHEDULE,
    runOnStart: env.NODE_ENV === 'development',
  });

  // Initialize Express server
  logger.info('Initializing HTTP server...');
  const app = createServer(
    {
      paymentService,
      notificationService,
      repositories,
    },
    { port: env.PORT }
  );

  // Start server
  await startServer(app, { port: env.PORT });

  // Start scheduler
  scheduler.start();

  logger.info(
    {
      port: env.PORT,
      cronSchedule: env.CRON_SCHEDULE,
      environment: env.NODE_ENV,
    },
    'PsicoPay started successfully'
  );
}

main().catch((error) => {
  logger.fatal(
    { error: error instanceof Error ? error.message : 'Unknown error' },
    'Failed to start PsicoPay'
  );
  process.exit(1);
});

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutdown signal received');

  try {
    await closePool();
    logger.info('Database pool closed');
  } catch (error) {
    logger.error(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'Error during shutdown'
    );
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
