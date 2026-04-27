@echo off
setlocal
cd /d "%~dp0"

if not exist "backend\venv\Scripts\python.exe" (
  echo [run] Creating Python venv...
  py -3 -m venv backend\venv 2>nul
  if errorlevel 1 python -m venv backend\venv
)

call "%~dp0backend\venv\Scripts\activate.bat"
if errorlevel 1 (
  echo [run] Failed to activate venv.
  exit /b 1
)

echo [run] pip install backend...
python -m pip install -q -r "%~dp0backend\requirements.txt"
if errorlevel 1 exit /b 1

if not exist "%~dp0frontend\node_modules" (
  echo [run] npm install frontend...
  pushd "%~dp0frontend"
  call npm install
  if errorlevel 1 popd & exit /b 1
  popd
)

pushd "%~dp0backend"
if not defined DATABASE_URL set "DATABASE_URL=sqlite:///./challenge20days.db"
python -m alembic upgrade head
if errorlevel 1 popd & exit /b 1
popd

echo [run] Starting FastAPI and Vite...
start "challenge20days-api" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && if not defined DATABASE_URL set DATABASE_URL=sqlite:///./challenge20days.db && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 2 /nobreak >nul
start "challenge20days-web" cmd /k "cd /d %~dp0frontend && npm run dev"

echo [run] Откройте http://localhost:5173 (API: http://localhost:8000/docs)
endlocal
