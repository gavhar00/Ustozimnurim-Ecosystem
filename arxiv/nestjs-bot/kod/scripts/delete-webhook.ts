import 'dotenv/config';

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('Missing TELEGRAM_BOT_TOKEN in env.');
    process.exit(1);
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: 'POST' });
  const data = await res.json();
  console.log('deleteWebhook response:', data);
}

main();
