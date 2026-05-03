#!/bin/sh
set -eu
# Timeweb: healthcheck по localhost может идти на 127.0.0.1 или ::1.
# Uvicorn слушает только внутренний порт на loopback; socat дважды принимает $PORT по IPv4 и IPv6 без конфликта «двух wildcard», как у Gunicorn.
PORT="${PORT:-8080}"
BACKEND_PORT="${BACKEND_PORT:-18080}"
export BACKEND_PORT

echo "challenge100days entrypoint: edge :${PORT} (socat IPv4+IPv6) -> uvicorn 127.0.0.1:${BACKEND_PORT}"

term() {
	kill "${UVICORN_PID:-}" 2>/dev/null || true
	kill "${SOCAT4_PID:-}" 2>/dev/null || true
	if [ -n "${SOCAT6_PID:-}" ]; then
		kill "${SOCAT6_PID}" 2>/dev/null || true
	fi
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

socat TCP4-LISTEN:"${PORT}",bind=0.0.0.0,reuseaddr,fork TCP:127.0.0.1:"${BACKEND_PORT}" &
SOCAT4_PID="$!"

SOCAT6_PID=""
socat TCP6-LISTEN:"${PORT}",reuseaddr,fork TCP:127.0.0.1:"${BACKEND_PORT}" &
SOCAT6_PID="$!"
sleep 0.5
if ! kill -0 "${SOCAT6_PID}" 2>/dev/null; then
	echo "challenge100days: ipv6-слой socat недоступен, используется только IPv4 (:${PORT})"
	SOCAT6_PID=""
fi

wait "${UVICORN_PID}"
EXIT_CODE="$?"
term
exit "${EXIT_CODE}"
