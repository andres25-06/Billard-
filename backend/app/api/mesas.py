# pyright: reportArgumentType=false, reportCallIssue=false, reportIndexIssue=false, reportOptionalSubscript=false, reportGeneralTypeIssues=false
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from app.core.database import get_db

router = APIRouter(prefix="/api/mesas", tags=["Mesas"])

class AbrirMesaRequest(BaseModel):
    modalidad_tiempo: str = "libre"  # 'libre' o 'prepago'
    minutos_prepago: Optional[int] = 0
    jugadores: List[str] = ["Mesa"]
    nota: Optional[str] = None
    usuario_id: Optional[str] = None

class AgregarCuentaMesaRequest(BaseModel):
    nombre: str

class ActualizarPuntosRequest(BaseModel):
    jugador_id: str
    delta: int  # +1 o -1

class CerrarMesaRequest(BaseModel):
    descuento: Optional[float] = 0.0
    usuario_id: Optional[str] = None
    metodo_pago: str = "efectivo"

_MESAS_CONFIGURADAS = False

def _asegurar_configuracion_mesas(cur):
    global _MESAS_CONFIGURADAS
    if _MESAS_CONFIGURADAS:
        return
    # Asegurar tabla clientes para persistencia real de jugadores
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
    # Configurar exactamente 3 mesas de Tres Bandas y 1 mesa de Pool
    mesas_oficiales = [
        (1, "Mesa 1 - Tres Bandas", "tres_bandas", 18000.00, 1),
        (2, "Mesa 2 - Tres Bandas", "tres_bandas", 18000.00, 2),
        (3, "Mesa 3 - Tres Bandas", "tres_bandas", 18000.00, 3),
        (4, "Mesa 4 - Pool", "pool", 14000.00, 4),
    ]
    for numero, nombre, tipo, tarifa, orden in mesas_oficiales:
        cur.execute("""
            INSERT INTO mesas (numero, nombre, tipo, tarifa_por_hora, estado, luz_encendida, orden_visual)
            VALUES (%s, %s, %s, %s, 'disponible', false, %s)
            ON CONFLICT (numero) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                tipo = EXCLUDED.tipo,
                tarifa_por_hora = EXCLUDED.tarifa_por_hora,
                orden_visual = EXCLUDED.orden_visual
        """, (numero, nombre, tipo, tarifa, orden))

    # Eliminar mesas sobrantes (ej. antigua Mesa 5) limpiando referencias si existen
    cur.execute("SELECT id FROM mesas WHERE numero > 4")
    sobrantes = [r["id"] for r in cur.fetchall()]
    for m_id in sobrantes:
        cur.execute("""
            UPDATE pedidos SET mesa_id = NULL, sesion_id = NULL
            WHERE mesa_id = %s OR sesion_id IN (SELECT id FROM sesiones_mesa WHERE mesa_id = %s)
        """, (m_id, m_id))
        cur.execute("""
            UPDATE movimientos_caja SET sesion_id = NULL
            WHERE sesion_id IN (SELECT id FROM sesiones_mesa WHERE mesa_id = %s)
        """, (m_id,))
        cur.execute("DELETE FROM sesiones_mesa WHERE mesa_id = %s", (m_id,))
        cur.execute("DELETE FROM mesas WHERE id = %s", (m_id,))

    _MESAS_CONFIGURADAS = True

