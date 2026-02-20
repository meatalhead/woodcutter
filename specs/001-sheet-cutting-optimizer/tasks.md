---

description: "Task list for Sheet Cutting Optimizer implementation"
---

# Tasks: Sheet Cutting Optimizer

**Input**: Design documents from `/specs/001-sheet-cutting-optimizer/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - only included if explicitly requested. This feature does not require tests for MVP.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` for Python/FastAPI, `frontend/` for HTML/CSS/JS
- Paths shown below follow the web application structure from plan.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend directory structure (backend/app/{models,schemas,services,api}/)
- [x] T002 Create frontend directory structure (frontend/static/{css,js}/)
- [x] T003 Create requirements.txt with FastAPI, SQLAlchemy, Pydantic, pytest, uvicorn
- [x] T004 Create Dockerfile for Python 3.11 with multi-stage build
- [x] T005 Create docker-compose.yml for container orchestration with volume mounts
- [x] T006 [P] Create .gitignore for Python (__pycache__, *.pyc, .env, data/)
- [x] T007 [P] Create README.md with quick start instructions from quickstart.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T08 Configure SQLAlchemy database connection in backend/app/database.py (SQLite: data/woodcutter.db)
- [x] T09 Create FastAPI app initialization in backend/app/main.py with CORS middleware
- [x] T010 [P] Create Tailwind CSS configuration in frontend/tailwind.config.js with LCARS color palette
- [x] T011 [P] Create LCARS theme base CSS in frontend/static/css/lcars-theme.css (colors, pill shapes, borders)
- [x] T012 [P] Create base HTML shell in frontend/static/index.html with LCARS layout structure
- [x] T013 Setup FastAPI static file serving for frontend/ directory in backend/app/main.py
- [x] T014 [P] Configure mypy for type checking in mypy.ini or pyproject.toml
- [x] T015 [P] Configure pytest in pytest.ini with test discovery patterns

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Basic Cut Optimization (Priority: P1) 🎯 MVP

**Goal**: Enter stock sheets and required cuts, run optimization, receive cutting plan showing which cuts come from which sheets

**Independent Test**: Enter 2-3 stock sheets and 5-10 required cuts, verify system produces a cutting plan that uses fewer sheets than naive approach and displays which cuts come from which sheets

### Implementation for User Story 1

#### Database Models

- [x] T016 [P] [US1] Create StockSheet model in backend/app/models/stock_sheet.py (id, width, length, thickness, label, priority, created_at)
- [x] T017 [P] [US1] Create RequiredCut model in backend/app/models/required_cut.py (id, width, length, thickness, label, quantity, created_at)
- [x] T018 [P] [US1] Create CuttingPlan model in backend/app/models/cutting_plan.py (id, created_at, total_waste, kerf_width, sheets_used)
- [x] T019 [P] [US1] Create PlanAssignment model in backend/app/models/plan_assignment.py (id, plan_id, sheet_id, cut_id, x_position, y_position, rotation, sequence_number, waste_area)
- [x] T020 [US1] Create Alembic migration for initial schema in backend/migrations/versions/001_initial_schema.py

#### Pydantic Schemas

- [x] T021 [P] [US1] Create StockSheet schemas in backend/app/schemas/stock.py (StockSheetCreate, StockSheetUpdate, StockSheetResponse)
- [x] T022 [P] [US1] Create RequiredCut schemas in backend/app/schemas/cut.py (RequiredCutCreate, RequiredCutUpdate, RequiredCutResponse)
- [x] T023 [P] [US1] Create CuttingPlan schemas in backend/app/schemas/plan.py (OptimizeRequest, CuttingPlanResponse, PlanAssignmentResponse)

#### Core Optimization Algorithm

- [x] T024 [US1] Implement Guillotine bin packing data structures in backend/app/services/optimizer.py (Rectangle class, PartitionNode class)
- [x] T025 [US1] Implement First-Fit Decreasing sort in backend/app/services/optimizer.py (sort_cuts_by_area function)
- [x] T026 [US1] Implement guillotine partitioning logic in backend/app/services/optimizer.py (partition_sheet function with kerf offset)
- [x] T027 [US1] Implement thickness matching filter in backend/app/services/optimizer.py (filter_compatible_sheets function)
- [x] T028 [US1] Implement main optimization algorithm in backend/app/services/optimizer.py (optimize_cutting_plan function)
- [x] T029 [US1] Add priority-based sheet selection in backend/app/services/optimizer.py (sort sheets by priority: high > normal > low)

