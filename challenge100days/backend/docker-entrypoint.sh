#!/bin/sh
set -e
# Timeweb healthcheck по localhost часто попадает на ::1 при bind только на 0.0.0.0 — проверка не проходит ~180 с.
# Один bind на [::]: в типичном Linux dual-stack принимает и IPv4, и IPv6. Два bind (IPv4 + IPv6 wildcard) здесь дают EADDRINUSE.
# Смена режима без правки образа: BIND_HOST=0.0.0.0 или BIND_HOST=:: (по умолчанию).
PORT="${PORT:-8080}"
BIND_HOST="${BIND_HOST:-::}"
echo "challenge100days entrypoint: PORT=${PORT} BIND_HOST=${BIND_HOST}"
if [ "$BIND_HOST" = "0.0.0.0" ]; then
  exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 1 \
    --timeout 120 \
    --bind "0.0.0.0:${PORT}"
else
  exec gunicorn app.main:app \
    --worker-class uvicorn.workers.UvicornWorker \
    --workers 1 \
    --timeout 120 \
    --bind "[${BIND_HOST}]:${PORT}"
fi
