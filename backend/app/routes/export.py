import os
from fastapi import APIRouter, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.services import coin_service
from app.utils.csv_export import generate_csv
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["export"])


@router.get("/export/csv")
def export_csv(
    symbol: Optional[str] = Query(None, description="Filter by coin symbol"),
    db: Session = Depends(get_db),
):
    """
    Generate and download a CSV file of historical price data.
    Optionally filter by coin symbol.
    """
    try:
        records = coin_service.get_all_history(db, coin_symbol=symbol, limit=5000)

        if not records:
            # Return empty CSV rather than 404
            records = []

        filepath = generate_csv(records)

        return FileResponse(
            path=filepath,
            media_type="text/csv",
            filename=os.path.basename(filepath),
            headers={"Content-Disposition": f"attachment; filename={os.path.basename(filepath)}"},
        )
    except Exception as e:
        logger.error(f"CSV export error: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"CSV export failed: {str(e)}")
