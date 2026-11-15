/**
 * Local-only convenience runner. The locked architecture is webhook-only in
 * production — this script exists purely so /start can be smoke-tested on
 * a laptop without exposing a public URL or running ngrok.
 *
 * Run with: npm run bot:poll-dev
 * (make sure no webhook is set first: npm run bot:delete-webhook)
 */
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BotService } from '../src/bot/bot.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const botService = app.get(BotService);

  console.log('Starting grammY long-polling for local dev...');
  await botService.bot.start({
    onStart: (botInfo) => console.log(`Bot @${botInfo.username} is polling. Press Ctrl+C to stop.`),
  });
}

main();
