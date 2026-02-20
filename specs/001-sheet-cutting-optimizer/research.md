# Research: Sheet Cutting Optimizer

**Date**: 2026-02-14  
**Feature**: Sheet Cutting Optimizer  
**Purpose**: Technical research to resolve design decisions and select appropriate technologies

## Decision 1: 2D Bin Packing Optimization Algorithm

**Decision**: Implement custom Guillotine algorithm with First-Fit Decreasing (FFD) heuristic

**Rationale**:
- Guillotine cutting matches woodworking reality (table saw cuts must go all the way across)
- FFD provides 75-85% material utilization with <500ms performance for 10-100 cuts
- Custom implementation gives full control over constraints (thickness matching, kerf offset, sheet priorities)
- Simpler than Best-Fit Decreasing while delivering acceptable waste reduction

**Implementation Approach**:
1. Sort required cuts by area (largest first)
2. For each stock sheet: recursively partition via guillotine cuts
3. Track available rectangles; place items in best-fit partition
4. Respect thickness matching (FR-005), kerf offset (FR-025/026), and priorities (FR-009/010)
5. Support 0° and 90° rotation for optimal placement

**Performance Profile**:
- Expected: 50-500ms for typical projects (10-100 cuts, 5-20 sheets)
- Target: <5 seconds (easily achievable)
- Linear time complexity with sorted input

**Alternatives Considered**:
- **rectpack library**: Simpler but limited guillotine-specific optimizations, less control over constraints
- **Best-Fit Decreasing**: ~80% utilization vs 75% FFD, but 2x complexity and slower for marginal improvement
- **Maximal Rectangles**: 80-90% utilization but 500ms-2s runtime, overkill for woodworking use case

**References**:
- Guillotine 2D bin packing research
- rectpack, binpack, py3dbp Python libraries evaluated

---

## Decision 2: FastAPI vs Flask Backend Framework

**Decision**: Use FastAPI

**Rationale**:
- **Async by default**: Better performance for I/O operations (database, file operations)
- **Automatic validation**: Pydantic schemas provide type safety and data validation out of the box
- **OpenAPI generation**: Auto-generates API documentation from type hints
- **Modern Python**: Leverages Python 3.7+ type hints, aligns with constitution's type safety requirement
- **Better testing**: Built-in test client, async test support

**Alternatives Considered**:
- **Flask**: Mature ecosystem, simpler learning curve, but requires additional libraries (marshmallow for validation, flask-restful for API structure). FastAPI provides these features natively.

---

## Decision 3: LCARS Theme Implementation Strategy

**Decision**: Custom Tailwind configuration with LCARS design tokens + custom CSS for complex shapes

