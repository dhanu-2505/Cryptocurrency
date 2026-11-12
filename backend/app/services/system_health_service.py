"""
System / Scraper Health Monitor service.
Extracts operational telemetry, run durations, success rates, and error logs from scrape_logs.
"""
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.scrape_log import ScrapeLog
from app.utils.logger import get_logger

logger = get_logger(__name__)


def get_system_health(db: Session, run_limit: int = 20) -> Dict[str, Any]:
    """
    Retrieve scraper system health statistics:
    - Status: Operational / Degraded / Idle
    - Last run timestamp & duration
    - Total runs, successful runs, success rate
    - Historical runs for charts
    """
    logs = db.query(ScrapeLog).order_by(desc(ScrapeLog.started_at)).limit(run_limit).all()
    total_runs = db.query(func.count(ScrapeLog.id)).scalar() or 0
    success_runs = db.query(func.count(ScrapeLog.id)).filter(ScrapeLog.status == "success").scalar() or 0

    success_rate = round((success_runs / total_runs * 100.0), 1) if total_runs > 0 else 100.0

    last_log = logs[0] if logs else None
    operational_status = "Operational"
    if not last_log:
        operational_status = "Idle"
    elif last_log.status == "failed":
        operational_status = "Degraded"
    elif last_log.status == "running":
        operational_status = "Scraping"

    runs_history = []
    valid_durations = []
    for l in reversed(logs):  # chronological
        duration = None
        if l.completed_at and l.started_at:
            duration = round((l.completed_at - l.started_at).total_seconds(), 2)
            valid_durations.append(duration)

        runs_history.append({
            "id": l.id,
            "started_at": l.started_at.isoformat() if l.started_at else None,
            "completed_at": l.completed_at.isoformat() if l.completed_at else None,
            "duration_seconds": duration or 0.0,
            "coins_scraped": l.coins_scraped or 0,
            "status": l.status,
            "error_message": l.error_message,
        })

    last_duration = 0.0
    if last_log and last_log.completed_at and last_log.started_at:
        last_duration = round((last_log.completed_at - last_log.started_at).total_seconds(), 2)

    avg_duration = round(sum(valid_durations) / len(valid_durations), 2) if valid_durations else 0.0

    return {
        "status": operational_status,
        "last_run": last_log.started_at.isoformat() if last_log and last_log.started_at else None,
        "last_duration": last_duration,
        "last_coins_scraped": last_log.coins_scraped if last_log else 0,
        "last_error": last_log.error_message if last_log else None,
        "total_runs": total_runs,
        "success_runs": success_runs,
        "success_rate": success_rate,
        "average_duration_seconds": avg_duration,
        "recent_runs": runs_history,
    }
