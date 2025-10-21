#!/bin/bash

echo "Iniciando Mini Red Social..."
echo

echo "Iniciando Backend (Flask)..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py &
BACKEND_PID=$!

echo "Esperando 5 segundos para que el backend inicie..."
sleep 5

echo "Iniciando Frontend (React)..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo
echo "¡Aplicación iniciada!"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo
echo "Presiona Ctrl+C para detener ambos servicios"

# Función para limpiar procesos al salir
cleanup() {
    echo "Deteniendo servicios..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Esperar a que termine cualquiera de los procesos
wait
