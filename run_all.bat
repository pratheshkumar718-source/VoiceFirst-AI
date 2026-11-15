@echo off
cd /d "%~dp0"
title VoiceFirst AI - Application Server
echo ====================================================
echo Starting VoiceFirst AI Backend & Frontend Servers...
echo ====================================================

start "VoiceFirst Backend (Port 8000)" cmd /k "cd /d ""%~dp0"" && backend\venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend"
start "VoiceFirst Frontend (Port 5173)" cmd /k "cd /d ""%~dp0frontend"" && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo Servers are running in separate windows:
echo - Frontend: http://localhost:5173/
echo - Backend:  http://127.0.0.1:8000/api/health
echo.
timeout /t 3 >nul
start http://localhost:5173
