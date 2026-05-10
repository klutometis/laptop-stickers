# sticker-pipeline

Idea → prompt → image → monochrome → SVG, end-to-end. See
`../plans/sticker-pipeline.md` for the full design.

## Setup

```bash
cp .env.local.example .env.local   # then fill in the keys
npm install
npm run dev
```

System dependencies (already present on this machine):
- `potrace` (Ubuntu: `sudo apt install potrace`)
- `inkscape` (Ubuntu: `sudo apt install inkscape`)
- `convert` from ImageMagick (Ubuntu: `sudo apt install imagemagick`)

## Pipeline

1. **Idea** — free text + multi-select text models (Claude Opus 4.7, GPT-5.5,
   Gemini 3.1 Pro). Refines into vinyl-cut-friendly prompts.
2. **Generate** — multi-select image models (Nano Banana 2, GPT Image 2),
   pick *n*. Cartesian product: each refined prompt × each image model × *n*.
3. **Pick** — click a thumbnail in the grid.
4. **Monochrome** — `sharp` threshold (0–255 slider).
5. **Vectorize** — `potrace` (sharp preset by default) + `inkscape` trim.
   Optional `Path > Break Apart` for multi-shape stickers.
   Download the SVG → upload to Cricut Design Space → Weld in the UI.

## Notes

- Concurrency is throttled to 4 cell-tasks at a time in the image route.
- Gemini image models don't support the `n` API parameter; we call *n* times in
  parallel (uniform pattern across providers).
