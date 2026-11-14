from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])

class ClienteCreateRequest(BaseModel):
    nombre: str
    apodo: Optional[str] = None
    telefono: Optional[str] = None

@router.get("")
def listar_clientes():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS clientes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    nombre VARCHAR(100) NOT NULL UNIQUE,
                    apodo VARCHAR(100),
                    telefono VARCHAR(50),
                    visitas INT DEFAULT 1,
                    activo BOOLEAN DEFAULT true,
                    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
                ALTER TABLE clientes ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
            """)
            cur.execute("""
                SELECT id, nombre, apodo, telefono, visitas 
                FROM clientes 
                WHERE activo = true 
                ORDER BY visitas DESC, nombre ASC
            """)
            clientes = cur.fetchall()
            return {"clientes": clientes}

@router.post("")
def guardar_cliente(req: ClienteCreateRequest):
    limpio = " ".join(p.capitalize() for p in req.nombre.strip().split())
    if not limpio:
        raise HTTPException(status_code=400, detail="El nombre es obligatorio")
    
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS clientes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    nombre VARCHAR(100) NOT NULL UNIQUE,
                    apodo VARCHAR(100),
                    telefono VARCHAR(50),
                    visitas INT DEFAULT 1,
                    activo BOOLEAN DEFAULT true,
                    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
                );
                ALTER TABLE clientes ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;
            """)
            cur.execute("""
                INSERT INTO clientes (nombre, apodo, telefono, visitas)
                VALUES (%s, %s, %s, 1)
                ON CONFLICT (nombre) DO UPDATE SET 
                    visitas = clientes.visitas + 1,
                    apodo = COALESCE(EXCLUDED.apodo, clientes.apodo),
                    telefono = COALESCE(EXCLUDED.telefono, clientes.telefono)
                RETURNING id, nombre, apodo, telefono, visitas
            """, (limpio, req.apodo, req.telefono))
            cliente = cur.fetchone()
            return {"message": "Cliente guardado", "cliente": cliente}

@router.put("/{cliente_id}")
def actualizar_cliente(cliente_id: str, req: ClienteCreateRequest):
    limpio = " ".join(p.capitalize() for p in req.nombre.strip().split())
    if not limpio:
        raise HTTPException(status_code=400, detail="El nombre del jugador es obligatorio")
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE clientes
                SET nombre = %s, apodo = %s, telefono = %s
                WHERE id = %s
                RETURNING id, nombre, apodo, telefono, visitas
            """, (limpio, req.apodo, req.telefono, cliente_id))
            cliente = cur.fetchone()
            if not cliente:
                raise HTTPException(status_code=404, detail="Jugador no encontrado")
            return {"message": "Jugador actualizado", "cliente": cliente}

@router.delete("/{cliente_id}")
def eliminar_cliente(cliente_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM clientes WHERE id = %s RETURNING id", (cliente_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Cliente no encontrado")
            return {"message": "Cliente eliminado"}

