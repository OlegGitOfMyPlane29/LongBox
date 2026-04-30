# Корень репозитория — требование Timeweb App Platform (Dockerfile в корне).
# Контекст сборки: весь репозиторий; код API в каталоге backend/.
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
EXPOSE 8080

# Timeweb проверяет :8080 сразу после старта. Alembic до uvicorn часто не успевает
# (долгая БД / сеть) — healthcheck падает. Миграции один раз вручную — см. README.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
