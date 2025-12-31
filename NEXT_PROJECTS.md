# 🚀 Next Portfolio Projects

Two high-impact projects to complement FinLens AI for internship preparation.

---

## Project 1: StudyLens AI — RAG-Powered Study Assistant

### Overview
A study assistant that uses Retrieval-Augmented Generation (RAG) to help students learn from their own materials. Users upload notes/PDFs and can ask questions that are answered using their specific content.

### Why It Stands Out
- **RAG is the hottest AI pattern in 2025**
- Demonstrates understanding of **vector databases** and **embeddings**
- Directly useful for students (relatable to recruiters)
- Shows a different AI pattern than FinLens

### Core Features

| Feature | Tech Skills Demonstrated |
|---------|-------------------------|
| Upload PDFs/notes → AI summarizes | Document processing, file handling |
| Ask questions about YOUR materials | RAG pipeline, vector search |
| Auto-generate flashcards from content | LLM output structuring |
| Spaced repetition tracking | Algorithm implementation |
| Study session analytics | Data visualization |

### Tech Stack

```
Frontend:  Next.js 14 + TypeScript + TailwindCSS
Backend:   FastAPI + Python
Vector DB: Pinecone or ChromaDB (FREE tier available)
AI:        Gemini API with embeddings
Database:  PostgreSQL (user data, flashcards)
Storage:   Cloudinary or S3 (PDF storage)
```

### Key Technical Challenges

1. **Document Chunking**: Split PDFs into meaningful chunks (not just by page)
2. **Embedding Generation**: Convert text chunks to vectors
3. **Semantic Search**: Find relevant chunks for user questions
4. **Context Window Management**: Feed relevant context to LLM

### API Endpoints to Build

```
POST   /api/documents/upload     - Upload PDF/notes
GET    /api/documents/           - List user documents
DELETE /api/documents/:id        - Delete document

POST   /api/chat/ask             - Ask question (RAG query)
GET    /api/chat/history         - Get chat history

POST   /api/flashcards/generate  - Generate from document
GET    /api/flashcards/          - List flashcards
POST   /api/flashcards/:id/review - Mark reviewed (spaced rep)

GET    /api/analytics/study-time - Study session stats
```

### Interview Talking Point

> "I built a RAG-based study assistant where users upload their notes and can ask questions. I chunked documents, created embeddings with Gemini, stored them in a vector database, and used semantic search to provide relevant context to the LLM for accurate answers."

### Resources to Learn

