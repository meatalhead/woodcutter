"""API routes for required cut management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.required_cut import RequiredCut
from app.schemas.cut import RequiredCutCreate, RequiredCutUpdate, RequiredCutResponse

router = APIRouter(prefix="/api/cuts", tags=["cuts"])


@router.post("/", response_model=RequiredCutResponse, status_code=201)
def create_required_cut(cut: RequiredCutCreate, db: Session = Depends(get_db)) -> RequiredCut:
    """Create a new required cut."""
    # Check for duplicate label
    existing = db.query(RequiredCut).filter(RequiredCut.label == cut.label).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Required cut with label '{cut.label}' already exists")
    
    db_cut = RequiredCut(**cut.model_dump())
    db.add(db_cut)
    db.commit()
    db.refresh(db_cut)
    return db_cut


@router.get("/", response_model=list[RequiredCutResponse])
def list_required_cuts(db: Session = Depends(get_db)) -> list[RequiredCut]:
    """List all required cuts."""
    return db.query(RequiredCut).all()


@router.get("/{cut_id}", response_model=RequiredCutResponse)
def get_required_cut(cut_id: str, db: Session = Depends(get_db)) -> RequiredCut:
    """Get a specific required cut by ID."""
    cut = db.query(RequiredCut).filter(RequiredCut.id == cut_id).first()
    if not cut:
        raise HTTPException(status_code=404, detail="Required cut not found")
    return cut


@router.put("/{cut_id}", response_model=RequiredCutResponse)
def update_required_cut(cut_id: str, updates: RequiredCutUpdate, 
                       db: Session = Depends(get_db)) -> RequiredCut:
    """Update a required cut."""
    cut = db.query(RequiredCut).filter(RequiredCut.id == cut_id).first()
    if not cut:
        raise HTTPException(status_code=404, detail="Required cut not found")
    
    # Check for duplicate label if updating
    if updates.label and updates.label != cut.label:
        existing = db.query(RequiredCut).filter(RequiredCut.label == updates.label).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Required cut with label '{updates.label}' already exists")
    
    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(cut, field, value)
    
    db.commit()
    db.refresh(cut)
    return cut


@router.delete("", status_code=204)
def delete_all_required_cuts(db: Session = Depends(get_db)) -> None:
    """Delete all required cuts."""
    db.query(RequiredCut).delete()
    db.commit()


@router.delete("/{cut_id}", status_code=204)
def delete_required_cut(cut_id: str, db: Session = Depends(get_db)) -> None:
    """Delete a required cut."""
    cut = db.query(RequiredCut).filter(RequiredCut.id == cut_id).first()
    if not cut:
        raise HTTPException(status_code=404, detail="Required cut not found")
    
    db.delete(cut)
    db.commit()
