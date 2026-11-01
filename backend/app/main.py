import os
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.database.connection import BACKEND_DIR, Base, SessionLocal, engine
from app.database.models import Budget, SavingsGoal, Transaction, User
from app.routes import auth, budget, expense, income, reports, savings
from app.utils.security import hash_password

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI(
    title="SmartSpend API",
    description="A personal expense, income, budget, and savings tracker.",
    version="1.0.0",
)

origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(expense.router, prefix="/api")
app.include_router(income.router, prefix="/api")
app.include_router(savings.router, prefix="/api")
app.include_router(budget.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


def seed_demo_account() -> None:
    with SessionLocal() as database:
        demo = database.scalar(select(User).where(User.email == "demo@smartspend.com"))
        if demo:
            return

        demo = User(
            full_name="Alex Morgan",
            email="demo@smartspend.com",
            password_hash=hash_password("Demo123!"),
        )
        database.add(demo)
        database.flush()
        today = date.today()
        sample_transactions = [
            ("Apartment rent", 125000, "expense", "Housing", 2, "Monthly rent"),
            ("Monthly salary", 420000, "income", "Salary", 3, "Payday"),
            ("Weekly groceries", 6842, "expense", "Groceries", 5, "Fresh market"),
            ("Coffee with Maya", 1280, "expense", "Dining", 7, ""),
            ("Freelance project", 85000, "income", "Side income", 9, "Website project"),
            ("Metro pass", 4200, "expense", "Transport", 11, "Monthly pass"),
            ("Streaming subscription", 1599, "expense", "Entertainment", 13, ""),
            ("Dinner out", 3650, "expense", "Dining", 15, "Friday night"),
            ("Electricity bill", 5860, "expense", "Utilities", 17, ""),
            ("Savings transfer", 25000, "expense", "Savings", 19, "Automatic transfer"),
            ("Bookshop", 2475, "expense", "Shopping", 21, "New reads"),
        ]
        for description, cents, kind, category, day, note in sample_transactions:
            transaction_date = today.replace(day=min(day, 28))
            database.add(Transaction(
                user_id=demo.id,
                kind=kind,
                description=description,
                amount_cents=cents,
                category=category,
                date=transaction_date,
                note=note,
            ))
        database.add_all([
            SavingsGoal(user_id=demo.id, name="Summer getaway", target_cents=250000, saved_cents=145000, due_date=today + timedelta(days=210), icon="plane"),
            SavingsGoal(user_id=demo.id, name="Emergency fund", target_cents=500000, saved_cents=320000, due_date=today + timedelta(days=420), icon="shield"),
            Budget(user_id=demo.id, month=today.strftime("%Y-%m"), amount_cents=300000),
        ])
        database.commit()


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    secret = os.getenv("SECRET_KEY", "")
    if len(secret) < 32:
        raise RuntimeError("Configure a unique SECRET_KEY (at least 32 characters) in backend/.env.")
    seed_demo_account()


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.get("/", include_in_schema=False)
def api_home():
    return {
        "message": "SmartSpend API is running.",
        "frontend": "http://localhost:5173",
        "documentation": "/docs",
    }


@app.get("/favicon.ico", include_in_schema=False)
def api_favicon():
    return Response(status_code=204)
