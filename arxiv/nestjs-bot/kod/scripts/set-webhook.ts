/**
 * One-off script: registers the Telegram webhook URL + secret token.
 * Run with: npm run bot:set-webhook
 * Reads PUBLIC_WEBHOOK_URL, TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET
 * from the environment (.env is loaded manually here since this runs
 * outside the Nest app).
 */
import 'dotenv/config';

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const baseUrl = process.env.PUBLIC_WEBHOOK_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!token || !baseUrl || !secret) {
    console.error('Missing TELEGRAM_BOT_TOKEN, PUBLIC_WEBHOOK_URL, or TELEGRAM_WEBHOOK_SECRET in env.');
    process.exit(1);
  }

  const webhookUrl = `${baseUrl.replace(/\/$/, '')}/telegram/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl, secret_token: secret }),
  });
  const data = await res.json();
  console.log('setWebhook response:', data);
}

main();
