"""Check that an exported declaration is the official template plus values only.

    python tools/verify_export.py <exported.xlsx>

It compares the export with template/cbam-template-v2.1.1.xlsx part by part:
every zip entry must still be there, every part except the written sheets and
workbook.xml must be byte-identical, and inside the written sheets only cells
that are writable per templateMap.json may differ. Prints the written cells.
"""
import json
import re
import sys
import warnings
import zipfile
from pathlib import Path

import openpyxl

warnings.filterwarnings("ignore")
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "template" / "cbam-template-v2.1.1.xlsx"
MAP = json.loads((ROOT / "template" / "templateMap.json").read_text(encoding="utf-8"))
EXPORT = Path(sys.argv[1])

problems = []
tz, xz = zipfile.ZipFile(TEMPLATE), zipfile.ZipFile(EXPORT)
tn, xn = set(tz.namelist()), set(xz.namelist())
missing, added = sorted(tn - xn), sorted(xn - tn)
print(f"parts: template {len(tn)}, export {len(xn)}")
if missing:
    problems.append(f"parts lost: {missing}")
if added:
    problems.append(f"parts added: {added}")

# Which sheet parts hold the data we write?
wb_xml = tz.read("xl/workbook.xml").decode("utf-8")
rels = tz.read("xl/_rels/workbook.xml.rels").decode("utf-8")
sheet_part = {}
for m in re.finditer(r'<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"', wb_xml):
    name, rid = m.group(1), m.group(2)
    t = re.search(r'Id="%s"[^>]*Target="([^"]+)"' % rid, rels) or re.search(r'Target="([^"]+)"[^>]*Id="%s"' % rid, rels)
    if t:
        sheet_part[name] = "xl/" + t.group(1).lstrip("/").replace("xl/", "", 1)
data_parts = {sheet_part[s] for s in MAP["cells"] if s in sheet_part}

identical, changed = 0, []
for name in sorted(tn & xn):
    same = tz.read(name) == xz.read(name)
    if same:
        identical += 1
    else:
        changed.append(name)
print(f"byte-identical parts: {identical}/{len(tn & xn)}")
for name in changed:
    kind = "data sheet" if name in data_parts else "workbook.xml" if name == "xl/workbook.xml" else "UNEXPECTED"
    print(f"  changed: {name} ({kind})")
    if kind == "UNEXPECTED":
        problems.append(f"unexpected change in {name}")

# workbook.xml may differ only by the recalculation flag.
if "xl/workbook.xml" in changed:
    a = tz.read("xl/workbook.xml").decode("utf-8")
    b = xz.read("xl/workbook.xml").decode("utf-8")
    norm = lambda s: s.replace(' fullCalcOnLoad="1"', "").replace('<calcPr fullCalcOnLoad="1"/>', "")
    if norm(a) != norm(b):
        problems.append("workbook.xml changed beyond the recalculation flag")

# Cell-level comparison of the data sheets.
tw = openpyxl.load_workbook(TEMPLATE, data_only=False)
xw = openpyxl.load_workbook(EXPORT, data_only=False)
written = []
for sheet, cells in MAP["cells"].items():
    a, b = tw[sheet], xw[sheet]
    mr, mc = max(a.max_row, b.max_row), max(a.max_column, b.max_column)
    for r in range(1, mr + 1):
        for c in range(1, mc + 1):
            va, vb = a.cell(row=r, column=c).value, b.cell(row=r, column=c).value
            if type(va).__name__ == "ArrayFormula" or type(vb).__name__ == "ArrayFormula":
                continue
            if va == vb:
                continue
            addr = a.cell(row=r, column=c).coordinate
            if addr in cells:
                written.append((sheet, addr, cells[addr]["t"], vb))
            else:
                problems.append(f"{sheet}!{addr} changed but is not writable: {va!r} -> {vb!r}")

print(f"\nwritten cells: {len(written)}")
for sheet, addr, t, v in written:
    print(f"  {sheet}!{addr} [{t}] = {v!r} ({type(v).__name__})")

print()
if problems:
    print("FAIL")
    for p in problems:
        print(" -", p)
    sys.exit(1)
print("PASS: official template unchanged except the written cells and the recalculation flag")
