import React, { useEffect, useState, useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Boxes,
  Wallet,
  CircleDot,
  Activity,
  Package,
  Command,
  Zap,
  BarChart2,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════
   DATA
═══════════════════════════════════════ */

const MODULES = [
  {
    id: "finance",
    label: "Finance",
    tagline: "Billing & receivables",
    accentHex: "#F59E0B",
    accentTo: "#EF4444",
    shortcut: "⌥1",
    spark: [4, 7, 3, 9, 5, 8, 3],
    sparkLabel: "Overdue trend",
    progress: 34,
    statusText: "3 overdue",
    items: [
      {
        name: "Overdues",
        path: "/OverduesDashboard",
        icon: Wallet,
        badge: { text: "3 alerts", hot: true },
      },
    ],
  },
  {
    id: "sales",
    label: "Sales & CRM",
    tagline: "Pipeline & performance",
    accentHex: "#6366F1",
    accentTo: "#22D3EE",
    shortcut: "⌥2",
    spark: [62, 71, 58, 84, 77, 93, 110],
    sparkLabel: "Revenue (7d)",
    progress: 87,
    statusText: "₹2.4L today",
    items: [
      {
        name: "Sales Report",
        path: "/DailySalesReport",
        icon: TrendingUp,
        badge: { text: "Live", hot: false },
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    tagline: "Inventory & operations",
    accentHex: "#A78BFA",
    accentTo: "#EC4899",
    shortcut: "⌥3",
    spark: [22, 18, 21, 17, 15, 13, 12],
    sparkLabel: "Low-stock items",
    progress: 25,
    statusText: "12 low stock",
    items: [
      {
        name: "Chemicals Stock",
        path: "/Stockmanager",
        icon: Boxes,
        badge: { text: "12 low", hot: true },
      },
    ],
  },
];

const METRICS = [
  { label: "Revenue", raw: 240000, color: "#10B981", ring: 78 },
  { label: "Overdue", raw: 3, color: "#F59E0B", ring: 30 },
  { label: "Low Stock", raw: 12, color: "#F43F5E", ring: 20 },
];

const PULSE = [
  { dot: "#10B981", text: "Sales Report refreshed 6 min ago" },
  { dot: "#F59E0B", text: "3 invoices marked overdue today" },
  { dot: "#22D3EE", text: "12 stock items below threshold" },
  { dot: "#A78BFA", text: "2 new CRM activities logged" },
];

const MARQUEE = [
  { Icon: Activity, text: "Sales report updated · 6 min ago" },
  { Icon: Wallet, text: "Invoice #1042 marked overdue" },
  { Icon: Boxes, text: "Reorder triggered for 4 chemicals" },
  { Icon: BarChart2, text: "Monthly target 87% achieved" },
  { Icon: Zap, text: "₹85,000 collected today" },
  { Icon: Clock, text: "Stock audit scheduled · 3 pm" },
];

/* ═══════════════════════════════════════
   GLOBAL CSS
═══════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

.ho * { box-sizing: border-box; }
.ho   { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif; }

@keyframes ho-pulse-ring {
  0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,.55); }
  50%     { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
}
@keyframes ho-grad-shift {
  0%,100% { background-position: 0% center; }
  50%     { background-position: 100% center; }
}
@keyframes ho-shimmer {
  from { background-position: -300% center; }
  to   { background-position:  300% center; }
}
@keyframes ho-marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.ho-live-dot { animation: ho-pulse-ring 2.2s ease-in-out infinite; }

.ho-grad-word {
  background: linear-gradient(120deg, #6366F1, #22D3EE, #A78BFA, #6366F1);
  background-size: 300% auto;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; animation: ho-grad-shift 5s ease infinite;
}

.ho-btn-p {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; gap: 9px;
  padding: 14px 28px; border-radius: 14px; border: none;
  background: linear-gradient(135deg, #4338CA, #6366F1, #4338CA);
  background-size: 200% auto; color: #fff; font-size: 14px;
  font-weight: 700; cursor: pointer; letter-spacing: -.015em;
  font-family: inherit;
  box-shadow: 0 0 32px rgba(99,102,241,.5), 0 10px 28px rgba(99,102,241,.28);
  transition: transform .2s, box-shadow .2s;
}
.ho-btn-p::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.2), transparent);
  background-size: 300% 100%; animation: ho-shimmer 4s ease infinite;
}
.ho-btn-p:hover { transform: translateY(-2px) scale(1.02);
  box-shadow: 0 0 44px rgba(99,102,241,.65), 0 14px 36px rgba(99,102,241,.38); }
.ho-btn-p .ho-arr { transition: transform .2s; }
.ho-btn-p:hover .ho-arr { transform: translateX(3px); }

.ho-btn-g {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 14px 26px; border-radius: 14px;
  border: 1px solid rgba(255,255,255,.1); background: rgba(255,255,255,.04);
  color: #CBD5E1; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all .2s; font-family: inherit; letter-spacing: -.01em;
}
.ho-btn-g:hover { background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.2); transform: translateY(-2px); }

.ho-chip {
  display: flex; align-items: center; gap: 7px;
  padding: 5px 13px 5px 8px; border-radius: 10px;
  background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.07);
  transition: all .15s; cursor: default;
}
.ho-chip:hover { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.12); }

.ho-card {
  border-radius: 20px; border: 1px solid; padding: 22px;
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  transition: border-color .25s, box-shadow .25s, transform .3s, background .25s;
}
.ho-card:hover { transform: translateY(-4px); }

.ho-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 11px 14px; border-radius: 12px;
  border: 1px solid rgba(255,255,255,.04); border-left: 2px solid transparent;
  background: transparent; cursor: pointer; transition: all .15s;
  width: 100%; font-family: inherit; text-align: left;
}

.ho-qnav {
  display: flex; align-items: center; gap: 6px; padding: 4px 10px;
  border-radius: 8px; border: 1px solid rgba(255,255,255,.07);
  background: rgba(255,255,255,.03); cursor: pointer; transition: all .15s;
}
.ho-qnav:hover { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.14); }

.ho-mq-wrap {
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
  -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
}
.ho-mq-track { display: flex; width: max-content;
  animation: ho-marquee 30s linear infinite; }
.ho-mq-track:hover { animation-play-state: paused; }

/* ── Responsive ── */
@media (max-width: 1024px) {
  .ho-cards { grid-template-columns: repeat(2,1fr) !important; }
}
@media (max-width: 860px) {
  .ho-hero  { grid-template-columns: 1fr !important; }
  .ho-h1   { font-size: 42px !important; }
  .ho-container { padding: 16px 28px 56px !important; }
  .ho-topbar { flex-direction: column; align-items: flex-start !important; }
}
@media (max-width: 640px) {
  .ho-cards { grid-template-columns: 1fr !important; }
  .ho-h1   { font-size: 34px !important; }
  .ho-cta-row { flex-direction: column !important; }
}
`;

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */

function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? `${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)}`
    : "99,102,241";
}

function useCountUp(target, duration = 1400, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null,
      raf;
    const step = (ts) => {
      if (!start) start = ts + delay;
      const p = Math.min(Math.max(0, ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return val;
}

/* ═══════════════════════════════════════
   BACKGROUND CANVAS
═══════════════════════════════════════ */

function ParticlesBg() {
  const ref = useRef(null);
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    let raf, W, H;
    const resize = () => {
      W = cvs.width = cvs.offsetWidth;
      H = cvs.height = cvs.offsetHeight;
    };
    window.addEventListener("resize", resize);
    resize();
    class P {
      constructor() {
        this.x = Math.random() * W;
        this.y = Math.random() * H;
        this.vx = (Math.random() - 0.5) * 0.26;
        this.vy = (Math.random() - 0.5) * 0.26;
        this.r = Math.random() * 1.2 + 0.4;
        this.o = Math.random() * 0.32 + 0.07;
      }
      tick() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > W) this.vx *= -1;
        if (this.y < 0 || this.y > H) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${this.o})`;
        ctx.fill();
      }
    }
    const pts = Array.from({ length: 28 }, () => new P());
    const MAXD = 140;
    const loop = () => {
      ctx.clearRect(0, 0, W, H);
      pts.forEach((p) => {
        p.tick();
        p.draw();
      });
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < MAXD) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${(1 - d / MAXD) * 0.09})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

