"""
Smart Price Alerts service.
Manages user alerts and evaluates them against latest market prices.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.models.price_alert import PriceAlert
from app.models.cryptocurrency import Cryptocurrency
from app.models.price_history import PriceHistory
from app.schemas.alert import AlertCreate, AlertUpdate
from app.utils.logger import get_logger

logger = get_logger(__name__)


def create_alert(db: Session, alert_in: AlertCreate) -> PriceAlert:
    """Create a new price alert."""
    symbol = alert_in.symbol.upper()
    alert = PriceAlert(
        symbol=symbol,
        condition_type=alert_in.condition_type,
        target_value=alert_in.target_value,
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    # Evaluate immediately upon creation
    evaluate_single_alert(db, alert)
    return alert


def get_alerts(db: Session) -> List[Dict[str, Any]]:
    """Get all alerts enriched with current market prices."""
    alerts = db.query(PriceAlert).order_by(desc(PriceAlert.created_at)).all()
    results = []

    for alert in alerts:
        # Get latest price for coin
        coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == alert.symbol).first()
        latest_price = None
        latest_change = None
        if coin:
            latest_ph = (
                db.query(PriceHistory)
                .filter(PriceHistory.cryptocurrency_id == coin.id)
                .order_by(desc(PriceHistory.recorded_at))
                .first()
            )
            if latest_ph:
                latest_price = latest_ph.price
                latest_change = latest_ph.change_24h

        results.append({
            "id": alert.id,
            "symbol": alert.symbol,
            "condition_type": alert.condition_type,
            "target_value": alert.target_value,
            "is_active": alert.is_active,
            "triggered_at": alert.triggered_at,
            "created_at": alert.created_at,
            "current_price": latest_price,
            "current_change_24h": latest_change,
        })

    return results


def update_alert(db: Session, alert_id: int, alert_in: AlertUpdate) -> Optional[PriceAlert]:
    """Update alert parameters."""
    alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id).first()
    if not alert:
        return None

    if alert_in.condition_type is not None:
        alert.condition_type = alert_in.condition_type
    if alert_in.target_value is not None:
        alert.target_value = alert_in.target_value
    if alert_in.is_active is not None:
        alert.is_active = alert_in.is_active
        if alert.is_active:
            # Re-activating clears old triggered status
            alert.triggered_at = None

    db.commit()
    db.refresh(alert)
    return alert


def delete_alert(db: Session, alert_id: int) -> bool:
    """Delete an alert by ID."""
    alert = db.query(PriceAlert).filter(PriceAlert.id == alert_id).first()
    if not alert:
        return False
    db.delete(alert)
    db.commit()
    return True


def evaluate_single_alert(db: Session, alert: PriceAlert) -> bool:
    """Evaluate one alert against current data. Returns True if triggered."""
    if not alert.is_active:
        return False

    coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == alert.symbol).first()
    if not coin:
        return False

    latest_ph = (
        db.query(PriceHistory)
        .filter(PriceHistory.cryptocurrency_id == coin.id)
        .order_by(desc(PriceHistory.recorded_at))
        .first()
    )
    if not latest_ph:
        return False

    current_price = latest_ph.price
    current_change = latest_ph.change_24h or 0.0

    triggered = False
    if alert.condition_type == "price_above" and current_price >= alert.target_value:
        triggered = True
    elif alert.condition_type == "price_below" and current_price <= alert.target_value:
        triggered = True
    elif alert.condition_type == "change_above" and current_change >= alert.target_value:
        triggered = True
    elif alert.condition_type == "change_below" and current_change <= alert.target_value:
        triggered = True

    if triggered:
        # Don't re-trigger continuously within 1 hour if already triggered
        if not alert.triggered_at or (datetime.utcnow() - alert.triggered_at) > timedelta(hours=1):
            alert.triggered_at = datetime.utcnow()
            db.commit()
            logger.info(f"PriceAlert triggered: {alert.symbol} {alert.condition_type} {alert.target_value}")
            return True

    return False


def evaluate_all_alerts(db: Session) -> int:
    """Evaluate all active alerts against latest market prices. Returns count of triggered alerts."""
    active_alerts = db.query(PriceAlert).filter(PriceAlert.is_active == True).all()  # noqa: E712
    triggered_count = 0
    for alert in active_alerts:
        if evaluate_single_alert(db, alert):
            triggered_count += 1
    return triggered_count


def get_recent_triggered_alerts(db: Session, limit: int = 5) -> List[Dict[str, Any]]:
    """Get recently triggered alerts for Dashboard display."""
    alerts = (
        db.query(PriceAlert)
        .filter(PriceAlert.triggered_at.isnot(None))
        .order_by(desc(PriceAlert.triggered_at))
        .limit(limit)
        .all()
    )

    results = []
    for a in alerts:
        coin = db.query(Cryptocurrency).filter(Cryptocurrency.symbol == a.symbol).first()
        latest_price = None
        if coin:
            ph = (
                db.query(PriceHistory.price)
                .filter(PriceHistory.cryptocurrency_id == coin.id)
                .order_by(desc(PriceHistory.recorded_at))
                .first()
            )
            if ph:
                latest_price = ph[0]

        results.append({
            "id": a.id,
            "symbol": a.symbol,
            "condition_type": a.condition_type,
            "target_value": a.target_value,
            "triggered_at": a.triggered_at,
            "current_price": latest_price,
        })
    return results
