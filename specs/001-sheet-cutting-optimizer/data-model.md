# Data Model: Sheet Cutting Optimizer

**Date**: 2026-02-14  
**Feature**: Sheet Cutting Optimizer  
**Purpose**: Define entities, relationships, and validation rules for the cutting optimization domain

## Entity Diagram

```
┌─────────────────┐
│  StockSheet     │
│─────────────────│
│ id: UUID        │
│ width: Float    │
│ length: Float   │
│ thickness: Float│
│ label: String   │
│ quantity: Int   │
│ priority: Enum  │
│ created_at: DT  │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌────────────────────┐        ┌──────────────────┐
│  CuttingPlan       │◄──────►│  RequiredCut     │
│────────────────────│   N:M  │──────────────────│
│ id: UUID           │        │ id: UUID         │
│ created_at: DT     │        │ width: Float     │
│ total_waste: Float │        │ length: Float    │
│ kerf_width: Float  │        │ thickness: Float │
│ sheets_used: Int   │        │ label: String    │
└────────┬───────────┘        │ quantity: Int    │
         │                    │ created_at: DT   │
         │ 1:N                └──────────────────┘
         │
         ▼
┌────────────────────┐
│  PlanAssignment    │
│────────────────────│
│ id: UUID           │
│ plan_id: UUID (FK) │
│ sheet_id: UUID(FK) │
│ cut_id: UUID (FK)  │
│ x_position: Float  │
│ y_position: Float  │
│ rotation: Int      │ (0 or 90 degrees)
│ sequence_num: Int  │
│ waste_area: Float  │
└────────────────────┘
```

## Entity Definitions

### StockSheet

**Purpose**: Represents available material inventory that can be cut

**Attributes**:
- `id` (UUID, primary key): Unique identifier
- `width` (Float, required): Width in millimeters (must be > 0)
- `length` (Float, required): Length in millimeters (must be > 0)
- `thickness` (Float, required): Thickness in millimeters (must be > 0)
- `label` (String, required, max 100 chars): User-friendly name (e.g., "Plywood Sheet A", "Offcut #3")
- `quantity` (Int, required, default 1): Number of identical sheets available (must be ≥ 1)
- `priority` (Enum, default "normal"): Use priority - values: "high", "normal", "low"
- `created_at` (DateTime, auto): Timestamp when sheet was added

**Validation Rules**:
- Width, length, thickness must be positive numbers (> 0)
- Width and length must be ≤ 10,000mm (reasonable upper bound)
- Thickness must be ≤ 300mm (reasonable upper bound)
- Quantity must be ≥ 1 and ≤ 100 (reasonable upper bound)
- Label must be unique within user's session
- Priority must be one of: "high", "normal", "low"

**State Transitions**: None (simple CRUD)

**Relationships**:
- One stock sheet can appear in multiple cutting plans (1:N with PlanAssignment)

---

### RequiredCut

**Purpose**: Represents a piece that needs to be cut from stock sheets

**Attributes**:
- `id` (UUID, primary key): Unique identifier
- `width` (Float, required): Width in millimeters (must be > 0)
- `length` (Float, required): Length in millimeters (must be > 0)
- `thickness` (Float, required): Thickness in millimeters (must be > 0)
- `label` (String, required, max 100 chars): User-friendly name (e.g., "Shelf A", "Back Panel")
- `quantity` (Int, required, default 1): Number of identical pieces needed (must be ≥ 1)
- `created_at` (DateTime, auto): Timestamp when cut was added

**Validation Rules**:
- Width, length, thickness must be positive numbers (> 0)
- Width and length must be ≤ 10,000mm
- Thickness must be ≤ 300mm
- Quantity must be ≥ 1 and ≤ 1000 (reasonable upper bound)
- Label must be unique within user's session
- If quantity > 1, system creates multiple PlanAssignments with same cut_id

**State Transitions**: None (simple CRUD)

**Relationships**:
- One required cut can appear in multiple plan assignments (1:N with PlanAssignment)
- Quantity > 1 creates multiple assignments for the same cut

---

### CuttingPlan

**Purpose**: Represents an optimized cutting solution for a set of cuts and stock sheets

**Attributes**:
- `id` (UUID, primary key): Unique identifier
- `created_at` (DateTime, auto): Timestamp when plan was generated
- `total_waste` (Float, calculated): Sum of unused area across all sheets (mm²)
- `kerf_width` (Float, required): Blade width used in calculations (mm), default 3mm
- `sheets_used` (Int, calculated): Count of distinct stock sheets required

**Validation Rules**:
- kerf_width must be ≥ 0 and ≤ 10mm
- total_waste is calculated, not user-input
- sheets_used is calculated from PlanAssignment count

**Calculated Fields**:
- `total_waste`: Sum of (stock_sheet.area - sum(assigned_cuts.area)) for all sheets
- `sheets_used`: Count of distinct sheet_ids in PlanAssignments
- `utilization_percent`: ((total_cut_area / total_sheet_area) × 100)

**State Transitions**: None (read-only after generation)

**Relationships**:
- One plan has many assignments (1:N with PlanAssignment)

---

### PlanAssignment

**Purpose**: Maps a specific required cut to a position on a stock sheet within a cutting plan

**Attributes**:
- `id` (UUID, primary key): Unique identifier
- `plan_id` (UUID, foreign key → CuttingPlan): The cutting plan this belongs to
- `sheet_id` (UUID, foreign key → StockSheet): Which stock sheet to use
- `cut_id` (UUID, foreign key → RequiredCut): Which cut piece to make
- `x_position` (Float, required): X-coordinate of bottom-left corner (mm)
- `y_position` (Float, required): Y-coordinate of bottom-left corner (mm)
- `rotation` (Int, required): Rotation angle - 0° or 90° only
- `sequence_number` (Int, required): Order to make cuts (1, 2, 3...) to minimize blade repositioning
- `waste_area` (Float, calculated): Unused area on this sheet after this cut (mm²)

