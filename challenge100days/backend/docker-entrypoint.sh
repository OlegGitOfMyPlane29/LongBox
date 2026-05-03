#!/bin/sh
set -eu
# Timeweb healthcheck часто бьёт в 127.0.0.1 или ::1. Один socat с v6only=0 слушает :PORT и за IPv4, и за IPv6
# без второго процесса на том же порту (нет EADDRINUSE, как у двух отдельных LISTEN).
# Uvicorn только на loopback — внешний мир ходит только в socat.
# Поле «Команда запуска» в Timeweb — ПУСТО (не дублировать uvicorn).
PORT="${PORT:-8080}"
BACKEND_PORT="${BACKEND_PORT:-18080}"
export BACKEND_PORT

echo "challenge100days: :${PORT} (socat TCP6 v6only=0) -> uvicorn 127.0.0.1:${BACKEND_PORT}"

term() {
	kill "${UVICORN_PID:-}" 2>/dev/null || true
	kill "${SOCAT_PID:-}" 2>/dev/null || true
	wait 2>/dev/null || true
}
trap term TERM INT

/usr/local/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port "${BACKEND_PORT}" &
UVICORN_PID="$!"

/usr/local/bin/python <<'PY' || exit 1
import os, socket, sys, time

port = int(os.environ["BACKEND_PORT"])
for _ in range(120):
	try:
		c = socket.create_connection(("127.0.0.1", port), timeout=2)
		c.close()
		sys.exit(0)
	except OSError:
		time.sleep(0.05)
print("challenge100days: uvicorn не поднялся за время ожидания", file=sys.stderr)
sys.exit(1)
PY

socat TCP6-LISTEN:"${PORT}",bind=::,fork,reuseaddr,v6only=0 TCP4:127.0.0.1:"${BACKEND_PORT}" &
SOCAT_PID="$!"
sleep 0.3
if ! kill -0 "${SOCAT_PID}" 2>/dev/null; then
	echo "challenge100days: TCP6 v6only=0 недоступен, IPv4-only на :${PORT}"
	socat TCP4-LISTEN:"${PORT}",bind=0.0.0.0,fork,reuseaddr TCP4:127.0.0.1:"${BACKEND_PORT}" &
	SOCAT_PID="$!"
fi

wait "${UVICORN_PID}"
EXIT_CODE="$?"
term
exit "${EXIT_CODE}"