#### API Endpoints

- [x] T030 [P] [US1] Implement GET /api/v1/stock endpoint in backend/app/api/stock.py (list all stock sheets)
- [x] T031 [P] [US1] Implement POST /api/v1/stock endpoint in backend/app/api/stock.py (create stock sheet with validation)
- [x] T032 [P] [US1] Implement PUT /api/v1/stock/{id} endpoint in backend/app/api/stock.py (update stock sheet)
- [x] T033 [P] [US1] Implement DELETE /api/v1/stock/{id} endpoint in backend/app/api/stock.py (delete stock sheet)
- [x] T034 [P] [US1] Implement GET /api/v1/cuts endpoint in backend/app/api/cuts.py (list all required cuts)
- [x] T035 [P] [US1] Implement POST /api/v1/cuts endpoint in backend/app/api/cuts.py (create required cut with validation)
- [x] T036 [P] [US1] Implement PUT /api/v1/cuts/{id} endpoint in backend/app/api/cuts.py (update required cut)
- [x] T037 [P] [US1] Implement DELETE /api/v1/cuts/{id} endpoint in backend/app/api/cuts.py (delete required cut)
- [x] T038 [US1] Implement POST /api/v1/plans/optimize endpoint in backend/app/api/plans.py (run optimization algorithm)
- [x] T039 [US1] Implement GET /api/v1/plans/{id} endpoint in backend/app/api/plans.py (retrieve cutting plan with assignments)

#### Frontend UI

- [x] T040 [US1] Create stock sheet entry form in frontend/static/index.html (width, length, thickness, label, priority fields)
- [x] T041 [US1] Create required cuts entry form in frontend/static/index.html (width, length, thickness, label, quantity fields)
- [x] T042 [US1] Create kerf width configuration input in frontend/static/index.html (default 3mm, range 0-10mm)
- [x] T043 [US1] Implement stock sheet API integration in frontend/static/js/app.js (add, edit, delete, list stock sheets)
- [x] T044 [US1] Implement required cuts API integration in frontend/static/js/app.js (add, edit, delete, list cuts)
- [x] T045 [US1] Implement optimize button handler in frontend/static/js/app.js (POST to /plans/optimize with kerf_width)
- [x] T046 [US1] Create cutting plan results display in frontend/static/index.html (sheets used, total waste, utilization percentage)
- [x] T047 [US1] Create assignment list view in frontend/static/index.html (which cuts on which sheets, grouped by sheet)
- [x] T048 [US1] Style forms and results with LCARS theme in frontend/static/css/lcars-theme.css (pill buttons, panels, borders)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Visual Cutting Diagrams (Priority: P2)

**Goal**: View visual diagrams showing exactly where each cut should be made on each stock sheet with labeled rectangles and dimensions

**Independent Test**: Generate a cutting plan, view the visual diagram, verify all cut pieces are shown positioned on the stock sheet with labels and dimensions

### Implementation for User Story 2

- [x] T049 [P] [US2] Create SVG diagram renderer skeleton in frontend/static/js/diagram.js (createSvgElement, setAttributes functions)
- [x] T050 [US2] Implement stock sheet rectangle rendering in frontend/static/js/diagram.js (draw outer boundary with dimensions)
- [x] T051 [US2] Implement cut piece rectangle rendering in frontend/static/js/diagram.js (draw positioned rectangles with labels)
- [x] T052 [US2] Add dimension annotations in frontend/static/js/diagram.js (width/length labels on each cut piece)
- [x] T053 [US2] Implement rotation visualization in frontend/static/js/diagram.js (show 90° rotated cuts correctly)
- [x] T054 [US2] Add sequence number badges in frontend/static/js/diagram.js (numbered circles showing cut order)
- [x] T055 [US2] Create diagram container in frontend/static/index.html (SVG viewport with zoom/pan controls)
- [x] T056 [US2] Implement responsive diagram scaling in frontend/static/js/diagram.js (scale to viewport width, maintain aspect ratio)
- [x] T057 [US2] Style diagram with LCARS colors in frontend/static/css/lcars-theme.css (stock sheets blue, cuts orange, labels white)
- [x] T058 [US2] Add diagram rendering to cutting plan results in frontend/static/js/app.js (call diagram.js when plan loaded)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Print-Ready Cut Lists (Priority: P3)

