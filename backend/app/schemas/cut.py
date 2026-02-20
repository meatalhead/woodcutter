"""Pydantic schemas for required cut operations."""
from pydantic import BaseModel, Field
from datetime import datetime


class RequiredCutCreate(BaseModel):
    """Schema for creating a required cut."""
    width: float = Field(..., gt=0, le=10000, description="Width in millimeters")
    length: float = Field(..., gt=0, le=10000, description="Length in millimeters")
    thickness: float = Field(..., gt=0, le=300, description="Thickness in millimeters")
    label: str = Field(..., min_length=1, max_length=100, description="User-friendly name")
    quantity: int = Field(default=1, ge=1, le=1000, description="Number of pieces needed")


class RequiredCutUpdate(BaseModel):
    """Schema for updating a required cut."""
    width: float | None = Field(None, gt=0, le=10000)
    length: float | None = Field(None, gt=0, le=10000)
    thickness: float | None = Field(None, gt=0, le=300)
    label: str | None = Field(None, min_length=1, max_length=100)
    quantity: int | None = Field(None, ge=1, le=1000)


class RequiredCutResponse(BaseModel):
    """Schema for required cut response."""
    id: str
    width: float
    length: float
    thickness: float
    label: str
    quantity: int
    created_at: datetime

    class Config:
        from_attributes = True
