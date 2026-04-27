import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class CupType(str, enum.Enum):
    golden = "golden"
    copper = "copper"


class ChallengeStatus(str, enum.Enum):
    active = "active"
    completed = "completed"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    challenges: Mapped[list["Challenge"]] = relationship(
        "Challenge", back_populates="owner", cascade="all, delete-orphan"
    )


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[ChallengeStatus] = mapped_column(
        Enum(ChallengeStatus, native_enum=False, length=20),
        default=ChallengeStatus.active,
    )
    cup: Mapped[CupType | None] = mapped_column(
        Enum(CupType, native_enum=False, length=20),
        nullable=True,
    )
    final_comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    visible_in_feed: Mapped[bool] = mapped_column(Boolean, default=True)

    owner: Mapped["User"] = relationship("User", back_populates="challenges")
    habits: Mapped[list["Habit"]] = relationship(
        "Habit", back_populates="challenge", cascade="all, delete-orphan", order_by="Habit.sort_order"
    )
    day_logs: Mapped[list["DayLog"]] = relationship(
        "DayLog", back_populates="challenge", cascade="all, delete-orphan"
    )


class Habit(Base):
    __tablename__ = "habits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(200))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    challenge: Mapped["Challenge"] = relationship("Challenge", back_populates="habits")


class DayLog(Base):
    __tablename__ = "day_logs"
    __table_args__ = (UniqueConstraint("challenge_id", "day_number", name="uq_challenge_day"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    challenge_id: Mapped[int] = mapped_column(ForeignKey("challenges.id", ondelete="CASCADE"))
    day_number: Mapped[int] = mapped_column(Integer)
    is_success: Mapped[bool] = mapped_column(Boolean)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    challenge: Mapped["Challenge"] = relationship("Challenge", back_populates="day_logs")


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    text: Mapped[str] = mapped_column(Text)
    author: Mapped[str | None] = mapped_column(String(120), nullable=True)