from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db

router = APIRouter(prefix="/api/productos", tags=["Productos"])

class AjusteStockRequest(BaseModel):
    cantidad: int
    motivo: str  # 'merma', 'entrada_compra', 'ajuste_inventario'

@router.get("/categorias")
def listar_categorias():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, nombre, icono, color, orden
                FROM categorias_producto
                WHERE activo = true
                ORDER BY orden ASC, nombre ASC
            """)
            return {"categorias": cur.fetchall()}

@router.get("")
def listar_productos(categoria_id: Optional[str] = None):
    with get_db() as conn:
        with conn.cursor() as cur:
            query = """
                SELECT 
                    p.id, p.categoria_id, p.codigo_barras, p.nombre, p.descripcion,
                    p.precio_venta, p.precio_costo, p.stock_actual, p.stock_minimo,
                    c.nombre as categoria_nombre, c.color as categoria_color
                FROM productos p
                JOIN categorias_producto c ON c.id = p.categoria_id
                WHERE p.activo = true
            """
            params = []
            if categoria_id:
                query += " AND p.categoria_id = %s"
                params.append(categoria_id)

            query += " ORDER BY c.orden ASC, p.nombre ASC"
            cur.execute(query, tuple(params))
            return {"productos": cur.fetchall()}

@router.post("/{producto_id}/stock")
def ajustar_stock(producto_id: str, req: AjusteStockRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, stock_actual FROM productos WHERE id = %s", (producto_id,))
            prod = cur.fetchone()
            if not prod:
                raise HTTPException(status_code=404, detail="Producto no encontrado")

            stock_anterior = prod["stock_actual"]
            stock_nuevo = stock_anterior + req.cantidad

            cur.execute("""
                UPDATE productos
                SET stock_actual = %s
                WHERE id = %s
            """, (stock_nuevo, producto_id))

            cur.execute("""
                INSERT INTO movimientos_inventario (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo, usuario_id)
                VALUES (%s, %s, %s, %s, %s, %s, (SELECT id FROM usuarios LIMIT 1))
            """, (producto_id, req.motivo, abs(req.cantidad), stock_anterior, stock_nuevo, req.motivo))

            return {"message": "Stock actualizado", "stock_actual": stock_nuevo}
