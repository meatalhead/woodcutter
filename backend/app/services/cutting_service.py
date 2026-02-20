"""Service layer for cutting plan optimization."""
from sqlalchemy.orm import Session
from app.models.stock_sheet import StockSheet
from app.models.required_cut import RequiredCut
from app.models.cutting_plan import CuttingPlan
from app.models.plan_assignment import PlanAssignment
from app.services.optimizer import GuillotineBinPacker, Cut, Sheet
from app.schemas.plan import CuttingPlanResponse, SheetPlan, CutAssignment, UnplacedCutResponse, UnusedSheetResponse
from collections import defaultdict


def create_optimization_plan(db: Session, kerf_width: float = 3.0) -> CuttingPlanResponse:
    """
    Create an optimized cutting plan from current stock and cuts.
    
    Args:
        db: Database session
        kerf_width: Blade kerf width in millimeters
        
    Returns:
        CuttingPlanResponse with optimization results
    """
    # Fetch all stock sheets and required cuts
    stock_sheets = db.query(StockSheet).all()
    required_cuts = db.query(RequiredCut).all()
    
    if not stock_sheets:
        raise ValueError("No stock sheets available")
    if not required_cuts:
        raise ValueError("No required cuts specified")
    
    # Convert to optimizer format
    sheets = [
        Sheet(
            id=s.id,
            width=s.width,
            length=s.length,
            thickness=s.thickness,
            label=s.label,
            priority=s.priority.value,
            quantity=getattr(s, 'quantity', 1) or 1
        )
        for s in stock_sheets
    ]
    
    cuts = [
        Cut(
            id=c.id,
            width=c.width,
            length=c.length,
            thickness=c.thickness,
            label=c.label,
            quantity=c.quantity
        )
        for c in required_cuts
    ]
    
    # Run optimization
    optimizer = GuillotineBinPacker(kerf=kerf_width)
    placements, unplaced = optimizer.optimize(cuts, sheets)
    
    # Helper to get original sheet ID (strips __instN suffix from expanded sheets)
    def original_id(sheet_id):
        s = str(sheet_id)
        return s.split('__inst')[0]
    
    # Create cutting plan record
    plan = CuttingPlan(
        kerf_width=kerf_width,
        sheets_used=len(set(p.sheet.id for p in placements)),
        total_waste=0.0  # Will calculate below
    )
    db.add(plan)
    db.flush()
    
    # Group placements by sheet instance
    placements_by_sheet = defaultdict(list)
    for placement in placements:
        placements_by_sheet[placement.sheet.id].append(placement)
    
    # Create plan assignments and calculate waste
    total_waste = 0.0
    sequence = 1
    
    for sheet_id, sheet_placements in placements_by_sheet.items():
        orig_id = original_id(sheet_id)
        sheet = next(s for s in sheets if s.id == orig_id)
        sheet_area = sheet.width * sheet.length
        used_area = sum(p.cut.width * p.cut.length for p in sheet_placements)
        waste_area = sheet_area - used_area
        total_waste += waste_area
        
        for placement in sheet_placements:
            assignment = PlanAssignment(
                plan_id=plan.id,
                sheet_id=orig_id,
                cut_id=placement.cut.id,
                x_position=placement.x,
                y_position=placement.y,
                rotation=90 if placement.rotated else 0,
                sequence_number=sequence,
                waste_area=waste_area if sequence == 1 else None
            )
            db.add(assignment)
            sequence += 1
    
    plan.total_waste = total_waste
    db.commit()
    db.refresh(plan)
    
    # Build response
    sheet_plans = []
    for sheet_id, sheet_placements in placements_by_sheet.items():
        orig_id = original_id(sheet_id)
        sheet = next(s for s in sheets if s.id == orig_id)
        # Use the expanded instance label from the placement
        instance_label = sheet_placements[0].sheet.label
        sheet_area = sheet.width * sheet.length
        used_area = sum(p.cut.width * p.cut.length for p in sheet_placements)
        
        assignments = [
            CutAssignment(
                cut_id=p.cut.id,
                cut_label=p.cut.label,
                sheet_id=orig_id,
                sheet_label=instance_label,
                x_position=p.x,
                y_position=p.y,
                rotation=90 if p.rotated else 0,
                sequence_number=i + 1,
                width=p.cut.width,
                length=p.cut.length
            )
            for i, p in enumerate(sheet_placements)
        ]
        
        sheet_plans.append(SheetPlan(
            sheet_id=orig_id,
            sheet_label=instance_label,
            sheet_width=sheet.width,
            sheet_length=sheet.length,
            assignments=assignments,
            waste_area=sheet_area - used_area
        ))
    
    # Build unplaced cuts response
    unplaced_response = [
        UnplacedCutResponse(
            cut_id=u.cut.id,
            cut_label=u.cut.label,
            width=u.cut.width,
            length=u.cut.length,
            thickness=u.cut.thickness,
            reason=u.reason
        )
        for u in unplaced
    ]
    
    # Calculate unused sheets (original qty minus instances used)
    used_instances = defaultdict(int)
    for sheet_id in placements_by_sheet:
        used_instances[original_id(sheet_id)] += 1
    
    unused_sheets_response = []
    for s in stock_sheets:
        original_qty = getattr(s, 'quantity', 1) or 1
        used_qty = used_instances.get(s.id, 0)
        remaining = original_qty - used_qty
        if remaining > 0:
            unused_sheets_response.append(UnusedSheetResponse(
                sheet_id=s.id,
                label=s.label,
                width=s.width,
                length=s.length,
                thickness=s.thickness,
                quantity=remaining,
                priority=s.priority.value
            ))
    
    return CuttingPlanResponse(
        id=plan.id,
        created_at=plan.created_at,
        total_waste=plan.total_waste,
        kerf_width=plan.kerf_width,
        sheets_used=plan.sheets_used,
        sheet_plans=sheet_plans,
        unplaced_cuts=unplaced_response,
        unused_sheets=unused_sheets_response
    )
