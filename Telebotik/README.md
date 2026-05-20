# Telebotik

Telegram-бот на **Node.js** + **Telegraf**: курс **BTC/USDT** (спот Binance), по запросу и **один раз в день** утром для подписчиков. Подписчики хранятся в **PostgreSQL**.

- **Прокси для Telegram** при VPN: `SOCKS_PROXY` / `TELEGRAM_PROXY` / см. **`.env.example`**.
- Ежедневное время задаётся **`BTC_DIGEST_CRON`** и при необходимости **`BTC_DIGEST_TZ`** (например `Europe/Moscow`).

## Требования

- **Node.js** 18+
- **PostgreSQL**
- Токен бота и `DATABASE_URL` в **`.env`**

## Запуск локально

```powershell
Copy-Item .env.example .env   # один раз
npm install
npm run db:apply                # создаёт таблицу btc_daily_subscribers и убирает старые таблицы «салона», если были
npm start
```

При смене переменных расписания достаточно перезапустить процесс (**Ctrl+C**, снова **`npm start`**).

### Расписание «утром»

По умолчанию: **каждый день в 09:00** (часовой пояс см. ниже).

| Переменная | Пример | Смысл |
|------------|--------|--------|
| `BTC_DIGEST_CRON` | `0 9 * * *` | Cron-выражение (минута час день месяц день_недели) |
| `BTC_DIGEST_TZ` | `Europe/Moscow` | IANA таймзона (`node-cron`); пусто — как у ОС процесса |

Проверка «что рассылка вообще живёт» без ожидания 9:00:

```env
BTC_DIGEST_TICK_MINUTES=5
```

(отправка **всем подписчикам** каждые 5 минут; отключите переменную после теста.)

Разовая отправка сразу после старта процесса:

```env
BTC_DIGEST_SMOKE_ON_START=1
```

### Команды в чате

| Команда / кнопка | Действие |
|------------------|----------|
| `/start` | Описание и клавиатура |
| `/help` | Подсказка |
| `/btc` или «₿ Курс сейчас» | Текущая цена BTC/USDT |
| `/subscribe` или «🔔 …вкл.» | Записаться на утреннее сообщение |
| `/unsubscribe` или «🔕 …выкл.» | Отключить утро |

## Структура

```
db/
  schema.sql     — таблица подписчиков (старые таблицы салона дропаются)
  seed.sql       — пусто
scripts/
  apply-schema.mjs
src/
  index.js            — вход, планировщики
  bot.js              — диалог
  binancePrice.js     — Binance REST
  telegramProxyOpts.js
  subscriberRepo.js   — PG: кто подписан
  dailyDigest.js      — cron + рассылка
.env.example
```
