#!/usr/bin/env python3
"""Render psilocybin (C12H17N2O4P) to a clean black-on-transparent SVG."""
from rdkit import Chem
from rdkit.Chem import AllChem, Draw
from rdkit.Chem.Draw import rdMolDraw2D

SMILES = "CN(C)CCc1c[nH]c2cccc(OP(=O)(O)O)c12"

mol = Chem.MolFromSmiles(SMILES)
AllChem.Compute2DCoords(mol)

drawer = rdMolDraw2D.MolDraw2DSVG(900, 700)
opts = drawer.drawOptions()
opts.clearBackground = False         # transparent
opts.bondLineWidth = 2.4
opts.minFontSize = 28
opts.maxFontSize = 36
opts.padding = 0.06
opts.baseFontSize = 0.7
# pure black, no CPK coloring -> matches your minimalist sticker aesthetic
for z in (1, 6, 7, 8, 15, 16):
    opts.updateAtomPalette({z: (0, 0, 0)})

drawer.DrawMolecule(mol)
drawer.FinishDrawing()
svg = drawer.GetDrawingText()
with open("psilocybin.svg", "w") as f:
    f.write(svg)
print("wrote psilocybin.svg")
