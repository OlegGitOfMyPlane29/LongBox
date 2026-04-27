# challenge20days

Full-stack приложение для 20-дневных челленджей: до трёх привычек на испытание, ежедневные отметки и комментарии, общая лента, пиксельный минималистичный UI на русском.

## Стек

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, JWT, bcrypt, slowapi. БД: PostgreSQL или SQLite.
- **Frontend:** React (Vite), react-router, Tailwind CSS, react-hook-form, zod.
- **E2E:** Playwright.

## Быстрый старт (Windows)

1. Скопируйте `.env.example` в `.env` и при необходимости отредактируйте.
2. Запустите **`zapusk.bat`** в корне проекта: поднимется venv, установятся зависимости, применятся миграции, стартуют API и Vite, откроется браузер на http://localhost:5173.

Либо **`run.bat`** — то же без автоматического открытия браузера (при необходимости используйте вручную).

## Ручной запуск

```text
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

В другом терминале:

```text
cd frontend
npm install
npm run dev
```

## Переменные окружения

См. `.env.example`. Для фронта важен `VITE_API_URL` (URL API). Для CORS задайте `CORS_ORIGINS` явным списком через запятую.

## E2E

```text
cd frontend
npx playwright install
npm run test:e2e
```

Убедитесь, что API доступен по адресу из `VITE_API_URL` (по умолчанию порт 8000).

## Правила челленджа

- 20 дней подряд с отметкой «успех» дают **золотой кубок** (при успехе на 20-й день нужен итоговый комментарий).
- Любой провал в любом дне даёт **медный кубок** и завершение испытания.
