import re, sys, pathlib
for name in ["ForgotPassword", "VerifyOTP", "ResetPassword"]:
    p = pathlib.Path(name + ".jsx")
    L = p.read_text().split("\n")
    main = next(i for i, l in enumerate(L) if "<main" in l and "min-h-screen" in l)
    grid = next(i for i, l in enumerate(L) if 'relative z-10 min-h-screen grid lg:grid-cols-2' in l)
    # 1. drop decorative background (everything between <main> and the content grid,
    #    but keep a preceding comment-only block out too)
    # find start of the comment/div block that precedes the content wrapper
    content_cmt = grid
    while content_cmt > main + 1 and ("*/" in L[content_cmt - 1] or "CONTENT" in L[content_cmt - 1] or "====" in L[content_cmt - 1] or "{/* Content" in L[content_cmt - 1] or L[content_cmt - 1].strip() == ""):
        content_cmt -= 1
    L[main + 1:content_cmt] = []
    grid = next(i for i, l in enumerate(L) if 'relative z-10 min-h-screen grid lg:grid-cols-2' in l)
    L[grid] = L[grid].replace("min-h-screen grid lg:grid-cols-2", "min-h-screen")
    # 2. drop the left marketing section
    s = next(i for i in range(grid, len(L)) if 'hidden lg:flex relative flex-col justify-between' in L[i])
    e = next(i for i in range(s, len(L)) if L[i].strip() == "</section>")
    # include the comment lines directly above the <section>
    while s > grid + 1 and ("*/" in L[s - 1] or "LEFT" in L[s - 1] or "====" in L[s - 1]):
        s -= 1
    L[s:e + 1] = []
    t = "\n".join(L)
    # 3. mobile logo is now the only logo -> always show
    t = t.replace("flex lg:hidden items-center", "flex items-center")
    # 4. card: solid surface, thin border
    t = re.sub(r'rounded-lg border border-white/\[0\.08\] bg-white/\[0\.06\]', 'rounded-lg border border-white/10 bg-[var(--auth-card)]', t)
    # 5. logo tile: plain accent square
    t = re.sub(r'SparklesIcon,\n', '', t)
    p.write_text(t)
    print(name, "ok")
