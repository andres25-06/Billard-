from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from app.core.database import get_db

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])


def _asegurar_esquema_pedidos(cur):
    cur.execute("""
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS deportista VARCHAR(150),
        ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50),
        ADD COLUMN IF NOT EXISTS monto_recibido NUMERIC(12, 2),
        ADD COLUMN IF NOT EXISTS cambio NUMERIC(12, 2),
        ADD COLUMN IF NOT EXISTS motivo_anulacion TEXT
    """)
    cur.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'pedidos_estado_check'
            ) THEN
                ALTER TABLE pedidos DROP CONSTRAINT pedidos_estado_check;
            END IF;
        END $$;
    """)
    cur.execute("""
        ALTER TABLE pedidos
        ADD CONSTRAINT pedidos_estado_check
        CHECK (estado IN ('pendiente', 'en_preparacion', 'servido', 'pagado', 'cancelado', 'anulado'))
    """)


def obtener_o_crear_producto_tiempo(cur) -> str:
    cur.execute("""
        SELECT id FROM productos
        WHERE nombre = 'Tiempo de juego' AND activo = false
        LIMIT 1
    """)
    row = cur.fetchone()
    if row:
        return row["id"]

    cur.execute("SELECT id FROM categorias_producto LIMIT 1")
    cat = cur.fetchone()
    cat_id = cat["id"] if cat else None

    cur.execute("""
        INSERT INTO productos (
            nombre, categoria_id, descripcion, precio_venta, precio_costo,
            stock_actual, stock_minimo, permite_inventario, activo
        )
        VALUES ('Tiempo de juego', %s, 'Cargo por tiempo de mesa', 0, 0, 0, 0, false, false)
        RETURNING id
    """, (cat_id,))
    return cur.fetchone()["id"]


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
    deportista: Optional[str] = None


class ActualizarEstadoPedidoRequest(BaseModel):
    estado: str  # 'pendiente', 'en_preparacion', 'servido', 'pagado', 'cancelado', 'anulado'
    metodo_pago: Optional[str] = None
    monto_recibido: Optional[float] = None
    cambio: Optional[float] = None
    motivo_anulacion: Optional[str] = None


class CargoTiempoRequest(BaseModel):
    mesa_id: str
    deportista: str
    minutos: int
    costo_tiempo: float


@router.get("")
def listar_pedidos(estado: Optional[str] = None, mesa_id: Optional[str] = None):
    with get_db() as conn:
        with conn.cursor() as cur:
            _asegurar_esquema_pedidos(cur)
            query = """
                SELECT 
                    p.id, p.codigo_pedido, p.mesa_id, p.sesion_id, p.origen, 
                    p.estado, p.total_pedido, p.solicitado_el, p.entregado_el, p.nota,
                    p.deportista, p.metodo_pago, p.monto_recibido, p.cambio, p.motivo_anulacion,
                    m.numero as mesa_numero, m.nombre as mesa_nombre, m.tipo as mesa_tipo
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
                    SELECT dp.id, dp.producto_id, dp.cantidad, dp.precio_unitario, dp.subtotal, dp.nota,
                           CASE
                               WHEN pr.activo = false AND dp.nota IS NOT NULL AND dp.nota != '' THEN dp.nota
                               ELSE pr.nombre
                           END as producto_nombre
                    FROM detalle_pedidos dp
                    JOIN productos pr ON pr.id = dp.producto_id
                    WHERE dp.pedido_id = %s
                    ORDER BY dp.id ASC
                """, (p["id"],))
                items = cur.fetchall()
                p["items"] = items

                # Determinar nombre del titular/deportista si no estaba explícito
                titular = (p.get("deportista") or "").strip()
                if not titular and p.get("nota"):
                    nota_str = p["nota"].strip()
                    if nota_str.lower().startswith("cuenta:"):
                        titular = nota_str.split(":", 1)[1].strip()
                    else:
                        titular = nota_str
                if not titular:
                    for it in items:
                        it_nota = (it.get("nota") or "").strip()
                        if it_nota.lower().startswith("cuenta:"):
                            posible = it_nota.split(":", 1)[1].strip()
                            if posible.lower() not in ("barra", "mesa", ""):
                                titular = posible
                                break
                if not titular or titular.lower() in ("barra", "mesa"):
                    if p.get("mesa_numero"):
                        titular = f"Mesa {p['mesa_numero']}"
                    else:
                        titular = "Cliente Barra"
                p["deportista"] = titular

            return {"pedidos": pedidos}


def _extraer_titular_item(item_nota: Optional[str], req_deportista: Optional[str], req_nota: Optional[str], mesa_numero: Optional[int]) -> str:
    if req_deportista and req_deportista.strip().lower() not in ("", "barra", "mesa", "mesa general"):
        return req_deportista.strip()
    if item_nota:
        limpia = item_nota.strip()
        if limpia.lower().startswith("cuenta:"):
            limpia = limpia.split(":", 1)[1].strip()
        if limpia.lower() not in ("", "barra", "mesa", "mesa general"):
            return limpia
    if req_nota and req_nota.strip().lower() not in ("", "barra", "mesa", "mesa general"):
        return req_nota.strip()
    if mesa_numero:
        return f"Mesa {mesa_numero}"
    return "Cliente Barra"


@router.post("")
def crear_pedido(req: CrearPedidoRequest):
    if not req.items:
        raise HTTPException(status_code=400, detail="El pedido debe contener al menos un producto")

    with get_db() as conn:
        with conn.cursor() as cur:
            _asegurar_esquema_pedidos(cur)

            sesion_id = req.sesion_id
            mesa_numero = None
            if req.mesa_id:
                cur.execute("SELECT numero FROM mesas WHERE id = %s", (req.mesa_id,))
                m_row = cur.fetchone()
                if m_row:
                    mesa_numero = m_row["numero"]
                if not sesion_id:
                    cur.execute(
                        "SELECT id FROM sesiones_mesa WHERE mesa_id = %s AND estado = 'activa' LIMIT 1",
                        (req.mesa_id,),
                    )
                    s_row = cur.fetchone()
                    if s_row:
                        sesion_id = s_row["id"]

            # Agrupar items por titular para que cada persona acumule en su propia cuenta abierta
            grupos: dict[str, List[DetalleItemRequest]] = {}
            for item in req.items:
                titular = _extraer_titular_item(item.nota, req.deportista, req.nota, mesa_numero)
                grupos.setdefault(titular, []).append(item)

            ultimo_pedido_id = None
            ultimo_codigo = None
            total_general = 0.0

            for titular, items_grupo in grupos.items():
                # Buscar si ya existe un pedido 'pendiente' para este mismo titular
                pedido_existente = None
                if titular != "Cliente Barra":
                    cur.execute("""
                        SELECT id, codigo_pedido, mesa_id, sesion_id
                        FROM pedidos
                        WHERE estado = 'pendiente'
                          AND LOWER(COALESCE(deportista, '')) = LOWER(%s)
                        ORDER BY solicitado_el DESC
                        LIMIT 1
                    """, (titular,))
                    pedido_existente = cur.fetchone()

                if pedido_existente:
                    pedido_id = pedido_existente["id"]
                    codigo_pedido = pedido_existente["codigo_pedido"]
                    if req.mesa_id and not pedido_existente.get("mesa_id"):
                        cur.execute(
                            "UPDATE pedidos SET mesa_id = %s, sesion_id = COALESCE(sesion_id, %s) WHERE id = %s",
                            (req.mesa_id, sesion_id, pedido_id),
                        )
                else:
                    cur.execute("SELECT COUNT(*) + 1 as seq FROM pedidos")
                    seq = cur.fetchone()["seq"]
                    codigo_pedido = f"PED-{datetime.now().strftime('%Y%m')}-{seq:04d}-{int(datetime.now().timestamp()) % 1000:03d}"
                    cur.execute("""
                        INSERT INTO pedidos (codigo_pedido, sesion_id, mesa_id, origen, estado, total_pedido, nota, deportista)
                        VALUES (%s, %s, %s, %s, 'pendiente', 0.0, %s, %s)
                        RETURNING id
                    """, (codigo_pedido, sesion_id, req.mesa_id, req.origen, req.nota or titular, titular))
                    pedido_id = cur.fetchone()["id"]

                for item in items_grupo:
                    cur.execute(
                        "SELECT id, nombre, precio_venta, stock_actual, permite_inventario FROM productos WHERE id = %s",
                        (item.producto_id,),
                    )
                    prod = cur.fetchone()
                    if not prod:
                        raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")

                    if prod["permite_inventario"] and item.cantidad > prod["stock_actual"]:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Stock insuficiente para {prod['nombre']} (disponible: {prod['stock_actual']})",
                        )

                    subtotal = float(prod["precio_venta"]) * item.cantidad
                    total_general += subtotal

                    # Si el producto ya existe en este pedido pendiente, acumular cantidad
                    cur.execute("""
                        SELECT id, cantidad, subtotal
                        FROM detalle_pedidos
                        WHERE pedido_id = %s AND producto_id = %s
                        LIMIT 1
                    """, (pedido_id, prod["id"]))
                    det_existente = cur.fetchone()

                    if det_existente:
                        nueva_cant = int(det_existente["cantidad"]) + item.cantidad
                        nuevo_sub = float(det_existente["subtotal"]) + subtotal
                        cur.execute("""
                            UPDATE detalle_pedidos
                            SET cantidad = %s, subtotal = %s
                            WHERE id = %s
                        """, (nueva_cant, nuevo_sub, det_existente["id"]))
                    else:
                        cur.execute("""
                            INSERT INTO detalle_pedidos (pedido_id, producto_id, jugador_id, cantidad, precio_unitario, subtotal, nota)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (pedido_id, prod["id"], item.jugador_id, item.cantidad, prod["precio_venta"], subtotal, f"Cuenta: {titular}"))

                    if prod["permite_inventario"]:
                        cur.execute("""
                            UPDATE productos
                            SET stock_actual = stock_actual - %s
                            WHERE id = %s
                        """, (item.cantidad, prod["id"]))

                        cur.execute("""
                            INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id)
                            VALUES (%s, 'venta_pedido', %s, %s, %s, %s, (SELECT id FROM usuarios LIMIT 1))
                        """, (prod["id"], item.cantidad, prod["stock_actual"], prod["stock_actual"] - item.cantidad, f"Pedido {codigo_pedido}"))

                # Recalcular total del pedido
                cur.execute("""
                    UPDATE pedidos
                    SET total_pedido = (
                        SELECT COALESCE(SUM(subtotal), 0) FROM detalle_pedidos WHERE pedido_id = %s
                    )
                    WHERE id = %s
                """, (pedido_id, pedido_id))

                ultimo_pedido_id = pedido_id
                ultimo_codigo = codigo_pedido

            return {
                "message": "Pedido creado con éxito",
                "pedido_id": ultimo_pedido_id,
                "codigo_pedido": ultimo_codigo,
                "total": total_general,
            }


