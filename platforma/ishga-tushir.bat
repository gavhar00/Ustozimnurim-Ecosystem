@echo off
cd /d "%~dp0"
title UstozimNurim - dev server
if not exist node_modules (
  echo Paketlar ornatilmoqda, bu bir necha daqiqa olishi mumkin...
  call npm install
)
echo.
echo ===============================================
echo   UstozimNurim ishga tushmoqda
echo   Brauzerda oching:  http://localhost:3000
echo   Toxtatish uchun:   Ctrl + C
echo ===============================================
echo.
call npm run dev
pause
