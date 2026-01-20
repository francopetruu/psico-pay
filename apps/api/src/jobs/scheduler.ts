import cron from 'node-cron';
import { logger } from '../lib/logger.js';
import { SessionMonitorJob } from './session-monitor.job.js';

export interface SchedulerConfig {
  cronSchedule: string;
  runOnStart: boolean;
}

export class Scheduler {
  private task: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor(
    private job: SessionMonitorJob,
    private config: SchedulerConfig = {
      cronSchedule: '0 * * * *', // Every hour at minute 0
      runOnStart: false,
    }
  ) {}

  /**
   * Starts the scheduler.
   */
  start(): void {
    if (this.task) {
      logger.warn('Scheduler already started');
      return;
    }

    // Validate cron expression
    if (!cron.validate(this.config.cronSchedule)) {
      throw new Error(`Invalid cron schedule: ${this.config.cronSchedule}`);
    }

    logger.info(
      { schedule: this.config.cronSchedule },
      'Starting session monitor scheduler'
    );

    this.task = cron.schedule(
      this.config.cronSchedule,
      async () => {
        await this.executeJob();
      },
      {
        scheduled: true,
        timezone: 'America/Argentina/Buenos_Aires',
      }
    );

    // Optionally run immediately on start
    if (this.config.runOnStart) {
      logger.info('Running job immediately on start');
      this.executeJob().catch((error) => {
        logger.error(
          { error: error instanceof Error ? error.message : 'Unknown error' },
          'Initial job run failed'
        );
      });
    }
  }

  /**
   * Stops the scheduler.
   */
  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Scheduler stopped');
    }
  }

  /**
   * Executes the job with concurrency protection.
   */
  private async executeJob(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Job is already running, skipping this execution');
      return;
    }

    this.isRunning = true;

    try {
      await this.job.run();
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Manually trigger job execution (for testing/debugging).
   */
  async runNow(): Promise<void> {
    await this.executeJob();
  }

  /**
   * Check if scheduler is active.
   */
  isActive(): boolean {
    return this.task !== null;
  }
}

/**
 * Factory function to create Scheduler.
 */
export function createScheduler(
  job: SessionMonitorJob,
  config?: Partial<SchedulerConfig>
): Scheduler {
  return new Scheduler(job, {
    cronSchedule: config?.cronSchedule ?? '0 * * * *',
    runOnStart: config?.runOnStart ?? false,
  });
}
