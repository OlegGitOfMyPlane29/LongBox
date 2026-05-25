# Telebotik

Telegram-бот **Telebotik** на **Node.js** + **Telegraf**: неофициальный **AI-ассистент по маркетплейсу ОЗОН** на базе **GigaChat** (Сбер).

Помогает в общих чертах с покупкой, возвратом, продажей и правилами площадки. **Не является** официальной поддержкой Ozon.

- **Прокси для Telegram** при VPN: `SOCKS_PROXY` / `TELEGRAM_PROXY` — см. **`.env.example`**.

## Требования

- **Node.js** 18+
- Токен бота и `GIGACHAT_AUTHORIZATION_KEY` в **`.env`**

## Запуск локально

```powershell
Copy-Item .env.example .env   # один раз, заполните BOT_TOKEN и GIGACHAT_*
npm install
npm start
```

## Команды в чате

| Команда / кнопка | Действие |
|------------------|----------|
| `/start` | Приветствие, дисклеймер и клавиатура |
| `/reset` или «🔄 Начать заново» | Очистить историю диалога |
| `/help` | Список команд |
| `/ai`, `/gpt`, `/ask` + текст или **обычный текст** без `/` | Ответ GigaChat (typing «печатает…») |
| «🛒 Как купить» / «↩️ Возврат» / «📦 Продажа» | Типовые вопросы |
| «📋 Документы ОЗОН» | Ссылки на docs.ozon.ru |

## Возможности AI

- системный промпт с ролью и контекстом ОЗОН;
- **guardrails** (оффтоп, prompt injection, осторожные формулировки);
- **fallback** при ошибке API;
- **история диалога** — последние 10 сообщений в памяти процесса;
- typing indicator во время генерации.

Официальные документы для углублённых вопросов:

- [Правила продажи и реквизиты](https://docs.ozon.ru/common/pravila-prodayoi-i-rekvizity/?country=RU)
- [Условия Ozon ID](https://docs.ozon.ru/legal/terms-of-use/site/ozon-id-terms/)
- [Персональные данные](https://docs.ozon.ru/legal/personal-data/)

## GigaChat: `.env`

1. Создайте приложение на [developers.sber.ru](https://developers.sber.ru/) и скопируйте **authorization key**.
2. Задайте `GIGACHAT_AUTHORIZATION_KEY=...`, при необходимости `GIGACHAT_SCOPE=GIGACHAT_API_PERS`.
3. На VPS при ошибках сертификата: `GIGACHAT_TLS_INSECURE=1` (см. `.env.example`).

## Структура

```
src/
  index.js            — вход
  bot.js              — диалог, кнопки, /start, /reset
  chatHistory.js      — история (10 сообщений)
  gigachatClient.js   — промпт, guardrails, GigaChat API
  telegramProxyOpts.js
.env.example
```

## Деплой на VPS (Timeweb)

```bash
cd /opt/LongBox/Telebotik
git pull
systemctl restart telebotik
journalctl -u telebotik -n 50 --no-pager
```

`npm install` — только если менялся `package.json`.
