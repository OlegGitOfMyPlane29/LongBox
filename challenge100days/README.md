# challenge100days

Минималистичное full-stack приложение для 100-дневных испытаний с пиксельной эстетикой в стиле Minecraft/Unturned.

## Структура проекта

```text
challenge100days/
├─ backend/
│  ├─ app/
│  │  ├─ routers/
│  │  ├─ auth.py
│  │  ├─ config.py
│  │  ├─ crud.py
│  │  ├─ database.py
│  │  ├─ deps.py
│  │  ├─ main.py
│  │  ├─ models.py
│  │  └─ schemas.py
│  └─ requirements.txt
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ context/
│  │  ├─ pages/
│  │  ├─ services/
│  │  ├─ App.jsx
│  │  ├─ index.css
│  │  └─ main.jsx
│  └─ ...
├─ .env.example
├─ run.bat
└─ README.md
```

## Функциональность

- JWT-аутентификация (email + пароль), роли `user` и `admin`.
- Пользователь создает испытание, указывает до 3 привычек и отмечает ежедневный результат.
- При 100 успехах подряд: `Золотой кубок`.
- При любом провале: `Медный кубок`.
- Комментарии к дню и итоговый комментарий (до 300 символов).
- Общая лента испытаний всех участников.
- UI полностью на русском языке.

## Быстрый старт (Windows 10)

1. Скопируйте `.env.example` в `.env` и заполните значения.
2. Убедитесь, что PostgreSQL запущен и база `challenge100days` создана.
3. В корне проекта запустите:

```bat
run.bat
```

Скрипт создаст `.venv`, установит backend-зависимости, применит миграции Alembic, запустит backend и frontend в отдельных окнах и откроет браузер.

### Запуск через ярлык `zapusk` (Node.js)

Используйте:

```bat
zapusk.bat
```

Что делает `zapusk`:
- проверяет наличие Node.js, npm и Python;
- подготавливает `.venv`, устанавливает зависимости backend/frontend;
- применяет миграции Alembic;
- запускает backend и frontend в отдельных окнах;
- открывает браузер на `http://localhost:5173`.

Запуск сервисов выполняется на `0.0.0.0`, а открытие идет через `localhost` — это стабильно и с VPN, и без VPN.
Если PostgreSQL недоступен, `zapusk` автоматически переключается на локальную SQLite базу `backend/challenge100days.db`, чтобы проект все равно стартовал для проверки.

### Запуск без окна-обертки (`zapusk.vbs`)

Если нужен максимально "тихий" старт, используйте:

```text
zapusk.vbs
```

Этот файл работает как удобный двойной клик-ярлык и открывает консоль запуска `zapusk.bat`, чтобы был виден прогресс и возможные ошибки.

Проверка окружения через VBS:

```text
zapusk.vbs check
```

## Ручной запуск

### Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Миграции базы данных

```bash
cd backend
alembic upgrade head
```

## Создание администратора (seed)

```bash
cd backend
python seed_admin.py
```

По умолчанию используются значения `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME` из `.env`.

## Тесты backend

```bash
cd backend
pytest
```
