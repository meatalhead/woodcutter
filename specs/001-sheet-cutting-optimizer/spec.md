# Feature Specification: Sheet Cutting Optimizer

**Feature Branch**: `001-sheet-cutting-optimizer`  
**Created**: 2026-02-14  
**Last Updated**: 2026-02-20  
**Status**: In Progress  
**Input**: User description: "Build an application that can help me cut wood down to size based on source sheets. It should allow for entry of stock sheets and their dimensions (width, length and thickness). It should allow for entry of required cuts of the wood (width, length and thickness). It allow me to specify label for both stock sheets and resulting cut sheets. Analyze the required cut sizes of wood against the available stock sheets, to use the least number of sheets. I want to be able to get the most use out of the stock sheets. Allow for certain stock sheets to be prioritised for use. Recommend the cutting pattern required on the stock sheets to achive the cut sizes of wood in the least number of cuts, and display in the correct order. Allow the output to be on a browser and mobile friendly web page, or printed on A4 sheets, with one cut size per sheet. Show a pictural of the stock sheets, with the cut size overlays. Use metric measurements. Allow users to save and export cutting lists for later use and sharing."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Basic Cut Optimization (Priority: P1)

A woodworker needs to determine how to cut required pieces from available stock sheets with minimal waste. They enter their available stock sheets (dimensions and labels), enter the pieces they need to cut (dimensions and labels), and receive an optimized cutting plan showing which pieces to cut from which sheets.

**Why this priority**: This is the core value proposition - without optimization, the application has no purpose. This delivers immediate, measurable value (waste reduction) and can be used standalone.

**Independent Test**: Can be fully tested by entering 2-3 stock sheets and 5-10 required cuts, then verifying that the system produces a cutting plan that uses fewer sheets than a naive approach and displays which cuts come from which sheets.

**Acceptance Scenarios**:

1. **Given** I have 3 stock sheets (2400mm × 1200mm × 18mm) and need 6 pieces (800mm × 400mm × 18mm), **When** I run the optimization, **Then** the system shows I can cut all pieces from 1 sheet instead of using multiple sheets
2. **Given** I have entered stock sheets and required cuts with different thicknesses, **When** I run optimization, **Then** the system only matches cuts to sheets with compatible thickness
3. **Given** I have stock sheets of varying sizes, **When** I optimize a cut list, **Then** the system prioritizes using smaller sheets first to preserve larger sheets for future use (unless priority override is set)
4. **Given** I need 10 pieces but only have enough stock for 7, **When** I run optimization, **Then** the system places the 7 that fit (best effort) and shows the remaining 3 in an "Unplaced Cuts" section with reasons
5. **Given** I need a cut with thickness 25mm but only have 18mm stock sheets, **When** I run optimization, **Then** that cut appears in "Unplaced Cuts" with reason "no stock sheet with matching thickness"
6. **Given** I have a stock sheet with quantity 5, **When** I run optimization requiring 3 identical sheets, **Then** the optimizer uses 3 instances of that stock sheet and reports 2 remaining

---

### User Story 2 - Visual Cutting Diagrams (Priority: P2)

After receiving an optimized cutting plan, the user views visual diagrams showing exactly where each cut should be made on each stock sheet. The diagrams show the stock sheet with labeled rectangles representing each cut piece, positioned to minimize waste.

**Why this priority**: Visual diagrams dramatically reduce execution errors. Users can take these diagrams to the workshop and cut with confidence. Without this, the optimization is just numbers.

**Independent Test**: Can be tested by generating a cutting plan, then viewing the visual diagram and verifying that all cut pieces are shown positioned on the stock sheet, labeled correctly, and the layout matches the optimization results.

**Acceptance Scenarios**:

1. **Given** an optimized cutting plan exists, **When** I view the cutting diagram for a sheet, **Then** I see all cut pieces as labeled rectangles positioned on the sheet with dimensions shown
2. **Given** multiple cuts on a single sheet, **When** viewing the diagram, **Then** cuts are arranged to minimize waste and pieces do not overlap
3. **Given** I need to cut pieces in a specific order, **When** viewing the diagram, **Then** cuts are numbered in the recommended sequence to minimize blade repositioning

---

