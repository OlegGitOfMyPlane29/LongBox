from datetime import datetime, timezone
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app import models
from app.auth.password import hash_password
from app.schemas import ChallengeCreate, DayLogUpsert, UserCreate


def utcnow():
    return datetime.now(timezone.utc)


def get_user_by_email(db: Session, email: str) -> models.User | None:
    return db.scalar(select(models.User).where(models.User.email == email))


def get_user_by_username(db: Session, username: str) -> models.User | None:
    return db.scalar(select(models.User).where(models.User.username == username))


def create_user(db: Session, data: UserCreate) -> models.User:
    user = models.User(
        email=str(data.email).lower().strip(),
        username=data.username.strip(),
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_challenge(db: Session, user_id: int, data: ChallengeCreate) -> models.Challenge:
    ch = models.Challenge(
        user_id=user_id,
        title=data.title.strip(),
        status=models.ChallengeStatus.active,
        visible_in_feed=True,
    )
    db.add(ch)
    db.flush()
    for i, h in enumerate(data.habits):
        db.add(
            models.Habit(
                challenge_id=ch.id,
                name=h.name.strip(),
                sort_order=i,
            )
        )
    db.commit()
    db.refresh(ch)
    return get_challenge(db, ch.id, user_id)  # type: ignore


def get_challenge(db: Session, challenge_id: int, user_id: int | None = None) -> models.Challenge | None:
    q = (
        select(models.Challenge)
        .options(selectinload(models.Challenge.habits), selectinload(models.Challenge.day_logs))
        .where(models.Challenge.id == challenge_id)
    )
    if user_id is not None:
        q = q.where(models.Challenge.user_id == user_id)
    return db.scalar(q)


def list_challenges_for_user(db: Session, user_id: int) -> Sequence[models.Challenge]:
    return (
        db.scalars(
            select(models.Challenge)
            .options(
                selectinload(models.Challenge.habits),
                selectinload(models.Challenge.day_logs),
            )
            .where(models.Challenge.user_id == user_id)
            .order_by(models.Challenge.created_at.desc())
        )
        .unique()
        .all()
    )


def _day_logs_by_number(ch: models.Challenge) -> dict[int, models.DayLog]:
    return {d.day_number: d for d in ch.day_logs}


def upsert_day_log(
    db: Session,
    challenge: models.Challenge,
    data: DayLogUpsert,
) -> models.Challenge:
    if challenge.status != models.ChallengeStatus.active:
        raise ValueError("Челлендж уже завершён")

    if data.day_number > 1:
        prev = db.scalar(
            select(models.DayLog).where(
                models.DayLog.challenge_id == challenge.id,
                models.DayLog.day_number == data.day_number - 1,
            )
        )
        if not prev:
            raise ValueError("Сначала отметьте предыдущий день")

    existing = db.scalar(
        select(models.DayLog).where(
            models.DayLog.challenge_id == challenge.id,
            models.DayLog.day_number == data.day_number,
        )
    )

    if data.day_number == 20 and data.is_success:
        fc = (data.final_comment or "").strip()
        if not fc:
            raise ValueError("На 20-й день при успехе нужен итоговый комментарий")
        for d in range(1, 20):
            log = db.scalar(
                select(models.DayLog).where(
                    models.DayLog.challenge_id == challenge.id,
                    models.DayLog.day_number == d,
                )
            )
            if not log or not log.is_success:
                raise ValueError("До 20-го дня все дни должны быть отмечены как успех")

    comment = (data.comment or "").strip() or None

    if existing:
        existing.is_success = data.is_success
        existing.comment = comment
        existing.logged_at = utcnow()
    else:
        db.add(
            models.DayLog(
                challenge_id=challenge.id,
                day_number=data.day_number,
                is_success=data.is_success,
                comment=comment,
            )
        )

    if not data.is_success:
        challenge.status = models.ChallengeStatus.completed
        challenge.cup = models.CupType.copper
        challenge.completed_at = utcnow()
        db.commit()
        db.refresh(challenge)
        return get_challenge(db, challenge.id, challenge.user_id)  # type: ignore

    if data.day_number == 20 and data.is_success:
        challenge.final_comment = (data.final_comment or "").strip()
        challenge.cup = models.CupType.golden
        challenge.status = models.ChallengeStatus.completed
        challenge.completed_at = utcnow()

    db.commit()
    db.refresh(challenge)
    return get_challenge(db, challenge.id, challenge.user_id)  # type: ignore


def feed_items(db: Session, limit: int = 50, offset: int = 0) -> list[dict]:
    challenges = (
        db.scalars(
            select(models.Challenge)
            .options(
                selectinload(models.Challenge.day_logs),
                selectinload(models.Challenge.owner),
            )
            .where(models.Challenge.visible_in_feed.is_(True))
            .order_by(models.Challenge.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        .unique()
        .all()
    )

    out: list[dict] = []
    for ch in challenges:
        username = ch.owner.username if ch.owner else "?"
        out.append(
            {
                "id": ch.id,
                "title": ch.title,
                "username": username,
                "status": ch.status,
                "cup": ch.cup,
                "created_at": ch.created_at,
                "completed_at": ch.completed_at,
                "days_logged": len(ch.day_logs or []),
            }
        )
    return out


def random_quote(db: Session) -> models.Quote | None:
    return db.scalar(
        select(models.Quote).order_by(func.random()).limit(1)  # noqa: S311 - DB RNG
    )


def list_quotes(db: Session, limit: int = 50) -> Sequence[models.Quote]:
    return db.scalars(select(models.Quote).order_by(models.Quote.id).limit(limit)).all()


def challenge_summary(ch: models.Challenge) -> dict:
    days = len(ch.day_logs) if ch.day_logs is not None else 0
    return {
        "id": ch.id,
        "user_id": ch.user_id,
        "title": ch.title,
        "status": ch.status,
        "cup": ch.cup,
        "created_at": ch.created_at,
        "completed_at": ch.completed_at,
        "days_logged": days,
    }
