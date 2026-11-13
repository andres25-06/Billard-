import unittest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app


class TestMapaMesas(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_flujo_completo_mesa(self):
        # 1. Listar mesas
        res = self.client.get("/api/mesas")
        self.assertEqual(res.status_code, 200, res.text)
        data = res.json()
        self.assertIn("mesas", data)
        self.assertGreater(len(data["mesas"]), 0, "Debe existir al menos una mesa")

        # Buscar una mesa libre para la prueba
        mesa_libre = next((m for m in data["mesas"] if m["estado"] == "libre"), None)
        if not mesa_libre:
            self.skipTest("No hay mesas libres en este momento para probar apertura/cierre")

        mesa_id = mesa_libre["id"]

        # 2. Abrir mesa
        res_abrir = self.client.post(
            f"/api/mesas/{mesa_id}/abrir",
            json={
                "modalidad_tiempo": "libre",
                "minutos_prepago": 0,
                "jugadores": ["Jugador Test 1", "Jugador Test 2"],
            },
        )
        self.assertEqual(res_abrir.status_code, 200, res_abrir.text)

        # 3. Verificar que la mesa está en_juego y tiene jugadores
        res_estado = self.client.get("/api/mesas")
        mesa_actual = next(m for m in res_estado.json()["mesas"] if m["id"] == mesa_id)
        self.assertEqual(mesa_actual["estado"], "en_juego")
        self.assertIsNotNone(mesa_actual["sesion"])
        jugadores = mesa_actual["sesion"]["jugadores"]
        self.assertEqual(len(jugadores), 2)

        # 4. Alternar luz
        res_luz = self.client.post(f"/api/mesas/{mesa_id}/luz")
        self.assertEqual(res_luz.status_code, 200, res_luz.text)

        # 5. Sumar y restar carambolas al primer jugador
        jugador_id = jugadores[0]["id"]
        res_pts = self.client.post(
            f"/api/mesas/jugador/{jugador_id}/carambola",
            json={"jugador_id": jugador_id, "delta": 1},
        )
        self.assertEqual(res_pts.status_code, 200, res_pts.text)

        res_pts_menos = self.client.post(
            f"/api/mesas/jugador/{jugador_id}/carambola",
            json={"jugador_id": jugador_id, "delta": -1},
        )
        self.assertEqual(res_pts_menos.status_code, 200, res_pts_menos.text)

        # 6. Cerrar y cobrar mesa
        res_cerrar = self.client.post(
            f"/api/mesas/{mesa_id}/cerrar",
            json={"descuento": 0, "metodo_pago": "efectivo"},
        )
        self.assertEqual(res_cerrar.status_code, 200, res_cerrar.text)

        # 7. Verificar que la mesa quedó libre nuevamente
        res_final = self.client.get("/api/mesas")
        mesa_final = next(m for m in res_final.json()["mesas"] if m["id"] == mesa_id)
        self.assertEqual(mesa_final["estado"], "libre")


if __name__ == "__main__":
    unittest.main(verbosity=2)
