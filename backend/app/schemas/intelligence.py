from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class MarketMoodOut(BaseModel):
    score: int = Field(..., ge=0, le=100)
    label: str  # Bearish, Neutral, Bullish
    positive_coins: int
    negative_coins: int
    average_change_24h: float
    market_cap_change_weighted: Optional[float] = None
    calculated_at: datetime


class DataQualityOut(BaseModel):
    score: int = Field(..., ge=0, le=100)
    coins_collected: int
    expected_coins: int
    valid_prices: int
    valid_market_caps: int
    valid_changes: int
    last_scrape_status: str
    freshness_minutes: float
    calculated_at: datetime


class VolatilityOut(BaseModel):
    symbol: str
    status: str  # success, insufficient_data
    volatility: str  # Low, Medium, High, Unknown
    volatility_score: float
    observations: int
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    message: Optional[str] = None


class TrendOut(BaseModel):
    symbol: str
    trend: str  # Strong Uptrend, Uptrend, Neutral, Downtrend, Strong Downtrend
    momentum: float
    short_ma: Optional[float] = None
    long_ma: Optional[float] = None
    observations: int


class DrawdownOut(BaseModel):
    symbol: str
    current_price: float
    reference_high: float
    drawdown_pct: float
    classification: str  # Low, Moderate, High
    historical_records: int


class CoinCompareItem(BaseModel):
    id: int
    name: str
    symbol: str
    rank: int
    price: Optional[float] = None
    change_24h: Optional[float] = None
    market_cap: Optional[float] = None
    volatility: str
    volatility_score: float
    trend: str
    momentum: float
    drawdown_pct: float


class CompareResponse(BaseModel):
    coins: List[CoinCompareItem]
    price_trends: List[Dict[str, Any]]
