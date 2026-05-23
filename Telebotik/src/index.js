import 'dotenv/config';
import pg from 'pg';
import { createBot } from './bot.js';
import {
  runDailyDigest,
  startScheduledJobs,
  stopScheduledJobs,
} from './dailyDigest.js';
import { createGigachatFromEnv } from './gigachatClient.js';

const token = process.env.BOT_TOKEN?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!token) {
  console.error('Ошибка: задайте BOT_TOKEN в файле .env (см. .env.example).');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('Ошибка: задайте DATABASE_URL в файле .env (см. .env.example).');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  await pool.query('SELECT 1');
  await pool.query(`SELECT chat_id FROM btc_daily_subscribers LIMIT 1`);
} catch (err) {
  console.error(
    'Не удалось подключиться к PostgreSQL или нет таблицы btc_daily_subscribers:',
    err?.message ?? err,
  );
  console.error('Выполните: npm run db:apply');
  await pool.end().catch(() => {});
  process.exit(1);
}

const gigachat = createGigachatFromEnv();
if (gigachat) console.log('[gigachat] включён — вопросы через /ai, /ask или обычным текстом');
else console.warn('[gigachat] нет — задайте GIGACHAT_AUTHORIZATION_KEY чтобы спрашивать нейросеть');

const bot = createBot(token, pool, gigachat);

const stop = async (signal) => {
  console.log(`${signal}: останавливаю рассылки, поллинг и пул PostgreSQL…`);
  try {
    stopScheduledJobs();
    bot.stop(signal);
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

process.once('SIGINT', () => void stop('SIGINT'));
process.once('SIGTERM', () => void stop('SIGTERM'));

const smokeDigest = process.env.BTC_DIGEST_SMOKE_ON_START?.trim() === '1';
if (smokeDigest) {
  console.warn(
    '[digest] BTC_DIGEST_SMOKE_ON_START=1 — разовая рассылка подписчикам до старта polling',
  );
  await runDailyDigest({ bot, pool });
}

try {
  await bot.launch(() => {
    console.log('Бот запущен (long polling). Ctrl+C для остановки.');
    startScheduledJobs({ bot, pool });
  });
} catch (err) {
  console.error('Ошибка запуска бота:', err?.message ?? err);
  stopScheduledJobs();
  await pool.end().catch(() => {});
  process.exit(1);
}
