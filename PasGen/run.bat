@echo off
echo === PasGen V1 ===
echo Checking dependencies...
pip install -r requirements.txt --quiet 2>nul
echo.
echo Starting server...
echo Open in browser: http://localhost:5000
echo Press Ctrl+C to stop.
echo.
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:5000"
python app.py
pause
