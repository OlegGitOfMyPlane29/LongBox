import cron from 'node-cron';
import { buildBtcPriceMessageLines } from './binancePrice.js';
import { listDailySubscriberChatIds } from './subscriberRepo.js';

/** @type {cron.ScheduledTask | null} */
let scheduledTask = null;

/** @type {cron.ScheduledTask | null} */
let tickTask = null;

/**
 * Запуск планировщиков после старта бота.
 * @param {{ bot: import('telegraf').Telegraf, pool: import('pg').Pool }} p
 */
export function startScheduledJobs({ bot, pool }) {
  stopScheduledJobs();

  const cronExpr = process.env.BTC_DIGEST_CRON?.trim() || '0 9 * * *';
  const tz = process.env.BTC_DIGEST_TZ?.trim() || '';

  if (!cron.validate(cronExpr)) {
    console.warn(
      '[digest] некорректный BTC_DIGEST_CRON — основная задача отключена:',
      cronExpr,
    );
  } else {
    const opts = tz ? { timezone: tz } : {};
    scheduledTask = cron.schedule(
      cronExpr,
      () => void runDailyDigest({ bot, pool }),
      opts,
    );
    const tzInfo = tz || 'часовой пояс ОС процесса';
    console.info('[digest] основной cron:', cronExpr, '| TZ:', tzInfo);
  }

  const tickRaw = Number(process.env.BTC_DIGEST_TICK_MINUTES?.trim() || '0');
  if (Number.isFinite(tickRaw) && tickRaw > 0 && tickRaw <= 59) {
    tickTask = cron.schedule(
      `*/${tickRaw} * * * *`,
      () => void runDailyDigest({ bot, pool }),
      tz ? { timezone: tz } : {},
    );
    console.warn(
      `[digest] тест: каждые ${tickRaw} мин по BTC_DIGEST_TICK_MINUTES`,
    );
  }
}

export function stopScheduledJobs() {
  scheduledTask?.stop?.();
  scheduledTask = null;
  tickTask?.stop?.();
  tickTask = null;
}

/**
 * Отправляет дайджест всем подписчикам из БД.
 * @param {{ bot: import('telegraf').Telegraf, pool: import('pg').Pool }} p
 */
export async function runDailyDigest({ bot, pool }) {
  const msg = await buildBtcPriceMessageLines();
  const body =
    `🌅 Утренний дайджест BTC/USDT (Binance Spot)\n\n${msg.text}`;

  let ids = [];
  try {
    ids = await listDailySubscriberChatIds(pool);
  } catch (err) {
    console.error('[digest] ошибка SELECT подписчиков:', err?.message ?? err);
    return;
  }

  if (!ids.length) {
    console.info('[digest] подписчиков нет — пропуск');
    return;
  }

  let ok = 0;
  for (const chatId of ids) {
    try {
      await bot.telegram.sendMessage(chatId, body);
      ok += 1;
    } catch (err) {
      console.warn('[digest] telegram send', chatId, err?.description ?? err?.message ?? err);
    }
  }

  console.info('[digest] отправлено:', ok, '/', ids.length);
}
