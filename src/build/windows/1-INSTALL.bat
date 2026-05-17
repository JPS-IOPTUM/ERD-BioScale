@echo off
title Scale Space Synth - First Time Setup
echo.
echo ============================================
echo   SCALE SPACE SYNTH - FIRST TIME SETUP
echo ============================================
echo.
echo This downloads the libraries the project needs.
echo You only ever do this ONCE.
echo It takes about a minute.
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo ERROR: Node.js is not installed or not on the system PATH.
  echo.
  echo 1. Go to https://nodejs.org and install the LTS version.
  echo 2. RESTART your computer ^(seriously, do it - PATH won't refresh otherwise^).
  echo 3. Run this file again.
  echo.
  pause
  exit /b 1
)

echo Working...
echo.
cd /d "%~dp0..\.."
call npm install

if errorlevel 1 (
  echo.
  echo Something went wrong. Scroll up to see what.
  echo Most common cause: no internet, or a firewall blocking npm.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   DONE.
echo ============================================
echo.
echo Next: double-click 2-DEV-MODE.bat to start editing,
echo or 3-MAKE-BUILD.bat to make a shareable HTML file.
echo.
echo You can close this window.
pause
