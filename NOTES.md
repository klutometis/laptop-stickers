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

## Color Decision: D# Minor and the Case for Silver

**Date:** 2026-04-11
**Prompt:** "I don't know if it's a Latvian thing or whatever; but all of my jewelry (namejs ring, etc.) has always been silver; gold has always looked somewhat alien. I don't natively identify with it. I'm not sure whether that means to go silver or whatever... I just wish there was some mechanism to make it feel less arbitrary. When I was in college, I remember there was some wooish synaesthetic key / color association that someone made. Has anyone 'assigned' a color to D# minor or D# by itself?"

### Scriabin's Color System (Clavier a Lumieres)

Alexander Scriabin created a tone-to-color mapping for his orchestral work *Prometheus: Poem of Fire* (1910), played on a "clavier a lumieres" (keyboard of lights). His system maps the circle of fifths to the visible spectrum.

**D# (Eb) = "flesh" with a "glint of steel"**

Full Scriabin mapping (chromatic):

| Note | Color |
|------|-------|
| C | Red (intense) |
| C# | Violet or purple |
| D | Yellow |
| **D#** | **Flesh (glint of steel)** |
| E | Sky blue (moonshine or frost) |
| F | Deep red |
| F# | Bright blue or violet |
| G | Orange |
| G# | Violet or lilac |
| A | Green |
| A# | Rose or steel |
| B | Blue or pearly blue |

Scriabin also stated: *"Flat keys have some sort of **metallic sheen**, while sharp keys are bright, saturated with color and without any of the metallic hue."*

Source: Wikipedia "Clavier a lumieres"; Galeyev & Vanechkina (2001) "Was Scriabin a Synesthete?" in *Leonardo* 34(4):357-362.

### Rimsky-Korsakov's Color Associations

Rimsky-Korsakov, who was considered an actual synesthete (unlike Scriabin, whose status is debated), also associated keys with colors.

**Eb major = "bluish-grey" or "steely"**

This is one of the few keys where Scriabin and Rimsky-Korsakov **actually agreed**: both perceived D#/Eb as having a steely, metallic quality. They famously disagreed on most other keys (e.g., C major: Scriabin said red, Rimsky-Korsakov said white; F# major: Scriabin said bright blue, Rimsky-Korsakov said green).

Source: Rachmaninoff's *Recollections*; Tom Douglas Jones, *The Art of Light & Color* (1972); composersdatebook.org archives.

### Schubart's Key Characteristics (1806)

Christian Schubart's *Ideen zu einer Aesthetik der Tonkunst* (1806) assigns emotional/poetic characteristics to every key. On D# minor:

> *"Feelings of the anxiety of the soul's deepest distress, of brooding despair, of blackest depression, of the most gloomy condition of the soul. Every fear, every hesitation of the shuddering heart, breathes out of horrible D# minor. **If ghosts could speak, their speech would approximate this key.**"*

Charpentier (1692) on Eb minor: **"Horrible, frightful."**

### Conclusion: Silver Is the Canonical Color for D# Minor

Both Scriabin and Rimsky-Korsakov converge on **steel / metallic grey-blue** for D#/Eb. This is not arbitrary — it's the one key where the two most famous key-color systems agree, and they both point to the same metallic quality.

The personal affinity for silver (Latvian jewelry tradition, namejs ring, etc.) aligns with the historical-musical association. Silver is not a default or a compromise; it's the *correct* color for this key.

### Color Plan

| Sticker | Color | Rationale |
|---------|-------|-----------|
| **Bach D# minor fugue** (bottom) | **Brushed silver / steel** | Scriabin + Rimsky-Korsakov both assign D#/Eb a steely, metallic sheen. Historically grounded. |
| **Church numerals** (top) | **White** | Pure, clean, maximal contrast on dark laptop. White = pure abstraction. Also contrasts with silver below (matte vs metallic). |

Alternative: Both in silver (unified premium feel, different sizes create visual contrast). But white Church + silver Bach creates a nice texture/luminosity distinction: matte white for the mathematical abstraction, metallic sheen for the musical one.

### The Ghost Line

If anyone asks why silver: *"If ghosts could speak, their speech would approximate this key."* — Schubart, 1806.

Silver is the color of ghosts.

---

## Latin Inscription: "Molesta Placidis, Amica Saevis"

**Date:** 2026-04-12

### Source Text

"Molesta placidis, amica saevis" — a medieval compression of Aesop's fable "The Crow and the Sheep" (Perry Index 553). Translation: "Troublesome to the peaceful, friendly to the savage."

The fable: A crow lands on a sheep's back and the sheep bears it patiently. The crow would never dare land on a dog. The moral: bullies only torment those who won't fight back; they're sycophants to the powerful.

### Layout Concept

Four Latin words flanking the Church numerals in blood red:

```
MOLESTA       PLACIDIS
      [Church]
  AMICA       SAEVIS
```