**Goal**: Export cutting plan to A4-formatted pages, one cut instruction per page with dimensions and diagrams

**Independent Test**: Generate a cutting plan, select print export, verify each cut appears on its own A4 page with dimensions, source sheet, and diagram

### Implementation for User Story 3

- [x] T059 [US3] Implement GET /api/v1/plans/{id}/export/print endpoint in backend/app/api/plans.py (generate print HTML)
- [x] T060 [US3] Create print template generator in backend/app/services/print_template.py (generate HTML with one cut per page)
- [x] T061 [P] [US3] Create CSS @media print rules in frontend/static/css/lcars-theme.css (A4 210mm×297mm, page breaks, print-friendly colors)
- [x] T062 [P] [US3] Create print layout template in frontend/static/js/print.js (generatePrintPage function)
- [x] T063 [US3] Add print-optimized diagram rendering in frontend/static/js/diagram.js (larger diagrams, thicker lines for print)
- [x] T064 [US3] Implement print view activation in frontend/static/js/app.js (switch to print layout on button click)
- [x] T065 [US3] Add print button to cutting plan results in frontend/static/index.html (triggers browser print dialog)
- [x] T066 [US3] Style print pages with clear typography in frontend/static/css/lcars-theme.css (14-16pt fonts, high contrast)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Stock Sheet Prioritization (Priority: P4)

**Goal**: Mark stock sheets with priority levels (high/normal/low), optimizer respects priorities when selecting sheets

**Independent Test**: Enter 3 identical stock sheets with different priorities, run optimization, verify high-priority sheet is used first

### Implementation for User Story 4

- [x] T067 [US4] Update priority-based sorting in backend/app/services/optimizer.py (sort_sheets_by_priority function: high > normal > low)
- [x] T068 [US4] Add priority dropdown to stock sheet form in frontend/static/index.html (High, Normal, Low options)
- [x] T069 [US4] Update stock sheet list to display priority in frontend/static/js/app.js (show priority badge with color coding)
- [x] T070 [US4] Add priority change handler in frontend/static/js/app.js (re-optimize when priority changed)
- [x] T071 [US4] Style priority badges in frontend/static/css/lcars-theme.css (high=orange, normal=blue, low=gray)

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---

## Phase 7: User Story 5 - Mobile-Friendly Access (Priority: P5)

**Goal**: Access application on mobile devices with responsive layout, touch-friendly controls, and readable diagrams

**Independent Test**: Access on mobile device, navigate through stock entry, cut entry, optimization, verify all controls are tappable and diagrams are readable

### Implementation for User Story 5

- [x] T072 [P] [US5] Add responsive breakpoints to Tailwind config in frontend/tailwind.config.js (sm: 375px, md: 768px, lg: 1024px)
- [x] T073 [P] [US5] Implement mobile navigation in frontend/static/index.html (hamburger menu, collapsible sections)
- [x] T074 [US5] Add touch-friendly input controls in frontend/static/css/lcars-theme.css (44px minimum touch targets)
- [x] T075 [US5] Implement mobile-optimized diagram rendering in frontend/static/js/diagram.js (pinch-to-zoom, pan gestures)
- [x] T076 [US5] Add viewport meta tag to frontend/static/index.html (width=device-width, initial-scale=1)
- [x] T077 [US5] Create mobile-specific LCARS styling in frontend/static/css/lcars-theme.css (simplified borders, smaller fonts)
- [x] T078 [US5] Implement orientation change handling in frontend/static/js/app.js (re-layout on portrait/landscape switch)

**Checkpoint**: All user stories should now be independently functional across mobile and desktop

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T079 [P] Add error handling middleware in backend/app/main.py (catch validation errors, database errors, return consistent error format)
- [x] T080 [P] Implement session storage persistence in frontend/static/js/app.js (save stock sheets and cuts to localStorage)
- [x] T081 [P] Add loading indicators in frontend/static/index.html (spinner during optimization)
- [x] T082 [P] Add success/error toast notifications in frontend/static/js/app.js (feedback for add/edit/delete operations)
- [x] T083 [P] Create empty state messages in frontend/static/index.html (guide users when no stock or cuts entered)
- [x] T084 Code cleanup and remove unused imports across all backend files
- [x] T085 Add docstrings to all functions in backend/app/services/optimizer.py
- [x] T086 [P] Update README.md with LCARS theme customization instructions

