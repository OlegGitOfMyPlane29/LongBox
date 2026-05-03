#!/bin/sh
set -e
# Timeweb healthcheck идёт на localhost; в контейнере запрос может пойти на 127.0.0.1 или ::1.
# Один процесс uvicorn слушает только один --host. Hypercorn с двумя --bind и ровно одним worker
# принимает оба варианта без EADDRINUSE (как было при workers>1 по умолчанию).
PORT="${PORT:-8080}"
echo "challenge100days entrypoint: PORT=${PORT}"
exec hypercorn app.main:app \
  --workers 1 \
  --bind "0.0.0.0:${PORT}" \
  --bind "[::]:${PORT}"
