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
import { RAG_NO_KNOWLEDGE } from './ragService.js';
import { telegrafProxyOptionsFromEnv } from './telegramProxyOpts.js';

/** @typedef {import('./gigachatClient.js').GigachatClient} GigachatClient */
/** @typedef {ReturnType<import('./ragService.js').createRagService>} RagService */

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
  '⚠️ Я **не** поддержка компании Ozon. Ответы по вопросам ОЗОН опираются на **загруженные документы** (RAG), а не на «догадки» модели.\n\n' +
  'Могу подсказать по темам:\n' +
  '• покупка на ОЗОН\n' +
  '• возврат товара\n' +
  '• продажа на маркетплейсе\n' +
  '• правила из документов\n\n' +
  '**Напишите вопрос** или нажмите кнопку ниже.\n' +
  '• `/reset` — начать диалог заново\n' +
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
    '\n\nЗадайте конкретный вопрос текстом — поищу ответ в загруженной базе документов.'
  );
}

/**
 * @param {string} token
 * @param {GigachatClient | null} [gigachat]
 * @param {RagService | null} [rag]
 */
export function createBot(token, gigachat = null, rag = null) {
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

      /** @type {string | null} */
      let ragContext = null;

      if (rag) {
        const { context } = await rag.retrieve(payload);
        if (!context) {
          await ctx.reply(RAG_NO_KNOWLEDGE, mainKb());
          return;
        }
        ragContext = context;
      }

      const reply = clipTelegramMessage(
        await gigachat.completeUserTurn(payload, history, { ragContext }),
      );
      appendTurn(chatId, payload, reply);
      await ctx.reply(reply, mainKb());
    } catch (err) {
      const detail =
        err instanceof Error ? err.stack ?? err.message : String(err);
      console.error('[gigachat/rag] запрос провалился:', detail);
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
        'Ответы по ОЗОН строятся на **RAG**: поиск по документам + GigaChat.\n\n' +
        'Команды:\n' +
        '• `/start` — приветствие\n' +
        '• `/reset` — очистить историю\n' +
        '• `/help` — эта подсказка\n' +
        '• `/ai`, `/gpt`, `/ask` + текст — вопрос\n\n' +
        'Или **напишите вопрос** про ОЗОН обычным сообщением.',
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
        'Например: `/ai Как вернуть товар на ОЗОН?`',
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
