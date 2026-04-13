#!/usr/bin/env bash
#
# tex-to-sticker.sh — Compile a LaTeX file into sticker-ready outputs
#
# Produces:
#   <name>-cropped.pdf  — tightly cropped PDF (no margins, no page numbers)
#   <name>.svg           — clean vector SVG, trimmed to ink bounds (for Cricut / vinyl cutting)
#   <name>.png           — high-res raster preview
#
# Usage:
#   ./tex-to-sticker.sh input.tex [dpi]
#
# Dependencies: xelatex, pdfcrop, inkscape, pdftoppm
#
# The input .tex file should include \pagestyle{empty} to suppress page
# numbers. This script will still work without it, but pdfcrop will
# include the page number in the bounding box.

set -euo pipefail

# --- Dependency check ---
missing=()
for cmd in xelatex pdfcrop inkscape pdftoppm; do
    command -v "$cmd" &>/dev/null || missing+=("$cmd")
done
if (( ${#missing[@]} > 0 )); then
    echo "Error: missing dependencies: ${missing[*]}" >&2
    echo "  xelatex, pdfcrop — TeX Live (texlive-extra-utils)" >&2
    echo "  inkscape          — Inkscape (inkscape)" >&2
    echo "  pdftoppm          — poppler-utils" >&2
    exit 1
fi

# --- Arguments ---
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 input.tex [dpi]" >&2
    exit 1
fi

input="$1"
dpi="${2:-600}"

if [[ ! -f "$input" ]]; then
    echo "Error: file not found: $input" >&2
    exit 1
fi

name="${input%.tex}"
dir="$(dirname "$input")"

echo "=== tex-to-sticker: $input ==="
echo "    DPI: $dpi"

# --- Step 1: Compile with xelatex ---
echo "[1/4] Compiling LaTeX..."
xelatex -interaction=nonstopmode -output-directory="$dir" "$input" >/dev/null 2>&1
echo "      -> ${name}.pdf"

# --- Step 2: Crop margins ---
echo "[2/4] Cropping margins..."
pdfcrop "${name}.pdf" "${name}-cropped.pdf" >/dev/null 2>&1
echo "      -> ${name}-cropped.pdf"

# --- Step 3: PDF -> SVG via Inkscape ---
echo "[3/5] Converting to SVG..."
# Inkscape converts PDF to SVG with text as paths (essential for cutting)
inkscape "${name}-cropped.pdf" --export-type=svg --export-filename="${name}.svg" 2>/dev/null
echo "      -> ${name}.svg"

# --- Step 4: Trim SVG to ink bounds ---
echo "[4/5] Trimming SVG to ink bounds..."
# Remove whitespace around actual drawing — critical for Cricut sizing
inkscape "${name}.svg" \
    --export-area-drawing \
    --export-type=svg \
    --export-filename="${name}.svg" \
    --export-overwrite 2>/dev/null
echo "      -> ${name}.svg (trimmed)"

# --- Step 5: PDF -> PNG preview ---
echo "[5/5] Generating PNG preview..."
pdftoppm -png -r "$dpi" -singlefile "${name}-cropped.pdf" "${name}"
echo "      -> ${name}.png"

# --- Cleanup auxiliary files ---
rm -f "${name}.aux" "${name}.log" "${name}.out" "${name}.fls" "${name}.fdb_latexmk"

echo "=== Done! ==="
echo ""
echo "Outputs:"
echo "  ${name}-cropped.pdf  (cropped PDF)"
echo "  ${name}.svg           (vector SVG for Cricut)"
echo "  ${name}.png           (${dpi} DPI raster preview)"
