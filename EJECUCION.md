# 🚀 Guía de Instalación, Configuración y Ejecución

Esta guía detalla los pasos para levantar el sistema **Billar Chamo** en cualquier equipo con Windows de forma local.

---

## 📋 1. Requisitos Previos

Antes de ejecutar el sistema, asegúrate de tener instalado en tu equipo:

* **Node.js**: Versión 18 o superior (Recomendado v20+ o v24+).
  * Verificar en terminal: `node -v` y `npm -v`
* **Python**: Versión 3.11 o superior (Recomendado 3.12+ o 3.14).
  * Verificar en terminal: `py --version` o `python --version`
* **PostgreSQL**: Versión 14 o superior (Instalado actualmente v18).
  * Verificar que el servicio esté corriendo en el puerto **5432**.

---

## 🗄️ 2. Configuración de la Base de Datos PostgreSQL

### Credenciales predeterminadas del sistema:
* **Host**: `localhost` (127.0.0.1)
* **Puerto**: `5432`
* **Usuario**: `postgres`
* **Contraseña**: `123`
* **Nombre de la Base de Datos**: `Billard`

### Si necesitas crear la base de datos desde cero:
Abre una terminal de PowerShell y ejecuta:

```powershell
$env:PGPASSWORD='123'
& "C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres -h localhost -p 5432 Billard
```

### Ejecutar la migración inicial:
Para aplicar todas las tablas (13 tablas), triggers y datos semilla de mesas y productos:

```powershell
$env:PGPASSWORD='123'
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -p 5432 -d Billard -f "C:\Users\eider\Documents\Billard-\database\migrations\001_initial_schema.sql"
```

---

## ⚙️ 3. Configuración de Variables de Entorno

### Backend (`backend/.env`):
El archivo `backend/.env` ya se encuentra configurado con los siguientes valores:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Billard
DB_USER=postgres
DB_PASSWORD=123

PORT=8000
ENVIRONMENT=development
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### Frontend (`frontend/.env.local` - Opcional):
Si no se especifica, por defecto se conecta a `http://localhost:8000/api`. Si necesitas cambiar la URL de la API:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

---

## 🏃 4. Cómo Iniciar el Proyecto

### Opción A: Inicio Automático con 1 Clic (Recomendada)
Haz doble clic sobre el archivo:
📁 **`iniciar.bat`**

Este script:
1. Inicia el servidor Backend FastAPI en una ventana independiente (`http://localhost:8000`).
2. Inicia el servidor Frontend Next.js en otra ventana independiente (`http://localhost:3000`).
3. Abre automáticamente tu navegador predeterminado en la pantalla de la PC de Control.

---

### Opción B: Inicio Manual por Consola

Si prefieres levantar cada servicio de forma individual:

#### 1. Iniciar el Backend (FastAPI):
Abre una consola en la raíz del proyecto y corre:
```powershell
cd backend
.\.venv\Scripts\uvicorn main:app --reload --port 8000
```
> El backend quedará escuchando en `http://localhost:8000`.

#### 2. Iniciar el Frontend (Next.js):
Abre una segunda consola en la raíz del proyecto y corre:
```powershell
npm run dev:frontend
```
> El frontend quedará escuchando en `http://localhost:3000`.

---

## 🌐 5. Direcciones de Acceso

| Servicio | URL Local | Descripción |
| :--- | :--- | :--- |
| **PC de Control (Entorno 1)** | [http://localhost:3000](http://localhost:3000) | Panel de mesas, comandas, caja y cronómetros |
| **Documentación Swagger API** | [http://localhost:8000/docs](http://localhost:8000/docs) | Pruebas interactivas de todos los endpoints |
| **Documentación ReDoc API** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Especificación técnica OpenAPI |

---

## 🛠️ 6. Solución de Problemas Frecuentes

1. **Error de conexión a PostgreSQL (Puerto 5432 rechazado)**:
   * Verifica que el servicio de PostgreSQL esté iniciado en Windows:
     Presiona `Win + R`, escribe `services.msc` y confirma que `postgresql-x64-18` esté en estado **En ejecución**.
2. **Error al instalar dependencias de Python**:
   * Si necesitas reinstalar el entorno virtual de Python:
     ```powershell
     cd backend
     py -m venv .venv
     .\.venv\Scripts\pip install -r requirements.txt
     ```
3. **Puerto 3000 o 8000 ocupado**:
   * Puedes cambiar el puerto del backend modificando `PORT=8001` en `backend/.env`.
   * En el frontend puedes iniciarlo en otro puerto con: `npx next dev -p 3001`.
