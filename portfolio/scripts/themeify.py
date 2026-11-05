#!/usr/bin/env python3
"""Property-aware replacement of hard-coded hex colours with CSS variables.
rules: {hex: (var_name, allowed_props|None)}  props in {background,border,color,gradient,?}
Used once to wire older inline-styled components to theme.css (kept for reference)."""
import re, collections
PROPS = r'(backgroundColor|background|borderTop|borderBottom|borderLeft|borderRight|borderColor|border|color|boxShadow|fill|stroke|outline|caretColor|accentColor)'
def prop_of(s, pos):
    pre = s[max(0, pos-80):pos]
    pm = list(re.finditer(PROPS + r'\s*[:=]', pre))
    if pm:
        k = pm[-1].group(1)
        if k == 'backgroundColor': k = 'background'
        if k.startswith('border') or k == 'outline': k = 'border'
        return k
    return 'gradient' if 'gradient' in pre else '?'
def convert(path, rules):
    s = open(path).read(); n = collections.Counter()
    def rep(m):
        h = m.group(0).lower()
        if h not in rules: return m.group(0)
        var, allowed = rules[h]
        k = prop_of(s, m.start())
        if allowed is not None and k not in allowed: return m.group(0)
        n[h] += 1
        return f'var({var})'
    s2 = re.sub(r'#[0-9a-fA-F]{6}(?![0-9a-fA-F])|#[0-9a-fA-F]{3}(?![0-9a-fA-F])', rep, s)
    open(path, 'w').write(s2)
    return n
