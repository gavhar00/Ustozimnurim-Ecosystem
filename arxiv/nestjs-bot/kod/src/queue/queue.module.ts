import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import Redis from 'ioredis';
import { AppConfigModule, AppConfigService } from '../config/app-config.module';

/**
 * Registers the BullMQ connection only. Later phases (notifications,
 * daily-events-aggregation, DAILY/weekly admin report, mistake-review
 * scheduler) add their own queue + processor pair inside their own module
 * and import QueueModule — nothing about their queues is defined here so
 * this module never needs to change when a new job type is added.
 */
export const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  DAILY_EVENTS_AGGREGATION: 'daily-events-aggregation',
  DAILY_ADMIN_REPORT: 'daily-admin-report',
  WEEKLY_ADMIN_REPORT: 'weekly-admin-report',
  AI_MEMORY_SUMMARIZATION: 'ai-memory-summarization',
  MISTAKE_REVIEW_SCHEDULER: 'mistake-review-scheduler',
} as const;

@Module({
  imports: [
    AppConfigModule,
    BullModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (config: AppConfigService) => ({
        // BullMQ requires maxRetriesPerRequest: null on its own connection —
        // it manages retries itself and this must not come from the shared
        // cache client in RedisModule.
        connection: new Redis(config.redisUrl, { maxRetriesPerRequest: null }),
      }),
      inject: [AppConfigService],
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
