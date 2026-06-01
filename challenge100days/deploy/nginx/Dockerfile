# Сборка статики Vite и nginx (контекст сборки — корень challenge100days/).
FROM node:22-alpine AS build
WORKDIR /src
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN cd frontend && npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/frontend/dist /usr/share/nginx/html
