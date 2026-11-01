from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import Transaction, User


def list_transactions(database: Session, user: User, kind: str) -> list[Transaction]:
    statement = (
        select(Transaction)
        .where(Transaction.user_id == user.id, Transaction.kind == kind)
        .order_by(Transaction.date.desc(), Transaction.id.desc())
    )
    return list(database.scalars(statement))


def create_transaction(
    database: Session,
    user: User,
    kind: str,
    description: str,
    amount: float,
    category: str,
    transaction_date: date,
    note: str = "",
) -> Transaction:
    transaction = Transaction(
        user_id=user.id,
        kind=kind,
        description=description.strip(),
        amount_cents=round(amount * 100),
        category=category.strip(),
        date=transaction_date,
        note=note.strip(),
    )
    database.add(transaction)
    database.commit()
    database.refresh(transaction)
    return transaction


def delete_transaction(database: Session, user: User, transaction_id: int, kind: str) -> None:
    transaction = database.scalar(
        select(Transaction).where(
            Transaction.id == transaction_id,
            Transaction.user_id == user.id,
            Transaction.kind == kind,
        )
    )
    if transaction is None:
        return
    database.delete(transaction)
    database.commit()
