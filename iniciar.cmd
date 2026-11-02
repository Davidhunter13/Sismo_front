@echo off
REM Nota de Transparencia: Codigo generado con asistencia de IA Generativa (Claude Code) bajo la Politica ODTI012 del CCS.
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
echo Iniciando SISMO en http://localhost:5173 ...
call npm run dev -- --open
pause