@router.post("/cargo-tiempo")
def cargar_tiempo_a_cuenta(req: CargoTiempoRequest):
    titular = req.deportista.strip()
    if not titular:
        raise HTTPException(status_code=400, detail="El jugador es obligatorio")

    with get_db() as conn:
        with conn.cursor() as cur:
            _asegurar_esquema_pedidos(cur)
            prod_tiempo_id = obtener_o_crear_producto_tiempo(cur)

            cur.execute("SELECT id, numero FROM mesas WHERE id = %s", (req.mesa_id,))
            mesa = cur.fetchone()
            if not mesa:
                raise HTTPException(status_code=404, detail="Mesa no encontrada")

            cur.execute(
                "SELECT id, hora_inicio, tarifa_hora_aplicada FROM sesiones_mesa WHERE mesa_id = %s AND estado IN ('activa', 'pausada') ORDER BY hora_inicio DESC LIMIT 1",
                (req.mesa_id,),
            )
            sesion = cur.fetchone()
            sesion_id = sesion["id"] if sesion else None

            # Buscar si el jugador ya tiene una cuenta pendiente abierta
            cur.execute("""
                SELECT id, codigo_pedido
                FROM pedidos
                WHERE estado = 'pendiente'
                  AND LOWER(COALESCE(deportista, '')) = LOWER(%s)
                ORDER BY solicitado_el DESC
                LIMIT 1
            """, (titular,))
            pedido_jugador = cur.fetchone()

            if pedido_jugador:
                pedido_id = pedido_jugador["id"]
                codigo_pedido = pedido_jugador["codigo_pedido"]
            else:
                cur.execute("SELECT COUNT(*) + 1 as seq FROM pedidos")
                seq = cur.fetchone()["seq"]
                codigo_pedido = f"MESA-{mesa['numero']:02d}-{int(datetime.now().timestamp()) % 10000:04d}"
                cur.execute("""
                    INSERT INTO pedidos (codigo_pedido, sesion_id, mesa_id, origen, estado, total_pedido, nota, deportista)
                    VALUES (%s, %s, %s, 'caja', 'pendiente', 0.0, %s, %s)
                    RETURNING id
                """, (codigo_pedido, sesion_id, req.mesa_id, titular, titular))
                pedido_id = cur.fetchone()["id"]

            # Si había pedidos pendientes en esta sesión bajo "Mesa X", mover sus items a la cuenta del jugador
            if sesion_id:
                cur.execute("""
                    SELECT id FROM pedidos
                    WHERE sesion_id = %s AND estado = 'pendiente' AND id != %s
                """, (sesion_id, pedido_id))
                otros_pedidos = cur.fetchall()
                for op in otros_pedidos:
                    cur.execute("UPDATE detalle_pedidos SET pedido_id = %s WHERE pedido_id = %s", (pedido_id, op["id"]))
                    cur.execute("DELETE FROM pedidos WHERE id = %s", (op["id"],))

            # Agregar el cargo de tiempo
            etiqueta_tiempo = f"Tiempo de juego ({req.minutos} min)"
            costo = max(0.0, float(req.costo_tiempo))
            cur.execute("""
                INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, nota)
                VALUES (%s, %s, 1, %s, %s, %s)
            """, (pedido_id, prod_tiempo_id, costo, costo, etiqueta_tiempo))

            cur.execute("""
                UPDATE pedidos
                SET total_pedido = (
                    SELECT COALESCE(SUM(subtotal), 0) FROM detalle_pedidos WHERE pedido_id = %s
                ),
                mesa_id = %s
                WHERE id = %s
            """, (pedido_id, req.mesa_id, pedido_id))

            # Cerrar la sesión actual de la mesa (sin registrar cobro en caja porque queda pendiente por cobrar)
            if sesion_id:
                cur.execute("""
                    UPDATE sesiones_mesa
                    SET hora_fin = CURRENT_TIMESTAMP,
                        minutos_totales = %s,
                        total_tiempo = %s,
                        total_final = %s,
                        estado = 'finalizada'
                    WHERE id = %s
                """, (req.minutos, costo, costo, sesion_id))

            cur.execute("UPDATE mesas SET estado = 'disponible', luz_encendida = false WHERE id = %s", (req.mesa_id,))

            return {
                "message": "Tiempo cargado a la cuenta del jugador",
                "pedido_id": pedido_id,
                "codigo_pedido": codigo_pedido,
                "deportista": titular,
            }


