#!/usr/bin/env python3
"""One-off clean-up: strips 'AI template' Tailwind patterns from className strings.
 - gradient fills -> solid fill (first colour of the gradient)
 - gradient text  -> plain coloured text
 - backdrop-blur, coloured glow shadows, huge arbitrary radii removed
 - decorative shine / glow / orb elements removed
"""
import re, pathlib, sys

root = pathlib.Path(__file__).resolve().parent.parent / "src"
stats = {}
def bump(k, n=1): stats[k] = stats.get(k, 0) + n

# decorative, self-closing elements: shine bars, hairline gradients, glow orbs, radial bg blobs
DECOR = re.compile(
    r'[ \t]*<(?:div|span)\s+(?:aria-hidden="true"\s+)?className="[^"]*?(?:from-transparent|\bblur-(?:\[|xl|2xl|3xl|md|lg|sm)|bg-\[radial-gradient)[^"]*"\s*(?:aria-hidden="true"\s*)?/>[ \t]*\n?'
)

GRAD_STR = re.compile(r'"([^"]*\bbg-gradient-to-[a-z]+\b[^"]*)"')

def collapse(m):
    body = m.group(1)
    toks = body.split()
    from_c = None
    clip = "bg-clip-text" in toks
    out = []
    for t in toks:
        if re.fullmatch(r'bg-gradient-to-[a-z]+', t): continue
        if t.startswith("from-"):
            if from_c is None and t != "from-transparent": from_c = t[5:]
            continue
        if t.startswith("via-") or (t.startswith("to-") and not re.match(r'to-(?:\[?\d)', t)):
            continue
        if clip and t in ("bg-clip-text", "text-transparent"): continue
        out.append(t)
    if from_c:
        out.append(("text-" if clip else "bg-") + from_c)
    bump("gradient")
    # keep the original layout (single line if it was single line)
    sep = "\n" if "\n" in body else " "
    if sep == "\n":
        indent = re.search(r'\n(\s+)\S', body)
        ind = indent.group(1) if indent else ""
        return '"\n' + "\n".join(ind + t for t in out) + '\n' + ind[:-2] + '"'
    return '"' + " ".join(out) + '"'

def clean(src):
    n0 = len(src)
    src, k = DECOR.subn("", src); bump("decor_removed", k)
    src = GRAD_STR.sub(collapse, src)
    # backdrop blur
    src, k = re.subn(r'(?<![\w-])backdrop-blur(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl)|-\[[^\]]+\])?(?![\w-])\s*', "", src); bump("backdrop", k)
    # coloured glow shadows
    src, k = re.subn(r'(?<![\w-])shadow-(?:black|white|[a-z]+-\d{2,3}|\[#[^\]]+\])(?:/\d+)?(?![\w-])\s*', "", src); bump("glow_shadow", k)
    # big arbitrary radii
    src, k = re.subn(r'rounded-\[(?:1[6-9]|[2-9]\d)px\]', "rounded-lg", src); bump("big_radius", k)
    # very wide letter spacing on labels
    src, k = re.subn(r'tracking-\[0\.(?:1[5-9]|[2-9]\d*)em\]', "tracking-wide", src); bump("tracking", k)
    return src

for p in sorted(root.rglob("*.jsx")):
    s = p.read_text()
    c = clean(s)
    if c != s:
        p.write_text(c)
        print("cleaned", p.relative_to(root))
print(stats)
