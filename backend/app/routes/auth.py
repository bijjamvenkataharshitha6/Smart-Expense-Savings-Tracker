from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User
from app.schemas.user_schema import AuthResponse, UserCreate, UserLogin, UserRead
from app.services.auth_service import authenticate_user, get_current_user, issue_auth_response, register_user

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(details: UserCreate, database: Session = Depends(get_db)):
    user = register_user(database, details)
    return issue_auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(details: UserLogin, database: Session = Depends(get_db)):
    user = authenticate_user(database, str(details.email).lower(), details.password)
    return issue_auth_response(user)


@router.get("/me", response_model=UserRead)
def current_profile(user: User = Depends(get_current_user)):
    return user
