"""
System & Scraper Health Router.
Provides scraper operational metrics, run logs, duration history, and error tracking.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database import get_db
from app.services.system_health_service import get_system_health
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/system", tags=["system"])


@router.get("/health", response_model=Dict[str, Any])
def get_health(run_limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    """Retrieve detailed scraper health, telemetry, and execution history."""
    try:
        return get_system_health(db, run_limit=run_limit)
    except Exception as e:
        logger.error(f"GET /api/system/health error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch system health")
