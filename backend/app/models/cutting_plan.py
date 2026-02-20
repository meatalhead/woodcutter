"""CuttingPlan database model."""
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func
import uuid
from app.database import Base


class CuttingPlan(Base):
    """Cutting plan model representing optimization result."""
    __tablename__ = "cutting_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    total_waste = Column(Float, nullable=True)
    kerf_width = Column(Float, nullable=False, default=3.0)
    sheets_used = Column(Integer, nullable=True)

    def __repr__(self) -> str:
        return f"<CuttingPlan {self.id} sheets={self.sheets_used} waste={self.total_waste}mm²>"
