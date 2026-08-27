import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  BarChart2,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  CreditCard,
  Layers3,
  Package,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   DATA
========================================================= */

const MODULES = [
  {
    id: "finance",
    label: "Finance",
    shortLabel: "Finance",
    tagline: "Billing & receivables",
    accent: "#F59E0B",
    accent2: "#F97316",
    soft: "245,158,11",
    shortcut: "⌥1",
    icon: Wallet,
    spark: [4, 7, 3, 9, 5, 8, 3],
    sparkLabel: "Overdue trend",
    progress: 34,
    status: "3 overdue",
    statusType: "warning",
    path: "/OverduesDashboard",
    item: "Overdues",
    badge: "3 alerts",
  },
  {
    id: "sales",
    label: "Sales & CRM",
    shortLabel: "Sales",
    tagline: "Pipeline & performance",
    accent: "#6366F1",
    accent2: "#22D3EE",
    soft: "99,102,241",
    shortcut: "⌥2",
    icon: TrendingUp,
    spark: [62, 71, 58, 84, 77, 93, 110],
    sparkLabel: "Revenue · 7 days",
    progress: 87,
    status: "₹2.4L today",
    statusType: "success",
    path: "/DailySalesReport",
    item: "Sales Report",
    badge: "Live",
  },
  {
    id: "management",
    label: "Management",
    shortLabel: "Stock",
    tagline: "Inventory & operations",
    accent: "#A78BFA",
    accent2: "#EC4899",
    soft: "167,139,250",
    shortcut: "⌥3",
    icon: Boxes,
    spark: [22, 18, 21, 17, 15, 13, 12],
    sparkLabel: "Low-stock items",
    progress: 25,
    status: "12 low stock",
    statusType: "danger",
    path: "/Stockmanager",
    item: "Chemicals Stock",
    badge: "12 low",
  },
];

const METRICS = [
  {
    label: "Revenue",
    raw: 240000,
    color: "#34D399",
    ring: 78,
    prefix: "₹",
  },
  {
    label: "Overdue",
    raw: 3,
    color: "#FBBF24",
    ring: 30,
  },
  {
    label: "Low Stock",
    raw: 12,
    color: "#FB7185",
    ring: 20,
  },
];

const PULSE = [
  {
    dot: "#34D399",
    title: "Sales Report",
    text: "refreshed 6 min ago",
  },
  {
    dot: "#FBBF24",
    title: "Finance",
    text: "3 invoices marked overdue today",
  },
  {
    dot: "#22D3EE",
    title: "Inventory",
    text: "12 stock items below threshold",
  },
  {
    dot: "#A78BFA",
    title: "CRM",
    text: "2 new activities logged",
  },
];

const ACTIVITY = [
  { Icon: Activity, text: "Sales report updated", time: "6 min ago" },
  { Icon: Wallet, text: "Invoice #1042 marked overdue", time: "18 min ago" },
  {
    Icon: Boxes,
    text: "Reorder triggered for 4 chemicals",
    time: "32 min ago",
  },
  { Icon: BarChart2, text: "Monthly target reached 87%", time: "1 hr ago" },
  { Icon: Zap, text: "₹85,000 collected today", time: "2 hr ago" },
  { Icon: Clock3, text: "Stock audit scheduled", time: "3 pm" },
];

/* =========================================================
   GLOBAL CSS
========================================================= */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

.hq *,
.hq *::before,
.hq *::after {
  box-sizing: border-box;
}

.hq {
  --bg: #05070d;
  --panel: rgba(15, 18, 29, .72);
  --panel-strong: rgba(17, 21, 34, .9);
  --border: rgba(255,255,255,.075);
  --border-hover: rgba(255,255,255,.15);
  --text: #f8fafc;
  --muted: #94a3b8;
  --dim: #475569;

  position: relative;
  min-height: 100vh;
  overflow: hidden;
  color: var(--text);
  background:
    radial-gradient(
      circle at 50% -20%,
      rgba(99,102,241,.16),
      transparent 38%
    ),
    #05070d;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  isolation: isolate;
}

