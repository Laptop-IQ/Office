#!/usr/bin/env python3
"""Replace emoji in JSX text with <Ico e="…"/> (Remix icons). Strings/toasts: emoji dropped."""
import re, pathlib
src = pathlib.Path(__file__).resolve().parent.parent / "src"
ico = (src / "components/Ico.jsx").read_text()
KEYS = re.findall(r'"(.)(?:\uFE0F)?":', ico.split("export const ICONS")[1].split("};")[0])
E = "(?:" + "|".join(re.escape(k) for k in sorted(set(KEYS))) + ")[\uFE0F]?"
SKIP = {"Ico.jsx", "store.jsx", "reports.js"}
def tag(m_e): return '<Ico e="%s" />' % m_e.replace("\uFE0F", "")
for p in sorted(src.rglob("*.jsx")):
    if p.name in SKIP: continue
    s = o = p.read_text()
    s = re.sub(r'\s+✓(?=["`\'])', "", s)                                    # toast "…saved ✓"
    s = re.sub(r'(?<=>)(\s*)(%s)(\s*)(?=<)' % E, lambda m: m.group(1)+tag(m.group(2))+m.group(3), s)
    s = re.sub(r'(?m)^(\s*)(%s)(\s*)$' % E, lambda m: m.group(1)+tag(m.group(2)), s)
    s = re.sub(r'(?m)^(\s*)(%s)(\s+)(?=[^\s=(){};,\'"`])' % E, lambda m: m.group(1)+tag(m.group(2))+" ", s)
    s = re.sub(r'(?<=>)(%s)(\s)' % E, lambda m: tag(m.group(1))+m.group(2), s)
    s = re.sub(r'(\s)(%s)(?=</)' % E, lambda m: m.group(1)+tag(m.group(2)), s)
    if s != o:
        if "import { Ico }" not in s and "<Ico" in s:
            rel = "../Ico" if p.parent.name == "stock" else "./Ico" if p.parent.name == "components" else "@/components/Ico"
            # insert after last import line
            lines = s.split("\n"); idx = max(i for i, l in enumerate(lines) if re.match(r"\s*(import .* from|\} from) ", l))
            lines.insert(idx + 1, 'import { Ico } from "%s";' % rel); s = "\n".join(lines)
        p.write_text(s); print("updated", p.relative_to(src))
