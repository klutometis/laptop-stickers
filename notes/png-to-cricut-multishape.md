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

## Future experiments

- **Monochrome from the prompt**: ask the model for black-and-white outlines from
  the start. Risk: may constrain the model's composition creativity.
- **Model for the monochrome step**: instead of GIMP, feed the colored output back
  into Nano Banana / img2img to convert to flat monochrome before tracing.

---

## Files

| File | Role |
|------|------|
| `eos-sun.png` | Generated source PNG |
| `eos-sun-filled.png` | GIMP monochrome (solid black shapes) |
| `eos-sun.svg` | Final traced SVG — base for Cricut |
