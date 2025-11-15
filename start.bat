@echo off
REM DealScout Full Stack Startup Script for Windows
REM This script starts both the FastAPI backend and Next.js frontend

echo ========================================
echo   DealScout - AI Negotiation System
echo ========================================
echo.

REM Check if API key is set
if not defined OPENROUTER_API_KEY (
    echo WARNING: OPENROUTER_API_KEY environment variable is not set!
    echo Please set it before running the backend.
    echo.
    set /p API_KEY="Enter your OpenRouter API key (or press Enter to skip): "
    if not "!API_KEY!"=="" (
        set OPENROUTER_API_KEY=!API_KEY!
    )
)

echo.
echo [1/4] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Installing Frontend dependencies...
cd "frontend"
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install npm dependencies
        cd ..
        pause
        exit /b 1
    )
) else (
    echo npm packages already installed, skipping...
)
cd ..

echo.
echo [3/4] Starting FastAPI Backend on http://localhost:8000...
start "DealScout Backend" cmd /k "$env:OPENROUTER_API_KEY='%OPENROUTER_API_KEY%'; $env:PYTHONIOENCODING='utf-8'; python api_server.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo [4/4] Starting Next.js Frontend on http://localhost:3000...
cd "frontend"
start "DealScout Frontend" cmd /k "npm run dev"

cd ..

echo.
echo ========================================
echo   Services Started Successfully!
echo ========================================
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo.
echo   Press any key to open the frontend in your browser...
pause > nul

start http://localhost:3000

echo.
echo NOTE: Close the terminal windows to stop the services.
echo.
pause

