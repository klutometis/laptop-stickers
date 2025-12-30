#!/usr/bin/env bash
#
# Compile LilyPond to PNG, then vectorize for vinyl cutting
# Usage: lilypond-to-vinyl.sh <lily-file> [dpi] [trace-mode]
#
# Examples:
#   lilypond-to-vinyl.sh bach-dis-mol-fuga.ly
#   lilypond-to-vinyl.sh bach-dis-mol-fuga.ly 600 centerline
#   lilypond-to-vinyl.sh bach-dis-mol-fuga.ly 1200 multicolor

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <lily-file> [dpi] [trace-mode]"
    echo ""
    echo "Arguments:"
    echo "  lily-file   - Input LilyPond .ly file"
    echo "  dpi         - Resolution for PNG (default: 600)"
    echo "  trace-mode  - Inkscape trace mode: centerline, multicolor, etc. (default: centerline)"
    echo ""
    echo "Trace modes:"
    echo "  centerline  - Single path along center of lines (good for music notation)"
    echo "  multicolor  - Multiple passes for different colors"
    exit 1
fi

LY_FILE="$1"
DPI="${2:-600}"
TRACE_MODE="${3:-centerline}"
BASENAME=$(basename "$LY_FILE" .ly)

# Check dependencies
for cmd in lilypond inkscape; do
    if ! command -v $cmd &> /dev/null; then
        echo "Error: $cmd not found. Please install it."
        exit 1
    fi
done

echo "Step 1: Compiling LilyPond to PNG at ${DPI} DPI..."
lilypond --png -dresolution=$DPI -o "$BASENAME" "$LY_FILE"

# LilyPond creates files like basename.png or basename-page1.png
PNG_FILE="${BASENAME}.png"
if [ ! -f "$PNG_FILE" ]; then
    # Try with -page1 suffix
    PNG_FILE="${BASENAME}-page1.png"
    if [ ! -f "$PNG_FILE" ]; then
        echo "Error: Could not find output PNG file"
        ls -la "${BASENAME}"*.png 2>/dev/null || true
        exit 1
    fi
fi

echo "Step 2: Tracing PNG to SVG using '$TRACE_MODE' mode..."

if [ "$TRACE_MODE" = "centerline" ]; then
    # Centerline trace - good for line art like music notation
    inkscape "$PNG_FILE" \
        --actions="select-all;trace-pixel-art;" \
        --export-type=svg \
        --export-filename="${BASENAME}-traced.svg"
else
    # Other trace modes
    inkscape "$PNG_FILE" \
        --actions="select-all;trace-bitmap;" \
        --export-type=svg \
        --export-filename="${BASENAME}-traced.svg"
fi

echo "Step 3: Converting strokes to paths..."
# This makes everything filled/opaque, better for cutting
inkscape "${BASENAME}-traced.svg" \
    --actions="select-all;object-stroke-to-path;export-filename:${BASENAME}-vinyl.svg;export-do;" \
    --export-overwrite

echo ""
echo "Success! Created:"
echo "  PNG:  $PNG_FILE"
echo "  SVG:  ${BASENAME}-vinyl.svg"
echo ""
echo "The SVG should now have filled paths suitable for vinyl cutting."
