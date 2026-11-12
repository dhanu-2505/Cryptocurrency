import os
import pandas as pd
from datetime import datetime
from typing import List
from app.utils.logger import get_logger

logger = get_logger(__name__)

EXPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "exports")


def ensure_exports_dir():
    """Ensure the exports directory exists."""
    abs_path = os.path.abspath(EXPORTS_DIR)
    os.makedirs(abs_path, exist_ok=True)
    return abs_path


def generate_csv(records: List[dict]) -> str:
    """
    Generate a CSV file from a list of price records.
    Returns the absolute path to the generated CSV.
    """
    exports_dir = ensure_exports_dir()
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"crypto_export_{timestamp}.csv"
    filepath = os.path.join(exports_dir, filename)

    if not records:
        # Create empty CSV with headers
        df = pd.DataFrame(columns=[
            "Timestamp", "Rank", "Coin Name", "Symbol",
            "Price (USD)", "24h Change (%)", "Market Cap (USD)"
        ])
    else:
        rows = []
        for r in records:
            rows.append({
                "Timestamp": r.get("recorded_at", ""),
                "Rank": r.get("rank", ""),
                "Coin Name": r.get("name", ""),
                "Symbol": r.get("symbol", ""),
                "Price (USD)": r.get("price", ""),
                "24h Change (%)": r.get("change_24h", ""),
                "Market Cap (USD)": r.get("market_cap", ""),
            })
        df = pd.DataFrame(rows)

    df.to_csv(filepath, index=False)
    logger.info(f"CSV exported: {filepath} ({len(records)} records)")
    return filepath
