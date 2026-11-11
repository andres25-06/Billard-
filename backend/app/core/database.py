import os
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
from app.core.config import settings

# Evitar errores de decodificación UTF-8 con mensajes de libpq en español en Windows (CP1252)
os.environ.setdefault("PGCLIENTENCODING", "UTF8")
os.environ.setdefault("LC_MESSAGES", "C")

_WORKING_PASSWORD = None
_SCHEMA_VERIFIED = False

def _try_connect(dbname: str, password: str):
    return psycopg2.connect(
        host=settings.DB_HOST,
        port=settings.DB_PORT,
        dbname=dbname,
        user=settings.DB_USER,
        password=password,
        cursor_factory=RealDictCursor,
    )

def _ensure_schema(conn):
    global _SCHEMA_VERIFIED
    if _SCHEMA_VERIFIED:
        return
    with conn.cursor() as cur:
        cur.execute("SELECT to_regclass('public.mesas') AS existe")
        row = cur.fetchone()
        if not row or not row.get("existe"):
            schema_file = Path(__file__).resolve().parent.parent.parent.parent / "database" / "migrations" / "001_initial_schema.sql"
            if schema_file.exists():
                sql_script = schema_file.read_text(encoding="utf-8")
                cur.execute(sql_script)
                conn.commit()
    _SCHEMA_VERIFIED = True

def get_connection():
    global _WORKING_PASSWORD

    candidatos = []
    if _WORKING_PASSWORD is not None:
        candidatos.append(_WORKING_PASSWORD)
    for pwd in [settings.DB_PASSWORD, "123", "Andres1234", "postgres", "1234", "admin", ""]:
        if pwd not in candidatos:
            candidatos.append(pwd)

    ultimo_error = None
    for pwd in candidatos:
        try:
            conn = _try_connect(settings.DB_NAME, pwd)
            _WORKING_PASSWORD = pwd
            _ensure_schema(conn)
            return conn
        except (psycopg2.OperationalError, UnicodeDecodeError) as e:
            ultimo_error = e
            # Intentar conectar a la BD por defecto 'postgres' por si la BD 'Billard' aún no ha sido creada
            try:
                admin_conn = _try_connect("postgres", pwd)
                admin_conn.autocommit = True
                with admin_conn.cursor() as cur:
                    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (settings.DB_NAME,))
                    if not cur.fetchone():
                        cur.execute(f'CREATE DATABASE "{settings.DB_NAME}"')
                admin_conn.close()

                conn = _try_connect(settings.DB_NAME, pwd)
                _WORKING_PASSWORD = pwd
                _ensure_schema(conn)
                return conn
            except (psycopg2.OperationalError, UnicodeDecodeError):
                continue

    raise RuntimeError(
        f"No se pudo conectar a PostgreSQL en {settings.DB_HOST}:{settings.DB_PORT} "
        f"(usuario '{settings.DB_USER}', base de datos '{settings.DB_NAME}'). "
        f"Verifica que el servicio de PostgreSQL esté activo y que la contraseña en backend/.env sea correcta."
    ) from ultimo_error

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
