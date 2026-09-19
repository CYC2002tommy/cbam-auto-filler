"""Generate template/templateMap.json from the official CBAM communication template.

The export writer only writes cells listed here as writable, so a locked cell or a
formula cell in the official template can never be overwritten. Re-run this script
whenever template/cbam-template-v2.1.1.xlsx is replaced.

    python tools/gen_template_map.py            # regenerate
    python tools/gen_template_map.py --report   # regenerate and print spot checks
"""
import hashlib
import json
import re
import sys
import warnings
from pathlib import Path

import openpyxl
from openpyxl.utils import get_column_letter, range_boundaries

warnings.filterwarnings("ignore")
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "template" / "cbam-template-v2.1.1.xlsx"
OUT = ROOT / "template" / "templateMap.json"

INPUT_SHEETS = ["A_InstData", "B_EmInst", "C_Emissions&Energy", "D_Processes",
                "E_PurchPrec", "Summary_Processes", "Summary_Products"]

# Repeating blocks: (key, sheet, id column, first row, id pattern).
BLOCKS = [
    ("a.e62", "A_InstData", "D", 62, r"^G\d+$"),
    ("a.e83", "A_InstData", "D", 83, r"^P\d+$"),
    ("a.e102", "A_InstData", "D", 102, r"^PP\d+$"),
    ("b.d17", "B_EmInst", "C", 17, r"^\d+$"),
    ("b.d98", "B_EmInst", "C", 98, r"^\d+$"),
    ("b.d113", "B_EmInst", "C", 113, r"^\d+$"),
    ("summary.products", "Summary_Products", "C", 10, r"^\d+$"),
]

# D_Processes holds one block per production process at a fixed stride.
PROCESS_STRIDE = 65
PROCESS_BLOCKS = 10

DATE_TOKENS = re.compile(r"(yy|dd|mmm|m/d|d/m)", re.I)
NUMERIC_FORMAT = re.compile(r"^[#0.,%\s\"a-zA-Z_\\-]*[0#][0#.,%]*")


def is_formula(value):
    return (isinstance(value, str) and value.startswith("=")) or type(value).__name__ == "ArrayFormula"


def column_runs(coords):
    """Compress (col, row) pairs into 'L16:L25' style runs, column by column."""
    by_col = {}
    for col, row in coords:
        by_col.setdefault(col, []).append(row)
    runs = []
    for col in sorted(by_col):
        rows = sorted(by_col[col])
        start = prev = rows[0]
        for r in rows[1:] + [None]:
            if r is not None and r == prev + 1:
                prev = r
                continue
            letter = get_column_letter(col)
            runs.append(f"{letter}{start}" if start == prev else f"{letter}{start}:{letter}{prev}")
            if r is not None:
                start = prev = r
    return runs


def resolve_list(wb, ws, formula, cached):
    """Return (values, source) for a list validation, or (None, reason) when dynamic.

    Option lists are mostly formula-driven (Translations sheet), so values are read
    from `cached`, the same workbook loaded with data_only=True.
    """
    if formula is None:
        return None, "empty", False
    f = formula.lstrip("=").strip()
    if f.startswith('"') and f.endswith('"'):
        return [v for v in f.strip('"').split(",")], "inline", False
    if "INDIRECT" in f.upper() or "OFFSET" in f.upper() or "(" in f:
        return None, f"dynamic:{f[:60]}", True
    name = f
    target = None
    if name in wb.defined_names:
        target = wb.defined_names[name]
    elif name in ws.defined_names:
        target = ws.defined_names[name]
    if target is None:
        m = re.match(r"^'?([^'!]+)'?!\$?([A-Z]+)\$?(\d+):\$?([A-Z]+)\$?(\d+)$", f)
        if not m:
            return None, f"unresolved:{f[:60]}", True
        dests = [(m.group(1), f"{m.group(2)}{m.group(3)}:{m.group(4)}{m.group(5)}")]
    else:
        dests = list(target.destinations)
    values = []
    soft = False
    for sheet_name, ref in dests:
        sheet = cached[sheet_name]
        source = wb[sheet_name]
        ref = ref.replace("$", "")
        min_col, min_row, max_col, max_row = range_boundaries(ref if ":" in ref else f"{ref}:{ref}")
        for row in sheet.iter_rows(min_row=min_row, max_row=max_row, min_col=min_col, max_col=max_col, values_only=True):
            for v in row:
                if v is not None and v != "":
                    values.append(v)
        # A list built by formulas depends on what the user types elsewhere in the workbook,
        # so its cached values cannot be used to validate an entry.
        for row in source.iter_rows(min_row=min_row, max_row=max_row, min_col=min_col, max_col=max_col):
            if any(is_formula(c.value) for c in row):
                soft = True
    return values, f"name:{name}{' (dynamic)' if soft else ''}", soft


def cell_type(cell, validation):
    if validation is not None:
        kind = validation["type"]
        if kind == "date":
            return "date"
        if kind in ("whole", "decimal"):
            return "number"
        if kind == "list" and validation.get("values") is not None:
            vals = validation["values"]
            if vals and all(isinstance(v, bool) for v in vals):
                return "bool"
            if vals and all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in vals):
                return "number"
            return "list"
    fmt = cell.number_format or "General"
    if DATE_TOKENS.search(fmt) and "General" not in fmt:
        return "date"
    if fmt != "General" and fmt != "@" and NUMERIC_FORMAT.match(fmt):
        return "number"
    if fmt == "@":
        return "text"
    return "general"


