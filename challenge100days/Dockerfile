# Timeweb Apps: явный CMD; модуль ASGI — app.main:app (не main:app).
# Gunicorn слушает [::]:PORT (на Linux обычно dual-stack: отвечает и на 127.0.0.1, и на ::1).
# Если слушать только 0.0.0.0, платформа часто поднимает второй uvicorn на [::]:8080 — healthcheck бьёт в него и падает.
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "exec gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker --bind \"[::]:${PORT:-8080}\" --timeout 120 --graceful-timeout 60 --access-logfile - --error-logfile -"]

# Миграции вручную — см. README.
