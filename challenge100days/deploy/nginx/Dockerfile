# Сборка статики Vite и nginx (контекст сборки — корень challenge100days/).
FROM node:22-alpine AS build
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
ARG VITE_API_URL=/api
ARG VITE_LANDING_MODE=false
ARG VITE_TELEGRAM_BOT_URL=https://t.me/telebotik200526_bot
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_LANDING_MODE=${VITE_LANDING_MODE}
ENV VITE_TELEGRAM_BOT_URL=${VITE_TELEGRAM_BOT_URL}
RUN cd frontend && npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/frontend/dist /usr/share/nginx/html