.hq button {
  font: inherit;
}

.hq button:focus-visible {
  outline: 2px solid #818cf8;
  outline-offset: 3px;
}

.hq-container {
  position: relative;
  z-index: 2;
  width: min(1240px, calc(100% - 48px));
  margin: 0 auto;
}

/* =========================================================
   BACKGROUND
========================================================= */

.hq-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(
    to bottom,
    black 0%,
    rgba(0,0,0,.55) 65%,
    transparent 100%
  );
}

.hq-noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: .035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.65'/%3E%3C/svg%3E");
}

.hq-orb {
  position: absolute;
  border-radius: 999px;
  pointer-events: none;
  filter: blur(90px);
}

.hq-orb-a {
  width: 620px;
  height: 620px;
  top: -320px;
  left: -180px;
  background: rgba(99,102,241,.12);
}

.hq-orb-b {
  width: 520px;
  height: 520px;
  right: -220px;
  top: 360px;
  background: rgba(34,211,238,.065);
}

.hq-orb-c {
  width: 480px;
  height: 480px;
  bottom: -280px;
  left: 35%;
  background: rgba(167,139,250,.065);
}

/* =========================================================
   TOP BAR
========================================================= */

.hq-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  border-bottom: 1px solid rgba(255,255,255,.06);
}

.hq-brand {
  display: flex;
  align-items: center;
  gap: 11px;
}

.hq-logo {
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: white;
  background:
    linear-gradient(135deg,#6366f1,#8b5cf6 48%,#22d3ee);
  box-shadow:
    0 0 0 1px rgba(255,255,255,.14) inset,
    0 8px 28px rgba(99,102,241,.32);
}

.hq-logo::after {
  content: "";
  position: absolute;
  inset: -5px;
  border-radius: inherit;
  background: rgba(99,102,241,.12);
  filter: blur(8px);
  z-index: -1;
}

.hq-brand-name {
  font-family: "Plus Jakarta Sans", sans-serif;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: -.025em;
}

.hq-version {
  padding: 4px 8px;
  border: 1px solid rgba(129,140,248,.2);
  border-radius: 7px;
  color: #818cf8;
  background: rgba(99,102,241,.07);
  font-size: 10px;
  font-weight: 700;
}

/* =========================================================
   KPI STRIP
========================================================= */

.hq-kpis {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hq-kpi {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 5px 11px 5px 7px;
  border: 1px solid rgba(255,255,255,.065);
  border-radius: 11px;
  background: rgba(255,255,255,.025);
  transition: .2s ease;
}

.hq-kpi:hover {
  border-color: rgba(255,255,255,.13);
  background: rgba(255,255,255,.045);
  transform: translateY(-1px);
}

.hq-kpi-label {
  color: #64748b;
  font-size: 10px;
  font-weight: 600;
}

.hq-kpi-value {
  font-size: 12px;
  font-weight: 800;
}

/* =========================================================
   HERO
========================================================= */

.hq-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, .7fr);
  gap: 80px;
  align-items: center;
  padding: 82px 0 72px;
}

.hq-eyebrow {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px 7px 8px;
  border: 1px solid rgba(129,140,248,.22);
  border-radius: 999px;
  background: rgba(99,102,241,.065);
  color: #a5b4fc;
  font-size: 11px;
  font-weight: 700;
}

.hq-eyebrow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 12px rgba(52,211,153,.8);
}

.hq-title {
  margin: 22px 0 0;
  max-width: 720px;
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: clamp(46px, 6vw, 76px);
  line-height: .98;
  letter-spacing: -.065em;
  font-weight: 800;
}

.hq-gradient-text {
  background:
    linear-gradient(
      105deg,
      #818cf8 0%,
      #22d3ee 35%,
      #c084fc 65%,
      #818cf8 100%
    );
  background-size: 240% auto;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: hq-gradient 7s ease infinite;
}

@keyframes hq-gradient {
  0%,100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}

.hq-outline {
  color: transparent;
  -webkit-text-stroke: 1px rgba(148,163,184,.26);
}

