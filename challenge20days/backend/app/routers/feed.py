from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.schemas import FeedItem, ChallengeStatusPublic, CupPublic

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("", response_model=list[FeedItem])
def public_feed(limit: int = 50, offset: int = 0, db: Session = Depends(get_db)):
    rows = crud.feed_items(db, limit=min(limit, 100), offset=max(offset, 0))
    return [
        FeedItem(
            id=r["id"],
            title=r["title"],
            username=r["username"],
            status=ChallengeStatusPublic(r["status"].value),
            cup=CupPublic(r["cup"].value) if r["cup"] else None,
            created_at=r["created_at"],
            completed_at=r["completed_at"],
            days_logged=r["days_logged"],
        )
        for r in rows
    ]
