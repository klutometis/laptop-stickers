#!/usr/bin/env bash
#
# Convert PNG to SVG using potrace (simpler alternative to Inkscape CLI)
# Usage: png-to-svg-potrace.sh <png-file> [output-name]
#
# Examples:
#   png-to-svg-potrace.sh dis-mol-peters-clean-simple.png
#   png-to-svg-potrace.sh dis-mol-peters-clean-simple.png dis-mol-peters

set -euo pipefail

# Check arguments
if [ $# -lt 1 ]; then
    echo "Usage: $0 <png-file> [output-name]"
    echo ""
    echo "Arguments:"
    echo "  png-file     - Input PNG file"
    echo "  output-name  - Optional output filename (without extension)"
    echo ""
    echo "Examples:"
    echo "  $0 dis-mol-peters-clean-simple.png"
    echo "  $0 dis-mol-peters-clean-simple.png dis-mol-peters"
    exit 1
fi

PNG_FILE="$1"
OUTPUT_NAME="${2:-$(basename "$PNG_FILE" .png)}"

# Check if PNG exists
if [ ! -f "$PNG_FILE" ]; then
    echo "Error: PNG file '$PNG_FILE' not found"
    exit 1
fi

# Check if potrace is available
if ! command -v potrace &> /dev/null; then
    echo "Error: potrace not found. Please install it:"
    echo "  Ubuntu/Debian: sudo apt-get install potrace"
    echo "  macOS: brew install potrace"
    exit 1
fi

echo "Converting $PNG_FILE to SVG using potrace..."
echo "Output: ${OUTPUT_NAME}.svg"

# Step 1: Convert PNG to PNM (potrace only accepts PNM/BMP format)
TMP_PNM="${OUTPUT_NAME}_tmp.pnm"
convert "$PNG_FILE" "$TMP_PNM"

# Step 2: Trace with potrace
# Potrace options:
#   --svg: output SVG format
#   -t 2: suppress speckles of up to 2 pixels
#   -a 1.0: set corner threshold (default 1.0)
#   -O 0.2: curve optimization tolerance
potrace "$TMP_PNM" --svg -o "${OUTPUT_NAME}.svg" -t 2 -a 1.0 -O 0.2

# Step 3: Clean up temporary file
rm -f "$TMP_PNM"

# Step 4: Create a preview PNG from the SVG (for comparison)
PREVIEW_PNG="${OUTPUT_NAME}-vectorized.png"
convert "${OUTPUT_NAME}.svg" "$PREVIEW_PNG"

echo "Success! Created ${OUTPUT_NAME}.svg"
echo "Preview PNG: $PREVIEW_PNG"