.hq-description {
  max-width: 570px;
  margin: 24px 0 0;
  color: #718096;
  font-size: 15px;
  line-height: 1.8;
}

.hq-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 11px;
  margin-top: 32px;
}

.hq-primary,
.hq-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-height: 48px;
  padding: 0 19px;
  border-radius: 13px;
  cursor: pointer;
  transition:
    transform .2s ease,
    box-shadow .2s ease,
    border-color .2s ease,
    background .2s ease;
}

.hq-primary {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(129,140,248,.35);
  color: white;
  background:
    linear-gradient(135deg,#4f46e5,#6366f1 55%,#4f46e5);
  box-shadow:
    0 10px 32px rgba(79,70,229,.27),
    0 0 45px rgba(99,102,241,.13);
  font-size: 13px;
  font-weight: 750;
}

.hq-primary::before {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-110%);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,.18),
    transparent
  );
  transition: transform .65s ease;
}

.hq-primary:hover::before {
  transform: translateX(110%);
}

.hq-primary:hover {
  transform: translateY(-2px);
  box-shadow:
    0 15px 40px rgba(79,70,229,.35),
    0 0 55px rgba(99,102,241,.18);
}

.hq-secondary {
  border: 1px solid rgba(255,255,255,.085);
  color: #cbd5e1;
  background: rgba(255,255,255,.035);
  font-size: 13px;
  font-weight: 650;
}

.hq-secondary:hover {
  transform: translateY(-2px);
  border-color: rgba(255,255,255,.17);
  background: rgba(255,255,255,.065);
}

.hq-arrow {
  transition: transform .2s ease;
}

.hq-primary:hover .hq-arrow {
  transform: translateX(3px);
}

/* =========================================================
   QUICK NAV
========================================================= */

.hq-quick {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 18px;
}

.hq-quick-label {
  margin-right: 4px;
  color: #334155;
  font-size: 10px;
  font-weight: 600;
}

.hq-quick-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 9px;
  border: 1px solid rgba(255,255,255,.055);
  border-radius: 8px;
  color: #64748b;
  background: rgba(255,255,255,.02);
  cursor: pointer;
  transition: .18s ease;
}

.hq-quick-btn:hover {
  color: #cbd5e1;
  border-color: rgba(129,140,248,.2);
  background: rgba(99,102,241,.06);
}

.hq-key {
  padding: 2px 5px;
  border: 1px solid rgba(255,255,255,.09);
  border-radius: 5px;
  color: #64748b;
  background: rgba(255,255,255,.04);
  font-family: monospace;
  font-size: 9px;
}

/* =========================================================
   LIVE PANEL
========================================================= */

.hq-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hq-glass {
  border: 1px solid var(--border);
  border-radius: 18px;
  background:
    linear-gradient(
      145deg,
      rgba(255,255,255,.045),
      rgba(255,255,255,.018)
    );
  box-shadow:
    0 20px 70px rgba(0,0,0,.22),
    inset 0 1px 0 rgba(255,255,255,.045);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}

.hq-live {
  padding: 18px;
}

.hq-live-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.hq-live-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.hq-live-status {
  color: #34d399;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.hq-live-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 0 0 rgba(52,211,153,.6);
  animation: hq-pulse 2s infinite;
}

@keyframes hq-pulse {
  0%,100% {
    box-shadow: 0 0 0 0 rgba(52,211,153,.5);
  }
  50% {
    box-shadow: 0 0 0 7px rgba(52,211,153,0);
  }
}

.hq-pulse {
  min-height: 54px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 12px;
  background: rgba(0,0,0,.16);
}

.hq-pulse-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: 0 0 auto;
  border-radius: 9px;
  background: rgba(255,255,255,.045);
}

.hq-pulse-title {
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 700;
}

.hq-pulse-text {
  margin-top: 2px;
  color: #64748b;
  font-size: 10px;
}

.hq-health {
  padding: 18px;
}

.hq-panel-title {
  margin: 0 0 13px;
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .11em;
  text-transform: uppercase;
}

