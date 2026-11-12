"""
Smart Price Alerts Router.
Provides CRUD and status endpoints for user price and percentage alerts.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.schemas.alert import AlertCreate, AlertUpdate, AlertOut
from app.services import alert_service
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    """List all user price alerts enriched with current market prices."""
    try:
        return alert_service.get_alerts(db)
    except Exception as e:
        logger.error(f"GET /api/alerts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve alerts")


@router.post("", response_model=Dict[str, Any])
def create_new_alert(alert_in: AlertCreate, db: Session = Depends(get_db)):
    """Create a new smart price or change alert."""
    try:
        alert = alert_service.create_alert(db, alert_in)
        return {
            "success": True,
            "message": f"Alert created for {alert.symbol}",
            "alert_id": alert.id,
        }
    except Exception as e:
        logger.error(f"POST /api/alerts error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create alert")


@router.put("/{alert_id}", response_model=Dict[str, Any])
def update_existing_alert(alert_id: int, alert_in: AlertUpdate, db: Session = Depends(get_db)):
    """Update condition type, target value, or active status."""
    alert = alert_service.update_alert(db, alert_id, alert_in)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {
        "success": True,
        "message": f"Alert {alert_id} updated successfully",
        "alert_id": alert.id,
        "is_active": alert.is_active,
    }


@router.delete("/{alert_id}", response_model=Dict[str, Any])
def remove_alert(alert_id: int, db: Session = Depends(get_db)):
    """Delete a price alert."""
    success = alert_service.delete_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"success": True, "message": f"Alert {alert_id} deleted"}


@router.get("/recent-triggered", response_model=List[Dict[str, Any]])
def get_recent_triggered(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    """Get recently triggered alerts for Dashboard widget."""
    try:
        return alert_service.get_recent_triggered_alerts(db, limit=limit)
    except Exception as e:
        logger.error(f"GET /api/alerts/recent-triggered error: {e}")
        raise HTTPException(status_code=500, detail="Failed to get triggered alerts")
