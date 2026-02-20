"""Initialize database with all tables."""
from app.database import Base, engine
from app.models.stock_sheet import StockSheet
from app.models.required_cut import RequiredCut
from app.models.cutting_plan import CuttingPlan
from app.models.plan_assignment import PlanAssignment


def init_db() -> None:
    """Create all database tables."""
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    print("Creating database tables...")
    init_db()
    print("✓ Database tables created successfully")
