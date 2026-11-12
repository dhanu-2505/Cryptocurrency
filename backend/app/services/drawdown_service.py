"""
Drawdown Detector service.
Calculates rolling high and drawdown percentage from actual historical records.
"""
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.utils.logger import get_logger

logger = get_logger(__name__)


def calculate_coin_drawdown(db: Session, symbol: str) -> Dict[str, Any]:
    """
    Calculate drawdown percentage from recent historical prices:
    Formula: drawdown = ((current_price - reference_high) / reference_high) * 100
    Classification:
      0% to -5%: Low
      -5% to -15%: Moderate
      Below -15%: High
    """
    coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == symbol.upper()).first()
    if not coin:
        return {
            "symbol": symbol.upper(),
            "current_price": 0.0,
            "reference_high": 0.0,
            "drawdown_pct": 0.0,
            "classification": "Low",
            "historical_records": 0,
        }

    history = (
        db.query(PriceHistory.price)
        .filter(PriceHistory.cryptocurrency_id == coin.id)
        .order_by(desc(PriceHistory.recorded_at))
        .all()
    )

    prices = [h[0] for h in history if h[0] is not None and h[0] > 0]
    if not prices:
        return {
            "symbol": coin.symbol,
            "current_price": 0.0,
            "reference_high": 0.0,
            "drawdown_pct": 0.0,
            "classification": "Low",
            "historical_records": 0,
        }

    current_price = prices[0]
    reference_high = max(prices)

    if reference_high <= 0:
        drawdown_pct = 0.0
    else:
        drawdown_pct = ((current_price - reference_high) / reference_high) * 100.0

    # Classification:
    # 0 to -5%: Low
    # -5% to -15%: Moderate
    # Below -15%: High
    if drawdown_pct >= -5.0:
        classification = "Low"
    elif drawdown_pct >= -15.0:
        classification = "Moderate"
    else:
        classification = "High"

    return {
        "symbol": coin.symbol,
        "current_price": round(current_price, 4),
        "reference_high": round(reference_high, 4),
        "drawdown_pct": round(drawdown_pct, 2),
        "classification": classification,
        "historical_records": len(prices),
    }
