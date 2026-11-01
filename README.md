# SmartSpend — Expense & Savings Tracker

A full-stack personal finance tracker built with **React + Vite** and a **FastAPI + SQLite** backend. The dashboard includes demo data, a six-month spending chart, monthly budgets, savings goals, and transaction management.

Savings goals include illustrated goal types (travel, emergency fund, home, education, vehicle, and personal), target dates, progress percentages, contributions, and goal deletion. The goals page also summarizes total saved, combined targets, and overall progress. These sample illustrations are original local SVG assets, so they do not depend on third-party image hosts.

## Project structure

```text
frontend/
  public/                 App icons and local illustrations
    goals/                Goal-specific SVG artwork
  src/
    assets/               Images and icons
    components/           Shared React components
    pages/                Login, dashboard, expenses, income, savings, budget, reports
    context/               Authentication state
    services/              Backend API client
    App.jsx
    main.jsx
    index.css
  package.json
  vite.config.js
backend/
  app/
    database/              SQLite connection and SQLAlchemy models
    schemas/               Pydantic request/response validation
    routes/                 Authentication and finance API routes
    services/               Authentication, transaction, and savings logic
    utils/                  Password hashing and signed access tokens
    main.py
  requirements.txt
README.md
```

## GitHub Pages showcase

The GitHub Actions workflow publishes a **frontend-only interactive showcase**. It uses sample data stored in the visitor’s browser and does not connect to the Python API or store real account information. Your full backend remains available for local development; Pages does not run Python services.

1. Push this project to a GitHub repository on the `main` or `master` branch.
2. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
3. Open **Actions** and wait for **Deploy SmartSpend showcase** to finish.
4. Find the live Pages URL under **Settings → Pages**. For a repository named `Smart-Expense-Savings-Tracker`, the URL is typically `https://YOUR-USERNAME.github.io/Smart-Expense-Savings-Tracker/`.

The source repository can remain private if your GitHub plan permits Pages for private repositories. The published page is separate from the source-repository visibility; check the Pages access settings before sharing the URL. If your account does not offer Pages for this private repository, make the repository public or choose a host that supports your preferred private-source setup.

The showcase sign-in is intentionally simulated: use `demo@smartspend.com` / `Demo123!`, or create a preview account. Any changes are stored only in that browser. The banner’s **Reset demo** action clears the showcase data on that device.

For a fully connected public app with real accounts and the Python API, deploy the frontend and backend to web hosting instead of GitHub Pages, then point the frontend’s `VITE_API_URL` at the hosted backend API.

## Run locally

Use two terminals from the project root.

**Backend (Python 3.10+):**

```powershell
cd backend
Copy-Item .env.example .env
# Set SECRET_KEY in .env to a unique random value of at least 32 characters.
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8001
```

**Frontend (Node.js 20+):**

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open the frontend at [http://localhost:5173](http://localhost:5173). API documentation is at [http://localhost:8001/docs](http://localhost:8001/docs). The backend root at [http://localhost:8001](http://localhost:8001) displays a small status message; it is not the frontend.

## Demo sign-in

- **Email:** `demo@smartspend.com`
- **Password:** `Demo123!`

The demo account and sample transactions are created automatically on the first backend start. Data is stored locally in `backend/data/smartspend.db`.

## Security before deployment

The local `.env` files are ignored by Git; use the `.env.example` files as templates. The Vite development server proxies `/api` requests to the backend on port 8001, avoiding browser CORS issues when the frontend is opened using a different local address. Replace `SECRET_KEY` in `backend/.env` with a unique random value of at least 32 characters and configure production CORS origins before deployment. Never commit production credentials. Passwords are stored as salted scrypt hashes; API routes require a signed bearer token.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current account |
| GET/POST | `/api/expenses` | List or add expenses |
| DELETE | `/api/expenses/{id}` | Remove an expense |
| GET/POST | `/api/income` | List or add income |
| DELETE | `/api/income/{id}` | Remove an income record |
| GET/POST | `/api/savings` | List or create savings goals |
| POST | `/api/savings/{id}/contributions` | Add to a savings goal |
| GET/PUT | `/api/budget?month=YYYY-MM` | View or update a monthly budget |
| GET | `/api/reports/dashboard?month=YYYY-MM` | Dashboard totals and spending trends |
