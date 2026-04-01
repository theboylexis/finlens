# FinLens AI 💰

**Smart Personal Finance Assistant**

A full-stack personal finance application featuring intelligent expense categorization, natural language queries, budget tracking, financial goal management, income tracking, subscription management, and gamified savings — powered by Google Gemini AI.

[![Live Demo](https://img.shields.io/badge/Live_Demo-finlens--beta.vercel.app-00C853?style=for-the-badge&logo=vercel&logoColor=white)](https://finlens-chi.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 🎯 Overview

FinLens AI helps users take control of their finances with:

- **Hybrid Categorization System** — Regex + LLM for accurate expense classification
- **SQL-First Architecture** — Pre-defined query templates for security and reliability
- **Transparent Decisions** — Confidence scores and explanations for every categorization
- **JWT Authentication** — Secure user accounts with bcrypt password hashing
- **Smart Nudges & Gamification** — Streaks, achievements, and behavioral nudges to build healthy habits
- **Comprehensive Logging** — Full audit trail of all operations

## 🏗️ Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Next.js   │─────▶│   FastAPI    │─────▶│  PostgreSQL  │
│   Frontend  │      │   Backend    │      │  (prod) /    │
│  (Vercel)   │      │  (Render /   │      │  SQLite      │
│             │      │   Railway)   │      │  (local dev) │
└─────────────┘      └──────────────┘      └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Gemini AI   │
                     │  (Fallback)  │
                     └──────────────┘
```

### Expense Categorization Flow

1. **User Input** → Expense description entered
2. **Regex Engine** → Fast, deterministic pattern matching (95% confidence)
3. **AI Fallback** → Gemini handles edge cases when regex fails
4. **Confidence Scoring** → Visual High/Medium/Low indicators
5. **User Override** → Manual confirmation option available
6. **Audit Trail** → Full traceability maintained

## 🚀 Tech Stack

### Frontend

| Technology | Purpose |
| --- | --- |
| ![Next.js](https://img.shields.io/badge/Next.js_16-000?style=flat-square&logo=nextdotjs) | App Router, Server Components |
| ![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black) | UI Framework |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Type Safety |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Styling |
| ![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=flat-square) | Data Visualization |
| ![Lucide](https://img.shields.io/badge/Lucide_React-F56565?style=flat-square) | Icons |

### Backend

| Technology | Purpose |
| --- | --- |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white) | REST API Framework |
| ![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white) | Backend Language |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) | Production Database |
| ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white) | Local Development Database |
| ![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=flat-square) | Data Validation |
| ![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat-square&logo=google&logoColor=white) | Intelligent Categorization & NL Queries |
| ![JWT](https://img.shields.io/badge/JWT-000000?style=flat-square&logo=jsonwebtokens&logoColor=white) | Authentication |
| ![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white) | Containerization |

## 📦 Project Structure

```
finlens/
├── frontend/                  # Next.js 16 application
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   │   ├── AppLayout.tsx      # Main layout with sidebar
│   │   ├── ExpenseForm.tsx    # Add/edit expenses
│   │   ├── ExpenseList.tsx    # Expense listing
│   │   ├── AlertsDropdown.tsx # Budget alert notifications
│   │   ├── SafeToSpendCard.tsx# Daily safe-to-spend widget
│   │   ├── IncomeModal.tsx    # Income entry
│   │   ├── WeeklySummaryCard.tsx
│   │   ├── OnboardingModal.tsx# New user onboarding
│   │   ├── QuickAddButton.tsx # Quick expense entry
│   │   ├── NudgeCard.tsx      # Smart financial nudges
│   │   ├── StreakCard.tsx     # Gamification streaks
│   │   └── UpcomingRenewalsCard.tsx
│   └── lib/                   # Utilities & API client
│
├── backend/                   # FastAPI application
│   ├── main.py               # Application entry point
│   ├── database.py           # Database schema & connection
│   ├── models.py             # Pydantic schemas
│   ├── dependencies.py       # Auth dependencies & middleware
│   ├── logger.py             # Structured logging
│   ├── services/             # Business logic
│   │   ├── categorizer.py    # Hybrid categorization engine
│   │   ├── query_engine.py   # Natural language query processor
│   │   ├── gemini_client.py  # Gemini AI integration
│   │   ├── auth.py           # JWT authentication service
│   │   └── alerts.py         # Budget alert service
│   ├── routes/               # API endpoints
│   │   ├── expenses.py       # Expense CRUD
│   │   ├── analytics.py      # Analytics & visualizations
│   │   ├── auth.py           # Login & registration
│   │   ├── budgets.py        # Budget management
│   │   ├── goals.py          # Savings goals
│   │   ├── income.py         # Income tracking
│   │   ├── splits.py         # Expense splitting
│   │   ├── subscriptions.py  # Subscription tracking
│   │   ├── alerts.py         # Alert management
│   │   ├── nudges.py         # Smart financial nudges
│   │   ├── gamification.py   # Streaks & achievements
│   │   ├── categories.py     # Category listing
│   │   └── queries.py        # NL query endpoints
│   └── tests/                # Test suite
│       ├── conftest.py       # Test fixtures
│       ├── test_api.py       # API integration tests
│       ├── test_categorizer.py # Categorizer unit tests
│       └── test_expenses_api.py # Expense endpoint tests
│
├── Dockerfile                 # Docker container config
├── docker-compose.yml         # Local PostgreSQL setup
├── railway.json               # Railway deployment config
├── railway.toml               # Railway build settings
├── render.yaml                # Render deployment config
├── CONTRIBUTING.md            # Contribution guidelines
├── FEATURES.md                # Detailed feature list
├── QUICKSTART.md              # Quick start guide
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Docker (optional, for local PostgreSQL)
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Quick Start (Local Development)

#### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — add your GEMINI_API_KEY and JWT_SECRET
```

**Option A: Use PostgreSQL via Docker (recommended)**
```bash
# From project root
docker compose up -d
# Sets up PostgreSQL at localhost:5432
```

**Option B: Use SQLite (zero-config)**
```bash
# The app auto-detects and falls back to SQLite if no DATABASE_URL is set
```

```bash
# Start the backend
python main.py
```

→ Runs on http://localhost:8000
→ API Docs: http://localhost:8000/docs

#### 2. Frontend Setup

```bash
cd frontend
npm install

# Optional: configure API URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

→ Runs on http://localhost:3000

### Running Tests

```bash
cd backend
pytest --cov
```

## ✨ Features

### 🔐 Authentication
- JWT-based authentication with bcrypt password hashing
- User registration and login
- Protected routes and per-user data isolation

### 🏷️ Smart Categorization
- Regex-first approach for speed and accuracy
- AI fallback (Gemini) for complex edge cases
- Confidence indicators (High/Medium/Low)
- In-memory caching to reduce API calls
- User override with audit trail

### 💬 Natural Language Queries
- **Hybrid query system** — data queries via SQL templates, conversational queries via Gemini AI
- Ask questions about spending in plain English
- Secure SQL template selection (no injection risk)
- AI-powered financial advice and planning
- Clear explanations with data citations

### 📊 Budget Management
- Category-based budget allocation
- Real-time burn rate tracking
- Daily allowance calculations
- Proactive spending alerts (50%, 80%, 100% thresholds)

### 🎯 Financial Goals
- Create and track savings goals
- Contribution history
- Progress visualization

### 💰 Income Tracking
- Log income sources
- Net savings calculations
- Income vs. expenses overview

### 📅 Subscription Management
- Track recurring subscriptions
- Upcoming renewal reminders
- Monthly subscription cost overview

### 👥 Expense Splitting
- Split bills with friends
- Track balances owed
- Settlement tracking

### 🔔 Smart Alerts & Nudges
- Budget threshold alerts with auto-tracking
- AI-powered financial nudges
- Behavioral spending insights

### 🏆 Gamification
- Expense logging streaks
- Savings achievements
- Engagement rewards

### 📈 Analytics Dashboard
- Spending trends over time
- Category breakdowns
- Weekly spending summaries
- Safe-to-spend calculations
- Visual insights with Recharts

## 🔒 Security

### SQL Injection Prevention

```python
# Template-based queries only — AI never generates SQL
template = select_template(intent)
params = extract_params(user_query)
result = execute_safe_query(template, params)
```

### Confidence-Based Actions

| Confidence | Action |
| --- | --- |
| High (>80%) | Auto-apply ✅ |
| Medium (50-80%) | Apply with flag ⚠️ |
| Low (<50%) | Require confirmation ❓ |

## 🚀 Deployment

The project is configured for deployment on multiple platforms:

| Component | Platform | Config |
| --- | --- | --- |
| Frontend | Vercel | Auto-detected from Next.js |
| Backend | Render | `render.yaml` |
| Backend | Railway | `railway.json` / `railway.toml` / `Dockerfile` |
| Database | Render PostgreSQL | `render.yaml` (free tier) |

### Environment Variables (Production)

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `JWT_SECRET` | ✅ | Secret key for JWT tokens |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `CORS_ORIGINS` | ✅ | Frontend URL for CORS |
| `CURRENCY_CODE` | ❌ | Currency code (default: `GHS`) |
| `CURRENCY_SYMBOL` | ❌ | Currency symbol (default: `GH₵`) |
| `AI_MODEL` | ❌ | Gemini model (default: `gemini-2.5-flash`) |

## 🚧 Future Enhancements

- [ ] Bank account integration (Plaid)
- [ ] Multi-currency support
- [ ] Recurring expense detection
- [ ] Mobile app (React Native)
- [ ] CSV/PDF export
- [ ] Receipt OCR via Gemini Vision
- [ ] E2E tests (Playwright)
- [ ] CI/CD pipeline

## 📝 License

MIT License

## 👤 Author

**Alex Marfo**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/theboylexis)

---

⭐ Star this repo if you find it useful!
