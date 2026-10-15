@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   BIDBULL EMERGENCY KILL SWITCH AND CLEANUP
echo ===================================================
echo.

echo [1/4] Stopping Docker Compose containers...
where docker >nul 2>&1
if %ERRORLEVEL% equ 0 (
    docker compose down --remove-orphans >nul 2>&1
    echo       Docker containers stopped cleanly.
) else (
    echo       Docker CLI not found or not in PATH, skipping.
)

echo.
echo [2/4] Terminating processes on application ports (3000, 8000)...
for %%P in (3000 8000 9090 3001) do (
    for /f "tokens=5" %%a in ('netstat -a -n -o 2^>nul ^| findstr :%%P ^| findstr LISTENING') do (
        echo       Killing process %%a on port %%P...
        taskkill /F /PID %%a >nul 2>&1
    )
)

echo.
echo [3/4] Terminating dangling Uvicorn and Pytest runners...
taskkill /F /IM uvicorn.exe >nul 2>&1
taskkill /F /IM pytest.exe >nul 2>&1

echo.
echo [4/4] Verifying port availability...
for %%P in (3000 8000) do (
    netstat -a -n -o 2>nul | findstr :%%P | findstr LISTENING >nul
    if !ERRORLEVEL! equ 0 (
        echo       [WARNING] Port %%P is still in use.
    ) else (
        echo       [OK] Port %%P is free.
    )
)

echo.
echo ===================================================
echo   ALL BIDBULL PROCESSES AND CONTAINERS TERMINATED
echo ===================================================
echo.
pause