- [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/)
- [ChromaDB Getting Started](https://docs.trychroma.com/getting-started)
- [Pinecone Free Tier](https://www.pinecone.io/)
- [PyPDF2 for PDF Processing](https://pypdf2.readthedocs.io/)

### Estimated Timeline: 5-6 weeks

---

## Project 2: ApplyAI — Smart Internship Tracker

### Overview
An intelligent application tracker that uses AI to analyze job descriptions, match them against your resume, generate tailored cover letters, and track your application pipeline.

### Why It Stands Out
- **Directly relevant** to internship search (meta!)
- Shows **practical AI automation** beyond chatbots
- Recruiters love tools that solve real problems
- You can literally use it for YOUR applications

### Core Features

| Feature | Tech Skills Demonstrated |
|---------|-------------------------|
| Track applications (company, role, status) | Full CRUD, state management |
| Upload resume → AI extracts skills | PDF parsing, NLP |
| Paste job description → AI match score | Text similarity, embeddings |
| AI generates tailored cover letters | Prompt engineering |
| Application analytics dashboard | Charts, insights |
| Email reminders for follow-ups | Background jobs, scheduling |
| Interview prep questions | Context-aware generation |

### Tech Stack

```
Frontend:  Next.js 14 + TypeScript + TailwindCSS
Backend:   FastAPI + Python
AI:        Gemini API for text analysis
Database:  PostgreSQL
Jobs:      APScheduler or Celery (background tasks)
Email:     Resend or SendGrid (reminders)
Auth:      JWT (same as FinLens)
```

### Key Technical Challenges

1. **Resume Parsing**: Extract structured data from PDF resumes
2. **Skills Matching**: Compare job requirements vs resume skills
3. **Cover Letter Generation**: Tailored, not generic output
4. **Pipeline Analytics**: Kanban-style tracking with insights

### API Endpoints to Build

```
# Applications
POST   /api/applications/           - Create application
GET    /api/applications/           - List all applications
PATCH  /api/applications/:id        - Update status
DELETE /api/applications/:id        - Delete application

# Resume
POST   /api/resume/upload           - Upload resume PDF
GET    /api/resume/skills           - Get extracted skills
PUT    /api/resume/skills           - Update skills manually

# AI Features
POST   /api/ai/match-score          - Get job match score
POST   /api/ai/cover-letter         - Generate cover letter
POST   /api/ai/interview-prep       - Generate interview Qs

# Analytics
GET    /api/analytics/pipeline      - Application funnel
GET    /api/analytics/response-rate - Response statistics

# Reminders
POST   /api/reminders/              - Set follow-up reminder
GET    /api/reminders/upcoming      - Get upcoming reminders
```

### Database Schema

```sql
-- applications table
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    company VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    job_url TEXT,
    job_description TEXT,
    status VARCHAR(20) DEFAULT 'applied',  -- applied, interviewing, offered, rejected
    match_score FLOAT,
    applied_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- reminders table
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    remind_at TIMESTAMP NOT NULL,
    message TEXT,
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- resume_skills table
CREATE TABLE resume_skills (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    skill VARCHAR(50) NOT NULL,
    category VARCHAR(30),  -- technical, soft, language
    proficiency VARCHAR(20)  -- beginner, intermediate, advanced
);
```

### Interview Talking Point

> "I built an internship tracker that uses AI to analyze job descriptions against my resume and generates a match score based on skill overlap. It also auto-generates tailored cover letters and sends me reminders to follow up. I'm actually using it to track this application!"

### Bonus Features (If Time Permits)

- [ ] Chrome extension to save jobs from LinkedIn/Indeed
- [ ] Salary insights via public APIs (Glassdoor, Levels.fyi)
- [ ] GitHub integration to showcase relevant projects
- [ ] Email parsing to auto-update application status

### Estimated Timeline: 4-5 weeks

---

## 📊 Portfolio Trifecta Strategy

| Project | AI Pattern | Domain | Key Skill |
|---------|-----------|--------|-----------|
| **FinLens AI** | Hybrid (Regex + LLM) | FinTech | SQL security, payments |
| **StudyLens AI** | RAG + Embeddings | EdTech | Vector databases |
| **ApplyAI** | NLP + Generation | Productivity | Document processing |

### Why This Combination Works

1. **Different AI patterns** — Shows breadth, not just "ChatGPT wrappers"
2. **Different domains** — FinTech, EdTech, Productivity
3. **Same tech stack** — Faster development, deeper expertise
4. **All practical** — Real tools people would actually use

---

## ⏱️ Recommended Timeline

| Month | Focus |
|-------|-------|
| **January 2025** | Build StudyLens AI (RAG is the hottest skill right now) |
| **February 2025** | Build ApplyAI (and use it for YOUR applications!) |
| **March 2025** | Polish all three projects, deploy, start applying |

---

## 💡 Pro Tips

1. **Deploy Everything**: Use Vercel (frontend) + Render/Railway (backend)
2. **Add Demo Data**: Pre-populate with realistic examples for demos
3. **Record Videos**: 2-min Loom walkthrough for each project
4. **Write Case Studies**: Blog post explaining your technical decisions
5. **Use ApplyAI**: Track your real applications — it's a great interview story!

---

## 🎯 Interview Power Move

When you finish ApplyAI, actually use it. In interviews, say:

> "I'm literally using my own app to track this application. It gave me an 87% match score for this role based on my skills."

That's **unforgettable**. 🚀
