"""RequiredCut database model."""
from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func
import uuid
from app.database import Base


class RequiredCut(Base):
    """Required cut model representing pieces to be cut."""
    __tablename__ = "required_cuts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    width = Column(Float, nullable=False)
    length = Column(Float, nullable=False)
    thickness = Column(Float, nullable=False)
    label = Column(String(100), nullable=False, unique=True)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<RequiredCut {self.label} ({self.width}×{self.length}×{self.thickness}mm) qty={self.quantity}>"
