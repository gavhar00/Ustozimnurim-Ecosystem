import { validateEnv } from '../../src/config/env.schema';

const validEnv = {
  NODE_ENV: 'development',
  PORT: '3000',
  LOG_LEVEL: 'info',
  TIMEZONE: 'Asia/Tashkent',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  REDIS_URL: 'rediss://default:pass@localhost:6379',
  TELEGRAM_BOT_TOKEN: '123456:ABC-DEF',
  TELEGRAM_WEBHOOK_SECRET: 'a-sufficiently-long-random-secret',
  ADMIN_TELEGRAM_IDS: '111111111,222222222',
  DAILY_REPORT_TIME: '20:00',
  CHANNEL_USTOZIMNURIM_CHAT_ID: '-1001111111111',
  CHANNEL_SAHIFALAR_CHAT_ID: '-1002222222222',
  CHANNEL_COMMUNITY_CHAT_ID: '-1003333333333',
  CHANNEL_QURANOY_CHAT_ID: '-1004444444444',
};

describe('validateEnv', () => {
  it('accepts a fully valid config', () => {
    const result = validateEnv(validEnv);
    expect(result.PORT).toBe(3000);
    expect(result.ADMIN_TELEGRAM_IDS).toEqual([111111111n, 222222222n]);
    expect(result.CHANNEL_QURANOY_CHAT_ID).toBe(-1004444444444n);
  });

  it('rejects a missing DATABASE_URL', () => {
    const { DATABASE_URL, ...rest } = validEnv;
    expect(() => validateEnv(rest)).toThrow(/DATABASE_URL/);
  });

  it('rejects a short webhook secret', () => {
    expect(() =>
      validateEnv({ ...validEnv, TELEGRAM_WEBHOOK_SECRET: 'short' }),
    ).toThrow(/TELEGRAM_WEBHOOK_SECRET/);
  });

  it('rejects a malformed DAILY_REPORT_TIME', () => {
    expect(() => validateEnv({ ...validEnv, DAILY_REPORT_TIME: '8pm' })).toThrow(
      /DAILY_REPORT_TIME/,
    );
  });

  it('defaults NODE_ENV to development when omitted', () => {
    const { NODE_ENV, ...rest } = validEnv;
    expect(validateEnv(rest).NODE_ENV).toBe('development');
  });
});
