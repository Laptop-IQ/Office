# "Not-AI-looking" UI pass

Main file: `src/theme.human.css` (imported last in `src/main.jsx`).
Remove that import to get the old look back (JSX edits below stay).

## Tailwind / CSS tokens
- violet / purple / fuchsia / indigo scales now alias to `blue` -> one accent colour
- gold / brass accent replaced by one blue (`--ds-primary`, `--ov-gold`, `--color-primary` ...)
- radii: `rounded-xl/2xl/3xl` = 8-10px
- shadows: flat grey (`--shadow-*`, `--ds-shadow-*`); glow tokens are transparent
- `.glass` / backdrop blur removed, Playfair serif headings -> Inter

## JSX
- scripts/dehype.py: gradient fills -> solid, gradient text -> plain, backdrop-blur,
  coloured glow shadows, orb/shine/hairline decorations, 24-32px radii removed
- scripts/flatten_gradients.py: inline `linear-gradient` fills -> solid colour
- Forgot / Verify / Reset password: split-screen marketing panel, sparkle pill and
  numbered steps removed -> simple centred form card
- Hero (home): orbit/stars/spotlight animation replaced by a plain Tailwind page

## Emoji -> Remix icons
- `src/components/Ico.jsx`: emoji/symbol -> `react-icons/ri` mapping. Use `<Ico e="📦" />`.
- Location icons saved in user data (old emoji strings) still work: `Ico` maps them at render time.
- Toasts, <option> text and print-report HTML cannot hold icons, so emoji were just removed there.
- Backend console/email emoji removed.

## Second pass
- all `backdrop-filter` blur removed (modals/bars now plain translucent or solid)
- Customerlist stat-card blurred orbs, ProductAnalytics grid texture, page-background radial glows removed
