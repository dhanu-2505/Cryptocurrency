from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel
from app.schemas.coin import CoinOut


class ScrapeStatusOut(BaseModel):
    id: int
    started_at: datetime
    completed_at: Optional[datetime]
    status: str
    coins_scraped: int
    error_message: Optional[str]

    model_config = {"from_attributes": True}


class ScrapeResultOut(BaseModel):
    success: bool
    message: str
    coins_scraped: int = 0
    duration_seconds: Optional[float] = None
    coins: Optional[List[CoinOut]] = None
    error: Optional[str] = None
    last_updated: Optional[datetime] = None
