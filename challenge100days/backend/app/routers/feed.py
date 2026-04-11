from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..deps import get_current_user
from ..models import Challenge, User
from ..schemas import FeedItem

router = APIRouter(prefix="/feed", tags=["feed"])


@router.get("/challenges", response_model=list[FeedItem])
def challenges_feed(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    challenges = (
        db.query(Challenge)
        .options(joinedload(Challenge.owner), joinedload(Challenge.logs))
        .order_by(Challenge.created_at.desc())
        .all()
    )
    items: list[FeedItem] = []
    for challenge in challenges:
        total = len(challenge.logs)
        success = len([log for log in challenge.logs if log.is_success])
        items.append(
            FeedItem(
                challenge_id=challenge.id,
                title=challenge.title,
                owner_name=challenge.owner.display_name,
                owner_id=challenge.owner.id,
                success_days=success,
                total_days=total,
                reward=challenge.reward,
                is_finished=challenge.is_finished,
            )
        )
    return items
