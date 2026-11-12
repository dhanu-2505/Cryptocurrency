from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    cryptocurrency_id = Column(
        Integer, ForeignKey("cryptocurrencies.id", ondelete="CASCADE"), nullable=False
    )
    price = Column(Float, nullable=False)
    change_24h = Column(Float, nullable=True)
    market_cap = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Relationship
    cryptocurrency = relationship("Cryptocurrency", back_populates="price_history")

    __table_args__ = (
        Index("idx_ph_crypto_id", "cryptocurrency_id"),
        Index("idx_ph_recorded_at", "recorded_at"),
    )

    def __repr__(self):
        return f"<PriceHistory(crypto_id={self.cryptocurrency_id}, price={self.price})>"
