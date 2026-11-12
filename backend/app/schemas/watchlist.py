from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class WatchlistItemOut(BaseModel):
    id: int
    symbol: str
    name: str
    rank: int
    price: Optional[float] = None
    change_24h: Optional[float] = None
    market_cap: Optional[float] = None
    trend: Optional[str] = None
    volatility: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
