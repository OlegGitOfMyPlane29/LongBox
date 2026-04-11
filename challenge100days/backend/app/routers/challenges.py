from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import crud
from ..database import get_db
from ..deps import get_current_user, require_admin
from ..models import Challenge, User
from ..schemas import ChallengeCreate, ChallengeOut, ChallengeUpdate, DayLogCreate

router = APIRouter(prefix="/challenges", tags=["challenges"])


def _get_accessible_challenge(db: Session, challenge_id: int, user: User) -> Challenge:
    challenge = crud.get_challenge(db, challenge_id)
    if user.role != "admin" and challenge.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя изменять чужое испытание")
    return challenge


@router.post("", response_model=ChallengeOut)
def create(payload: ChallengeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.create_challenge(db, current_user.id, payload)


@router.get("/me", response_model=list[ChallengeOut])
def list_mine(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.list_challenges_by_owner(db, current_user.id)


@router.get("/{challenge_id}", response_model=ChallengeOut)
def get_challenge(challenge_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    challenge = crud.get_challenge(db, challenge_id)
    if current_user.role != "admin" and challenge.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя просматривать чужое испытание")
    return challenge


@router.patch("/{challenge_id}", response_model=ChallengeOut)
def update(
    challenge_id: int,
    payload: ChallengeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge = _get_accessible_challenge(db, challenge_id, current_user)
    return crud.update_challenge(db, challenge, payload)


@router.post("/{challenge_id}/logs", response_model=ChallengeOut)
def create_log(
    challenge_id: int,
    payload: DayLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    challenge = _get_accessible_challenge(db, challenge_id, current_user)
    return crud.add_day_log(db, challenge, payload)


@router.delete("/{challenge_id}")
def delete_challenge(challenge_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    challenge = _get_accessible_challenge(db, challenge_id, current_user)
    db.delete(challenge)
    db.commit()
    return {"message": "Испытание удалено"}


@router.get("", response_model=list[ChallengeOut])
def list_all(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    challenges = db.query(Challenge).all()
    return [crud.get_challenge(db, challenge.id) for challenge in challenges]
