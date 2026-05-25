import 'dotenv/config';
import { createBot } from './bot.js';
import { createGigachatFromEnv } from './gigachatClient.js';

const token = process.env.BOT_TOKEN?.trim();

if (!token) {
  console.error('Ошибка: задайте BOT_TOKEN в файле .env (см. .env.example).');
  process.exit(1);
}

const gigachat = createGigachatFromEnv();
if (gigachat) {
  console.log('[gigachat] включён — вопросы через текст, /ai, /ask');
} else {
  console.warn(
    '[gigachat] нет — задайте GIGACHAT_AUTHORIZATION_KEY чтобы отвечать через нейросеть',
  );
}

const bot = createBot(token, gigachat);

const stop = async (signal) => {
  console.log(`${signal}: останавливаю поллинг…`);
  try {
    bot.stop(signal);
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

process.once('SIGINT', () => void stop('SIGINT'));
process.once('SIGTERM', () => void stop('SIGTERM'));

try {
  await bot.launch(() => {
    console.log('Telebotik (ОЗОН) запущен (long polling). Ctrl+C для остановки.');
  });
} catch (err) {
  console.error('Ошибка запуска бота:', err?.message ?? err);
  process.exit(1);
}
