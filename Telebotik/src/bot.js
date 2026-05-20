import { Telegraf, Markup } from 'telegraf';
import { buildBtcPriceMessageLines } from './binancePrice.js';
import { telegrafProxyOptionsFromEnv } from './telegramProxyOpts.js';
import {
  isDailySubscribed,
  subscribeDaily,
  unsubscribeDaily,
} from './subscriberRepo.js';

/** @typedef {import('pg').Pool} Pool */

const BTN_PRICE = '₿ Курс сейчас';
const BTN_SUB = '🔔 Утренний дайджест вкл.';
const BTN_UNS = '🔕 Утренний дайджест выкл.';

/** @returns {ReturnType<typeof Markup.keyboard>} */
function mainKb() {
  return Markup.keyboard([[BTN_PRICE], [BTN_SUB, BTN_UNS]])
    .resize()
    .persistent();
}

/**
 * @param {string} token
 * @param {Pool} pool
 */
export function createBot(token, pool) {
  const bot = new Telegraf(token, telegrafProxyOptionsFromEnv());

  async function replySpotBtc(ctx) {
    const msg = await buildBtcPriceMessageLines();
    await ctx.reply(msg.text, mainKb());
  }

  bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    const on = await isDailySubscribed(pool, chatId);
    await ctx.reply(
      'Привет! Это Telebotik — только курс Bitcoin к USDT (спот **Binance**).\n\n' +
        '• Кнопка «' +
        BTN_PRICE +
        '» или команда **`/btc`** — цена по запросу.\n' +
        '• «' +
        BTN_SUB +
        '» или **`/subscribe`** — раз в день утром (если включили), одно сообщение подписчикам.\n' +
        '• «' +
        BTN_UNS +
        '» или **`/unsubscribe`** — отключить утреннее письмо.\n\n' +
        `_Сейчас утренняя рассылка:_ ${on ? 'включена ✓' : 'выключена'}.`,
      { parse_mode: 'Markdown', ...mainKb() },
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      'Доступно:\n' +
        '• `/start` — описание и клавиатура\n' +
        '• `/btc` или «' +
        BTN_PRICE +
        '» — актуальный курс\n' +
        '• `/subscribe` или «' +
        BTN_SUB +
        '» — подписаться на утреннее уведомление\n' +
        '• `/unsubscribe` или «' +
        BTN_UNS +
        '» — отписаться\n\n' +
        'Точное время «утром» задаёт администратор бота переменными `BTC_DIGEST_CRON` и `BTC_DIGEST_TZ` в файле окружения (по умолчанию 09:00, часовой пояс машины).\n\n' +
        'Для теста раз в несколько минут можно задать `BTC_DIGEST_TICK_MINUTES` — см. README.',
      { parse_mode: 'Markdown', ...mainKb() },
    );
  });

  bot.command('menu', async (ctx) => {
    await ctx.reply('Меню:', mainKb());
  });

  bot.command(['btc', 'bitcoin', 'price'], replySpotBtc);
  bot.hears([BTN_PRICE, '/btc'], replySpotBtc);

  const replySub = async (ctx, okText) => {
    await subscribeDaily(pool, ctx.chat.id);
    await ctx.reply(okText, mainKb());
  };

  const replyUnsub = async (ctx, okText) => {
    await unsubscribeDaily(pool, ctx.chat.id);
    await ctx.reply(okText, mainKb());
  };

  bot.command(['subscribe', 'daily_on'], async (ctx) => {
    await replySub(ctx, 'Утренний дайджест включён. Первым придёт сообщение по расписанию.');
  });
  bot.hears([BTN_SUB], async (ctx) => {
    await replySub(ctx, 'Подписка на утренний курс сохранена.');
  });

  bot.command(['unsubscribe', 'daily_off', 'stop'], async (ctx) => {
    await replyUnsub(ctx, 'Утренний дайджест выключен.');
  });
  bot.hears([BTN_UNS], async (ctx) => {
    await replyUnsub(ctx, 'Отписались от утренней рассылки.');
  });

  bot.on('text', async (ctx) => {
    const text = ctx.message?.text ?? '';
    if (text.startsWith('/')) {
      await ctx.reply(
        'Такую команду не знаю. Список — `/help` или кнопки ниже.',
        { parse_mode: 'Markdown', ...mainKb() },
      );
      return;
    }

    await ctx.reply(
      'Не понял сообщение. Нажмите «' +
        BTN_PRICE +
        '» или откройте `/help`.',
      mainKb(),
    );
  });

  bot.catch((err, ctx) => {
    console.error('[bot]', err);
    ctx?.reply?.('Временная ошибка. Попробуйте /start').catch(() => {});
  });

  return bot;
}
