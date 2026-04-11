from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    display_name: str = Field(min_length=2, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=2, max_length=100)
    password: str | None = Field(default=None, min_length=6, max_length=100)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    display_name: str
    role: str
    created_at: datetime


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ChallengeCreate(BaseModel):
    title: str = Field(min_length=2, max_length=120)
    habits: list[str] = Field(min_length=1, max_length=3)

    @field_validator("habits")
    @classmethod
    def validate_habits(cls, habits: list[str]) -> list[str]:
        cleaned = [habit.strip() for habit in habits if habit.strip()]
        if not cleaned:
            raise ValueError("Укажите хотя бы одну привычку")
        if len(cleaned) > 3:
            raise ValueError("Можно указать не более 3 привычек")
        for habit in cleaned:
            if len(habit) > 80:
                raise ValueError("Привычка не должна быть длиннее 80 символов")
        return cleaned


class ChallengeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=120)
    habits: list[str] | None = Field(default=None, min_length=1, max_length=3)

    @field_validator("habits")
    @classmethod
    def validate_habits(cls, habits: list[str] | None) -> list[str] | None:
        if habits is None:
            return None
        cleaned = [habit.strip() for habit in habits if habit.strip()]
        if not cleaned:
            raise ValueError("Укажите хотя бы одну привычку")
        if len(cleaned) > 3:
            raise ValueError("Можно указать не более 3 привычек")
        for habit in cleaned:
            if len(habit) > 80:
                raise ValueError("Привычка не должна быть длиннее 80 символов")
        return cleaned


class DayLogCreate(BaseModel):
    status: Literal["success", "fail"]
    comment: str = Field(min_length=1, max_length=300)
    final_comment: str | None = Field(default=None, max_length=300)


class HabitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


class DayLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    day_number: int
    is_success: bool
    comment: str
    created_at: datetime


class ChallengeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    final_comment: str | None
    reward: str | None
    is_finished: bool
    created_at: datetime
    owner: UserOut
    habits: list[HabitOut]
    logs: list[DayLogOut]


class FeedItem(BaseModel):
    challenge_id: int
    title: str
    owner_name: str
    owner_id: int
    success_days: int
    total_days: int
    reward: str | None
    is_finished: bool
