"""Core cutting optimization algorithm using Guillotine bin packing."""
from dataclasses import dataclass
from typing import Optional


@dataclass
class Rectangle:
    """Represents a rectangle with position and dimensions."""
    x: float
    y: float
    width: float
    length: float
    
    @property
    def area(self) -> float:
        return self.width * self.length


@dataclass
class Cut:
    """Represents a required cut piece."""
    id: str
    width: float
    length: float
    thickness: float
    label: str
    quantity: int


@dataclass
class Sheet:
    """Represents a stock sheet."""
    id: str
    width: float
    length: float
    thickness: float
    label: str
    priority: str
    quantity: int = 1


@dataclass
class Placement:
    """Represents a cut placed on a sheet."""
    cut: Cut
    sheet: Sheet
    x: float
    y: float
    rotated: bool
    
    @property
    def width(self) -> float:
        return self.cut.length if self.rotated else self.cut.width
    
    @property
    def length(self) -> float:
        return self.cut.width if self.rotated else self.cut.length


@dataclass
class UnplacedCut:
    """Represents a cut that could not be placed."""
    cut: Cut
    reason: str


class GuillotineBinPacker:
    """Guillotine bin packing algorithm for 2D cutting optimization."""
    
    def __init__(self, kerf: float = 3.0):
        """Initialize packer with blade kerf width."""
        self.kerf = kerf
        
    def can_fit(self, cut_w: float, cut_l: float, rect: Rectangle) -> tuple[bool, bool]:
        """
        Check if a cut can fit in a rectangle.
        Returns (fits, needs_rotation).
        """
        fits_normal = (cut_w + self.kerf <= rect.width and 
                      cut_l + self.kerf <= rect.length)
        fits_rotated = (cut_l + self.kerf <= rect.width and 
                       cut_w + self.kerf <= rect.length)
        
        if fits_normal:
            return True, False
        elif fits_rotated:
            return True, True
        return False, False
    
    def split_rectangle(self, rect: Rectangle, cut_w: float, cut_l: float, 
                       rotated: bool) -> list[Rectangle]:
        """
        Split a rectangle after placing a cut using guillotine method.
        Returns list of remaining free rectangles.
        """
        placed_w = cut_l + self.kerf if rotated else cut_w + self.kerf
        placed_l = cut_w + self.kerf if rotated else cut_l + self.kerf
        
        free_rects = []
        
        # Right rectangle
        if rect.width > placed_w:
            free_rects.append(Rectangle(
                x=rect.x + placed_w,
                y=rect.y,
                width=rect.width - placed_w,
                length=rect.length
            ))
        
        # Top rectangle
        if rect.length > placed_l:
            free_rects.append(Rectangle(
                x=rect.x,
                y=rect.y + placed_l,
                width=placed_w,
                length=rect.length - placed_l
            ))
        
        return free_rects
    
    def pack_sheet(self, cuts: list[Cut], sheet: Sheet) -> tuple[list[Placement], list[Cut]]:
        """
        Pack cuts onto a single sheet.
        Returns (placements, remaining_cuts).
        """
        from copy import deepcopy
        
        # Start with full sheet as free rectangle
        free_rects = [Rectangle(x=0, y=0, width=sheet.width, length=sheet.length)]
        placements = []
        # Deep copy to avoid modifying original cuts
        remaining = deepcopy(cuts)
        
        # Try to place each cut
        i = 0
        while i < len(remaining) and len(remaining) > 0:
            cut = remaining[i]
            placed = False
            
            # Try each free rectangle
            for j, rect in enumerate(free_rects):
                fits, rotated = self.can_fit(cut.width, cut.length, rect)
                
                if fits:
                    # Place the cut
                    placement = Placement(
                        cut=cut,
                        sheet=sheet,
                        x=rect.x,
                        y=rect.y,
                        rotated=rotated
                    )
                    placements.append(placement)
                    
                    # Split the rectangle
                    new_rects = self.split_rectangle(rect, cut.width, cut.length, rotated)
                    
                    # Update free rectangles
                    free_rects = free_rects[:j] + free_rects[j+1:] + new_rects
                    
                    # Handle quantity
                    if cut.quantity > 1:
                        cut.quantity -= 1
                    else:
                        remaining.pop(i)
                        # Don't decrement i below 0
                        if i > 0:
                            i -= 1
                    
                    placed = True
                    break
            
            if not placed:
                i += 1
        
        return placements, remaining
    
    def optimize(self, cuts: list[Cut], sheets: list[Sheet]) -> tuple[list[Placement], list[UnplacedCut]]:
        """
        Optimize cutting plan using First-Fit Decreasing heuristic.
        Returns (placements, unplaced_cuts) — best effort when not all cuts fit.
        """
        # Expand cuts by quantity (each becomes qty=1)
        cuts_to_place = []
        for cut in cuts:
            for _ in range(cut.quantity):
                cuts_to_place.append(Cut(
                    id=cut.id,
                    width=cut.width,
                    length=cut.length,
                    thickness=cut.thickness,
                    label=cut.label,
                    quantity=1
                ))
        
        cuts_to_place.sort(key=lambda c: c.width * c.length, reverse=True)
        
        # Expand sheets by quantity — each instance gets a unique ID for tracking
        expanded_sheets = []
        for sheet in sheets:
            qty = getattr(sheet, 'quantity', 1) or 1
            for i in range(qty):
                instance_id = sheet.id if qty == 1 else f"{sheet.id}__inst{i}"
                expanded_sheets.append(Sheet(
                    id=instance_id,
                    width=sheet.width,
                    length=sheet.length,
                    thickness=sheet.thickness,
                    label=f"{sheet.label}" if qty == 1 else f"{sheet.label} #{i+1}",
                    priority=sheet.priority,
                    quantity=1
                ))
        
        # Sort sheets by priority then area
        priority_order = {"high": 0, "normal": 1, "low": 2}
        sheets_sorted = sorted(expanded_sheets, 
                              key=lambda s: (priority_order.get(s.priority, 1), 
                                           -(s.width * s.length)))
        
        all_placements = []
        remaining_cuts = cuts_to_place
        
        # Track which thicknesses are available
        available_thicknesses = set(s.thickness for s in sheets_sorted)
        
        # Try to pack on available sheets
        for sheet in sheets_sorted:
            if not remaining_cuts:
                break
            
            # Filter cuts by matching thickness
            matching_cuts = [c for c in remaining_cuts if c.thickness == sheet.thickness]
            other_cuts = [c for c in remaining_cuts if c.thickness != sheet.thickness]
            
            if matching_cuts:
                placements, still_remaining = self.pack_sheet(matching_cuts, sheet)
                all_placements.extend(placements)
                remaining_cuts = still_remaining + other_cuts
        
        # Build unplaced cuts list with reasons
        unplaced = []
        for cut in remaining_cuts:
            if cut.thickness not in available_thicknesses:
                reason = f"No stock sheet with {cut.thickness}mm thickness"
            else:
                reason = f"Insufficient space on available {cut.thickness}mm sheets"
            unplaced.append(UnplacedCut(cut=cut, reason=reason))
        
        return all_placements, unplaced
