import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from .config import settings
from .rate_limit import limiter
from .routers import auth, challenges, feed, quotes, users

logger = logging.getLogger(__name__)

CORS_ALLOW_METHODS = ("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
CORS_ALLOW_HEADERS = (
    "Authorization",
    "Content-Type",
    "Accept",
    "Accept-Language",
    "X-Requested-With",
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.app_env == "production":
        logger.info(
            "Режим production: DATABASE_URL и SECRET_KEY должны быть заданы только через окружение "
            "(секрет-хранилище, systemd, Docker secrets и т.д.), не из файлов в репозитории."
        )
    yield


app = FastAPI(title="challenge100days API", lifespan=lifespan)
app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=list(CORS_ALLOW_METHODS),
    allow_headers=list(CORS_ALLOW_HEADERS),
)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    response = JSONResponse(
        status_code=429,
        content={
            "detail": (
                "Слишком много попыток входа или регистрации с этого адреса. "
                "Разрешено не больше 10 запросов за 15 минут. Подождите и попробуйте снова."
            )
        },
    )
    if hasattr(request.state, "view_rate_limit"):
        response = request.app.state.limiter._inject_headers(
            response, request.state.view_rate_limit
        )
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError):
    first_error = exc.errors()[0] if exc.errors() else None
    message = first_error.get("msg", "Некорректные данные") if first_error else "Некорректные данные"
    return JSONResponse(status_code=400, content={"detail": f"Ошибка валидации: {message}"})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception):
    logger.exception("Необработанная ошибка")
    if settings.app_env == "production":
        return JSONResponse(status_code=500, content={"detail": "Внутренняя ошибка сервера"})
    return JSONResponse(
        status_code=500,
        content={"detail": "Внутренняя ошибка сервера", "error_type": type(exc).__name__},
    )


@app.get("/")
def root():
    """Ответ на GET / — многие PaaS проверяют корень при health check."""
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"message": "Сервер работает"}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(challenges.router)
app.include_router(feed.router)
app.include_router(quotes.router)
