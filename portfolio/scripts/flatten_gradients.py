#!/usr/bin/env python3
"""Replace decorative linear-gradient(...) fills (inline styles / CSS strings) with
a solid colour (the first colour stop). Keeps shimmer/skeleton, masks, 1px grid
lines and anything fading to `transparent`."""
import re, pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent / "src"
FILES = [p for p in root.rglob("*") if p.suffix in (".jsx", ".css") and p.name not in ("theme.human.css", "theme.tailwind-light.css")]
HEX_GOLD = {"#f2d48f": "var(--ds-primary)", "#a8823a": "var(--ds-primary)"}

def split_top(s):
    parts, depth, cur = [], 0, ""
    for ch in s:
        if ch == "(": depth += 1
        elif ch == ")": depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur.strip()); cur = ""
        else: cur += ch
    parts.append(cur.strip())
    return parts

def first_color(stop):
    stop = stop.strip()
    # drop trailing position e.g. "#fff 40%" (only if not inside parens)
    m = re.match(r'^(.*?)(?:\s+-?\d+(?:\.\d+)?%)$', stop)
    return m.group(1) if m else stop

count = 0
def convert(text, path):
    global count
    out, i = [], 0
    key = "linear-gradient("
    while True:
        j = text.find(key, i)
        if j < 0:
            out.append(text[i:]); break
        # balanced end
        k, depth = j + len(key), 1
        while k < len(text) and depth:
            depth += {"(": 1, ")": -1}.get(text[k], 0); k += 1
        inner = text[j + len(key):k - 1]
        line_start = text.rfind("\n", 0, j) + 1
        line_end = text.find("\n", j); line_end = len(text) if line_end < 0 else line_end
        line = text[line_start:line_end]
        parts = split_top(inner)
        stops = parts[1:] if re.match(r'^(?:to\s|\d+deg|\d+turn|\$\{)', parts[0]) else parts
        low = inner.lower()
        skip = ("transparent" in low or "currentcolor" in low or "mask" in line.lower()
                or "skeleton" in line.lower() or "sk1" in low or "sk2" in low
                or "shimmer" in line.lower() or len(stops) < 2
                or "backgroundimage" in line.lower().replace(" ", "")
                and "1px" in low)
        if skip:
            out.append(text[i:k]); i = k; continue
        c = first_color(stops[0])
        c = HEX_GOLD.get(c.lower(), c)
        out.append(text[i:j]); out.append(c); i = k; count += 1
    return "".join(out)

for p in sorted(FILES):
    if p.name in ("Hero.jsx",): continue
    s = p.read_text(); n = convert(s, p)
    if n != s:
        p.write_text(n); print("flattened", p.relative_to(root))
print("gradients flattened:", count)
