# Laptop Stickers TODO

## Layout Plan

Same layout as old laptop:
- **Top horizontal:** Y-combinator in metallic silver or white
- **Center cluster:** Random life stickers (skate, conference swag, whatever accumulates organically)
- **Bottom horizontal:** D♯ minor fugue in brushed metallic gold

## Workflow Options

### Option 1: Edition Peters Scan (Proven Method)
Use the Peters edition scan → vectorization workflow (this worked well on old laptop):

```bash
# Extract page 41 (D♯ minor fugue) from WTC Book II
./pdf-page-to-png.sh wtc-ii.pdf 41 dis-mol-peters 600

# Then in GIMP: crop, clean up, adjust levels/contrast
# Then in Inkscape: Path → Trace Bitmap → export SVG
```

**Pros:** Authentic vintage look, rough edges feel hand-crafted, proven to cut well
**Cons:** Requires manual GIMP/Inkscape steps

### Option 2: LilyPond Generated (Experimental)
Use the LilyPond → rasterize → vectorize workflow:

```bash
# Compile .ly file with thickened notation
./lilypond-to-vinyl.sh bach-dis-mol-fuga.ly 600 centerline

# Output: bach-dis-mol-fuga-vinyl.svg ready for cutting
```

**Pros:** Automated, clean modern engraving, easy to modify notation
**Cons:** May need testing, LilyPond lines were too thin before (now thickened)

## Tasks

- [ ] **Practice run**: Cut test stickers with throwaway colors (lavender, green, etc.)
  - Test cutting precision on lambda symbols
  - Test musical notation (staffs, notes, accidentals)
  - Test size/scale on actual laptop or similar surface
  - Verify transfer technique (avoiding bubbles)
- [ ] **Decide workflow**: Peters scan vs LilyPond (or compare both)
- [ ] **Generate D♯ minor fugue sticker** (brushed metallic gold)
- [ ] **Print Y-combinator sticker** (brushed metallic silver or white)
- [ ] **Collect random stickers** from conferences/skate shops
- [ ] **Apply in planned layout**

## Design Notes

- **Color scheme**: Brushed metallic silver + brushed metallic gold (or white + gold)
  - Silver/white Y-combinator = cold/logical/computational
  - Gold fugue = warm/classical/artistic
  - Metallics photograph better and add premium feel
- **Intentional structure** on edges (math top, music bottom)
- **Organic chaos** in middle (tells your story over time)
- **D♯ minor fugue**: Well-Tempered Clavier Book I, No. 8
- **Cutting note**: Raster → vector conversion creates opaque/filled shapes that cut better than hollow vector strokes

## Technical Notes

### Vinyl Cutting Issues Learned
- LilyPond PDF exports have thin staff lines and cut as hollow outlines (not ideal)
- Thickening overrides added to .ly file: staffs, stems, beams, slurs, ties, noteheads
- Peters PNG → Inkscape trace creates filled/opaque shapes (cuts cleanly)
- Practice with throwaway colors before using premium metallic vinyl
