export { env, type Env } from './env.js';

export const config = {
  // Timing configuration for notifications (in minutes)
  timing: {
    reminder24h: {
      min: 1380, // 23 hours
      max: 1440, // 24 hours
    },
    reminder2h: {
      min: 60,   // 1 hour
      max: 120,  // 2 hours
    },
    meetLink: {
      min: 0,    // session start
      max: 15,   // 15 minutes before
    },
  },

  // Calendar event filtering
  calendar: {
    sessionTitlePattern: /sesi[oó]n/i,
    minDurationMinutes: 30,
    maxDurationMinutes: 90,
    lookAheadHours: 48,
  },

  // Phone validation (E.164 format)
  phone: {
    pattern: /^\+[1-9]\d{1,14}$/,
  },
} as const;
