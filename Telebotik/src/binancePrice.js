/**
 * Спот BTC/USDT через публичный REST Binance (без API-ключа).
 * @see https://developers.binance.com/docs/binance-spot-api-docs/rest-api/market-data-endpoints
 */

/** @typedef {{ priceUsd: number, symbol: string }} BtcUsdSpotTicker */

/** @param {number} value */
export function formatUsd(value) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Базовый URL без финального `/`. Можно переопределить (региональный хост Binance и т.д.).
 */
export function binanceSpotBaseUrl() {
  const raw = process.env.BINANCE_REST_BASE?.trim();
  const base = (raw || 'https://api.binance.com').replace(/\/$/, '');
  return base;
}

/**
 * @returns {Promise<BtcUsdSpotTicker>}
 */
export async function fetchBtcUsdtSpotPrice() {
  const base = binanceSpotBaseUrl();
  const url = `${base}/api/v3/ticker/price?symbol=BTCUSDT`;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), 12_000);

  let res;
  try {
    res = await fetch(url, {
      method: 'GET',
      signal: ac.signal,
      headers: { Accept: 'application/json' },
    });
  } finally {
    clearTimeout(t);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Binance HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ''}`);
  }

  /** @type {{ symbol?: string; price?: string }} */
  const data = await res.json();
  if (data?.symbol !== 'BTCUSDT' || typeof data?.price !== 'string') {
    throw new Error('Неожиданный ответ Binance.');
  }

  const priceUsd = Number(data.price);
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error('Некорректная цена в ответе.');
  }

  return { symbol: data.symbol, priceUsd };
}

/**
 * Короткая строка для ответа в Telegram (без падения при сетевых ошибках).
 *
 * @returns {Promise<{ ok: true, text: string } | { ok: false, text: string }>}
 */
export async function buildBtcPriceMessageLines() {
  try {
    const { priceUsd, symbol } = await fetchBtcUsdtSpotPrice();
    return {
      ok: true,
      text:
        `Спот Binance (${symbol})\n\n` +
        `≈ ${formatUsd(priceUsd)} USD\n\n` +
        `Источник: Binance Spot API.`,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn('[binance]', reason);
    return {
      ok: false,
      text:
        `Сейчас не удалось получить курс с Binance (${reason}).\n` +
        'Попробуйте позже или проверьте BINANCE_REST_BASE в .env.',
    };
  }
}
