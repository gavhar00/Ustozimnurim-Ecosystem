import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { initSentry } from './sentry/sentry.init';

async function bootstrap(): Promise<void> {
  // Sentry must be initialized before the Nest app is created.
  initSentry(process.env.SENTRY_DSN ?? '', process.env.NODE_ENV ?? 'development');

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  app.get(Logger).log(`Ustozim Nurim bot service listening on port ${port}`);
}

bootstrap();