/* ═══════════════════════════════════════
   SPARKLINE
═══════════════════════════════════════ */

function Sparkline({ data, color, width = 88 }) {
  const W = width,
    H = 26;
  const lo = Math.min(...data),
    hi = Math.max(...data);
  const xOf = (i) => (i / (data.length - 1)) * W;
  const yOf = (v) => H - ((v - lo) / (hi - lo || 1)) * (H - 5) - 2;
  const pts = data.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" ");
  const area = `M ${data.map((v, i) => `${xOf(i)},${yOf(v)}`).join(" L ")} L ${W},${H} L 0,${H} Z`;
  const id = `sg${color.replace("#", "").slice(0, 6)}`;
  return (
    <svg width={W} height={H} style={{ overflow: "visible", flexShrink: 0 }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

/* ═══════════════════════════════════════
   PROGRESS BAR
═══════════════════════════════════════ */

function ProgressBar({ value, color }) {
  const rgb = hexToRgb(color);
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(value), 250);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div
      style={{
        height: 3,
        borderRadius: 2,
        background: "rgba(255,255,255,.06)",
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 2,
          width: `${w}%`,
          background: `linear-gradient(to right,${color},rgba(${rgb},.5))`,
          boxShadow: `0 0 8px rgba(${rgb},.6)`,
          transition: "width 1.2s cubic-bezier(0,.85,.3,1)",
        }}
      />
    </div>
  );
}

