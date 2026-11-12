"""
Coin service: database operations for cryptocurrencies and price history.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any

from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.utils.logger import get_logger

logger = get_logger(__name__)


def upsert_coin(db: Session, coin_data: Dict[str, Any]) -> Cryptocurrency:
    """
    Insert a new cryptocurrency record or update an existing one (by symbol).
    Returns the Cryptocurrency ORM object.
    """
    symbol = coin_data["symbol"].upper()
    coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == symbol).first()

    if coin:
        # Update existing record
        coin.rank = coin_data.get("rank", coin.rank)
        coin.name = coin_data.get("name", coin.name)
        coin.slug = coin_data.get("slug", coin.slug)
        coin.updated_at = datetime.utcnow()
        logger.debug(f"Updated coin: {symbol}")
    else:
        # Create new record
        coin = Cryptocurrency(
            rank=coin_data.get("rank", 0),
            name=coin_data["name"],
            symbol=symbol,
            slug=coin_data.get("slug", symbol.lower()),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(coin)
        logger.info(f"Created new coin: {symbol}")

    db.flush()  # get the ID without committing
    return coin


def save_price_history(db: Session, coin: Cryptocurrency, coin_data: Dict[str, Any]) -> PriceHistory:
    """
    Append a new price history record for the given coin.
    Always creates a new record (never overwrites).
    """
    recorded_at = datetime.utcnow()
    if coin_data.get("recorded_at"):
        try:
            recorded_at = datetime.fromisoformat(str(coin_data["recorded_at"]))
        except (ValueError, TypeError):
            pass

    history = PriceHistory(
        cryptocurrency_id=coin.id,
        price=coin_data.get("price") or 0.0,
        change_24h=coin_data.get("change_24h"),
        market_cap=coin_data.get("market_cap"),
        recorded_at=recorded_at,
    )
    db.add(history)
    return history


def save_scraped_data(db: Session, coins_data: List[Dict[str, Any]]) -> List[Cryptocurrency]:
    """
    Persist a full batch of scraped coins to the database.
    Upserts cryptocurrency records and appends price history.
    Returns list of saved Cryptocurrency objects.
    """
    saved_coins = []

    for coin_data in coins_data:
        try:
            coin = upsert_coin(db, coin_data)
            save_price_history(db, coin, coin_data)
            saved_coins.append(coin)
        except Exception as e:
            logger.error(f"Error saving coin {coin_data.get('symbol')}: {e}")
            db.rollback()
            continue

    try:
        db.commit()
        logger.info(f"Committed {len(saved_coins)} coins to database")
    except Exception as e:
        logger.error(f"Commit failed: {e}")
        db.rollback()
        raise

    # Refresh objects to load relationships
    for coin in saved_coins:
        db.refresh(coin)

    return saved_coins


def get_all_coins_with_latest_price(db: Session) -> List[Dict]:
    """
    Fetch all coins with their most recent price data.
    Returns a list of enriched dicts.
    """
    coins = db.query(Cryptocurrency).order_by(Cryptocurrency.rank).all()
    result = []

    for coin in coins:
        latest = (
            db.query(PriceHistory)
            .filter(PriceHistory.cryptocurrency_id == coin.id)
            .order_by(desc(PriceHistory.recorded_at))
            .first()
        )
        entry = {
            "id": coin.id,
            "rank": coin.rank,
            "name": coin.name,
            "symbol": coin.symbol,
            "slug": coin.slug,
            "created_at": coin.created_at,
            "updated_at": coin.updated_at,
            "price": latest.price if latest else None,
            "change_24h": latest.change_24h if latest else None,
            "market_cap": latest.market_cap if latest else None,
            "recorded_at": latest.recorded_at if latest else None,
        }
        result.append(entry)

    return result


def get_top10_coins(db: Session) -> List[Dict]:
    """Return the top 10 coins by rank with latest prices."""
    all_coins = get_all_coins_with_latest_price(db)
    return sorted(all_coins, key=lambda c: c["rank"])[:10]


def get_coin_by_symbol(db: Session, symbol: str) -> Optional[Dict]:
    """Get a single coin with its latest price by symbol."""
    coin = (
        db.query(Cryptocurrency)
        .filter(Cryptocurrency.symbol == symbol.upper())
        .first()
    )
    if not coin:
        return None

    latest = (
        db.query(PriceHistory)
        .filter(PriceHistory.cryptocurrency_id == coin.id)
        .order_by(desc(PriceHistory.recorded_at))
        .first()
    )

    return {
        "id": coin.id,
        "rank": coin.rank,
        "name": coin.name,
        "symbol": coin.symbol,
        "slug": coin.slug,
        "created_at": coin.created_at,
        "updated_at": coin.updated_at,
        "price": latest.price if latest else None,
        "change_24h": latest.change_24h if latest else None,
        "market_cap": latest.market_cap if latest else None,
        "recorded_at": latest.recorded_at if latest else None,
    }


def get_coin_history(
    db: Session, symbol: str, skip: int = 0, limit: int = 100
) -> List[PriceHistory]:
    """Get paginated price history for a coin."""
    coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == symbol.upper()).first()
    if not coin:
        return []

    return (
        db.query(PriceHistory)
        .filter(PriceHistory.cryptocurrency_id == coin.id)
        .order_by(desc(PriceHistory.recorded_at))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_all_history(
    db: Session,
    coin_symbol: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
) -> List[Dict]:
    """
    Get all historical records, optionally filtered by coin symbol.
    Returns enriched dicts with coin metadata.
    """
    query = (
        db.query(PriceHistory, Cryptocurrency)
        .join(Cryptocurrency, PriceHistory.cryptocurrency_id == Cryptocurrency.id)
        .order_by(desc(PriceHistory.recorded_at))
    )

    if coin_symbol:
        query = query.filter(Cryptocurrency.symbol == coin_symbol.upper())

    records = query.offset(skip).limit(limit).all()

    return [
        {
            "id": ph.id,
            "cryptocurrency_id": ph.cryptocurrency_id,
            "rank": crypto.rank,
            "name": crypto.name,
            "symbol": crypto.symbol,
            "price": ph.price,
            "change_24h": ph.change_24h,
            "market_cap": ph.market_cap,
            "recorded_at": ph.recorded_at,
        }
        for ph, crypto in records
    ]


def get_stats(db: Session) -> Dict[str, Any]:
    """Compute market summary statistics."""
    coins = get_all_coins_with_latest_price(db)
    total_records = db.query(func.count(PriceHistory.id)).scalar() or 0

    if not coins:
        return {
            "total_coins": 0,
            "total_records": total_records,
            "top_gainer": None,
            "top_loser": None,
            "total_market_cap": None,
            "average_price": None,
            "last_updated": None,
        }

    coins_with_change = [c for c in coins if c["change_24h"] is not None]
    coins_with_price = [c for c in coins if c["price"] is not None]
    coins_with_mcap = [c for c in coins if c["market_cap"] is not None]

    top_gainer = (
        max(coins_with_change, key=lambda c: c["change_24h"])
        if coins_with_change
        else None
    )
    top_loser = (
        min(coins_with_change, key=lambda c: c["change_24h"])
        if coins_with_change
        else None
    )
    total_market_cap = (
        sum(c["market_cap"] for c in coins_with_mcap) if coins_with_mcap else None
    )
    average_price = (
        sum(c["price"] for c in coins_with_price) / len(coins_with_price)
        if coins_with_price
        else None
    )
    timestamps = [c["recorded_at"] for c in coins if c["recorded_at"]]
    last_updated = max(timestamps) if timestamps else None

    return {
        "total_coins": len(coins),
        "total_records": total_records,
        "top_gainer": top_gainer,
        "top_loser": top_loser,
        "total_market_cap": total_market_cap,
        "average_price": average_price,
        "last_updated": last_updated,
    }
