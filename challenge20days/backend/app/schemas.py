from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class CupPublic(str, Enum):
    golden = "golden"
    copper = "copper"


class ChallengeStatusPublic(str, Enum):
    active = "active"
    completed = "completed"


# --- Auth / User ---
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=2, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    created_at: datetime


# --- Habits / Challenge ---
class HabitIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)


class ChallengeCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    habits: list[HabitIn] = Field(min_length=1, max_length=3)

    @field_validator("habits")
    @classmethod
    def unique_names(cls, v: list[HabitIn]) -> list[HabitIn]:
        names = [h.name.strip() for h in v]
        if len(names) != len(set(names)):
            raise ValueError("Названия привычек не должны повторяться")
        return v


class HabitPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    sort_order: int


class DayLogPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    day_number: int
    is_success: bool
    comment: str | None
    logged_at: datetime


class ChallengePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    status: ChallengeStatusPublic
    cup: CupPublic | None
    final_comment: str | None
    created_at: datetime
    completed_at: datetime | None
    visible_in_feed: bool
    habits: list[HabitPublic]
    day_logs: list[DayLogPublic]

    @field_validator("day_logs", mode="before")
    @classmethod
    def sort_day_logs(cls, v):
        if v is None:
            return []
        return sorted(v, key=lambda d: d.day_number)


class ChallengeSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    status: ChallengeStatusPublic
    cup: CupPublic | None
    created_at: datetime
    completed_at: datetime | None
    days_logged: int


class DayLogUpsert(BaseModel):
    day_number: int = Field(ge=1, le=20)
    is_success: bool
    comment: str | None = Field(default=None, max_length=4000)
    final_comment: str | None = Field(
        default=None,
        min_length=1,
        max_length=8000,
        description="Обязателен при успехе на 20-й день",
    )


class FeedItem(BaseModel):
    id: int
    title: str
    username: str
    status: ChallengeStatusPublic
    cup: CupPublic | None
    created_at: datetime
    completed_at: datetime | None
    days_logged: int


class QuotePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    author: str | None
