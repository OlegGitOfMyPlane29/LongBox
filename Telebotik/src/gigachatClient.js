import crypto from 'crypto';
import https from 'https';

const DEFAULT_AUTH_URL =
  'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
const DEFAULT_API_BASE =
  'https://gigachat.devices.sberbank.ru/api/v1';

/**
 * Системный промпт задаёт допустимую роль модели для учебного бота Telebotik.
 * В отчёте: модель ограничена доменом помощи вокруг крипторынка без «инвест‑совета» как обязательства.
 */
export const TELEBOTIK_SYSTEM_PROMPT = [
  'Ты — текстовый помощник Telegram‑бота Telebotik.',
  'Тебе можно кратко и по делу объяснять темы пользователя простым языком.',
  '',
  'Ограничения (обязательно):',
  '- Не выдавай ответ как персональный финансовый совет и не утверждай, что «нужно» покупать/продавать активы.',
  '- Не проси пароли, токены ботов, API‑ключи, приватные ключи кошельков и другие секреты.',
  '- Если точных данных не знаешь, так и скажи; можно предложить уточнить вопрос.',
  '- Держи ответ разумной длины: по умолчанию до нескольких абзацев, если пользователь явно не просит очень развёрнуто.',
].join('\n');

/**
 * По умолчанию `GigaChat` (Lite‑линейка на Freemium в доке developers.sber.ru):
 * на тарифе Free выделено больше лимита токенов для Lite‑моделей, чем для Pro/Max,
 * чего достаточно для редких запросов в учебном боте; Pro/Max уходят в меньшие квоты.
 *
 * При необходимости переопределить: GIGACHAT_MODEL в .env
 */
export const DEFAULT_GIGACHAT_MODEL_FALLBACK = 'GigaChat';

/** @typedef {import('node:https').RequestOptions} HttpsReqOptions */

/**
 * HTTPS JSON с опциональной отключённой проверкой цепочки (только если в .env включено явно —
 * см. доку про сертификат НУЦ Минцифры на developers.sber.ru).
 *
 * @param {string} method
 * @param {string} urlStr
 * @param {Record<string, string>} hdrs
 * @param {string | undefined} body
 * @param {boolean} tlsInsecure
 * @returns {Promise<{ status: number, raw: string, json?: unknown }>}
 */
