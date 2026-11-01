import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")


class Base(DeclarativeBase):
    """Base class for application database models."""


database_url = os.getenv("DATABASE_URL", f"sqlite:///{BACKEND_DIR / 'data' / 'smartspend.db'}")
if database_url.startswith("sqlite:///"):
    sqlite_path = database_url.removeprefix("sqlite:///")
    if sqlite_path != ":memory:" and not Path(sqlite_path).is_absolute():
        database_path = BACKEND_DIR / sqlite_path
        database_path.parent.mkdir(parents=True, exist_ok=True)
        database_url = f"sqlite:///{database_path.as_posix()}"

engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db():
    database = SessionLocal()
    try:
        yield database
    finally:
        database.close()
