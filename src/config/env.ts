import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  APP_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().url(),

  // Google Calendar
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REFRESH_TOKEN: z.string().min(1),
  GOOGLE_CALENDAR_ID: z.string().default('primary'),

  // Mercado Pago
  MP_ACCESS_TOKEN: z.string().min(1),
  MP_PUBLIC_KEY: z.string().min(1),
  MP_WEBHOOK_SECRET: z.string().min(1),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().startsWith('AC'),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_NUMBER: z.string().startsWith('whatsapp:'),

  // Session Configuration
  SESSION_PRICE: z.coerce.number().positive().default(15000),
  REMINDER_24H_OFFSET: z.coerce.number().positive().default(1440),
  REMINDER_2H_OFFSET: z.coerce.number().positive().default(120),
  MEET_LINK_OFFSET: z.coerce.number().positive().default(15),

  // Cron
  CRON_SCHEDULE: z.string().default('0 * * * *'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment validation failed:');
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
