from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User
from app.schemas.expense_schema import TransactionRead
from app.schemas.income_schema import IncomeCreate
from app.services.auth_service import get_current_user
from app.services.expense_service import create_transaction, delete_transaction, list_transactions

router = APIRouter(prefix="/income", tags=["income"])


@router.get("", response_model=list[TransactionRead])
def income(user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    return list_transactions(database, user, "income")


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def add_income(details: IncomeCreate, user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    return create_transaction(database, user, "income", details.description, details.amount, details.category, details.date, details.note)


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_income(transaction_id: int, user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    delete_transaction(database, user, transaction_id, "income")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
