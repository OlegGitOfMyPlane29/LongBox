@echo off
cd /d %~dp0
node zapusk.js
if errorlevel 1 (
  echo.
  echo Не удалось запустить проект. Проверьте ошибки выше.
  pause
)
