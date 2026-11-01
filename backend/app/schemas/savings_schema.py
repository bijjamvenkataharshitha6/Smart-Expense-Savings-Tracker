from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class SavingsCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    target: float = Field(gt=0, le=10_000_000)
    due_date: date | None = None
    icon: str = Field(default="target", max_length=20)


class ContributionCreate(BaseModel):
    amount: float = Field(gt=0, le=10_000_000)


class SavingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    target_cents: int
    saved_cents: int
    due_date: date | None
    icon: str
