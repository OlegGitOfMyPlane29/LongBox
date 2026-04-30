# Корень репозитория — требование Timeweb App Platform (Dockerfile в корне).
# Контекст сборки: весь репозиторий; код API в каталоге backend/.
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
EXPOSE 8080

# Timeweb App Platform проверяет health на порту 8080; не использовать $PORT —
# часто платформа передаёт другой PORT, а проброс остаётся на 8080.
CMD sh -c 'alembic upgrade head && exec uvicorn app.main:app --host 0.0.0.0 --port 8080'
