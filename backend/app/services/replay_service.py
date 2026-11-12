"""
Market Replay service.
Provides historical snapshots along the timeline of recorded prices.
Never fabricates historical records.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc, func

from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.utils.logger import get_logger

logger = get_logger(__name__)


def get_replay_timestamps(db: Session) -> Dict[str, Any]:
    """
    Get distinct scrape timestamps recorded in price_history.
    Clusters records within 60 seconds into a single timestamp snapshot.
    """
    records = (
        db.query(PriceHistory.recorded_at)
        .order_by(asc(PriceHistory.recorded_at))
        .all()
    )

    if not records:
        return {
            "timestamps": [],
            "count": 0,
            "status": "insufficient_data",
            "message": "Market replay requires additional historical observations.",
        }

    clustered = []
    for r in records:
        dt = r[0]
        if not dt:
            continue
        if not clustered or (dt - clustered[-1]).total_seconds() > 30:
            clustered.append(dt)

    return {
        "timestamps": [dt.isoformat() for dt in clustered],
        "count": len(clustered),
        "status": "success" if len(clustered) >= 2 else "insufficient_data",
        "message": None if len(clustered) >= 2 else "Market replay requires additional historical observations.",
    }


def get_replay_snapshot(db: Session, target_iso: Optional[str] = None) -> Dict[str, Any]:
    """
    Retrieve market snapshot closest to the requested timestamp.
    """
    if target_iso:
        try:
            target_dt = datetime.fromisoformat(target_iso)
        except Exception:
            target_dt = datetime.utcnow()
    else:
        # Default to earliest or latest
        first_rec = db.query(PriceHistory.recorded_at).order_by(asc(PriceHistory.recorded_at)).first()
        target_dt = first_rec[0] if first_rec else datetime.utcnow()

    # Find records within a window around target_dt (e.g. within 10 minutes)
    # or find for each coin the record with MIN(ABS(recorded_at - target_dt))
    coins = db.query(Cryptocurrency).order_by(Cryptocurrency.rank).all()
    coin_snapshots = []
    btc_price = None
    eth_price = None
    sol_price = None

    positive_count = 0
    negative_count = 0
    changes = []

    for coin in coins:
        # Find record for this coin closest to target_dt
        history_before = (
            db.query(PriceHistory)
            .filter(PriceHistory.cryptocurrency_id == coin.id)
            .filter(PriceHistory.recorded_at <= target_dt + timedelta(minutes=5))
            .order_by(desc(PriceHistory.recorded_at))
            .first()
        )
        if not history_before:
            # Fallback to closest after
            history_before = (
                db.query(PriceHistory)
                .filter(PriceHistory.cryptocurrency_id == coin.id)
                .order_by(asc(PriceHistory.recorded_at))
                .first()
            )

        if history_before:
            p = history_before.price
            c24 = history_before.change_24h
            mcap = history_before.market_cap

            if coin.symbol == "BTC":
                btc_price = p
            elif coin.symbol == "ETH":
                eth_price = p
            elif coin.symbol == "SOL":
                sol_price = p

            if c24 is not None:
                changes.append(c24)
                if c24 > 0:
                    positive_count += 1
                elif c24 < 0:
                    negative_count += 1

            coin_snapshots.append({
                "id": coin.id,
                "name": coin.name,
                "symbol": coin.symbol,
                "rank": coin.rank,
                "price": p,
                "change_24h": c24,
                "market_cap": mcap,
                "recorded_at": history_before.recorded_at.isoformat(),
            })

    # Find top gainer and top loser in this snapshot
    coins_with_change = [c for c in coin_snapshots if c["change_24h"] is not None]
    top_gainer = max(coins_with_change, key=lambda x: x["change_24h"]) if coins_with_change else None
    top_loser = min(coins_with_change, key=lambda x: x["change_24h"]) if coins_with_change else None

    # Calculate mood score for this snapshot
    total_valid = len(changes)
    if total_valid > 0:
        pos_ratio = (positive_count / total_valid) * 100.0
        avg_chg = sum(changes) / total_valid
        avg_chg_score = max(0.0, min(100.0, 50.0 + (avg_chg * 5.0)))
        mood_score = int(round((0.5 * pos_ratio) + (0.5 * avg_chg_score)))
        if mood_score <= 30:
            mood_label = "Bearish"
        elif mood_score <= 60:
            mood_label = "Neutral"
        else:
            mood_label = "Bullish"
    else:
        mood_score = 50
        mood_label = "Neutral"

    return {
        "timestamp": target_dt.isoformat(),
        "coins": coin_snapshots,
        "btc_price": btc_price,
        "eth_price": eth_price,
        "sol_price": sol_price,
        "top_gainer": top_gainer,
        "top_loser": top_loser,
        "market_mood": {
            "score": mood_score,
            "label": mood_label,
            "positive_coins": positive_count,
            "negative_coins": negative_count,
        },
    }
