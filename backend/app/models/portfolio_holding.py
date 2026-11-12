"""Portfolio Holding model for Portfolio Simulator feature."""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Index
from app.database import Base


class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    purchase_price = Column(Float, nullable=True)  # optional purchase price
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    __table_args__ = (
        Index("idx_portfolio_symbol", "symbol"),
    )

    def __repr__(self):
        return f"<PortfolioHolding(symbol={self.symbol}, qty={self.quantity}, buy_price={self.purchase_price})>"
