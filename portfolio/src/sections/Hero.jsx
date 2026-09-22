import React, { useEffect, useMemo, useRef } from "react";
import {
  Activity,
  Boxes,
  ChevronRight,
  Command,
  IndianRupee,
  Package,
  Receipt,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   CSS
   Performance rules used here:
   - every animation only touches transform / opacity (GPU)
   - no blur() filters, no backdrop-filter
   - no layout-affecting animation (left/top/width)
========================================================= */

const CSS = `
.hq,
.hq * {
  box-sizing: border-box;
}

.hq {
  --ink: #090c12;
  --surface: #121821;
  --surface-2: #182030;
  --line: rgba(255, 255, 255, 0.08);
  --text: #f3f1ea;
  --muted: #8b95a5;

  --saffron: #ffb43a;
  --teal: #34d3bd;
  --rose: #fb7d8f;
  --sky: #7aa8ff;

  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);

  /* Height of your fixed navbar. Change this to match it. */
  --hq-nav-h: 72px;

  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  color: var(--text);
  background: var(--ink);
  font-family: "DM Sans", Inter, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  -webkit-tap-highlight-color: transparent;
  -webkit-font-smoothing: antialiased;
}

.hq button {
  font: inherit;
  color: inherit;
}

.hq button:focus-visible {
  outline: 2px solid var(--saffron);
  outline-offset: 3px;
}

/* ---------- Background (static, cheap) ---------- */

.hq-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(
      620px circle at 0% 0%,
      rgba(255, 180, 58, 0.15),
      transparent 70%
    ),
    radial-gradient(
      680px circle at 100% 100%,
      rgba(52, 211, 189, 0.12),
      transparent 70%
    );
}

.hq-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.024) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.024) 1px, transparent 1px);
  background-size: 44px 44px;
  -webkit-mask-image: linear-gradient(to bottom, #000, transparent 85%);
  mask-image: linear-gradient(to bottom, #000, transparent 85%);
}

/* Cursor spotlight: moved with transform only (no repaint) */
.hq-spot {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 640px;
  height: 640px;
  margin: -320px 0 0 -320px;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgba(255, 180, 58, 0.1),
    transparent 62%
  );
  transform: translate3d(70vw, 26vh, 0);
  will-change: transform;
  transition: transform 0.35s ease-out;
}

/* ---------- Layout ---------- */

.hq-container {
  position: relative;
  z-index: 1;
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
}

.hq-hero {
  min-height: 100vh;
  min-height: 100svh;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  grid-template-areas:
    "copy hub"
    "actions hub";
  align-content: center;
  column-gap: 56px;
  row-gap: 36px;
  padding: calc(var(--hq-nav-h) + 24px) 0 72px;
}

.hq-copy {
  grid-area: copy;
  align-self: end;
  min-width: 0;
}

.hq-hub-wrap {
  grid-area: hub;
  align-self: center;
  justify-self: center;
  transition: transform 0.4s ease-out;
}

.hq-actions {
  grid-area: actions;
  align-self: start;
  min-width: 0;
}

/* One orchestrated entrance: copy, then hub, then cards */
.hq-reveal {
  animation: hq-rise 0.6s var(--ease) both;
  animation-delay: calc(var(--i, 0) * 90ms);
}

/* ---------- Copy ---------- */

.hq-date {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px 8px 12px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
}

.hq-date-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--teal);
  box-shadow: 0 0 0 4px rgba(52, 211, 189, 0.15);
}

.hq-title {
  margin: 24px 0 0;
  max-width: 12ch;
  font-family: "Bricolage Grotesque", "DM Sans", Inter, sans-serif;
  font-size: clamp(46px, 7.4vw, 92px);
  line-height: 0.95;
  letter-spacing: -0.045em;
  font-weight: 800;
  text-wrap: balance;
  background: linear-gradient(180deg, #fffaf0 0%, #ffe0a3 50%, #ffb43a 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hq-description {
  margin: 22px 0 0;
  max-width: 460px;
  color: var(--muted);
  font-size: 16px;
  line-height: 1.7;
}

/* ---------- Hub ---------- */

.hq-hub {
  --s: 460px;
  --r: calc(var(--s) * 0.46);

  position: relative;
  width: var(--s);
  height: var(--s);
  display: grid;
  place-items: center;
  animation: hq-pop 0.8s var(--ease) 0.15s both;
}

.hq-hub-glow {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 180, 58, 0.2),
    rgba(52, 211, 189, 0.06) 55%,
    transparent 72%
  );
}

.hq-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.07);
}

.hq-ring-outer {
  width: calc(var(--r) * 2);
  height: calc(var(--r) * 2);
  border: 1px dashed rgba(255, 255, 255, 0.14);
}

.hq-ring-mid {
  width: calc(var(--r) * 1.3);
  height: calc(var(--r) * 1.3);
}

.hq-core {
  position: relative;
  z-index: 2;
  width: calc(var(--s) * 0.21);
  height: calc(var(--s) * 0.21);
  min-width: 68px;
  min-height: 68px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: #1a1204;
  background: linear-gradient(145deg, #ffd27a, #ffab24);
  box-shadow:
    0 0 0 8px rgba(255, 180, 58, 0.1),
    0 20px 60px rgba(255, 180, 58, 0.35);
}

.hq-core::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid var(--saffron);
  opacity: 0;
  animation: hq-pulse 3.2s ease-out infinite;
}

.hq-orbit {
  position: absolute;
  inset: 0;
  will-change: transform;
  animation: hq-spin 60s linear infinite;
}

.hq-sat {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  transform: rotate(var(--a)) translateY(calc(var(--r) * -1));
}

.hq-sat-counter {
  position: absolute;
  will-change: transform;
  animation: hq-spin-back 60s linear infinite;
}

.hq-chip {
  --c: var(--saffron);

  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 7px 14px 7px 7px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #121821;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  transform: translate(-50%, -50%) rotate(calc(var(--a) * -1));
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.hq-chip-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--c);
  background: color-mix(in srgb, var(--c) 16%, transparent);
}

/* Data flowing along spokes (transform only) */

.hq-spoke {
  position: absolute;
  top: 50%;
  left: 50%;
  width: var(--r);
  height: 1px;
  transform-origin: 0 50%;
  transform: rotate(calc(var(--a) - 90deg));
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in srgb, var(--c) 45%, transparent)
  );
}

.hq-packet {
  position: absolute;
  top: -2px;
  left: 0;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--c);
  box-shadow: 0 0 10px var(--c);
  opacity: 0;
  will-change: transform, opacity;
  animation: hq-flow 3.4s ease-in-out infinite;
  animation-delay: var(--d, 0s);
}

.hq-star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  animation: hq-twinkle 4.5s ease-in-out infinite;
}

/* ---------- Actions ---------- */

.hq-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  max-width: 560px;
}

.hq-card {
  --accent: var(--saffron);

  position: relative;
  isolation: isolate;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  min-height: 76px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: var(--surface);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s var(--ease),
    border-color 0.2s ease,
    background-color 0.2s ease;
  animation: hq-rise 0.6s var(--ease) both;
  animation-delay: calc(var(--i, 0) * 90ms + 200ms);
}

/* accent glow: fades in on hover (opacity only) */
.hq-card::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
  background: radial-gradient(
    320px circle at 100% 0%,
    color-mix(in srgb, var(--accent) 22%, transparent),
    transparent 70%
  );
}

.hq-card:active {
  transform: scale(0.98);
  transition-duration: 0.08s;
}

@media (hover: hover) {
  .hq-card:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    background-color: var(--surface-2);
  }

  .hq-card:hover::before {
    opacity: 1;
  }

  .hq-card:hover .hq-chevron {
    transform: translateX(3px);
    color: var(--accent);
  }
}

.hq-card-stock {
  --accent: var(--teal);
}

.hq-card-overdue {
  --accent: var(--rose);
}

.hq-icon {
  flex: 0 0 auto;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 14%, transparent);
}

.hq-card-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hq-card-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.hq-card-sub {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.4;
}

.hq-chevron {
  flex: 0 0 auto;
  color: var(--muted);
  transition: transform 0.2s var(--ease), color 0.2s ease;
}

/* Primary: the one loud element */

.hq-card-primary {
  grid-column: 1 / -1;
  min-height: 104px;
  padding: 20px;
  border-color: transparent;
  background: linear-gradient(135deg, #ffc450, #ffab24);
  color: #1a1204;
  box-shadow: 0 18px 44px rgba(255, 180, 58, 0.24);
}

.hq-card-primary::before {
  background: radial-gradient(
    320px circle at 100% 0%,
    rgba(255, 255, 255, 0.35),
    transparent 70%
  );
}

.hq-card-primary::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 26%;
  pointer-events: none;
  background: linear-gradient(
    100deg,
    transparent,
    rgba(255, 255, 255, 0.5),
    transparent
  );
  transform: translateX(-160%) skewX(-20deg);
  will-change: transform;
  animation: hq-shine 5.5s ease-in-out 1.8s infinite;
}

.hq-card-primary .hq-icon {
  width: 56px;
  height: 56px;
  color: #1a1204;
  background: rgba(26, 18, 4, 0.12);
}

.hq-card-primary .hq-card-title {
  font-size: 20px;
  font-weight: 800;
}

.hq-card-primary .hq-card-sub {
  color: rgba(26, 18, 4, 0.72);
  font-size: 14px;
}

.hq-card-primary .hq-chevron {
  color: #1a1204;
}

@media (hover: hover) {
  .hq-card-primary:hover {
    background: linear-gradient(135deg, #ffcf6b, #ffb43a);
    border-color: transparent;
  }

  .hq-card-primary:hover .hq-chevron {
    color: #1a1204;
  }
}

.hq-card-small {
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}

.hq-card-small .hq-chevron {
  position: absolute;
  top: 16px;
  right: 14px;
}

/* ---------- Keyframes (transform / opacity only) ---------- */

@keyframes hq-rise {
  from { opacity: 0; transform: translate3d(0, 14px, 0); }
  to   { opacity: 1; transform: translate3d(0, 0, 0); }
}

@keyframes hq-pop {
  from { opacity: 0; transform: scale(0.9); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes hq-spin {
  to { transform: rotate(360deg); }
}

@keyframes hq-spin-back {
  to { transform: rotate(-360deg); }
}

@keyframes hq-pulse {
  0%   { transform: scale(1);   opacity: 0.55; }
  100% { transform: scale(2.1); opacity: 0; }
}

@keyframes hq-flow {
  0%   { transform: translateX(calc(var(--r) * 0.14)); opacity: 0; }
  15%  { opacity: 1; }
  85%  { opacity: 1; }
  100% { transform: translateX(calc(var(--r) * 0.95)); opacity: 0; }
}

@keyframes hq-twinkle {
  0%, 100% { opacity: 0; }
  50%      { opacity: 0.8; }
}

@keyframes hq-shine {
  0%, 55% { transform: translateX(-160%) skewX(-20deg); }
  100%    { transform: translateX(650%) skewX(-20deg); }
}

/* ---------- Tablet ---------- */

@media (max-width: 960px) {
  .hq-hero {
    grid-template-columns: 1fr;
    grid-template-areas:
      "copy"
      "hub"
      "actions";
    row-gap: 28px;
    min-height: auto;
    padding: calc(var(--hq-nav-h) + 24px) 0 56px;
  }

  .hq-copy,
  .hq-actions {
    align-self: auto;
  }

  .hq-hub {
    --s: min(400px, calc(100vw - 48px));
  }

  .hq-actions-grid {
    max-width: none;
  }
}

/* ---------- Phone ---------- */

@media (max-width: 600px) {
  .hq {
    --hq-nav-h: 64px;
  }

  .hq-container {
    width: calc(100% - 32px);
  }

  .hq-hero {
    row-gap: 20px;
    padding: calc(var(--hq-nav-h) + 20px) 0
      calc(40px + env(safe-area-inset-bottom));
  }

  .hq-title {
    margin-top: 20px;
    font-size: clamp(42px, 13.5vw, 60px);
  }

  .hq-description {
    margin-top: 16px;
    font-size: 15px;
    line-height: 1.65;
  }

  .hq-hub {
    --s: min(310px, calc(100vw - 48px));
  }

  .hq-chip {
    gap: 7px;
    padding: 5px 11px 5px 5px;
    font-size: 11.5px;
  }

  .hq-chip-icon {
    width: 24px;
    height: 24px;
  }

  /* fewer moving parts on phones */
  .hq-star {
    display: none;
  }

  .hq-actions-grid {
    grid-template-columns: 1fr;
  }

  .hq-card-small {
    flex-direction: row;
    align-items: center;
    gap: 16px;
    min-height: 72px;
  }

  .hq-card-small .hq-chevron {
    position: static;
  }

  .hq-card-primary {
    min-height: 96px;
    padding: 18px;
  }
}

@media (max-width: 360px) {
  .hq-container {
    width: calc(100% - 24px);
  }

  .hq-icon {
    width: 42px;
    height: 42px;
  }

  .hq-card-sub {
    font-size: 12px;
  }
}

/* ---------- Reduced motion ---------- */

@media (prefers-reduced-motion: reduce) {
  .hq-orbit,
  .hq-sat-counter,
  .hq-core::before,
  .hq-hub,
  .hq-card,
  .hq-card-primary::after,
  .hq-reveal,
  .hq-packet,
  .hq-star {
    animation: none !important;
  }

  .hq-packet {
    opacity: 0.8;
    transform: translateX(calc(var(--r) * 0.6));
  }

  .hq-spot,
  .hq-hub-wrap {
    transition: none;
  }

  .hq * {
    transition: none !important;
  }
}
`;

/* =========================================================
   DATA / HELPERS
========================================================= */

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap";

const MODULES = [
  { label: "Billing", icon: Receipt, color: "var(--saffron)", angle: 315 },
  { label: "Sales", icon: TrendingUp, color: "var(--teal)", angle: 45 },
  { label: "CRM", icon: Users, color: "var(--sky)", angle: 225 },
  { label: "Inventory", icon: Boxes, color: "var(--rose)", angle: 135 },
];

const STARS = [
  { x: 12, y: 18, s: 3, d: 0 },
  { x: 88, y: 14, s: 2, d: 1.2 },
  { x: 93, y: 56, s: 3, d: 2.4 },
  { x: 6, y: 62, s: 2, d: 0.6 },
  { x: 26, y: 90, s: 3, d: 3.1 },
  { x: 72, y: 92, s: 2, d: 1.8 },
];

function getGreeting(date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* =========================================================
   MAIN
========================================================= */

export default function HeroSection() {
  const navigate = useNavigate();

  const rootRef = useRef(null);
  const spotRef = useRef(null);
  const hubRef = useRef(null);
  const frame = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });

  const dateLabel = useMemo(() => {
    const now = new Date();
    const day = now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return `${getGreeting(now)}, ${day}`;
  }, []);

  /* Load fonts without blocking first paint (display=swap) */
  useEffect(() => {
    if (document.getElementById("hq-fonts")) return;

    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";

    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";

    const css = document.createElement("link");
    css.id = "hq-fonts";
    css.rel = "stylesheet";
    css.href = FONT_URL;

    document.head.append(pre1, pre2, css);
  }, []);

  /* Mouse spotlight + hub parallax: one rAF per frame, transform only */
  useEffect(() => {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!canHover.matches || reduce.matches) return undefined;

    const root = rootRef.current;
    if (!root) return undefined;

    const paint = () => {
      frame.current = 0;
      const { x, y } = pointer.current;
      const rect = root.getBoundingClientRect();

      if (spotRef.current) {
        spotRef.current.style.transform = `translate3d(${x - rect.left}px, ${
          y - rect.top
        }px, 0)`;
      }
      if (hubRef.current) {
        const dx = ((x - rect.left) / rect.width - 0.5) * -18;
        const dy = ((y - rect.top) / rect.height - 0.5) * -18;
        hubRef.current.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      }
    };

    const onMove = (e) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      if (!frame.current) frame.current = requestAnimationFrame(paint);
    };

    root.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      root.removeEventListener("pointermove", onMove);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>

      <main className="hq" ref={rootRef}>
        <div className="hq-bg" aria-hidden="true" />
        <div className="hq-grid" aria-hidden="true" />
        <div className="hq-spot" ref={spotRef} aria-hidden="true" />

        <div className="hq-container">
          <section className="hq-hero">
            {/* COPY */}
            <div className="hq-copy">
              <span className="hq-date hq-reveal" style={{ "--i": 0 }}>
                <span className="hq-date-dot" aria-hidden="true" />
                {dateLabel}
              </span>

              <h1 className="hq-title hq-reveal" style={{ "--i": 1 }}>
                Your office, one command center.
              </h1>

              <p className="hq-description hq-reveal" style={{ "--i": 2 }}>
                Billing, sales, CRM and inventory in one focused workspace. See
                what needs attention and act faster.
              </p>
            </div>

            {/* CONNECTED MODULES VISUAL */}
            <div className="hq-hub-wrap" ref={hubRef} aria-hidden="true">
              <div className="hq-hub">
                <div className="hq-hub-glow" />

                {STARS.map((st, i) => (
                  <span
                    key={i}
                    className="hq-star"
                    style={{
                      left: `${st.x}%`,
                      top: `${st.y}%`,
                      width: st.s,
                      height: st.s,
                      animationDelay: `${st.d}s`,
                    }}
                  />
                ))}

                <div className="hq-ring hq-ring-mid" />
                <div className="hq-ring hq-ring-outer" />

                <div className="hq-orbit">
                  {MODULES.map(({ label, color, angle }, i) => (
                    <div
                      key={`spoke-${label}`}
                      className="hq-spoke"
                      style={{ "--a": `${angle}deg`, "--c": color }}
                    >
                      <span
                        className="hq-packet"
                        style={{ "--d": `${i * 0.85}s` }}
                      />
                    </div>
                  ))}

                  {MODULES.map(({ label, icon: Icon, color, angle }) => (
                    <div
                      key={label}
                      className="hq-sat"
                      style={{ "--a": `${angle}deg` }}
                    >
                      <div className="hq-sat-counter">
                        <div
                          className="hq-chip"
                          style={{ "--c": color, "--a": `${angle}deg` }}
                        >
                          <span className="hq-chip-icon">
                            <Icon size={14} />
                          </span>
                          {label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hq-core">
                  <Command size={30} strokeWidth={2.2} />
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="hq-actions">
              <div className="hq-actions-grid">
                <button
                  type="button"
                  className="hq-card hq-card-primary"
                  style={{ "--i": 0 }}
                  onClick={() => navigate("/DailySalesReport")}
                >
                  <span className="hq-icon">
                    <Activity size={26} />
                  </span>
                  <span className="hq-card-text">
                    <span className="hq-card-title">Open sales report</span>
                    <span className="hq-card-sub">
                      Today&apos;s billing and sales at a glance
                    </span>
                  </span>
                  <ChevronRight className="hq-chevron" size={22} />
                </button>

                <button
                  type="button"
                  className="hq-card hq-card-small hq-card-stock"
                  style={{ "--i": 1 }}
                  onClick={() => navigate("/Stockmanager")}
                >
                  <span className="hq-icon">
                    <Package size={22} />
                  </span>
                  <span className="hq-card-text">
                    <span className="hq-card-title">View stock</span>
                    <span className="hq-card-sub">
                      Check what is running low
                    </span>
                  </span>
                  <ChevronRight className="hq-chevron" size={18} />
                </button>

                <button
                  type="button"
                  className="hq-card hq-card-small hq-card-overdue"
                  style={{ "--i": 2 }}
                  onClick={() => navigate("/OverduesDashboard")}
                >
                  <span className="hq-icon">
                    <IndianRupee size={22} />
                  </span>
                  <span className="hq-card-text">
                    <span className="hq-card-title">Overdue payments</span>
                    <span className="hq-card-sub">
                      See who owes you and follow up
                    </span>
                  </span>
                  <ChevronRight className="hq-chevron" size={18} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
