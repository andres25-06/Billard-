from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.core.database import get_db

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])

class DetalleItemRequest(BaseModel):
    producto_id: str
    cantidad: int
    nota: Optional[str] = None
    jugador_id: Optional[str] = None

class CrearPedidoRequest(BaseModel):
    mesa_id: Optional[str] = None
    sesion_id: Optional[str] = None
    origen: str = "caja"  # 'caja', 'tablet_mesa', 'barra', 'mesero'
    items: List[DetalleItemRequest]
    nota: Optional[str] = None

class ActualizarEstadoPedidoRequest(BaseModel):
    estado: str  # 'pendiente', 'en_preparacion', 'servido', 'cancelado'

@router.get("")
def listar_pedidos(estado: Optional[str] = None, mesa_id: Optional[str] = None):
    with get_db() as conn:
        with conn.cursor() as cur:
            query = """
                SELECT 
                    p.id, p.codigo_pedido, p.mesa_id, p.sesion_id, p.origen, 
                    p.estado, p.total_pedido, p.solicitado_el, p.entregado_el, p.nota,
                    m.numero as mesa_numero, m.nombre as mesa_nombre
                FROM pedidos p
                LEFT JOIN mesas m ON m.id = p.mesa_id
                WHERE 1=1
            """
            params = []
            if estado:
                query += " AND p.estado = %s"
                params.append(estado)
            if mesa_id:
                query += " AND p.mesa_id = %s"
                params.append(mesa_id)
            
            query += " ORDER BY p.solicitado_el DESC"
            cur.execute(query, tuple(params))
            pedidos = cur.fetchall()

            for p in pedidos:
                cur.execute("""
                    SELECT dp.id, dp.cantidad, dp.precio_unitario, dp.subtotal, dp.nota,
                           pr.nombre as producto_nombre
                    FROM detalle_pedidos dp
                    JOIN productos pr ON pr.id = dp.producto_id
                    WHERE dp.pedido_id = %s
                """, (p["id"],))
                p["items"] = cur.fetchall()

            return {"pedidos": pedidos}

@router.post("")
def crear_pedido(req: CrearPedidoRequest):
    if not req.items:
        raise HTTPException(status_code=400, detail="El pedido debe contener al menos un producto")

    with get_db() as conn:
        with conn.cursor() as cur:
            # Si no se pasó sesion_id pero sí mesa_id, buscar la sesión activa
            sesion_id = req.sesion_id
            if req.mesa_id and not sesion_id:
                cur.execute("SELECT id FROM sesiones_mesa WHERE mesa_id = %s AND estado = 'activa' LIMIT 1", (req.mesa_id,))
                row = cur.fetchone()
                if row:
                    sesion_id = row["id"]

            # Generar código correlativo de pedido
            cur.execute("SELECT COUNT(*) + 1 as seq FROM pedidos")
            seq = cur.fetchone()["seq"]
            codigo_pedido = f"PED-{datetime.now().strftime('%Y%m')}-{seq:04d}"

            # Calcular total e insertar pedido
            cur.execute("""
                INSERT INTO pedidos (codigo_pedido, sesion_id, mesa_id, origen, estado, total_pedido, nota)
                VALUES (%s, %s, %s, %s, 'pendiente', 0.0, %s)
                RETURNING id
            """, (codigo_pedido, sesion_id, req.mesa_id, req.origen, req.nota))
            pedido_id = cur.fetchone()["id"]

            total_acumulado = 0.0

            for item in req.items:
                cur.execute("SELECT id, nombre, precio_venta, stock_actual, permite_inventario FROM productos WHERE id = %s", (item.producto_id,))
                prod = cur.fetchone()
                if not prod:
                    raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")

                subtotal = float(prod["precio_venta"]) * item.cantidad
                total_acumulado += subtotal

                cur.execute("""
                    INSERT INTO detalle_pedidos (pedido_id, producto_id, jugador_id, cantidad, precio_unitario, subtotal, nota)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (pedido_id, prod["id"], item.jugador_id, item.cantidad, prod["precio_venta"], subtotal, item.nota))

                # Descontar del inventario si aplica
                if prod["permite_inventario"]:
                    cur.execute("""
                        UPDATE productos
                        SET stock_actual = stock_actual - %s
                        WHERE id = %s
                    """, (item.cantidad, prod["id"]))

                    # Registrar movimiento de inventario
                    cur.execute("""
                        INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id)
                        VALUES (%s, 'venta_pedido', %s, %s, %s, %s, (SELECT id FROM usuarios LIMIT 1))
                    """, (prod["id"], item.cantidad, prod["stock_actual"], prod["stock_actual"] - item.cantidad, f"Pedido {codigo_pedido}"))

            # Actualizar total del pedido
            cur.execute("UPDATE pedidos SET total_pedido = %s WHERE id = %s", (total_acumulado, pedido_id))

            # Si el pedido vino de la tablet de mesa, generar una alerta para la PC de control
            if req.origen == "tablet_mesa" and req.mesa_id:
                cur.execute("""
                    INSERT INTO alertas_mesa (mesa_id, tipo, mensaje)
                    VALUES (%s, 'llamado_mesero', %s)
                """, (req.mesa_id, f"Nuevo pedido recibido ({codigo_pedido}) por ${total_acumulado:,.0f}"))

            return {
                "message": "Pedido creado con éxito",
                "pedido_id": pedido_id,
                "codigo_pedido": codigo_pedido,
                "total": total_acumulado
            }

@router.patch("/{pedido_id}/estado")
def actualizar_estado(pedido_id: str, req: ActualizarEstadoPedidoRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            entregado_sql = ", entregado_el = CURRENT_TIMESTAMP" if req.estado == "servido" else ""
            cur.execute(f"""
                UPDATE pedidos
                SET estado = %s {entregado_sql}
                WHERE id = %s
                RETURNING id, estado
            """, (req.estado, pedido_id))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Pedido no encontrado")
            return {"message": "Estado actualizado", "pedido": row}
