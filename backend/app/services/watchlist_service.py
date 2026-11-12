"""
Personal Watchlist service.
Provides local watchlist storage and real-time market data enrichment.
"""
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.watchlist import Watchlist
from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.services.volatility_service import calculate_coin_volatility
from app.services.trend_service import calculate_coin_trend
from app.utils.logger import get_logger

logger = get_logger(__name__)


def get_watchlist(db: Session) -> List[Dict[str, Any]]:
    """Retrieve all coins on the user watchlist enriched with market data."""
    items = db.query(Watchlist).order_by(desc(Watchlist.created_at)).all()
    results = []

    for item in items:
        coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == item.symbol).first()
        if not coin:
            continue

        latest_ph = (
            db.query(PriceHistory)
            .filter(PriceHistory.cryptocurrency_id == coin.id)
            .order_by(desc(PriceHistory.recorded_at))
            .first()
        )

        vol = calculate_coin_volatility(db, item.symbol)
        trend = calculate_coin_trend(db, item.symbol)

        results.append({
            "id": item.id,
            "symbol": coin.symbol,
            "name": coin.name,
            "rank": coin.rank,
            "price": latest_ph.price if latest_ph else None,
            "change_24h": latest_ph.change_24h if latest_ph else None,
            "market_cap": latest_ph.market_cap if latest_ph else None,
            "trend": trend.get("trend", "Neutral"),
            "volatility": vol.get("volatility", "Low"),
            "created_at": item.created_at,
        })

    return results


def get_watchlist_symbols(db: Session) -> List[str]:
    """Get list of symbols in watchlist for quick lookup."""
    items = db.query(Watchlist.symbol).all()
    return [item[0] for item in items]


def add_to_watchlist(db: Session, symbol: str) -> Watchlist:
    """Add a coin symbol to the watchlist."""
    sym = symbol.strip().upper()
    existing = db.query(Watchlist).filter(Watchlist.symbol == sym).first()
    if existing:
        return existing

    item = Watchlist(symbol=sym, created_at=datetime.utcnow())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def remove_from_watchlist(db: Session, symbol: str) -> bool:
    """Remove a coin symbol from the watchlist."""
    sym = symbol.strip().upper()
    item = db.query(Watchlist).filter(Watchlist.symbol == sym).first()
    if not item:
        return False

    db.delete(item)
    db.commit()
    return True
