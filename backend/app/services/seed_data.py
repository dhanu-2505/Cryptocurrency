"""
Seed data module for initial demonstration and zero-state population.
Seeds top 10 coins with historical price points if the database is fresh.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.utils.logger import get_logger

logger = get_logger(__name__)

INITIAL_COINS = [
    {
        "rank": 1,
        "name": "Bitcoin",
        "symbol": "BTC",
        "slug": "bitcoin",
        "base_price": 68450.0,
        "change_24h": 2.85,
        "market_cap": 1348000000000.0,
        "history_drift": [-1.2, -0.5, 0.4, 1.1, 1.8, 2.85],
    },
    {
        "rank": 2,
        "name": "Ethereum",
        "symbol": "ETH",
        "slug": "ethereum",
        "base_price": 3560.20,
        "change_24h": 3.42,
        "market_cap": 428000000000.0,
        "history_drift": [-0.8, -0.2, 0.9, 1.6, 2.5, 3.42],
    },
    {
        "rank": 3,
        "name": "Tether USDt",
        "symbol": "USDT",
        "slug": "tether",
        "base_price": 1.0001,
        "change_24h": 0.02,
        "market_cap": 112000000000.0,
        "history_drift": [0.0, -0.01, 0.01, 0.0, 0.01, 0.02],
    },
    {
        "rank": 4,
        "name": "BNB",
        "symbol": "BNB",
        "slug": "bnb",
        "base_price": 595.30,
        "change_24h": -1.15,
        "market_cap": 91500000000.0,
        "history_drift": [1.2, 0.8, 0.1, -0.4, -0.8, -1.15],
    },
    {
        "rank": 5,
        "name": "Solana",
        "symbol": "SOL",
        "slug": "solana",
        "base_price": 172.45,
        "change_24h": 6.84,
        "market_cap": 79800000000.0,
        "history_drift": [-2.1, 0.3, 2.2, 3.8, 5.1, 6.84],
    },
    {
        "rank": 6,
        "name": "XRP",
        "symbol": "XRP",
        "slug": "xrp",
        "base_price": 0.528,
        "change_24h": 1.45,
        "market_cap": 29400000000.0,
        "history_drift": [-1.0, -0.6, 0.0, 0.5, 1.1, 1.45],
    },
    {
        "rank": 7,
        "name": "Dogecoin",
        "symbol": "DOGE",
        "slug": "dogecoin",
        "base_price": 0.1425,
        "change_24h": -2.35,
        "market_cap": 20700000000.0,
        "history_drift": [1.5, 0.9, -0.2, -1.1, -1.8, -2.35],
    },
    {
        "rank": 8,
        "name": "Toncoin",
        "symbol": "TON",
        "slug": "toncoin",
        "base_price": 6.78,
        "change_24h": 4.12,
        "market_cap": 17100000000.0,
        "history_drift": [-1.5, -0.8, 0.5, 1.8, 3.0, 4.12],
    },
    {
        "rank": 9,
        "name": "Cardano",
        "symbol": "ADA",
        "slug": "cardano",
        "base_price": 0.448,
        "change_24h": -0.85,
        "market_cap": 16000000000.0,
        "history_drift": [0.4, 0.2, -0.1, -0.3, -0.6, -0.85],
    },
    {
        "rank": 10,
        "name": "Avalanche",
        "symbol": "AVAX",
        "slug": "avalanche",
        "base_price": 32.15,
        "change_24h": 5.20,
        "market_cap": 12700000000.0,
        "history_drift": [-2.0, -0.7, 1.1, 2.6, 4.0, 5.20],
    },
]


def seed_initial_data_if_empty(db: Session) -> bool:
    """Seed initial data if no cryptocurrencies are stored."""
    existing_count = db.query(Cryptocurrency).count()
    if existing_count > 0:
        logger.info(f"Database already has {existing_count} cryptocurrencies. Skipping seed.")
        return False

    logger.info("Database is empty. Seeding initial top 10 cryptocurrencies and price history...")
    now = datetime.utcnow()

    for item in INITIAL_COINS:
        coin = Cryptocurrency(
            rank=item["rank"],
            name=item["name"],
            symbol=item["symbol"],
            slug=item["slug"],
            created_at=now - timedelta(days=2),
            updated_at=now,
        )
        db.add(coin)
        db.flush()

        base_p = item["base_price"]
        drifts = item["history_drift"]

        # Generate 6 historical points over the last 24 hours
        for i, drift_pct in enumerate(drifts):
            hours_ago = (len(drifts) - 1 - i) * 4
            record_time = now - timedelta(hours=hours_ago)
            price = round(base_p * (1.0 + (drift_pct / 100.0)), 6 if base_p < 1 else 2)

            history = PriceHistory(
                cryptocurrency_id=coin.id,
                price=price,
                change_24h=drift_pct,
                market_cap=item["market_cap"],
                recorded_at=record_time,
            )
            db.add(history)

    db.commit()
    logger.info("Initial data seeded successfully.")
    return True
