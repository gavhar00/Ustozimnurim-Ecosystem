import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { LoggingModule } from './logging/logging.module';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';
import { AppController } from './app.controller';
import { BotModule } from './bot/bot.module';
import { UsersModule } from './modules/users/users.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { AttributionModule } from './modules/attribution/attribution.module';

@Module({
  imports: [
    // Infrastructure (global)
    AppConfigModule,
    LoggingModule,
    PrismaModule,
    RedisModule,
    QueueModule,
    // Feature modules
    UsersModule,
    OnboardingModule,
    ChannelsModule,
    AttributionModule,
    BotModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: SentryExceptionFilter }],
})
export class AppModule {}
