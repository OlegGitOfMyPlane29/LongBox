-- Схема для Telebotik: подписчики ежедневного уведомления о курсе BTC (Binance Spot).
-- Прежние таблицы салона удаляются, если они остались от старых версий.

DROP TABLE IF EXISTS master_services CASCADE;
DROP TABLE IF EXISTS masters CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS salon CASCADE;

CREATE TABLE IF NOT EXISTS btc_daily_subscribers (
  chat_id BIGINT NOT NULL PRIMARY KEY,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_btc_daily_subscribers_subscribed_at
  ON btc_daily_subscribers (subscribed_at);
