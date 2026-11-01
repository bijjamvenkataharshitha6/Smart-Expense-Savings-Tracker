from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import SavingsGoal, User
from app.schemas.savings_schema import ContributionCreate, SavingsCreate, SavingsRead
from app.services.auth_service import get_current_user
from app.services.savings_service import add_contribution, delete_goal, list_goals

router = APIRouter(prefix="/savings", tags=["savings"])


@router.get("", response_model=list[SavingsRead])
def savings(user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    return list_goals(database, user)


@router.post("", response_model=SavingsRead, status_code=status.HTTP_201_CREATED)
def create_goal(details: SavingsCreate, user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    goal = SavingsGoal(
        user_id=user.id,
        name=details.name.strip(),
        target_cents=round(details.target * 100),
        due_date=details.due_date,
        icon=details.icon,
    )
    database.add(goal)
    database.commit()
    database.refresh(goal)
    return goal


@router.post("/{goal_id}/contributions", response_model=SavingsRead)
def contribute(goal_id: int, details: ContributionCreate, user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    goal = add_contribution(database, user, goal_id, details.amount)
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found.")
    return goal


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_goal(goal_id: int, user: User = Depends(get_current_user), database: Session = Depends(get_db)):
    if not delete_goal(database, user, goal_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Savings goal not found.")
    return None
