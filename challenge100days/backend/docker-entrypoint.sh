#!/bin/sh
set -eu
# Один процесс uvicorn на PORT — без socat и без второго bind (нет гонки IPv4/IPv6).
# Timeweb: поле «Команда запуска» оставьте пустым, чтобы не дублировать этот ENTRYPOINT.
# Если проверка здоровья ходит только на ::1, задайте UVICORN_HOST=:: (Linux обычно dual-stack).
PORT="${PORT:-8080}"
HOST="${UVICORN_HOST:-0.0.0.0}"

echo "challenge100days: uvicorn app.main:app --host ${HOST} --port ${PORT}"
exec /usr/local/bin/python -m uvicorn app.main:app --host "${HOST}" --port "${PORT}"