.hq-health-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255,255,255,.045);
}

.hq-health-row:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.hq-health-name {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
}

.hq-health-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* =========================================================
   MODULE SECTION
========================================================= */

.hq-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.hq-section-title {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.hq-section-title::before {
  content: "";
  width: 3px;
  height: 15px;
  border-radius: 4px;
  background: linear-gradient(#818cf8,#22d3ee);
  box-shadow: 0 0 12px rgba(99,102,241,.4);
}

.hq-section-count {
  color: #334155;
  font-size: 10px;
}

/* =========================================================
   MODULE CARDS
========================================================= */

.hq-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0,1fr));
  gap: 14px;
}

.hq-card {
  --accent: 99,102,241;

  position: relative;
  min-width: 0;
  padding: 19px;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,.075);
  border-radius: 18px;
  background:
    linear-gradient(
      145deg,
      rgba(var(--accent),.065),
      rgba(255,255,255,.022) 48%,
      rgba(255,255,255,.012)
    );
  box-shadow:
    0 15px 45px rgba(0,0,0,.18),
    inset 0 1px 0 rgba(255,255,255,.04);
  transition:
    transform .25s ease,
    border-color .25s ease,
    box-shadow .25s ease;
}

.hq-card::before {
  content: "";
  position: absolute;
  width: 160px;
  height: 160px;
  top: -100px;
  right: -70px;
  border-radius: 50%;
  background: rgba(var(--accent),.11);
  filter: blur(35px);
  pointer-events: none;
}

.hq-card:hover {
  transform: translateY(-5px);
  border-color: rgba(var(--accent),.3);
  box-shadow:
    0 25px 65px rgba(0,0,0,.3),
    0 0 45px rgba(var(--accent),.08),
    inset 0 1px 0 rgba(255,255,255,.07);
}

.hq-card-top {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hq-card-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hq-card-icon {
  display: grid;
  place-items: center;
  width: 35px;
  height: 35px;
  border: 1px solid rgba(var(--accent),.2);
  border-radius: 10px;
  color: rgb(var(--accent));
  background: rgba(var(--accent),.1);
}

.hq-card-title {
  margin: 0;
  color: #e2e8f0;
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: -.01em;
}

.hq-card-tagline {
  margin: 3px 0 0;
  color: #475569;
  font-size: 10px;
}

.hq-card-shortcut {
  padding: 4px 7px;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 6px;
  color: #475569;
  background: rgba(255,255,255,.025);
  font-family: monospace;
  font-size: 9px;
}

/* =========================================================
   DATA STRIP
========================================================= */

.hq-data-strip {
  display: flex;
  align-items: center;
  gap: 13px;
  margin: 18px 0 13px;
  padding: 12px;
  border: 1px solid rgba(255,255,255,.05);
  border-radius: 12px;
  background: rgba(0,0,0,.14);
}

.hq-data-main {
  flex: 1;
  min-width: 0;
}

.hq-data-label {
  margin: 0 0 8px;
  color: #475569;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.hq-progress {
  height: 4px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(255,255,255,.055);
}

.hq-progress-fill {
  height: 100%;
  border-radius: inherit;
  transition: width 1s cubic-bezier(.2,.8,.2,1);
  box-shadow: 0 0 12px rgba(var(--accent),.5);
}

.hq-spark {
  flex: 0 0 auto;
}

/* =========================================================
   CARD ACTION
========================================================= */

.hq-card-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  padding: 7px 8px;
  border: 1px solid rgba(255,255,255,.045);
  border-radius: 12px;
  color: #94a3b8;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: .18s ease;
}

.hq-card-action:hover {
  border-color: rgba(var(--accent),.23);
  color: #f1f5f9;
  background: rgba(var(--accent),.07);
}

.hq-action-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hq-action-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(255,255,255,.045);
  transition: .18s ease;
}

.hq-card-action:hover .hq-action-icon {
  color: rgb(var(--accent));
  background: rgba(var(--accent),.13);
}

