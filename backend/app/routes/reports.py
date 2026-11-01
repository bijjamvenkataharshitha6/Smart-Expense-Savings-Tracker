from calendar import month_abbr
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Budget, SavingsGoal, Transaction, User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
def dashboard(
    month: str = Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    transactions = list(database.scalars(select(Transaction).where(Transaction.user_id == user.id)))
    current = [item for item in transactions if item.date.strftime("%Y-%m") == month]
    income_cents = sum(item.amount_cents for item in current if item.kind == "income")
    expense_cents = sum(item.amount_cents for item in current if item.kind == "expense")
    category_totals: dict[str, int] = {}
    for item in current:
        if item.kind == "expense":
            category_totals[item.category] = category_totals.get(item.category, 0) + item.amount_cents

    year, month_number = (int(value) for value in month.split("-"))
    end_month = date(year, month_number, 1)
    trend_months = []
    for offset in range(5, -1, -1):
        absolute_month = end_month.year * 12 + end_month.month - 1 - offset
        trend_year, month_index = divmod(absolute_month, 12)
        trend_month = date(trend_year, month_index + 1, 1)
        trend_key = trend_month.strftime("%Y-%m")
        trend_months.append({
            "month": trend_key,
            "label": month_abbr[trend_month.month],
            "expense_cents": sum(
                item.amount_cents for item in transactions
                if item.kind == "expense" and item.date.strftime("%Y-%m") == trend_key
            ),
        })

    budget = database.scalar(select(Budget).where(Budget.user_id == user.id, Budget.month == month))
    budget_cents = budget.amount_cents if budget else 300000
    goals = list(database.scalars(select(SavingsGoal).where(SavingsGoal.user_id == user.id).order_by(SavingsGoal.id)))
    recent = sorted(current, key=lambda item: (item.date, item.id), reverse=True)[:5]
    all_time_balance = sum(item.amount_cents if item.kind == "income" else -item.amount_cents for item in transactions)
    return {
        "month": month,
        "income_cents": income_cents,
        "expense_cents": expense_cents,
        "savings_cents": income_cents - expense_cents,
        "savings_rate": round((income_cents - expense_cents) / income_cents * 100) if income_cents else 0,
        "all_time_balance_cents": all_time_balance,
        "budget_cents": budget_cents,
        "category_totals": category_totals,
        "trends": trend_months,
        "goals": goals,
        "recent_transactions": recent,
    }


@router.get("/monthly")
def monthly_report(
    month: str = Query(pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    user: User = Depends(get_current_user),
    database: Session = Depends(get_db),
):
    data = dashboard(month, user, database)
    return {
        "month": data["month"],
        "income_cents": data["income_cents"],
        "expense_cents": data["expense_cents"],
        "savings_cents": data["savings_cents"],
        "category_totals": data["category_totals"],
        "trends": data["trends"],
    }
