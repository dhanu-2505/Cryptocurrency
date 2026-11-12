import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./crypto_tracker.db"
    SCRAPE_URL: str = "https://coinmarketcap.com/"
    HEADLESS: bool = True
    SCRAPE_TIMEOUT: int = 10
    SCRAPE_RETRY_ATTEMPTS: int = 1
    ALLOWED_ORIGINS: str = (
        "http://localhost:5173,http://localhost:5174,http://localhost:5175,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,"
        "http://localhost:3000"
    )
    LOG_LEVEL: str = "INFO"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
