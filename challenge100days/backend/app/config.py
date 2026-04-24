from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv()


class Settings(BaseModel):
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql+psycopg2://postgres:postgres@localhost:5432/challenge100days"
    )
    secret_key: str = os.getenv("SECRET_KEY", "change_me")
    algorithm: str = "HS256"
    access_token_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    cors_origins: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
    )
    quotes_api_key: str = os.getenv("QUOTES_API_KEY", "")
    quotes_timeout_seconds: int = int(os.getenv("QUOTES_TIMEOUT_SECONDS", "8"))
    quotes_primary_url: str = os.getenv("QUOTES_PRIMARY_URL", "https://api.quotable.io/quotes/random")
    quotes_secondary_url: str = os.getenv("QUOTES_SECONDARY_URL", "https://zenquotes.io/api/random")


settings = Settings()