def main():
    report = "--report" in sys.argv
    wb = openpyxl.load_workbook(SRC, data_only=False)
    cached = openpyxl.load_workbook(SRC, data_only=True)
    sha = hashlib.sha256(SRC.read_bytes()).hexdigest()

    lists = {}
    list_ids = {}
    sheets = {}
    for s in INPUT_SHEETS:
        ws = wb[s]
        validations = {}
        for dv in ws.data_validations.dataValidation:
            entry = {"type": dv.type or "any"}
            if dv.type == "list":
                values, source, soft = resolve_list(wb, ws, dv.formula1, cached)
                entry["source"] = source
                entry["soft"] = soft
                if values is not None:
                    key = json.dumps([str(v) if not isinstance(v, bool) else v for v in values], ensure_ascii=False)
                    if key not in list_ids:
                        list_ids[key] = f"L{len(list_ids) + 1}"
                        lists[list_ids[key]] = [v if isinstance(v, (bool, int, float)) else str(v) for v in values]
                    entry["list"] = list_ids[key]
                    entry["values"] = values
            for rng in str(dv.sqref).split():
                min_col, min_row, max_col, max_row = range_boundaries(rng if ":" in rng else f"{rng}:{rng}")
                for r in range(min_row, max_row + 1):
                    for c in range(min_col, max_col + 1):
                        validations[(c, r)] = entry

        cells = {}
        for row in ws.iter_rows(min_row=1, max_row=ws.max_row, max_col=ws.max_column):
            for cell in row:
                if cell.protection.locked is False and not is_formula(cell.value):
                    v = validations.get((cell.column, cell.row))
                    t = cell_type(cell, v)
                    rec = {"t": t}
                    if v is not None and "list" in v:
                        rec["l"] = v["list"]
                        if v.get("soft"):
                            rec["soft"] = True
                    elif v is not None and v.get("type") == "list":
                        rec["dyn"] = v.get("source", "")
                    cells[cell.coordinate] = rec
        sheets[s] = cells

    caps = {}
    for key, sheet, col, first, pattern in BLOCKS:
        ws = wb[sheet]
        n = 0
        r = first
        while True:
            v = ws[f"{col}{r}"].value
            if v is None or not re.match(pattern, str(v).strip()):
                break
            n += 1
            r += 1
        caps[key] = n

    # Verify the process-block stride: block k's writable cells must equal block 1's shifted by k*stride.
    d_cells = {k for k in sheets["D_Processes"]}
    def shifted(addr, dr):
        m = re.match(r"^([A-Z]+)(\d+)$", addr)
        return f"{m.group(1)}{int(m.group(2)) + dr}"
    rows = sorted(int(re.match(r"^[A-Z]+(\d+)$", a).group(1)) for a in d_cells)
    first_row = rows[0]
    block1 = {a for a in d_cells if first_row <= int(re.match(r"^[A-Z]+(\d+)$", a).group(1)) < first_row + PROCESS_STRIDE}
    stride_ok = []
    for k in range(1, PROCESS_BLOCKS):
        expected = {shifted(a, k * PROCESS_STRIDE) for a in block1}
        actual = {a for a in d_cells
                  if first_row + k * PROCESS_STRIDE <= int(re.match(r"^[A-Z]+(\d+)$", a).group(1)) < first_row + (k + 1) * PROCESS_STRIDE}
        stride_ok.append(expected == actual)
    caps["d.processes"] = PROCESS_BLOCKS if all(stride_ok) else None

    out = {
        "template": {
            "file": SRC.name,
            "sha256": sha,
            "version": str(wb["VersionDocumentation"]["B3"].value)[:10],
            "type": wb["VersionDocumentation"]["B2"].value,
        },
        "processStride": PROCESS_STRIDE,
        "caps": caps,
        "lists": lists,
        "cells": sheets,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    total = sum(len(c) for c in sheets.values())
    print(f"wrote {OUT.relative_to(ROOT)}: {total} writable cells, {len(lists)} lists, {OUT.stat().st_size // 1024} KB")
    print("template:", out["template"])
    print("caps:", caps, "| process stride holds for blocks 2-10:", stride_ok)
    for s in INPUT_SHEETS:
        types = {}
        for rec in sheets[s].values():
            types[rec["t"]] = types.get(rec["t"], 0) + 1
        print(f"  {s}: {len(sheets[s])} writable {types}")

    if report:
        checks = [("A_InstData", "I9"), ("A_InstData", "L9"), ("A_InstData", "I20"), ("A_InstData", "I26"),
                  ("A_InstData", "E62"), ("A_InstData", "E83"), ("B_EmInst", "D17"), ("B_EmInst", "AG98"),
                  ("B_EmInst", "AN98"), ("D_Processes", "L16"), ("D_Processes", "K50"), ("D_Processes", "L54"),
                  ("D_Processes", "L55"), ("D_Processes", "L57"), ("D_Processes", "L65"), ("E_PurchPrec", "K54"),
                  ("Summary_Products", "D10"), ("Summary_Products", "F10"), ("Summary_Products", "Q10"),
                  ("Summary_Processes", "M13")]
        for s, a in checks:
            rec = sheets[s].get(a)
            extra = ""
            if rec and "l" in rec:
                vals = lists[rec["l"]]
                extra = f" list[{len(vals)}]={[v for v in vals[:4]]}{'…' if len(vals) > 4 else ''} types={sorted({type(v).__name__ for v in vals})}"
            print(f"  {s}!{a}: {rec}{extra}")
        f9 = wb["Summary_Products"]["F9"].value
        print("  Summary_Products!F9 example:", repr(f9), type(f9).__name__)
        dyn = sorted({rec.get("dyn") for c in sheets.values() for rec in c.values() if rec.get("dyn")})
        print("  dynamic list sources:", dyn[:12])


if __name__ == "__main__":
    main()
