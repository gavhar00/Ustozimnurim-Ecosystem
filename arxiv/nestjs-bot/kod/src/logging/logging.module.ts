import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfigModule, AppConfigService } from '../config/app-config.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (config: AppConfigService) => ({
        pinoHttp: {
          level: config.logLevel,
          transport: config.isProduction
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, colorize: true } },
          // Security requirement (locked architecture, Security section):
          // never log secrets or user message content.
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers["x-telegram-bot-api-secret-token"]',
              'req.body.message.text',
              'req.body.message.caption',
              '*.token',
              '*.password',
            ],
            censor: '[REDACTED]',
          },
          autoLogging: {
            ignore: (req: { url?: string }) => req.url === '/health',
          },
        },
      }),
      inject: [AppConfigService],
    }),
  ],
  exports: [LoggerModule],
})
export class LoggingModule {}
