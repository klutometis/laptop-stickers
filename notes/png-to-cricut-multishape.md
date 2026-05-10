# PNG → Cricut Multi-Shape Cut Workflow

Documented from the `eos-sun.png` session (sun image for Eos's laptop).

---

## The Problem

The source PNG had two distinct shapes to cut separately (cloud, sun+rays) from different vinyl sheets. The naive Inkscape trace missed part of the sun because it faded from yellow to near-white toward the highlight — indistinguishable from the white background by brightness alone.

---

## The Workflow (Manual, Proven)

### a) Source image
Start with a clean PNG. `eos-sun.png` — sun with cloud, white background.

### b) Fill shapes solid in GIMP
Open the PNG in GIMP. Use **Fuzzy Select** or **Select by Color** to select each shape region, bucket-fill solid black. Goal: clean black shapes on white, no gradients or anti-aliasing ambiguity.

This is what fixes the fading-to-white problem that defeats the trace.

Output: `eos-sun-filled.png`

### c) Trace in Inkscape
**File → Import** the filled PNG. Select it, **Path → Trace Bitmap**.

Settings:
- Mode: **Multiple scans → Colors**, **2 scans**
- ☑ Smooth, ☑ Stack scans, ☑ Remove background

Produces a single compound `<path>` with subpaths — the cloud body has the sun disc as a punched hole (even-odd fill).

Output: `eos-sun.svg`

### d) Break Apart in Inkscape
1. Select the traced path → **Path → Break Apart**
2. Select sun disc + all rays → **Path → Union**
3. Now you have two separate path objects: cloud and sun

### e) Weld in Cricut Design Space
Import the SVG. Select the sun shapes (disc + rays) → **Weld** → one unified cut silhouette.

**Weld** (not Attach, not Flatten) merges touching/overlapping shapes into one outline — right for cutting disc + rays as one piece from a single vinyl sheet.

---

## Automation Potential

| Step | Automatable? | Notes |
|------|-------------|-------|
| b) Fill in GIMP | Partially | Hue-based selection can work but GIMP interactive is faster for irregular shapes |
| c) Inkscape trace | Yes | `inkscape --actions="select-all;object-trace:2,..."` |
| d) Break Apart + Union | Partially | Scriptable via Inkscape actions; identifying which subpaths belong together requires spatial heuristics |
| e) Cricut Weld | No | No CLI for Cricut Design Space |

---

## Files

| File | Role |
|------|------|
| `eos-sun.png` | Original source PNG |
| `eos-sun-filled.png` | GIMP-filled (solid shapes) |
| `eos-sun-traced.png` | Single-color trace (reference) |
| `eos-sun.svg` | 2-scan compound path — base for Cricut |
