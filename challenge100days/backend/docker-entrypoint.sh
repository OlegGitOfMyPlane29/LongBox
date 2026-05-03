#!/bin/sh
set -eu
# Один процесс uvicorn на PORT — без socat и без второго bind (нет гонки IPv4/IPv6).
# Timeweb: поле «Команда запуска» оставьте ПУСТЫМ (см. README). Иначе второй процесс займёт 8080 → EADDRINUSE.
# По умолчанию :: — на Linux контейнер часто dual-stack, тогда проходят и 127.0.0.1, и ::1 (типичный healthcheck PaaS).
# Нужен только IPv4 — задайте UVICORN_HOST=0.0.0.0 в переменных окружения.
PORT="${PORT:-8080}"
HOST="${UVICORN_HOST:-::}"

echo "challenge100days: uvicorn app.main:app --host ${HOST} --port ${PORT}"
exec /usr/local/bin/python -m uvicorn app.main:app --host "${HOST}" --port "${PORT}"
