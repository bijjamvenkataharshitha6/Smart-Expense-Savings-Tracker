from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import User
from app.schemas.user_schema import UserCreate
from app.utils.security import create_access_token, decode_access_token, hash_password, verify_password

bearer_scheme = HTTPBearer(auto_error=False)


def get_user_by_email(database: Session, email: str) -> User | None:
    return database.scalar(select(User).where(User.email == email.lower()))


def register_user(database: Session, details: UserCreate) -> User:
    email = str(details.email).lower()
    if get_user_by_email(database, email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")
    user = User(full_name=details.full_name.strip(), email=email, password_hash=hash_password(details.password))
    database.add(user)
    database.commit()
    database.refresh(user)
    return user


def authenticate_user(database: Session, email: str, password: str) -> User:
    user = get_user_by_email(database, email)
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email or password is incorrect.")
    return user


def issue_auth_response(user: User) -> dict[str, object]:
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": user,
    }


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    database: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = decode_access_token(credentials.credentials)
    user = database.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found.")
    return user
