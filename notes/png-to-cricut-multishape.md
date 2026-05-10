# PNG → Cricut Multi-Shape Cut Workflow

Documented from the `eos-sun.png` session (sun + cloud for Eos's laptop).

---

## Generation prompt (Nano Banana / image model)

```
Flat vector illustration for vinyl sticker, two separable die-cut shapes. A puffy
cartoon cloud (simple, rounded lobes, solid light gray silhouette, no detail) with
a radiant sun rising up from behind it — sun has a bold circular center and
evenly-spaced chunky triangular rays fanning outward from the top half. The sun and
cloud are clearly distinct shapes with a thin visible gap between them where they
meet, so each can be traced and cut separately. No gradients, no shading, no text,
no shadows. Thick clean outlines. White background. Front-facing, centered
composition. Style: simple, graphic, bold — suitable for Cricut vinyl cut file.
```

Output had color and gradients despite the prompt — the sun faded from yellow to
near-white toward the highlight, which defeats a naive trace.

---

## The Workflow (Manual, Proven)

### a) Generate image
Prompt as above. `eos-sun.png` — sun + cloud, white background, colored with gradients.

### b) Make monochrome in GIMP
Open in GIMP. Use **Fuzzy Select** / **Select by Color** to select each shape,
bucket-fill solid black. Goal: flat black shapes on white — no color, no gradients.

This is the whole point of the manual step. The color and gradients in the generated
image are what break the trace; removing them is the fix.

Output: `eos-sun-filled.png`

### c) Single-scan trace in Inkscape
**File → Import** the filled PNG. Select it, **Path → Trace Bitmap**.

Single scan, brightness cutoff. Produces a compound `<path>` — the cloud body has
the sun disc as a punched hole (even-odd fill).

Output: `eos-sun.svg`

### d) Break Apart in Inkscape
1. Select the traced path → **Path → Break Apart**
2. Select sun disc + all rays → **Path → Union**
3. Two separate path objects: cloud and sun

### e) Weld in Cricut Design Space
Select the sun shapes (disc + rays) → **Weld** → one unified cut silhouette.
**Weld** merges touching/overlapping shapes into one outline so disc + rays cut
as a single piece.

---

## Future experiments: prompt strategy for cleaner vectorization

The current prompt is heavy on negative directives (*no gradients, no shading, no
shadows*). Diffusion models are trained on colorful, shaded, detailed imagery —
those directives swim upstream against the model's priors, which is likely why the
sun leaked a yellow→white gradient anyway.

### Two-pass approach (recommended to try)

**Pass 1 — permissive geometry prompt.** Constrain only the structure, not the
color. Let the model be creative. Something like:

> *Flat graphic illustration for a vinyl sticker. [subject]. Two clearly distinct
> bold shapes with a visible gap between them. Solid flat fills, thick clean
> outlines, white background.*

No negative directives. Flat cartoon shapes come naturally when the subject calls
for it.

**Pass 2 — mechanical monochrome, no model needed.** If Pass 1 produces flat solid
fills (not gradients), a simple threshold does the job — no GIMP:

```bash
convert input.png -threshold 50% output-bw.png
```

The gradient only required manual GIMP work because Pass 1 leaked shading. Fix the
prompt and the monochrome step becomes a one-liner.

**Pass 2 fallback — model-assisted monochrome.** If gradients still leak, feed the
output back into Nano Banana: *"convert this to flat black silhouettes on white
background, no color, no gradients."* Use this only if the threshold approach fails.

### Monochrome from the start (alternative)

Ask for B&W outlines in the initial prompt. Simpler pipeline, but risks
constrained composition — worth a test but two-pass is the safer bet.

---

## Files

| File | Role |
|------|------|
| `eos-sun.png` | Generated source PNG |
| `eos-sun-filled.png` | GIMP monochrome (solid black shapes) |
| `eos-sun.svg` | Final traced SVG — base for Cricut |