@router.get("")
def listar_mesas():
    with get_db() as conn:
        with conn.cursor() as cur:
            _asegurar_configuracion_mesas(cur)
            cur.execute("""
                SELECT 
                    m.id, m.numero, m.nombre, m.tipo, m.tarifa_por_hora, 
                    m.tarifa_fraccion_minutos, m.estado, m.luz_encendida, m.orden_visual
                FROM mesas m
                ORDER BY m.orden_visual ASC, m.numero ASC
            """)
            mesas = cur.fetchall()

            for mesa in mesas:
                # Buscar sesión activa si está ocupada o en pausa
                cur.execute("""
                    SELECT 
                        s.id as sesion_id, s.modalidad_tiempo, s.minutos_prepago, 
                        s.hora_inicio, s.tarifa_hora_aplicada, s.estado as sesion_estado,
                        COALESCE(s.descuento, 0) as descuento
                    FROM sesiones_mesa s
                    WHERE s.mesa_id = %s AND s.estado IN ('activa', 'pausada')
                    ORDER BY s.hora_inicio DESC LIMIT 1
                """, (mesa["id"],))
                sesion = cur.fetchone()

                if sesion:
                    # Calcular minutos transcurridos
                    inicio = sesion["hora_inicio"]
                    ahora = datetime.now(timezone.utc)
                    minutos = max(0, int((ahora - inicio).total_seconds() / 60))
                    
                    # Calcular costo por tiempo
                    tarifa_hora = float(sesion["tarifa_hora_aplicada"])
                    costo_tiempo = round((minutos / 60.0) * tarifa_hora, 2)

                    # Obtener jugadores/cuentas de la sesión
                    cur.execute("""
                        SELECT id, nombre, puntos_carambolas, posicion
                        FROM jugadores_sesion
                        WHERE sesion_id = %s
                        ORDER BY posicion ASC
                    """, (sesion["sesion_id"],))
                    jugadores = cur.fetchall()

                    # Asegurar que la cuenta base 'Mesa' siempre exista en la sesión
                    if not any(j["nombre"].strip().lower() == "mesa" for j in jugadores):
                        cur.execute("""
                            INSERT INTO jugadores_sesion (sesion_id, posicion, nombre, puntos_carambolas)
                            VALUES (%s, 0, 'Mesa', 0)
                            RETURNING id, nombre, puntos_carambolas, posicion
                        """, (sesion["sesion_id"],))
                        nueva_mesa_cuenta = cur.fetchone()
                        jugadores = [nueva_mesa_cuenta] + list(jugadores)

                    # Obtener detalle de productos pedidos en esta sesión para calcular consumo real por cuenta
                    cur.execute("""
                        SELECT dp.jugador_id, dp.nota, dp.subtotal
                        FROM pedidos p
                        JOIN detalle_pedidos dp ON dp.pedido_id = p.id
                        WHERE p.sesion_id = %s AND p.estado != 'cancelado'
                    """, (sesion["sesion_id"],))
                    detalles_sesion = cur.fetchall()

                    consumo_por_id = {str(j["id"]): 0.0 for j in jugadores}
                    mapa_nombre_a_id = {j["nombre"].strip().lower(): str(j["id"]) for j in jugadores}
                    id_cuenta_mesa = mapa_nombre_a_id.get("mesa")

                    total_pedidos = 0.0
                    for d in detalles_sesion:
                        sub = float(d["subtotal"] or 0.0)
                        total_pedidos += sub
                        j_id = str(d["jugador_id"]) if d["jugador_id"] else None
                        if j_id and j_id in consumo_por_id:
                            consumo_por_id[j_id] += sub
                        else:
                            nota_str = (d["nota"] or "").strip()
                            asignado = False
                            if nota_str.lower().startswith("cuenta:"):
                                nom_cuenta = nota_str.split(":", 1)[1].strip().lower()
                                if nom_cuenta in mapa_nombre_a_id:
                                    consumo_por_id[mapa_nombre_a_id[nom_cuenta]] += sub
                                    asignado = True
                            if not asignado and id_cuenta_mesa:
                                consumo_por_id[id_cuenta_mesa] += sub

                    for j in jugadores:
                        j["consumo_bar"] = round(consumo_por_id.get(str(j["id"]), 0.0), 2)

                    mesa["sesion"] = {
                        **sesion,
                        "minutos_transcurridos": minutos,
                        "costo_tiempo": costo_tiempo,
                        "total_pedidos": total_pedidos,
                        "total_acumulado": costo_tiempo + total_pedidos,
                        "jugadores": jugadores
                    }
                else:
                    mesa["sesion"] = None

            return {"mesas": mesas}

