#!/bin/sh
set -e
# Два одновременных bind (0.0.0.0 + [::]) на одном порту дают EADDRINUSE в окружении Timeweb.
# Платформа в инструкциях явно ожидает 0.0.0.0:8080; healthcheck с localhost должен попадать на 127.0.0.1.
PORT="${PORT:-8080}"
echo "challenge100days entrypoint: PORT=${PORT}"
exec gunicorn app.main:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 1 \
  --timeout 120 \
  --bind "0.0.0.0:${PORT}"
