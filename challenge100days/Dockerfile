# Timeweb Apps: явный CMD; модуль ASGI — app.main:app (не main:app).
# Gunicorn + 1× UvicornWorker часто стабильнее «голого» uvicorn на PaaS (сигналы, прокси, healthcheck).
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "exec gunicorn app.main:app -w 1 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8080} --timeout 120 --graceful-timeout 60 --access-logfile - --error-logfile -"]

# Миграции вручную — см. README.
