"""Pydantic schemas for stock sheet operations."""
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Literal


class StockSheetCreate(BaseModel):
    """Schema for creating a stock sheet."""
    width: float = Field(..., gt=0, le=10000, description="Width in millimeters")
    length: float = Field(..., gt=0, le=10000, description="Length in millimeters")
    thickness: float = Field(..., gt=0, le=300, description="Thickness in millimeters")
    label: str = Field(..., min_length=1, max_length=100, description="User-friendly name")
    quantity: int = Field(default=1, ge=1, le=100, description="Number of identical sheets")
    priority: Literal["high", "normal", "low"] = Field(default="normal", description="Use priority")


class StockSheetUpdate(BaseModel):
    """Schema for updating a stock sheet."""
    width: float | None = Field(None, gt=0, le=10000)
    length: float | None = Field(None, gt=0, le=10000)
    thickness: float | None = Field(None, gt=0, le=300)
    label: str | None = Field(None, min_length=1, max_length=100)
    quantity: int | None = Field(None, ge=1, le=100)
    priority: Literal["high", "normal", "low"] | None = None


class StockSheetResponse(BaseModel):
    """Schema for stock sheet response."""
    id: str
    width: float
    length: float
    thickness: float
    label: str
    quantity: int
    priority: str
    created_at: datetime

    class Config:
        from_attributes = True