**LCARS Visual Characteristics**:
- **Color Palette**: 
  - Primary: Orange/gold (#FF9900, #FFCC99)
  - Secondary: Blue (#9999FF, #6688CC)
  - Accent: Pink/magenta (#CC6699)
  - Background: Black (#000000)
  - Text: White (#FFFFFF), pale blue-gray
- **Typography**: Sans-serif, uppercase text for labels, mixed case for content
- **Shapes**: Rounded corners with signature "pill" shapes, diagonal cutouts, thick borders
- **Layout**: Asymmetric panels, layered elements, strong horizontal divisions

**Implementation Approach**:

1. **Tailwind Configuration** (tailwind.config.js):
```javascript
colors: {
  lcars: {
    orange: '#FF9900',
    'orange-light': '#FFCC99',
    blue: '#9999FF',
    'blue-dark': '#6688CC',
    magenta: '#CC6699',
    black: '#000000',
    white: '#FFFFFF',
  }
}
borderRadius: {
  'lcars': '24px',  // Signature rounded corners
  'lcars-pill': '50px',
}
```

2. **Custom CSS** (lcars-theme.css):
- Diagonal cutouts using clip-path
- Pill-shaped buttons and panels
- Thick borders (4-8px)
- Gradient overlays for depth

3. **Responsive Adaptations**:
- Simplify diagonal elements on mobile (straight edges acceptable)
- Maintain color palette and typography across all breakpoints
- Touch-friendly button sizes (44px minimum per constitution)
- Reduce border thickness on small screens (2-4px instead of 4-8px)

**Component Patterns**:
- **Panels**: Rounded rectangle containers with thick colored borders
- **Buttons**: Pill-shaped with LCARS accent colors, uppercase labels
- **Forms**: Clean input fields with subtle borders, LCARS-colored focus states
- **Diagrams**: SVG graphics with LCARS color scheme (stock sheets in blue, cuts in orange)

**Accessibility Considerations**:
- High contrast ratios (orange on black, white on black) meet WCAG AA
- Avoid relying solely on color (use labels, icons, patterns)
- Keyboard navigation with visible focus states

**Alternatives Considered**:
- **Pre-built LCARS libraries**: Limited Tailwind-specific options, most are Bootstrap or raw CSS
- **Full custom CSS**: More control but harder to maintain responsive utilities
- **Component libraries (Material UI, etc.)**: Conflict with LCARS aesthetic

---

## Decision 4: SQLite Database Schema Strategy

**Decision**: Use SQLAlchemy ORM with simple relational schema

**Schema Overview**:
- **stock_sheets** table: id, width, length, thickness, label, priority, created_at
- **required_cuts** table: id, width, length, thickness, label, quantity, created_at
- **cutting_plans** table: id, created_at, total_waste, kerf_width
- **plan_assignments** table: id, plan_id, sheet_id, cut_id, x_position, y_position, rotation, sequence_number

**Rationale**:
- SQLite suitable for single-user/small team MVP (file-based, no server required)
- SQLAlchemy provides type-safe models and migrations
- Session storage for UI state, database for persistent cutting plans
- Supports Docker deployment (SQLite file in volume mount)

**Migration Strategy**:
- Use Alembic for schema migrations
- Initial migration creates all tables
- Version controlled migration files

**Alternatives Considered**:
- **PostgreSQL**: Overkill for MVP, requires separate container/service
- **JSON files**: Simpler but lacks querying, relationships, concurrent access safety
- **In-memory only**: Loses cutting plans on restart, doesn't meet FR-020 persistence requirement

---

## Decision 5: Print Layout Generation

**Decision**: CSS @media print rules + server-side PDF generation option

**Approach**:
1. **CSS Print Styles**: @media print rules for A4 layout (210mm × 297mm)
2. **One cut per page**: CSS page-break-after for each cut instruction
3. **Optimized diagrams**: Larger SVG diagrams for print (150-200mm width)
4. **Clear typography**: Larger fonts (14-16pt) for workshop readability

**Optional Enhancement** (future):
- Server-side PDF generation using ReportLab or WeasyPrint
- Pre-formatted A4 PDFs for download
- Batch export (all cuts as single PDF)

**Rationale**:
- CSS print media queries are simpler and faster for MVP
- Browser print dialog gives users control over paper size, margins
- No additional backend dependencies

**Alternatives Considered**:
- **Server-side PDF only**: More complex, requires additional library (ReportLab/WeasyPrint)
- **Client-side PDF (jsPDF)**: Larger frontend bundle, less control over print quality

---

## Decision 6: Docker Container Strategy

**Decision**: Multi-stage Dockerfile with Python backend + static frontend served by FastAPI

**Approach**:
```dockerfile
# Stage 1: Build frontend (if using bundler)
# Stage 2: Python runtime
FROM python:3.11-slim
COPY backend/ /app/backend
COPY frontend/static/ /app/static
RUN pip install -r /app/backend/requirements.txt
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Rationale**:
- Single container for simplicity (backend + static files)
- FastAPI serves static files (frontend) and API endpoints
- SQLite database file in mounted volume for persistence
- Minimal image size (~200-300MB)

**docker-compose.yml**:
```yaml
services:
  woodcutter:
    build: .
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data  # SQLite database persistence
```

**Alternatives Considered**:
- **Separate frontend container**: Nginx + FastAPI in separate containers, adds complexity for minimal benefit
- **No Docker**: Requires manual Python environment setup, less portable

---

## Summary of Resolved Clarifications

All technical decisions resolved:
- ✅ Optimization algorithm: Custom Guillotine FFD
- ✅ Backend framework: FastAPI
- ✅ LCARS theme: Custom Tailwind + CSS
- ✅ Database: SQLite with SQLAlchemy ORM
- ✅ Print: CSS @media print rules
- ✅ Container: Single-stage Docker with FastAPI serving frontend

Ready for Phase 1: Design & Contracts.
