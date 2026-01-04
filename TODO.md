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

- [ ] **DECISION NEEDED: Fugal Statement Options** (see NOTES.md for full analysis)
  - Current `dis-mol-peters-sharp.svg` cuts off mid-phrase before F♯
  - **Option A:** F♯ ellipsis (one more beat, severed staff-bars)
  - **Option B:** ✨ Full three measures (exposition + answer) - IDEAL if achievable
  - Recommendation: Try Option B first, fallback to Option A if needed
- [ ] **Try Option B first: Full three-measure statement**
  - GIMP: Open `dis-mol-peters.png` and extend crop to include full three measures
  - Reference: `dis-mol-answer.png` for complete exposition + answer
  - Re-vectorize: `./png-to-svg-potrace.sh dis-mol-answer.png dis-mol-three-measures sharp`
  - **CRITICAL:** Print at actual laptop size with throwaway vinyl
  - Test questions:
    - Are staff lines physically cuttable at that scale?
    - Does sharp preset hold up when scaled down?
    - Does width fit laptop layout?
    - Visual balance with Y-combinator at top?
- [ ] **If Option B fails: Fallback to Option A (F♯ ellipsis)**
  - Open original Peters PNG in GIMP (dis-mol-peters-clean-simple.png or source)
  - Extend crop to include F♯ (one more beat only)
  - Create "ellipsis" effect by severing staff-bars after F♯
  - Re-vectorize: `./png-to-svg-potrace.sh [input].png dis-mol-extended sharp`
  - If still too thin: Try "max" preset or artificially thicken staff lines in GIMP
- [ ] **Practice run**: Cut test stickers with throwaway colors (lavender, green, etc.)
  - Test cutting precision on lambda symbols
  - Test musical notation (staffs, notes, accidentals)
  - Test size/scale on actual laptop or similar surface
  - Verify transfer technique (avoiding bubbles)
  - **If doing F♯ experiment:** Print both versions (current + extended) for comparison
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

See **NOTES.md** for detailed technical findings, experiments, and lessons learned.

**Quick reference:**
- Use `sharp` preset for music notation vectorization: `./png-to-svg-potrace.sh input.png output sharp`
- Peters PNG → potrace workflow produces clean, cuttable SVGs
- LilyPond needs thickening overrides for vinyl cutting