**Validation Rules**:
- x_position, y_position must be ≥ 0
- x_position + cut.width (or cut.length if rotated) must be ≤ stock_sheet.width
- y_position + cut.length (or cut.width if rotated) must be ≤ stock_sheet.length
- rotation must be 0 or 90
- sequence_number must be > 0
- cut.thickness must equal stock_sheet.thickness (enforced by optimizer)

**Constraints**:
- No overlapping assignments on the same sheet (validated geometrically)
- Kerf spacing applied between adjacent cuts (x_position, y_position account for kerf)

**Relationships**:
- Belongs to one CuttingPlan (N:1)
- References one StockSheet (N:1)
- References one RequiredCut (N:1)

---

## Validation Rules Summary

### Cross-Entity Validation

1. **Thickness Matching** (FR-005):
   - When creating PlanAssignment, cut.thickness MUST equal sheet.thickness
   - Optimizer only considers sheets with matching thickness

2. **Kerf Spacing** (FR-025, FR-026):
   - x_position and y_position calculations include kerf offset
   - Example: If cut A is at (0, 0) with width 500mm, next cut B starts at (500 + kerf_width, 0)

3. **Non-Overlapping** (FR-024):
   - For all assignments on same sheet, rectangles must not overlap
   - Validation: For cuts A and B, either:
     - A.x + A.width + kerf ≤ B.x OR
     - B.x + B.width + kerf ≤ A.x OR
     - A.y + A.height + kerf ≤ B.y OR
     - B.y + B.height + kerf ≤ A.y

4. **Sheet Boundaries** (FR-021):
   - Cut must fit within stock sheet dimensions
   - If rotated 0°: x + width ≤ sheet.width AND y + length ≤ sheet.length
   - If rotated 90°: x + length ≤ sheet.width AND y + width ≤ sheet.length

### Input Validation (Pydantic Schemas)

All user inputs validated via Pydantic schemas:
- Type checking (Float, Int, String, Enum)
- Range constraints (> 0, ≤ max values)
- String length limits
- Enum value validation

---

## Data Access Patterns

### Read Patterns

1. **List stock sheets**: `SELECT * FROM stock_sheets ORDER BY priority DESC, created_at ASC`
2. **List required cuts**: `SELECT * FROM required_cuts ORDER BY created_at ASC`
3. **Get cutting plan with assignments**:
   ```sql
   SELECT cp.*, sa.* 
   FROM cutting_plans cp
   JOIN plan_assignments sa ON cp.id = sa.plan_id
   JOIN stock_sheets ss ON sa.sheet_id = ss.id
   JOIN required_cuts rc ON sa.cut_id = rc.id
   WHERE cp.id = ?
   ORDER BY sa.sheet_id, sa.sequence_number
   ```

### Write Patterns

1. **Add stock sheet**: `INSERT INTO stock_sheets (...) VALUES (...)`
2. **Add required cut**: `INSERT INTO required_cuts (...) VALUES (...)`
3. **Generate cutting plan**:
   - Create CuttingPlan record
   - Run optimizer algorithm
   - Bulk insert PlanAssignments (transaction)
   - Calculate and update total_waste, sheets_used

### Performance Considerations

- Index on `cutting_plans.created_at` for recent plans
- Index on `plan_assignments.plan_id` for join performance
- Index on `plan_assignments.sheet_id` for grouping by sheet
- SQLite works well for <10,000 records per table (sufficient for MVP)

---

## Migration Strategy

**Initial Migration** (v1):
```sql
CREATE TABLE stock_sheets (
    id TEXT PRIMARY KEY,
    width REAL NOT NULL CHECK(width > 0),
    length REAL NOT NULL CHECK(length > 0),
    thickness REAL NOT NULL CHECK(thickness > 0),
    label TEXT NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 1),
    priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('high', 'normal', 'low')),
    created_at TEXT NOT NULL
);

CREATE TABLE required_cuts (
    id TEXT PRIMARY KEY,
    width REAL NOT NULL CHECK(width > 0),
    length REAL NOT NULL CHECK(length > 0),
    thickness REAL NOT NULL CHECK(thickness > 0),
    label TEXT NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity >= 1),
    created_at TEXT NOT NULL
);

CREATE TABLE cutting_plans (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    total_waste REAL,
    kerf_width REAL NOT NULL DEFAULT 3.0 CHECK(kerf_width >= 0),
    sheets_used INTEGER
);

CREATE TABLE plan_assignments (
    id TEXT PRIMARY KEY,
    plan_id TEXT NOT NULL REFERENCES cutting_plans(id) ON DELETE CASCADE,
    sheet_id TEXT NOT NULL REFERENCES stock_sheets(id),
    cut_id TEXT NOT NULL REFERENCES required_cuts(id),
    x_position REAL NOT NULL CHECK(x_position >= 0),
    y_position REAL NOT NULL CHECK(y_position >= 0),
    rotation INTEGER NOT NULL CHECK(rotation IN (0, 90)),
    sequence_number INTEGER NOT NULL CHECK(sequence_number > 0),
    waste_area REAL
);

CREATE INDEX idx_plan_assignments_plan ON plan_assignments(plan_id);
CREATE INDEX idx_plan_assignments_sheet ON plan_assignments(sheet_id);
CREATE INDEX idx_cutting_plans_created ON cutting_plans(created_at DESC);
```

**Future Migrations**:
- Add user_id if multi-user support added
- Add session_id for anonymous users
- Add plan.name for saved/bookmarked plans
