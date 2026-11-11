import { Link, NavLink } from "react-router-dom";
import { useStock } from "./store";
import { Ico } from "./icons";
import AppLoader from "../AppLoader";
import "./stock.css";

export const Search = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const SYNC = {
  synced: ["Synced", ""],
  saving: ["Saving…", "busy"],
  idle: ["Saved", ""],
  error: ["Local save failed", "warn"],
  "auth-error": ["Session expired", "warn"],
  "remote-error": ["Server save failed — data safe locally", "warn"],
};

const STOCK_NAV = [
  ["/Stockmanager", "Overview", "▦", true],
  ["/Stockmanager/locations", "Locations", "📍"],
  ["/Stockmanager/alerts", "Alerts", "⚠", false, true],
  ["/Stockmanager/transfer", "Transfer", "⇄"],
  ["/Stockmanager/log", "Activity", "🕘"],
  ["/Stockmanager/settings", "Settings", "⚙"],
];
const DISPATCH_NAV = [
  ["/Dispatch", "Ledger", "📤", true],
  ["/Dispatch/new", "New dispatch", "＋"],
];

export function Shell({ section, children }) {
  const { syncState, alertCount, toasts, companyName } = useStock();
  const [label, cls] = SYNC[syncState] || SYNC.idle;
  const nav = section === "dispatch" ? DISPATCH_NAV : STOCK_NAV;
  const mobile =
    section === "dispatch"
      ? [["/Dispatch", "Ledger", "📤", true], ["/Dispatch/new", "New", "＋"], ["/Stockmanager", "Stock", "📦"]]
      : [["/Stockmanager", "Stock", "▦", true], ["/Stockmanager/alerts", "Alerts", "⚠", false, true], ["/Dispatch", "Dispatch", "📤"], ["/Stockmanager/settings", "More", "⚙"]];
  return (
    <div className="sk-root">
      <header className="sk-bar">
        <div className="sk-bar-in">
          <Link to="/" className="sk-brand" style={{ textDecoration: "none", color: "inherit" }} aria-label="Home">
            <div className="sk-logo"><Ico v={section === "dispatch" ? "📤" : "⚗"} /></div>
            <div>
              <div className="sk-brand-t">{section === "dispatch" ? "Dispatch" : "Stock Manager"}</div>
              <div className="sk-brand-s">{companyName}</div>
            </div>
          </Link>
          <nav className="sk-nav" aria-label="Sections">
            {nav.map(([to, label, ic, end, badge]) => (
              <NavLink key={to} to={to} end={!!end} className={({ isActive }) => (isActive ? "on" : "")}>
                <Ico v={ic} />
                {label}
                {badge && alertCount > 0 && <span className="sk-badge-n">{alertCount}</span>}
              </NavLink>
            ))}
          </nav>
          <div className="sk-bar-sp" />
          <span className="sk-sync" role="status">
            <i className={`sk-dot ${cls}`} />
            <span>{label}</span>
          </span>
          {section === "dispatch" ? (
            <Link to="/Stockmanager" className="sk-btn sm"><Ico v="📦" /> Stock</Link>
          ) : (
            <Link to="/Dispatch" className="sk-btn sm pri"><Ico v="📤" /> Dispatch</Link>
          )}
        </div>
      </header>
      {children}
      <nav className="sk-bnav" aria-label="Quick navigation">
        {mobile.map(([to, label, ic, end, badge]) => (
          <NavLink key={to} to={to} end={!!end} className={({ isActive }) => (isActive ? "on" : "")}>
            <span className="ic" aria-hidden="true"><Ico v={ic} /></span>
            {label}
            {badge && alertCount > 0 && <span className="sk-badge-n">{alertCount}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sk-toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`sk-toast ${t.type === "error" ? "error" : ""}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

export function Page({ crumbs = [], title, sub, actions, icon, children, narrow }) {
  return (
    <main className="sk-wrap" style={narrow ? { maxWidth: narrow } : undefined}>
      {crumbs.length > 0 && (
        <div className="sk-crumbs">
          {crumbs.map(([to, label], i) => (
            <span key={i} style={{ display: "contents" }}>
              {i > 0 && <span aria-hidden="true">/</span>}
              {to ? <Link to={to}>{label}</Link> : <span style={{ color: "var(--ov-text1)", fontWeight: 600 }}>{label}</span>}
            </span>
          ))}
        </div>
      )}
      <div className="sk-head">
        <div>
          <h1 className="sk-title">
            {icon && <span aria-hidden="true" className="sk-ico"><Ico v={icon} /></span>}
            {title}
          </h1>
          {sub && <div className="sk-sub">{sub}</div>}
        </div>
        {actions && <div className="sk-actions">{actions}</div>}
      </div>
      {children}
    </main>
  );
}

export const Kpi = ({ label, value, sub, color, icon }) => (
  <div className="sk-kpi" style={color ? { "--k": color } : undefined}>
    <div className="sk-kpi-l">
      {label}
      {icon && <span className="sk-kpi-ic" aria-hidden="true"><Ico v={icon} /></span>}
    </div>
    <div className="sk-kpi-v sk-mono">{value}</div>
    {sub && <div className="sk-kpi-s">{sub}</div>}
  </div>
);

export const Empty = ({ icon = "📦", title, text, children }) => (
  <div className="sk-card sk-empty">
    <div className="sk-empty-ic" aria-hidden="true"><Ico v={icon} /></div>
    <h3>{title}</h3>
    <p>{text}</p>
    {children}
  </div>
);

export const Field = ({ label, required, hint, error, full, children }) => (
  <div className={`sk-field${full ? " full" : ""}`}>
    <label>
      {label} {required && <em>*</em>}
    </label>
    {children}
    {error ? <div className="sk-err">{error}</div> : hint ? <div className="sk-hint">{hint}</div> : null}
  </div>
);

export const Card = ({ title, icon, right, children, className = "", pad = true, style }) => (
  <section className={`sk-card ${pad ? "sk-card-p" : ""} ${className}`} style={style}>
    {(title || right) && (
      <div className="sk-card-h">
        <div className="sk-card-t">
          {icon && <span aria-hidden="true" className="sk-ico"><Ico v={icon} /></span>}
          {title}
        </div>
        {right}
      </div>
    )}
    {children}
  </section>
);

export const StatusPill = ({ status }) => (
  <span className={`sk-pill ${status}`}>{status === "ok" ? "In stock" : status === "low" ? "Low" : "Out of stock"}</span>
);

export const Loading = ({ section = "stock" }) => (
  <div className="sk-root" style={{ minHeight: 0, paddingBottom: 0 }}>
    <AppLoader
      variant="page"
      icon={<Ico v={section === "dispatch" ? "📤" : "⚗"} />}
      label={section === "dispatch" ? "Opening Dispatch" : "Opening Stock Manager"}
      hint="Fetching your latest stock data"
    />
  </div>
);

export const LoadError = ({ onRetry }) => (
  <div className="sk-root">
    <div className="sk-wrap" style={{ paddingTop: 80 }}>
      <Empty icon="📡" title="Could not connect to the server" text="Check your internet connection or whether the backend is running, then try again.">
        <button className="sk-btn pri" onClick={onRetry}><Ico v="↻" /> Retry</button>
      </Empty>
    </div>
  </div>
);
