# FinLens AI

**AI-Powered Personal Finance Assistant** - Portfolio Project

A production-grade personal finance application demonstrating AI orchestration, data pipeline design, and engineering best practices.

## 🎯 Project Overview

FinLens AI is not just another CRUD app. It's an engineer-grade portfolio project showcasing:

- **Hybrid AI Systems**: Regex + LLM categorization (not blind AI trust)
- **SQL-First Architecture**: Pre-defined templates prevent AI-generated SQL
- **Transparent AI**: Every decision includes confidence scores and explanations
- **Comprehensive Audit Logging**: Full traceability of AI operations
- **Production Thinking**: Clear trade-offs between demo and production requirements

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Next.js   │─────▶│   FastAPI    │─────▶│   SQLite     │
│   Frontend  │      │   Backend    │      │   Database   │
└─────────────┘      └──────────────┘      └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Gemini AI   │
                     │  (Fallback)  │
                     └──────────────┘
```

### Data Flow: Expense Categorization

1. **User Input** → Expense description
2. **Regex Categorization** → Fast, deterministic (95% confidence)
3. **AI Fallback** → Gemini Pro (if regex fails)
4. **Confidence Scoring** → High/Medium/Low indicators
5. **User Override** → Manual confirmation option
6. **Audit Logging** → Full traceability

## 🚀 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS**
- **Recharts** (for visualizations)

### Backend
- **FastAPI** (Python)
- **SQLite** (async via aiosqlite)
- **Pydantic** (validation)
- **Google Gemini AI**

### Why These Choices?

- **SQLite over PostgreSQL**: Zero setup, easy demos, Postgres-ready schema
- **FastAPI over Express**: Native async, Pydantic validation, better AI integration
- **Fixed Categories**: Consistent AI training, simpler budget tracking
- **No Bank Integration**: Avoids security complexity in portfolio context

## 📦 Project Structure

```
ai-finance-assistant/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   └── lib/                 # Utilities
│
├── backend/                 # FastAPI application
│   ├── main.py             # App entry point
│   ├── database.py         # SQLite schema & connection
│   ├── models.py           # Pydantic schemas
│   ├── services/           # AI services
│   │   ├── categorizer.py  # Hybrid categorization
│   │   ├── query_engine.py # NL query processor
│   │   └── insight_engine.py # AI insights
│   └── routes/             # API endpoints
│
└── README.md               # This file
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:3000

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Unix/MacOS)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Add your GEMINI_API_KEY to .env

# Run server
python main.py
```

Backend runs on: http://localhost:8000
API Docs: http://localhost:8000/docs

## 🎨 Key Features

### 1. Hybrid AI Categorization
- **Regex First**: Fast, deterministic pattern matching
- **AI Fallback**: Gemini Pro for complex cases
- **Confidence Scores**: Visual indicators (High/Medium/Low)
- **User Override**: Manual confirmation with audit trail

### 2. Natural Language Queries
- Pre-defined SQL templates (security-first)
- Intent classification via AI
- Transparent explanations
- Data source citations

### 3. Budget Intelligence
- Category-based budgets
- Burn rate visualization
- Remaining daily allowance
- Smart alerts

### 4. Transparent AI Insights
- SQL-detected patterns
- AI-generated explanations
- Data source references
- Confidence scoring

### 5. User-Facing Audit Log
- "How FinLens categorized this"
- Model used & confidence
- Override capability
- Full traceability

## 🔒 AI Safety & Trust

### SQL Injection Prevention
```python
# ❌ NEVER: AI generates SQL
sql = gemini.generate(f"Create SQL for: {user_query}")

# ✅ ALWAYS: Template selection + binding
template = select_template(intent)
params = extract_params(user_query)
sql = template.bind(params)
```

### Confidence-Based Actions
- **High (>80%)**: Auto-apply with green indicator
- **Medium (50-80%)**: Apply with yellow flag
- **Low (<50%)**: Require manual confirmation

### Fallback Chain
```
User Input → Regex (deterministic)
          ↓ (no match)
          → Gemini AI (probabilistic)
          ↓ (low confidence)
          → Human Confirmation
```

## 📊 Demo Constraints

> **Note**: This is a portfolio demo, not a production app.

**Data Constraints**:
- Mock financial data (not real accounts)
- Limited to 100 expenses for performance
- Single-user mode (no authentication)

**AI Constraints**:
- Responses may be cached (cost control)
- Rate limited to 10 queries/minute
- Some insights pre-computed

**Feature Scope**:
- No bank account linking
- No multi-currency support
- Web-only (no mobile app)
- No real-time sync

## 🚧 What I'd Do Differently in Production

### With a Team, I'd Add:

**1. Bank Integrations**
- Plaid/Yodlee API for auto-sync
- Real-time balance updates
- Multi-account support

**2. Database Scaling**
- Migrate to PostgreSQL
- Redis for caching
- Read replicas for analytics

**3. Security Hardening**
- JWT authentication
- Row-level security (multi-tenancy)
- Encryption at rest
- Per-user rate limiting

**4. Advanced Features**
- Multi-currency support
- Recurring expense detection
- Bill payment reminders
- CSV/PDF export

**5. Production AI**
- Fine-tuned models
- A/B testing for accuracy
- User feedback loops
- Multi-provider fallbacks

**6. Observability**
- Structured logging
- APM monitoring
- Error tracking (Sentry)
- AI cost dashboards

**7. DevOps**
- CI/CD pipeline
- Automated testing
- Staging environment
- Database migrations

## 🎯 Portfolio Success Metrics

This project succeeds if a hiring manager can quickly identify:

✅ **Clear data flow** - Architecture diagrams  
✅ **AI safety controls** - Documented security model  
✅ **SQL-first logic** - No AI-generated queries  
✅ **Explainable outputs** - Every decision has "why"  
✅ **Realistic constraints** - Production trade-offs  
✅ **Clean documentation** - Answers "why" not just "what"  

## 🗣️ Interview Talking Points

1. **Hybrid AI Approach**: Why regex + LLM beats pure AI
2. **SQL Template Security**: Preventing injection attacks
3. **User-Facing Confidence**: Building trust through transparency
4. **Audit Logging**: Production-grade traceability
5. **Portfolio vs Production**: Understanding trade-offs

## 📝 License

MIT License - This is a portfolio project for educational purposes.

## 👤 Author

**Alex Marfo**  
Building production-ready systems, one commit at a time.

---

**Built with ❤️ to demonstrate engineering excellence**
