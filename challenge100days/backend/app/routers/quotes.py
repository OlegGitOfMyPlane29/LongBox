import logging
import random

import httpx
from fastapi import APIRouter

from ..schemas import QuoteOut

router = APIRouter(prefix="/quotes", tags=["quotes"])
logger = logging.getLogger(__name__)

QUOTABLE_API_URL = "https://api.quotable.io/quotes/random"
ZENQUOTES_API_URL = "https://zenquotes.io/api/random"
FALLBACK_QUOTES = [
    QuoteOut(content="Дорогу осилит идущий.", author="challenge100days", tags=["motivation"], source="fallback"),
    QuoteOut(content="Маленькие шаги каждый день дают большие результаты.", author="challenge100days", tags=["habit"], source="fallback"),
    QuoteOut(content="Побеждает тот, кто не сдается на полпути.", author="challenge100days", tags=["discipline"], source="fallback"),
    QuoteOut(content="Сегодняшняя дисциплина - завтрашняя свобода.", author="challenge100days", tags=["focus"], source="fallback"),
]


def _request_quotable_quote() -> QuoteOut:
    with httpx.Client(timeout=8.0) as client:
        response = client.get(QUOTABLE_API_URL, params={"limit": 1})
        response.raise_for_status()
        payload = response.json()

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
    with httpx.Client(timeout=8.0) as client:
        response = client.get(ZENQUOTES_API_URL)
        response.raise_for_status()
        payload = response.json()

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
        logger.info("Quote fetched from Quotable")
        return quote
    except Exception:
        logger.exception("Failed to fetch quote from Quotable")

    try:
        quote = _request_zenquotes_quote()
        logger.info("Quote fetched from ZenQuotes")
        return quote
    except Exception:
        logger.exception("Failed to fetch quote from ZenQuotes")

    return random.choice(FALLBACK_QUOTES)
