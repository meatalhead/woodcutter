"""StockSheet database model."""
from sqlalchemy import Column, String, Float, Integer, Enum as SQLEnum, DateTime
from sqlalchemy.sql import func
import enum
import uuid
from app.database import Base


class PriorityLevel(str, enum.Enum):
    """Priority levels for stock sheets."""
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class StockSheet(Base):
    """Stock sheet model representing available material."""
    __tablename__ = "stock_sheets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    width = Column(Float, nullable=False)
    length = Column(Float, nullable=False)
    thickness = Column(Float, nullable=False)
    label = Column(String(100), nullable=False, unique=True)
    quantity = Column(Integer, nullable=False, default=1)
    priority = Column(SQLEnum(PriorityLevel), nullable=False, default=PriorityLevel.NORMAL)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<StockSheet {self.label} ({self.width}×{self.length}×{self.thickness}mm)>"
