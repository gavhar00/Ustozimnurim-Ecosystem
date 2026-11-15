import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { validateEnv, Env } from './env.schema';

/**
 * Thin typed wrapper around Nest's ConfigService so the rest of the app
 * never touches process.env or does its own string-to-number/bigint
 * conversion. One place to change if a var is renamed.
 */
export class AppConfigService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  get nodeEnv() {
    return this.config.get('NODE_ENV', { infer: true });
  }
  get isProduction() {
    return this.nodeEnv === 'production';
  }
  get port() {
    return this.config.get('PORT', { infer: true });
  }
  get logLevel() {
    return this.config.get('LOG_LEVEL', { infer: true });
  }
  get timezone() {
    return this.config.get('TIMEZONE', { infer: true });
  }
  get databaseUrl() {
    return this.config.get('DATABASE_URL', { infer: true });
  }
  get redisUrl() {
    return this.config.get('REDIS_URL', { infer: true });
  }
  get telegramBotToken() {
    return this.config.get('TELEGRAM_BOT_TOKEN', { infer: true });
  }
  get telegramWebhookSecret() {
    return this.config.get('TELEGRAM_WEBHOOK_SECRET', { infer: true });
  }
  get publicWebhookUrl() {
    return this.config.get('PUBLIC_WEBHOOK_URL', { infer: true });
  }
  get adminTelegramIds(): bigint[] {
    return this.config.get('ADMIN_TELEGRAM_IDS', { infer: true });
  }
  get dailyReportTime() {
    return this.config.get('DAILY_REPORT_TIME', { infer: true });
  }
  get sentryDsn() {
    return this.config.get('SENTRY_DSN', { infer: true });
  }
  get channelChatIds() {
    return {
      USTOZIM_NURIM: this.config.get('CHANNEL_USTOZIMNURIM_CHAT_ID', { infer: true }),
      SAHIFALAR: this.config.get('CHANNEL_SAHIFALAR_CHAT_ID', { infer: true }),
      COMMUNITY: this.config.get('CHANNEL_COMMUNITY_CHAT_ID', { infer: true }),
      QURANOY: this.config.get('CHANNEL_QURANOY_CHAT_ID', { infer: true }),
    };
  }
}

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: ['.env.local', '.env'],
    }),
  ],
  providers: [
    {
      provide: AppConfigService,
      useFactory: (config: ConfigService<Env, true>) => new AppConfigService(config),
      inject: [ConfigService],
    },
  ],
  exports: [AppConfigService],
})
export class AppConfigModule {}