@router.post("/{mesa_id}/abrir")
def abrir_mesa(mesa_id: str, req: AbrirMesaRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            _asegurar_configuracion_mesas(cur)
            cur.execute("SELECT id, tarifa_por_hora, estado FROM mesas WHERE id = %s", (mesa_id,))
            mesa = cur.fetchone()
            if not mesa:
                raise HTTPException(status_code=404, detail="Mesa no encontrada")
            if mesa["estado"] == "en_juego":
                raise HTTPException(status_code=400, detail="La mesa ya está en juego")

            # Crear sesión
            cur.execute("""
                INSERT INTO sesiones_mesa (
                    mesa_id, modalidad_tiempo, minutos_prepago, 
                    hora_inicio, tarifa_hora_aplicada, estado, nota
                ) VALUES (%s, %s, %s, CURRENT_TIMESTAMP, %s, 'activa', %s)
                RETURNING id
            """, (mesa_id, req.modalidad_tiempo, req.minutos_prepago, mesa["tarifa_por_hora"], req.nota))
            nueva_sesion = cur.fetchone()
            sesion_id = nueva_sesion["id"]

            # Garantizar que 'Mesa' sea siempre la primera cuenta y registrar jugadores únicos
            nombres_finales = ["Mesa"]
            for raw_nombre in req.jugadores:
                limpio = (raw_nombre or "").strip()
                if limpio and not any(n.lower() == limpio.lower() for n in nombres_finales):
                    nombres_finales.append(limpio)

            for idx, nombre in enumerate(nombres_finales, start=1):
                cur.execute("""
                    INSERT INTO jugadores_sesion (sesion_id, posicion, nombre, puntos_carambolas)
                    VALUES (%s, %s, %s, 0)
                """, (sesion_id, idx, nombre))
                # Si no es la cuenta genérica 'Mesa', guardar/actualizar en directorio de clientes
                if nombre.lower() != "mesa" and not nombre.lower().startswith("cuenta "):
                    cur.execute("""
                        INSERT INTO clientes (nombre, visitas)
                        VALUES (%s, 1)
                        ON CONFLICT (nombre) DO UPDATE SET visitas = clientes.visitas + 1
                    """, (nombre,))

            # Actualizar estado de la mesa a 'en_juego' y encender luz
            cur.execute("""
                UPDATE mesas 
                SET estado = 'en_juego', luz_encendida = true
                WHERE id = %s
            """, (mesa_id,))

            return {"message": "Mesa abierta con éxito", "sesion_id": sesion_id}

@router.post("/{mesa_id}/cuentas")
def agregar_cuenta_sesion(mesa_id: str, req: AgregarCuentaMesaRequest):
    nombre_limpio = (req.nombre or "").strip()
    if not nombre_limpio:
        raise HTTPException(status_code=400, detail="El nombre de la cuenta es obligatorio")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id FROM sesiones_mesa
                WHERE mesa_id = %s AND estado IN ('activa', 'pausada')
                ORDER BY hora_inicio DESC LIMIT 1
            """, (mesa_id,))
            sesion = cur.fetchone()
            if not sesion:
                raise HTTPException(status_code=404, detail="No hay sesión activa en esta mesa")

            sesion_id = sesion["id"]
            cur.execute("""
                SELECT id, nombre, puntos_carambolas, posicion
                FROM jugadores_sesion
                WHERE sesion_id = %s AND LOWER(nombre) = LOWER(%s)
            """, (sesion_id, nombre_limpio))
            existente = cur.fetchone()
            if existente:
                return {"jugador": existente}

            cur.execute("SELECT COALESCE(MAX(posicion), 0) + 1 as prox FROM jugadores_sesion WHERE sesion_id = %s", (sesion_id,))
            prox = cur.fetchone()["prox"]

            cur.execute("""
                INSERT INTO jugadores_sesion (sesion_id, posicion, nombre, puntos_carambolas)
                VALUES (%s, %s, %s, 0)
                RETURNING id, nombre, puntos_carambolas, posicion
            """, (sesion_id, prox, nombre_limpio))
            nuevo = cur.fetchone()

            if nombre_limpio.lower() != "mesa" and not nombre_limpio.lower().startswith("cuenta "):
                cur.execute("""
                    INSERT INTO clientes (nombre, visitas)
                    VALUES (%s, 1)
                    ON CONFLICT (nombre) DO UPDATE SET visitas = clientes.visitas + 1
                """, (nombre_limpio,))

            return {"jugador": nuevo}

@router.delete("/{mesa_id}/cuentas/{nombre_cuenta}")
def eliminar_cuenta_sesion(mesa_id: str, nombre_cuenta: str):
    nombre_limpio = (nombre_cuenta or "").strip()
    if nombre_limpio.lower() == "mesa":
        raise HTTPException(status_code=400, detail="La cuenta principal 'Mesa' no se puede eliminar")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id FROM sesiones_mesa
                WHERE mesa_id = %s AND estado IN ('activa', 'pausada')
                ORDER BY hora_inicio DESC LIMIT 1
            """, (mesa_id,))
            sesion = cur.fetchone()
            if not sesion:
                raise HTTPException(status_code=404, detail="No hay sesión activa en esta mesa")

            sesion_id = sesion["id"]
            cur.execute("""
                DELETE FROM jugadores_sesion
                WHERE sesion_id = %s AND LOWER(nombre) = LOWER(%s)
            """, (sesion_id, nombre_limpio))
            return {"message": "Cuenta eliminada de la sesión"}

