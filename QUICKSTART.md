# FinLens AI - Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))

## Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   - Windows: `venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Create .env file**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your GEMINI_API_KEY
   # GEMINI_API_KEY=your_actual_api_key_here
   ```

6. **Run the backend server**
   ```bash
   python main.py
   ```

   Backend will run on: http://localhost:8000
   API Docs: http://localhost:8000/docs

## Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create .env.local file** (optional)
   ```bash
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Frontend will run on: http://localhost:3000

## Testing the Application

1. **Start both servers** (backend on :8000, frontend on :3000)

2. **Open browser** to http://localhost:3000

3. **Add an expense**:
   - Click "+ Add Expense"
   - Enter amount and description (e.g., "Lunch at McDonald's")
   - Watch AI suggest category in real-time
   - Submit and see it in the list with confidence badge

4. **Test AI categorization**:
   - Try: "Uber ride to work" → Should suggest Transportation
   - Try: "Netflix subscription" → Should suggest Entertainment
   - Try: "Doctor visit" → Should suggest Healthcare

5. **Check API docs** at http://localhost:8000/docs
   - Explore all endpoints
   - Test categorization endpoint directly

## Troubleshooting

**Backend won't start**:
- Check if Python virtual environment is activated
- Verify GEMINI_API_KEY is set in .env file
- Check if port 8000 is available

**Frontend shows connection errors**:
- Ensure backend is running on port 8000
- Check CORS settings in backend/main.py
- Verify API_URL in frontend/.env.local

**AI categorization not working**:
- Verify Gemini API key is valid
- Check backend logs for API errors
- Try regex-matched categories first (e.g., "uber", "netflix")

## Next Steps

- Add more expenses to test the system
- Explore the API documentation
- Check the audit log in the database (finlens.db)
- Review confidence scores on categorized expenses

## Project Structure

```
ai-finance-assistant/
├── backend/          # FastAPI backend
│   ├── main.py      # Entry point
│   ├── database.py  # SQLite schema
│   ├── models.py    # Pydantic models
│   ├── services/    # AI services
│   └── routes/      # API endpoints
│
├── frontend/        # Next.js frontend
│   ├── app/         # Pages
│   ├── components/  # React components
│   └── lib/         # Utilities
│
└── README.md        # Full documentation
```

## Demo Features

✅ **Hybrid AI Categorization** - Regex first, AI fallback  
✅ **Confidence Scoring** - Visual indicators (High/Medium/Low)  
✅ **Real-time Suggestions** - As you type descriptions  
✅ **Manual Override** - Full user control  
✅ **Audit Logging** - Every AI decision tracked  
✅ **Responsive Design** - Works on all devices  

Enjoy exploring FinLens AI! 🚀
