from typing import Literal

from .expense_schema import TransactionCreate


class IncomeCreate(TransactionCreate):
    kind: Literal["income"] = "income"


class IncomeCategoryList:
    values = ("Salary", "Side income", "Investment", "Gift", "Refund", "Other")
