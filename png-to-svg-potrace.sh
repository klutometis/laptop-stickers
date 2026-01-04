#!/usr/bin/env bash
#
# Convert PNG to SVG using potrace (simpler alternative to Inkscape CLI)
# Usage: png-to-svg-potrace.sh <png-file> [output-name] [quality-preset]
#
# Quality presets:
#   default  - Standard quality (turdsize=2, alphamax=1.0, opttol=0.2)
#   high     - Higher detail preservation (turdsize=1, alphamax=1.0, opttol=0.1)
#   max      - Maximum detail (turdsize=0, alphamax=1.0, opttol=0.05, no curve opt)
#   sharp    - Best for sharp symbols (turdsize=0, alphamax=0.8, opttol=0.1)
#
# Examples:
#   png-to-svg-potrace.sh dis-mol-peters-clean-simple.png
#   png-to-svg-potrace.sh dis-mol-peters-clean-simple.png dis-mol-peters high
#   png-to-svg-potrace.sh music-score.png output sharp

set -euo pipefail

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <png-file> [output-name] [quality-preset]"
    echo ""
    echo "Arguments:"
    echo "  png-file        - Input PNG file"
    echo "  output-name     - Optional output filename (without extension)"
    echo "  quality-preset  - Quality preset: default|high|max|sharp (default: default)"
    echo ""
    echo "Quality presets:"
    echo "  default - Standard quality (turdsize=2, alphamax=1.0, opttol=0.2)"
    echo "  high    - Higher detail (turdsize=1, alphamax=1.0, opttol=0.1)"
    echo "  max     - Maximum detail (turdsize=0, alphamax=1.0, opttol=0.05, --longcurve)"
    echo "  sharp   - Best for sharp symbols like music notation (turdsize=0, alphamax=0.8, opttol=0.1)"
    echo ""
    echo "Examples:"
    echo "  $0 dis-mol-peters-clean-simple.png"
    echo "  $0 dis-mol-peters-clean-simple.png dis-mol-peters high"
    echo "  $0 music-score.png output sharp"
    exit 1
fi

PNG_FILE="$1"
OUTPUT_NAME="${2:-$(basename "$PNG_FILE" .png)}"
QUALITY_PRESET="${3:-default}"

# Check if PNG exists
if [ ! -f "$PNG_FILE" ]; then
    echo "Error: PNG file '$PNG_FILE' not found"
    exit 1
fi

# Set potrace parameters based on quality preset
case "$QUALITY_PRESET" in
    default)
        TURDSIZE=2
        ALPHAMAX=1.0
        OPTTOL=0.2
        LONGCURVE=""
        ;;
    high)
        TURDSIZE=1
        ALPHAMAX=1.0
        OPTTOL=0.1
        LONGCURVE=""
        ;;
    max)
        TURDSIZE=0
        ALPHAMAX=1.0
        OPTTOL=0.05
        LONGCURVE="--longcurve"
        ;;
    sharp)
        TURDSIZE=0
        ALPHAMAX=0.8
        OPTTOL=0.1
        LONGCURVE=""
        ;;
    *)
        echo "Error: Unknown quality preset '$QUALITY_PRESET'"
        echo "Valid presets: default, high, max, sharp"
        exit 1
        ;;
esac

# Check if potrace is available
if ! command -v potrace &> /dev/null; then
    echo "Error: potrace not found. Please install it:"
    echo "  Ubuntu/Debian: sudo apt-get install potrace"
    echo "  macOS: brew install potrace"
    exit 1
fi

echo "Converting $PNG_FILE to SVG using potrace..."
echo "Quality preset: $QUALITY_PRESET (turdsize=$TURDSIZE, alphamax=$ALPHAMAX, opttol=$OPTTOL)"
echo "Output: ${OUTPUT_NAME}.svg"

# Step 1: Convert PNG to PNM (potrace only accepts PNM/BMP format)
TMP_PNM="${OUTPUT_NAME}_tmp.pnm"
convert "$PNG_FILE" "$TMP_PNM"

# Step 2: Trace with potrace
# Potrace options:
#   --svg: output SVG format
#   -t: suppress speckles (turdsize)
#   -a: corner threshold (alphamax) - lower = sharper corners
#   -O: curve optimization tolerance (opttolerance) - lower = more faithful
#   --longcurve: disable curve optimization (preserves more detail)
potrace "$TMP_PNM" --svg -o "${OUTPUT_NAME}.svg" \
    -t "$TURDSIZE" \
    -a "$ALPHAMAX" \
    -O "$OPTTOL" \
    $LONGCURVE

# Step 3: Clean up temporary file
rm -f "$TMP_PNM"

# Step 4: Create a preview PNG from the SVG (for comparison)
PREVIEW_PNG="${OUTPUT_NAME}-vectorized.png"
convert "${OUTPUT_NAME}.svg" "$PREVIEW_PNG"

echo "Success! Created ${OUTPUT_NAME}.svg"
echo "Preview PNG: $PREVIEW_PNG"
