from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class PriceHistoryOut(BaseModel):
    id: int
    cryptocurrency_id: int
    price: float
    change_24h: Optional[float]
    market_cap: Optional[float]
    recorded_at: datetime

    model_config = {"from_attributes": True}


class CoinOut(BaseModel):
    id: int
    rank: int
    name: str
    symbol: str
    slug: Optional[str]
    price: Optional[float] = None
    change_24h: Optional[float] = None
    market_cap: Optional[float] = None
    recorded_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CoinDetailOut(CoinOut):
    price_history: List[PriceHistoryOut] = []


class StatsOut(BaseModel):
    total_coins: int
    total_records: Optional[int] = None
    top_gainer: Optional[CoinOut] = None
    top_loser: Optional[CoinOut] = None
    total_market_cap: Optional[float] = None
    average_price: Optional[float] = None
    last_updated: Optional[datetime] = None
