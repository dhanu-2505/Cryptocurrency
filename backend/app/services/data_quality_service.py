"""
Data Quality Score service.
Evaluates data completeness, schema validity, and freshness from real scrape results.
"""
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.models.scrape_log import ScrapeLog
from app.utils.logger import get_logger

logger = get_logger(__name__)


def calculate_data_quality(db: Session) -> Dict[str, Any]:
    """
    Calculate Data Quality score (0-100%):
    - Expected coins scraped: up to 10 coins (30 points)
    - Valid prices: non-null, > 0 (25 points)
    - Valid market caps: non-null, > 0 (20 points)
    - Valid 24h change: non-null (15 points)
    - Freshness & scrape status: last scrape success & within recent time (10 points)
    """
    coins = db.query(Cryptocurrency).all()
    expected_coins = 10
    coins_collected = len(coins)

    valid_prices = 0
    valid_market_caps = 0
    valid_changes = 0

    latest_recorded_at = None

    for coin in coins:
        latest_ph = (
            db.query(PriceHistory)
            .filter(PriceHistory.cryptocurrency_id == coin.id)
            .order_by(desc(PriceHistory.recorded_at))
            .first()
        )
        if latest_ph:
            if latest_ph.price is not None and latest_ph.price > 0:
                valid_prices += 1
            if latest_ph.market_cap is not None and latest_ph.market_cap > 0:
                valid_market_caps += 1
            if latest_ph.change_24h is not None:
                valid_changes += 1

            if not latest_recorded_at or latest_ph.recorded_at > latest_recorded_at:
                latest_recorded_at = latest_ph.recorded_at

    # Fetch last scrape log
    last_log = db.query(ScrapeLog).order_by(desc(ScrapeLog.started_at)).first()
    last_scrape_status = last_log.status if last_log else "unknown"

    now = datetime.utcnow()
    freshness_minutes = 0.0
    if latest_recorded_at:
        freshness_minutes = max(0.0, (now - latest_recorded_at).total_seconds() / 60.0)

    # Score components:
    # 1. Coin coverage (30 pts)
    coin_ratio = min(1.0, coins_collected / expected_coins) if expected_coins > 0 else 0
    coin_pts = coin_ratio * 30.0

    # 2. Price validity (25 pts)
    price_ratio = (valid_prices / coins_collected) if coins_collected > 0 else 0
    price_pts = price_ratio * 25.0

    # 3. Market cap validity (20 pts)
    mcap_ratio = (valid_market_caps / coins_collected) if coins_collected > 0 else 0
    mcap_pts = mcap_ratio * 20.0

    # 4. Change 24h validity (15 pts)
    change_ratio = (valid_changes / coins_collected) if coins_collected > 0 else 0
    change_pts = change_ratio * 15.0

    # 5. Scrape status & Freshness (10 pts)
    status_pts = 5.0 if last_scrape_status == "success" else 0.0
    freshness_pts = 5.0 if freshness_minutes < 60 else (2.5 if freshness_minutes < 180 else 1.0)

    total_score = int(round(coin_pts + price_pts + mcap_pts + change_pts + status_pts + freshness_pts))
    total_score = max(0, min(100, total_score))

    return {
        "score": total_score,
        "coins_collected": coins_collected,
        "expected_coins": expected_coins,
        "valid_prices": valid_prices,
        "valid_market_caps": valid_market_caps,
        "valid_changes": valid_changes,
        "last_scrape_status": last_scrape_status,
        "freshness_minutes": round(freshness_minutes, 1),
        "calculated_at": now,
    }
