@echo off
cd /d "%~dp0"
start "صحيحتي" cmd /c "npm run dev -- --host"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173"
