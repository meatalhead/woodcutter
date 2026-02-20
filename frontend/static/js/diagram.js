/**
 * SVG Diagram Renderer for Sheet Cutting Optimizer
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const COLORS = {
    stockSheet: '#3b82f6',
    sheetFill: '#eff6ff',
    cut: '#10b981',
    cutAlt: '#34d399',
    cutLight: '#6ee7b7',
    label: '#ffffff',
    dimension: '#6366f1',
    sequence: '#f59e0b',
    waste: '#f1f5f9',
    background: '#ffffff'
};

// Minimum pixel sizes to render text inside a cut box
const MIN_LABEL_W = 40;
const MIN_LABEL_H = 12;  // use clamped height so wide-thin cuts get inline labels
const MIN_DIM_W = 55;
const MIN_DIM_H = 40;
const BADGE_R = 12;

function createSvgElement(tag, attributes = {}) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attributes).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
}

/**
 * Calculate scale so the sheet fills available width, capped at 350px height.
 */
function calculateScale(sheetWidth, sheetLength, containerWidth) {
    const usable = containerWidth - 120;
    const scaleByWidth = usable / sheetWidth;
    const scaleByHeight = 350 / sheetLength;
    return Math.min(scaleByWidth, scaleByHeight, 1.0);
}

/**
 * Compute a viewport that zooms in on the cuts' bounding box with padding.
 * Returns { vx, vy, vw, vh } in mm — the region of the sheet to display.
 * Also returns the optimal scale for that viewport.
 */
function computeViewport(sheet_width, sheet_length, assignments, containerWidth) {
    if (!assignments.length) {
        return { vx: 0, vy: 0, vw: sheet_width, vh: sheet_length,
                 scale: calculateScale(sheet_width, sheet_length, containerWidth), cropped: false };
    }

    // Bounding box of all cuts (actual, not rendered)
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    assignments.forEach(cut => {
        const cw = cut.rotation === 90 ? cut.length : cut.width;
        const ch = cut.rotation === 90 ? cut.width : cut.length;
        minX = Math.min(minX, cut.x_position);
        minY = Math.min(minY, cut.y_position);
        maxX = Math.max(maxX, cut.x_position + cw);
        maxY = Math.max(maxY, cut.y_position + ch);
    });

    const cutsW = maxX - minX || 1;
    const cutsH = maxY - minY || 1;

    // Add 30% padding around cuts, clamped to sheet
    const padFrac = 0.35;
    const vx = Math.max(0, minX - cutsW * padFrac);
    const vy = Math.max(0, minY - cutsH * padFrac);
    let vr = Math.min(sheet_width,  maxX + cutsW * padFrac);
    let vb = Math.min(sheet_length, maxY + cutsH * padFrac);
    let vw = vr - vx;
    let vh = vb - vy;

    // Cap aspect ratio at 4:1 so flat/thin cuts still get a readable diagram.
    // We expand the shorter dimension rather than crop the longer one.
    const MAX_ASPECT = 4.0;
    if (vw / vh > MAX_ASPECT) {
        const targetVh = vw / MAX_ASPECT;
        const extra = (targetVh - vh) / 2;
        vh = targetVh;
        vb = Math.min(sheet_length, vy + vh + extra);
    } else if (vh / vw > MAX_ASPECT) {
        const targetVw = vh / MAX_ASPECT;
        vw = targetVw;
        vr = Math.min(sheet_width, vx + vw);
    }

    // Is the viewport meaningfully smaller than the full sheet?
    const cropped = vw < sheet_width * 0.75 || vh < sheet_length * 0.75;

    const usable = containerWidth - 140;
    const scaleByW = usable / vw;
    const scaleByH = 260 / vh;
    const scale = Math.min(scaleByW, scaleByH, 2.0);

    return { vx, vy, vw, vh, scale, cropped };
}

/**
 * Minimum rendered pixel size for a cut in either dimension.
 */
const MIN_CUT_PX = 14;

/**
 * Pick a fill colour based on cut index so adjacent cuts contrast.
 */
function cutColor(index) {
    const palette = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
    return palette[index % palette.length];
}

/**
 * Render one sheet diagram as an SVG element.
 * Uses a cropped viewport around the cuts' bounding box when the cuts
 * occupy only a small portion of the sheet, so they're always readable.
 */