### Constitution Quality Gates

*Before release, verify compliance with constitution requirements:*

- [x] T087 Cross-browser testing on Chrome, Firefox, Safari (desktop and mobile)
- [x] T088 Accessibility audit with keyboard navigation and screen reader testing
- [x] T089 Performance validation - optimization completes in <5s for 10 cuts
- [x] T090 Mobile device testing on iOS Safari and Android Chrome (touch targets, responsive layout)
- [x] T091 Print testing - verify A4 pages format correctly in Chrome, Firefox, Safari print dialogs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational - Integrates with US1 results but independently testable
- **User Story 3 (P3)**: Can start after Foundational - Uses US1 cutting plan data but independently testable
- **User Story 4 (P4)**: Can start after Foundational - Extends US1 optimizer but independently testable
- **User Story 5 (P5)**: Can start after Foundational - Makes all stories mobile-friendly, can be tested independently

### Within Each User Story

- Models before services (database must exist before logic uses it)
- Services before API endpoints (business logic before routes)
- API endpoints before frontend integration (backend before UI)
- Core implementation before integration with other stories

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Within each user story, all tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all database models together (if team has 4+ people):
Task: "Create StockSheet model in backend/app/models/stock_sheet.py"
Task: "Create RequiredCut model in backend/app/models/required_cut.py"
Task: "Create CuttingPlan model in backend/app/models/cutting_plan.py"
Task: "Create PlanAssignment model in backend/app/models/plan_assignment.py"

# Launch all Pydantic schemas together:
Task: "Create StockSheet schemas in backend/app/schemas/stock.py"
Task: "Create RequiredCut schemas in backend/app/schemas/cut.py"
Task: "Create CuttingPlan schemas in backend/app/schemas/plan.py"

# Launch all GET/POST/PUT/DELETE endpoints together (stock and cuts are independent):
Task: "Implement GET /api/v1/stock endpoint in backend/app/api/stock.py"
Task: "Implement POST /api/v1/stock endpoint in backend/app/api/stock.py"
Task: "Implement GET /api/v1/cuts endpoint in backend/app/api/cuts.py"
Task: "Implement POST /api/v1/cuts endpoint in backend/app/api/cuts.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

**This gives you a working cutting optimizer in minimal time!**

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP! 🎯)
3. Add User Story 2 → Test independently → Deploy/Demo (Now with diagrams!)
4. Add User Story 3 → Test independently → Deploy/Demo (Print support!)
5. Add User Story 4 → Test independently → Deploy/Demo (Priority support!)
6. Add User Story 5 → Test independently → Deploy/Demo (Mobile ready!)
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (P1 - MVP core)
   - Developer B: User Story 2 (P2 - diagrams)
   - Developer C: User Story 4 (P4 - prioritization, simpler than US3)
   - Developer D: User Story 5 (P5 - mobile responsive)
3. Developer A finishes first (P1 is critical path), then picks up US3
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies - safe to parallelize
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Stop at any checkpoint to validate story independently
- Commit after each task or logical group
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- LCARS theme implementation is spread across multiple stories (foundational base, then per-story refinement)
- Optimization algorithm is the most complex component - all in User Story 1 (MVP)

---

## Task Count Summary

- **Phase 1 (Setup)**: 7 tasks
- **Phase 2 (Foundational)**: 8 tasks  
- **Phase 3 (US1 - Basic Cut Optimization)**: 33 tasks 🎯 MVP
- **Phase 4 (US2 - Visual Cutting Diagrams)**: 10 tasks
- **Phase 5 (US3 - Print-Ready Cut Lists)**: 8 tasks
- **Phase 6 (US4 - Stock Sheet Prioritization)**: 5 tasks
- **Phase 7 (US5 - Mobile-Friendly Access)**: 7 tasks
- **Phase 8 (Polish)**: 13 tasks

**Total**: 91 tasks

**Parallel opportunities**: 43 tasks marked [P] can be executed in parallel within their phase
