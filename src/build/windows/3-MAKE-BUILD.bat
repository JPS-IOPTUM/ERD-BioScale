@echo off
title Scale Space Synth - Make Build
echo.
echo ============================================
echo   SCALE SPACE SYNTH - MAKE BUILD
echo ============================================
echo.
echo Bundling everything into a single HTML file
echo that anyone can double-click to run.
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js not found. Run 1-INSTALL.bat first.
  pause
  exit /b 1
)

cd /d "%~dp0..\.."

if not exist "node_modules" (
  echo Running first-time setup for you...
  echo.
  call npm install
  if errorlevel 1 (
    echo Install failed. Check your internet connection.
    pause
    exit /b 1
  )
)

echo.
call npm run build

if errorlevel 1 (
  echo.
  echo Build failed. Scroll up to see why.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   DONE.
echo ============================================
echo.
echo Your shareable file is at:
echo   dist\index.html
echo.
echo Opening that folder for you now...
start "" "%~dp0..\..\..\dist"
echo.
echo You can close this window.
pause
