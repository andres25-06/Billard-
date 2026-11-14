import sys
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from main import app  # noqa: E402

client = TestClient(app)


class TestPedidosAPI:
    def test_listar_pedidos_responde_200(self):
        res = client.get("/api/pedidos")
        assert res.status_code == 200
        data = res.json()
        assert "pedidos" in data
        assert isinstance(data["pedidos"], list)

    def test_crear_pedido_sin_items_falla_validacion(self):
        res = client.post("/api/pedidos", json={"items": []})
        assert res.status_code in (400, 422)

    def test_acumular_mismo_jugador_y_liquidar(self):
        prods = client.get("/api/productos").json().get("productos", [])
        assert len(prods) > 0
        prod = prods[0]

        # 1. Primera venta a Andrés Rodríguez
        r1 = client.post(
            "/api/pedidos",
            json={
                "origen": "caja",
                "items": [
                    {
                        "producto_id": prod["id"],
                        "cantidad": 1,
                        "nota": "Cuenta: Andrés Rodríguez",
                    }
                ],
            },
        )
        assert r1.status_code == 200
        pedido_id_1 = r1.json()["pedido_id"]

        # 2. Segunda venta al mismo jugador mientras está pendiente -> debe acumular en el mismo pedido_id
        r2 = client.post(
            "/api/pedidos",
            json={
                "origen": "caja",
                "items": [
                    {
                        "producto_id": prod["id"],
                        "cantidad": 2,
                        "nota": "Cuenta: Andrés Rodríguez",
                    }
                ],
            },
        )
        assert r2.status_code == 200
        pedido_id_2 = r2.json()["pedido_id"]
        assert pedido_id_1 == pedido_id_2

        # 3. Liquidar el pedido con monto_recibido y cambio
        total_esperado = float(prod["precio_venta"]) * 3
        r_pago = client.patch(
            f"/api/pedidos/{pedido_id_1}/estado",
            json={
                "estado": "pagado",
                "metodo_pago": "Efectivo",
                "monto_recibido": total_esperado + 5000,
                "cambio": 5000,
            },
        )
        assert r_pago.status_code == 200
        assert r_pago.json()["pedido"]["estado"] == "pagado"

        # 4. Limpiar el pedido de prueba para dejar la BD limpia
        r_del = client.delete(f"/api/pedidos/{pedido_id_1}")
        assert r_del.status_code == 200

    def test_actualizar_estado_pedido_inexistente(self):
        res = client.patch(
            "/api/pedidos/00000000-0000-0000-0000-000000000000/estado",
            json={"estado": "pagado", "metodo_pago": "efectivo"},
        )
        assert res.status_code in (400, 404, 500)

    def test_eliminar_pedido_inexistente(self):
        res = client.delete("/api/pedidos/00000000-0000-0000-0000-000000000000")
        assert res.status_code in (400, 404, 500)
