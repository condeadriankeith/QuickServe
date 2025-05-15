@echo off
REM QuickServe Dashboard Launcher

REM Check for node_modules (install if missing)
IF NOT EXIST node_modules (
    echo Installing dependencies...
    npm install
)

REM Start backend server in new window
start "Backend Server" cmd /k "node server\server.js"

REM Start frontend (Vite dev server) in new window
start "Frontend (Vite)" cmd /k "npm run dev"

REM Wait for frontend to start (adjust if needed)
timeout /t 5 >nul

REM Open two browser tabs to the frontend
start "" "http://localhost:5173"
start "" "http://localhost:5173"

echo All done! You can log in as admin or server in each tab.
pause 