import time
from datetime import datetime
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models.scrape_log import ScrapeLog
from app.services import coin_service
from app.scraper.cmc_scraper import run_scraper
from app.schemas.scrape import ScrapeStatusOut, ScrapeResultOut
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/api", tags=["scrape"])


@router.post("/scrape", response_model=ScrapeResultOut)
def trigger_scrape(db: Session = Depends(get_db)):
    """
    Trigger the Selenium scraper to collect live market data.
    Saves results to the database and returns the collected coins.
    """
    # Create scrape log entry
    scrape_log = ScrapeLog(
        started_at=datetime.utcnow(),
        status="running",
        coins_scraped=0,
    )
    db.add(scrape_log)
    db.commit()
    db.refresh(scrape_log)

    start_time = time.time()

    try:
        logger.info(f"Starting scrape job (log_id={scrape_log.id})")
        raw_coins = run_scraper()

        if not raw_coins:
            raise RuntimeError("Scraper returned no data")

        # Persist to database
        saved_coins = coin_service.save_scraped_data(db, raw_coins)
        duration = round(time.time() - start_time, 2)

        # Update scrape log
        scrape_log.completed_at = datetime.utcnow()
        scrape_log.status = "success"
        scrape_log.coins_scraped = len(saved_coins)
        db.commit()

        # Evaluate price alerts against fresh market data
        from app.services.alert_service import evaluate_all_alerts
        evaluate_all_alerts(db)

        logger.info(f"Scrape completed: {len(saved_coins)} coins in {duration}s")

        # Build response coins with latest price data
        coins_out = coin_service.get_top10_coins(db)

        return ScrapeResultOut(
            success=True,
            message=f"Successfully scraped {len(saved_coins)} cryptocurrencies",
            coins_scraped=len(saved_coins),
            duration_seconds=duration,
            coins=coins_out,
        )

    except Exception as e:
        duration = round(time.time() - start_time, 2)
        error_msg = str(e)
        logger.error(f"Scrape failed after {duration}s: {error_msg}")

        # Update scrape log with failure
        try:
            scrape_log.completed_at = datetime.utcnow()
            scrape_log.status = "failed"
            scrape_log.error_message = error_msg[:1000]
            db.commit()
        except Exception as log_err:
            logger.error(f"Failed to update scrape log: {log_err}")

        return ScrapeResultOut(
            success=False,
            message="Scraping failed. Showing last available data.",
            coins_scraped=0,
            duration_seconds=duration,
            error=error_msg,
        )


@router.get("/scrape/status", response_model=ScrapeStatusOut)
def get_scrape_status(db: Session = Depends(get_db)):
    """Get the most recent scrape log entry."""
    log = db.query(ScrapeLog).order_by(desc(ScrapeLog.started_at)).first()
    if not log:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="No scrape logs found")
    return log
