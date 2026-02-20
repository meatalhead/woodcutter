/**
 * Print layout generation for cutting instructions
 * Generates A4-formatted pages with one cut per page
 */

/**
 * Generate a single print page for a cut assignment
 * @param {Object} assignment - Cut assignment data
 * @param {number} pageNum - Page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} kerfWidth - Blade kerf width in mm
 * @returns {HTMLElement} Print page element
 */
function generatePrintPage(assignment, pageNum, totalPages, kerfWidth) {
  const page = document.createElement('div');
  page.className = 'print-page';
  
  // Header section
  const header = document.createElement('div');
  header.className = 'print-header';
  
  const cutNumber = document.createElement('div');
  cutNumber.className = 'print-cut-number';
  cutNumber.textContent = `Cut #${assignment.sequence_number || pageNum} of ${totalPages}`;
  
  const cutLabel = document.createElement('div');
  cutLabel.className = 'print-cut-label';
  cutLabel.textContent = assignment.cut_label || `Cut ${pageNum}`;
  
  header.appendChild(cutNumber);
  header.appendChild(cutLabel);
  page.appendChild(header);
  
  // Dimensions section
  const dimensions = document.createElement('div');
  dimensions.className = 'print-dimensions';
  dimensions.innerHTML = `<strong>Dimensions:</strong> ${assignment.cut_width}mm × ${assignment.cut_length}mm × ${assignment.cut_thickness}mm`;
  page.appendChild(dimensions);
  
  // Sheet info section
  const sheetInfo = document.createElement('div');
  sheetInfo.className = 'print-sheet-info';
  sheetInfo.innerHTML = `<strong>Source Sheet:</strong> ${assignment.sheet_label} (${assignment.sheet_width}mm × ${assignment.sheet_length}mm)`;
  page.appendChild(sheetInfo);
  
  // Position info
  const positionInfo = document.createElement('div');
  positionInfo.className = 'print-sheet-info';
  const rotationText = assignment.rotation === 90 ? ' (Rotated 90°)' : '';
  positionInfo.innerHTML = `<strong>Position:</strong> X=${assignment.x_position}mm, Y=${assignment.y_position}mm${rotationText}`;
  page.appendChild(positionInfo);
  
  // Diagram section
  const diagramContainer = document.createElement('div');
  diagramContainer.className = 'print-diagram';
  
  const diagram = generatePrintDiagram(
    assignment.sheet_width,
    assignment.sheet_length,
    assignment.cut_width,
    assignment.cut_length,
    assignment.x_position,
    assignment.y_position,
    assignment.rotation || 0
  );
  diagramContainer.appendChild(diagram);
  page.appendChild(diagramContainer);
  
  // Instructions section
  const instructions = document.createElement('div');
  instructions.className = 'print-instructions';
  instructions.innerHTML = `
    <strong>Cutting Instructions:</strong><br>
    1. Locate the ${assignment.sheet_label}<br>
    2. Measure ${assignment.x_position}mm from the left edge and ${assignment.y_position}mm from the top edge<br>
    3. Mark the cutting area: ${assignment.cut_width}mm × ${assignment.cut_length}mm<br>
    4. Account for ${kerfWidth}mm blade kerf when cutting<br>
    5. Label the cut piece as "${assignment.cut_label}" after cutting
  `;
  page.appendChild(instructions);
  
  return page;
}

/**
 * Generate SVG diagram for print showing cut position on sheet
 * @param {number} sheetW - Sheet width in mm
 * @param {number} sheetL - Sheet length in mm
 * @param {number} cutW - Cut width in mm
 * @param {number} cutL - Cut length in mm
 * @param {number} x - X position in mm
 * @param {number} y - Y position in mm
 * @param {number} rotation - Rotation angle (0 or 90)
 * @returns {SVGElement} SVG diagram
 */
