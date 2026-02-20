"""API routes for cutting plan optimization."""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.plan import OptimizationRequest, CuttingPlanResponse
from app.services.cutting_service import create_optimization_plan
from app.services.print_template import generate_print_html

router = APIRouter(prefix="/api/optimize", tags=["optimization"])


@router.post("/", response_model=CuttingPlanResponse)
def optimize_cutting_plan(request: OptimizationRequest, 
                          db: Session = Depends(get_db)) -> CuttingPlanResponse:
    """
    Generate an optimized cutting plan.
    
    Analyzes all stock sheets and required cuts to produce an optimal
    cutting plan that minimizes waste and sheets used.
    """
    try:
        return create_optimization_plan(db, kerf_width=request.kerf_width)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@router.post("/print", response_class=HTMLResponse)
def export_print_view(request: OptimizationRequest,
                      db: Session = Depends(get_db)) -> str:
    """
    Generate print-ready HTML for cutting instructions.
    
    Creates A4-formatted pages with one cut per page, including:
    - Cut dimensions and labels
    - Source sheet information
    - Position diagrams
    - Cutting instructions
    
    Returns HTML that can be printed directly from the browser.
    """
    try:
        # Get the cutting plan
        plan = create_optimization_plan(db, kerf_width=request.kerf_width)
        
        # Convert to dict for template
        plan_dict = {
            "assignments": [
                {
                    "cut": {
                        "label": assignment.cut_label,
                        "width": assignment.cut_width,
                        "length": assignment.cut_length,
                        "thickness": assignment.cut_thickness
                    },
                    "sheet": {
                        "label": assignment.sheet_label,
                        "width": assignment.sheet_width,
                        "length": assignment.sheet_length
                    },
                    "x_position": assignment.x_position,
                    "y_position": assignment.y_position,
                    "rotation": assignment.rotation,
                    "sequence_number": assignment.sequence_number
                }
                for assignment in plan.assignments
            ],
            "kerf_width": plan.kerf_width
        }
        
        # Generate print HTML
        return generate_print_html(plan_dict)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Print generation failed: {str(e)}")
