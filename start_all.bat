@echo off
echo ==========================================
echo Kozam Project Startup Script
echo ==========================================

echo [1/3] Starting AI Server (Python/FastAPI) on port 8000...
start "Kozam AI Server" cmd /k "cd ai && python main.py"

echo [2/3] Starting Backend Server (Node.js/Express) on port 3000...
start "Kozam Backend Server" cmd /k "cd server && npm start"

echo [3/3] Starting Frontend Client (React/Vite) on port 5173...
start "Kozam Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo ------------------------------------------
echo All services are starting in separate windows.
echo - AI Server: http://localhost:8000
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:5173
echo ------------------------------------------
pause
