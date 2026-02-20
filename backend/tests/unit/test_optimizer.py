"""Basic unit tests for optimizer algorithm."""
import pytest
from app.services.optimizer import GuillotineBinPacker, Cut, Sheet, Rectangle


def test_rectangle_area() -> None:
    """Test rectangle area calculation."""
    rect = Rectangle(x=0, y=0, width=100, length=200)
    assert rect.area == 20000


def test_can_fit_normal() -> None:
    """Test normal fit check."""
    packer = GuillotineBinPacker(kerf=3.0)
    rect = Rectangle(x=0, y=0, width=100, length=200)
    
    fits, rotated = packer.can_fit(50, 100, rect)
    assert fits is True
    assert rotated is False


def test_can_fit_rotated() -> None:
    """Test rotated fit check."""
    packer = GuillotineBinPacker(kerf=3.0)
    rect = Rectangle(x=0, y=0, width=100, length=200)
    
    fits, rotated = packer.can_fit(150, 80, rect)
    assert fits is True
    assert rotated is True


def test_can_fit_no_fit() -> None:
    """Test no fit scenario."""
    packer = GuillotineBinPacker(kerf=3.0)
    rect = Rectangle(x=0, y=0, width=100, length=200)
    
    fits, rotated = packer.can_fit(300, 300, rect)
    assert fits is False


def test_split_rectangle() -> None:
    """Test rectangle splitting after placement."""
    packer = GuillotineBinPacker(kerf=3.0)
    rect = Rectangle(x=0, y=0, width=100, length=200)
    
    free_rects = packer.split_rectangle(rect, 50, 100, rotated=False)
    
    # Should create right and top rectangles
    assert len(free_rects) == 2
    
    # Right rectangle
    assert free_rects[0].x == 53  # 50 + kerf
    assert free_rects[0].width == 47  # 100 - 53
    
    # Top rectangle  
    assert free_rects[1].y == 103  # 100 + kerf
    assert free_rects[1].length == 97  # 200 - 103


def test_pack_sheet_simple() -> None:
    """Test simple sheet packing."""
    packer = GuillotineBinPacker(kerf=3.0)
    
    sheet = Sheet(
        id="sheet1",
        width=1000,
        length=2000,
        thickness=18,
        label="Test Sheet",
        priority="normal"
    )
    
    cuts = [
        Cut(id="cut1", width=400, length=400, thickness=18, label="Cut 1", quantity=1),
        Cut(id="cut2", width=300, length=300, thickness=18, label="Cut 2", quantity=1),
    ]
    
    placements, remaining = packer.pack_sheet(cuts, sheet)
    
    assert len(placements) == 2
    assert len(remaining) == 0
    assert placements[0].cut.id == "cut1"
    assert placements[1].cut.id == "cut2"


def test_optimize_with_thickness_matching() -> None:
    """Test optimization respects thickness matching."""
    packer = GuillotineBinPacker(kerf=3.0)
    
    sheets = [
        Sheet(id="s1", width=1000, length=2000, thickness=18, label="18mm", priority="normal"),
        Sheet(id="s2", width=1000, length=2000, thickness=12, label="12mm", priority="normal"),
    ]
    
    cuts = [
        Cut(id="c1", width=400, length=400, thickness=18, label="18mm Cut", quantity=1),
        Cut(id="c2", width=300, length=300, thickness=12, label="12mm Cut", quantity=1),
    ]
    
    placements = packer.optimize(cuts, sheets)
    
    assert len(placements) == 2
    
    # Find placement for 18mm cut
    placement_18 = next(p for p in placements if p.cut.thickness == 18)
    assert placement_18.sheet.thickness == 18
    
    # Find placement for 12mm cut
    placement_12 = next(p for p in placements if p.cut.thickness == 12)
    assert placement_12.sheet.thickness == 12


def test_optimize_with_priority() -> None:
    """Test optimization respects sheet priority."""
    packer = GuillotineBinPacker(kerf=3.0)
    
    sheets = [
        Sheet(id="s1", width=1000, length=2000, thickness=18, label="Low Priority", priority="low"),
        Sheet(id="s2", width=1000, length=2000, thickness=18, label="High Priority", priority="high"),
    ]
    
    cuts = [
        Cut(id="c1", width=400, length=400, thickness=18, label="Cut 1", quantity=1),
    ]
    
    placements = packer.optimize(cuts, sheets)
    
    # Should use high priority sheet first
    assert len(placements) == 1
    assert placements[0].sheet.id == "s2"
