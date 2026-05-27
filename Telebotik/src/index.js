import 'dotenv/config';
import pg from 'pg';
import { createBot } from './bot.js';
import { createGigachatFromEnv } from './gigachatClient.js';
import { countChunks } from './ragStore.js';
import { createRagService, ragOptionsFromEnv } from './ragService.js';

const token = process.env.BOT_TOKEN?.trim();
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!token) {
  console.error('Ошибка: задайте BOT_TOKEN в файле .env (см. .env.example).');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('Ошибка: задайте DATABASE_URL в .env (RAG требует PostgreSQL + pgvector).');
  process.exit(1);
}

const gigachat = createGigachatFromEnv();
if (gigachat) {
  console.log('[gigachat] включён — чат + embeddings');
} else {
  console.warn(
    '[gigachat] нет — задайте GIGACHAT_AUTHORIZATION_KEY',
  );
}

const pool = new pg.Pool({ connectionString: databaseUrl });

try {
  await pool.query('SELECT 1');
  await pool.query('SELECT id FROM rag_chunks LIMIT 1');
} catch (err) {
  console.error(
    'PostgreSQL / rag_chunks недоступны. Выполните npm run db:apply (нужен pgvector).',
    err?.message ?? err,
  );
  await pool.end().catch(() => {});
  process.exit(1);
}

const chunkCount = await countChunks(pool);
if (chunkCount === 0) {
  console.warn(
    '[rag] таблица rag_chunks пуста — выполните npm run rag:index после деплоя',
  );
} else {
  console.log(`[rag] в базе фрагментов: ${chunkCount}`);
}

const rag =
  gigachat != null
    ? createRagService(pool, gigachat, ragOptionsFromEnv())
    : null;

const bot = createBot(token, gigachat, rag);

const stop = async (signal) => {
  console.log(`${signal}: останавливаю поллинг и пул PostgreSQL…`);
  try {
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

try {
  await bot.launch(() => {
    console.log('Telebotik (ОЗОН + RAG) запущен (long polling). Ctrl+C для остановки.');
  });
} catch (err) {
  console.error('Ошибка запуска бота:', err?.message ?? err);
  await pool.end().catch(() => {});
  process.exit(1);
}