.hq-action-name {
  font-size: 12px;
  font-weight: 650;
}

.hq-action-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hq-badge {
  padding: 4px 7px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .04em;
  text-transform: uppercase;
}

.hq-badge-warning {
  border: 1px solid rgba(251,191,36,.2);
  color: #fbbf24;
  background: rgba(251,191,36,.08);
}

.hq-badge-success {
  border: 1px solid rgba(52,211,153,.2);
  color: #34d399;
  background: rgba(52,211,153,.08);
}

.hq-badge-danger {
  border: 1px solid rgba(251,113,133,.2);
  color: #fb7185;
  background: rgba(251,113,133,.08);
}

/* =========================================================
   ACTIVITY
========================================================= */

.hq-activity {
  margin-top: 46px;
  padding: 16px 0 25px;
  border-top: 1px solid rgba(255,255,255,.055);
}

.hq-activity-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 13px;
}

.hq-activity-title {
  color: #475569;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.hq-activity-window {
  overflow: hidden;
  mask-image: linear-gradient(
    to right,
    transparent,
    black 7%,
    black 93%,
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 7%,
    black 93%,
    transparent
  );
}

.hq-activity-track {
  display: flex;
  width: max-content;
  animation: hq-marquee 32s linear infinite;
}

.hq-activity-window:hover .hq-activity-track {
  animation-play-state: paused;
}

.hq-activity-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 28px;
  border-right: 1px solid rgba(255,255,255,.04);
  white-space: nowrap;
}

.hq-activity-item svg {
  color: #334155;
}

.hq-activity-text {
  color: #475569;
  font-size: 10px;
}

.hq-activity-time {
  color: #293548;
  font-size: 9px;
}

@keyframes hq-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* =========================================================
   ENTRANCE
========================================================= */

.hq-enter {
  opacity: 0;
  transform: translateY(14px);
  transition:
    opacity .65s ease,
    transform .65s cubic-bezier(.2,.8,.2,1);
}

.hq-enter.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1050px) {
  .hq-hero {
    grid-template-columns: 1fr;
    gap: 35px;
    padding-top: 62px;
  }

  .hq-side {
    max-width: 700px;
  }

  .hq-cards {
    grid-template-columns: repeat(2, minmax(0,1fr));
  }
}

@media (max-width: 760px) {
  .hq-container {
    width: min(100% - 30px, 680px);
  }

  .hq-topbar {
    min-height: auto;
    padding: 16px 0;
    align-items: flex-start;
    gap: 15px;
  }

  .hq-kpis {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 3px;
    scrollbar-width: none;
  }

  .hq-kpis::-webkit-scrollbar {
    display: none;
  }

  .hq-kpi {
    flex: 0 0 auto;
  }

  .hq-hero {
    padding: 52px 0 55px;
  }

  .hq-title {
    font-size: clamp(42px, 12vw, 62px);
  }

  .hq-description {
    font-size: 14px;
  }

  .hq-cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .hq-container {
    width: min(100% - 22px, 680px);
  }

  .hq-actions {
    flex-direction: column;
  }

  .hq-primary,
  .hq-secondary {
    width: 100%;
  }

  .hq-quick {
    align-items: flex-start;
  }

  .hq-side {
    gap: 10px;
  }
}

/* =========================================================
   REDUCED MOTION
========================================================= */

