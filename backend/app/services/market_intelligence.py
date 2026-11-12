"""
Market Mood Score service.
Calculates statistical market sentiment from actual database market data.
No external AI APIs, no fake predictions.
"""
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.services.coin_service import get_top10_coins
from app.utils.logger import get_logger

logger = get_logger(__name__)


def calculate_market_mood(db: Session) -> Dict[str, Any]:
    """
    Calculate Market Mood Score (0-100) based strictly on stored market data:
    1. Percentage of tracked coins with positive 24h change (40% weight)
    2. Average 24h percentage change (scaled -10% to +10% -> 0-100, 30% weight)
    3. Market-cap-weighted 24h change (30% weight)
    
    Classification:
      0-30: Bearish
      31-60: Neutral
      61-100: Bullish
    """
    coins = get_top10_coins(db)
    now = datetime.utcnow()

    if not coins:
        return {
            "score": 50,
            "label": "Neutral",
            "positive_coins": 0,
            "negative_coins": 0,
            "average_change_24h": 0.0,
            "market_cap_change_weighted": 0.0,
            "calculated_at": now,
        }

    positive_coins = 0
    negative_coins = 0
    changes = []
    total_mcap = 0.0
    weighted_change_sum = 0.0

    for c in coins:
        change = c.get("change_24h")
        mcap = c.get("market_cap") or 0.0

        if change is not None:
            changes.append(change)
            if change > 0:
                positive_coins += 1
            elif change < 0:
                negative_coins += 1

            if mcap > 0:
                total_mcap += mcap
                weighted_change_sum += change * mcap

    total_coins = len(changes) if changes else len(coins)
    if total_coins == 0:
        return {
            "score": 50,
            "label": "Neutral",
            "positive_coins": 0,
            "negative_coins": 0,
            "average_change_24h": 0.0,
            "market_cap_change_weighted": 0.0,
            "calculated_at": now,
        }

    # Factor 1: Ratio of positive coins (0 to 100)
    pos_ratio_score = (positive_coins / total_coins) * 100.0

    # Factor 2: Average 24h change scaled to 0-100 (where -10% is 0, 0% is 50, +10% is 100)
    avg_change = sum(changes) / len(changes) if changes else 0.0
    avg_change_score = max(0.0, min(100.0, 50.0 + (avg_change * 5.0)))

    # Factor 3: Market cap weighted change scaled to 0-100
    weighted_change = (weighted_change_sum / total_mcap) if total_mcap > 0 else avg_change
    weighted_change_score = max(0.0, min(100.0, 50.0 + (weighted_change * 5.0)))

    # Weighted aggregate score: 40% positive ratio, 30% avg change, 30% mcap weighted change
    raw_score = (0.40 * pos_ratio_score) + (0.30 * avg_change_score) + (0.30 * weighted_change_score)
    score = int(round(max(0, min(100, raw_score))))

    # Classification:
    # 0-30: Bearish
    # 31-60: Neutral
    # 61-100: Bullish
    if score <= 30:
        label = "Bearish"
    elif score <= 60:
        label = "Neutral"
    else:
        label = "Bullish"

    return {
        "score": score,
        "label": label,
        "positive_coins": positive_coins,
        "negative_coins": negative_coins,
        "average_change_24h": round(avg_change, 2),
        "market_cap_change_weighted": round(weighted_change, 2),
        "calculated_at": now,
    }