The contrast stack:
- **Font:** Ancient Roman inscriptional majuscule vs. Computer Modern (modern, elegant, mathematical)
- **Color:** Blood red vs. white
- **Language:** Latin vs. lambda calculus
- **Register:** Moral/savage vs. abstract/pure
- **Era:** 1st century Rome vs. 1936 (Church's paper)

### Font Research

#### Requirements
- Authentic Roman inscriptional or monumental capitals
- All-majuscule (caps only)
- Aggressive visual weight
- Available as OTF/TTF (for XeLaTeX + fontspec)
- Must survive vinyl cutting at sticker scale (no hairline strokes)

#### Fonts Evaluated

**Tier 1: Free, immediately available**

1. **Cinzel (Bold/Black)** — Google Font, free (SIL OFL)
   - Designer: Natanael Gama
   - Inspired by 1st century Roman inscriptions, modern reinterpretation
   - Good quality but 3rd-hand from actual Roman sources
   - Also available: Cinzel Decorative (more ornamental)
   - On CTAN, LaTeX-ready

2. **ruscap** (Rustic Capitals) — CTAN, free (SIL OFL)
   - Designer: Victor Sannier, 2024
   - METAFONT only (no OTF/TTF) — works with pdflatex, not xelatex
   - Authentic rustic capitals, angular and compressed
   - Tested: works but bitmap rendering (METAFONT pk fonts), not vector-quality

**Tier 2: Premium**

3. **Pietra LP** — LetterPerfect, $39 (MyFonts) ← CHOSEN
   - Designer: Garrett Boge, 1996
   - Based on the **five-foot-tall mosaic lettering in St. Peter's Basilica, Rome**
   - Original research in Rome — 1st-hand source
   - All-majuscule, heavy monumental strokes, sharp serifs
   - Includes small caps (scaled to mimic foreshortened view from basilica floor)
   - OpenType: stylistic alternates, swashes, contextual ligatures, titling variants
   - OTF format — works with XeLaTeX + fontspec
   - **Best for vinyl cutting:** thick confident strokes, no hairlines
   - https://www.myfonts.com/collections/pietra-font-letterperfect

4. **Cresci** — LetterPerfect, ~$39
   - Designer: Garrett Boge + Giovan Francesco Cresci (16th c. Vatican calligrapher)
   - Elegant, calligraphic, delicate hairlines
   - Beautiful but too refined for this project; hairlines would not survive cutting
   - Better suited for formal invitations than aggressive moral philosophy

5. **Pontif** — LetterPerfect, ~$39
   - Designer: Garrett Boge
   - Middle ground between Pietra and Cresci
   - Dignified but not aggressive enough for the contrast we want

6. **Trajan Pro 3** — Adobe, ~$35/style
   - Designer: Carol Twombly, 1989
   - Based on Trajan's Column (via photographs — 2nd-hand)
   - Six weights, Extra Light to Black
   - Canonical Roman inscriptional font but overused (every Hollywood epic poster)

7. **Stevens Titling** — Linotype, ~$35/style
   - Designers: John Stevens + Ryuichi Tateno, 2011
   - Takes inscriptional capitals "back to their brush-painted roots"
   - Four variants: Sable Brush, Flat Nib, Pointed Pen, etc.
   - Organic texture from brush origin — viscerally aggressive
   - 1st-hand (process-authentic: recreates the brush technique that preceded carving)

8. **Augustea** — various foundries, ~$20-35
   - Designers: Aldo Novarese + Alessandro Butti, 1951 (Nebiolo foundry)
   - Named after Augustus — imperial register
   - Elegant but less aggressive

9. **PKG Roman Capitals** — Fontspring, ~$22
   - Designer: Lazar Dimitrijević
   - Scholarly, educational feel
   - Full Latin + Cyrillic

10. **Juan-José Marcos paleographic fonts** — typofonts.com, €20/font or €120 for 20
    - Professor of classical languages (Plasencia, Spain)
    - Facsimile-level reconstructions: Capitalis Rustica, Elegans, Monumentalis, etc.
    - Most historically authentic *manuscript* reproductions available
    - Not TTF-native in the usual sense; aimed at paleography scholars

#### Provenance Chain (degree of separation from Rome)

| Font | Source | Separation |
|------|--------|------------|
| Pietra | Boge studying mosaics in St. Peter's directly | **1st hand** |
| Pontif/Cresci | Boge's original research in Rome | **1st hand** |
| Stevens Titling | Master calligrapher recreating Roman brush technique | **1st hand (process)** |
| Trajan Pro | Twombly studying *photographs* of Trajan's Column | 2nd hand |
| Cinzel | Gama *inspired by* Roman inscriptions, modern reinterpretation | 3rd hand |

#### Decision: Pietra LP

Pietra wins on every axis:
1. **Provenance:** 1st-hand research at St. Peter's Basilica
2. **Weight:** Heavy monumental strokes survive vinyl cutting
3. **Contrast:** Maximum visual contrast with delicate Computer Modern lambdas
4. **Naming:** "Pietra" = stone. The inscription *is* stone.
5. **Price:** $39 is reasonable for a historically researched, single-designer font

---

## Future Experiments

_Document additional technical findings here as they emerge..._
