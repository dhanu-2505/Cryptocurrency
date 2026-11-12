"""
Market Intelligence & Comparison Router.
Provides Market Mood, Data Quality, and Multi-Coin Comparison endpoints.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.schemas.intelligence import MarketMoodOut, DataQualityOut, CompareResponse
from app.services.market_intelligence import calculate_market_mood
from app.services.data_quality_service import calculate_data_quality
from app.services.comparison_service import compare_coins
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["intelligence"])


@router.get("/intelligence/mood", response_model=MarketMoodOut)
def get_market_mood(db: Session = Depends(get_db)):
    """
    Get Market Mood Score (0-100) and classification (Bearish, Neutral, Bullish)
    calculated strictly from current database market metrics.
    """
    try:
        return calculate_market_mood(db)
    except Exception as e:
        logger.error(f"GET /api/intelligence/mood error: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate market mood")


@router.get("/intelligence/data-quality", response_model=DataQualityOut)
def get_data_quality(db: Session = Depends(get_db)):
    """
    Get Data Quality Score (0-100%) based on completeness, validity, and freshness.
    """
    try:
        return calculate_data_quality(db)
    except Exception as e:
        logger.error(f"GET /api/intelligence/data-quality error: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate data quality score")


@router.get("/compare", response_model=CompareResponse)
def compare_cryptos(
    symbols: str = Query("BTC,ETH", description="Comma-separated list of 2-4 coin symbols"),
    db: Session = Depends(get_db),
):
    """
    Compare 2-4 cryptocurrencies side-by-side on price, 24h change, market cap,
    volatility, trend, momentum, and historical performance.
    """
    try:
        symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
        if not symbol_list:
            symbol_list = ["BTC", "ETH"]
        return compare_coins(db, symbol_list)
    except Exception as e:
        logger.error(f"GET /api/compare error: {e}")
        raise HTTPException(status_code=500, detail="Failed to compare coins")
