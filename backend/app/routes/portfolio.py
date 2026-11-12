"""
Portfolio Simulator Router.
Endpoints for simulating virtual cryptocurrency holdings and live P&L.
Strictly virtual simulation — no real financial trades.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.schemas.portfolio import (
    PortfolioHoldingCreate,
    PortfolioHoldingUpdate,
    PortfolioSummaryOut,
)
from app.services import portfolio_service
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("", response_model=PortfolioSummaryOut)
def get_portfolio(db: Session = Depends(get_db)):
    """Get portfolio summary including total value, P&L, and all holdings."""
    try:
        return portfolio_service.get_portfolio_summary(db)
    except Exception as e:
        logger.error(f"GET /api/portfolio error: {e}")
        raise HTTPException(status_code=500, detail="Failed to calculate portfolio summary")


@router.post("", response_model=Dict[str, Any])
def add_holding(holding_in: PortfolioHoldingCreate, db: Session = Depends(get_db)):
    """Add a virtual cryptocurrency holding."""
    try:
        holding = portfolio_service.create_holding(db, holding_in)
        return {
            "success": True,
            "message": f"Added {holding.quantity} {holding.symbol} to portfolio",
            "holding_id": holding.id,
        }
    except Exception as e:
        logger.error(f"POST /api/portfolio error: {e}")
        raise HTTPException(status_code=500, detail="Failed to add portfolio holding")


@router.put("/{holding_id}", response_model=Dict[str, Any])
def update_holding(
    holding_id: int, holding_in: PortfolioHoldingUpdate, db: Session = Depends(get_db)
):
    """Update quantity or purchase price of a portfolio holding."""
    holding = portfolio_service.update_holding(db, holding_id, holding_in)
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    return {
        "success": True,
        "message": f"Updated holding {holding_id}",
        "holding_id": holding.id,
    }


@router.delete("/{holding_id}", response_model=Dict[str, Any])
def remove_holding(holding_id: int, db: Session = Depends(get_db)):
    """Delete a portfolio holding."""
    success = portfolio_service.delete_holding(db, holding_id)
    if not success:
        raise HTTPException(status_code=404, detail="Holding not found")
    return {"success": True, "message": f"Holding {holding_id} deleted"}
