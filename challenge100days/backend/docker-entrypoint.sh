#!/bin/sh
set -e
# Timeweb может передать PORT; healthcheck ожидает тот же порт, что слушает процесс.
PORT="${PORT:-8080}"
echo "challenge100days entrypoint: PORT=${PORT}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
