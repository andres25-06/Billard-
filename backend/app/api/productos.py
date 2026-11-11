from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db

router = APIRouter(prefix="/api/productos", tags=["Productos"])

class AjusteStockRequest(BaseModel):
    cantidad: int
    motivo: str  # 'merma', 'entrada_compra', 'ajuste_inventario'

class ProductoCreateOrUpdateRequest(BaseModel):
    nombre: str
    categoria_id: Optional[str] = None
    categoria_nombre: Optional[str] = None
    codigo_barras: Optional[str] = None
    descripcion: Optional[str] = None
    precio_venta: float
    precio_costo: float
    stock_actual: Optional[int] = 0
    stock_minimo: Optional[int] = 10
    activo: Optional[bool] = True

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
def listar_productos(categoria_id: Optional[str] = None, incluir_inactivos: bool = False):
    with get_db() as conn:
        with conn.cursor() as cur:
            query = """
                SELECT 
                    p.id, p.categoria_id, p.codigo_barras, p.nombre, p.descripcion,
                    p.precio_venta, p.precio_costo, p.stock_actual, p.stock_minimo,
                    p.activo,
                    c.nombre as categoria_nombre, c.color as categoria_color
                FROM productos p
                JOIN categorias_producto c ON c.id = p.categoria_id
            """
            condiciones = []
            params = []

            if not incluir_inactivos:
                condiciones.append("p.activo = true")

            if categoria_id:
                condiciones.append("p.categoria_id = %s")
                params.append(categoria_id)

            if condiciones:
                query += " WHERE " + " AND ".join(condiciones)

            query += " ORDER BY c.orden ASC, p.nombre ASC"
            cur.execute(query, tuple(params))
            return {"productos": cur.fetchall()}

@router.post("")
def crear_producto(req: ProductoCreateOrUpdateRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            # Obtener categoría si viene por nombre
            cat_id = req.categoria_id
            if not cat_id and req.categoria_nombre:
                cur.execute("SELECT id FROM categorias_producto WHERE nombre ILIKE %s LIMIT 1", (f"%{req.categoria_nombre}%",))
                cat = cur.fetchone()
                if cat and isinstance(cat, dict):
                    cat_id = cat.get("id")
                elif cat:
                    cat_id = cat[0]

            if not cat_id:
                cur.execute("SELECT id FROM categorias_producto LIMIT 1")
                primera = cur.fetchone()
                if primera and isinstance(primera, dict):
                    cat_id = primera.get("id")
                elif primera:
                    cat_id = primera[0]

            cur.execute("""
                INSERT INTO productos (nombre, categoria_id, codigo_barras, descripcion, precio_venta, precio_costo, stock_actual, stock_minimo, activo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, nombre, stock_actual, precio_venta, activo
            """, (
                req.nombre,
                cat_id,
                req.codigo_barras,
                req.descripcion,
                req.precio_venta,
                req.precio_costo,
                req.stock_actual or 0,
                req.stock_minimo or 10,
                req.activo if req.activo is not None else True
            ))
            nuevo = cur.fetchone()
            return {"message": "Producto creado con éxito", "producto": nuevo}

@router.put("/{producto_id}")
def actualizar_producto(producto_id: str, req: ProductoCreateOrUpdateRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM productos WHERE id = %s", (producto_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Producto no encontrado")

            cur.execute("""
                UPDATE productos
                SET nombre = %s,
                    precio_venta = %s,
                    precio_costo = %s,
                    stock_minimo = %s,
                    activo = %s
                WHERE id = %s
                RETURNING id, nombre, activo, precio_venta
            """, (
                req.nombre,
                req.precio_venta,
                req.precio_costo,
                req.stock_minimo,
                req.activo if req.activo is not None else True,
                producto_id
            ))
            actualizado = cur.fetchone()
            return {"message": "Producto actualizado con éxito", "producto": actualizado}

@router.delete("/{producto_id}")
def eliminar_producto(producto_id: str):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, nombre FROM productos WHERE id = %s", (producto_id,))
            prod = cur.fetchone()
            if not prod:
                raise HTTPException(status_code=404, detail="Producto no encontrado")

            nombre_prod = prod.get("nombre") if isinstance(prod, dict) else prod[1]

            # Soft delete asegurando no romper claves foráneas en pedidos pasados
            cur.execute("UPDATE productos SET activo = false WHERE id = %s", (producto_id,))
            return {"message": f"Producto '{nombre_prod}' eliminado del catálogo"}

@router.post("/{producto_id}/stock")
def ajustar_stock(producto_id: str, req: AjusteStockRequest):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, stock_actual FROM productos WHERE id = %s", (producto_id,))
            prod = cur.fetchone()
            if not prod:
                raise HTTPException(status_code=404, detail="Producto no encontrado")

            stock_anterior = prod.get("stock_actual") if isinstance(prod, dict) else prod[1]
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
