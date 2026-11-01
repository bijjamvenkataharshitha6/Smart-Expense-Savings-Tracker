from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models import SavingsGoal, User


def list_goals(database: Session, user: User) -> list[SavingsGoal]:
    return list(database.scalars(select(SavingsGoal).where(SavingsGoal.user_id == user.id).order_by(SavingsGoal.id)))


def add_contribution(database: Session, user: User, goal_id: int, amount: float) -> SavingsGoal | None:
    goal = database.scalar(
        select(SavingsGoal).where(SavingsGoal.id == goal_id, SavingsGoal.user_id == user.id)
    )
    if goal is None:
        return None
    goal.saved_cents += round(amount * 100)
    database.commit()
    database.refresh(goal)
    return goal


def delete_goal(database: Session, user: User, goal_id: int) -> bool:
    goal = database.scalar(
        select(SavingsGoal).where(SavingsGoal.id == goal_id, SavingsGoal.user_id == user.id)
    )
    if goal is None:
        return False
    database.delete(goal)
    database.commit()
    return True
