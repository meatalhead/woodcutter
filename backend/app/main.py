"""FastAPI application initialization."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pathlib import Path
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Sheet Cutting Optimizer API",
    description="REST API for woodworking sheet cutting optimization",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handling middleware
@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    """
    Global error handling middleware.
    Catches exceptions and returns consistent error responses.
    """
    try:
        response = await call_next(request)
        return response
    except ValidationError as e:
        """Handle Pydantic validation errors"""
        logger.warning(f"Validation error: {e}")
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Validation error",
                "errors": [{"field": err["loc"], "message": err["msg"]} for err in e.errors()]
            }
        )
    except SQLAlchemyError as e:
        """Handle database errors"""
        logger.error(f"Database error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Database error occurred",
                "error_type": "database_error"
            }
        )
    except ValueError as e:
        """Handle value errors"""
        logger.warning(f"Value error: {e}")
        return JSONResponse(
            status_code=400,
            content={
                "detail": str(e),
                "error_type": "value_error"
            }
        )
    except Exception as e:
        """Handle unexpected errors"""
        logger.error(f"Unexpected error: {type(e).__name__}: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "An unexpected error occurred",
                "error_type": "internal_server_error"
            }
        )

# Mount static files for frontend
# In container: /app/frontend/static
# In development: ../../../frontend/static (relative to this file)
static_path = Path("/app/frontend/static")
if not static_path.exists():
    # Fallback for local development
    static_path = Path(__file__).parent.parent.parent / "frontend" / "static"

if static_path.exists():
    app.mount("/static", StaticFiles(directory=str(static_path)), name="static")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "woodcutter"}

# Root endpoint - serve index.html
@app.get("/")
async def root():
    """Serve the frontend application."""
    from fastapi.responses import FileResponse
    index_path = static_path / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return {"message": "Sheet Cutting Optimizer API", "docs": "/docs"}

# Database initialization
from app.database import Base, engine

@app.on_event("startup")
async def startup_event() -> None:
    """Initialize database on startup."""
    Base.metadata.create_all(bind=engine)

# Register API routers
from app.api import stock, cuts, optimize
app.include_router(stock.router)
app.include_router(cuts.router)
app.include_router(optimize.router)
