"""
Portfolio Simulator service.
Tracks virtual portfolio holdings and calculates P&L from latest market prices.
Strictly virtual simulation — no real financial transactions.
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.portfolio_holding import PortfolioHolding
from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.schemas.portfolio import PortfolioHoldingCreate, PortfolioHoldingUpdate
from app.utils.logger import get_logger

logger = get_logger(__name__)


def create_holding(db: Session, holding_in: PortfolioHoldingCreate) -> PortfolioHolding:
    """Add a virtual coin holding."""
    symbol = holding_in.symbol.strip().upper()
    holding = PortfolioHolding(
        symbol=symbol,
        quantity=holding_in.quantity,
        purchase_price=holding_in.purchase_price,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


def update_holding(
    db: Session, holding_id: int, holding_in: PortfolioHoldingUpdate
) -> Optional[PortfolioHolding]:
    """Update quantity or buy price for a holding."""
    holding = db.query(PortfolioHolding).filter(PortfolioHolding.id == holding_id).first()
    if not holding:
        return None

    if holding_in.quantity is not None:
        holding.quantity = holding_in.quantity
    if holding_in.purchase_price is not None:
        holding.purchase_price = holding_in.purchase_price
    holding.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(holding)
    return holding


def delete_holding(db: Session, holding_id: int) -> bool:
    """Remove a portfolio holding."""
    holding = db.query(PortfolioHolding).filter(PortfolioHolding.id == holding_id).first()
    if not holding:
        return False
    db.delete(holding)
    db.commit()
    return True


def get_portfolio_summary(db: Session) -> Dict[str, Any]:
    """
    Calculate live valuation and P&L for all virtual holdings.
    Uses latest real market prices from database.
    """
    holdings_records = db.query(PortfolioHolding).order_by(desc(PortfolioHolding.created_at)).all()
    holdings_out = []

    total_current = 0.0
    total_invested = 0.0

    for h in holdings_records:
        coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == h.symbol).first()
        name = coin.name if coin else h.symbol

        latest_ph = None
        if coin:
            latest_ph = (
                db.query(PriceHistory)
                .filter(PriceHistory.cryptocurrency_id == coin.id)
                .order_by(desc(PriceHistory.recorded_at))
                .first()
            )

        current_price = latest_ph.price if latest_ph else 0.0
        change_24h = latest_ph.change_24h if latest_ph else 0.0
        buy_price = h.purchase_price if h.purchase_price is not None else current_price

        invested_val = h.quantity * buy_price
        current_val = h.quantity * current_price
        pl = current_val - invested_val
        pl_pct = ((pl / invested_val) * 100.0) if invested_val > 0 else 0.0

        total_current += current_val
        total_invested += invested_val

        holdings_out.append({
            "id": h.id,
            "symbol": h.symbol,
            "name": name,
            "quantity": h.quantity,
            "purchase_price": h.purchase_price,
            "current_price": round(current_price, 4),
            "current_value": round(current_val, 2),
            "invested_value": round(invested_val, 2),
            "profit_loss": round(pl, 2),
            "profit_loss_pct": round(pl_pct, 2),
            "change_24h": change_24h,
            "created_at": h.created_at,
            "updated_at": h.updated_at,
        })

    total_pl = total_current - total_invested
    total_pl_pct = ((total_pl / total_invested) * 100.0) if total_invested > 0 else 0.0

    best = None
    worst = None
    if holdings_out:
        sorted_holdings = sorted(holdings_out, key=lambda x: x["profit_loss_pct"], reverse=True)
        best = sorted_holdings[0]
        worst = sorted_holdings[-1]

    return {
        "total_current_value": round(total_current, 2),
        "total_invested_value": round(total_invested, 2),
        "total_profit_loss": round(total_pl, 2),
        "total_profit_loss_pct": round(total_pl_pct, 2),
        "best_performer": best,
        "worst_performer": worst,
        "holdings": holdings_out,
    }