function renderSheetDiagram(sheetPlan, containerWidth = 800) {
    const { sheet_width, sheet_length, assignments } = sheetPlan;
    const { vx, vy, vw, vh, scale, cropped } = computeViewport(sheet_width, sheet_length, assignments, containerWidth);

    // Convert sheet/cut coordinates to SVG pixel coords (relative to viewport)
    const toSvgX = mmX => (mmX - vx) * scale;
    const toSvgY = mmY => (mmY - vy) * scale;

    const sw = vw * scale;   // viewport width in px
    const sh = vh * scale;   // viewport height in px
    const padL = 14;
    const padT = 14;
    const padB = 44;  // bottom dimension line
    const padR = 110; // right gutter for callout labels
    const totalW = sw + padL + padR;
    const totalH = sh + padT + padB;

    const svg = createSvgElement('svg', {
        width: '100%',
        viewBox: `0 0 ${totalW} ${totalH}`,
        style: `display:block; max-width:100%; height:auto; min-height:120px; border-radius:8px; background:#fff; border:1px solid #e5e7eb;`
    });

    // Sheet background (full sheet, clipped to viewport)
    const sheetX = padL + toSvgX(0);
    const sheetY = padT + toSvgY(0);
    const sheetW = sheet_width * scale;
    const sheetH = sheet_length * scale;
    svg.appendChild(createSvgElement('rect', {
        x: sheetX, y: sheetY, width: sheetW, height: sheetH,
        fill: COLORS.sheetFill,
        stroke: cropped ? '#93c5fd' : COLORS.stockSheet,
        'stroke-width': cropped ? 1 : 2,
        'stroke-dasharray': cropped ? '6,4' : 'none',
        rx: 2
    }));

    // If cropped, show viewport boundary
    if (cropped) {
        svg.appendChild(createSvgElement('rect', {
            x: padL, y: padT, width: sw, height: sh,
            fill: 'none', stroke: '#94a3b8', 'stroke-width': 1,
            'stroke-dasharray': '3,3', rx: 1
        }));
    }

    // ── Pass 1: compute cut render data ──
    const cutData = assignments.map((cut, idx) => {
        const actualW = (cut.rotation === 90 ? cut.length : cut.width) * scale;
        const actualH = (cut.rotation === 90 ? cut.width : cut.length) * scale;
        const dw = Math.max(MIN_CUT_PX, actualW);
        const dh = Math.max(MIN_CUT_PX, actualH);
        const cx = padL + toSvgX(cut.x_position);
        const cy = padT + toSvgY(cut.y_position);
        const isTiny = dw < MIN_LABEL_W || dh < MIN_LABEL_H;
        return { cut, idx, cx, cy, dw, dh, isTiny,
                 fill: cutColor(idx),
                 labelText: cut.cut_label,
                 dimText: `${cut.width}×${cut.length}mm${cut.rotation === 90 ? ' ↻' : ''}` };
    });

    // ── Pass 2: resolve callout y-positions (no overlap) ──
    const CALLOUT_X = padL + sw + 8;
    const CALLOUT_ROW_H = 22;
    const calloutSlots = [];  // kept sorted

    function claimY(preferredY) {
        let y = Math.max(padT + 8, preferredY);
        // Walk through sorted slots and bump past any collision
        for (const s of calloutSlots) {
            if (Math.abs(s - y) < CALLOUT_ROW_H) {
                y = s + CALLOUT_ROW_H;
            }
        }
        // Cap to prevent labels running off the SVG
        const maxY = totalH - 10;
        if (y > maxY) y = maxY;
        calloutSlots.push(y);
        calloutSlots.sort((a, b) => a - b);
        return y;
    }

    cutData.filter(d => d.isTiny)
           .sort((a, b) => a.cy - b.cy)
           .forEach(d => { d.calloutY = claimY(d.cy + d.dh / 2); });

    // ── Pass 3: guillotine lines ──
    const lines = new Set();
    assignments.forEach(cut => {
        const cw = (cut.rotation === 90 ? cut.length : cut.width);
        const ch = (cut.rotation === 90 ? cut.width : cut.length);
        // Only draw lines that fall within the viewport
        const rx = cut.x_position + cw;
        const by = cut.y_position + ch;
        if (rx > vx && rx < vx + vw) lines.add(`V${rx}`);
        if (by > vy && by < vy + vh) lines.add(`H${by}`);
    });
    lines.forEach(line => {
        const isV = line[0] === 'V';
        const mm = parseFloat(line.slice(1));
        const pos = isV ? toSvgX(mm) : toSvgY(mm);
        svg.appendChild(createSvgElement('line', {
            x1: isV ? padL + pos : padL,
            y1: isV ? padT : padT + pos,
            x2: isV ? padL + pos : padL + sw,
            y2: isV ? padT + sh : padT + pos,
            stroke: COLORS.dimension, 'stroke-width': 1,
            'stroke-dasharray': '5,4', opacity: 0.4
        }));
    });

    // ── Pass 4: cut rectangles + badges + labels ──
    cutData.forEach(d => {
        const { cx, cy, dw, dh, fill, isTiny, labelText, dimText, cut } = d;

        svg.appendChild(createSvgElement('rect', {
            x: cx, y: cy, width: dw, height: dh,
            fill, 'fill-opacity': 0.88,
            stroke: '#fff', 'stroke-width': 1.5, rx: 2
        }));

        // Badge (top-left, always shown)
        const br = Math.max(7, Math.min(BADGE_R, dw * 0.42, dh * 0.42));
        const bx = cx + br + 1;
        const by_c = cy + br + 1;
        svg.appendChild(createSvgElement('circle', {
            cx: bx, cy: by_c, r: br,
            fill: COLORS.sequence, stroke: '#fff', 'stroke-width': 1.5
        }));
        const bt = createSvgElement('text', {
            x: bx, y: by_c + br * 0.38,
            'text-anchor': 'middle', 'dominant-baseline': 'middle',
            fill: '#fff', 'font-size': Math.max(8, br * 0.9),
            'font-weight': 'bold', 'font-family': 'system-ui, Arial, sans-serif'
        });
        bt.textContent = cut.sequence_number;
        svg.appendChild(bt);

        if (!isTiny) {
            // Inline label
            const lx = cx + dw / 2;
            const ly = cy + dh / 2;
            const showDim = dw >= MIN_DIM_W && dh >= MIN_DIM_H;
            const lbl = createSvgElement('text', {
                x: lx, y: showDim ? ly - 5 : ly + 4,
                'text-anchor': 'middle', fill: '#fff',
                'font-size': 10, 'font-weight': 'bold',
                'font-family': 'system-ui, Arial, sans-serif',
                'paint-order': 'stroke', stroke: 'rgba(0,0,0,0.2)', 'stroke-width': 2
            });
            lbl.textContent = labelText;
            svg.appendChild(lbl);
            if (showDim) {
                const dim = createSvgElement('text', {
                    x: lx, y: ly + 9,
                    'text-anchor': 'middle', fill: 'rgba(255,255,255,0.85)',
                    'font-size': 8, 'font-family': 'system-ui, Arial, sans-serif'
                });
                dim.textContent = dimText;
                svg.appendChild(dim);
            }
        } else {
            // Callout with elbow line into right gutter
            const anchorX = cx + dw;
            const anchorY = cy + dh / 2;
            const labelY = d.calloutY;
            svg.appendChild(createSvgElement('polyline', {
                points: `${anchorX},${anchorY} ${CALLOUT_X - 6},${anchorY} ${CALLOUT_X - 6},${labelY} ${CALLOUT_X},${labelY}`,
                fill: 'none', stroke: fill, 'stroke-width': 1, opacity: 0.75
            }));
            svg.appendChild(createSvgElement('circle', { cx: anchorX, cy: anchorY, r: 2, fill }));
            const cl = createSvgElement('text', {
                x: CALLOUT_X + 2, y: labelY - 3,
                fill: '#1f2937', 'font-size': 9, 'font-weight': '600',
                'font-family': 'system-ui, Arial, sans-serif'
            });
            cl.textContent = labelText;
            svg.appendChild(cl);
            const cd = createSvgElement('text', {
                x: CALLOUT_X + 2, y: labelY + 8,
                fill: '#6b7280', 'font-size': 8,
                'font-family': 'system-ui, Arial, sans-serif'
            });
            cd.textContent = dimText;
            svg.appendChild(cd);
        }
    });

    // Sheet boundary on top (faint if cropped)
    svg.appendChild(createSvgElement('rect', {
        x: sheetX, y: sheetY, width: sheetW, height: sheetH,
        fill: 'none',
        stroke: cropped ? '#93c5fd' : COLORS.stockSheet,
        'stroke-width': cropped ? 1 : 2,
        'stroke-dasharray': cropped ? '6,4' : 'none',
        rx: 2
    }));

    // ── Dimension line across the bottom of viewport ──
    const dimY = padT + sh + 22;
    const dimLabel = `${sheet_width} mm`;
    svg.appendChild(createSvgElement('line', { x1: padL, y1: dimY, x2: padL + sw, y2: dimY, stroke: COLORS.dimension, 'stroke-width': 1 }));
    svg.appendChild(createSvgElement('line', { x1: padL, y1: dimY-4, x2: padL, y2: dimY+4, stroke: COLORS.dimension, 'stroke-width': 1 }));
    svg.appendChild(createSvgElement('line', { x1: padL+sw, y1: dimY-4, x2: padL+sw, y2: dimY+4, stroke: COLORS.dimension, 'stroke-width': 1 }));
    const dwt = createSvgElement('text', { x: padL + sw / 2, y: dimY + 12, 'text-anchor': 'middle', fill: COLORS.dimension, 'font-size': 10, 'font-family': 'system-ui, Arial, sans-serif' });
    dwt.textContent = dimLabel;
    svg.appendChild(dwt);

    return svg;
}

