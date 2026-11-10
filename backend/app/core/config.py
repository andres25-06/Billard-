import os
import json
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", 5432))
    DB_NAME: str = os.getenv("DB_NAME", "Billard")
    DB_USER: str = os.getenv("DB_USER", "postgres")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "123")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    @property
    def cors_origins(self) -> list:
        raw = os.getenv("CORS_ORIGINS", '["*"]')
        try:
            return json.loads(raw)
        except Exception:
            return ["*"]

settings = Settings()
