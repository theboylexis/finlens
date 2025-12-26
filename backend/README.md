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
