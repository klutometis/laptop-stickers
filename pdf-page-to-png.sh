#!/usr/bin/env bash
#
# Extract a page from a PDF and convert to high-resolution PNG
# Usage: pdf-page-to-png.sh <pdf-file> <page-number> [output-name] [dpi]
#
# Examples:
#   pdf-page-to-png.sh wtc-ii.pdf 41
#   pdf-page-to-png.sh wtc-ii.pdf 41 dis-mol-peters
#   pdf-page-to-png.sh wtc-ii.pdf 41 dis-mol-peters 1200

set -euo pipefail

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <pdf-file> <page-number> [output-name] [dpi]"
    echo ""
    echo "Arguments:"
    echo "  pdf-file     - Input PDF file"
    echo "  page-number  - Page number to extract (1-indexed)"
    echo "  output-name  - Optional output filename (without extension)"
    echo "  dpi          - Optional DPI resolution (default: 600)"
    echo ""
    echo "Examples:"
    echo "  $0 wtc-ii.pdf 41"
    echo "  $0 wtc-ii.pdf 41 dis-mol-peters"
    echo "  $0 wtc-ii.pdf 41 dis-mol-peters 1200"
    exit 1
fi

PDF_FILE="$1"
PAGE_NUM="$2"
OUTPUT_NAME="${3:-$(basename "$PDF_FILE" .pdf)-page${PAGE_NUM}}"
DPI="${4:-600}"

# Check if PDF exists
if [ ! -f "$PDF_FILE" ]; then
    echo "Error: PDF file '$PDF_FILE' not found"
    exit 1
fi

# Check if pdftoppm is available
if ! command -v pdftoppm &> /dev/null; then
    echo "Error: pdftoppm not found. Please install poppler-utils:"
    echo "  Ubuntu/Debian: sudo apt-get install poppler-utils"
    echo "  macOS: brew install poppler"
    exit 1
fi

echo "Extracting page $PAGE_NUM from $PDF_FILE..."
echo "Output: ${OUTPUT_NAME}.png"
echo "DPI: $DPI"

# Extract and convert
pdftoppm -png -r "$DPI" -f "$PAGE_NUM" -l "$PAGE_NUM" \
    "$PDF_FILE" "$OUTPUT_NAME"

# pdftoppm adds a page number suffix, rename if needed
if [ -f "${OUTPUT_NAME}-${PAGE_NUM}.png" ]; then
    mv "${OUTPUT_NAME}-${PAGE_NUM}.png" "${OUTPUT_NAME}.png"
    echo "Success! Created ${OUTPUT_NAME}.png"
elif [ -f "${OUTPUT_NAME}.png" ]; then
    echo "Success! Created ${OUTPUT_NAME}.png"
else
    echo "Warning: Expected output file not found"
    ls -la "${OUTPUT_NAME}"*.png 2>/dev/null || true
fi
