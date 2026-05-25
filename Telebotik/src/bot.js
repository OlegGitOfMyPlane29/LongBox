import { Telegraf, Markup } from 'telegraf';
import {
  appendTurn,
  clearHistory,
  getHistory,
} from './chatHistory.js';
import {
  clipTelegramMessage,
  GIGACHAT_FALLBACK_ERROR,
  OZON_DOCS_LINKS,
  preemptiveOzonAnswer,
} from './gigachatClient.js';
import { telegrafProxyOptionsFromEnv } from './telegramProxyOpts.js';

/** @typedef {import('./gigachatClient.js').GigachatClient} GigachatClient */

const BTN_BUY = '🛒 Как купить';
const BTN_RETURN = '↩️ Возврат товара';
const BTN_SELL = '📦 Продажа на ОЗОН';
const BTN_DOCS = '📋 Документы ОЗОН';
const BTN_RESET = '🔄 Начать заново';

const TOPIC_PROMPTS = {
  [BTN_BUY]:
    'Как купить товар на ОЗОН: с чего начать и на что обратить внимание новичку?',
  [BTN_RETURN]:
    'Как оформить возврат товара на ОЗОН в общих чертах?',
  [BTN_SELL]:
    'Как начать продавать на маркетплейсе ОЗОН: основные шаги для начинающего?',
};

const START_MESSAGE =
  'Привет! Я **Telebotik** — неофициальный AI-помощник по маркетплейсу **ОЗОН**.\n\n' +
  '⚠️ Я **не** поддержка компании Ozon и **не** даю юридических или финансовых гарантий. ' +
  'Для точных формулировок смотрите официальные документы на docs.ozon.ru.\n\n' +
  'Могу подсказать в общих чертах:\n' +
  '• покупку на ОЗОН\n' +
  '• возврат товара\n' +
  '• начало продажи на маркетплейсе\n' +
  '• правила и документы площадки\n\n' +
  '**Напишите вопрос** обычным сообщением или нажмите кнопку ниже.\n' +
  '• `/reset` — начать диалог заново (очистить историю)\n' +
  '• `/help` — список команд';

/** @returns {ReturnType<typeof Markup.keyboard>} */
function mainKb() {
  return Markup.keyboard([
    [BTN_BUY, BTN_RETURN],
    [BTN_SELL, BTN_DOCS],
    [BTN_RESET],
  ])
    .resize()
    .persistent();
}

/**
 * @param {{ sendChatAction: (chatId: number, action: string) => Promise<boolean> }} telegram
 * @param {number} chatId
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

function docsReplyText() {
  return (
    'Официальные документы ОЗОН (для точных формулировок):\n\n' +
    OZON_DOCS_LINKS.map((url, i) => `${i + 1}. ${url}`).join('\n') +
    '\n\nЗадайте конкретный вопрос текстом — постараюсь ответить в общих чертах.'
  );
}

/**
 * @param {string} token
 * @param {GigachatClient | null} [gigachat]
 */
export function createBot(token, gigachat = null) {
  const bot = new Telegraf(token, telegrafProxyOptionsFromEnv());

  async function replyDocs(ctx) {
    await ctx.reply(docsReplyText(), mainKb());
  }

  async function replyReset(ctx) {
    clearHistory(ctx.chat.id);
    await ctx.reply(
      'История диалога очищена. Можете задать новый вопрос про ОЗОН.',
      mainKb(),
    );
  }

  async function replyViaGigaChat(ctx, payload) {
    if (!gigachat) {
      await ctx.reply(
        'GigaChat не настроен: задайте GIGACHAT_AUTHORIZATION_KEY в .env на сервере.',
        mainKb(),
      );
      return;
    }

    const early = preemptiveOzonAnswer(payload);
    if (early !== null) {
      await ctx.reply(early, mainKb());
      return;
    }

    const chatId = ctx.chat.id;
    const history = getHistory(chatId);
    let stopTyping = /** @type {null | (() => void)} */ (null);

    try {
      stopTyping = createTypingTicker(ctx.telegram, chatId);
      const reply = clipTelegramMessage(
        await gigachat.completeUserTurn(payload, history),
      );
      appendTurn(chatId, payload, reply);
      await ctx.reply(reply, mainKb());
    } catch (err) {
      const detail =
        err instanceof Error ? err.stack ?? err.message : String(err);
      console.error('[gigachat] запрос провалился:', detail);
      await ctx.reply(GIGACHAT_FALLBACK_ERROR, mainKb());
    } finally {
      stopTyping?.();
    }
  }

  bot.start(async (ctx) => {
    await ctx.reply(START_MESSAGE, { parse_mode: 'Markdown', ...mainKb() });
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      '**Telebotik** — AI-помощник по ОЗОН (не официальная поддержка).\n\n' +
        'Команды:\n' +
        '• `/start` — приветствие и клавиатура\n' +
        '• `/reset` — очистить историю диалога\n' +
        '• `/help` — эта подсказка\n' +
        '• `/ai`, `/gpt`, `/ask` + текст — вопрос нейросети\n\n' +
        'Или просто **напишите вопрос** без команды.\n\n' +
        'Кнопки:\n' +
        `• «${BTN_BUY}», «${BTN_RETURN}», «${BTN_SELL}» — типовые вопросы\n` +
        `• «${BTN_DOCS}» — ссылки на официальные документы\n` +
        `• «${BTN_RESET}» — то же, что /reset`,
      { parse_mode: 'Markdown', ...mainKb() },
    );
  });

  bot.command('reset', replyReset);
  bot.hears([BTN_RESET], replyReset);

  bot.command('menu', async (ctx) => {
    await ctx.reply('Меню:', mainKb());
  });

  bot.hears([BTN_DOCS], replyDocs);

  for (const [btn, prompt] of Object.entries(TOPIC_PROMPTS)) {
    bot.hears([btn], async (ctx) => {
      await replyViaGigaChat(ctx, prompt);
    });
  }

  /** @param {string} full */
  function slashAiGptPayload(full) {
    const m = full.match(/^\/(?:ai|gpt)(?:@\S+)?(.*)$/is);
    return (m?.[1] ?? '').trim();
  }

  /** @param {string} full */
  function slashAskPayload(full) {
    const m = full.match(/^\/ask(?:@\S+)?(.*)$/is);
    return (m?.[1] ?? '').trim();
  }

  bot.command(['ai', 'gpt'], async (ctx) => {
    const payload = slashAiGptPayload(ctx.message?.text ?? '');
    if (!payload) {
      await ctx.reply(
        'Например: `/ai Как вернуть товар на ОЗОН?`\nили отправьте вопрос **обычным текстом**.',
        { parse_mode: 'Markdown', ...mainKb() },
      );
      return;
    }
    await replyViaGigaChat(ctx, payload);
  });

  bot.command('ask', async (ctx) => {
    const payload = slashAskPayload(ctx.message?.text ?? '');
    if (!payload) {
      await ctx.reply(
        'Например: `/ask Что нужно для старта продаж на ОЗОН?`',
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

    if (text.trim().length > 0) {
      await replyViaGigaChat(ctx, text.trim());
    }
  });

  bot.catch((err, ctx) => {
    console.error('[bot]', err);
    ctx?.reply?.('Временная ошибка. Попробуйте /start или /reset.').catch(
      () => {},
    );
  });

  return bot;
}
