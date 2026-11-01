from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Budget, Transaction, User
from app.schemas.budget_schema import BudgetRead, BudgetUpdate
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/budget", tags=["budget"])


def budget_summary(database: Session, user: User, month: str, amount_cents: int) -> dict[str, int | str]:
    spent_cents = database.scalar(
        select(func.coalesce(func.sum(Transaction.amount_cents), 0)).where(
            Transaction.user_id == user.id,
            Transaction.kind == "expense",
            func.strftime("%Y-%m", Transaction.date) == month,
        )
    ) or 0
    return {
        "month": month,
        "amount_cents": amount_cents,
        "spent_cents": spent_cents,
        "remaining_cents": amount_cents - spent_cents,
        "percent_used": round(spent_cents / amount_cents * 100) if amount_cents else 0,
    }


@router.get("", response_model=BudgetRead)
def get_budget(month: str, user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    budget = database.scalar(select(Budget).where(Budget.user_id == user.id, Budget.month == month))
    return budget_summary(database, user, month, budget.amount_cents if budget else 300000)


@router.put("", response_model=BudgetRead)
def save_budget(details: BudgetUpdate, user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    budget = database.scalar(select(Budget).where(Budget.user_id == user.id, Budget.month == details.month))
    if budget is None:
        budget = Budget(user_id=user.id, month=details.month, amount_cents=round(details.amount * 100))
        database.add(budget)
    else:
        budget.amount_cents = round(details.amount * 100)
    database.commit()
    return budget_summary(database, user, details.month, budget.amount_cents)