@router.post("/{mesa_id}/cerrar")
def cerrar_mesa(mesa_id: str, req: CerrarMesaRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT s.id, s.hora_inicio, s.tarifa_hora_aplicada
                FROM sesiones_mesa s
                WHERE s.mesa_id = %s AND s.estado IN ('activa', 'pausada')
                ORDER BY s.hora_inicio DESC LIMIT 1
            """, (mesa_id,))
            sesion = cur.fetchone()
            if not sesion:
                raise HTTPException(status_code=404, detail="No hay sesión activa para esta mesa")

            sesion_id = sesion["id"]
            hora_inicio = sesion["hora_inicio"]
            ahora = datetime.now(timezone.utc)
            minutos = max(1, int((ahora - hora_inicio).total_seconds() / 60))
            costo_tiempo = round((minutos / 60.0) * float(sesion["tarifa_hora_aplicada"]), 2)

            cur.execute("""
                SELECT COALESCE(SUM(dp.subtotal), 0) as total_pedidos
                FROM pedidos p
                JOIN detalle_pedidos dp ON dp.pedido_id = p.id
                WHERE p.sesion_id = %s AND p.estado != 'cancelado'
            """, (sesion_id,))
            prod_row = cur.fetchone()
            total_pedidos = float(prod_row["total_pedidos"] if prod_row else 0.0)
            total_final = max(0.0, costo_tiempo + total_pedidos - (req.descuento or 0.0))

            # Finalizar sesión
            cur.execute("""
                UPDATE sesiones_mesa
                SET hora_fin = CURRENT_TIMESTAMP,
                    minutos_totales = %s,
                    total_tiempo = %s,
                    total_productos = %s,
                    descuento = %s,
                    total_final = %s,
                    estado = 'finalizada'
                WHERE id = %s
            """, (minutos, costo_tiempo, total_pedidos, req.descuento, total_final, sesion_id))

            # Liberar mesa y apagar luz
            cur.execute("""
                UPDATE mesas
                SET estado = 'disponible', luz_encendida = false
                WHERE id = %s
                RETURNING numero
            """, (mesa_id,))
            mesa_row = cur.fetchone()
            mesa_numero = mesa_row["numero"] if mesa_row else 1

            # Registrar o actualizar el pedido de la sesión como pagado en la tabla pedidos
            from app.api.pedidos import _asegurar_esquema_pedidos, obtener_o_crear_producto_tiempo
            _asegurar_esquema_pedidos(cur)
            prod_tiempo_id = obtener_o_crear_producto_tiempo(cur)
            metodo_label = "Efectivo" if (req.metodo_pago or "").lower() == "efectivo" else "Transferencia"

            cur.execute("""
                SELECT id FROM pedidos
                WHERE sesion_id = %s AND estado = 'pendiente'
                ORDER BY solicitado_el ASC
            """, (sesion_id,))
            pedidos_sesion = cur.fetchall()

            if pedidos_sesion:
                pedido_principal_id = pedidos_sesion[0]["id"]
                for extra in pedidos_sesion[1:]:
                    cur.execute("UPDATE detalle_pedidos SET pedido_id = %s WHERE pedido_id = %s", (pedido_principal_id, extra["id"]))
                    cur.execute("DELETE FROM pedidos WHERE id = %s", (extra["id"],))
            else:
                cur.execute("SELECT COUNT(*) + 1 as seq FROM pedidos")
                seq = cur.fetchone()["seq"]
                codigo_pedido = f"MESA-{mesa_numero:02d}-{int(ahora.timestamp()) % 10000:04d}"
                titular_mesa = f"Mesa {mesa_numero}"
                cur.execute("""
                    INSERT INTO pedidos (codigo_pedido, sesion_id, mesa_id, origen, estado, total_pedido, nota, deportista, metodo_pago)
                    VALUES (%s, %s, %s, 'caja', 'pagado', 0.0, %s, %s, %s)
                    RETURNING id
                """, (codigo_pedido, sesion_id, mesa_id, titular_mesa, titular_mesa, metodo_label))
                pedido_principal_id = cur.fetchone()["id"]

            cur.execute("""
                INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal, nota)
                VALUES (%s, %s, 1, %s, %s, %s)
            """, (pedido_principal_id, prod_tiempo_id, costo_tiempo, costo_tiempo, f"Tiempo de juego ({minutos} min)"))

            cur.execute("""
                UPDATE pedidos
                SET estado = 'pagado',
                    metodo_pago = %s,
                    entregado_el = CURRENT_TIMESTAMP,
                    total_pedido = (
                        SELECT COALESCE(SUM(subtotal), 0) FROM detalle_pedidos WHERE pedido_id = %s
                    )
                WHERE id = %s
            """, (metodo_label, pedido_principal_id, pedido_principal_id))

            # Registrar movimiento en caja si hay un turno abierto
            cur.execute("SELECT id FROM turnos_caja WHERE estado = 'abierto' ORDER BY fecha_apertura DESC LIMIT 1")
            turno = cur.fetchone()
            if turno:
                cur.execute("""
                    INSERT INTO movimientos_caja (
                        turno_id, sesion_id, tipo, metodo_pago, monto, descripcion, usuario_id
                    ) VALUES (%s, %s, 'venta_mesa', %s, %s, %s, (SELECT id FROM usuarios LIMIT 1))
                """, (turno["id"], sesion_id, req.metodo_pago, total_final, f"Cierre de mesa {mesa_id} - {minutos} min"))

            return {
                "message": "Mesa cerrada con éxito",
                "resumen": {
                    "minutos": minutos,
                    "costo_tiempo": costo_tiempo,
                    "total_pedidos": total_pedidos,
                    "descuento": req.descuento,
                    "total_final": total_final
                }
            }

@router.post("/jugador/{jugador_id}/carambola")
def actualizar_carambola(jugador_id: str, req: ActualizarPuntosRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE jugadores_sesion
                SET puntos_carambolas = GREATEST(0, puntos_carambolas + %s)
                WHERE id = %s
                RETURNING id, puntos_carambolas
            """, (req.delta, jugador_id))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Jugador no encontrado")
            return {"message": "Puntos actualizados", "puntos": row["puntos_carambolas"]}

@router.post("/{mesa_id}/luz")
def toggle_luz(mesa_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE mesas
                SET luz_encendida = NOT luz_encendida
                WHERE id = %s
                RETURNING id, luz_encendida
            """, (mesa_id,))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Mesa no encontrada")
            return {"mesa_id": mesa_id, "luz_encendida": row["luz_encendida"]}
