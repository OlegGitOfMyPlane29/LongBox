#!/bin/sh
set -e
# Timeweb может передать PORT; healthcheck ожидает тот же порт, что слушает процесс.
PORT="${PORT:-8080}"
echo "challenge100days entrypoint: PORT=${PORT}"
# [::] внутри контейнера принимает и IPv6, и (на типичном Linux) IPv4;
# некоторые PaaS шлют healthcheck на localhost → ::1, при только 0.0.0.0 проверка падает.
exec uvicorn app.main:app --host "${UVICORN_HOST:-::}" --port "${PORT}"
