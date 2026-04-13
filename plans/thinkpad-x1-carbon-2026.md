# ThinkPad X1 Carbon — Laptop Sticker Plan (2026)

**Laptop:** Lenovo ThinkPad X1 Carbon
**Lid dimensions:** 12" wide x 9" tall (landscape)
**Date:** 2026-04-11

---

## Stickers

### 1. Church Numerals (top)

- **Content:** Church encoding of natural numbers in lambda calculus
- **Source:** `church.tex` → `church.svg` (via `tex-to-sticker.sh`)
- **Color:** White vinyl
- **Rationale:** Pure abstraction. Maximal contrast on dark lid. Matte white against metallic silver Bach creates texture distinction.

**Ink dimensions (actual):** 100.2 x 121.9 px (at 96 dpi)
**Aspect ratio:** 0.822:1 (taller than wide)

### 2. Bach D♯ Minor Fugue (bottom)

- **Content:** WTC Book II, Fugue in D♯ minor — 3-measure version (exposition + answer entry)
- **Source:** Peters edition scan → `dis-mol-three-measures.svg` (potrace sharp preset)
- **Color:** Brushed silver / steel vinyl
- **Rationale:** Both Scriabin and Rimsky-Korsakov assign D♯/E♭ a steely, metallic color. See NOTES.md "Color Decision" section for full research.

**Ink dimensions (actual):** 1626.2 x 171.4 pt (at 72 dpi)
**Aspect ratio:** 9.49:1 (extremely wide horizontal ribbon)

---

## Layout: The Golden Construction

Everything derives from a single base unit:

    b = 9 / (3φ + φ² + 1) = 1.062"

The vertical structure is five segments. Each adjacent pair is in golden ratio:

    φ    :   φ²   :   φ    :    1    :   φ
    space : Church : space  :  Bach   : space

### The math

| Segment | Formula | Size |
|---------|---------|------|
| Top margin | b × φ | **1.72"** |
| Church | b × φ² | **2.78" tall** × 2.29" wide |
| Gap | b × φ | **1.72"** |
| Bach | b × 1 | **1.06" tall** × 10.08" wide |
| Bottom margin | b × φ | **1.72"** |
| | | **= 9.00"** |

### Golden relationships

| Relationship | Ratio | Value |
|---|---|---|
| Church height / Bach height | φ² | 2.618 |
| Church height / any space | φ | 1.618 |
| Any space / Bach height | φ | 1.618 |
| Top margin = Gap = Bottom margin | — | 1.72" |

Every adjacent pair in the vertical sequence is φ-related:

    1.72" → ×φ → 2.78" → ÷φ → 1.72" → ÷φ → 1.06" → ×φ → 1.72"

### Diagram

```
    ┌──────────────────────────────────────┐
    │               12" wide               │
    │                                      │
    │   ┊ 1.72"  top margin    (b × φ)    │
    │                                      │
    │          ┌──────────┐                │
    │          │  Church  │  2.78" tall    │
    │          │ numerals │  2.29" wide    │
    │          │ (white)  │  (b × φ²)     │
    │          └──────────┘                │
    │                                      │
    │   ┊ 1.72"  gap           (b × φ)    │
    │                                      │
    │  ┌──────────────────────────────┐    │
    │  │   Bach D♯ minor (silver)    │    │  1.06" tall
    │  │        10.08" wide          │    │  (b × 1)
    │  └──────────────────────────────┘    │
    │                                      │
    │   ┊ 1.72"  bottom margin (b × φ)    │
    │                                      │
    └──────────────────────────────────────┘
```

### Cricut placement coordinates

| Sticker | Width | Height | Left edge | Top edge | Bottom edge |
|---------|-------|--------|-----------|----------|-------------|
| Church  | 2.29" | 2.78"  | 4.86"     | 1.72"    | 4.50"       |
| Bach    | 10.08"| 1.06"  | 0.96"     | 6.22"    | 7.28"       |

Both centered horizontally at x = 6.00".

---

## Color Rationale

| Sticker | Color | Source |
|---------|-------|--------|
| Church numerals | **White** | Pure abstraction, maximal contrast, matte finish |
| Bach fugue | **Brushed silver / steel** | Scriabin: D♯ = "flesh (glint of steel)". Rimsky-Korsakov: E♭ = "bluish-grey / steely". Both converge on metallic. See NOTES.md for full citations. |

*"If ghosts could speak, their speech would approximate this key."* — Schubart, 1806

---

## Pre-cut checklist

- [ ] Trim SVGs to ink bounds (remove whitespace) — critical for Cricut sizing
- [ ] Test cut Bach at 10.08" wide with throwaway vinyl — are staff lines cuttable at ~45% scale?
- [ ] If staff lines too thin: increase Bach to ~1.2" tall (breaks pure golden, still looks great)
- [ ] If staff lines still too thin: fall back to 2-measure version
- [ ] Test cut Church at 2.78" tall — is `f^{∘n}` superscript legible?
- [ ] Verify white vinyl contrast on dark lid
- [ ] Verify silver vinyl reads as "silver" not "grey" on dark lid
- [ ] Test transfer tape technique on both materials

## Files

- `church.svg` — Church numerals vector (Cricut-ready, trimmed)
- `dis-mol-three-measures.svg` — Bach fugue vector (Cricut-ready, trimmed)
- Both uploaded to Google Drive: `My Drive/laptop-stickers/`
