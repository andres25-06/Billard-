import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.mesas import router as mesas_router
from app.api.pedidos import router as pedidos_router
from app.api.productos import router as productos_router
from app.api.caja import router as caja_router
from app.api.alertas import router as alertas_router
from app.core.database import get_db

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("billard-api")

app = FastAPI(
    title="Billard Control API",
    description="API de Control de Mesas, Pedidos, Caja e Inventario para Club de Billar",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mesas_router)
app.include_router(pedidos_router)
app.include_router(productos_router)
app.include_router(caja_router)
app.include_router(alertas_router)

@app.get("/")
def root():
    return {
        "sistema": "Billard Chamo - API de Control",
        "version": "1.0.0",
        "estado": "operativo",
        "entorno": settings.ENVIRONMENT
    }

@app.get("/api/stats-sidebar")
def get_stats_sidebar():
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as en_juego FROM mesas WHERE estado = 'en_juego'")
            mesas_en_juego = cur.fetchone()["en_juego"]

            cur.execute("SELECT COUNT(*) as pendientes FROM pedidos WHERE estado = 'pendiente'")
            pedidos_pendientes = cur.fetchone()["pendientes"]

            cur.execute("SELECT COUNT(*) as bajo FROM productos WHERE activo = true AND stock_actual <= stock_minimo")
            stock_bajo = cur.fetchone()["bajo"]

            cur.execute("SELECT id FROM turnos_caja WHERE estado = 'abierto' LIMIT 1")
            caja_abierta = cur.fetchone() is not None

            cur.execute("SELECT COUNT(*) as alertas FROM alertas_mesa WHERE atendida = false")
            alertas = cur.fetchone()["alertas"]

            return {
                "mesas_en_juego": mesas_en_juego,
                "pedidos_pendientes": pedidos_pendientes,
                "stock_bajo": stock_bajo,
                "caja_abierta": caja_abierta,
                "alertas": alertas
            }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
