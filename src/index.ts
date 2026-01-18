import { logger } from './lib/logger.js';

async function main() {
  logger.info('Starting PsicoPay...');

  // TODO: Initialize database connection
  // TODO: Initialize cron job
  // TODO: Initialize Express server for webhooks

  logger.info('PsicoPay started successfully');
}

main().catch((error) => {
  logger.fatal({ error }, 'Failed to start PsicoPay');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