/* ═══════════════════════════════════════
   METRIC CHIP (ring + count-up)
═══════════════════════════════════════ */

function MetricChip({ metric, idx }) {
  const count = useCountUp(metric.raw, 1400, idx * 180);
  const display =
    metric.label === "Revenue"
      ? count >= 100000
        ? `₹${(count / 100000).toFixed(1)}L`
        : `₹${count.toLocaleString()}`
      : String(count);
  const R = 10,
    C = 2 * Math.PI * R,
    arc = (metric.ring / 100) * C;
  return (
    <div className="ho-chip">
      <svg width="26" height="26" style={{ flexShrink: 0 }}>
        <circle
          cx="13"
          cy="13"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,.07)"
          strokeWidth="2"
        />
        <circle
          cx="13"
          cy="13"
          r={R}
          fill="none"
          stroke={metric.color}
          strokeWidth="2"
          strokeDasharray={`${arc} ${C}`}
          strokeLinecap="round"
          transform="rotate(-90 13 13)"
        />
      </svg>
      <span style={{ fontSize: 11, color: "#4B5563" }}>{metric.label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: metric.color,
          letterSpacing: "-.02em",
        }}
      >
        {display}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════
   ACTIVITY MARQUEE
═══════════════════════════════════════ */

function ActivityMarquee() {
  const items = [...MARQUEE, ...MARQUEE];
  return (
    <div className="ho-mq-wrap">
      <div className="ho-mq-track">
        {items.map(({ Icon, text }, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 24px",
              borderRight: "1px solid rgba(255,255,255,.05)",
              whiteSpace: "nowrap",
            }}
          >
            <Icon
              style={{ width: 12, height: 12, color: "#2D3748", flexShrink: 0 }}
            />
            <span
              style={{
                fontSize: 12,
                color: "#374151",
                letterSpacing: "-.01em",
              }}
            >
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   STATUS PANEL (hero right column)
═══════════════════════════════════════ */

function StatusPanel({ pulseIdx, mounted }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "opacity .55s .2s, transform .55s .2s",
      }}
    >
      {/* Live pulse ticker */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,.07)",
          background: "rgba(255,255,255,.02)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 10,
          }}
        >
          <span
            className="ho-live-dot"
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#10B981",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".12em",
              textTransform: "uppercase",
              color: "#374151",
            }}
          >
            Live updates
          </span>
        </div>
        <div style={{ height: 22, overflow: "hidden", position: "relative" }}>
          {PULSE.map((line, idx) => (
            <div
              key={line.text}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                color: "#6B7280",
                opacity: idx === pulseIdx ? 1 : 0,
                transform:
                  idx === pulseIdx ? "translateY(0)" : "translateY(8px)",
                transition: "opacity .45s, transform .45s",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: line.dot,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              {line.text}
            </div>
          ))}
        </div>
      </div>

      {/* Module health mini-list */}
      <div
        style={{
          padding: "16px 18px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,.07)",
          background: "rgba(255,255,255,.02)",
          backdropFilter: "blur(16px)",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#374151",
            margin: "0 0 12px",
          }}
        >
          Module Health
        </p>
        {MODULES.map((cat) => {
          const rgb = hexToRgb(cat.accentHex);
          return (
            <div
              key={cat.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "9px 12px",
                borderRadius: 10,
                marginBottom: 7,
                background: `rgba(${rgb},.035)`,
                border: `1px solid rgba(${rgb},.14)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: cat.accentHex,
                    display: "inline-block",
                    boxShadow: `0 0 8px rgba(${rgb},.6)`,
                  }}
                />
                <span
                  style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}
                >
                  {cat.label}
                </span>
              </div>
              <span
                style={{ fontSize: 11, color: cat.accentHex, fontWeight: 700 }}
              >
                {cat.statusText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   MODULE CARD
═══════════════════════════════════════ */

function ModuleCard({ cat, navigate, delay, mounted }) {
  const [cardHov, setCardHov] = useState(false);
  const [itemHov, setItemHov] = useState(null);
  const rgb = hexToRgb(cat.accentHex);

  return (
    <div
      className="ho-card"
      style={{
        background: cardHov
          ? `linear-gradient(135deg,rgba(${rgb},.08) 0%,rgba(255,255,255,.04) 100%)`
          : `linear-gradient(135deg,rgba(${rgb},.04) 0%,rgba(255,255,255,.015) 100%)`,
        borderColor: cardHov ? `rgba(${rgb},.42)` : `rgba(${rgb},.2)`,
        boxShadow: cardHov
          ? `0 0 52px rgba(${rgb},.22),inset 0 1px 0 rgba(255,255,255,.08),0 8px 32px rgba(0,0,0,.45)`
          : `0 0 24px rgba(${rgb},.07),inset 0 1px 0 rgba(255,255,255,.04),0 4px 16px rgba(0,0,0,.3)`,
        transform: mounted
          ? cardHov
            ? "translateY(-4px)"
            : "translateY(0)"
          : "translateY(20px)",
        opacity: mounted ? 1 : 0,
        transition: `opacity .5s ease ${delay}ms, transform .35s, border-color .2s, box-shadow .2s, background .2s`,
      }}
      onMouseEnter={() => setCardHov(true)}
      onMouseLeave={() => setCardHov(false)}
    >
      {/* ── Card header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              width: 3,
              height: 38,
              borderRadius: 4,
              flexShrink: 0,
              display: "inline-block",
              background: `linear-gradient(to bottom,${cat.accentHex},${cat.accentTo})`,
              boxShadow: `0 0 18px rgba(${rgb},.6)`,
            }}
          />
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "#D1D5DB",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {cat.label}
            </p>
            <p
              style={{
                fontSize: 11,
                color: "#374151",
                margin: "3px 0 0",
                lineHeight: 1.3,
              }}
            >
              {cat.tagline}
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "3px 7px",
            borderRadius: 5,
            border: "1px solid rgba(255,255,255,.09)",
            background: "rgba(255,255,255,.04)",
            color: "#3B4558",
            fontFamily: "monospace",
            letterSpacing: ".04em",
          }}
        >
          {cat.shortcut}
        </span>
      </div>

      {/* ── Sparkline data strip ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 16,
          padding: "11px 14px",
          borderRadius: 12,
          background: "rgba(255,255,255,.025)",
          border: "1px solid rgba(255,255,255,.05)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontSize: 10,
              color: "#374151",
              letterSpacing: ".06em",
              textTransform: "uppercase",
              margin: "0 0 8px",
              fontWeight: 700,
            }}
          >
            {cat.sparkLabel}
          </p>
          <ProgressBar value={cat.progress} color={cat.accentHex} />
        </div>
        <Sparkline data={cat.spark} color={cat.accentHex} width={96} />
      </div>

      {/* ── Items ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {cat.items.map((item) => {
          const hov = itemHov === item.name;
          return (
            <button
              key={item.name}
              className="ho-item"
              style={{
                background: hov ? `rgba(${rgb},.08)` : "transparent",
                borderColor: hov ? `rgba(${rgb},.25)` : "rgba(255,255,255,.04)",
                borderLeftColor: hov ? cat.accentHex : "transparent",
              }}
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setItemHov(item.name)}
              onMouseLeave={() => setItemHov(null)}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 30,
                    height: 30,
                    borderRadius: 9,
                    flexShrink: 0,
                    background: hov
                      ? `rgba(${rgb},.18)`
                      : "rgba(255,255,255,.05)",
                    color: hov ? cat.accentHex : "#6B7280",
                    transition: "background .15s, color .15s",
                  }}
                >
                  <item.icon style={{ width: 14, height: 14 }} />
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: hov ? "#F1F5F9" : "#9CA3AF",
                    letterSpacing: "-.01em",
                    transition: "color .15s",
                  }}
                >
                  {item.name}
                </span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {item.badge && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: ".04em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid",
                      background: item.badge.hot
                        ? `rgba(${rgb},.15)`
                        : "rgba(16,185,129,.12)",
                      color: item.badge.hot ? cat.accentHex : "#10B981",
                      borderColor: item.badge.hot
                        ? `rgba(${rgb},.3)`
                        : "rgba(16,185,129,.3)",
                    }}
                  >
                    {item.badge.text}
                  </span>
                )}
                <ChevronRight
                  style={{
                    width: 13,
                    height: 13,
                    color: hov ? "#94A3B8" : "#2D3748",
                    transition: "color .15s",
                  }}
                />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════ */

export default function HeroSection() {
  const navigate = useNavigate();
  const [pulseIdx, setPulseIdx] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    const id = setInterval(
      () => setPulseIdx((i) => (i + 1) % PULSE.length),
      3200,
    );
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>

      <section
        className="ho"
        style={{
          position: "relative",
          overflow: "hidden",
          background: "#030712",
          minHeight: "100vh",
        }}
      >
        {/* ── Atmosphere layers ── */}
        <ParticlesBg />
        <div
          style={{
            position: "absolute",
            top: "-18%",
            left: "-10%",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(99,102,241,.11) 0%,transparent 70%)",
            filter: "blur(70px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-15%",
            right: "-8%",
            width: 580,
            height: 580,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(245,158,11,.08) 0%,transparent 70%)",
            filter: "blur(65px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "35%",
            width: 440,
            height: 440,
            borderRadius: "50%",
            background:
              "radial-gradient(circle,rgba(167,139,250,.06) 0%,transparent 70%)",
            filter: "blur(90px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,.03) 1px,transparent 1px)",
            backgroundSize: "36px 36px",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 50% at 50% 100%,#030712 0%,transparent 100%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="ho-container"
          style={{
            position: "relative",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "22px 48px 64px",
          }}
        >
          {/* ══════════════════════════════
              TOP CHROME BAR
          ══════════════════════════════ */}
          <div
            className="ho-topbar"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 18,
              marginBottom: 60,
              borderBottom: "1px solid rgba(255,255,255,.05)",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background: "linear-gradient(135deg,#6366F1,#22D3EE)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles style={{ width: 13, height: 13, color: "#fff" }} />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  letterSpacing: "-.02em",
                  color: "#D1D5DB",
                }}
              >
                Office Suite
              </span>
              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "rgba(99,102,241,.12)",
                  color: "#818CF8",
                  fontWeight: 600,
                  border: "1px solid rgba(99,102,241,.2)",
                }}
              >
                3 modules
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {METRICS.map((m, i) => (
                <MetricChip key={m.label} metric={m} idx={i} />
              ))}
              <div
                style={{
                  width: 1,
                  height: 24,
                  background: "rgba(255,255,255,.07)",
                  margin: "0 2px",
                }}
              />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,.08)",
                  background: "rgba(255,255,255,.03)",
                  cursor: "pointer",
                  transition: "all .15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,.07)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,.03)")
                }
              >
                <Command style={{ width: 12, height: 12, color: "#4B5563" }} />
                <span
                  style={{
                    fontSize: 11,
                    color: "#4B5563",
                    fontWeight: 700,
                    fontFamily: "monospace",
                  }}
                >
                  K
                </span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════
              HERO: 2-col (text | status)
          ══════════════════════════════ */}
          <div
            className="ho-hero"
            style={{
              display: "grid",
              gridTemplateColumns: "1.25fr 0.75fr",
              gap: 64,
              alignItems: "start",
              marginBottom: 48,
            }}
          >
            {/* LEFT: eyebrow + headline + subtext + CTAs + quicknav */}
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {/* Eyebrow badge */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 16px 7px 10px",
                  borderRadius: 100,
                  border: "1px solid rgba(99,102,241,.3)",
                  background: "rgba(99,102,241,.07)",
                  backdropFilter: "blur(10px)",
                  width: "fit-content",
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(8px)",
                  transition: "opacity .5s .1s, transform .5s .1s",
                }}
              >
                <Sparkles style={{ width: 14, height: 14, color: "#818CF8" }} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    background: "linear-gradient(to right,#818CF8,#67E8F9)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  One login · Every tool · Full visibility
                </span>
              </div>

              {/* Headline */}
              <div
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(12px)",
                  transition: "opacity .55s .18s, transform .55s .18s",
                }}
              >
                <h1
                  className="ho-h1"
                  style={{
                    fontSize: 68,
                    fontWeight: 900,
                    lineHeight: 1.0,
                    letterSpacing: "-.04em",
                    margin: 0,
                  }}
                >
                  <span style={{ color: "#F1F5F9" }}>Your</span>
                  <br />
                  <span
                    className="ho-grad-word"
                    style={{ display: "inline-block" }}
                  >
                    Office
                  </span>
                  <br />
                  <span style={{ color: "#F1F5F9" }}>Command</span>
                  <br />
                  <span
                    style={{
                      color: "transparent",
                      WebkitTextStroke: "1.5px rgba(99,102,241,.35)",
                      letterSpacing: "-.02em",
                    }}
                  >
                    Center.
                  </span>
                </h1>
                <p
                  style={{
                    margin: "22px 0 0",
                    fontSize: 16,
                    lineHeight: 1.82,
                    color: "#52627A",
                    maxWidth: 460,
                  }}
                >
                  Billing, sales, CRM, and inventory — all from one dashboard.
                  No chaos. No tab switching. Just the work that matters.
                </p>
              </div>

              {/* CTAs + quick-nav */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? "translateY(0)" : "translateY(10px)",
                  transition: "opacity .55s .32s, transform .55s .32s",
                }}
              >
                <div
                  className="ho-cta-row"
                  style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
                >
                  <button
                    className="ho-btn-p"
                    onClick={() => navigate("/DailySalesReport")}
                  >
                    <Activity style={{ width: 15, height: 15 }} />
                    Sales Report
                    <ArrowRight
                      className="ho-arr"
                      style={{ width: 15, height: 15 }}
                    />
                  </button>
                  <button
                    className="ho-btn-g"
                    onClick={() => navigate("/Stockmanager")}
                  >
                    <Package style={{ width: 15, height: 15 }} />
                    Stock List
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: "#2D3748", marginRight: 2 }}
                  >
                    Quick nav:
                  </span>
                  {MODULES.map((m) => (
                    <button
                      key={m.id}
                      className="ho-qnav"
                      onClick={() => navigate(m.items[0].path)}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          padding: "2px 5px",
                          borderRadius: 5,
                          border: "1px solid rgba(255,255,255,.1)",
                          background: "rgba(255,255,255,.05)",
                          color: "#4B5563",
                          fontFamily: "monospace",
                        }}
                      >
                        {m.shortcut}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#374151",
                          fontWeight: 500,
                        }}
                      >
                        {m.label.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: live pulse + module health */}
            <StatusPanel pulseIdx={pulseIdx} mounted={mounted} />
          </div>

          {/* ══════════════════════════════
              SECTION DIVIDER + LABEL
          ══════════════════════════════ */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
              opacity: mounted ? 1 : 0,
              transition: "opacity .5s .55s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 3,
                  height: 16,
                  borderRadius: 2,
                  background: "linear-gradient(to bottom,#6366F1,#22D3EE)",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "#374151",
                }}
              >
                All Modules
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#2D3748" }}>3 active</span>
          </div>

          {/* ══════════════════════════════
              HORIZONTAL CARDS ROW
          ══════════════════════════════ */}
          <div
            className="ho-cards"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 16,
              marginBottom: 48,
            }}
          >
            {MODULES.map((cat, i) => (
              <ModuleCard
                key={cat.id}
                cat={cat}
                navigate={navigate}
                delay={i * 100}
                mounted={mounted}
              />
            ))}
          </div>

          {/* ══════════════════════════════
              ACTIVITY MARQUEE
          ══════════════════════════════ */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,.05)",
              paddingTop: 18,
              opacity: mounted ? 1 : 0,
              transition: "opacity .6s .8s",
            }}
          >
            <ActivityMarquee />
          </div>
        </div>
      </section>
    </>
  );
}
