import { Telegraf, Markup } from 'telegraf';
import { buildBtcPriceMessageLines } from './binancePrice.js';
import {
  clipTelegramMessage,
  preemptiveTelebotikAnswer,
} from './gigachatClient.js';
import { telegrafProxyOptionsFromEnv } from './telegramProxyOpts.js';
import {
  isDailySubscribed,
  subscribeDaily,
  unsubscribeDaily,
} from './subscriberRepo.js';


/** @typedef {import('./gigachatClient.js').GigachatClient} GigachatClient */

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
 * Интервал ~4 сек: Telegram гасит «печатает» примерно каждые 5 сек без повтора.
 *
 * @param {{ sendChatAction: (chatId: number, action: string) => Promise<boolean> }} telegram
 * @param {number} chatId
 * @returns {() => void}
 */
function createTypingTicker(telegram, chatId) {
  const ms = 4000;
  const tick = () => {
    void telegram.sendChatAction(chatId, 'typing').catch(() => {});
  };
  tick();
  const handle = setInterval(tick, ms);
  return () => clearInterval(handle);
}

/**
 * @param {string} token
 * @param {Pool} pool
 * @param {GigachatClient | null} [gigachat]
 */
export function createBot(token, pool, gigachat = null) {
  const bot = new Telegraf(token, telegrafProxyOptionsFromEnv());

  async function replySpotBtc(ctx) {
    const msg = await buildBtcPriceMessageLines();
    await ctx.reply(msg.text, mainKb());
  }

  bot.start(async (ctx) => {
    const chatId = ctx.chat.id;
    const on = await isDailySubscribed(pool, chatId);
    const llmLine =
      gigachat != null
        ? '• Коман **`/ai`**, **`/gpt`**, **`/ask`** или **любой обычный текст** без `/` — вопрос нейросети **GigaChat** (`GIGACHAT_AUTHORIZATION_KEY` в окружении).\n'
        : '• Если задать `GIGACHAT_AUTHORIZATION_KEY` в `.env`, станет доступен **GigaChat**: `/ai` `/gpt` `/ask` или обычный текст (README).\n';
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
        '» или **`/unsubscribe`** — отключить утреннее письмо.\n' +
        llmLine +
        '\n' +
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
        '» — отписаться\n' +
        (gigachat != null
          ? '• `/ai`, `/gpt` или `/ask` плюс вопрос либо **простой текст без /** — через **GigaChat** при настроенном `GIGACHAT_AUTHORIZATION_KEY`\n'
          : '• При `GIGACHAT_AUTHORIZATION_KEY` появится GigaChat: `/ai`, `/gpt`, `/ask` или обычный текст.\n') +
        '\n' +
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

  async function replyViaGigaChat(ctx, payload) {
    if (!gigachat) {
      await ctx.reply(
        'GigaChat не настроен: задайте GIGACHAT_AUTHORIZATION_KEY в .env.',
        mainKb(),
      );
      return;
    }

    const early = preemptiveTelebotikAnswer(payload);
    if (early !== null) {
      await ctx.reply(early, mainKb());
      return;
    }

    let stopTyping = /** @type {null | (() => void)} */ (null);
    try {
      stopTyping = createTypingTicker(ctx.telegram, ctx.chat.id);
      const reply = clipTelegramMessage(
        await gigachat.completeUserTurn(payload),
      );
      await ctx.reply(reply, mainKb());
    } catch (err) {
      const detail =
        err instanceof Error ? err.stack ?? err.message : String(err);
      console.error('[gigachat] запрос провалился:', detail);
      await ctx.reply(
        'Не получилось ответить через GigaChat. Проверьте ключ, сеть или сертификаты (README). Чуть позже можете повторить вопрос.',
        mainKb(),
      );
    } finally {
      stopTyping?.();
    }
  }

  /**
   * @param {string} full вход `/ai текст`, `/gpt текст` или `@username` суффикс бота у команды.
   */
  function slashAiGptPayload(full) {
    const m = full.match(/^\/(?:ai|gpt)(?:@\S+)?(.*)$/is);
    return (m?.[1] ?? '').trim();
  }

  /**
   * @param {string} full вход `/ask вопрос` (поддерживает `/ask@бот`).
   */
  function slashAskPayload(full) {
    const m = full.match(/^\/ask(?:@\S+)?(.*)$/is);
    return (m?.[1] ?? '').trim();
  }

  bot.command(['ai', 'gpt'], async (ctx) => {
    const full = ctx.message?.text ?? '';
    const payload = slashAiGptPayload(full);
    if (!payload) {
      await ctx.reply(
        'Например: `/ai Что такое биткойн простыми словами?`\nили просто отправьте вопрос **обычным сообщением без /command**.',
        { parse_mode: 'Markdown', ...mainKb() },
      );
      return;
    }

    await replyViaGigaChat(ctx, payload);
  });

  bot.command('ask', async (ctx) => {
    const full = ctx.message?.text ?? '';
    const payload = slashAskPayload(full);
    if (!payload) {
      await ctx.reply(
        'Например: `/ask Как читают графики свечей?`',
        { parse_mode: 'Markdown', ...mainKb() },
      );
      return;
    }

    await replyViaGigaChat(ctx, payload);
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

    if (gigachat != null && text.trim().length > 0) {
      await replyViaGigaChat(ctx, text.trim());
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
