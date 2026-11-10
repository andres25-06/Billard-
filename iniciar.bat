@echo off
echo ===================================================
echo     INICIANDO BILLAR CHAMO - ENTORNO 1 (CONTROL)
echo ===================================================
echo.
echo Iniciando Backend FastAPI en http://localhost:8000 ...
start "Billard Backend (FastAPI)" cmd /k "cd backend && .venv\Scripts\uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak > nul

echo Iniciando Frontend Next.js en http://localhost:3000 ...
start "Billard Frontend (Next.js)" cmd /k "npm run dev --prefix frontend"

echo.
echo ===================================================
echo  Sistema iniciado con exito!
echo  PC de Control abierta en: http://localhost:3000
echo  Documentacion API en:     http://localhost:8000/docs
echo ===================================================
timeout /t 3 /nobreak > nul
start http://localhost:3000
