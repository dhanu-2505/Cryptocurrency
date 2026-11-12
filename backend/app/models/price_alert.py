"""Price Alert model for Smart Price Alerts feature."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Index
from app.database import Base


class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    condition_type = Column(String(30), nullable=False)
    # condition_type: price_above | price_below | change_above | change_below
    target_value = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    triggered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_alerts_symbol", "symbol"),
        Index("idx_alerts_active", "is_active"),
    )

    def __repr__(self):
        return f"<PriceAlert(symbol={self.symbol}, type={self.condition_type}, target={self.target_value})>"
