@echo off
title VoiceFirst AI - Launcher
echo ===================================================
echo             VoiceFirst AI - Starting
echo ===================================================
echo.
echo 1. Starting FastAPI Backend on port 8000...
start "VoiceFirst Backend" /min cmd /c "cd /d "%~dp0" && backend\venv\Scripts\uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --app-dir backend"

echo 2. Starting Vite Frontend on port 5173...
start "VoiceFirst Frontend" /min cmd /c "cd /d "%~dp0\frontend" && npm.cmd run dev -- --host 127.0.0.1 --port 5173"

echo 3. Waiting for servers to initialize...
timeout /t 3 /nobreak >nul

echo 4. Opening VoiceFirst AI in your browser...
start http://127.0.0.1:5173/

echo.
echo VoiceFirst AI is now running at: http://127.0.0.1:5173/
echo (Keep this terminal open or close it when done)
echo ===================================================
pause

