# Корень репозитория — требование Timeweb App Platform (Dockerfile в корне).
# Контекст сборки: весь репозиторий; код API в каталоге backend/.
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
EXPOSE 8080

# Entrypoint: один uvicorn на 0.0.0.0:$PORT (переменная PORT; Timeweb часто задаёт её сам).
# В панели задайте PORT=8080, если проверка здоровья идёт на 8080.
RUN chmod +x /app/docker-entrypoint.sh && sed -i 's/\r$//' /app/docker-entrypoint.sh
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Миграции вручную перед первым запуском — см. README.