@media (prefers-reduced-motion: reduce) {
  .hq *,
  .hq *::before,
  .hq *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .001ms !important;
  }
}
`;

/* =========================================================
   HELPERS
========================================================= */

function useCountUp(target, duration = 1300, delay = 0) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf;
    let start = null;

    const frame = (timestamp) => {
      if (!start) start = timestamp + delay;

      const progress = Math.min(Math.max(0, timestamp - start) / duration, 1);

      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.round(eased * target));

      if (progress < 1) {
        raf = requestAnimationFrame(frame);
      }
    };

    raf = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);

  return value;
}

function formatMetric(metric, value) {
  if (metric.prefix === "₹") {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }

    return `₹${value.toLocaleString("en-IN")}`;
  }

  return value.toLocaleString("en-IN");
}

/* =========================================================
   BACKGROUND PARTICLES
========================================================= */

function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) return;

    const ctx = canvas.getContext("2d");

    let width = 0;
    let height = 0;
    let raf;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = canvas.offsetWidth;
      height = canvas.offsetHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.18;
        this.vy = (Math.random() - 0.5) * 0.18;
        this.radius = Math.random() * 1.1 + 0.3;
        this.alpha = Math.random() * 0.22 + 0.04;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < -10 || this.x > width + 10) this.vx *= -1;
        if (this.y < -10 || this.y > height + 10) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(129,140,248,${this.alpha})`;
        ctx.fill();
      }
    }

    const count = Math.min(
      34,
      Math.max(14, Math.floor(window.innerWidth / 42)),
    );

    const particles = Array.from({ length: count }, () => new Particle());

    resize();

    window.addEventListener("resize", resize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      const maxDistance = 125;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];

          const distance = Math.hypot(a.x - b.x, a.y - b.y);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            ctx.strokeStyle = `rgba(
              99,
              102,
              241,
              ${(1 - distance / maxDistance) * 0.055}
            )`;

            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
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

/* =========================================================
   SPARKLINE
========================================================= */

function Sparkline({ data, color }) {
  const width = 94;
  const height = 30;

  const min = Math.min(...data);
  const max = Math.max(...data);

  const x = (index) => (index / (data.length - 1)) * width;

  const y = (value) =>
    height - ((value - min) / (max - min || 1)) * (height - 7) - 3;

  const points = data
    .map((value, index) => `${x(index)},${y(value)}`)
    .join(" ");

  const area = `
    M ${data.map((value, index) => `${x(index)},${y(value)}`).join(" L ")}
    L ${width},${height}
    L 0,${height}
    Z
  `;

  const gradientId = `spark-${color.replace("#", "")}`;

  return (
    <svg
      className="hq-spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".24" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${gradientId})`} />

      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity=".9"
      />

      <circle
        cx={x(data.length - 1)}
        cy={y(data[data.length - 1])}
        r="2.5"
        fill={color}
        style={{
          filter: `drop-shadow(0 0 4px ${color})`,
        }}
      />
    </svg>
  );
}

/* =========================================================
   KPI
========================================================= */

function Metric({ metric, index }) {
  const value = useCountUp(metric.raw, 1250, index * 160);

  const radius = 9.5;
  const circumference = 2 * Math.PI * radius;
  const dash = (metric.ring / 100) * circumference;

  return (
    <div className="hq-kpi">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <circle
          cx="13"
          cy="13"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,.07)"
          strokeWidth="2"
        />

        <circle
          cx="13"
          cy="13"
          r={radius}
          fill="none"
          stroke={metric.color}
          strokeWidth="2"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 13 13)"
        />
      </svg>

      <span className="hq-kpi-label">{metric.label}</span>

      <span className="hq-kpi-value" style={{ color: metric.color }}>
        {formatMetric(metric, value)}
      </span>
    </div>
  );
}

/* =========================================================
   LIVE PANEL
========================================================= */

