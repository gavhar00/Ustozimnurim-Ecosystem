import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfigModule, AppConfigService } from '../config/app-config.module';

export const REDIS_CLIENT = 'REDIS_CLIENT';

/**
 * Raw Redis client for direct use (rate limiting, short-lived cache).
 * BullMQ gets its own connection inside QueueModule — queues should not
 * share a client with blocking/cache commands.
 */
@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (config: AppConfigService) =>
        // Upstash and most managed Redis providers require TLS on rediss://
        new Redis(config.redisUrl, { maxRetriesPerRequest: 3 }),
      inject: [AppConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
