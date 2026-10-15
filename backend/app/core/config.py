from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BidBull"
    ENVIRONMENT: str = "development"
    DATABASE_URL: str = "postgresql+psycopg://bidbull:bidbull@localhost:5432/bidbull"
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str = "secure_bidbull_secret_key_production_ready_value"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"
    SOFT_CLOSE_THRESHOLD_SECONDS: int = 120
    SOFT_CLOSE_EXTENSION_SECONDS: int = 120

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_cors_origins_list(self) -> list[str]:
        raw_origins = self.CORS_ORIGINS.split(",")
        origins: list[str] = []
        for origin in raw_origins:
            cleaned = origin.strip()
            if len(cleaned) > 0:
                origins.append(cleaned)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