### User Story 3 - Print-Ready Cut Lists (Priority: P3)

The user exports the cutting plan and diagrams to a printer-friendly format, with one cut instruction per A4 page, suitable for taking to the workshop. Each page shows the cut dimensions, source sheet, and a clear diagram.

**Why this priority**: Workshop environments aren't always digital-friendly. Printed instructions that can be marked up, get dusty, or be referenced without a device are essential for practical use.

**Independent Test**: Can be tested by generating a cutting plan, selecting print export, and verifying that each required cut appears on its own A4 page with all necessary information (dimensions, source sheet, diagram) formatted for printing.

**Acceptance Scenarios**:

1. **Given** an optimized cutting plan with 8 required cuts, **When** I select print format, **Then** I receive 8 A4 pages, one per cut, each showing the cut dimensions, source sheet label, and position on sheet
2. **Given** I select print export, **When** the pages are generated, **Then** diagrams are sized appropriately for A4 and text is legible when printed
3. **Given** I have a cutting plan, **When** I print to A4, **Then** measurements are clearly displayed in metric (millimeters) with proper units

---

### User Story 4 - Stock Sheet Prioritization (Priority: P4)

When the user has multiple stock sheets that could fulfill the same cuts, they can mark certain sheets as "use first" (e.g., offcuts or damaged sheets they want to consume) or "preserve" (e.g., premium materials). The optimizer respects these priorities when generating the cutting plan.

**Why this priority**: Experienced woodworkers have workflow preferences - using up partial sheets before opening new ones, preserving expensive materials for visible pieces. This makes the tool adaptable to real-world practices.

**Independent Test**: Can be tested by entering 3 identical stock sheets, marking one as "high priority" and one as "low priority", running optimization, and verifying that the high-priority sheet is used first.

**Acceptance Scenarios**:

1. **Given** I have 3 identical stock sheets with different priority levels (high, normal, low), **When** I optimize cuts that require 2 sheets, **Then** the high-priority sheet is used first, followed by the normal-priority sheet
2. **Given** I mark a sheet as "preserve", **When** optimization runs, **Then** that sheet is only used if no other sheets can fulfill the remaining cuts
3. **Given** I change a sheet's priority after optimization, **When** I re-run optimization, **Then** the cutting plan updates to reflect the new priority

---

### User Story 5 - Save and Export Cutting Plans (Priority: P5)

After creating an optimized cutting plan, the user can save it for future reference and export it in various formats for different use cases. They can save projects to work on later, export cutting lists as spreadsheets for ordering materials, or share plans with others.

**Why this priority**: Real projects span multiple sessions. Users need to save work-in-progress, reuse plans for repeated jobs, and share cutting lists with suppliers or colleagues. Export formats enable integration with other tools and workflows.

**Independent Test**: Can be tested by creating a cutting plan, saving it with a name, closing the browser, reopening the application, loading the saved plan, and verifying all data (stock sheets, cuts, optimization results) is preserved. Export can be tested by downloading files and verifying they contain complete cutting information.

**Acceptance Scenarios**:

1. **Given** I have created an optimized cutting plan, **When** I save it with a project name, **Then** I can load that plan later and see all stock sheets, cuts, and optimization results exactly as I left them
2. **Given** I have multiple saved projects, **When** I view my saved projects list, **Then** I see each project with its name, creation date, and summary (number of sheets, number of cuts)
3. **Given** I have an optimized cutting plan, **When** I export as a spreadsheet, **Then** I receive a file containing all cuts with their dimensions, source sheets, and positions in a tabular format
4. **Given** I have a cutting plan, **When** I export as a complete data file, **Then** I receive a file containing all project data (stock sheets, cuts, optimization results) that can be imported back into the application
5. **Given** I have saved projects, **When** I delete a saved project, **Then** it is removed from my projects list and storage is freed

---

### User Story 6 - Mobile-Friendly Access (Priority: P6)

The user accesses the cutting optimizer from a mobile device (phone or tablet) in the workshop. The interface adapts to the smaller screen, allowing them to view cutting diagrams, check dimensions, and mark cuts as complete while standing at the saw.

**Why this priority**: Workshops are dynamic environments. Mobile access allows the user to reference the plan at the cutting station without printing or using a laptop in a dusty environment.

