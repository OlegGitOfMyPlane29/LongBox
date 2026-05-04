# Timeweb App Platform: у платформы healthcheck и парсер Dockerfile ожидают явный CMD с uvicorn на 0.0.0.0.
# Только ENTRYPOINT без CMD у них может трактоваться как «команда не указана».
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
ENV PORT=8080
EXPOSE 8080

# Совпадает с типичной проверкой по GET / (у приложения есть маршрут /).
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=6 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/'%os.environ.get('PORT','8080'))"

# PORT подставляется при старте (Timeweb может переопределить в окружении).
CMD ["sh", "-c", "exec python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]

# Миграции вручную — см. README.
