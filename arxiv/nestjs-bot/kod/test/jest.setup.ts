// Runs before every test file. Unit tests mock PrismaService/ChannelsService
// etc. directly, but merely *importing* a real class like an adapter still
// pulls in app-config.module.ts, whose @Module decorator calls
// ConfigModule.forRoot() (which validates env) at import time — not at Nest
// bootstrap time. These dummy values exist only to satisfy that validation
// in the test process; no test should depend on their actual values.
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://user:pass@localhost:5432/test';
process.env.REDIS_URL ??= 'rediss://default:pass@localhost:6379';
process.env.TELEGRAM_BOT_TOKEN ??= 'test-token';
process.env.TELEGRAM_WEBHOOK_SECRET ??= 'test-secret-value-long-enough';
process.env.ADMIN_TELEGRAM_IDS ??= '111111111';
process.env.DAILY_REPORT_TIME ??= '20:00';
process.env.CHANNEL_USTOZIMNURIM_CHAT_ID ??= '-1001111111111';
process.env.CHANNEL_SAHIFALAR_CHAT_ID ??= '-1002222222222';
process.env.CHANNEL_COMMUNITY_CHAT_ID ??= '-1003333333333';
process.env.CHANNEL_QURANOY_CHAT_ID ??= '-1004444444444';
