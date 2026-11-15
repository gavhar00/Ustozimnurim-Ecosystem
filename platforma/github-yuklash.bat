@echo off
cd /d "%~dp0"
title UstozimNurim - GitHub ga yuklash
echo Kod GitHub ga yuklanmoqda...
echo.
git add -A
git commit -F commit-xabari.txt
git branch -M main
git push -u origin main
echo.
echo Tayyor. Oynani yopishingiz mumkin.
pause
