@echo off
echo ========================================================
echo PataAI - Automatic Environment Setup and Server Launch
echo ========================================================
echo.

:: Move to script directory and ensure drive letter is changed
cd /d "%~dp0."
echo [System] Current Directory: %CD%

:: Verify python is installed
echo [System] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 goto nopython
echo [System] Python check passed.

:: Check if virtual environment exists
if exist "backend\.venv" goto activate_venv
echo [System] Creating Python virtual environment (.venv)...
python -m venv backend\.venv
if errorlevel 1 goto novenv

:activate_venv
:: Move to backend folder
cd backend

:: Check if requirements are already installed to save time
if exist ".venv\pip_installed.txt" (
    echo [System] Python requirements already installed. Skipping pip install.
    goto seed_check
)

echo [System] Installing requirements from requirements.txt...
.venv\Scripts\python.exe -m pip install --upgrade pip
.venv\Scripts\pip.exe install -r requirements.txt
if errorlevel 1 goto nopip
echo done > .venv\pip_installed.txt

:seed_check
:: Run database seeding only if database file doesn't exist
if exist "pata_ai.db" (
    echo [System] Database file pata_ai.db detected. Skipping database seeding.
    goto start_backend
)

echo [System] Seeding database with official pincodes dataset...
.venv\Scripts\python.exe seed_db.py
if errorlevel 1 echo [System] Warning: Seeding had some issues, starting server anyway...

:start_backend
echo.
echo ========================================================
echo Backend setup complete. Starting servers...
echo ========================================================
echo.

:: Launch FastAPI backend in a separate dedicated window, calling the venv python directly
echo [System] Starting FastAPI backend server on port 8000 in a new window...
start "PataAI Backend" .venv\Scripts\python.exe -m uvicorn app.main:app --port 8000

:: Pause briefly to allow FastAPI server to start listening (using internal loop to bypass PATH errors)
for /L %%i in (1,1,30000) do rem

:: Select Frontend Interface (Direct Launch Next.js Dev Mode)
echo [System] Checking for Node.js / NPM installation...
cmd /c npm --version >nul 2>&1
if not errorlevel 1 goto start_nextjs_dev

echo [System] NPM not detected on system PATH. Launching fallback static client...
start "" "%~dp0frontend\index.html"
goto docs_check

:start_nextjs_dev
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo [System] node_modules not found. Installing package dependencies...
    call cmd /c npm install --legacy-peer-deps --no-audit --no-fund
) else (
    echo [System] node_modules detected. Skipping npm install.
)
echo [System] Launching Next.js in hot-reloading development mode...
start /b cmd /c npm run dev
echo [System] Next.js starting at: http://localhost:3000
for /L %%i in (1,1,60000) do rem
start http://localhost:3000

:docs_check
:: Open FastAPI documentation as a secondary resource
start http://localhost:8000/docs
goto end

:nopython
echo.
echo [ERROR] Python is not installed or not added to your system PATH.
echo Please install Python 3.10+ and check "Add Python to PATH" during installation.
pause
exit /b 1

:novenv
echo.
echo [ERROR] Failed to create virtual environment.
pause
exit /b 1

:nopip
echo.
echo [ERROR] Failed to install dependencies. Check your internet connection.
pause
exit /b 1

:end
echo.
echo ========================================================
echo Servers are running. Do not close this terminal.
echo ========================================================
pause
