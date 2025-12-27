# FinLens AI 💰

**Smart Personal Finance Assistant**

A full-stack personal finance application featuring intelligent expense categorization, natural language queries, budget tracking, and financial goal management.

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)

## 🎯 Overview

FinLens AI helps users take control of their finances with:

- **Hybrid Categorization System** — Regex + LLM for accurate expense classification
- **SQL-First Architecture** — Pre-defined query templates for security and reliability
- **Transparent Decisions** — Confidence scores and explanations for every categorization
- **Comprehensive Logging** — Full audit trail of all operations

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

### Expense Categorization Flow

1. **User Input** → Expense description entered
2. **Regex Engine** → Fast, deterministic pattern matching (95% confidence)
3. **AI Fallback** → Gemini handles edge cases when regex fails
4. **Confidence Scoring** → Visual High/Medium/Low indicators
5. **User Override** → Manual confirmation option available
6. **Audit Trail** → Full traceability maintained

## 🚀 Tech Stack

### Frontend

| Technology                                                                                                       | Purpose                       |
| ---------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| ![Next.js](https://img.shields.io/badge/Next.js_14-000?style=flat-square&logo=nextdotjs)                         | App Router, Server Components |
| ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)  | Type Safety                   |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white) | Styling                       |
| ![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=flat-square)                                      | Data Visualization            |

### Backend

| Technology                                                                                                | Purpose                    |
| --------------------------------------------------------------------------------------------------------- | -------------------------- |
| ![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)    | REST API Framework         |
| ![Python](https://img.shields.io/badge/Python_3.10+-3776AB?style=flat-square&logo=python&logoColor=white) | Backend Language           |
| ![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)       | Database                   |
| ![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=flat-square)                               | Data Validation            |
| ![Gemini](https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat-square&logo=google&logoColor=white)    | Intelligent Categorization |

## 📦 Project Structure

```
finlens/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   └── lib/                 # Utilities & API client
│
├── backend/                 # FastAPI application
│   ├── main.py             # Application entry point
│   ├── database.py         # Database schema & connection
│   ├── models.py           # Pydantic schemas
│   ├── services/           # Business logic
│   │   ├── categorizer.py  # Hybrid categorization engine
│   │   ├── query_engine.py # Natural language processor
│   │   └── gemini_client.py # AI integration
│   └── routes/             # API endpoints
│
└── README.md
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

→ Runs on http://localhost:3000

### Backend Setup

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
# Add your GEMINI_API_KEY

python main.py
```

→ Runs on http://localhost:8000  
→ API Docs: http://localhost:8000/docs

## ✨ Features

### 🏷️ Smart Categorization

- Regex-first approach for speed and accuracy
- AI fallback for complex edge cases
- Confidence indicators (High/Medium/Low)
- User override with audit trail

### 💬 Natural Language Queries

- Ask questions about spending in plain English
- Secure SQL template selection (no injection risk)
- Clear explanations with data citations

### 📊 Budget Management

- Category-based budget allocation
- Real-time burn rate tracking
- Daily allowance calculations
- Proactive spending alerts

### 🎯 Financial Goals

- Create and track savings goals
- Contribution history
- Progress visualization

### 👥 Expense Splitting

- Split bills with friends
- Track balances owed
- Settlement tracking

### 📈 Analytics Dashboard

- Spending trends over time
- Category breakdowns
- Weekly spending heatmaps
- Visual insights

## 🔒 Security

### SQL Injection Prevention

```python
# Template-based queries only
template = select_template(intent)
params = extract_params(user_query)
result = execute_safe_query(template, params)
```

### Confidence-Based Actions

| Confidence      | Action                  |
| --------------- | ----------------------- |
| High (>80%)     | Auto-apply ✅           |
| Medium (50-80%) | Apply with flag ⚠️      |
| Low (<50%)      | Require confirmation ❓ |

## 🚧 Future Enhancements

- [ ] Bank account integration (Plaid)
- [ ] Multi-currency support
- [ ] Recurring expense detection
- [ ] Mobile app (React Native)
- [ ] CSV/PDF export
- [ ] PostgreSQL migration for scale

## 📝 License

MIT License

## 👤 Author

**Alex Marfo**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/theboylexis)

---

⭐ Star this repo if you find it useful!
