@echo off
echo ======================================
echo   Firmware Flasher - Build Script
echo   Creating Self-Contained Executables
echo ======================================
echo.

REM Check if we're in the correct directory
if not exist package.json (
    echo Error: Please run this script from the electron-app directory
    exit /b 1
)

REM Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)

echo Node.js found
echo.

REM Check if dependencies are installed
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to install dependencies
        exit /b 1
    )
    echo.
)

REM Create assets directory if it doesn't exist
if not exist assets (
    echo Creating assets directory...
    mkdir assets
    echo Icon placeholder created > assets\README.txt
    echo.
)

echo Building self-contained Windows executable...
echo.

call npm run build:win

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================
    echo Build Complete!
    echo ======================================
    echo.
    echo Created files in dist/:
    dir /b dist\*.exe
    echo.
    echo Share with users:
    echo   - Firmware Flasher Setup X.X.X.exe  ^(Installer^)
    echo   - FirmwareFlasher-Portable-X.X.X.exe ^(No install^)
    echo.
    echo Users just:
    echo   1. Download the Portable.exe
    echo   2. Double-click to run
    echo   3. That's it!
    echo.
) else (
    echo Build failed
    exit /b 1
)

pause
