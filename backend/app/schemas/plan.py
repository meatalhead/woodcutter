"""Pydantic schemas for cutting plan operations."""
from pydantic import BaseModel, Field
from datetime import datetime


class OptimizationRequest(BaseModel):
    """Schema for optimization request."""
    kerf_width: float = Field(default=3.0, ge=0, le=10, description="Blade kerf width in millimeters")


class CutAssignment(BaseModel):
    """Schema for a single cut assignment within a plan."""
    cut_id: str
    cut_label: str
    sheet_id: str
    sheet_label: str
    x_position: float
    y_position: float
    rotation: int
    sequence_number: int
    width: float
    length: float


class SheetPlan(BaseModel):
    """Schema for cutting plan for a single sheet."""
    sheet_id: str
    sheet_label: str
    sheet_width: float
    sheet_length: float
    assignments: list[CutAssignment]
    waste_area: float


class UnplacedCutResponse(BaseModel):
    """Schema for a cut that could not be placed."""
    cut_id: str
    cut_label: str
    width: float
    length: float
    thickness: float
    reason: str


class UnusedSheetResponse(BaseModel):
    """Schema for a stock sheet not used in the cutting plan."""
    sheet_id: str
    label: str
    width: float
    length: float
    thickness: float
    quantity: int
    priority: str


class CuttingPlanResponse(BaseModel):
    """Schema for cutting plan response."""
    id: str
    created_at: datetime
    total_waste: float
    kerf_width: float
    sheets_used: int
    sheet_plans: list[SheetPlan]
    unplaced_cuts: list[UnplacedCutResponse] = []
    unused_sheets: list[UnusedSheetResponse] = []

    class Config:
        from_attributes = True
