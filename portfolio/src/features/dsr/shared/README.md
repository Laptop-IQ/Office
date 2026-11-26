# DSR shared primitives

Things every DSR (Daily Sales Report) screen needs, extracted out of `components/DailySalesReport.jsx`
so features can import them without depending on the 9,000-line page.

| File | What |
|---|---|
| `tokens.js` | `DS` colour tokens (CSS variables), `IS` input style |
| `stages.js`, `StageLadder.jsx` | project stages A–H, colours, ladder widget |
| `Icon.jsx` | inline SVG icon set |
| `format.js` | pure helpers: `toNum`, `fmtDate`, `fmtL`, `daysSince(d, now?)`, mobile helpers, `getInitials` |
| `http.js` | `apiFetch` (auth header, JSON, throws `Error(message)`) |
| `routes.js`, `insightKinds.js` | `BASE`, `ROUTES`, `parseRoute` for `/DailySalesReport/*` |
| `excel.js` | customer Excel export + `downloadBlob` |
| `PageShell.jsx`, `SectionCard.jsx` | page chrome |

Import from `@/features/dsr/shared` (barrel `index.js`). `format.js` has no imports so plain Node can test it.
Next candidates to extract from the monolith: records list/toolbar, overdue/period report, forms.

## Styling (Tailwind v4)

* **Utilities first.** Style JSX with Tailwind classes. Design tokens are Tailwind colours:
  `bg-ds-card`, `text-ds-text1`, `border-ds-border`, `text-ds-primary`, `fill-ds-…` (defined in
  `../dsr-theme.css` from the `--ds-*` variables of `theme.css`, so light/dark switching still works).
* **Exact values stay exact.** Spacing that is a multiple of 2px uses the scale (`gap-2`, `px-3`, `pl-8.5`);
  anything else is an arbitrary value (`h-[38px]`, `text-[13px]`, `[box-shadow:var(--ds-shadow-card)]`).
* **Component classes** (`.dsr-*`, `.kc-*`, the form control `.dsr-field`) live in `../dsr.css` /
  `keyCustomers.css`, inside `@layer components`. Utilities sit in a higher layer, so a utility on the same
  element always wins — exactly how the old inline styles behaved. Keep rules there only when utilities can't
  express them (keyframes, descendant selectors, media-query overrides).
* **Inline `style` only for runtime values**: data-driven colours (`sc.bg`), popup positions (`pos.top`),
  computed widths, CSS custom properties (`--h`, `--p`).
* **Layer gotcha.** Layered CSS loses to *unlayered* CSS, and for `!important` the order is reversed. Any
  global stylesheet that overrides DSR classes must sit in the same layer (see the DSR block in `appshell.css`).
* **Check visually after styling changes**: compare screenshots before/after (Chromium + pixelmatch) —
  structure and computed styles can look right while a cascade-layer problem only shows on some pages.
