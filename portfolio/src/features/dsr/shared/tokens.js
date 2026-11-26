// features/dsr/shared/tokens.js
// Design tokens (CSS-variable references) and the shared input style used by DSR forms.
// Colours live in the theme CSS (theme.css) — change them there, not here.

export const DS = {
  bg: "var(--ds-bg)",
  sidebar: "var(--ds-sidebar)",
  card: "var(--ds-card)",
  surface: "var(--ds-surface)",
  border: "var(--ds-border)",
  borderHi: "var(--ds-borderHi)",
  primary: "var(--ds-primary)",
  primaryGlow: "var(--ds-primaryGlow)",
  primaryDim: "var(--ds-primaryDim)",
  gold: "var(--ds-gold)",
  goldGlow: "var(--ds-goldGlow)",
  goldDim: "var(--ds-goldDim)",
  text1: "var(--ds-text1)",
  text2: "var(--ds-text2)",
  text3: "var(--ds-text3)",
  success: "var(--ds-success)",
  danger: "var(--ds-danger)",
  warning: "var(--ds-warning)",
  amber: "var(--ds-amber)",
  info: "var(--ds-info)",
  purple: "var(--ds-purple)",
};

export const IS = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1px solid var(--ds-border)`,
  borderRadius: 8,
  fontSize: 13,
  color: "var(--ds-text1)",
  background: "color-mix(in srgb, var(--wash) 4.0%, transparent)",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
