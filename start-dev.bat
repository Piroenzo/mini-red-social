@echo off
echo Iniciando Mini Red Social...
echo.

echo Iniciando Backend (Flask)...
start "Backend" cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python app.py"

echo Esperando 5 segundos para que el backend inicie...
timeout /t 5 /nobreak > nul

echo Iniciando Frontend (React)...
start "Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo ¡Aplicación iniciada!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
