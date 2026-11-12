"""
Volatility Analysis service.
Computes return volatility and classification from historical observations.
"""
import math
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import asc

from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.utils.logger import get_logger

logger = get_logger(__name__)


def calculate_coin_volatility(db: Session, symbol: str) -> Dict[str, Any]:
    """
    Compute volatility metrics from real historical price records for the coin:
    - Return percentage between consecutive records
    - Standard deviation of returns
    - Classification: Low (<1.5%), Medium (1.5-4.0%), High (>4.0%)
    - Price range (min, max)
    """
    coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == symbol.upper()).first()
    if not coin:
        return {
            "symbol": symbol.upper(),
            "status": "insufficient_data",
            "volatility": "Unknown",
            "volatility_score": 0.0,
            "observations": 0,
            "price_min": None,
            "price_max": None,
            "message": f"Coin {symbol.upper()} not found",
        }

    # Fetch all historical prices ordered by recorded_at ascending
    history = (
        db.query(PriceHistory.price)
        .filter(PriceHistory.cryptocurrency_id == coin.id)
        .order_by(asc(PriceHistory.recorded_at))
        .all()
    )

    prices = [h[0] for h in history if h[0] is not None and h[0] > 0]
    observations = len(prices)

    if observations < 2:
        return {
            "symbol": coin.symbol,
            "status": "insufficient_data",
            "volatility": "Low",
            "volatility_score": 0.0,
            "observations": observations,
            "price_min": prices[0] if prices else None,
            "price_max": prices[0] if prices else None,
            "message": "Insufficient historical observations (at least 2 observations required).",
        }

    # Compute percentage returns: (P_t - P_{t-1}) / P_{t-1} * 100
    returns = []
    for i in range(1, observations):
        prev = prices[i - 1]
        curr = prices[i]
        if prev > 0:
            ret = ((curr - prev) / prev) * 100.0
            returns.append(ret)

    if not returns:
        return {
            "symbol": coin.symbol,
            "status": "insufficient_data",
            "volatility": "Low",
            "volatility_score": 0.0,
            "observations": observations,
            "price_min": min(prices),
            "price_max": max(prices),
            "message": "Insufficient returns data.",
        }

    mean_return = sum(returns) / len(returns)
    variance = sum((r - mean_return) ** 2 for r in returns) / len(returns)
    std_dev = math.sqrt(variance)

    # Classification
    if std_dev < 1.5:
        classification = "Low"
    elif std_dev <= 4.0:
        classification = "Medium"
    else:
        classification = "High"

    return {
        "symbol": coin.symbol,
        "status": "success",
        "volatility": classification,
        "volatility_score": round(std_dev, 2),
        "observations": observations,
        "price_min": round(min(prices), 4),
        "price_max": round(max(prices), 4),
        "message": None,
    }
