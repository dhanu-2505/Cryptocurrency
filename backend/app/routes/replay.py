"""
Market Replay Router.
Endpoints for timeline historical observation playback.
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

from app.database import get_db
from app.services import replay_service
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api/replay", tags=["replay"])


@router.get("/timestamps", response_model=Dict[str, Any])
def get_timestamps(db: Session = Depends(get_db)):
    """Get all distinct observation timestamps available for historical replay."""
    try:
        return replay_service.get_replay_timestamps(db)
    except Exception as e:
        logger.error(f"GET /api/replay/timestamps error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch replay timestamps")


@router.get("/snapshot", response_model=Dict[str, Any])
def get_snapshot(
    timestamp: Optional[str] = Query(None, description="ISO timestamp for snapshot point"),
    db: Session = Depends(get_db),
):
    """Retrieve market state snapshot at or nearest to the specified timestamp."""
    try:
        return replay_service.get_replay_snapshot(db, target_iso=timestamp)
    except Exception as e:
        logger.error(f"GET /api/replay/snapshot error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch replay snapshot")
