# Telebotik

Telegram-бот на **Node.js** + **Telegraf**: курс **BTC/USDT** (спот Binance), по запросу и **один раз в день** утром для подписчиков. Опционально — ответы **GigaChat** (Сбер): `/ai`, `/gpt`, `/ask` или **любое сообщение без `/`**, когда в `.env` задан ключ. Подписчики утренней рассылки хранятся в **PostgreSQL**.

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
| `/ai`, `/gpt`, `/ask` + текст или **обычный текст** без `/` | **GigaChat** (если в `.env` задан `GIGACHAT_AUTHORIZATION_KEY`; во время генерации отправляется «печатает…» по таймеру) |

Подробнее о ключе и ошибках HTTPS — см. **`.env.example`**. Документация GigaChat API: [developers.sber.ru](https://developers.sber.ru/docs/ru/gigachat/guides/main).

### GigaChat: что положить в `.env`

1. В проекте [разработчиков Сбера](https://developers.sber.ru/) создайте приложение и скопируйте **authorization key** (строку для заголовка `Authorization: Basic …`, часто уже в виде base64 без слова Basic).
2. В `.env` задайте `GIGACHAT_AUTHORIZATION_KEY=...`, при необходимости — `GIGACHAT_SCOPE=GIGACHAT_API_PERS` (или то, что пришло для вашего приложения).

Если Node.js жалуется на **сертификаты** при HTTPS к узлам `.sberbank.ru`, см. официальный раздел про НУЦ / корневой сертификат, либо **только для учебной отладки** включите один из переключателей из `.env.example` (`GIGACHAT_TLS_INSECURE` / `GIGACHAT_VERIFY_SSL_CERTS`). Для VPS с обновлённым доверенным хранилищем проблем может не быть.

**Тематика диалога с моделью:** ответы сужены до **Bitcoin и смежного** (крипта, блокчейн, базовые вещи о рынке). Явный оффтоп (еда, туризм, политика и т.д.) по возможности отфильтровывается до запроса к API (см. `preemptiveTelebotikAnswer` и `TELEBOTIK_SYSTEM_PROMPT` в **`src/gigachatClient.js`**).

## Структура

```
db/
  schema.sql     — таблица подписчиков (старые таблицы салона дропаются)
  seed.sql       — пусто
scripts/
  apply-schema.mjs
src/
  index.js            — вход, планировщики
  bot.js              — диалог (+ GigaChat, typing)
  gigachatClient.js   — OAuth access_token и POST /chat/completions
  binancePrice.js     — Binance REST
  telegramProxyOpts.js
  subscriberRepo.js   — PG: кто подписан
  dailyDigest.js      — cron + рассылка
.env.example
```
