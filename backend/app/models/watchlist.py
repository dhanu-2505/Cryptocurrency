"""Watchlist model for personal coin watchlist feature."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Index
from app.database import Base


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (Index("idx_watchlist_symbol", "symbol"),)

    def __repr__(self):
        return f"<Watchlist(symbol={self.symbol})>"