/**
 * Render all sheet diagrams into the given container element.
 */
function renderCuttingPlanDiagrams(cuttingPlan, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    cuttingPlan.sheet_plans.forEach((sheetPlan, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'mb-6';

        // Sheet title bar
        const title = document.createElement('div');
        title.className = 'flex items-center gap-3 mb-2';
        const vp = computeViewport(sheetPlan.sheet_width, sheetPlan.sheet_length, sheetPlan.assignments, container.offsetWidth - 40 || 760);
        const zoomedBadge = vp.cropped ? `<span class="text-xs text-slate-400 italic">(zoomed to cut area)</span>` : '';
        title.innerHTML = `
            <span class="text-sm font-semibold text-blue-600">Sheet ${index + 1}: ${sheetPlan.sheet_label}</span>
            <span class="text-xs text-gray-400">${sheetPlan.sheet_width} × ${sheetPlan.sheet_length} mm</span>
            ${zoomedBadge}
            <span class="ml-auto text-xs text-gray-400">${sheetPlan.assignments.length} piece${sheetPlan.assignments.length !== 1 ? 's' : ''}</span>
        `;
        wrapper.appendChild(title);

        const svg = renderSheetDiagram(sheetPlan, container.offsetWidth - 40 || 760);
        addTouchGestureSupport(svg, wrapper);
        wrapper.appendChild(svg);

        // Compact legend below diagram
        const legend = document.createElement('div');
        legend.className = 'flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500';
        legend.innerHTML = `
            <span>● Numbered badges = cutting sequence</span>
            <span class="text-indigo-400">- - - Guillotine cut lines</span>
        `;
        wrapper.appendChild(legend);

        container.appendChild(wrapper);
    });
}

