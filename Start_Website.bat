@echo off
echo ==============================================
echo       Starting WOS Web Dashboard Server...
echo ==============================================
echo.
cd /d "%~dp0"
npm run dev
pause
