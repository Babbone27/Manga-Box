@echo off
set PORT=8000

echo Cerco una porta libera a partire dalla %PORT%...

:checkport
netstat -ano | findstr :%PORT% >nul
if %errorlevel% equ 0 (
    echo Porta %PORT% occupata, provo la successiva...
    set /a PORT=%PORT%+1
    goto checkport
)

echo Avvio Manga Box sulla porta %PORT%...

set PYTHON_CMD=python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    set PYTHON_CMD=python3
    python3 --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo [ERRORE] Python non trovato. Installa Python da python.org per avviare l'app.
        pause
        exit /b
    )
)

start "" "http://localhost:%PORT%"
%PYTHON_CMD% -m http.server %PORT%
