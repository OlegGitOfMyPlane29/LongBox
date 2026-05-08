# HTTPS для days100.ru (Timeweb VPS + Docker)

Предполагается: проект уже поднят по `deploy/README.md`, IP **186.246.5.232**, домен куплен у Timeweb.

## 1. DNS в панели Timeweb (или у регистратора DNS)

Для домена **days100.ru**:

- Запись типа **A** для **`@`** (корень) → **186.246.5.232**
- Запись типа **A** для **`www`** → **186.246.5.232**

Сохраните и подождите распространения DNS (часто 5–30 минут, иногда до нескольких часов).

Проверка с вашего ПК (PowerShell или онлайн-чекер DNS):

```bash
nslookup days100.ru
nslookup www.days100.ru
```

В ответе должен быть **186.246.5.232**.

## 2. Обновить код и переменные на сервере

По SSH:

```bash
cd /root/LongBox/challenge100days
git pull
```

В **`.env`** задайте (одной строкой или двумя через запятую без пробелов):

```bash
CORS_ORIGINS=https://days100.ru,https://www.days100.ru
```

Применить к API:

```bash
docker compose up -d api
```

Перезапуск nginx с новым конфигом (том для `default.conf` и certbot):

```bash
docker compose up -d --build nginx
```

Убедитесь, что каталог для ACME существует:

```bash
mkdir -p certbot/www
```

Проверка в браузере: сайт должен открываться по **http://days100.ru** (ещё без замочка).

## 3. Установить certbot на хост (не в контейнер)

На VPS (Ubuntu):

```bash
apt-get update
apt-get install -y certbot
```

## 4. Выпустить сертификат Let’s Encrypt (webroot)

Пока nginx обслуживает `/.well-known/acme-challenge/` из `./certbot/www` (см. `deploy/nginx/default.conf` на сервере):

```bash
cd /root/LongBox/challenge100days
certbot certonly --webroot \
  -w /root/LongBox/challenge100days/certbot/www \
  -d days100.ru -d www.days100.ru \
  --email YOUR_EMAIL@example.com \
  --agree-tos --no-eff-email
```

Подставьте рабочий email. Должно появиться **Congratulations** и файлы в  
`/etc/letsencrypt/live/days100.ru/`.

## 5. Включить HTTPS в Docker

Файл **`deploy/nginx/ssl.conf`** уже есть в репозитории. Подключите тома:

```bash
cd /root/LongBox/challenge100days
docker compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

Проверка:

```bash
curl -sS https://days100.ru/api/health
curl -sS https://www.days100.ru/api/health
```

## 6. Редирект HTTP → HTTPS (кроме ACME для продления)

Чтобы по **http://** открывался только challenge, остальное уходило на **https://**:

```bash
cd /root/LongBox/challenge100days
cp deploy/nginx/default.redirect80.conf deploy/nginx/default.conf
docker compose restart nginx
```

Сайт: **https://days100.ru** (и при необходимости **https://www.days100.ru**).

## 7. Файрвол (если включён ufw)

```bash
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

В панели Timeweb убедитесь, что порты **80** и **443** не закрыты правилами облака.

## Продление сертификата

Certbot ставит **таймер systemd** `certbot.timer` — продление обычно автоматическое. После продления перезапуск nginx обычно не нужен: файлы в `/etc/letsencrypt` обновляются, nginx подхватывает при **reload**.

Проверка таймера: `systemctl status certbot.timer`

## Если что-то пошло не так

- **Ошибка при выпуске сертификата** — смотрите лог certbot; чаще всего DNS ещё не указывает на VPS или порт **80** снаружи недоступен.
- **nginx не стартует после подключения ssl** — проверьте пути `ls /etc/letsencrypt/live/days100.ru/` и `docker compose logs nginx`.
- **CORS в браузере** — значение `CORS_ORIGINS` в `.env` должно **точно** совпадать с тем URL, с которого открываете (включая `https://` и наличие/отсутствие `www`).
