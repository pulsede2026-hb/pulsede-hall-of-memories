@echo off
setlocal
cd /d "%~dp0"
start "PulseDE Song-Leitzentrale V2" /min node tools\v2-server.mjs
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:8766/"
endlocal
