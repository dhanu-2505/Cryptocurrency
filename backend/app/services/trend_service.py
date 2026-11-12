"""
Trend / Momentum Indicator service.
Calculates statistical moving averages and momentum from actual historical prices.
No fake predictions.
"""
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import asc

from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.utils.logger import get_logger

logger = get_logger(__name__)


def calculate_coin_trend(db: Session, symbol: str) -> Dict[str, Any]:
    """
    Compute statistical trend and momentum metrics:
    - Short-term moving average (last 3 observations)
    - Long-term moving average (last 7+ observations or full series)
    - Momentum percentage ((latest - base) / base * 100)
    - Classification: Strong Uptrend, Uptrend, Neutral, Downtrend, Strong Downtrend
    """
    coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == symbol.upper()).first()
    if not coin:
        return {
            "symbol": symbol.upper(),
            "trend": "Neutral",
            "momentum": 0.0,
            "short_ma": None,
            "long_ma": None,
            "observations": 0,
        }

    history = (
        db.query(PriceHistory.price)
        .filter(PriceHistory.cryptocurrency_id == coin.id)
        .order_by(asc(PriceHistory.recorded_at))
        .all()
    )

    prices = [h[0] for h in history if h[0] is not None and h[0] > 0]
    observations = len(prices)

    if observations == 0:
        return {
            "symbol": coin.symbol,
            "trend": "Neutral",
            "momentum": 0.0,
            "short_ma": None,
            "long_ma": None,
            "observations": 0,
        }

    if observations == 1:
        return {
            "symbol": coin.symbol,
            "trend": "Neutral",
            "momentum": 0.0,
            "short_ma": round(prices[0], 4),
            "long_ma": round(prices[0], 4),
            "observations": 1,
        }

    # Short MA: last 3 records (or 2 if only 2 available)
    short_window = min(3, observations)
    short_ma = sum(prices[-short_window:]) / short_window

    # Long MA: all records (or up to last 10)
    long_window = min(10, observations)
    long_ma = sum(prices[-long_window:]) / long_window

    # Momentum: % change from beginning of window to latest
    base_price = prices[0]
    latest_price = prices[-1]
    momentum = ((latest_price - base_price) / base_price) * 100.0 if base_price > 0 else 0.0

    # Classification logic based on momentum and MA crossover
    ma_diff_pct = ((short_ma - long_ma) / long_ma * 100.0) if long_ma > 0 else 0.0

    if momentum >= 4.0 and short_ma > long_ma:
        trend = "Strong Uptrend"
    elif momentum >= 1.0 or (short_ma > long_ma and momentum > 0):
        trend = "Uptrend"
    elif momentum <= -4.0 and short_ma < long_ma:
        trend = "Strong Downtrend"
    elif momentum <= -1.0 or (short_ma < long_ma and momentum < 0):
        trend = "Downtrend"
    else:
        trend = "Neutral"

    return {
        "symbol": coin.symbol,
        "trend": trend,
        "momentum": round(momentum, 2),
        "short_ma": round(short_ma, 4),
        "long_ma": round(long_ma, 4),
        "observations": observations,
    }
