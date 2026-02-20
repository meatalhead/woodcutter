# Implementation Plan: Sheet Cutting Optimizer

**Branch**: `001-sheet-cutting-optimizer` | **Date**: 2026-02-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-sheet-cutting-optimizer/spec.md`

## Summary

Build a web-based cutting optimization application that helps woodworkers minimize waste by calculating optimal cutting patterns from stock sheets. The application features a professional, clean Tailwind CSS interface, responsive design for desktop and mobile, and runs as a containerized Python web application with SQLite persistence.

## Technical Context

**Language/Version**: Python 3.11+  
**Primary Dependencies**: FastAPI (modern async framework), SQLAlchemy (ORM), Pydantic (validation)  
**Frontend**: Tailwind CSS (CDN) with professional blue/green/slate theme, vanilla JavaScript for interactivity  
**Storage**: SQLite (file-based, suitable for single-user/small team use)  
**Testing**: pytest (backend), Playwright or Cypress (E2E)  
**Target Platform**: Docker container, web browsers (desktop + mobile)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: <5s optimization for 10 cuts, <100ms page interactions, <3s initial load on 3G  
**Constraints**: Must be fully responsive (375px-1920px+), WCAG 2.1 AA accessible, offline-capable session storage  
**Scale/Scope**: Single-user MVP, support 10-50 stock sheets (with quantity multiplier), 100+ cuts, print to A4

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with `.specify/memory/constitution.md` principles:

- [x] **Code Quality**: Architecture supports testing, type safety, and clean patterns
  - Python type hints with mypy static checking
  - FastAPI provides automatic validation via Pydantic
  - pytest for unit and integration tests
  - Clear separation: API layer, business logic (optimizer), data layer
  
- [x] **UX Consistency**: Design follows established patterns or defines new reusable ones
  - LCARS theme provides consistent visual language across all views
  - Tailwind utility classes ensure spacing/typography consistency
  - Standard form patterns (add/edit/delete) reused across stock and cuts
  - Print CSS media queries for A4 output maintain visual consistency
  
- [x] **Cross-Platform**: Feature works equivalently on mobile and desktop
  - Responsive Tailwind breakpoints (sm/md/lg/xl)
  - Touch-friendly controls (44px minimum targets)
  - SVG diagrams scale across screen sizes
  - Print layout adapts to mobile or desktop print workflows
  - Session storage works identically across platforms

*No constitution violations. All gates passed.*

## Project Structure

### Documentation (this feature)

```text
specs/001-sheet-cutting-optimizer/
├── plan.md              # This file
├── research.md          # Phase 0 output (technology choices, optimization algorithms)
├── data-model.md        # Phase 1 output (entities, relationships, validation)
├── quickstart.md        # Phase 1 output (setup, run, test instructions)
└── contracts/           # Phase 1 output (API OpenAPI spec)
    └── api.yaml
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── models/              # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── stock_sheet.py
│   │   ├── required_cut.py
│   │   └── cutting_plan.py
│   ├── schemas/             # Pydantic request/response schemas
│   │   ├── __init__.py
│   │   ├── stock.py
│   │   ├── cut.py
│   │   └── plan.py
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── optimizer.py     # Core cutting optimization algorithm
│   │   └── layout.py        # 2D bin packing layout generator
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── stock.py
│   │   ├── cuts.py
│   │   └── plans.py
│   └── database.py          # SQLAlchemy setup
├── tests/
│   ├── contract/            # API contract tests
│   ├── integration/         # Integration tests
│   └── unit/                # Unit tests (optimizer algorithm)
├── requirements.txt
└── Dockerfile

frontend/
├── static/
│   ├── css/
│   │   └── lcars-theme.css  # Custom LCARS styling over Tailwind
│   ├── js/
│   │   ├── app.js           # Main application logic
│   │   ├── diagram.js       # SVG cutting diagram renderer
│   │   └── print.js         # A4 print layout generator
│   └── index.html           # Single-page app shell
└── tailwind.config.js       # Tailwind customization for LCARS

