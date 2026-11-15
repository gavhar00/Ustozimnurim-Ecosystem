@echo off
cd /d "%~dp0"
title UstozimNurim - Vercel ga deploy
echo.
echo === 1-qadam: Vercel hisobingizga kirish ===
echo Brauzer ochiladi, tasdiqlang va shu oynaga qayting.
echo.
call npx --yes vercel@latest login
echo.
echo === 2-qadam: Deploy ===
echo Savollar chiqsa: Set up and deploy? Y
echo                  Link to existing project? N
echo                  Project name? ustozimnurim
echo                  Directory? (Enter bosing)
echo                  Override settings? N
echo.
call npx --yes vercel@latest --prod ^
  -e NEXT_PUBLIC_SUPABASE_URL=https://hetwznrcqzyyrljimuti.supabase.co ^
  -e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_6mX0uLP2yGAbAk93cxSg4Q_xva48sfb ^
  -e NEXT_PUBLIC_SITE_URL=https://ustozimnurim.uz ^
  --build-env NEXT_PUBLIC_SUPABASE_URL=https://hetwznrcqzyyrljimuti.supabase.co ^
  --build-env NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_6mX0uLP2yGAbAk93cxSg4Q_xva48sfb ^
  --build-env NEXT_PUBLIC_SITE_URL=https://ustozimnurim.uz
echo.
echo Tayyor. Yuqoridagi Production manzilini menga yuboring.
pause
