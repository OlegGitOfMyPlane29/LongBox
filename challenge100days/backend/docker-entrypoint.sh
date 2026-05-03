#!/bin/sh
set -e
# Timeweb healthcheck по localhost может идти на 127.0.0.1 или ::1. Нужны оба bind.
# Hypercorn при --workers 1 всё равно порождал дочерний процесс → повторный bind → EADDRINUSE.
PORT="${PORT:-8080}"
echo "challenge100days entrypoint: PORT=${PORT}"
exec gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 1 \
  --timeout 120 \
  --bind "0.0.0.0:${PORT}" \
  --bind "[::]:${PORT}"
