@echo off
cd /d "%~dp0"
(
echo NEXT_PUBLIC_SUPABASE_URL=https://hetwznrcqzyyrljimuti.supabase.co
echo NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_6mX0uLP2yGAbAk93cxSg4Q_xva48sfb
echo NEXT_PUBLIC_SITE_URL=http://localhost:3000
) > .env.local
echo .env.local yozildi.
timeout /t 3 >nul
