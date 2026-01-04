# Laptop Stickers - Technical Notes

Technical findings, experiments, and lessons learned for the laptop stickers project.

---

## Vinyl Cutting Findings

### LilyPond PDF Export Issues
- LilyPond PDF exports have thin staff lines that cut as hollow outlines (not ideal for vinyl)
- Solution: Added thickening overrides to .ly files for staffs, stems, beams, slurs, ties, noteheads
- Alternative: Use raster → vector workflow instead

### Peters Edition Scan Workflow
- Peters PNG → Inkscape trace creates filled/opaque shapes that cut cleanly
- Authentic vintage look with rough edges feels hand-crafted
- Proven to cut well on vinyl
- Requires manual GIMP/Inkscape steps but produces best results

### General Vinyl Cutting Notes
- Raster → vector conversion creates opaque/filled shapes that cut better than hollow vector strokes
- Practice with throwaway colors (lavender, green) before using premium metallic vinyl
- Test cutting precision on complex symbols (lambdas, musical notation, accidentals)

---

## Potrace Vectorization Quality Experiment

**Date:** 2025-12-31 to 2026-01-01  
**Goal:** Improve sharp symbol preservation (♯, ♭, ♮) in music notation vectorization

### The Problem
Initial vectorization with default potrace settings produced "soupy" output where sharp symbols and staff lines had filled-in intersections instead of clean, crisp geometry.

### Enhanced Script
Created `png-to-svg-potrace.sh` with 4 configurable quality presets to test different potrace parameters.

### Quality Presets Tested

| Preset | turdsize | alphamax | opttol | longcurve | File Size | Result |
|--------|----------|----------|--------|-----------|-----------|--------|
| `default` | 2 | 1.0 | 0.2 | no | 12K | Soupy, filled intersections |
| `high` | 1 | 1.0 | 0.1 | no | 13K | Still soupy |
| `max` | 0 | 1.0 | 0.05 | yes | 15K | Most detail, but still soupy |
| `sharp` | 0 | **0.8** | 0.1 | no | 12K | **✅ WINNER!** |

### Results: Sharp Preset Wins! ✅

Tested all 4 presets on `dis-mol-peters-clean-simple.png` and used `feh` for visual comparison.

**Winner:** `sharp` preset produces the cleanest output:
- ✅ Clean intersecting staff lines
- ✅ Clean intersecting noteheads  
- ✅ Sharp symbols (♯) properly rendered without "soupy" fill
- ✅ Best balance of detail preservation and clean geometry
- ✅ Compact file size (12K)

### Key Parameters That Made the Difference

1. **`turdsize=0`** - No speckle removal, preserves small details like sharp symbol crossbars
2. **`alphamax=0.8`** - Sharper corner threshold (lower than default 1.0) preserves sharp angles
3. **`opttol=0.1`** - Moderate curve optimization (balanced between fidelity and smoothness)

The critical parameter was **`alphamax=0.8`** - lowering the corner threshold from 1.0 to 0.8 made potrace preserve sharp angles instead of smoothing them into curves.

### Generated Test Outputs

```
dis-mol-peters-clean-simple-default.svg          # Original default (soupy)
dis-mol-peters-high.svg                          # High detail (still soupy)
dis-mol-peters-max.svg                           # Maximum detail (soupy, largest)
dis-mol-peters-sharp.svg                         # BEST RESULT ✅
```

Each also has a corresponding `-vectorized.png` preview file for visual comparison.

### Recommended Workflow for Music Notation

```bash
# Use sharp preset for final production
./png-to-svg-potrace.sh input.png output-name sharp
```

### Visual Comparison Command

```bash
# Compare all presets side-by-side with feh
feh input.png \
    output-default-vectorized.png \
    output-high-vectorized.png \
    output-sharp-vectorized.png \
    output-max-vectorized.png
```

Use arrow keys to flip through and compare quality.

### Conclusion

For music notation with complex intersecting geometry (staff lines, noteheads, accidentals), the **sharp preset** is the clear winner. The lower `alphamax` value (0.8 vs 1.0) preserves angular features that would otherwise be smoothed into curves, preventing the "soupy" filled-intersection problem.

---

---

## Musical Phrasing Consideration: The Fugal Statement Question

**Date:** 2026-01-02  
**Issue:** Current excerpt ends at barline after 2 measures, cutting off mid-phrase before reaching F♯

### Current State
The D♯ minor fugue subject excerpt (`dis-mol-peters-sharp.svg`) cuts off at the end of the second bar, immediately before the F♯ that would complete the subject's first phrase and reach the dominant/median.

