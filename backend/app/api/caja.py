from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db

router = APIRouter(prefix="/api/caja", tags=["Caja"])

class AbrirTurnoRequest(BaseModel):
    monto_base: float = 100000.0  # Base inicial de caja
    usuario_id: Optional[str] = None

class CerrarTurnoRequest(BaseModel):
    efectivo_declarado: float
    observaciones: Optional[str] = None

class MovimientoManualRequest(BaseModel):
    tipo: str  # 'egreso_gasto', 'ingreso_manual', 'retiro_caja'
    metodo_pago: str = "efectivo"
    monto: float
    descripcion: str

@router.get("/turno-activo")
def obtener_turno_activo():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    t.id, t.usuario_id, t.fecha_apertura, t.monto_apertura_base,
                    u.nombre as usuario_nombre
                FROM turnos_caja t
                JOIN usuarios u ON u.id = t.usuario_id
                WHERE t.estado = 'abierto'
                ORDER BY t.fecha_apertura DESC LIMIT 1
            """)
            turno = cur.fetchone()
            if not turno:
                return {"turno": None, "mensaje": "No hay ningún turno de caja abierto actualmente"}

            # Resumen de movimientos del turno
            cur.execute("""
                SELECT 
                    tipo, metodo_pago, COALESCE(SUM(monto), 0) as total
                FROM movimientos_caja
                WHERE turno_id = %s
                GROUP BY tipo, metodo_pago
            """, (turno["id"],))
            movs = cur.fetchall()

            total_efectivo = 0.0
            total_transferencias = 0.0
            total_tarjetas = 0.0
            total_egresos = 0.0

            for m in movs:
                monto = float(m["total"])
                tipo = m["tipo"]
                metodo = m["metodo_pago"]

                if tipo in ('egreso_gasto', 'retiro_caja'):
                    total_egresos += monto
                else:
                    if metodo == 'efectivo':
                        total_efectivo += monto
                    elif metodo in ('nequi', 'daviplata', 'transferencia'):
                        total_transferencias += monto
                    elif 'tarjeta' in metodo:
                        total_tarjetas += monto

            total_ventas = total_efectivo + total_transferencias + total_tarjetas
            saldo_esperado_efectivo = float(turno["monto_apertura_base"]) + total_efectivo - total_egresos

            # Últimos movimientos
            cur.execute("""
                SELECT id, tipo, metodo_pago, monto, descripcion, creado_el
                FROM movimientos_caja
                WHERE turno_id = %s
                ORDER BY creado_el DESC LIMIT 15
            """, (turno["id"],))
            ultimos_movs = cur.fetchall()

            return {
                "turno": {
                    **turno,
                    "total_ventas": total_ventas,
                    "total_efectivo": total_efectivo,
                    "total_transferencias": total_transferencias,
                    "total_tarjetas": total_tarjetas,
                    "total_egresos": total_egresos,
                    "saldo_esperado_efectivo": saldo_esperado_efectivo,
                    "ultimos_movimientos": ultimos_movs
                }
            }

@router.post("/abrir")
def abrir_turno(req: AbrirTurnoRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM turnos_caja WHERE estado = 'abierto' LIMIT 1")
            if cur.fetchone():
                raise HTTPException(status_code=400, detail="Ya existe un turno de caja abierto")

            cur.execute("SELECT id FROM usuarios LIMIT 1")
            u = cur.fetchone()
            usuario_id = req.usuario_id or (u["id"] if u else None)

            cur.execute("""
                INSERT INTO turnos_caja (usuario_id, monto_apertura_base, estado)
                VALUES (%s, %s, 'abierto')
                RETURNING id, fecha_apertura, monto_apertura_base
            """, (usuario_id, req.monto_base))
            turno = cur.fetchone()
            return {"message": "Turno de caja abierto", "turno": turno}

@router.post("/cerrar")
def cerrar_turno(req: CerrarTurnoRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, monto_apertura_base FROM turnos_caja 
                WHERE estado = 'abierto' ORDER BY fecha_apertura DESC LIMIT 1
            """)
            turno = cur.fetchone()
            if not turno:
                raise HTTPException(status_code=404, detail="No hay turno abierto para cerrar")

            turno_id = turno["id"]

            # Calcular totales del sistema
            cur.execute("""
                SELECT 
                    COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' AND tipo NOT IN ('egreso_gasto', 'retiro_caja') THEN monto ELSE 0 END), 0) as efec,
                    COALESCE(SUM(CASE WHEN metodo_pago IN ('nequi', 'daviplata', 'transferencia') THEN monto ELSE 0 END), 0) as transf,
                    COALESCE(SUM(CASE WHEN tipo IN ('egreso_gasto', 'retiro_caja') THEN monto ELSE 0 END), 0) as egresos
                FROM movimientos_caja WHERE turno_id = %s
            """, (turno_id,))
            calc = cur.fetchone()
            efec = float(calc["efec"])
            transf = float(calc["transf"])
            egresos = float(calc["egresos"])
            esperado = float(turno["monto_apertura_base"]) + efec - egresos
            diferencia = req.efectivo_declarado - esperado

            cur.execute("""
                UPDATE turnos_caja
                SET fecha_cierre = CURRENT_TIMESTAMP,
                    total_efectivo_sistema = %s,
                    total_transferencias_sistema = %s,
                    total_egresos = %s,
                    efectivo_declarado_cierre = %s,
                    diferencia_cierre = %s,
                    estado = 'cerrado',
                    observaciones_cierre = %s
                WHERE id = %s
                RETURNING id, diferencia_cierre
            """, (efec, transf, egresos, req.efectivo_declarado, diferencia, req.observaciones, turno_id))

            return {
                "message": "Turno cerrado exitosamente",
                "saldo_esperado": esperado,
                "declarado": req.efectivo_declarado,
                "diferencia": diferencia
            }

@router.post("/movimiento")
def registrar_movimiento(req: MovimientoManualRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM turnos_caja WHERE estado = 'abierto' LIMIT 1")
            turno = cur.fetchone()
            if not turno:
                raise HTTPException(status_code=400, detail="Debe haber un turno abierto para registrar movimientos")

            cur.execute("""
                INSERT INTO movimientos_caja (turno_id, tipo, metodo_pago, monto, descripcion, usuario_id)
                VALUES (%s, %s, %s, %s, %s, (SELECT id FROM usuarios LIMIT 1))
                RETURNING id, creado_el
            """, (turno["id"], req.tipo, req.metodo_pago, req.monto, req.descripcion))
            return {"message": "Movimiento registrado con éxito", "movimiento": cur.fetchone()}
