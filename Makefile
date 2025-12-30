# Laptop Stickers Build System
# Generates PDFs from LilyPond (.ly) and LaTeX (.tex) sources

# Find all source files
LILYPOND_SOURCES := $(wildcard *.ly)
LATEX_SOURCES := $(wildcard *.tex)

# Generate target PDF names
LILYPOND_PDFS := $(LILYPOND_SOURCES:.ly=.pdf)
LATEX_PDFS := $(LATEX_SOURCES:.tex=.pdf)

# All PDFs
ALL_PDFS := $(LILYPOND_PDFS) $(LATEX_PDFS)

.PHONY: all clean help

# Default target
all: $(ALL_PDFS)

# LilyPond compilation
%.pdf: %.ly
	@echo "Compiling LilyPond: $< -> $@"
	lilypond --pdf --output=$(basename $@) $<

# LaTeX compilation
%.pdf: %.tex
	@echo "Compiling LaTeX: $< -> $@"
	xelatex $<
	@# Clean up auxiliary files
	@rm -f *.aux *.log *.out

# Clean generated files
clean:
	@echo "Cleaning generated files..."
	@rm -f *.pdf *.aux *.log *.out *.fls *.fdb_latexmk

# Help target
help:
	@echo "Laptop Stickers Build System"
	@echo ""
	@echo "Targets:"
	@echo "  all     - Build all PDFs (default)"
	@echo "  clean   - Remove generated files"
	@echo "  help    - Show this help"
	@echo ""
	@echo "Source files:"
	@echo "  LilyPond: $(LILYPOND_SOURCES)"
	@echo "  LaTeX:    $(LATEX_SOURCES)"
	@echo ""
	@echo "Generated PDFs: $(ALL_PDFS)"