function LivePanel({ pulseIndex }) {
  const pulse = PULSE[pulseIndex];

  return (
    <div className="hq-side">
      <div className="hq-glass hq-live">
        <div className="hq-live-head">
          <div className="hq-live-label">
            <span className="hq-live-dot" />
            Live updates
          </div>

          <span className="hq-live-status">● System online</span>
        </div>

        <div className="hq-pulse">
          <div className="hq-pulse-icon" style={{ color: pulse.dot }}>
            <Activity size={15} />
          </div>

          <div>
            <div className="hq-pulse-title">{pulse.title}</div>

            <div className="hq-pulse-text">{pulse.text}</div>
          </div>
        </div>
      </div>

      <div className="hq-glass hq-health">
        <p className="hq-panel-title">Module health</p>

        {MODULES.map((module) => (
          <div className="hq-health-row" key={module.id}>
            <div className="hq-health-name">
              <span
                className="hq-health-dot"
                style={{
                  background: module.accent,
                  boxShadow: `0 0 9px ${module.accent}`,
                }}
              />

              {module.label}
            </div>

            <span
              style={{
                color: module.accent,
                fontSize: 10,
                fontWeight: 750,
              }}
            >
              {module.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   MODULE CARD
========================================================= */

function ModuleCard({ module, navigate, index, visible }) {
  const Icon = module.icon;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;

    const timeout = setTimeout(
      () => {
        setProgress(module.progress);
      },
      220 + index * 100,
    );

    return () => clearTimeout(timeout);
  }, [visible, module.progress, index]);

  const badgeClass =
    module.statusType === "success"
      ? "hq-badge-success"
      : module.statusType === "danger"
        ? "hq-badge-danger"
        : "hq-badge-warning";

  return (
    <article
      className={`hq-card hq-enter ${visible ? "is-visible" : ""}`}
      style={{
        "--accent": module.soft,
        transitionDelay: `${index * 90}ms`,
      }}
    >
      <div className="hq-card-top">
        <div className="hq-card-title-wrap">
          <div className="hq-card-icon">
            <Icon size={16} />
          </div>

          <div>
            <h3 className="hq-card-title">{module.label}</h3>

            <p className="hq-card-tagline">{module.tagline}</p>
          </div>
        </div>

        <span className="hq-card-shortcut">{module.shortcut}</span>
      </div>

      <div className="hq-data-strip">
        <div className="hq-data-main">
          <p className="hq-data-label">{module.sparkLabel}</p>

          <div className="hq-progress">
            <div
              className="hq-progress-fill"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(
                  90deg,
                  ${module.accent},
                  ${module.accent2}
                )`,
              }}
            />
          </div>
        </div>

        <Sparkline data={module.spark} color={module.accent} />
      </div>

      <button
        type="button"
        className="hq-card-action"
        onClick={() => navigate(module.path)}
        aria-label={`Open ${module.item}`}
      >
        <span className="hq-action-left">
          <span className="hq-action-icon">
            <Icon size={14} />
          </span>

          <span className="hq-action-name">{module.item}</span>
        </span>

        <span className="hq-action-right">
          <span className={`hq-badge ${badgeClass}`}>{module.badge}</span>

          <ChevronRight size={14} />
        </span>
      </button>
    </article>
  );
}

/* =========================================================
   ACTIVITY MARQUEE
========================================================= */

function ActivityMarquee() {
  const items = [...ACTIVITY, ...ACTIVITY];

  return (
    <div className="hq-activity">
      <div className="hq-activity-head">
        <CircleDot size={10} color="#6366f1" />

        <span className="hq-activity-title">Recent activity</span>
      </div>

      <div className="hq-activity-window">
        <div className="hq-activity-track">
          {items.map(({ Icon, text, time }, index) => (
            <div className="hq-activity-item" key={`${text}-${index}`}>
              <Icon size={12} />

              <span className="hq-activity-text">{text}</span>

              <span className="hq-activity-time">· {time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function HeroSection() {
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === "undefined") return false;

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /* Entrance + pulse */
  useEffect(() => {
    const entrance = setTimeout(
      () => setVisible(true),
      prefersReducedMotion ? 0 : 80,
    );

    if (prefersReducedMotion) {
      return () => clearTimeout(entrance);
    }

    const pulse = setInterval(() => {
      setPulseIndex((current) => (current + 1) % PULSE.length);
    }, 3200);

    return () => {
      clearTimeout(entrance);
      clearInterval(pulse);
    };
  }, [prefersReducedMotion]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const handleKeyDown = (event) => {
      const modifier = event.altKey;

      if (!modifier) return;

      if (event.key === "1") {
        event.preventDefault();
        navigate("/OverduesDashboard");
      }

      if (event.key === "2") {
        event.preventDefault();
        navigate("/DailySalesReport");
      }

      if (event.key === "3") {
        event.preventDefault();
        navigate("/Stockmanager");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <>
      <style>{CSS}</style>

      <main className="hq">
        <ParticleBackground />

        <div className="hq-grid" />
        <div className="hq-noise" />

        <div className="hq-orb hq-orb-a" />
        <div className="hq-orb hq-orb-b" />
        <div className="hq-orb hq-orb-c" />

        <div className="hq-container">
          {/* =================================================
              TOP BAR
          ================================================= */}

          <header className="hq-topbar">
            <div className="hq-brand">
              <div className="hq-logo">
                <Sparkles size={16} />
              </div>

              <span className="hq-brand-name">Office Suite</span>

              <span className="hq-version">3 modules</span>
            </div>

            <div className="hq-kpis">
              {METRICS.map((metric, index) => (
                <Metric key={metric.label} metric={metric} index={index} />
              ))}

              <div
                className="hq-kpi"
                title="Keyboard shortcuts: Alt + 1 / 2 / 3"
              >
                <Command size={13} color="#475569" />

                <span className="hq-kpi-label">Alt</span>

                <span
                  style={{
                    color: "#64748b",
                    fontFamily: "monospace",
                    fontWeight: 800,
                    fontSize: 11,
                  }}
                >
                  1–3
                </span>
              </div>
            </div>
          </header>

          {/* =================================================
              HERO
          ================================================= */}

          <section className="hq-hero">
            <div>
              <div
                className={`hq-enter ${visible ? "is-visible" : ""}`}
                style={{ transitionDelay: "80ms" }}
              >
                <div className="hq-eyebrow">
                  <span className="hq-eyebrow-dot" />
                  <Sparkles size={12} />
                  One login · every tool · full visibility
                </div>
              </div>

              <div
                className={`hq-enter ${visible ? "is-visible" : ""}`}
                style={{ transitionDelay: "160ms" }}
              >
                <h1 className="hq-title">
                  Your office.
                  <br />
                  <span className="hq-gradient-text">One command</span>
                  <br />
                  center
                  <span className="hq-outline">.</span>
                </h1>

                <p className="hq-description">
                  Billing, sales, CRM and inventory — connected in one focused
                  workspace. See what needs attention, act faster, and keep your
                  entire operation moving.
                </p>
              </div>

              <div
                className={`hq-enter ${visible ? "is-visible" : ""}`}
                style={{ transitionDelay: "280ms" }}
              >
                <div className="hq-actions">
                  <button
                    type="button"
                    className="hq-primary"
                    onClick={() => navigate("/DailySalesReport")}
                  >
                    <Activity size={15} />
                    Open Sales Report
                    <ArrowRight className="hq-arrow" size={15} />
                  </button>

                  <button
                    type="button"
                    className="hq-secondary"
                    onClick={() => navigate("/Stockmanager")}
                  >
                    <Package size={15} />
                    View Stock
                  </button>
                </div>

                <div className="hq-quick">
                  <span className="hq-quick-label">Quick access</span>

                  {MODULES.map((module) => (
                    <button
                      key={module.id}
                      type="button"
                      className="hq-quick-btn"
                      onClick={() => navigate(module.path)}
                    >
                      <span className="hq-key">{module.shortcut}</span>

                      {module.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <div
              className={`hq-enter ${visible ? "is-visible" : ""}`}
              style={{ transitionDelay: "260ms" }}
            >
              <LivePanel pulseIndex={pulseIndex} />
            </div>
          </section>

          {/* =================================================
              MODULES
          ================================================= */}

          <section aria-labelledby="modules-heading">
            <div className="hq-section-head">
              <h2 id="modules-heading" className="hq-section-title">
                All modules
              </h2>

              <span className="hq-section-count">3 active · synced</span>
            </div>

            <div className="hq-cards">
              {MODULES.map((module, index) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  navigate={navigate}
                  index={index}
                  visible={visible}
                />
              ))}
            </div>
          </section>

          {/* =================================================
              ACTIVITY
          ================================================= */}

          <ActivityMarquee />
        </div>
      </main>
    </>
  );
}