**Independent Test**: Can be tested by accessing the application on a mobile device, entering a cutting plan, and verifying that all controls are usable with touch, diagrams are readable, and the workflow is functional on a small screen.

**Acceptance Scenarios**:

1. **Given** I access the application on a mobile device, **When** I navigate through stock entry, cut entry, and optimization, **Then** all input fields and buttons are easily tappable (minimum 44px touch targets)
2. **Given** I view a cutting diagram on mobile, **When** I zoom or pan the diagram, **Then** labels and dimensions remain legible
3. **Given** I have a cutting plan open on mobile, **When** I rotate my device, **Then** the layout adapts appropriately to portrait or landscape orientation

---

### Edge Cases

- What happens when required cuts cannot fit on any available stock sheets (dimensions too large)?
- How does the system handle cuts where the grain direction matters (length vs width orientation)?
- What happens when total required area exceeds total available stock area?
- How does the system handle very thin kerf/blade width in calculations (saw blade removes material)?
- What happens when a user enters identical stock sheets with different labels?
- How does the system handle stock sheets or cuts with zero thickness (material like veneer or paper)?
- What happens when optimizing a large number of cuts (100+) takes significant processing time?
- How does the system handle fractional millimeter measurements (e.g., 1200.5mm)?
- What happens when a user tries to save a project with a name that already exists?
- How does the system handle importing a file that was created with an older version of the application?
- What happens when browser storage is full and the user tries to save a project?
- How does the system handle exporting very large cutting plans (100+ sheets) that may create large files?
- What happens when a cut requires a thickness that doesn't exist in any stock sheet? (System should flag and show in unplaced cuts with "no matching thickness" reason)
- What happens when all stock sheets of a given thickness are fully consumed but more cuts of that thickness remain? (System should perform best-effort and report remaining)
- What happens when stock sheet quantity is set to a high number (e.g., 100) — does the optimizer efficiently reuse sheet definitions?
- What happens when the user changes waste units mid-session — do all displayed waste values update immediately?
- What happens when localStorage is full and the user tries to store unused sheets?
- What happens when stored sheets from a previous project have the same label as newly added sheets?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to add stock sheets with dimensions (width, length, thickness in millimeters), custom labels, and quantity (number of identical sheets available)
- **FR-002**: System MUST allow users to add required cuts with dimensions (width, length, thickness in millimeters) and custom labels
- **FR-003**: System MUST validate that stock sheet dimensions are positive numbers greater than zero
- **FR-004**: System MUST validate that required cut dimensions are positive numbers greater than zero
- **FR-005**: System MUST match cuts only to stock sheets with identical thickness values
- **FR-006**: System MUST calculate an optimized cutting plan that minimizes the number of stock sheets used
- **FR-007**: System MUST display which cuts are assigned to which stock sheets in the cutting plan
- **FR-008**: System MUST show the total number of stock sheets required and the number remaining unused
- **FR-009**: System MUST allow users to assign priority levels to stock sheets (high, normal, low)
- **FR-010**: System MUST respect stock sheet priority when multiple sheets could fulfill the same cuts
- **FR-011**: System MUST generate visual diagrams showing cut piece positions on each stock sheet
- **FR-012**: System MUST label each cut piece on the diagram with its custom label
- **FR-013**: System MUST show dimensions on the cutting diagram for both stock sheets and cut pieces
- **FR-014**: System MUST recommend the cutting sequence (order of cuts) to minimize blade repositioning
- **FR-015**: System MUST display cutting diagrams numbered in the recommended cutting order
- **FR-016**: System MUST provide a print-friendly export format with one cut per A4 page
- **FR-017**: System MUST display all measurements in metric units (millimeters)
- **FR-018**: System MUST allow users to edit or remove stock sheets before optimization
- **FR-019**: System MUST allow users to edit or remove required cuts before optimization
- **FR-020**: System MUST allow users to save cutting plans with a project name for later retrieval
- **FR-021**: System MUST allow users to load previously saved cutting plans with all data intact (stock sheets, cuts, optimization results)
- **FR-022**: System MUST display a list of saved projects showing project name, creation date, last modified date, and summary statistics (sheet count, cut count)
- **FR-023**: System MUST allow users to delete saved projects
- **FR-024**: System MUST prevent duplicate project names by prompting user to rename or overwrite when saving with an existing name
- **FR-025**: System MUST allow users to export cutting plans as spreadsheet files containing all cuts with dimensions, labels, source sheets, and positions
- **FR-026**: System MUST allow users to export complete project data in a format that can be re-imported into the application
- **FR-027**: System MUST allow users to import previously exported project files
- **FR-028**: System MUST validate imported files and display clear error messages for invalid or corrupted data
- **FR-029**: System MUST warn users before overwriting unsaved changes when loading a different project
- **FR-030**: System MUST clearly indicate when cuts cannot fit on available stock (dimension mismatch, insufficient quantity, or no matching thickness) and continue with best-effort placement of remaining cuts
- **FR-031**: System MUST track which stock sheets were not used (or have remaining quantity) after optimization and display them as "Unused Stock"
- **FR-032**: System MUST allow users to re-run optimization after changing priorities or adding/removing items
- **FR-033**: System MUST prevent overlapping cuts in the visual diagram
- **FR-034**: System MUST allow users to configure blade kerf width (material removed by saw blade) with a reasonable default of 3mm
- **FR-035**: System MUST apply the configured kerf value when calculating cut positions to ensure pieces fit on stock sheets after accounting for material loss
- **FR-036**: System MUST perform best-effort optimization when not all cuts can be placed — place as many cuts as possible and clearly report which cuts remain unplaced
- **FR-037**: System MUST display unplaced cuts in a distinct "Unplaced Cuts" section after optimization results, showing each unplaced cut's label, dimensions, and the reason it could not be placed (e.g., "no stock sheet with matching thickness", "insufficient space on available sheets")
- **FR-038**: System MUST allow the required cut thickness field to be a dropdown limited to thicknesses available in the current stock sheet inventory, with fallback to free-form entry when no stock sheets exist
- **FR-039**: System MUST provide a "New Project" function that clears all required cuts and used stock sheets, but retains any stock sheets marked as "in storage" from previous optimizations
- **FR-040**: System MUST allow users to mark unused stock sheets as "in storage" after optimization, persisting them in browser localStorage
- **FR-041**: System MUST automatically load stored stock sheets when starting a new project, so leftover materials carry over between projects
- **FR-042**: System MUST render visual cutting diagrams with a zoomed viewport focused on the actual cut area when cuts occupy a small portion of the sheet, with a "(zoomed to cut area)" indicator
- **FR-043**: System MUST use non-overlapping callout labels for small cuts in visual diagrams, with elbow connector lines from the cut to a label gutter
- **FR-044**: System MUST allow users to specify quantity for stock sheets (e.g., "3 sheets of 2440×1220×18mm") to represent multiple identical sheets available for cutting