@router.patch("/{pedido_id}/estado")
def actualizar_estado(pedido_id: str, req: ActualizarEstadoPedidoRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            _asegurar_esquema_pedidos(cur)
            entregado_sql = ", entregado_el = CURRENT_TIMESTAMP" if req.estado in ("servido", "pagado") else ""
            cur.execute(f"""
                UPDATE pedidos
                SET estado = %s,
                    metodo_pago = COALESCE(%s, metodo_pago),
                    monto_recibido = COALESCE(%s, monto_recibido),
                    cambio = COALESCE(%s, cambio),
                    motivo_anulacion = COALESCE(%s, motivo_anulacion)
                    {entregado_sql}
                WHERE id = %s
                RETURNING id, estado, metodo_pago, monto_recibido, cambio, motivo_anulacion, total_pedido, sesion_id
            """, (req.estado, req.metodo_pago, req.monto_recibido, req.cambio, req.motivo_anulacion, pedido_id))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Pedido no encontrado")

            # Si se pagó desde Ventas y Pedidos, registrar en caja si hay turno abierto
            if req.estado == "pagado":
                cur.execute("SELECT id FROM turnos_caja WHERE estado = 'abierto' ORDER BY fecha_apertura DESC LIMIT 1")
                turno = cur.fetchone()
                if turno:
                    metodo_db = (req.metodo_pago or "efectivo").lower()
                    if metodo_db not in ("efectivo", "transferencia", "tarjeta"):
                        metodo_db = "transferencia" if "transf" in metodo_db or "nequi" in metodo_db else "efectivo"
                    cur.execute("""
                        INSERT INTO movimientos_caja (
                            turno_id, pedido_id, sesion_id, tipo, metodo_pago, monto, descripcion, usuario_id
                        ) VALUES (%s, %s, %s, 'venta_mesa', %s, %s, %s, (SELECT id FROM usuarios LIMIT 1))
                    """, (turno["id"], pedido_id, row.get("sesion_id"), metodo_db, row["total_pedido"], f"Cobro cuenta {pedido_id}"))

            return {"message": "Estado actualizado", "pedido": row}


class EditarPedidoRequest(BaseModel):
    items: List[DetalleItemRequest]
    nota: Optional[str] = None
    estado: Optional[str] = None


@router.put("/{pedido_id}")
def editar_pedido(pedido_id: str, req: EditarPedidoRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            _asegurar_esquema_pedidos(cur)
            cur.execute("SELECT id, estado FROM pedidos WHERE id = %s", (pedido_id,))
            pedido = cur.fetchone()
            if not pedido:
                raise HTTPException(status_code=404, detail="Pedido no encontrado")

            # Conservar cargos de tiempo (productos con activo = false)
            cur.execute("""
                SELECT dp.id, dp.producto_id, dp.cantidad, dp.subtotal, pr.permite_inventario, pr.activo
                FROM detalle_pedidos dp
                JOIN productos pr ON pr.id = dp.producto_id
                WHERE dp.pedido_id = %s
            """, (pedido_id,))
            items_anteriores = cur.fetchall()
            for it in items_anteriores:
                if it["permite_inventario"]:
                    cur.execute("""
                        UPDATE productos
                        SET stock_actual = stock_actual + %s
                        WHERE id = %s
                    """, (it["cantidad"], it["producto_id"]))

            # Eliminar solo detalles de productos normales (conservar cargos de tiempo si no vienen en req.items)
            ids_enviados = {it.producto_id for it in req.items}
            for it in items_anteriores:
                if it["activo"] or it["producto_id"] in ids_enviados:
                    cur.execute("DELETE FROM detalle_pedidos WHERE id = %s", (it["id"],))

            for item in req.items:
                cur.execute(
                    "SELECT id, nombre, precio_venta, stock_actual, permite_inventario, activo FROM productos WHERE id = %s",
                    (item.producto_id,),
                )
                prod = cur.fetchone()
                if prod:
                    if prod["permite_inventario"] and item.cantidad > prod["stock_actual"]:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Stock insuficiente para {prod['nombre']} (disponible: {prod['stock_actual']})",
                        )
                    sub = float(prod["precio_venta"]) * item.cantidad
                    cur.execute("""
                        INSERT INTO detalle_pedidos (pedido_id, producto_id, jugador_id, cantidad, precio_unitario, subtotal, nota)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, (pedido_id, prod["id"], item.jugador_id, item.cantidad, prod["precio_venta"], sub, item.nota))

                    if prod["permite_inventario"]:
                        cur.execute("""
                            UPDATE productos
                            SET stock_actual = stock_actual - %s
                            WHERE id = %s
                        """, (item.cantidad, prod["id"]))

            cur.execute("""
                SELECT COALESCE(SUM(subtotal), 0) as total_nuevo
                FROM detalle_pedidos
                WHERE pedido_id = %s
            """, (pedido_id,))
            total_nuevo = float(cur.fetchone()["total_nuevo"])

            estado_clause = ", estado = %s" if req.estado else ""
            params = [total_nuevo, req.nota]
            if req.estado:
                params.append(req.estado)
            params.append(pedido_id)

            cur.execute(f"""
                UPDATE pedidos
                SET total_pedido = %s, nota = COALESCE(%s, nota) {estado_clause}
                WHERE id = %s
            """, tuple(params))

            return {"message": "Pedido actualizado", "total": total_nuevo}


@router.delete("/{pedido_id}")
def eliminar_pedido(pedido_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT dp.producto_id, dp.cantidad, p.estado, pr.permite_inventario
                FROM detalle_pedidos dp
                JOIN pedidos p ON p.id = dp.pedido_id
                JOIN productos pr ON pr.id = dp.producto_id
                WHERE dp.pedido_id = %s
            """, (pedido_id,))
            items = cur.fetchall()

            cur.execute("SELECT id FROM pedidos WHERE id = %s", (pedido_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Pedido no encontrado")

            for item in items:
                if item["permite_inventario"] and item["estado"] not in ("cancelado", "anulado"):
                    cur.execute("""
                        UPDATE productos
                        SET stock_actual = stock_actual + %s
                        WHERE id = %s
                    """, (item["cantidad"], item["producto_id"]))

            cur.execute("DELETE FROM movimientos_caja WHERE pedido_id = %s", (pedido_id,))
            cur.execute("DELETE FROM detalle_pedidos WHERE pedido_id = %s", (pedido_id,))
            cur.execute("DELETE FROM pedidos WHERE id = %s", (pedido_id,))

            return {"message": "Pedido eliminado exitosamente"}
