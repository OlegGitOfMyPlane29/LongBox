#!/bin/sh
set -e
# Timeweb может передать PORT; healthcheck ожидает тот же порт, что слушает процесс.
PORT="${PORT:-8080}"
echo "challenge100days entrypoint: PORT=${PORT}"
# Timeweb: часть проб зовёт 127.0.0.1 (IPv4), часть — ::1 (IPv6). uvicorn — один --host.
# Hypercorn позволяет два bind на одном порту.
exec hypercorn app.main:app --bind "0.0.0.0:${PORT}" --bind "[::]:${PORT}"