### Key Entities

- **Stock Sheet**: Represents available material to cut from. Attributes: width (mm), length (mm), thickness (mm), label (text), quantity (number of identical sheets), priority (high/normal/low), unique identifier
- **Required Cut**: Represents a piece that needs to be cut. Attributes: width (mm), length (mm), thickness (mm), label (text), quantity (number), unique identifier
- **Cutting Plan**: The optimized solution showing which cuts are assigned to which stock sheets. Attributes: list of sheet assignments, total sheets used, total waste, unplaced cuts list, timestamp
- **Sheet Assignment**: Maps a stock sheet to the cuts allocated to it. Attributes: stock sheet reference, list of positioned cuts, remaining waste area, cutting sequence
- **Positioned Cut**: A required cut with its calculated position on a stock sheet. Attributes: cut reference, x-coordinate, y-coordinate, rotation (0° or 90°), sequence number
- **Unplaced Cut**: A required cut that could not be placed on any available stock sheet. Attributes: cut reference, reason (no matching thickness / insufficient space)
- **Saved Project**: A persisted cutting plan that can be loaded later. Attributes: project name, creation date, last modified date, complete cutting plan data (stock sheets, cuts, optimization results), blade kerf setting, unique identifier

### Non-Functional Requirements *(Constitution-driven)*

**Code Quality**:

- **NFR-001**: Code MUST have type safety through strict TypeScript or equivalent type system
- **NFR-002**: Optimization algorithm MUST have unit tests verifying correct sheet minimization

