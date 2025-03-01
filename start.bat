@echo off
echo Starting Expense Tracker Application...

REM Start the backend server
start cmd /k "cd backend && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000"

REM Wait for backend to initialize
timeout /t 5

REM Start the frontend
start cmd /k "npm install && npm run dev"

echo Both servers are starting. Please wait...
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:5173 