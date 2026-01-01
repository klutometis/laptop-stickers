#!/usr/bin/env bash
#
# Convert PNG to SVG using Inkscape's trace bitmap feature
# Usage: png-to-svg.sh <png-file> [output-name]
#
# Examples:
#   png-to-svg.sh dis-mol-peters-clean-simple.png
#   png-to-svg.sh dis-mol-peters-clean-simple.png dis-mol-peters

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

# Check if Inkscape is available
if ! command -v inkscape &> /dev/null; then
    echo "Error: inkscape not found. Please install Inkscape:"
    echo "  Ubuntu/Debian: sudo apt-get install inkscape"
    echo "  macOS: brew install inkscape"
    exit 1
fi

echo "Converting $PNG_FILE to SVG..."
echo "Output: ${OUTPUT_NAME}.svg"

# Use Inkscape's command-line trace bitmap feature
# object-trace parameters: {scans},{smooth},{stack},{remove_background},{speckles},{smooth_corners},{optimize}
# Using: 1 scan, no smoothing, stack results, remove background, 2px speckle removal, 1.0 corner smoothing, 0.2 optimize
# After tracing: select the original image element and delete it
inkscape "$PNG_FILE" \
    --export-type=svg \
    --export-filename="${OUTPUT_NAME}.svg" \
    --actions="select-all;object-trace:1,false,true,true,2,1.0,0.2;select-by-element:image;delete"

echo "Success! Created ${OUTPUT_NAME}.svg"