/**
 * Touch gesture support (pinch-zoom + pan) for mobile.
 */
function addTouchGestureSupport(svg, container) {
    let startDist = 0, scale = 1, tx = 0, ty = 0, lx = 0, ly = 0;
    const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    svg.addEventListener('touchstart', e => {
        if (e.touches.length === 2) startDist = dist(e.touches);
        else { lx = e.touches[0].clientX; ly = e.touches[0].clientY; }
        e.preventDefault();
    }, { passive: false });

    svg.addEventListener('touchmove', e => {
        if (e.touches.length === 2) {
            const d = dist(e.touches);
            if (startDist > 0) { scale = Math.min(3, Math.max(0.5, scale * d / startDist)); startDist = d; }
        } else if (e.touches.length === 1) {
            tx += e.touches[0].clientX - lx; ty += e.touches[0].clientY - ly;
            lx = e.touches[0].clientX; ly = e.touches[0].clientY;
        }
        svg.style.transform = `scale(${scale}) translate(${tx}px,${ty}px)`;
        e.preventDefault();
    }, { passive: false });

    svg.addEventListener('touchend', e => { if (!e.touches.length) startDist = 0; e.preventDefault(); }, { passive: false });
}

window.DiagramRenderer = { renderCuttingPlanDiagrams, renderSheetDiagram };

