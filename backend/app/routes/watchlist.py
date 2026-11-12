"""
Personal Watchlist Router.
Endpoints for adding, viewing, and removing user favorite cryptocurrencies.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.schemas.watchlist import WatchlistItemOut
from app.services import watchlist_service
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("", response_model=List[WatchlistItemOut])
def get_user_watchlist(db: Session = Depends(get_db)):
    """Retrieve all watched coins enriched with live market data."""
    try:
        return watchlist_service.get_watchlist(db)
    except Exception as e:
        logger.error(f"GET /api/watchlist error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch watchlist")


@router.get("/symbols", response_model=List[str])
def get_watchlist_symbols_endpoint(db: Session = Depends(get_db)):
    """Get list of symbols in watchlist for UI star status badges."""
    try:
        return watchlist_service.get_watchlist_symbols(db)
    except Exception as e:
        logger.error(f"GET /api/watchlist/symbols error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch watchlist symbols")


@router.post("/{symbol}", response_model=Dict[str, Any])
def add_coin_to_watchlist(symbol: str, db: Session = Depends(get_db)):
    """Add a cryptocurrency to the watchlist."""
    try:
        item = watchlist_service.add_to_watchlist(db, symbol.upper())
        return {
            "success": True,
            "message": f"{item.symbol} added to watchlist",
            "symbol": item.symbol,
        }
    except Exception as e:
        logger.error(f"POST /api/watchlist/{symbol} error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add to watchlist")


@router.delete("/{symbol}", response_model=Dict[str, Any])
def remove_coin_from_watchlist(symbol: str, db: Session = Depends(get_db)):
    """Remove a cryptocurrency from the watchlist."""
    try:
        success = watchlist_service.remove_from_watchlist(db, symbol.upper())
        if not success:
            raise HTTPException(status_code=404, detail=f"{symbol.upper()} not in watchlist")
        return {
            "success": True,
            "message": f"{symbol.upper()} removed from watchlist",
            "symbol": symbol.upper(),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"DELETE /api/watchlist/{symbol} error: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove from watchlist")
