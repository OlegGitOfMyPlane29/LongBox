/**
 * Подписчики ежедневного BTC-дайджеста (PostgreSQL).
 * @import { Pool } from 'pg'
 */

/** @param {import('pg').Pool} pool */
/** @param {number | string} chatId */
export async function subscribeDaily(pool, chatId) {
  await pool.query(
    `INSERT INTO btc_daily_subscribers (chat_id) VALUES ($1)
     ON CONFLICT (chat_id) DO NOTHING`,
    [chatId],
  );
}

/** @param {import('pg').Pool} pool */
/** @param {number | string} chatId */
export async function unsubscribeDaily(pool, chatId) {
  await pool.query(`DELETE FROM btc_daily_subscribers WHERE chat_id = $1`, [chatId]);
}

/** @param {import('pg').Pool} pool */
/** @returns {Promise<number[]>} */
export async function listDailySubscriberChatIds(pool) {
  const { rows } = await pool.query(
    `SELECT chat_id FROM btc_daily_subscribers ORDER BY chat_id`,
  );
  return rows.map((r) => Number(r.chat_id));
}

/** @param {import('pg').Pool} pool */
/** @param {number | string} chatId */
/** @returns {Promise<boolean>} */
export async function isDailySubscribed(pool, chatId) {
  const { rows } = await pool.query(
    `SELECT 1 FROM btc_daily_subscribers WHERE chat_id = $1 LIMIT 1`,
    [chatId],
  );
  return rows.length > 0;
}