async function httpsJson(method, urlStr, hdrs, body, tlsInsecure) {
  const u = new URL(urlStr);
  const hostname = u.hostname;
  const port = u.port || 443;
  const pathAndQuery = `${u.pathname}${u.search}`;
  /** @type {HttpsReqOptions} */
  const reqOpts = {
    hostname,
    port,
    path: pathAndQuery,
    method,
    headers: hdrs,
    rejectUnauthorized: !tlsInsecure,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(reqOpts, (res) => {
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        raw += chunk;
      });
      res.on('end', () => {
        /** @type {unknown} */
        let json;
        try {
          json = raw ? JSON.parse(raw) : undefined;
        } catch {
          json = undefined;
        }
        resolve({ status: res.statusCode ?? 0, raw, json });
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

/**
 * Извлекает текст ответа ассистента из JSON completions (ориентируемся на официальный REST GigaChat / OpenAI‑подобную схему).
 *
 * @param {unknown} obj
 */
function extractAssistantText(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const root = /** @type {Record<string, unknown>} */ (obj);
  const choices = root.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;
  const first = /** @type {Record<string, unknown>} */ (choices[0]);
  const msg = first.message;
  if (!msg || typeof msg !== 'object') return null;
  const content = /** @type {Record<string, unknown>} */ (msg).content;
  return typeof content === 'string' && content.trim() ? content.trim() : null;
}

/**
 * @typedef {object} GigachatClientOptions
 * @property {string} authorizationKey Basic Authorization key из кабинета (base64 строка «Client ID:Secret» — НЕ включать префикс Basic).
 * @property {string} [scope]
 * @property {string} [oauthUrl]
 * @property {string} [apiBase]
 * @property {string} [model]
 * @property {boolean} [tlsInsecure]
 */

export class GigachatClient {
  /**
   * @param {GigachatClientOptions} opts
   */
  constructor(opts) {
    const { authorizationKey, scope, oauthUrl, apiBase, model, tlsInsecure } =
      opts;
    /** @private */
    this._authorizationKey = authorizationKey;
    /** @private */
    this._scope = scope ?? 'GIGACHAT_API_PERS';
    /** @private */
    this._oauthUrl = oauthUrl ?? DEFAULT_AUTH_URL;
    /** @private */
    this._apiBase = (apiBase ?? DEFAULT_API_BASE).replace(/\/+$/, '');
    /** @private */
    this._model = model ?? DEFAULT_GIGACHAT_MODEL_FALLBACK;
    /** @private */
    this._tlsInsecure = Boolean(tlsInsecure);

    /** @private @type {{ token: string, expiresAtMs: number } | null} */
    this._tokenCache = null;
  }

  /**
   * @private
   */
  _authorizationHeaderBasic() {
    const key = this._authorizationKey.trim();
    if (key.startsWith('Basic ')) return key;
    return `Basic ${key}`;
  }

  /**
   * Получает (или переиспользует) Bearer access_token.
   * @private
   */
  async _refreshAccessToken() {
    const now = Date.now();
    if (
      this._tokenCache &&
      now < this._tokenCache.expiresAtMs - 15_000
    ) {
      return this._tokenCache.token;
    }

    const body = `scope=${encodeURIComponent(this._scope)}`;
    const rqUid = crypto.randomUUID();
    const res = await httpsJson(
      'POST',
      this._oauthUrl,
      {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        RqUID: rqUid,
        Authorization: this._authorizationHeaderBasic(),
        'Content-Length': String(Buffer.byteLength(body)),
      },
      body,
      this._tlsInsecure,
    );

    if (res.status < 200 || res.status >= 300) {
      throw new Error(
        `[gigachat] OAuth ${res.status}: ${res.raw?.slice?.(0, 500) ?? ''}`,
      );
    }

    const data = /** @type {Record<string, unknown>} */ (res.json ?? {});
    const accessToken =
      typeof data.access_token === 'string' ? data.access_token.trim() : '';
    if (!accessToken) {
      throw new Error('[gigachat] OAuth: нет поля access_token в ответе');
    }

    let expiresMs = now + 25 * 60 * 1000;
    const expiresAt = typeof data.expires_at === 'number' ? data.expires_at : 0;
    const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 0;

    // Частый формат expires_at — миллисекунды; expires_in — секунды до истечения.
    if (expiresAt && expiresAt > 1e12) {
      expiresMs = expiresAt - 15_000;
    } else if (expiresAt && expiresAt > 1e9) {
      expiresMs = expiresAt * 1000 - 15_000;
    } else if (expiresIn > 0) {
      expiresMs = now + expiresIn * 1000 - 15_000;
    }

    this._tokenCache = {
      token: accessToken,
      expiresAtMs: expiresMs,
    };
    return accessToken;
  }

  /**
   * Один пользовательский вопрос + системный промпт (историю не храним в БД).
   *
   * @param {string} userMessage
   * @returns {Promise<string>}
   */
  async completeUserTurn(userMessage) {
    const text = userMessage.trim();
    if (!text) {
      throw new Error('[gigachat] Пустое сообщение');
    }

    const token = await this._refreshAccessToken();
    const url = `${this._apiBase}/chat/completions`;

    /** @type {Record<string, unknown>} */
    const payload = {
      model: this._model,
      messages: [
        { role: 'system', content: TELEBOTIK_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      stream: false,
    };

    const body = JSON.stringify(payload);

    const chatOnce = (access) =>
      httpsJson(
        'POST',
        url,
        {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access}`,
          'Content-Length': String(Buffer.byteLength(body)),
        },
        body,
        this._tlsInsecure,
      );

    let res = await chatOnce(token);
    if (res.status === 401) {
      this._tokenCache = null;
      const refreshed = await this._refreshAccessToken();
      res = await chatOnce(refreshed);
    }

    if (res.status < 200 || res.status >= 300) {
      throw new Error(
        `[gigachat] chat/completions ${res.status}: ${res.raw?.slice?.(0, 800) ?? ''}`,
      );
    }

    const out = extractAssistantText(res.json);
    if (!out) {
      throw new Error(
        `[gigachat] Непонятный JSON от модели (нет choices[].message.content)`,
      );
    }
    return out;
  }
}

/** @typedef {typeof process.env} NodeEnvLike */

/**
 * @param {NodeEnvLike} [env]
 * @returns {GigachatClient | null}
 */
export function createGigachatFromEnv(env = process.env) {
  const authorizationKey =
    typeof env?.GIGACHAT_AUTHORIZATION_KEY === 'string'
      ? env.GIGACHAT_AUTHORIZATION_KEY.trim()
      : '';
  if (!authorizationKey) return null;

  let tlsInsecure = false;

  /** @type {string | undefined} */
  const ts = env?.GIGACHAT_TLS_INSECURE;
  const t = typeof ts === 'string' ? ts.trim().toLowerCase() : '';
  if (t === '1' || t === 'true') tlsInsecure = true;

  /** Как у Python‑SDK gigachat: `GIGACHAT_VERIFY_SSL_CERTS=false` */
  const vr = env?.GIGACHAT_VERIFY_SSL_CERTS;
  const v = typeof vr === 'string' ? vr.trim().toLowerCase() : '';
  if (v === 'false' || v === '0') tlsInsecure = true;

  return new GigachatClient({
    authorizationKey,
    scope:
      typeof env?.GIGACHAT_SCOPE === 'string'
        ? env.GIGACHAT_SCOPE.trim()
        : undefined,
    oauthUrl:
      typeof env?.GIGACHAT_AUTH_URL === 'string'
        ? env.GIGACHAT_AUTH_URL.trim()
        : undefined,
    apiBase:
      typeof env?.GIGACHAT_API_BASE === 'string'
        ? env.GIGACHAT_API_BASE.trim()
        : undefined,
    model:
      typeof env?.GIGACHAT_MODEL === 'string' &&
      env.GIGACHAT_MODEL.trim().length > 0
        ? env.GIGACHAT_MODEL.trim()
        : DEFAULT_GIGACHAT_MODEL_FALLBACK,
    tlsInsecure,
  });
}

/** Максимум длины одного сообщения Telegram (берём запас ниже потолка) */
export const TG_REPLY_MAX_CHARS = 3800;

/**
 * @param {string} full
 */
export function clipTelegramMessage(full) {
  if (full.length <= TG_REPLY_MAX_CHARS) return full;
  return `${full.slice(0, TG_REPLY_MAX_CHARS)}\n…(сообщение обрезано — слишком длинное для Telegram)`;
}