### The Problem
- **Musically incomplete:** The subject phrase needs that F♯ to reach its harmonic goal
- **Unsatisfying:** Cuts off the exposition just before the "answer tone"
- **Arbitrary cutoff:** Ending at a barline rather than a musical phrase boundary
- Previous laptop (see `laptop.jpg`) also cut at 2 bars but had the advantage of a complete subject

### Proposed Solutions

#### Option A: F♯ Ellipsis (Conservative)
**Add the F♯ (one more beat) and sever the staff-bars like an ellipsis**

#### Pros
**Musically:**
- Completes the subject's first phrase properly
- Reaches the important harmonic goal (F♯ as the answer/dominant tone)
- More satisfying melodically - doesn't leave you hanging mid-phrase
- Shows the full contrapuntal intention

**Aesthetically:**
- "Severed staff-bars like an ellipsis" concept is visually interesting
- More sophisticated than rigid barline cutoff
- Shows musical knowledge (cutting at a phrase, not arbitrarily)
- Creates visual tension that mirrors the fugal tension
- Intentional incompleteness vs. arbitrary incompleteness

#### Cons
**Practical:**
- Need to return to GIMP and re-edit the source PNG
- Will need to re-vectorize with sharp preset
- Might need to print two test stickers to compare side-by-side
- Slightly wider sticker (one extra beat of width)

**Aesthetic Risk:**
- Could look "unfinished" if the severed staff doesn't read as intentional
- Need to ensure the cut staff-lines clearly read as ellipsis, not a mistake

---

#### Option B: Full Fugal Statement - Exposition + Answer ✨ (IDEAL)
**Three full measures: complete subject + beginning of answer entry**

#### Pros
**Musically:** ⭐⭐⭐
- **THE ESSENCE OF FUGUE** - Shows the contrapuntal relationship
- Exposition (subject) + Answer entry = complete fugal statement
- Demonstrates the tonal answer relationship (tonic → dominant)
- Musically perfect - captures the core architecture of fugue
- No ellipsis needed - the three measures ARE the complete statement
- "This is what a fugue IS" - pedagogically perfect

**Aesthetically:**
- Clean three-measure statement
- No severed bars needed - natural musical boundary
- Visually balanced horizontal composition
- Shows sophistication without tricks
- **Chef's kiss** perfect if achievable

#### Cons & Risks
**Physical Constraints:**
- **Scale/cutting test required:** At laptop size, will staff lines be too thin to cut?
- Three measures significantly wider - does it fit the laptop layout?
- May overpower Y-combinator at top (visual balance question)
- **Sharp preset may struggle** at reduced scale

**Practical:**
- More GIMP work (wider crop)
- Definitely need test print at actual laptop size
- If bars are uncuttable, fallback to Option A

**Testing Requirements:**
1. Scale test with throwaway vinyl at actual laptop dimensions
2. Does sharp preset hold up when scaled down?
3. Are staff lines physically cuttable at that scale?
4. Visual balance with overall laptop layout

### Decision Framework

**Try Option B first, fallback to Option A if needed:**

1. **GIMP:** Extend crop to full three measures (see `dis-mol-answer.png`)
2. **Vectorize** with sharp preset
3. **Scale test:** Print at actual laptop size with throwaway vinyl
4. **Decision point:**
   - ✅ Staff lines cuttable → **Option B wins** (fugal perfection)
   - ❌ Too thin/problematic → **Option A** (F♯ ellipsis still better than current)
   - If Option A needed: Can try "max" preset or artificially thicken in GIMP

### Recommendation

**Pursue Option B (three measures) with Option A as safety net.** The complete fugal statement is musically and aesthetically perfect - worth the empirical testing to see if it's physically achievable. The ellipsis option remains a solid backup that's still vastly superior to the current mid-phrase cutoff.

Since this is a permanent laptop sticker seen daily, getting the musical architecture right is worth the extra effort and test prints.

### Implementation Steps (see TODO.md)
1. Open original Peters PNG in GIMP
2. **Option B (try first):** Extend crop to include full three measures (exposition + answer)
3. Re-vectorize with sharp preset: `./png-to-svg-potrace.sh dis-mol-answer.png dis-mol-three-measures sharp`
4. **Critical test:** Print at actual laptop size with throwaway vinyl
5. Evaluate: Are staff lines cuttable? Visual balance with layout?
6. **If Option B succeeds:** Proceed to final metallic gold
7. **If Option B fails:** Fallback to Option A (F♯ ellipsis):
   - Crop to include F♯ (one more beat)
   - Create ellipsis effect by severing staff-bars
   - Re-vectorize and test
8. Compare options side-by-side before final decision

---

## Future Experiments

_Document additional technical findings here as they emerge..._
