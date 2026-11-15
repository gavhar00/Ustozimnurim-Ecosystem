import { z } from 'zod';

/**
 * Every environment variable the app reads, in one place.
 * Fails fast on boot if anything required is missing or malformed —
 * we never want to discover a misconfigured deploy from a runtime crash.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  TIMEZONE: z.string().default('Asia/Tashkent'),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().min(1),

  TELEGRAM_BOT_TOKEN: z.string().min(1),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(16, 'Use a long random string (16+ chars)'),
  PUBLIC_WEBHOOK_URL: z.string().url().optional(),

  ADMIN_TELEGRAM_IDS: z
    .string()
    .default('')
    .transform((val) =>
      val
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
        .map((id) => BigInt(id)),
    ),
  // Reserved for the Daily Admin Report phase — validated now so the format
  // is guaranteed correct by the time that phase reads it.
  DAILY_REPORT_TIME: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Expected HH:mm, e.g. 20:00')
    .default('20:00'),

  CHANNEL_USTOZIMNURIM_CHAT_ID: z.coerce.bigint(),
  CHANNEL_SAHIFALAR_CHAT_ID: z.coerce.bigint(),
  CHANNEL_COMMUNITY_CHAT_ID: z.coerce.bigint(),
  CHANNEL_QURANOY_CHAT_ID: z.coerce.bigint(),

  SENTRY_DSN: z.string().optional().default(''),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Plugs into @nestjs/config's ConfigModule.forRoot({ validate }).
 * Throws with a readable message on startup if validation fails.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`❌ Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
