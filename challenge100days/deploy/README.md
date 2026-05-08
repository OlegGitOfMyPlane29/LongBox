# Деплой на VPS (Timeweb, вариант A)

Корень стека — каталог `challenge100days/`. На сервере должны быть **Docker** и **Docker Compose v2**.

## 1. VPS

- Создайте виртуальную машину в панели Timeweb, подключитесь по **SSH**.
- Установите Docker (если ещё нет), добавьте пользователя в группу `docker` при необходимости.

## 2. Код и переменные

```bash
git clone https://github.com/OlegGitOfMyPlane29/LongBox.git
cd LongBox/challenge100days
cp .env.production.example .env
nano .env   # SECRET_KEY, DB_PASSWORD, CORS_ORIGINS, ADMIN_*
```

- **CORS_ORIGINS** — полный адрес страницы в браузере (например `https://поддомен.домен` или `http://IP:порт`).
- **VITE_API_URL** оставьте `/api`, если используете стандартный `deploy/nginx/default.conf`.

Пересоберите только фронт, если поменяли `VITE_API_URL`:

```bash
docker compose build nginx --no-cache
```

## 3. Запуск

```bash
docker compose build
docker compose up -d postgres
docker compose run --rm api alembic upgrade head
docker compose run --rm api python seed_admin.py
docker compose up -d
```

Сначала только Postgres, затем миграции и seed во временном контейнере `api`, чтобы приложение не стартовало с пустой схемой БД.

Откройте в браузере `http://IP_сервера` (или свой порт, если задали `HTTP_PUBLISH_PORT`). Порт **8080 приложения не открывайте наружу** — снаружи только nginx (`80` / `443`).

## 4. HTTPS (домен и замочек в браузере)

Пошагово для **Let’s Encrypt + nginx в Docker**: **[TIMEWEB-HTTPS.md](TIMEWEB-HTTPS.md)** (DNS, certbot, `docker-compose.ssl.yml`, редирект на HTTPS).

Кратко: A‑запись домена на IP VPS → в `.env` задать **`CORS_ORIGINS=https://ваш-домен`** → выпустить сертификат → подключить том **`/etc/letsencrypt`** и файл **`deploy/nginx/ssl.conf`**.

## 5. Обновление после `git pull`

```bash
docker compose build
docker compose run --rm api alembic upgrade head
docker compose up -d
```

Если менялись только файлы фронта — достаточно `docker compose build nginx && docker compose up -d nginx`.
