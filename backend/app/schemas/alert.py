from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AlertCreate(BaseModel):
    symbol: str
    condition_type: str = Field(
        ...,
        pattern="^(price_above|price_below|change_above|change_below)$",
        description="Condition type: price_above, price_below, change_above, change_below",
    )
    target_value: float


class AlertUpdate(BaseModel):
    condition_type: Optional[str] = Field(
        None,
        pattern="^(price_above|price_below|change_above|change_below)$",
    )
    target_value: Optional[float] = None
    is_active: Optional[bool] = None


class AlertOut(BaseModel):
    id: int
    symbol: str
    condition_type: str
    target_value: float
    is_active: bool
    triggered_at: Optional[datetime] = None
    created_at: datetime
    current_price: Optional[float] = None
    current_change_24h: Optional[float] = None

    model_config = {"from_attributes": True}
