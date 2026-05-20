/**
 * Локальный HTTP(S) CONNECT или SOCKS‑прокси (Clash, v2rayN и др.) —
 * чтобы Node обращался к Telegram Bot API там, где до api.telegram.org иначе есть таймаут.
 */

import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

/** @param {string} proxyUrl */
function redactProxyLog(proxyUrl) {
  try {
    const u = new URL(proxyUrl);
    const host = u.port ? `${u.hostname}:${u.port}` : u.hostname;
    return `${u.protocol}//${host}`;
  } catch {
    return '(некорректный proxy URL)';
  }
}

/**
 * @returns {import('telegraf').TelegrafOptions}
 */
export function telegrafProxyOptionsFromEnv() {
  const proxyUrl =
    process.env.TELEGRAM_PROXY?.trim() ||
    process.env.SOCKS_PROXY?.trim() ||
    process.env.HTTPS_PROXY?.trim() ||
    process.env.HTTP_PROXY?.trim() ||
    process.env.ALL_PROXY?.trim();

  if (!proxyUrl) return {};

  let agent;
  try {
    const isSocks = /^socks\d*:\/\//i.test(proxyUrl);
    agent = isSocks ? new SocksProxyAgent(proxyUrl) : new HttpsProxyAgent(proxyUrl);
    const mode = isSocks ? 'SOCKS' : 'HTTP CONNECT';
    console.info(`[telegram] ${mode} через ${redactProxyLog(proxyUrl)}`);
  } catch (err) {
    console.warn('[telegram] не удалось создать proxy agent:', err?.message ?? err);
    return {};
  }

  return {
    telegram: {
      agent,
    },
  };
}
