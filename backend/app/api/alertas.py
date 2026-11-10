from fastapi import APIRouter, HTTPException
from app.core.database import get_db

router = APIRouter(prefix="/api/alertas", tags=["Alertas"])

@router.get("/activas")
def listar_alertas_activas():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    a.id, a.mesa_id, a.tipo, a.mensaje, a.creado_el,
                    m.numero as mesa_numero, m.nombre as mesa_nombre
                FROM alertas_mesa a
                JOIN mesas m ON m.id = a.mesa_id
                WHERE a.atendida = false
                ORDER BY a.creado_el ASC
            """)
            return {"alertas": cur.fetchall()}

@router.post("/{alerta_id}/atender")
def atender_alerta(alerta_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE alertas_mesa
                SET atendida = true,
                    atendida_el = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id, atendida
            """, (alerta_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Alerta no encontrada")
            return {"message": "Alerta marcada como atendida", "alerta": row}
