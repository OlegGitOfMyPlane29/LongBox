"""Настройки окружения.

В development допускается SQLite по умолчанию и запасной JWT-секрет, если в .env нет сильного ключа.
В production (APP_ENV=production) обязательны БД и SECRET_KEY из переменных окружения;
приложение не стартует при слабом или пустом SECRET_KEY — см. README, раздел «Продакшен».

БД: либо DATABASE_URL, либо (рекомендовано для PaaS вроде Timeweb) отдельные DB_HOST, DB_USER,
DB_PASSWORD — приложение само соберёт URL и закодирует пароль; так UI не портит спецсимволы в URI.
"""

from urllib.parse import quote

from pydantic import BaseModel, ConfigDict

from dotenv import load_dotenv
import os

load_dotenv()

_WEAK_SECRET_KEYS = frozenset({"change_me", "replace_with_long_secret_key", "secret", "test"})


def _resolve_app_env() -> str:
    return os.getenv("APP_ENV", "development").strip().lower()


def _database_url_from_parts() -> str | None:
    """Если заданы DB_HOST, DB_USER, DB_PASSWORD — строим DATABASE_URL с quote для пароля."""
    host = os.getenv("DB_HOST", "").strip()
    user = os.getenv("DB_USER", "").strip()
    password = os.getenv("DB_PASSWORD", "").strip()
    if not (host and user and password):
        return None
    name = (os.getenv("DB_NAME", "") or "postgres").strip() or "postgres"
    port = (os.getenv("DB_PORT", "") or "5432").strip() or "5432"
    scheme = (os.getenv("DB_SCHEME", "") or "postgresql+psycopg2").strip() or "postgresql+psycopg2"
    u = quote(user, safe="")
    p = quote(password, safe="")
    return f"{scheme}://{u}:{p}@{host}:{port}/{name}"


def _resolve_database_url(app_env: str) -> str:
    from_parts = _database_url_from_parts()
    if from_parts:
        return from_parts
    raw = os.getenv("DATABASE_URL", "").strip()
    if raw:
        return raw
    if app_env == "production":
        raise ValueError(
            "When APP_ENV=production, set DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD "
            "(optional: DB_NAME, DB_PORT, DB_SCHEME)."
        )
    return "sqlite:///./challenge100days.db"


def _resolve_secret_key(app_env: str) -> str:
    raw = os.getenv("SECRET_KEY", "").strip()
    if app_env == "production":
        if not raw or raw in _WEAK_SECRET_KEYS or len(raw) < 32:
            raise ValueError(
                "SECRET_KEY must be set to a random string of at least 32 characters when APP_ENV=production"
            )
        return raw
    if not raw or raw in _WEAK_SECRET_KEYS:
        return "dev-only-jwt-secret-minimum-thirty-two-characters-long!!"
    return raw


def _resolve_auth_rate_limit() -> str:
    raw = os.getenv("AUTH_RATE_LIMIT", "").strip()
    if raw:
        return raw
    # по умолчанию: не более 10 запросов за 15 минут на IP (логин + регистрация)
    return "10 per 15 minutes"


class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")

    app_env: str
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    cors_origins: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
    )
    auth_rate_limit: str
    quotes_api_key: str = os.getenv("QUOTES_API_KEY", "")
    quotes_timeout_seconds: int = int(os.getenv("QUOTES_TIMEOUT_SECONDS", "8"))
    quotes_primary_url: str = os.getenv("QUOTES_PRIMARY_URL", "https://api.quotable.io/quotes/random")
    quotes_secondary_url: str = os.getenv("QUOTES_SECONDARY_URL", "https://zenquotes.io/api/random")

    @classmethod
    def load(cls) -> "Settings":
        app_env = _resolve_app_env()
        return cls(
            app_env=app_env,
            database_url=_resolve_database_url(app_env),
            secret_key=_resolve_secret_key(app_env),
            auth_rate_limit=_resolve_auth_rate_limit(),
        )


settings = Settings.load()