**UX Consistency**:

- **NFR-003**: UI MUST follow a professional, modern design system using Tailwind CSS utility classes with clean visual hierarchy, white/light background, and polished aesthetics suitable for business/professional use
- **NFR-004**: UI MUST use professional Tailwind component styling (cards, badges, modals, form controls) with consistent spacing, typography, and a blue/green/slate color palette appropriate for a production tool
- **NFR-005**: Accessibility MUST meet WCAG 2.1 AA standards (keyboard navigation, screen reader support, sufficient contrast)
- **NFR-006**: Error states MUST provide actionable feedback (e.g., "Cut 450mm × 300mm exceeds stock sheet 400mm × 200mm - increase stock size or reduce cut dimensions")

**Cross-Platform Parity**:

- **NFR-007**: Feature MUST work on mobile browsers (iOS Safari, Android Chrome) and desktop browsers (Chrome, Firefox, Safari)
- **NFR-008**: Mobile performance MUST achieve initial load under 3 seconds on 3G connection
- **NFR-009**: Touch targets MUST be minimum 44px for all interactive elements (buttons, input fields)
- **NFR-010**: Cutting diagrams MUST be legible and interactive on screens from 375px (mobile) to 1920px+ (desktop)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can enter 5 stock sheets and 10 required cuts, run optimization, and receive a cutting plan in under 5 seconds
- **SC-002**: Optimized cutting plans use at least 20% fewer stock sheets compared to a simple first-fit approach on typical woodworking projects (verified with test scenarios)
- **SC-003**: Users can view cutting diagrams on mobile devices and accurately identify which piece to cut from which sheet without zooming
- **SC-004**: Printed A4 cutting instructions are legible and complete - 95% of users can execute cuts without referring back to the digital version
- **SC-005**: Users can complete the entire workflow (enter materials, optimize, view plan) in under 10 minutes for a typical project (10-15 cuts)
- **SC-006**: The cutting plan correctly accounts for material thickness - zero instances of suggesting incompatible thickness matches
- **SC-007**: Visual diagrams accurately represent the cutting layout - users can verify that all cuts fit on the sheet without overlaps by visual inspection
- **SC-008**: Users can save a cutting plan and reload it with 100% data integrity - all stock sheets, cuts, labels, priorities, and optimization results are preserved exactly
- **SC-009**: Users can export a cutting plan and receive a downloadable file in under 2 seconds for plans with up to 50 cuts
- **SC-010**: Exported spreadsheet files contain all necessary information for material ordering - users can send to suppliers without additional manual compilation

### Assumptions

- Users have basic familiarity with woodworking terminology (stock, cuts, dimensions)
- Users will measure materials accurately before entering dimensions
- Stock sheets are rectangular (not irregular shapes)
- Cuts are rectangular (not curved or angled cuts)
- Users will use standard metric measurements (millimeters)
- Blade kerf is user-configurable with a 3mm default (typical table saw kerf width)
- Kerf configuration range of 1-10mm covers most common woodworking tools (from fine blades to rough-cut saws)
- "Minimize cuts" refers to minimizing blade repositioning, not the number of individual cuts
- Priority levels (high/normal/low) are sufficient granularity for most users
- Persistent storage uses browser local storage for saved projects (with appropriate storage limits and user notification when approaching limits)
- Spreadsheet export format is CSV (comma-separated values) for maximum compatibility with Excel, Google Sheets, and other tools
- Complete project export format is JSON for data portability and re-import capability
- Users understand that saved projects are stored locally in their browser and not synchronized across devices (cloud sync can be a future enhancement)
- Import/export file size limits of 10MB are sufficient for typical woodworking projects (up to 500 cuts)
- Optimization algorithm does not need to find the absolute optimal solution (NP-hard problem) - a good heuristic solution within reasonable time is acceptable
- Rotation is limited to 0° and 90° (no arbitrary angles)
- Stock sheet quantity represents identical sheets of the same material — the optimizer treats each as a separate sheet for packing purposes
- When the optimizer cannot place all cuts, it performs best-effort placement (largest area first) and returns remaining cuts rather than failing entirely
- Waste unit conversion is a display-only concern (internal calculations always use mm²)
