"""API routes for stock sheet management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.stock_sheet import StockSheet
from app.schemas.stock import StockSheetCreate, StockSheetUpdate, StockSheetResponse

router = APIRouter(prefix="/api/stock", tags=["stock"])


@router.post("/", response_model=StockSheetResponse, status_code=201)
def create_stock_sheet(sheet: StockSheetCreate, db: Session = Depends(get_db)) -> StockSheet:
    """Create a new stock sheet."""
    # Check for duplicate label
    existing = db.query(StockSheet).filter(StockSheet.label == sheet.label).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Stock sheet with label '{sheet.label}' already exists")
    
    db_sheet = StockSheet(**sheet.model_dump())
    db.add(db_sheet)
    db.commit()
    db.refresh(db_sheet)
    return db_sheet


@router.get("/", response_model=list[StockSheetResponse])
def list_stock_sheets(db: Session = Depends(get_db)) -> list[StockSheet]:
    """List all stock sheets."""
    return db.query(StockSheet).all()


@router.get("/{sheet_id}", response_model=StockSheetResponse)
def get_stock_sheet(sheet_id: str, db: Session = Depends(get_db)) -> StockSheet:
    """Get a specific stock sheet by ID."""
    sheet = db.query(StockSheet).filter(StockSheet.id == sheet_id).first()
    if not sheet:
        raise HTTPException(status_code=404, detail="Stock sheet not found")
    return sheet


@router.put("/{sheet_id}", response_model=StockSheetResponse)
def update_stock_sheet(sheet_id: str, updates: StockSheetUpdate, 
                       db: Session = Depends(get_db)) -> StockSheet:
    """Update a stock sheet."""
    sheet = db.query(StockSheet).filter(StockSheet.id == sheet_id).first()
    if not sheet:
        raise HTTPException(status_code=404, detail="Stock sheet not found")
    
    # Check for duplicate label if updating
    if updates.label and updates.label != sheet.label:
        existing = db.query(StockSheet).filter(StockSheet.label == updates.label).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Stock sheet with label '{updates.label}' already exists")
    
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(sheet, field, value)
    
    db.commit()
    db.refresh(sheet)
    return sheet


@router.delete("", status_code=204)
def delete_all_stock_sheets(db: Session = Depends(get_db)) -> None:
    """Delete all stock sheets."""
    db.query(StockSheet).delete()
    db.commit()


@router.delete("/{sheet_id}", status_code=204)
def delete_stock_sheet(sheet_id: str, db: Session = Depends(get_db)) -> None:
    """Delete a stock sheet."""
    sheet = db.query(StockSheet).filter(StockSheet.id == sheet_id).first()
    if not sheet:
        raise HTTPException(status_code=404, detail="Stock sheet not found")
    
    db.delete(sheet)
    db.commit()
