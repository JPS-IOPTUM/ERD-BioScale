@echo off
title Scale Space Synth - Dev Mode
echo.
echo ============================================
echo   SCALE SPACE SYNTH - DEV MODE
echo ============================================
echo.
echo Starting the live editor server.
echo Your browser should open automatically in a few seconds.
echo.
echo Edit src\app.js or src\app.css with any text editor.
echo Save the file. Browser refreshes by itself.
echo.
echo To stop: close this window.
echo ============================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js not found. Run 1-INSTALL.bat first.
  pause
  exit /b 1
)

cd /d "%~dp0..\.."

if not exist "node_modules" (
  echo It looks like you haven't run 1-INSTALL.bat yet.
  echo Doing that for you now...
  echo.
  call npm install
  if errorlevel 1 (
    echo Install failed. Check your internet connection.
    pause
    exit /b 1
  )
)

call npm run dev
pause
