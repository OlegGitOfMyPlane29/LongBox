# Telebotik

Telegram-бот **Telebotik** — неофициальный **AI-ассистент по маркетплейсу ОЗОН** с **RAG** (Retrieval Augmented Generation):

- документы в `docs/` → индексация → **PostgreSQL + pgvector**;
- на каждый вопрос — **поиск фрагментов** + ответ **GigaChat** строго по найденному тексту;
- **fallback**, если в документах нет подходящих фрагментов;
- **логи** найденных фрагментов в консоль (`[rag] hit …`).

## Требования

- **Node.js** 18+
- **PostgreSQL** с расширением **pgvector**
- `BOT_TOKEN`, `DATABASE_URL`, `GIGACHAT_AUTHORIZATION_KEY` в `.env`

Документы для базы знаний: `docs/BazovayaInfa.docx` (и другие `.docx`/`.txt`/`.md` в `docs/`).

## Локальный запуск

```powershell
Copy-Item .env.example .env
npm install
npm run db:apply
npm run rag:index
npm start
```

## RAG: как это устроено

| Шаг | Команда / код |
|-----|----------------|
| Схема БД | `npm run db:apply` → `db/schema.sql` |
| Индексация | `npm run rag:index` → читает `docs/`, embeddings GigaChat, пишет в `rag_chunks` |
| Ответ бота | `ragService.retrieve()` → GigaChat с контекстом фрагментов |

Embeddings: [документация GigaChat](https://developers.sber.ru/docs/ru/gigachat/guides/embeddings) — тот же `GIGACHAT_AUTHORIZATION_KEY`, endpoint `POST /embeddings`.

## Команды в Telegram

| Команда | Действие |
|---------|----------|
| `/start` | Приветствие |
| `/reset` | Очистить историю диалога |
| `/help` | Справка |
| Текст / кнопки ОЗОН | RAG + GigaChat |

## Тестирование

См. **`tests/rag-test-questions.md`** — таблица из 12 вопросов с ожидаемым поведением.

## pgvector на VPS (Timeweb, Ubuntu)

Один раз в консоли сервера (версия PostgreSQL может отличаться):

```bash
apt update
apt install -y postgresql-16-pgvector
```

В psql под суперпользователем (или через `sudo -u postgres psql`):

```sql
\c telebotik
CREATE EXTENSION IF NOT EXISTS vector;
```

Затем в папке проекта:

```bash
npm run db:apply
npm run rag:index
systemctl restart telebotik
```

## Деплой (Timeweb)

```bash
cd /opt/LongBox/Telebotik
git pull
npm install --omit=dev
npm run db:apply
npm run rag:index
systemctl restart telebotik
journalctl -u telebotik -n 80 --no-pager
```

Убедитесь, что в `/opt/LongBox/Telebotik/.env` есть `DATABASE_URL` и `GIGACHAT_AUTHORIZATION_KEY`.

## Структура

```
docs/
  BazovayaInfa.docx
db/
  schema.sql
scripts/
  apply-schema.mjs
  rag-index.mjs
src/
  index.js
  bot.js
  gigachatClient.js   — чат + embeddings
  ragService.js
  ragStore.js
  docExtract.js
  chunkText.js
  chatHistory.js
tests/
  rag-test-questions.md
```
