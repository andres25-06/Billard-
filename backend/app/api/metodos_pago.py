from fastapi import APIRouter
from app.core.database import get_db

router = APIRouter(prefix="/api/metodos-pago", tags=["Métodos de Pago"])


def _asegurar_tabla_metodos_pago(cur):
    cur.execute("""
        CREATE TABLE IF NOT EXISTS metodos_pago (
            id SERIAL PRIMARY KEY,
            codigo VARCHAR(50) UNIQUE NOT NULL,
            nombre VARCHAR(100) NOT NULL,
            descripcion VARCHAR(150),
            activo BOOLEAN NOT NULL DEFAULT TRUE
        )
    """)
    cur.execute("""
        INSERT INTO metodos_pago (codigo, nombre, descripcion, activo)
        VALUES
            ('efectivo', 'Efectivo', 'Caja física', TRUE),
            ('transferencia', 'Transferencia', 'Nequi / Banc.', TRUE)
        ON CONFLICT (codigo) DO UPDATE SET
            nombre = EXCLUDED.nombre,
            descripcion = EXCLUDED.descripcion,
            activo = TRUE
    """)
    cur.execute("""
        UPDATE metodos_pago
        SET activo = FALSE
        WHERE codigo NOT IN ('efectivo', 'transferencia')
    """)


@router.get("")
def listar_metodos_pago():
    with get_db() as conn:
        with conn.cursor() as cur:
            _asegurar_tabla_metodos_pago(cur)
            cur.execute("""
                SELECT id, codigo, nombre, descripcion, activo
                FROM metodos_pago
                WHERE activo = TRUE
                ORDER BY id ASC
            """)
            metodos = cur.fetchall()
            return {"metodos_pago": metodos}
