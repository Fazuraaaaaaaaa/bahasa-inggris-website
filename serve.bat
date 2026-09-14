@echo off
echo.
echo ====================================================
echo  MEMULAI BUKU CATATAN BAHASA INGGRIS (LOCAL SERVER)
echo ====================================================
echo.
echo Pastikan Anda telah menginstal Python.
echo Menjalankan server lokal di port 8000...
echo.
echo [TIPS] Fitur Suara (Mikrofon) hanya bisa diakses
echo jika Anda membuka web ini lewat localhost!
echo.
start http://localhost:8000
python -m http.server 8000
pause
