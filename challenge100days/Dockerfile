# Timeweb Apps: явный CMD с uvicorn (модуль app.main:app, не main:app).
# Healthcheck платформы часто ходит на ::1; на Linux bind :: обычно dual-stack (IPv4+IPv6).
# Если не поможет — в переменных задайте UVICORN_HOST=0.0.0.0
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

ENV PYTHONPATH=/app
ENV PORT=8080
ENV UVICORN_HOST=::
EXPOSE 8080

# Собственный HEALTHCHECK убран: Timeweb задаёт свою проверку; дублирование могло мешать.
CMD ["sh", "-c", "exec python -m uvicorn app.main:app --host ${UVICORN_HOST:-::} --port ${PORT:-8080}"]

# Миграции вручную — см. README.
