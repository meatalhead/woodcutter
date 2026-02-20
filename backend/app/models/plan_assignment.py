"""PlanAssignment database model."""
from sqlalchemy import Column, String, Float, Integer, ForeignKey
import uuid
from app.database import Base


class PlanAssignment(Base):
    """Plan assignment model mapping cuts to positions on sheets."""
    __tablename__ = "plan_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id = Column(String, ForeignKey("cutting_plans.id", ondelete="CASCADE"), nullable=False)
    sheet_id = Column(String, ForeignKey("stock_sheets.id"), nullable=False)
    cut_id = Column(String, ForeignKey("required_cuts.id"), nullable=False)
    x_position = Column(Float, nullable=False)
    y_position = Column(Float, nullable=False)
    rotation = Column(Integer, nullable=False)  # 0 or 90 degrees
    sequence_number = Column(Integer, nullable=False)
    waste_area = Column(Float, nullable=True)

    def __repr__(self) -> str:
        return f"<PlanAssignment cut={self.cut_id} on sheet={self.sheet_id} pos=({self.x_position},{self.y_position})>"
