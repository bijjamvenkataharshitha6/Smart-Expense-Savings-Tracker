from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class TransactionCreate(BaseModel):
    description: str = Field(min_length=2, max_length=80)
    amount: float = Field(gt=0, le=1_000_000)
    category: str = Field(min_length=1, max_length=40)
    date: date
    note: str = Field(default="", max_length=160)


class ExpenseCreate(TransactionCreate):
    kind: Literal["expense"] = "expense"


class TransactionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    kind: Literal["expense", "income"]
    description: str
    amount_cents: int
    category: str
    date: date
    note: str
