# Vectorization modes & material reality check

The original goal of this project: **simple, monochromatic, cuttable shapes**.
Y-combinator logo, Bach fugue, Church numerals — all came from clean
monochrome sources (LaTeX, LilyPond, scanned-and-cleaned Peters edition).
Then potrace, then Cricut, then vinyl. End to end, one color of vinyl per
sticker. That's still the goal.

The AI image generation pipeline (`sticker-pipeline/`) produces *colorful*
imagery, which drifts from that goal. NB2 and gpt-image-2 both default to
filled cartoon styles regardless of how hard you prompt for "flat black on
white." This doc is about what to do about that — the three viable cut
workflows from a generated image, what each requires materially, and which
ones we can actually do with what we have on hand.

---

## Current materials

- **Vinyl sticker sheets** — adhesive vinyl (cold cut, no printing). The
  original target. Cricut cuts a shape, you weed and apply.
- **Don't have** — laser-printable adhesive sticker paper. Would need to
  order if we want print-then-cut.

## Cut workflows by mode

### 1. Silhouette — single-color vinyl cut (current pipeline)

The status-quo workflow and the original project goal.

- **Input**: any image, gets thresholded to monochrome.
- **Pipeline**: image → `sharp` threshold → `potrace` → SVG (one path).
- **Cricut**: load SVG, cut on one color of vinyl, weed, apply.
- **Material**: regular adhesive vinyl. ✅ have it.
- **Best for**: single-shape stickers, monograms, logos, music notation,
  symbols. Anything where the "design" is a silhouette.
- **Bad for**: anything with internal color structure. Bright-yellow regions
  get lost to the threshold; multi-shape designs collapse into a blob.
- **AI-gen fit**: bad. Most AI output is colorful and rich; throwing all of
  that away to get a silhouette defeats the purpose of generating with these
  models. Better to start from a clean monochrome source.

### 2. Print-then-cut — printable sticker paper, full-color

Industry-standard kiss-cut sticker workflow.

- **Input**: full-color image + outer outline path.
- **Pipeline**:
  1. Background-remove the image (alpha threshold on near-white pixels, or
     small local model like `@imgly/background-removal-node`, or a hosted
     model like Replicate).
  2. Get the outer contour of the resulting opaque region (largest
     connected component, optionally dilated by a few px so the cut sits
     just outside the artwork).
  3. Output: original PNG (printable) + SVG with one outer-outline path.
- **Cricut**: print the PNG on printable sticker paper using your laser
  printer; load the cut sheet into Cricut; the machine reads the
  registration marks and cuts along the outline.
- **Material**: laser-printable adhesive sticker paper. ❌ don't have. See
  "Materials to order" below.
- **Best for**: colorful AI-generated stickers, photo-style stickers,
  detailed illustrations.
- **AI-gen fit**: ✅ excellent. Keeps every pixel the model produced. The
  cute sun-and-cloud images we just generated would work great here.

### 3. Color separation — multi-color layered vinyl cut

Each color region becomes its own SVG path; cut each on a different vinyl
color, layer them on the laptop. This is what we did manually for
`eos-sun.png` (GIMP fill + Inkscape multi-scan trace + Break Apart + Weld in
Cricut).

- **Input**: image with distinct color regions.
- **Pipeline**:
  1. Inkscape CLI multi-scan trace: `--actions="select-all;object-trace:N,...,..."`
     where N = number of distinct colors. Produces a single compound SVG
     with N stacked paths.
  2. `Path > Break Apart` to split the compound path into separate paths
     by color region.
  3. Optional manual cleanup: union touching subpaths (e.g. sun disc + rays).
- **Cricut**: load SVG, each color is auto-detected as a separate cut layer,
  cut each on different vinyl, layer them.
- **Material**: regular adhesive vinyl in multiple colors. ✅ have it.
- **Best for**: 2–3 color stickers where the colors carry meaning (sun =
  yellow, cloud = gray). Heavier workflow; hand-aligning layered vinyls
  takes more skill than weeding a single shape.
