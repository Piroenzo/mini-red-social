# 🚀 Guía de Deploy en Render

Esta guía te ayudará a desplegar tu Mini Red Social en Render.

## 📋 Prerrequisitos

1. Cuenta en [Render](https://render.com)
2. Base de datos PostgreSQL (puedes usar la de Render o una externa)

## 🔧 Configuración del Backend

### 1. Crear Web Service en Render

1. Ve a tu dashboard de Render
2. Haz clic en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `mini-red-social-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

### 2. Variables de Entorno

En la sección "Environment" del servicio, agrega:

```
DATABASE_URL=postgresql://usuario:password@host:5432/database_name
SECRET_KEY=tu_clave_secreta_super_segura
JWT_SECRET_KEY=tu_jwt_secret_key_segura
FRONTEND_URL=https://tu-frontend-url.onrender.com
```

### 3. Base de Datos

1. Crea un nuevo "PostgreSQL" service en Render
2. Copia la "External Database URL" y úsala como `DATABASE_URL`

## 🎨 Configuración del Frontend

### 1. Crear Static Site en Render

1. Ve a tu dashboard de Render
2. Haz clic en "New +" → "Static Site"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `mini-red-social-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`

### 2. Variables de Entorno

En la sección "Environment" del servicio, agrega:

```
VITE_API_URL=https://tu-backend-url.onrender.com
```

### 3. Actualizar URLs en el Código

Después del primer deploy, actualiza las URLs en:

- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/components/Feed.tsx`
- `frontend/src/components/PostCard.tsx`
- `frontend/src/components/CommentsModal.tsx`

Cambia `http://localhost:5000` por tu URL de backend de Render.

## 🔄 Deploy Automático

Una vez configurado, Render desplegará automáticamente cada vez que hagas push a tu repositorio.

## 🧪 Pruebas Locales

Para probar localmente:

### Windows:
```bash
# Ejecutar el script de inicio
start-dev.bat
```

### Linux/Mac:
```bash
# Ejecutar el script de inicio
./start-dev.sh
```

### Manual:
```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
python app.py

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

## 🌐 URLs de Producción

- **Frontend**: `https://tu-frontend-url.onrender.com`
- **Backend**: `https://tu-backend-url.onrender.com`
- **API Health**: `https://tu-backend-url.onrender.com/api/health`

## 🐛 Solución de Problemas

### Backend no inicia:
- Verifica que todas las variables de entorno estén configuradas
- Revisa los logs en Render Dashboard
- Asegúrate de que la base de datos esté accesible

### Frontend no se conecta al backend:
- Verifica que la URL del backend sea correcta
- Revisa la configuración de CORS en el backend
- Asegúrate de que el backend esté funcionando

### Base de datos:
- Verifica que la URL de la base de datos sea correcta
- Asegúrate de que la base de datos esté activa en Render

## 📝 Notas Importantes

1. **CORS**: El backend está configurado para aceptar peticiones desde el frontend
2. **JWT**: Los tokens expiran en 7 días
3. **Imágenes**: Se almacenan como base64 en la base de datos
4. **Límites**: Render tiene límites en el plan gratuito

¡Tu Mini Red Social estará lista para usar! 🎉
