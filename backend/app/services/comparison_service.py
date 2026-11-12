"""
Coin Comparison service.
Aggregates multi-coin market metrics, volatility, trend, and time-series performance.
"""
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.services.volatility_service import calculate_coin_volatility
from app.services.trend_service import calculate_coin_trend
from app.services.drawdown_service import calculate_coin_drawdown
from app.utils.logger import get_logger

logger = get_logger(__name__)


def compare_coins(db: Session, symbols: List[str]) -> Dict[str, Any]:
    """
    Compare multiple coins (2-4) using real database records:
    - Latest price, 24h change, market cap
    - Volatility score and classification
    - Trend classification and momentum
    - Drawdown percentage
    - Aligned historical price series for multi-line comparison chart
    """
    # Clean up and deduplicate symbols, maximum 4
    clean_symbols = [s.strip().upper() for s in symbols if s.strip()][:4]
    if not clean_symbols:
        clean_symbols = ["BTC", "ETH"]

    coin_items = []
    symbol_history = {}

    for sym in clean_symbols:
        coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == sym).first()
        if not coin:
            continue

        latest_ph = (
            db.query(PriceHistory)
            .filter(PriceHistory.cryptocurrency_id == coin.id)
            .order_by(desc(PriceHistory.recorded_at))
            .first()
        )

        vol = calculate_coin_volatility(db, sym)
        trend = calculate_coin_trend(db, sym)
        dd = calculate_coin_drawdown(db, sym)

        coin_items.append({
            "id": coin.id,
            "name": coin.name,
            "symbol": coin.symbol,
            "rank": coin.rank,
            "price": latest_ph.price if latest_ph else None,
            "change_24h": latest_ph.change_24h if latest_ph else None,
            "market_cap": latest_ph.market_cap if latest_ph else None,
            "volatility": vol.get("volatility", "Unknown"),
            "volatility_score": vol.get("volatility_score", 0.0),
            "trend": trend.get("trend", "Neutral"),
            "momentum": trend.get("momentum", 0.0),
            "drawdown_pct": dd.get("drawdown_pct", 0.0),
        })

        # Fetch recent historical records (up to 30)
        ph_records = (
            db.query(PriceHistory)
            .filter(PriceHistory.cryptocurrency_id == coin.id)
            .order_by(asc(PriceHistory.recorded_at))
            .limit(30)
            .all()
        )
        symbol_history[sym] = [
            {"time": ph.recorded_at.isoformat(), "price": ph.price}
            for ph in ph_records
        ]

    # Align historical time series into chart points: [{ time, BTC: ..., ETH: ... }]
    # Collect all timestamps
    all_timestamps = set()
    for points in symbol_history.values():
        for pt in points:
            all_timestamps.add(pt["time"])

    sorted_timestamps = sorted(list(all_timestamps))
    price_trends = []
    for t in sorted_timestamps:
        row = {"time": t}
        for sym, points in symbol_history.items():
            # Find closest or matching point
            match = next((p for p in points if p["time"] == t), None)
            if match:
                row[sym] = match["price"]
        price_trends.append(row)

    return {
        "coins": coin_items,
        "price_trends": price_trends,
    }