- **AI-gen fit**: ⚠️ workable but fiddly. AI output usually has too many
  colors / too much shading; multi-scan trace produces messy paths unless
  you flatten in GIMP first (the manual step we hit on `eos-sun.png`). Not
  much better than just hand-cleaning a reference image.

---

## Recommendation for this project

Honestly: the AI pipeline is fun but **mode 1 with monochrome source images
is still the right answer for most laptop stickers**. The pieces we've made
that work — Bach, Church, Y-combinator — all came from clean monochrome
sources. The pipeline's value is for *one-off cute things* like Eos's
sun-and-cloud, and for those, mode 2 (print-then-cut) is the natural fit
once we have the paper for it.

For now:
- **Keep the existing silhouette pipeline** as-is in `sticker-pipeline/`. It
  works, it matches our materials, it's good enough for AI-gen output that
  reduces cleanly to monochrome (rare, but possible with the right prompt).
- **Don't add modes 2/3 to the code yet.** Order printable sticker paper
  first; revisit print-then-cut once the material is in hand.
- **Consider seriously**: for actual project goals (math + music laptop),
  start from monochrome sources and skip AI altogether. AI is fun for the
  daughter sticker, less so for "Bach fugue in metallic silver."

---

## Materials to order (for print-then-cut, mode 2)

Search results (May 2026):

- **[Cricut Printable Vinyl, 25 sheets, laser, 8.5×11](https://www.amazon.com/Cricut%C2%AE-Printable-Vinyl-Laser-Printers/dp/B0FBY5T7BR)**
  — first-party Cricut option, white, laser-only. Probably the safest bet
  for compatibility with the registration-mark workflow.
- **[Amazon: laser printable vinyl (general search)](https://www.amazon.com/laser-printable-vinyl/s?k=laser+printable+vinyl)**
  — third-party options, often cheaper.
- **[Amazon: printable vinyl sticker paper for laser printer](https://www.amazon.com/printable-vinyl-sticker-paper-laser-printer/s?k=printable+vinyl+sticker+paper+for+laser+printer)**
  — broader search.

Things to check before ordering:
- **Laser** vs **inkjet** — they're different. Make sure the paper matches
  your printer.
- **Matte** vs **glossy** — matte hides print imperfections better; glossy
  pops more on dark laptop lids.
- **Waterproof** — useful for laptop stickers if you ever spill. Most
  modern adhesive vinyls are; double-check the listing.
- **Sheet size** — 8.5×11 letter is standard for home printers; Cricut Maker
  accepts mats up to 12×24, but anything wider than 8.5 needs a wide-format
  printer.

---

## Implementation cost (for future reference)

If/when we add modes 2 and 3 to the pipeline:

**Mode 2 (print-then-cut)**: small. ~1 day work.
- Background removal: `sharp` alpha threshold for the easy case (clean
  white bg), fallback to `@imgly/background-removal-node` for the hard case.
- Outline extraction: invert mask → potrace → keep largest path.
- Optional outline dilation: `sharp` `extend` + morphology, or in SVG with
  a stroke + flatten.
- UI: add mode selector in step 4 of the pipeline. Outputs both the colored
  PNG and the cut-line SVG.

**Mode 3 (color separation)**: medium. ~2–3 days.
- Inkscape CLI multi-scan trace.
- Heuristics for color count (2–4 typically).
- Optional flattening pass — auto-equivalent of the manual GIMP fill step,
  via `sharp` color quantization.
- Break-apart automation already exists (the `breakApart` toggle on the
  vectorize route uses it).
- UI: same mode selector, plus a slider for "number of colors."

**None of this is urgent**. We have a working silhouette pipeline. The
materials gate decides whether mode 2 is worth building (need the paper).
Mode 3 has a clear manual escape hatch (we did it for eos-sun) and is rare
enough that automating it isn't a big win.
