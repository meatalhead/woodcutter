"""Print template generation service for A4 cutting instructions."""
from typing import List, Dict, Any


def generate_print_html(plan_data: Dict[str, Any]) -> str:
    """
    Generate HTML for print-ready cutting instructions.
    
    Creates one A4 page per cut with:
    - Cut dimensions and label
    - Source sheet information
    - Position on sheet
    - Cutting sequence number
    - Visual diagram
    
    Args:
        plan_data: Dictionary containing cutting plan with assignments
        
    Returns:
        Complete HTML document ready for printing
    """
    assignments = plan_data.get("assignments", [])
    kerf_width = plan_data.get("kerf_width", 3.0)
    
    # Generate page for each cut assignment
    pages_html = []
    for idx, assignment in enumerate(assignments, 1):
        page_html = _generate_cut_page(assignment, idx, len(assignments), kerf_width)
        pages_html.append(page_html)
    
    # Wrap pages in complete HTML document
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cutting Instructions - Print</title>
    <style>
        @page {{
            size: A4 portrait;
            margin: 15mm;
        }}
        
        @media print {{
            body {{
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
            }}
            
            .page {{
                page-break-after: always;
                width: 210mm;
                min-height: 297mm;
                padding: 15mm;
                box-sizing: border-box;
            }}
            
            .page:last-child {{
                page-break-after: auto;
            }}
            
            .header {{
                border-bottom: 2px solid #000;
                padding-bottom: 10mm;
                margin-bottom: 10mm;
            }}
            
            .cut-number {{
                font-size: 24pt;
                font-weight: bold;
                margin-bottom: 5mm;
            }}
            
            .cut-label {{
                font-size: 18pt;
                margin-bottom: 5mm;
            }}
            
            .dimensions {{
                font-size: 16pt;
                margin-bottom: 3mm;
            }}
            
            .sheet-info {{
                font-size: 14pt;
                color: #333;
                margin-bottom: 5mm;
            }}
            
            .diagram {{
                margin: 10mm 0;
                border: 1px solid #ccc;
                padding: 5mm;
                background: #f9f9f9;
            }}
            
            .instructions {{
                font-size: 12pt;
                margin-top: 10mm;
                padding: 5mm;
                background: #f0f0f0;
                border-left: 4px solid #333;
            }}
        }}
        
        @media screen {{
            body {{
                background: #e0e0e0;
                padding: 20px;
                font-family: Arial, sans-serif;
            }}
            
            .page {{
                background: white;
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto 20px;
                padding: 15mm;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            
            .header {{
                border-bottom: 2px solid #000;
                padding-bottom: 10mm;
                margin-bottom: 10mm;
            }}
            
            .cut-number {{
                font-size: 24pt;
                font-weight: bold;
                margin-bottom: 5mm;
            }}
            
            .cut-label {{
                font-size: 18pt;
                margin-bottom: 5mm;
            }}
            
            .dimensions {{
                font-size: 16pt;
                margin-bottom: 3mm;
            }}
            
            .sheet-info {{
                font-size: 14pt;
                color: #333;
                margin-bottom: 5mm;
            }}
            
            .diagram {{
                margin: 10mm 0;
                border: 1px solid #ccc;
                padding: 5mm;
                background: #f9f9f9;
            }}
            
            .instructions {{
                font-size: 12pt;
                margin-top: 10mm;
                padding: 5mm;
                background: #f0f0f0;
                border-left: 4px solid #333;
            }}
            
            .print-button {{
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 30px;
                font-size: 16px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }}
            
            .print-button:hover {{
                background: #0056b3;
            }}
            
            @media print {{
                .print-button {{
                    display: none;
                }}
            }}
        }}
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">🖨️ Print All Pages</button>
    {''.join(pages_html)}
</body>
</html>"""


def _generate_cut_page(assignment: Dict[str, Any], page_num: int, total_pages: int, kerf_width: float) -> str:
    """Generate HTML for a single cut instruction page."""
    cut = assignment.get("cut", {})
    sheet = assignment.get("sheet", {})
    
    cut_label = cut.get("label", f"Cut {page_num}")
    cut_width = cut.get("width", 0)
    cut_length = cut.get("length", 0)
    cut_thickness = cut.get("thickness", 0)
    
    sheet_label = sheet.get("label", "Stock Sheet")
    sheet_width = sheet.get("width", 0)
    sheet_length = sheet.get("length", 0)
    
    x_pos = assignment.get("x_position", 0)
    y_pos = assignment.get("y_position", 0)
    rotation = assignment.get("rotation", 0)
    sequence = assignment.get("sequence_number", page_num)
    
    # Generate simple SVG diagram
    svg_diagram = _generate_diagram_svg(
        sheet_width, sheet_length,
        cut_width, cut_length,
        x_pos, y_pos, rotation
    )
    
    return f"""
    <div class="page">
        <div class="header">
            <div class="cut-number">Cut #{sequence} of {total_pages}</div>
            <div class="cut-label">{cut_label}</div>
        </div>
        
        <div class="dimensions">
            <strong>Dimensions:</strong> {cut_width}mm × {cut_length}mm × {cut_thickness}mm
        </div>
        
        <div class="sheet-info">
            <strong>Source Sheet:</strong> {sheet_label} ({sheet_width}mm × {sheet_length}mm)
        </div>
        
        <div class="sheet-info">
            <strong>Position:</strong> X={x_pos}mm, Y={y_pos}mm {f"(Rotated 90°)" if rotation == 90 else ""}
        </div>
        
        <div class="diagram">
            {svg_diagram}
        </div>
        
        <div class="instructions">
            <strong>Cutting Instructions:</strong><br>
            1. Locate the {sheet_label}<br>
            2. Measure {x_pos}mm from the left edge and {y_pos}mm from the top edge<br>
            3. Mark the cutting area: {cut_width}mm × {cut_length}mm<br>
            4. Account for {kerf_width}mm blade kerf when cutting<br>
            5. Label the cut piece as "{cut_label}" after cutting
        </div>
    </div>
    """


def _generate_diagram_svg(sheet_w: float, sheet_l: float, 
                          cut_w: float, cut_l: float,
                          x: float, y: float, rotation: int) -> str:
    """Generate SVG diagram showing cut position on sheet."""
    # Scale factor to fit A4 page (max 170mm width)
    max_width = 170  # mm
    scale = min(max_width / sheet_w, 150 / sheet_l) if sheet_w > 0 else 1
    
    svg_w = sheet_w * scale
    svg_l = sheet_l * scale
    cut_svg_w = cut_w * scale
    cut_svg_l = cut_l * scale
    x_svg = x * scale
    y_svg = y * scale
    
    # Swap cut dimensions if rotated
    if rotation == 90:
        cut_svg_w, cut_svg_l = cut_svg_l, cut_svg_w
    
    return f"""
    <svg width="{svg_w}mm" height="{svg_l}mm" viewBox="0 0 {svg_w} {svg_l}" 
         style="border: 2px solid #333; background: white;">
        <!-- Stock sheet outline -->
        <rect x="0" y="0" width="{svg_w}" height="{svg_l}" 
              fill="none" stroke="#000" stroke-width="2"/>
        
        <!-- Stock sheet dimensions -->
        <text x="{svg_w/2}" y="-5" text-anchor="middle" font-size="10" fill="#000">
            {sheet_w}mm
        </text>
        <text x="-5" y="{svg_l/2}" text-anchor="end" font-size="10" fill="#000" 
              transform="rotate(-90, -5, {svg_l/2})">
            {sheet_l}mm
        </text>
        
        <!-- Cut piece rectangle -->
        <rect x="{x_svg}" y="{y_svg}" width="{cut_svg_w}" height="{cut_svg_l}"
              fill="#ff8800" fill-opacity="0.3" stroke="#ff8800" stroke-width="2"/>
        
        <!-- Cut dimensions on piece -->
        <text x="{x_svg + cut_svg_w/2}" y="{y_svg + cut_svg_l/2}" 
              text-anchor="middle" font-size="12" font-weight="bold" fill="#000">
            {cut_w}×{cut_l}mm
        </text>
        
        <!-- Position markers -->
        <line x1="0" y1="{y_svg}" x2="{x_svg}" y2="{y_svg}" 
              stroke="#999" stroke-width="1" stroke-dasharray="3,3"/>
        <line x1="{x_svg}" y1="0" x2="{x_svg}" y2="{y_svg}" 
              stroke="#999" stroke-width="1" stroke-dasharray="3,3"/>
        
        <!-- Position labels -->
        <text x="{x_svg/2}" y="{y_svg - 3}" text-anchor="middle" font-size="8" fill="#666">
            {x}mm
        </text>
        <text x="{x_svg + 3}" y="{y_svg/2}" text-anchor="start" font-size="8" fill="#666"
              transform="rotate(-90, {x_svg + 3}, {y_svg/2})">
            {y}mm
        </text>
    </svg>
    """
