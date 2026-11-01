from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .connection import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(80))
    password_hash: Mapped[str] = mapped_column(String(256))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    savings_goals: Mapped[list["SavingsGoal"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    budgets: Mapped[list["Budget"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    kind: Mapped[str] = mapped_column(String(10), index=True)
    description: Mapped[str] = mapped_column(String(80))
    amount_cents: Mapped[int] = mapped_column(Integer)
    category: Mapped[str] = mapped_column(String(40))
    date: Mapped[date] = mapped_column(Date, index=True)
    note: Mapped[str] = mapped_column(String(160), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="transactions")


class SavingsGoal(Base):
    __tablename__ = "savings_goals"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    target_cents: Mapped[int] = mapped_column(Integer)
    saved_cents: Mapped[int] = mapped_column(Integer, default=0)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    icon: Mapped[str] = mapped_column(String(20), default="target")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="savings_goals")


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("user_id", "month", name="uq_budget_user_month"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    month: Mapped[str] = mapped_column(String(7))
    amount_cents: Mapped[int] = mapped_column(Integer, default=300000)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship(back_populates="budgets")