docker-compose.yml           # Container orchestration
Dockerfile                   # Multi-stage build (backend + frontend)
README.md                    # Project setup instructions
```

**Structure Decision**: Web application structure with separate backend and frontend directories. Backend uses standard FastAPI project layout (models, schemas, services, api). Frontend is static files served by FastAPI. Docker container bundles both layers for deployment.

## Complexity Tracking

No constitution violations requiring justification.

*Note: Bin packing optimization is computationally complex (NP-hard), but we're using heuristic algorithms (First-Fit Decreasing, Guillotine) with acceptable performance for the scope (<100 cuts). This complexity is inherent to the problem domain, not gratuitous architecture.*

---

## Phase 0: Research - COMPLETED ✓

**Status**: All technical decisions resolved  
**Artifact**: [research.md](research.md)

### Key Decisions Made:

1. **Optimization Algorithm**: Custom Guillotine with First-Fit Decreasing (FFD)
   - 75-85% material utilization
   - <500ms performance for typical projects
   - Full control over constraints (thickness, kerf, priorities)

2. **Backend Framework**: FastAPI
   - Async by default for better performance
   - Automatic Pydantic validation
   - OpenAPI documentation generation
   - Python 3.11+ type safety

3. **LCARS Theme**: Custom Tailwind configuration + CSS
   - Color palette: Orange/gold, blue, pink/magenta on black
   - Pill-shaped buttons, rounded corners, thick borders
   - Responsive adaptations for mobile (simplified shapes)

4. **Database**: SQLite with SQLAlchemy ORM
   - File-based, suitable for single-user MVP
   - Alembic migrations for schema versioning

5. **Print Layout**: CSS @media print rules for A4
   - One cut per page
   - Browser print dialog for user control

6. **Container Strategy**: Single Docker container
   - FastAPI serves both backend API and static frontend
   - SQLite in mounted volume for persistence

**Outcome**: All "NEEDS CLARIFICATION" items resolved. Ready for design phase.

---

## Phase 1: Design & Contracts - COMPLETED ✓

**Status**: All design artifacts generated  
**Artifacts**:
- [data-model.md](data-model.md) - Entity definitions, relationships, validation
- [contracts/api.yaml](contracts/api.yaml) - OpenAPI specification
- [quickstart.md](quickstart.md) - Setup and usage guide
- `.github/agents/copilot-instructions.md` - Updated with project context

### Data Model Summary:

**Entities**:
- `StockSheet`: Available material (width, length, thickness, label, quantity, priority)
- `RequiredCut`: Pieces to cut (width, length, thickness, label, quantity)
- `CuttingPlan`: Optimization result (kerf_width, total_waste, sheets_used)
- `PlanAssignment`: Cut position on sheet (x, y, rotation, sequence_number)

**Key Constraints**:
- Thickness matching enforced (FR-005)
- Kerf spacing applied (FR-025/026)
- Non-overlapping cuts validated (FR-024)
- Sheet boundary checking (FR-021)

### API Endpoints:

**Stock Management**:
- `GET /api/v1/stock` - List stock sheets
- `POST /api/v1/stock` - Add stock sheet
- `PUT /api/v1/stock/{id}` - Update stock sheet
- `DELETE /api/v1/stock/{id}` - Delete stock sheet

**Cut Management**:
- `GET /api/v1/cuts` - List required cuts
- `POST /api/v1/cuts` - Add required cut
- `PUT /api/v1/cuts/{id}` - Update cut
- `DELETE /api/v1/cuts/{id}` - Delete cut

**Optimization**:
- `POST /api/v1/plans/optimize` - Generate cutting plan
- `GET /api/v1/plans/{id}` - Get plan with assignments
- `GET /api/v1/plans/{id}/export/print` - Export as A4 HTML

### Constitution Re-Check (Post-Design):

- [x] **Code Quality**: 
  - SQLAlchemy models provide type safety
  - Pydantic schemas enforce validation
  - Clear separation of concerns (models, services, API)
  - Algorithm testable in isolation

- [x] **UX Consistency**:
  - RESTful API patterns consistent across all endpoints
  - Error responses follow standard format
  - LCARS theme defined with reusable color/shape tokens
  - Print layout uses consistent typography and spacing

- [x] **Cross-Platform**:
  - API responses identical across platforms
  - SVG diagrams scale to any viewport
  - Touch targets sized appropriately (44px minimum)
  - Print layout adapts to browser capabilities

**Final Constitution Check**: ✅ **PASSED** - No violations, all principles upheld

---

## Phase 2: Task Generation - READY

**Next Step**: Run `/speckit.tasks` to generate `tasks.md`

The implementation plan is complete. All design artifacts are ready for task breakdown.

**Recommended Task Workflow**:
1. Phase 1: Setup (Docker, project structure, dependencies)
2. Phase 2: Foundational (Database setup, SQLAlchemy models, API framework)
3. Phase 3: User Story 1 - Basic Cut Optimization (P1 - MVP)
4. Phase 4: User Story 2 - Visual Cutting Diagrams (P2)
5. Phase 5: User Story 3 - Print-Ready Cut Lists (P3)
6. Phase 6: User Story 4 - Stock Sheet Prioritization (P4)
7. Phase 7: User Story 5 - Mobile-Friendly Access (P5)
8. Phase 8: Polish (LCARS theme refinement, accessibility audit, performance testing)

---

## Summary

**Feature**: Sheet Cutting Optimizer  
**Branch**: `001-sheet-cutting-optimizer`  
**Status**: Planning Complete ✓

**Artifacts Generated**:
- ✅ plan.md (this file)
- ✅ research.md (6 technical decisions)
- ✅ data-model.md (4 entities, relationships, validation)
- ✅ contracts/api.yaml (OpenAPI spec with 9 endpoints)
- ✅ quickstart.md (setup, API examples, troubleshooting)
- ✅ .github/agents/copilot-instructions.md (agent context updated)

**Constitution Compliance**: ✅ All gates passed (Code Quality, UX Consistency, Cross-Platform)

**Ready for**: `/speckit.tasks` to generate dependency-ordered task breakdown
