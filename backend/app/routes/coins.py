from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.services import coin_service
from app.schemas.coin import CoinOut, PriceHistoryOut, StatsOut
from app.schemas.intelligence import VolatilityOut, TrendOut, DrawdownOut
from app.services.volatility_service import calculate_coin_volatility
from app.services.trend_service import calculate_coin_trend
from app.services.drawdown_service import calculate_coin_drawdown
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["coins"])


@router.get("/coins", response_model=List[CoinOut])
def get_all_coins(db: Session = Depends(get_db)):
    """Get all tracked cryptocurrencies with their latest prices."""
    try:
        return coin_service.get_all_coins_with_latest_price(db)
    except Exception as e:
        logger.error(f"GET /api/coins error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve coins")


@router.get("/coins/top10", response_model=List[CoinOut])
def get_top10(db: Session = Depends(get_db)):
    """Get top 10 cryptocurrencies by rank."""
    try:
        return coin_service.get_top10_coins(db)
    except Exception as e:
        logger.error(f"GET /api/coins/top10 error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve top 10 coins")


@router.get("/coins/{symbol}", response_model=CoinOut)
def get_coin(symbol: str, db: Session = Depends(get_db)):
    """Get details for a specific coin by symbol."""
    coin = coin_service.get_coin_by_symbol(db, symbol.upper())
    if not coin:
        raise HTTPException(status_code=404, detail=f"Coin '{symbol.upper()}' not found")
    return coin


@router.get("/coins/{symbol}/volatility", response_model=VolatilityOut)
def get_coin_volatility_endpoint(symbol: str, db: Session = Depends(get_db)):
    """Get statistical volatility analysis for a specific coin."""
    return calculate_coin_volatility(db, symbol.upper())


@router.get("/coins/{symbol}/trend", response_model=TrendOut)
def get_coin_trend_endpoint(symbol: str, db: Session = Depends(get_db)):
    """Get statistical trend and momentum indicator for a specific coin."""
    return calculate_coin_trend(db, symbol.upper())


@router.get("/coins/{symbol}/drawdown", response_model=DrawdownOut)
def get_coin_drawdown_endpoint(symbol: str, db: Session = Depends(get_db)):
    """Get drawdown from rolling high for a specific coin."""
    return calculate_coin_drawdown(db, symbol.upper())


@router.get("/coins/{symbol}/history", response_model=List[PriceHistoryOut])
def get_coin_history(
    symbol: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Get paginated price history for a specific coin."""
    history = coin_service.get_coin_history(db, symbol.upper(), skip=skip, limit=limit)
    return history


@router.get("/stats", response_model=StatsOut)
def get_stats(db: Session = Depends(get_db)):
    """Get market summary statistics."""
    try:
        return coin_service.get_stats(db)
    except Exception as e:
        logger.error(f"GET /api/stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to compute stats")


@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "CryptoTrack API"}
