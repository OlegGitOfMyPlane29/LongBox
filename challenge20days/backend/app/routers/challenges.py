from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app import models
from app.database import get_db
from app.deps import get_current_user
from app.schemas import (
    ChallengeCreate,
    ChallengePublic,
    ChallengeStatusPublic,
    ChallengeSummary,
    CupPublic,
    DayLogUpsert,
)

router = APIRouter(prefix="/challenges", tags=["challenges"])


def _to_summary(ch: models.Challenge) -> ChallengeSummary:
    return ChallengeSummary(
        id=ch.id,
        user_id=ch.user_id,
        title=ch.title,
        status=ChallengeStatusPublic(ch.status.value),
        cup=CupPublic(ch.cup.value) if ch.cup else None,
        created_at=ch.created_at,
        completed_at=ch.completed_at,
        days_logged=len(ch.day_logs or []),
    )


@router.get("", response_model=list[ChallengeSummary])
def list_my_challenges(
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    rows = crud.list_challenges_for_user(db, user.id)
    return [_to_summary(ch) for ch in rows]


@router.post("", response_model=ChallengePublic, status_code=status.HTTP_201_CREATED)
def create_challenge(
    body: ChallengeCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    ch = crud.create_challenge(db, user.id, body)
    if not ch:
        raise HTTPException(status_code=500, detail="Не удалось создать челлендж")
    return ch


@router.get("/{challenge_id}", response_model=ChallengePublic)
def get_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    ch = crud.get_challenge(db, challenge_id, user.id)
    if not ch:
        raise HTTPException(status_code=404, detail="Испытание не найдено")
    return ch


@router.post("/{challenge_id}/days", response_model=ChallengePublic)
def log_day(
    challenge_id: int,
    body: DayLogUpsert,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    ch = crud.get_challenge(db, challenge_id, user.id)
    if not ch:
        raise HTTPException(status_code=404, detail="Испытание не найдено")
    try:
        return crud.upsert_day_log(db, ch, body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e
