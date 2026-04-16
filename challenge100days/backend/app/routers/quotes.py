import logging
import random
import time

import httpx
from fastapi import APIRouter

from ..config import settings
from ..schemas import QuoteOut

router = APIRouter(prefix="/quotes", tags=["quotes"])
logger = logging.getLogger(__name__)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(levelname)s:%(name)s:%(message)s"))
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
logger.propagate = False

FALLBACK_QUOTES = [
    QuoteOut(content="Дорогу осилит идущий.", author="challenge100days", tags=["motivation"], source="fallback"),
    QuoteOut(content="Маленькие шаги каждый день дают большие результаты.", author="challenge100days", tags=["habit"], source="fallback"),
    QuoteOut(content="Побеждает тот, кто не сдается на полпути.", author="challenge100days", tags=["discipline"], source="fallback"),
    QuoteOut(content="Сегодняшняя дисциплина - завтрашняя свобода.", author="challenge100days", tags=["focus"], source="fallback"),
]


def _safe_key_preview() -> str:
    if not settings.quotes_api_key:
        return "empty"
    suffix = settings.quotes_api_key[-4:] if len(settings.quotes_api_key) > 4 else settings.quotes_api_key
    return f"***{suffix}"


def _build_outbound_headers() -> dict[str, str]:
    headers: dict[str, str] = {}
    if settings.quotes_api_key:
        # Most public quote APIs ignore this header, but it allows easy switch
        # to key-based providers without touching code.
        headers["X-API-KEY"] = settings.quotes_api_key
    return headers


def _fetch_json(provider: str, url: str, params: dict[str, str] | None = None) -> object:
    started_at = time.perf_counter()
    headers = _build_outbound_headers()
    logger.warning(
        "Quotes outbound request provider=%s url=%s params=%s key=%s",
        provider,
        url,
        params or {},
        _safe_key_preview(),
    )
    with httpx.Client(timeout=settings.quotes_timeout_seconds) as client:
        response = client.get(url, params=params, headers=headers)
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        logger.warning(
            "Quotes outbound response provider=%s status=%s elapsed_ms=%s",
            provider,
            response.status_code,
            elapsed_ms,
        )
        response.raise_for_status()
        return response.json()


def _request_quotable_quote() -> QuoteOut:
    payload = _fetch_json("quotable", settings.quotes_primary_url, {"limit": "1"})

    if not isinstance(payload, list) or not payload:
        raise ValueError("Quotable returned empty payload")

    item = payload[0]
    content = item.get("content")
    author = item.get("author")
    tags = item.get("tags") if isinstance(item.get("tags"), list) else []

    if not content or not author:
        raise ValueError("Quotable payload misses content or author")

    return QuoteOut(content=content, author=author, tags=tags, source="quotable")


def _request_zenquotes_quote() -> QuoteOut:
    payload = _fetch_json("zenquotes", settings.quotes_secondary_url)

    if not isinstance(payload, list) or not payload:
        raise ValueError("ZenQuotes returned empty payload")

    item = payload[0]
    content = item.get("q")
    author = item.get("a")
    if not content or not author:
        raise ValueError("ZenQuotes payload misses content or author")
    return QuoteOut(content=content, author=author, tags=["motivation"], source="zenquotes")


@router.get("/random", response_model=QuoteOut)
def random_quote():
    try:
        quote = _request_quotable_quote()
        logger.warning("Quote fetched from Quotable")
        return quote
    except Exception:
        logger.exception("Failed to fetch quote from Quotable")

    try:
        quote = _request_zenquotes_quote()
        logger.warning("Quote fetched from ZenQuotes")
        return quote
    except Exception:
        logger.exception("Failed to fetch quote from ZenQuotes")

    return random.choice(FALLBACK_QUOTES)
