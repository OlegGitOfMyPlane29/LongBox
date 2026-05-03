#!/bin/sh
set -e
# Timeweb может передать PORT; healthcheck ожидает тот же порт, что слушает процесс.
# Один процесс uvicorn (без нескольких worker’ов на один порт).
PORT="${PORT:-8080}"
echo "challenge100days entrypoint: PORT=${PORT}"
# Timeweb healthcheck бьёт в localhost (см. docs); на Linux это часто ::1.
# Слушаем :: — на типичном Linux dual-stack этим же сокетом принимается и IPv4.
exec uvicorn app.main:app --host "${UVICORN_HOST:-::}" --port "${PORT}"
