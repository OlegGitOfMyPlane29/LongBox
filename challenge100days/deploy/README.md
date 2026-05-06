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

## 4. HTTPS (рекомендуется для преподавателя)

1. Привяжите домен в DNS к IP VPS (A‑запись в панели Timeweb или у регистратора).
2. Обновите **CORS_ORIGINS** под `https://ваш-домен`, выполните `docker compose restart api`.
3. На сервере установите Certbot по инструкции Timeweb/пакет nginx certbot-plugin, выпустите сертификат для домена и подключите `ssl_certificate` к server `listen 443 ssl` или используйте готовый сниппет certbot в конфигурации nginx, затем `docker compose restart nginx`.

Подробности зависят от выбора (certbot standalone vs webroot); при необходимости временно остановите контейнер nginx на время выпуска сертификата (`docker compose stop nginx`).

## 5. Обновление после `git pull`

```bash
docker compose build
docker compose run --rm api alembic upgrade head
docker compose up -d
```

Если менялись только файлы фронта — достаточно `docker compose build nginx && docker compose up -d nginx`.
