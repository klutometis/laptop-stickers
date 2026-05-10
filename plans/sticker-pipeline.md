# Sticker Pipeline — Web App

A reusable web app for generating vinyl-cuttable laptop stickers (and eventually
3D-printable assets) end-to-end: idea → prompt → image → monochrome → SVG.

**Status**: planned, not started. Target location: `sticker-pipeline/` here for
now; fork to its own repo if it earns it.

---

## Goals

- **As little manual work as possible** — current workflow is GIMP + Inkscape +
  Cricut, with manual fill-in and trace clicks. Automate everything except the
  weld step in Cricut Design Space (no CLI for that).
- **Human checkpoints** at every transition between models — generation,
  refinement, monochrome — with regenerate / approve / compare buttons.
- **Compare models side by side**, especially for prompt refinement and image
  generation. Multi-select model lists, run the Cartesian product, eyeball the
  diversity.
- **Reusable** for the upcoming 3D-printing project. Same idea-to-asset shape,
  different terminal step (G-code instead of SVG).

---

## Tech stack

- **Next.js (App Router)** — single project, dev mode locally, no deployment
  needed unless we want to share it.
- **Vercel AI SDK** (`ai`, `@ai-sdk/openai`, `@ai-sdk/google`,
  `@ai-sdk/anthropic`) — handles **both** text and image generation uniformly
  via `generateText` and `generateImage`.
- **sharp** (Node) — fast monochrome threshold, no ImageMagick shell-out.
- **potrace** + **inkscape** — invoked via shell from API routes, same as the
  existing scripts in this repo.

---

## Models (current, May 2026)

### Text models (prompt refinement)
| Provider | Model ID | Notes |
|---|---|---|
| Anthropic | `claude-opus-4-7` | Apr 2026 flagship |
| OpenAI | `gpt-5.5` | Apr 2026 flagship |
| Google | `gemini-3.1-pro-preview` | Feb 2026, latest Pro |

All via Vercel AI SDK `generateText`. Multi-select.

### Image models (generation)
| Provider | Model ID | Notes |
|---|---|---|
| Google | `gemini-3.1-flash-image-preview` | Nano Banana 2 |
| OpenAI | `gpt-image-2` | Latest GPT Image (string ID; not yet in Vercel's table but the SDK accepts arbitrary IDs) |

All via Vercel AI SDK `generateImage` (`google.image(...)`, `openai.image(...)`).
Multi-select. Easy to add Nano Banana Pro or other models later.

**Caveat**: Gemini image models don't support the `n` parameter. For *n* images
per cell, call `generateImage` *n* times in parallel via `Promise.all`. Same
pattern works for OpenAI — keep it uniform across providers.

---

## Pipeline

### 1. Idea → Refined prompt
- Free-text input ("sun and cloud for Eos's laptop").
- User multi-selects from text models.
- For each selected model: call `generateText` with a system prompt tuned for
  vinyl-cutout sticker constraints (flat fills, separable shapes, clean
  outlines, white background — see "Prompt strategy" below).
- Show all refined prompts side by side.
- User edits any of them inline, picks which ones to feed forward.

### 2. Refined prompts → Generated images
- User multi-selects from image models. User picks *n* (default 4).
- Run the Cartesian product: each selected prompt × each selected image model
  × *n* images = grid.
- Display as a table: rows = prompt-model (which prompt was used), columns =
  image-model. Each cell shows *n* thumbnails.
- Click any thumbnail to select it for the next step. Regenerate any cell
  individually.

### 3. Selected image → Monochrome
- **Default fast path**: `sharp` threshold (e.g. 50%) → preview alongside
  original. Free, instant.
- **If threshold leaks gradient**: button to retry with an AI pass — feed the
  colored image to an image model with "convert to flat black silhouettes on
  white, no color, no gradients." Slower, costs tokens.
- User approves the monochrome before vectorization.

### 4. Monochrome → SVG
- Shell out to `potrace` (mirroring `png-to-svg-potrace.sh` in this repo, sharp
  preset by default).
- Trim ink bounds via `inkscape --export-area-drawing`.
- Render the SVG inline; download button.

### 5. Optional: Break apart for multi-shape stickers
- Toggle: "Break compound path into separate shapes."
- Shell out to `inkscape --actions="select-all;path-break-apart;..."`.
- User welds in Cricut Design Space afterward (no CLI for Cricut).

---

## Prompt strategy (for the system prompt in step 1)

From `notes/png-to-cricut-multishape.md`:
- **Permissive geometry, no negative directives.** Negative directives ("no
  gradients, no shadows") fight diffusion model priors and leak anyway.
- Constrain only what we need: flat solid fills, clean separable shapes, thick
  clean outlines, white background.
- Pass the user's idea verbatim; let the text model expand it into a
  vinyl-friendly prompt.

If the threshold step in pipeline-3 still leaks, that's the signal to either
adjust the system prompt or fall back to the AI monochrome pass.

---

## UI sketch

```
┌─────────────────────────────────────────────────────┐
│ 1. Idea                                             │
│    [textarea: sun and cloud for Eos's laptop]       │
│    Refine with: ☑ Claude  ☑ GPT-5.5  ☑ Gemini       │
│    [Refine]                                         │
├─────────────────────────────────────────────────────┤
│ 2. Refined prompts (3)                              │
│    [Claude prompt — editable]   [pick]              │
│    [GPT-5.5 prompt — editable]  [pick]              │
│    [Gemini prompt — editable]   [pick]              │
│    Image models: ☑ NB2  ☑ gpt-image-2                  │
│    n per cell: [4]                                  │
│    [Generate 24 images]                             │
├─────────────────────────────────────────────────────┤
│ 3. Image grid                  prompt × imageModel  │
│         NB2       gpt-image-2                       │
│ Claude  [4 imgs]  [4 imgs]                          │
│ GPT     [4 imgs]  [4 imgs]                          │
│ Gemini  [4 imgs]  [4 imgs]                          │
│    Click to select; "regenerate" per cell           │
├─────────────────────────────────────────────────────┤
│ 4. Monochrome                                       │
│    [original] [threshold preview]                   │
│    [Looks good] [Try AI monochrome]                 │
├─────────────────────────────────────────────────────┤
│ 5. Vectorize                                        │
│    [SVG preview]   [Download SVG]                   │
│    ☐ Break apart compound path                      │
└─────────────────────────────────────────────────────┘
```

---

## Cost notes

3 text × 2 image × n=4 = **24 images per run**. At gpt-image-2 medium quality
(~$0.05/image) and Nano Banana 2, a full sweep is on the order of $1.
Cheap enough to experiment freely.

Throttle the parallel `Promise.all` to ~4 concurrent requests to avoid rate
limits.

---

## Open questions / decisions deferred

- **Web vs. CLI for the comparison UI** — going web-app for now. Reconsider if
  it turns out we don't need the side-by-side experience.
- **Persistence** — start ephemeral (in-memory + browser state). Add disk save
  for runs we want to keep, later.
- **Auth / sharing** — none for now; local dev only. Revisit if it gets forked
  to a public app.
- **Reusing for 3D printing** — same first 2 steps, then branch: instead of
  monochrome → potrace → SVG, it's image → depth map → STL → G-code. Keep
  step boundaries clean so the back half can swap.

---

## Out of scope (for now)

- The Cricut weld step. No CLI; user does it manually after downloading SVG.
- LilyPond and LaTeX-derived stickers (already covered by existing scripts in
  this repo).
- Multi-color SVG separation by color region. The Inkscape Break Apart workflow
  is good enough.
