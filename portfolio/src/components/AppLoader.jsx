import "./app-loader.css";

/**
 * One loading screen for the whole app (route chunks, auth gate, Stock Manager,
 * Dispatch). It uses the main theme tokens (--ov-*), so it follows dark / light
 * theme and matches the pages it loads into.
 *
 *   variant="full"  → covers the whole viewport (top-level route fallback)
 *   variant="page"  → fills the area below the fixed navbar
 */
const DefaultMark = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 8 12 3 3 8l9 5 9-5Z" />
    <path d="m3 8 0 8 9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
);

export default function AppLoader({ variant = "full", label = "Loading", hint, icon }) {
  return (
    <div className={`apl apl--${variant}`} role="status" aria-live="polite" aria-label={label}>
      <div className="apl-bar" aria-hidden="true" />
      <div className="apl-stack">
        <div className="apl-mark" aria-hidden="true">
          <span className="apl-ring" />
          <span className="apl-ring r2" />
          <span className="apl-core">{icon || <DefaultMark />}</span>
        </div>
        <div className="apl-label">
          {label}
          <span className="apl-dots" aria-hidden="true">
            <i /><i /><i />
          </span>
        </div>
        {hint && <div className="apl-hint">{hint}</div>}
      </div>
    </div>
  );
}
