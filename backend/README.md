# FinLens AI Backend

FastAPI backend for FinLens AI - AI-Powered Personal Finance Assistant

## Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
venv\Scripts\activate
# Unix/MacOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000
```

## API Documentation

Once running, visit:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Expense Endpoints

- `POST /api/expenses` — Create a new expense
- `GET /api/expenses` — List all expenses
- `GET /api/expenses/{expense_id}` — Get a specific expense
- `PATCH /api/expenses/{expense_id}` — Update an expense
- `DELETE /api/expenses/{expense_id}` — Delete an expense
- `GET /api/expenses/suggest-category?description=...` — Suggest a category for an expense description

### Category Endpoints

- `GET /api/categories` — List all categories

### Analytics Endpoints

- `GET /api/analytics/summary` — Get analytics summary

### Auth Endpoints

- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Register

---

See Swagger UI at `/docs` for full details and request/response formats.

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── database.py             # Database connection & models
├── models.py               # Pydantic schemas
├── services/
│   ├── categorizer.py      # Hybrid expense categorization
│   ├── query_engine.py     # Natural language query processor
│   └── insight_engine.py   # AI insights generator
├── routes/
│   ├── expenses.py         # Expense CRUD endpoints
│   ├── analytics.py        # Analytics endpoints
│   └── queries.py          # NL query endpoints
└── finlens.db             # SQLite database
```

# Code Style and Comments

- Use descriptive variable and function names.
- Add comments for complex logic or important decisions.
- Keep functions small and focused.
- Follow PEP8 for Python and ESLint/Prettier for JavaScript/TypeScript.