function generatePrintDiagram(sheetW, sheetL, cutW, cutL, x, y, rotation) {
  // Scale to fit print page (max 170mm width for A4 with margins)
  const maxWidth = 170;
  const scale = Math.min(maxWidth / sheetW, 150 / sheetL);
  
  const svgW = sheetW * scale;
  const svgL = sheetL * scale;
  let cutSvgW = cutW * scale;
  let cutSvgL = cutL * scale;
  const xSvg = x * scale;
  const ySvg = y * scale;
  
  // Swap cut dimensions if rotated
  if (rotation === 90) {
    [cutSvgW, cutSvgL] = [cutSvgL, cutSvgW];
  }
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', `${svgW}mm`);
  svg.setAttribute('height', `${svgL}mm`);
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgL}`);
  svg.setAttribute('style', 'border: 2px solid #333; background: white;');
  
  // Stock sheet outline
  const sheetRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  sheetRect.setAttribute('x', '0');
  sheetRect.setAttribute('y', '0');
  sheetRect.setAttribute('width', svgW);
  sheetRect.setAttribute('height', svgL);
  sheetRect.setAttribute('fill', 'none');
  sheetRect.setAttribute('stroke', '#000');
  sheetRect.setAttribute('stroke-width', '2');
  svg.appendChild(sheetRect);
  
  // Stock sheet width dimension
  const widthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  widthText.setAttribute('x', svgW / 2);
  widthText.setAttribute('y', '-5');
  widthText.setAttribute('text-anchor', 'middle');
  widthText.setAttribute('font-size', '10');
  widthText.setAttribute('fill', '#000');
  widthText.textContent = `${sheetW}mm`;
  svg.appendChild(widthText);
  
  // Cut piece rectangle
  const cutRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  cutRect.setAttribute('x', xSvg);
  cutRect.setAttribute('y', ySvg);
  cutRect.setAttribute('width', cutSvgW);
  cutRect.setAttribute('height', cutSvgL);
  cutRect.setAttribute('fill', '#ff8800');
  cutRect.setAttribute('fill-opacity', '0.3');
  cutRect.setAttribute('stroke', '#ff8800');
  cutRect.setAttribute('stroke-width', '2');
  svg.appendChild(cutRect);
  
  // Cut dimensions on piece
  const cutDimText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  cutDimText.setAttribute('x', xSvg + cutSvgW / 2);
  cutDimText.setAttribute('y', ySvg + cutSvgL / 2);
  cutDimText.setAttribute('text-anchor', 'middle');
  cutDimText.setAttribute('font-size', '12');
  cutDimText.setAttribute('font-weight', 'bold');
  cutDimText.setAttribute('fill', '#000');
  cutDimText.textContent = `${cutW}×${cutL}mm`;
  svg.appendChild(cutDimText);
  
  // Position markers (dashed lines)
  const vertLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  vertLine.setAttribute('x1', '0');
  vertLine.setAttribute('y1', ySvg);
  vertLine.setAttribute('x2', xSvg);
  vertLine.setAttribute('y2', ySvg);
  vertLine.setAttribute('stroke', '#999');
  vertLine.setAttribute('stroke-width', '1');
  vertLine.setAttribute('stroke-dasharray', '3,3');
  svg.appendChild(vertLine);
  
  const horizLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  horizLine.setAttribute('x1', xSvg);
  horizLine.setAttribute('y1', '0');
  horizLine.setAttribute('x2', xSvg);
  horizLine.setAttribute('y2', ySvg);
  horizLine.setAttribute('stroke', '#999');
  horizLine.setAttribute('stroke-width', '1');
  horizLine.setAttribute('stroke-dasharray', '3,3');
  svg.appendChild(horizLine);
  
  // X position label
  const xPosText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  xPosText.setAttribute('x', xSvg / 2);
  xPosText.setAttribute('y', ySvg - 3);
  xPosText.setAttribute('text-anchor', 'middle');
  xPosText.setAttribute('font-size', '8');
  xPosText.setAttribute('fill', '#666');
  xPosText.textContent = `${x}mm`;
  svg.appendChild(xPosText);
  
  // Y position label
  const yPosText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yPosText.setAttribute('x', xSvg + 3);
  yPosText.setAttribute('y', ySvg / 2);
  yPosText.setAttribute('text-anchor', 'start');
  yPosText.setAttribute('font-size', '8');
  yPosText.setAttribute('fill', '#666');
  yPosText.setAttribute('transform', `rotate(-90, ${xSvg + 3}, ${ySvg / 2})`);
  yPosText.textContent = `${y}mm`;
  svg.appendChild(yPosText);
  
  return svg;
}

/**
 * Generate all print pages from cutting plan
 * @param {Object} plan - Cutting plan with assignments
 * @returns {HTMLElement} Container with all print pages
 */
function generateAllPrintPages(plan) {
  const container = document.createElement('div');
  container.id = 'print-container';
  container.className = 'print-only';
  
  const assignments = plan.assignments || [];
  const kerfWidth = plan.kerf_width || 3.0;
  
  assignments.forEach((assignment, index) => {
    const page = generatePrintPage(assignment, index + 1, assignments.length, kerfWidth);
    container.appendChild(page);
  });
  
  return container;
}

/**
 * Activate print view and trigger browser print dialog
 * @param {Object} plan - Cutting plan with assignments
 */
function activatePrintView(plan) {
  // Remove existing print container if any
  const existing = document.getElementById('print-container');
  if (existing) {
    existing.remove();
  }
  
  // Generate print pages
  const printContainer = generateAllPrintPages(plan);
  document.body.appendChild(printContainer);
  
  // Trigger print dialog
  setTimeout(() => {
    window.print();
  }, 500); // Small delay to ensure rendering is complete
}
