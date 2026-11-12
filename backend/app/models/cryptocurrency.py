from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.orm import relationship
from app.database import Base


class Cryptocurrency(Base):
    __tablename__ = "cryptocurrencies"

    id = Column(Integer, primary_key=True, index=True)
    rank = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    symbol = Column(String(20), nullable=False, unique=True, index=True)
    slug = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationship
    price_history = relationship(
        "PriceHistory", back_populates="cryptocurrency", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("idx_crypto_symbol", "symbol"),)

    def __repr__(self):
        return f"<Cryptocurrency(symbol={self.symbol}, rank={self.rank})>"
