# Корень репозитория — требование Timeweb App Platform (Dockerfile в корне).
# Контекст сборки: весь репозиторий; код API в каталоге backend/.
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
EXPOSE 8080

# PORT задаёт платформа (часто 8080). Миграции перед стартом API.
CMD sh -c 'alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8080}"'
