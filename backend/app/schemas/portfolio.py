from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class PortfolioHoldingCreate(BaseModel):
    symbol: str
    quantity: float = Field(..., gt=0, description="Quantity of coins owned")
    purchase_price: Optional[float] = Field(None, ge=0, description="Purchase price per coin")


class PortfolioHoldingUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    purchase_price: Optional[float] = Field(None, ge=0)


class PortfolioHoldingOut(BaseModel):
    id: int
    symbol: str
    name: str
    quantity: float
    purchase_price: Optional[float]
    current_price: float
    current_value: float
    invested_value: float
    profit_loss: float
    profit_loss_pct: float
    change_24h: Optional[float]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PortfolioSummaryOut(BaseModel):
    total_current_value: float
    total_invested_value: float
    total_profit_loss: float
    total_profit_loss_pct: float
    best_performer: Optional[PortfolioHoldingOut] = None
    worst_performer: Optional[PortfolioHoldingOut] = None
    holdings: List[PortfolioHoldingOut] = []
