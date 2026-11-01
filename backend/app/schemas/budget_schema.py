from pydantic import BaseModel, Field


class BudgetUpdate(BaseModel):
    month: str = Field(pattern=r"^\d{4}-(0[1-9]|1[0-2])$")
    amount: float = Field(gt=0, le=10_000_000)


class BudgetRead(BaseModel):
    month: str
    amount_cents: int
    spent_cents: int
    remaining_cents: int
    percent_used: int
