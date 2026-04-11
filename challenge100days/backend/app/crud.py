from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from .auth import hash_password, verify_password
from .models import Challenge, DayLog, Habit, User
from .schemas import ChallengeCreate, ChallengeUpdate, DayLogCreate, UserRegister, UserUpdate


def create_user(db: Session, payload: UserRegister) -> User:
    exists = db.query(User).filter(User.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Пользователь с таким email уже существует")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Неверный email или пароль")
    return user


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    if payload.display_name is not None:
        user.display_name = payload.display_name
    if payload.password is not None:
        user.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(user)
    return user


def create_challenge(db: Session, owner_id: int, payload: ChallengeCreate) -> Challenge:
    challenge = Challenge(owner_id=owner_id, title=payload.title)
    db.add(challenge)
    db.flush()
    for habit_name in payload.habits:
        db.add(Habit(challenge_id=challenge.id, name=habit_name))
    db.commit()
    return get_challenge(db, challenge.id)


def get_challenge(db: Session, challenge_id: int) -> Challenge:
    challenge = (
        db.query(Challenge)
        .options(
            joinedload(Challenge.owner),
            joinedload(Challenge.habits),
            joinedload(Challenge.logs),
        )
        .filter(Challenge.id == challenge_id)
        .first()
    )
    if not challenge:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Испытание не найдено")
    challenge.logs.sort(key=lambda log: log.day_number)
    return challenge


def list_challenges_by_owner(db: Session, owner_id: int) -> list[Challenge]:
    challenges = (
        db.query(Challenge)
        .options(joinedload(Challenge.owner), joinedload(Challenge.habits), joinedload(Challenge.logs))
        .filter(Challenge.owner_id == owner_id)
        .order_by(Challenge.created_at.desc())
        .all()
    )
    for challenge in challenges:
        challenge.logs.sort(key=lambda log: log.day_number)
    return challenges


def update_challenge(db: Session, challenge: Challenge, payload: ChallengeUpdate) -> Challenge:
    if challenge.is_finished:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Завершенное испытание нельзя изменять")

    if payload.title is not None:
        challenge.title = payload.title
    if payload.habits is not None:
        db.query(Habit).filter(Habit.challenge_id == challenge.id).delete()
        for habit_name in payload.habits:
            db.add(Habit(challenge_id=challenge.id, name=habit_name))

    db.commit()
    return get_challenge(db, challenge.id)


def add_day_log(db: Session, challenge: Challenge, payload: DayLogCreate) -> Challenge:
    if challenge.is_finished:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Испытание уже завершено")

    next_day = len(challenge.logs) + 1
    if next_day > 100:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Лимит в 100 дней уже достигнут")

    is_success = payload.status == "success"
    db.add(DayLog(challenge_id=challenge.id, day_number=next_day, is_success=is_success, comment=payload.comment))

    if not is_success:
        challenge.is_finished = True
        challenge.reward = "Медный кубок"
        challenge.final_comment = payload.final_comment
    elif next_day == 100:
        if not payload.final_comment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="На 100-й день обязателен итоговый комментарий",
            )
        challenge.is_finished = True
        challenge.reward = "Золотой кубок"
        challenge.final_comment = payload.final_comment

    db.commit()
    return get_challenge(db, challenge.id)
