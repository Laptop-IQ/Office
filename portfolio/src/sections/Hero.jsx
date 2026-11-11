import React, { useEffect, useMemo } from "react";
import {
  Activity,
  ChevronRight,
  CreditCard,
  FileText,
  ListChecks,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

/* Home. Graphite surfaces, one gold accent, one list of the main pages. */

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&display=swap";

const CSS = `
.hq, .hq * { box-sizing: border-box; }

.hq {
  --bg: #141415;
  --card: #19191b;
  --raised: #232325;
  --line: rgba(237, 237, 237, 0.08);
  --text: #ededed;
  --text-2: #a1a1a6;
  --muted: #85858b;
  --accent: #d4af6a;
  --btn-bg: #d4af6a;
  --btn-fg: #1a1408;
  --btn-bg-hover: #dcba7a;
  --ease: cubic-bezier(0.22, 1, 0.36, 1);
  --nav-h: 56px;
  --foot-h: 60px;

  position: relative;
  width: 100%;
  min-height: calc(100vh - var(--foot-h));
  min-height: calc(100svh - var(--foot-h));
  padding-top: var(--nav-h);
  display: flex;
  flex-direction: column;
  color: var(--text);
  background: var(--bg);
  font-family: "Geist", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

html[data-theme="light"] .hq {
  --bg: #fafafa;
  --card: #ffffff;
  --raised: #f4f4f5;
  --line: rgba(23, 23, 23, 0.08);
  --text: #171717;
  --text-2: #525252;
  --muted: #737373;
  --accent: #8a5f0f;
  --btn-bg: #171717;
  --btn-fg: #ffffff;
  --btn-bg-hover: #2b2b2b;
}

.hq-container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 32px;
}

/* ───────── top: copy and main pages ───────── */
.hq-hero {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
  align-items: center;
  column-gap: 64px;
  padding: 64px 0;
}

.hq-copy { max-width: 560px; }

.hq-date {
  display: block;
  margin-bottom: 24px;
  font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 20px;
  color: var(--muted);
}

.hq-title {
  margin: 0;
  font-size: 60px;
  line-height: 1.05;
  font-weight: 500;
  letter-spacing: -0.03em;
  color: var(--text);
  text-wrap: balance;
}

.hq-description {
  margin: 24px 0 0;
  max-width: 36rem;
  font-size: 18px;
  line-height: 28px;
  color: var(--text-2);
}

/* ───────── main pages index ───────── */
.hq-visual { display: flex; justify-content: flex-end; }

.hq-index {
  width: 100%;
  max-width: 560px;
  padding: 8px;
  border-radius: 16px;
  background: var(--card);
  border: 1px solid var(--line);
}
html[data-theme="light"] .hq-index { box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }

.hq-index-label {
  padding: 12px 16px 8px;
  font-size: 13px;
  line-height: 20px;
  color: var(--muted);
}

.hq-row {
  width: 100%;
  min-height: 88px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background-color 160ms var(--ease);
}
.hq-row { position: relative; }
.hq-row + .hq-row::before {
  content: "";
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: var(--line);
}
.hq-row:hover { background: var(--raised); }
.hq-row:hover::before, .hq-row:hover + .hq-row::before { opacity: 0; }
.hq-row:focus-visible { outline: 2px solid var(--accent); outline-offset: -2px; }

.hq-row-icon {
  flex: none;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--raised);
  color: var(--text-2);
}
.hq-row:hover .hq-row-icon { background: var(--card); }
.hq-row-first .hq-row-icon { color: var(--accent); }

.hq-row-text { flex: 1; min-width: 0; display: block; }
.hq-row-title { display: block; font-size: 18px; line-height: 28px; font-weight: 500; }
.hq-row-sub { display: block; font-size: 14px; line-height: 20px; color: var(--text-2); }
.hq-row-chevron { flex: none; color: var(--muted); }

/* ───────── modules strip ───────── */
.hq-strip { border-top: 1px solid var(--line); }
.hq-strip-inner {
  display: flex;
  align-items: center;
  gap: 32px;
  min-height: 72px;
}
.hq-strip-label {
  flex: none;
  font-size: 13px;
  color: var(--muted);
}
.hq-strip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.hq-link {
  min-height: 36px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--text-2);
  text-decoration: none;
  transition: color 160ms var(--ease), background-color 160ms var(--ease);
}
.hq-link svg { flex: none; color: var(--muted); }
.hq-link:hover { color: var(--text); background: var(--raised); }
.hq-link:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }

/* ───────── entrance ───────── */
@keyframes hq-rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: none; }
}
.hq-reveal { animation: hq-rise 400ms var(--ease) both; animation-delay: calc(var(--i, 0) * 50ms); }

@media (prefers-reduced-motion: reduce) {
  .hq-reveal { animation: none; }
  .hq-row, .hq-link { transition: none; }
}

/* ───────── tablet and mobile ───────── */
@media (max-width: 1023px) {
  .hq-hero { grid-template-columns: 1fr; row-gap: 48px; padding: 48px 0; }
  .hq-visual { justify-content: flex-start; }
  .hq-title { font-size: 48px; }
}
@media (max-width: 639px) {
  .hq-container { padding: 0 20px; }
  .hq-hero { row-gap: 40px; padding: 40px 0; }
  .hq-title { font-size: 40px; }
  .hq-description { font-size: 16px; line-height: 24px; }
  .hq-row { min-height: 72px; padding: 12px; }
  .hq-strip-inner { flex-direction: column; align-items: flex-start; gap: 8px; padding: 16px 20px; }
  .hq-strip-list { margin-left: -12px; }
}
`;

const MAIN = [
  {
    name: "Open sales report",
    sub: "Today's billing and sales at a glance",
    path: "/DailySalesReport",
    icon: Activity,
  },
  {
    name: "View stock",
    sub: "Check what is running low",
    path: "/Stockmanager",
    icon: Package,
  },
  {
    name: "Overdue payments",
    sub: "See who owes you and follow up",
    path: "/OverduesDashboard",
    icon: CreditCard,
  },
];

const MORE = [
  { name: "Dispatch", path: "/Dispatch", icon: Truck },
  { name: "Price list", path: "/pricelist", icon: ListChecks },
  { name: "Purchase", path: "/purchase", icon: ShoppingCart },
  { name: "Ecofast trial reports", path: "/Ecofast", icon: FileText },
];

export default function HeroSection() {
  const navigate = useNavigate();

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
    []
  );

  useEffect(() => {
    if (document.getElementById("hq-fonts")) return;
    const link = document.createElement("link");
    link.id = "hq-fonts";
    link.rel = "stylesheet";
    link.href = FONT_URL;
    document.head.append(link);
  }, []);

  return (
    <>
      <style>{CSS}</style>

      <div className="hq">
        <div className="hq-container" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <section className="hq-hero">
            <div className="hq-copy">
              <span className="hq-date hq-reveal" style={{ "--i": 0 }}>
                {dateLabel}
              </span>

              <h1 className="hq-title hq-reveal" style={{ "--i": 1 }}>
                Sales, stock and overdue payments in one place
              </h1>

              <p className="hq-description hq-reveal" style={{ "--i": 2 }}>
                Billing, sales, CRM and inventory in one workspace. See what
                needs attention first.
              </p>
            </div>

            <div className="hq-visual hq-reveal" style={{ "--i": 2 }}>
              <nav className="hq-index" aria-label="Main pages">
                <div className="hq-index-label">Main pages</div>
                {MAIN.map(({ name, sub, path, icon: Icon }, i) => (
                  <button
                    key={path}
                    type="button"
                    className={`hq-row${i === 0 ? " hq-row-first" : ""}`}
                    onClick={() => navigate(path)}
                  >
                    <span className="hq-row-icon">
                      <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className="hq-row-text">
                      <span className="hq-row-title">{name}</span>
                      <span className="hq-row-sub">{sub}</span>
                    </span>
                    <ChevronRight className="hq-row-chevron" size={18} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                ))}
              </nav>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
