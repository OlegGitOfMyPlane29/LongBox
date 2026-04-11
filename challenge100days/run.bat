@echo off
setlocal
cd /d %~dp0

if not exist ".venv" (
  python -m venv .venv
)

call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r backend\requirements.txt
cd backend
alembic upgrade head
cd ..

start "challenge100days backend" cmd /k "cd /d %~dp0backend && ..\.venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
start "challenge100days frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

timeout /t 5 > nul
start "" http://localhost:5173
