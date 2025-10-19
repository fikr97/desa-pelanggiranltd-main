@echo off
REM Skrip migrasi Supabase untuk Windows

echo ========================================
echo    Skrip Migrasi Database Supabase
echo ========================================

REM Memeriksa apakah Supabase CLI terinstall
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Supabase CLI belum terinstall.
    echo Silakan install dari: https://github.com/supabase/cli/releases
    pause
    exit /b 1
)

echo 1. Memeriksa status koneksi Supabase...
supabase status
if %errorlevel% neq 0 (
    echo Error: Tidak terhubung ke proyek Supabase.
    echo Silakan login dan link proyek dengan: supabase login dan supabase link --project-ref [PROJECT-REF]
    pause
    exit /b 1
)

echo.
echo 2. Push migrasi ke database Supabase...
supabase db push
if %errorlevel% neq 0 (
    echo Error: Gagal melakukan push migrasi.
    pause
    exit /b 1
)

echo.
echo 3. Verifikasi: Migrasi berhasil dilakukan!
echo.
echo Proyek Supabase Anda sekarang sudah memiliki skema database yang diperlukan.
echo Langkah selanjutnya:
echo - Perbarui URL dan key di src/integrations/supabase/client.ts sesuai proyek Anda
echo - Jalankan aplikasi dengan: npm run dev
echo.
pause