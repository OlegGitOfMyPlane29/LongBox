"""initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-04-27

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_initial"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "challenges",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("cup", sa.String(length=20), nullable=True),
        sa.Column("final_comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("visible_in_feed", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )
    op.create_index("ix_challenges_id", "challenges", ["id"])

    op.create_table(
        "habits",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("challenge_id", sa.Integer(), sa.ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
    )
    op.create_index("ix_habits_id", "habits", ["id"])

    op.create_table(
        "day_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("challenge_id", sa.Integer(), sa.ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_number", sa.Integer(), nullable=False),
        sa.Column("is_success", sa.Boolean(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("logged_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("challenge_id", "day_number", name="uq_challenge_day"),
    )
    op.create_index("ix_day_logs_id", "day_logs", ["id"])

    op.create_table(
        "quotes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("author", sa.String(length=120), nullable=True),
    )
    op.create_index("ix_quotes_id", "quotes", ["id"])

    quotes = sa.table(
        "quotes",
        sa.column("text", sa.Text),
        sa.column("author", sa.String),
    )
    op.bulk_insert(
        quotes,
        [
            {
                "text": "Один шаг каждый день — это уже победа над нулём.",
                "author": None,
            },
            {
                "text": "Дисциплина — мост между намерением и результатом.",
                "author": None,
            },
            {
                "text": "Не идеал, а постоянство формирует привычку.",
                "author": None,
            },
            {
                "text": "Двадцать дней подряд — доказательство характера.",
                "author": None,
            },
            {
                "text": "Провал — не приговор, а точка для нового старта.",
                "author": None,
            },
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_quotes_id", table_name="quotes")
    op.drop_table("quotes")
    op.drop_index("ix_day_logs_id", table_name="day_logs")
    op.drop_table("day_logs")
    op.drop_index("ix_habits_id", table_name="habits")
    op.drop_table("habits")
    op.drop_index("ix_challenges_id", table_name="challenges")
    op.drop_table("challenges")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
