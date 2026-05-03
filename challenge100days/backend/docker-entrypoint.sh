#!/bin/sh
set -e
# Timeweb может передать PORT; healthcheck ожидает тот же порт, что слушает процесс.
# Один процесс uvicorn (--host 0.0.0.0): Hypercorn по умолчанию поднимал несколько
# worker'ов на те же порты → OSError: Address already in use.
PORT="${PORT:-8080}"
echo "challenge100days entrypoint: PORT=${PORT}"
exec uvicorn app.main:app --host "${UVICORN_HOST:-0.0.0.0}" --port "${PORT}"
