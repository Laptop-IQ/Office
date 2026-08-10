import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import * as XLSX from "xlsx-js-style";

const API = import.meta.env.VITE_API_BASE_URL;

const DS = {
  bg: "#06101E",
  sidebar: "#040C18",
  card: "#0B1A2E",
  surface: "#122035",
  border: "#1A3050",
  borderHi: "#254868",
  primary: "#00C8B4",
  primaryGlow: "rgba(0,200,180,0.20)",
  primaryDim: "rgba(0,200,180,0.08)",
  gold: "#F5A623",
  goldGlow: "rgba(245,166,35,0.20)",
  goldDim: "rgba(245,166,35,0.08)",
  text1: "#DAE8F8",
  text2: "#6A8BAE",
  text3: "#344D68",
  success: "#22C55E",
  danger: "#F43F5E",
  warning: "#F97316",
  amber: "#F59E0B",
  info: "#3B82F6",
  purple: "#A855F7",
};

const DISTRIBUTOR_OPTIONS = ["Supple", "Shree Jee Traders"];

const PROJECT_STAGE_OPTIONS = [
  "A. Promotion Complete",
  "B. Lab Trials Complete",
  "C. P R Enhanced",
  "D. Bulk Trials Complete",
  "E. Trial Report to Customer with Highlights in body of mail",
  "F. Commercials Conveyed to Technical DMU",
  "G. Proposal & Final Meet",
  "H. Products Regularized",
];

const STAGE_COLOR = {
  A: { bg: "#071830", text: "#60A5FA", border: "#3B82F6" },
  B: { bg: "#062218", text: "#34D399", border: "#10B981" },
  C: { bg: "#241800", text: "#FCD34D", border: "#F59E0B" },
  D: { bg: "#240E00", text: "#FB923C", border: "#F97316" },
  E: { bg: "#1A0830", text: "#C084FC", border: "#A855F7" },
  F: { bg: "#042018", text: "#2DD4BF", border: "#14B8A6" },
  G: { bg: "#240412", text: "#FB7185", border: "#F43F5E" },
  H: { bg: "#042A18", text: "#4ADE80", border: "#22C55E" },
};

const stageColor = (stage) => {
  if (!stage) return { bg: DS.surface, text: DS.text3, border: DS.border };
  const letter = stage.trim()[0]?.toUpperCase();
  return (
    STAGE_COLOR[letter] || { bg: DS.surface, text: DS.text3, border: DS.border }
  );
};

const STAGE_LETTERS = PROJECT_STAGE_OPTIONS.map((s) => s[0]);

// SIGNATURE: Stage Ladder with urgency glow on filled segments
const StageLadder = ({ stage, size = "md" }) => {
  const letter = stage ? stage.trim()[0]?.toUpperCase() : null;
  const idx = letter ? STAGE_LETTERS.indexOf(letter) : -1;
  const sc = stageColor(stage);
  const segW = size === "sm" ? 6 : 9;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        minWidth: 0,
      }}
      title={stage || "No stage set"}
    >
      <div
        style={{ display: "flex", gap: size === "sm" ? 2 : 3, flexShrink: 0 }}
      >
        {STAGE_LETTERS.map((l, i) => (
          <div
            key={l}
            className="dsr-ladder-seg"
            style={{
              width: segW,
              height: segW,
              borderRadius: 2,
              background: i <= idx ? sc.border : DS.border,
              boxShadow:
                i <= idx
                  ? `0 0 7px ${sc.border}BB, 0 0 2px ${sc.border}`
                  : "none",
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: size === "sm" ? 9 : 10,
          fontWeight: 800,
          color: sc.text,
          flexShrink: 0,
        }}
        className="dsr-mono"
      >
        {letter ? `${letter}/${STAGE_LETTERS.length}` : "—"}
      </span>
    </div>
  );
};

const Icon = ({ name, size = 16, strokeWidth = 1.8, style, className }) => {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { display: "block", flexShrink: 0, ...style },
    className,
  };
  switch (name) {
    case "records":
      return (
        <svg {...c}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <rect x="9" y="2.2" width="6" height="3.4" rx="1" />
          <line x1="8" y1="11.5" x2="16" y2="11.5" />
          <line x1="8" y1="15.5" x2="13.5" y2="15.5" />
        </svg>
      );
    case "addRecord":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case "store":
      return (
        <svg {...c}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M5.5 10.5v9h13v-9" />
          <path d="M9.5 19.5v-5.5h5v5.5" />
        </svg>
      );
    case "trending":
      return (
        <svg {...c}>
          <polyline points="4,16 9.5,10.5 13.5,14.5 20,8" />
          <polyline points="14.5,8 20,8 20,13.5" />
        </svg>
      );
    case "home":
      return (
        <svg {...c}>
          <path d="M4 11.5 12 4.5l8 7" />
          <path d="M6 10v9.5h12V10" />
        </svg>
      );
    case "search":
      return (
        <svg {...c}>
          <circle cx="11" cy="11" r="6.5" />
          <line x1="15.8" y1="15.8" x2="20.5" y2="20.5" />
        </svg>
      );
    case "trash":
      return (
        <svg {...c}>
          <line x1="5" y1="7" x2="19" y2="7" />
          <path d="M9.5 7V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
          <path d="M7.5 7l1 12.3a1 1 0 0 0 1 .9h5a1 1 0 0 0 1-.9L16.5 7" />
        </svg>
      );
    case "edit":
      return (
        <svg {...c}>
          <path d="M14 5.5 18.5 10 8 20.5 3.5 21.5 4.5 17Z" />
          <line x1="12.3" y1="7.2" x2="16.8" y2="11.7" />
        </svg>
      );
    case "check":
      return (
        <svg {...c}>
          <polyline points="4,12.5 9,17.5 20,6" />
        </svg>
      );
    case "close":
      return (
        <svg {...c}>
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...c}>
          <rect x="3" y="6.5" width="18" height="12.5" rx="2" />
          <path d="M3 10.5h18" />
          <circle
            cx="16.5"
            cy="14.5"
            r="1.1"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg {...c}>
          <rect x="4" y="5" width="16" height="15.5" rx="2" />
          <line x1="4" y1="9.5" x2="20" y2="9.5" />
          <line x1="8" y1="3" x2="8" y2="6.5" />
          <line x1="16" y1="3" x2="16" y2="6.5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="8.5" />
          <polyline points="12,7.5 12,12.3 15.3,14.3" />
        </svg>
      );
    case "download":
      return (
        <svg {...c}>
          <path d="M12 4v11.5" />
          <polyline points="7,11.5 12,16.5 17,11.5" />
          <line x1="5" y1="20" x2="19" y2="20" />
        </svg>
      );
    case "chevronDown":
      return (
        <svg {...c}>
          <polyline points="6,9 12,15.5 18,9" />
        </svg>
      );
    case "chevronUp":
      return (
        <svg {...c}>
          <polyline points="6,15.5 12,9 18,15.5" />
        </svg>
      );
    case "alert":
      return (
        <svg {...c}>
          <path d="M12 3 22 20H2Z" />
          <line x1="12" y1="10" x2="12" y2="15" />
          <circle cx="12" cy="17.7" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...c} stroke="none" fill="currentColor">
          <path d="M12 2 13.8 9.2 21 11 13.8 12.8 12 20 10.2 12.8 3 11 10.2 9.2Z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...c}>
          <circle cx="12" cy="10" r="4.2" />
          <path d="M8.3 13 12 21l3.7-8" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...c}>
          <path d="M4 12.5h4.2l1.8 2.7h4l1.8-2.7H20" />
          <path d="M5 6.5h14L20.3 12.5v5.5a1 1 0 0 1-1 1H4.7a1 1 0 0 1-1-1v-5.5Z" />
        </svg>
      );
    case "sheet":
      return (
        <svg {...c}>
          <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <line x1="9" y1="13.5" x2="15" y2="19" />
          <line x1="15" y1="13.5" x2="9" y2="19" />
        </svg>
      );
    case "back":
      return (
        <svg {...c}>
          <line x1="19" y1="12" x2="5.5" y2="12" />
          <polyline points="11,6.5 5.5,12 11,17.5" />
        </svg>
      );
    case "upload":
      return (
        <svg {...c}>
          <path d="M12 16.5V5" />
          <polyline points="7.5,9.5 12,5 16.5,9.5" />
          <path d="M5 16.5v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
        </svg>
      );
    case "arrowUp":
      return (
        <svg {...c}>
          <line x1="12" y1="19" x2="12" y2="6" />
          <polyline points="6.5,11.5 12,6 17.5,11.5" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...c}>
          <path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" />
          <polyline points="18,3.5 18,7 14.5,7" />
          <polyline points="6,20.5 6,17 9.5,17" />
        </svg>
      );
    case "users":
      return (
        <svg {...c}>
          <circle cx="9.5" cy="8.5" r="3" />
          <path d="M3.5 19v-1.5a4 4 0 014-4h4a4 4 0 014 4V19" />
          <circle cx="17" cy="7.5" r="2.4" />
          <path d="M20.5 19v-1.5a3.6 3.6 0 00-2.4-3.4" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg {...c}>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M12 3a6 6 0 00-3.5 10.9c.6.4 1 1.2 1 2.1h5c0-.9.4-1.7 1-2.1A6 6 0 0012 3z" />
        </svg>
      );
    default:
      return null;
  }
};

const EMPTY_RECORD = {
  date: "",
  area: "",
  distributor: "",
  customer: "",
  objective: "",
  stage: "",
  outcome: "",
  potDyes: "",
  potAux: "",
  exDyes: "",
  exAux: "",
  abp: "",
  ytd: "",
};
const EMPTY_CUSTOMER = {
  area: "",
  distributor: "",
  stage: "",
  potDyes: "",
  potAux: "",
  exDyes: "",
  exAux: "",
  abp: "",
};
const getToken = () => localStorage.getItem("token") || "";
const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};
const toNum = (v) => {
  if (v === "" || v === undefined || v === null) return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};
const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
const pctColor = (pct) => {
  if (pct >= 80) return DS.success;
  if (pct >= 60) return DS.amber;
  return DS.info;
};
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
const getWeekRange = (weeksBack) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - weeksBack * 7);
  return { start, end };
};
const inRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

const injectGlobalStyles = () => {
  if (document.getElementById("dsr-global-styles")) return;
  const style = document.createElement("style");
  style.id = "dsr-global-styles";
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&display=swap');
    .dsr-layout, .dsr-layout input, .dsr-layout select, .dsr-layout button, .dsr-layout textarea {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .dsr-mono { font-family: 'IBM Plex Mono','SF Mono',ui-monospace,Consolas,monospace; font-feature-settings:"tnum" 1,"zero" 1; letter-spacing:-0.01em; }
    .dsr-layout ::selection { background:rgba(0,200,180,0.28); color:#DAE8F8; }
    .dsr-layout button:focus-visible,.dsr-layout input:focus-visible,.dsr-layout select:focus-visible { outline:2px solid #00C8B4; outline-offset:2px; border-radius:6px; }
    @media(prefers-reduced-motion:reduce){.dsr-layout *,.dsr-layout *::before,.dsr-layout *::after{animation-duration:0.001ms!important;transition-duration:0.001ms!important;}}
    @keyframes dsr-modal-in { from{opacity:0;transform:translateY(12px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }
    .dsr-modal-box { animation:dsr-modal-in 0.28s cubic-bezier(0.16,1,0.3,1) both; }
    .dsr-ladder-seg { transition:background-color 0.35s cubic-bezier(0.16,1,0.3,1),box-shadow 0.35s ease; }
    @keyframes dsr-spin { to{transform:rotate(360deg);} }
    .dsr-spinner { width:28px;height:28px;border-radius:50%;border:3px solid rgba(255,255,255,0.08);border-top-color:#00C8B4;animation:dsr-spin 0.7s linear infinite;margin:0 auto 14px; }
    .dsr-empty-icon { width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(0,200,180,0.12),rgba(59,130,246,0.12));border:1px solid rgba(0,200,180,0.2);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 14px; }
    .dsr-input:focus { outline:none;border-color:#00C8B4!important;box-shadow:0 0 0 3px rgba(0,200,180,0.18)!important; }
    .dsr-input-highlight { border-color:#F59E0B!important;background:rgba(245,158,11,0.06)!important;box-shadow:0 0 0 2px rgba(245,158,11,0.15)!important; }
    .dsr-input-highlight:focus { border-color:#D97706!important;box-shadow:0 0 0 3px rgba(217,119,6,0.22)!important; }
    .dsr-btn-primary { background:linear-gradient(135deg,#00E4CC,#00A89A)!important;border:none!important;box-shadow:0 1px 2px rgba(0,0,0,0.25),0 8px 20px -6px rgba(0,200,180,0.50);transition:transform 0.18s cubic-bezier(0.16,1,0.3,1),box-shadow 0.18s ease,filter 0.18s ease; }
    .dsr-btn-primary:hover:not(:disabled) { filter:brightness(1.07);transform:translateY(-1.5px);box-shadow:0 2px 4px rgba(0,0,0,0.3),0 12px 24px -6px rgba(0,200,180,0.60); }
    .dsr-btn-primary:active:not(:disabled) { transform:translateY(0);filter:brightness(0.97); }
    .dsr-btn-primary:disabled { opacity:0.5;cursor:not-allowed;box-shadow:none; }
    .dsr-btn-danger:hover { background:rgba(244,63,94,0.15)!important;color:#FB7185!important;border-color:rgba(244,63,94,0.4)!important; }
    .dsr-btn-edit:hover { background:rgba(59,130,246,0.12)!important;color:#60A5FA!important;border-color:rgba(59,130,246,0.35)!important; }
    .dsr-btn-export { background:linear-gradient(135deg,#0D9B72,#047857)!important;box-shadow:0 1px 2px rgba(0,0,0,0.2),0 8px 18px -6px rgba(4,120,87,0.45);transition:transform 0.18s cubic-bezier(0.16,1,0.3,1),box-shadow 0.18s ease,filter 0.18s ease; }
    .dsr-btn-export:hover { filter:brightness(1.08);transform:translateY(-1.5px); }
    .dsr-record-card { transition:box-shadow 0.25s cubic-bezier(0.16,1,0.3,1),transform 0.25s cubic-bezier(0.16,1,0.3,1),border-color 0.25s ease;box-shadow:0 1px 2px rgba(0,0,0,0.2),0 1px 1px rgba(0,0,0,0.15); }
    .dsr-record-card:hover { box-shadow:0 4px 8px rgba(0,0,0,0.3),0 16px 32px -12px rgba(0,200,180,0.20)!important;transform:translateY(-2px);border-color:#254868!important; }
    .dsr-customer-row { transition:background 0.12s; }
    .dsr-customer-row:hover { background:rgba(0,200,180,0.06)!important; }
    .dsr-customer-row:hover .dsr-row-actions { opacity:1!important; }
    .dsr-row-actions { opacity:0;transition:opacity 0.15s;display:flex;gap:6px;flex-shrink:0; }
    @media(max-width:767px){.dsr-row-actions{opacity:1!important;}}
    .dsr-nav-item:hover { background:rgba(255,255,255,0.05)!important; }
    .dsr-nav-item.active { background:rgba(0,200,180,0.14)!important;color:#00C8B4!important; }
    .dsr-topbar-btn:hover { background:rgba(255,255,255,0.12)!important; }
    .dsr-topbar-btn:active { background:rgba(255,255,255,0.20)!important; }
    .dsr-export-dropdown { position:relative;display:inline-flex;flex-shrink:0; }
    .dsr-export-menu { position:absolute;top:calc(100% + 6px);right:0;background:#0B1A2E;border:1px solid #1A3050;border-radius:12px;padding:8px;min-width:240px;z-index:200;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3); }
    .dsr-export-menu-item { display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;transition:background 0.12s;font-size:13px;font-weight:500;color:#DAE8F8;border:none;background:transparent;width:100%;text-align:left; }
    .dsr-export-menu-item:hover { background:rgba(0,200,180,0.10);color:#00C8B4; }
    .dsr-export-menu-item.active { background:rgba(0,200,180,0.12);color:#00C8B4;font-weight:700; }
    .dsr-export-divider { height:1px;background:#1A3050;margin:6px 0; }
    .dsr-export-custom-row { padding:10px 12px 4px;display:flex;flex-direction:column;gap:6px; }
    .dsr-export-custom-row label { font-size:11px;font-weight:700;color:#6A8BAE;text-transform:uppercase;letter-spacing:0.05em; }
    .dsr-export-custom-inputs { display:flex;gap:6px;align-items:center; }
    .dsr-card-expanded { border:1.5px solid #00C8B4!important;box-shadow:0 4px 8px rgba(0,0,0,0.25),0 16px 40px -10px rgba(0,200,180,0.22)!important; }
    .dsr-expand-btn { height:28px;padding:0 10px;border-radius:6px;border:1px solid #1A3050;background:transparent;font-size:11px;font-weight:600;cursor:pointer;color:#6A8BAE;transition:all 0.15s;display:flex;align-items:center;gap:4px; }
    .dsr-expand-btn:hover,.dsr-expand-btn.expanded { background:rgba(59,130,246,0.10);color:#60A5FA;border-color:rgba(59,130,246,0.35); }
    .dsr-card-detail-section { overflow:hidden;transition:max-height 0.3s cubic-bezier(0.4,0,0.2,1),opacity 0.2s ease;max-height:0;opacity:0; }
    .dsr-card-detail-section.open { max-height:800px;opacity:1; }
    .dsr-filter-chip { display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;border:1px solid #1A3050;background:rgba(255,255,255,0.03);font-size:12px;font-weight:600;color:#6A8BAE;cursor:pointer;transition:all 0.15s;white-space:nowrap; }
    .dsr-filter-chip:hover { border-color:#00C8B4;color:#00C8B4;background:rgba(0,200,180,0.08); }
    .dsr-filter-chip.active { background:#00C8B4;color:#06101E;border-color:#00C8B4; }
    .dsr-cust-banner { background:rgba(0,200,180,0.06);border:1px solid rgba(0,200,180,0.20);border-left:4px solid #00C8B4;border-radius:10px;padding:12px 14px;margin-bottom:14px; }
    .dsr-cust-banner-title { font-size:10px;font-weight:700;color:#00C8B4;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;display:flex;align-items:center;gap:5px; }
    .dsr-cust-banner-grid { display:grid;grid-template-columns:1fr 1fr;gap:6px 14px; }
    .dsr-cust-banner-item { display:flex;flex-direction:column;gap:1px; }
    .dsr-cust-banner-key { font-size:9px;color:#344D68;font-weight:600;text-transform:uppercase;letter-spacing:0.05em; }
    .dsr-cust-banner-val { font-size:12px;font-weight:700;color:#F5A623; }
    .dsr-last-hint { display:inline-flex;align-items:center;gap:5px;margin-top:5px;padding:3px 9px 3px 7px;border-radius:20px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);font-size:11px;color:#F5A623;line-height:1.4;cursor:pointer;transition:background 0.15s;max-width:100%;overflow:hidden; }
    .dsr-last-hint:hover { background:rgba(245,158,11,0.15); }
    .dsr-last-hint .hint-text { overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .dsr-last-hint .hint-use { flex-shrink:0;font-weight:700;color:#F5A623;margin-left:3px; }
    .dsr-edit-stripe { background:linear-gradient(135deg,#0E2A5A,#1A4E9E);border-radius:10px 10px 0 0;margin:-20px -20px 16px -20px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between; }
    .dsr-modal-box::-webkit-scrollbar { width:4px; }
    .dsr-modal-box::-webkit-scrollbar-track { background:#122035; }
    .dsr-modal-box::-webkit-scrollbar-thumb { background:#1A3050;border-radius:2px; }
    @keyframes ei-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.45);}70%{box-shadow:0 0 0 7px rgba(34,197,94,0);}100%{box-shadow:0 0 0 0 rgba(34,197,94,0);} }
    .ei-import-btn { animation:ei-pulse 2s ease-out 1; }
    .ei-import-btn:hover { background:#059669!important; }
    .ei-input { transition:border-color 0.15s,box-shadow 0.15s;outline:none; }
    .ei-input:focus { border-color:#00C8B4!important;box-shadow:0 0 0 3px rgba(0,200,180,0.18)!important; }
    .ei-row-new { background:rgba(0,200,180,0.05); }
    .ei-row-dup { background:rgba(245,158,11,0.05); }
    .ei-row-new td:first-child { border-left:3px solid #00C8B4; }
    .ei-row-dup td:first-child { border-left:3px solid #F59E0B; }
    .ei-check:checked { accent-color:#00C8B4; }
    .ei-btn-primary { background:linear-gradient(135deg,#00E4CC,#00A89A);color:#06101E;border:none;border-radius:8px;cursor:pointer;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,0.2),0 8px 20px -6px rgba(0,200,180,0.45);transition:filter 0.18s,transform 0.18s; }
    .ei-btn-primary:hover:not(:disabled) { filter:brightness(1.07);transform:translateY(-1.5px); }
    .ei-btn-primary:disabled { opacity:0.5;cursor:not-allowed;box-shadow:none; }
    .ei-btn-secondary { background:rgba(255,255,255,0.05);color:#DAE8F8;border:1px solid #1A3050;border-radius:8px;cursor:pointer;font-weight:500;transition:background 0.15s; }
    .ei-btn-secondary:hover { background:rgba(255,255,255,0.08); }
    .ei-dropzone { border:2px dashed #1A3050;border-radius:12px;background:rgba(255,255,255,0.02);transition:border-color 0.2s,background 0.2s;cursor:pointer; }
    .ei-dropzone.dragover { border-color:#00C8B4;background:rgba(0,200,180,0.06); }
    .ei-table { border-collapse:collapse;width:100%;font-size:12px; }
    .ei-table th { background:#122035;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6A8BAE;padding:8px 10px;border-bottom:1px solid #1A3050;position:sticky;top:0;z-index:1; }
    .ei-table td { padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle;color:#DAE8F8; }
    .ei-badge { display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700; }
    .ei-badge-new { background:rgba(0,200,180,0.15);color:#00C8B4;border:1px solid rgba(0,200,180,0.3); }
    .ei-badge-dup { background:rgba(245,158,11,0.12);color:#F5A623;border:1px solid rgba(245,158,11,0.3); }
    .ei-toast { position:fixed;top:20px;left:50%;transform:translateX(-50%);color:#fff;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,0.4);display:flex;align-items:center;gap:8px; }
    @media(max-width:640px){.ei-desktop-only{display:none!important;}}
    @media(min-width:768px){
      .dsr-layout{display:grid!important;grid-template-columns:240px 1fr!important;min-height:100vh!important;}
      .dsr-sidebar{display:flex!important;}.dsr-mobile-tabbar{display:none!important;}
      .dsr-main{padding:32px 40px 64px!important;max-width:1180px!important;}
      .dsr-header{padding:26px 30px!important;margin-bottom:24px!important;}
      .dsr-metrics-row{grid-template-columns:repeat(4,minmax(0,1fr))!important;}
      .dsr-grid2{grid-template-columns:repeat(2,minmax(0,1fr))!important;}
      .dsr-record-detail-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important;}
      .dsr-cust-banner-grid{grid-template-columns:repeat(3,1fr)!important;}
      .dsr-card-list{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;align-items:start;gap:14px!important;}
    }
    @media(min-width:1300px){.dsr-main{max-width:1320px!important;}}
    @media(max-width:767px){.dsr-sidebar{display:none!important;}.dsr-mobile-tabbar{display:flex!important;}}
  `;
  document.head.appendChild(style);
};

const EI_COL_MAP = {
  Customer: "name",
  Area: "area",
  Distributor: "distributor",
  "Project Stage": "stage",
  "Potential - Dyes (Rs L/mth)": "potDyes",
  "Potential - Aux (Rs L/mth)": "potAux",
  "Existing Bus: Dyes (Rs L/mth)": "exDyes",
  "Existing Bus: Aux (Rs L/mth)": "exAux",
  "ABP AM26  (Rs L)": "abp",
  "YTD Sale till end of Prev Mth (Rs L)": "ytd",
};
const normalizeDistributor = (val) => {
  if (!val) return "";
  const v = String(val).trim().toUpperCase();
  if (v.includes("SUPPLE")) return "Supple";
  if (v.includes("SHREE JEE")) return "Shree Jee Traders";
  return String(val).trim();
};
const normalizeStage = (val) => {
  if (!val) return "";
  const v = String(val).trim();
  const letter = v[0]?.toUpperCase();
  const match = PROJECT_STAGE_OPTIONS.find((s) => s[0] === letter);
  return match || v;
};

const IS = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: `1px solid #1A3050`,
  borderRadius: 8,
  fontSize: 13,
  color: "#DAE8F8",
  background: "rgba(255,255,255,0.04)",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  colorScheme: "dark", // ← ADD THIS
};

const IH = {
  ...IS,
  borderColor: "#F59E0B",
  background: "rgba(245,158,11,0.06)",
  boxShadow: "0 0 0 2px rgba(245,158,11,0.15)",
};

// ExcelImporter
const ExcelImporter = ({
  existingCustomers = {},
  onImportDone,
  onClose,
  apiBase = "",
  getToken: getTokenProp = () => "",
}) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState({});
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [eiToast, setEiToast] = useState({ msg: "", type: "" });
  const [dupAction, setDupAction] = useState("skip");
  const showEiToast = (msg, type = "success") => {
    setEiToast({ msg, type });
    setTimeout(() => setEiToast({ msg: "", type: "" }), 3000);
  };
  const parseFile = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          let hi = 0;
          for (let i = 0; i < Math.min(5, raw.length); i++) {
            if (raw[i].some((c) => String(c).trim() === "Customer")) {
              hi = i;
              break;
            }
          }
          const headers = raw[hi].map((h) => String(h).trim());
          const dataRows = raw.slice(hi + 1);
          const seenInFile = {};
          dataRows.forEach((row, i) => {
            const ci = headers.indexOf("Customer");
            const cn = ci >= 0 ? String(row[ci] || "").trim() : "";
            if (cn) seenInFile[cn] = i;
          });
          const parsed = [];
          dataRows.forEach((row, i) => {
            const obj = {};
            headers.forEach((h, j) => {
              const key = EI_COL_MAP[h];
              if (key) obj[key] = row[j];
            });
            const name = String(obj.name || "").trim();
            if (!name || seenInFile[name] !== i) return;
            const n = {
              name,
              area: String(obj.area || "").trim(),
              distributor: normalizeDistributor(obj.distributor),
              stage: normalizeStage(obj.stage),
              potDyes: toNum(obj.potDyes),
              potAux: toNum(obj.potAux),
              exDyes: toNum(obj.exDyes),
              exAux: toNum(obj.exAux),
              abp: toNum(obj.abp),
              ytd: toNum(obj.ytd),
            };
            n._isDup = !!existingCustomers[name];
            n._status = n._isDup ? "dup" : "new";
            parsed.push(n);
          });
          setRows(parsed);
          const sel = {};
          parsed.forEach((r, idx) => {
            sel[idx] = !r._isDup;
          });
          setSelected(sel);
          setDone(false);
        } catch (err) {
          showEiToast("File parse nahi hua: " + err.message, "error");
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [existingCustomers],
  );
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]);
  };
  const toggleRow = (idx) => setSelected((p) => ({ ...p, [idx]: !p[idx] }));
  const selectAllNew = () => {
    const s = {};
    rows.forEach((r, i) => {
      s[i] = !r._isDup;
    });
    setSelected(s);
  };
  const selectAll = () => {
    const s = {};
    rows.forEach((r, i) => {
      s[i] = true;
    });
    setSelected(s);
  };
  const deselectAll = () => {
    const s = {};
    rows.forEach((_, i) => {
      s[i] = false;
    });
    setSelected(s);
  };
  const selectedRows = rows.filter((_, i) => selected[i]);
  const newCount = rows.filter((r) => !r._isDup).length;
  const dupCount = rows.filter((r) => r._isDup).length;
  const handleImport = async () => {
    if (!selectedRows.length) {
      showEiToast("Koi customer select nahi kiya.", "error");
      return;
    }
    setImporting(true);
    let ok = 0,
      fail = 0;
    const imported = {};
    for (const r of selectedRows) {
      const p = {
        name: r.name,
        area: r.area,
        distributor: r.distributor,
        stage: r.stage,
        potDyes: r.potDyes,
        potAux: r.potAux,
        exDyes: r.exDyes,
        exAux: r.exAux,
        abp: r.abp,
      };
      try {
        if (r._isDup && dupAction === "overwrite") {
          const eid = existingCustomers[r.name]?._id;
          if (eid) {
            const res = await fetch(`${apiBase}/api/dsr/customers/${eid}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getTokenProp()}`,
              },
              body: JSON.stringify(p),
            });
            const d = await res.json();
            if (res.ok && d.data) {
              imported[r.name] = d.data;
              ok++;
            } else fail++;
          } else fail++;
        } else if (!r._isDup) {
          const res = await fetch(`${apiBase}/api/dsr/customers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getTokenProp()}`,
            },
            body: JSON.stringify(p),
          });
          const d = await res.json();
          if (res.ok && d.data) {
            Object.assign(imported, d.data);
            ok++;
          } else fail++;
        }
      } catch {
        fail++;
      }
    }
    setImporting(false);
    setDone(true);
    if (ok > 0) {
      showEiToast(
        `${ok} customer${ok > 1 ? "s" : ""} import ho gaye!${fail > 0 ? ` (${fail} fail)` : ""}`,
      );
      if (onImportDone) onImportDone(imported);
    } else showEiToast("Import fail ho gaya.", "error");
  };
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.80)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 16,
        backdropFilter: "blur(6px)",
      }}
    >
      {eiToast.msg && (
        <div
          className="ei-toast"
          style={{
            background: eiToast.type === "error" ? "#BE123C" : "#047857",
          }}
        >
          <Icon
            name={eiToast.type === "error" ? "close" : "check"}
            size={14}
            strokeWidth={2.3}
          />
          {eiToast.msg}
        </div>
      )}
      <div
        className="dsr-modal-box"
        style={{
          background: DS.card,
          border: `1px solid ${DS.border}`,
          borderRadius: 16,
          width: "100%",
          maxWidth: 700,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 8px 16px rgba(0,0,0,0.5),0 32px 64px -16px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg,#050E1D,#0A2A5A)",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
            borderBottom: `1px solid ${DS.border}`,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg,#00C8B4,#008A7E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,200,180,0.35)",
            }}
          >
            <Icon
              name="upload"
              size={19}
              strokeWidth={2}
              style={{ color: "#06101E" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: DS.text1 }}>
              Excel se Customers Import karo
            </div>
            <div style={{ fontSize: 11, color: DS.text2, marginTop: 2 }}>
              DVR.xlsx ya koi bhi DSR format
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
              background: "rgba(255,255,255,0.06)",
              color: DS.text2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={15} strokeWidth={2.2} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {rows.length === 0 && (
            <div
              className={`ei-dropzone${dragOver ? " dragover" : ""}`}
              style={{ padding: "40px 20px", textAlign: "center" }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg,rgba(0,200,180,0.12),rgba(59,130,246,0.12))",
                  border: "1px solid rgba(0,200,180,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                }}
              >
                <Icon
                  name="sheet"
                  size={28}
                  strokeWidth={1.6}
                  style={{ color: DS.primary }}
                />
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: DS.text1,
                  marginBottom: 6,
                }}
              >
                Excel file yahan drop karo
              </div>
              <div style={{ fontSize: 13, color: DS.text2, marginBottom: 16 }}>
                ya click karke select karo (.xlsx, .xls)
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 20px",
                  background: DS.primary,
                  color: "#06101E",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,200,180,0.35)",
                }}
              >
                <Icon name="upload" size={13} strokeWidth={2.1} /> File Browse
                karo
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files[0]) parseFile(e.target.files[0]);
                }}
              />
            </div>
          )}
          {rows.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 14,
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    padding: "6px 14px",
                    background: "rgba(0,200,180,0.12)",
                    color: DS.primary,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    border: "1px solid rgba(0,200,180,0.25)",
                  }}
                >
                  <Icon name="sparkle" size={11} />
                  {newCount} Naye
                </div>
                {dupCount > 0 && (
                  <div
                    style={{
                      padding: "6px 14px",
                      background: "rgba(245,166,35,0.10)",
                      color: DS.gold,
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      border: "1px solid rgba(245,166,35,0.25)",
                    }}
                  >
                    <Icon name="alert" size={12} strokeWidth={2} />
                    {dupCount} Exist
                  </div>
                )}
                <div
                  style={{ marginLeft: "auto", fontSize: 12, color: DS.text2 }}
                >
                  {selectedRows.length} selected
                </div>
              </div>
              {dupCount > 0 && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    borderLeft: `4px solid ${DS.amber}`,
                    borderRadius: 10,
                    marginBottom: 14,
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: DS.gold,
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Icon name="alert" size={12} strokeWidth={2} /> Duplicates
                    ke liye:
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["skip", "overwrite"].map((val) => (
                      <label
                        key={val}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          cursor: "pointer",
                          padding: "5px 12px",
                          borderRadius: 6,
                          border: `1px solid ${dupAction === val ? DS.amber : DS.border}`,
                          background:
                            dupAction === val
                              ? "rgba(245,158,11,0.10)"
                              : "transparent",
                          fontWeight: dupAction === val ? 700 : 400,
                          color: dupAction === val ? DS.gold : DS.text2,
                        }}
                      >
                        <input
                          type="radio"
                          name="dupAction"
                          value={val}
                          checked={dupAction === val}
                          onChange={() => setDupAction(val)}
                          className="ei-check"
                        />
                        {val === "skip" ? "Skip (recommended)" : "Overwrite"}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button
                  className="ei-btn-secondary"
                  onClick={selectAllNew}
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="check" size={11} strokeWidth={2.3} /> Sirf naye
                </button>
                <button
                  className="ei-btn-secondary"
                  onClick={selectAll}
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="check" size={11} strokeWidth={2.3} /> Sab
                </button>
                <button
                  className="ei-btn-secondary"
                  onClick={deselectAll}
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="close" size={11} strokeWidth={2.3} /> Deselect
                </button>
              </div>
              <div
                style={{
                  border: `1px solid ${DS.border}`,
                  borderRadius: 10,
                  overflow: "hidden",
                  overflowX: "auto",
                }}
              >
                <table className="ei-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}></th>
                      <th>Customer</th>
                      <th>Area</th>
                      <th className="ei-desktop-only">Pot. Dyes</th>
                      <th className="ei-desktop-only">ABP</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const isSel = !!selected[idx];
                      return (
                        <tr
                          key={idx}
                          className={
                            r._isDup ? "ei-row-dup" : isSel ? "ei-row-new" : ""
                          }
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleRow(idx)}
                        >
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              className="ei-check"
                              checked={isSel}
                              onChange={() => toggleRow(idx)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={r._isDup && dupAction === "skip"}
                            />
                          </td>
                          <td style={{ fontWeight: 600, color: DS.text1 }}>
                            {r.name}
                          </td>
                          <td style={{ color: DS.text2 }}>{r.area}</td>
                          <td
                            className="ei-desktop-only"
                            style={{ color: DS.gold }}
                          >
                            ₹{r.potDyes}L
                          </td>
                          <td
                            className="ei-desktop-only"
                            style={{ color: DS.gold }}
                          >
                            ₹{r.abp}L
                          </td>
                          <td>
                            <span
                              className={`ei-badge ${r._isDup ? "ei-badge-dup" : "ei-badge-new"}`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                            >
                              {r._isDup ? (
                                <Icon name="alert" size={9} strokeWidth={2.2} />
                              ) : (
                                <Icon name="sparkle" size={9} />
                              )}
                              {r._isDup ? "Dup" : "New"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <button
                  className="ei-btn-secondary"
                  onClick={() => {
                    setRows([]);
                    setSelected({});
                    setDone(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  style={{
                    fontSize: 12,
                    padding: "5px 14px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name="refresh" size={12} strokeWidth={2} /> Alag file
                </button>
              </div>
            </>
          )}
        </div>
        <div
          style={{
            padding: "14px 20px",
            borderTop: `1px solid ${DS.border}`,
            display: "flex",
            gap: 10,
            alignItems: "center",
            background: DS.surface,
            flexShrink: 0,
          }}
        >
          {done ? (
            <button
              className="ei-btn-primary"
              onClick={onClose}
              style={{
                flex: 1,
                height: 42,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Icon name="check" size={14} strokeWidth={2.3} /> Done — Close
              karo
            </button>
          ) : (
            <>
              <button
                className="ei-btn-secondary"
                onClick={onClose}
                style={{ flex: 1, height: 42, fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                className="ei-btn-primary"
                onClick={handleImport}
                disabled={importing || !selectedRows.length || !rows.length}
                style={{
                  flex: 2,
                  height: 42,
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {importing ? (
                  <span
                    className="dsr-spinner"
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(0,0,0,0.2)",
                      borderTopColor: "#06101E",
                      margin: 0,
                    }}
                  />
                ) : (
                  <Icon name="upload" size={14} strokeWidth={2.1} />
                )}
                {importing
                  ? "Import ho raha hai…"
                  : !rows.length
                    ? "Pehle file upload karo"
                    : `${selectedRows.length} Customers Import karo`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ExportDropdown
const EXPORT_OPTIONS = [
  { id: "all", label: "All records", icon: "records", weeks: null },
  { id: "custom", label: "Custom range", icon: "calendar", weeks: null },
];
const ExportDropdown = ({ records, onExport }) => {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState("all");
  const [cs, setCs] = useState("");
  const [ce, setCe] = useState("");
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const doExp = (id) => {
    const opt = EXPORT_OPTIONS.find((o) => o.id === id);
    let f = records;
    if (id === "custom" && cs && ce) {
      const s = new Date(cs);
      const e = new Date(ce);
      e.setHours(23, 59, 59, 999);
      f = records.filter((r) => inRange(r.date, s, e));
    }
    onExport(f, opt?.label || "Custom");
    setOpen(false);
  };
  return (
    <div className="dsr-export-dropdown" ref={ref}>
      <button
        className="dsr-btn-export"
        onClick={() => setOpen((p) => !p)}
        style={{
          background: "#047857",
          color: "#fff",
          border: "none",
          height: 38,
          padding: "0 14px",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
        }}
      >
        <Icon name="download" size={14} strokeWidth={2.1} /> Export{" "}
        <Icon
          name={open ? "chevronUp" : "chevronDown"}
          size={13}
          strokeWidth={2.1}
        />
      </button>
      {open && (
        <div className="dsr-export-menu">
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: DS.text3,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "2px 12px 6px",
            }}
          >
            Export range
          </div>
          <button
            className={`dsr-export-menu-item${sel === "all" ? " active" : ""}`}
            onClick={() => {
              setSel("all");
              doExp("all");
            }}
          >
            <Icon name="records" size={13} strokeWidth={2} />
            <span>All records</span>
            <span style={{ marginLeft: "auto", fontSize: 10, color: DS.text3 }}>
              {records.length} records
            </span>
          </button>
          <div className="dsr-export-divider" />
          <div className="dsr-export-custom-row">
            <label>Custom date range</label>
            <div className="dsr-export-custom-inputs">
              <input
                type="date"
                value={cs}
                onChange={(e) => setCs(e.target.value)}
                className="ei-input"
                style={{
                  flex: 1,
                  height: 32,
                  padding: "0 8px",
                  border: `1px solid ${DS.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  background: DS.surface,
                  color: DS.text1,
                }}
              />
              <span style={{ fontSize: 11, color: DS.text3 }}>to</span>
              <input
                type="date"
                value={ce}
                onChange={(e) => setCe(e.target.value)}
                className="ei-input"
                style={{
                  flex: 1,
                  height: 32,
                  padding: "0 8px",
                  border: `1px solid ${DS.border}`,
                  borderRadius: 6,
                  fontSize: 12,
                  background: DS.surface,
                  color: DS.text1,
                }}
              />
            </div>
            <button
              onClick={() => {
                setSel("custom");
                doExp("custom");
              }}
              disabled={!cs || !ce}
              style={{
                marginTop: 4,
                height: 32,
                background: cs && ce ? "#047857" : DS.border,
                color: cs && ce ? "#fff" : DS.text3,
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: cs && ce ? "pointer" : "not-allowed",
              }}
            >
              Export Custom Range
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CustomerLastRecord = ({ record }) => {
  if (!record) return null;
  const sc = stageColor(record.stage);
  return (
    <div className="dsr-cust-banner">
      <div className="dsr-cust-banner-title">
        <Icon name="pin" size={11} strokeWidth={2} />
        <span>{record.customer} — last visit</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 400,
            color: DS.text2,
          }}
        >
          {fmtDate(record.date)}
        </span>
      </div>
      {record.objective && (
        <div
          style={{
            fontSize: 12,
            color: DS.text1,
            marginBottom: 5,
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 700 }}>Objective: </span>
          {record.objective}
        </div>
      )}
      {record.outcome && (
        <div
          style={{
            fontSize: 12,
            color: DS.text1,
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          <span style={{ fontWeight: 700 }}>Outcome: </span>
          {record.outcome}
        </div>
      )}
      {record.stage && (
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 4,
              fontWeight: 600,
              background: sc.bg,
              color: sc.text,
              border: `1px solid ${sc.border}44`,
            }}
          >
            {record.stage}
          </span>
        </div>
      )}
      <div className="dsr-cust-banner-grid">
        {[
          ["Pot. Dyes", record.potDyes],
          ["Pot. Aux", record.potAux],
          ["Ex. Dyes", record.exDyes],
          ["Ex. Aux", record.exAux],
          ["ABP AM26", record.abp],
          ["YTD Sale", record.ytd],
        ].map(([k, v]) => (
          <div key={k} className="dsr-cust-banner-item">
            <span className="dsr-cust-banner-key">{k}</span>
            <span className="dsr-cust-banner-val">₹{v ?? 0}L</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LastHint = ({ value, onUse }) => {
  if (!value) return null;
  return (
    <div
      className="dsr-last-hint"
      onClick={() => onUse(value)}
      title={`Click to reuse: ${value}`}
    >
      <Icon name="clock" size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
      <span className="hint-text">
        <span style={{ fontWeight: 600, marginRight: 3 }}>Last:</span>
        {value}
      </span>
      <span
        className="hint-use"
        style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
      >
        <Icon name="arrowUp" size={10} strokeWidth={2.4} /> reuse
      </span>
    </div>
  );
};

const MetricCard = ({ label, value, sub, accent }) => (
  <div
    style={{
      background: DS.card,
      borderRadius: 14,
      padding: "15px 16px 14px",
      border: `1px solid ${DS.border}`,
      boxShadow: "0 1px 2px rgba(0,0,0,0.2),0 8px 20px -12px rgba(0,0,0,0.3)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg,${accent || DS.primary},${accent || DS.primary}55)`,
      }}
    />
    <div
      style={{
        fontSize: 9.5,
        color: DS.text3,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        marginBottom: 7,
      }}
    >
      {label}
    </div>
    <div
      className="dsr-mono"
      style={{ fontSize: 23, fontWeight: 700, color: DS.gold, lineHeight: 1 }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontSize: 10.5,
          color: DS.text2,
          marginTop: 5,
          fontWeight: 500,
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

const FieldLabel = ({ children, required, keyBadge }) => (
  <label
    style={{
      display: "block",
      fontSize: 11,
      color: DS.text2,
      marginBottom: 5,
      fontWeight: 600,
      letterSpacing: "0.02em",
    }}
  >
    {children}
    {required && <span style={{ color: DS.danger, marginLeft: 2 }}>*</span>}
    {keyBadge && (
      <span
        style={{
          marginLeft: 6,
          fontSize: 10,
          fontWeight: 700,
          color: DS.gold,
          background: "rgba(245,166,35,0.12)",
          padding: "1px 6px 1px 5px",
          borderRadius: 4,
          letterSpacing: "0.03em",
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Icon name="sparkle" size={9} /> KEY
      </span>
    )}
  </label>
);

const FormInput = ({ label, required, keyBadge, highlight, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && (
      <FieldLabel required={required} keyBadge={keyBadge}>
        {label}
      </FieldLabel>
    )}
    <input
      className={highlight ? "dsr-input dsr-input-highlight" : "dsr-input"}
      style={highlight ? IH : IS}
      {...props}
    />
  </div>
);
// ── CustomSelect — replaces native <select> with a fully dark-themed panel ──
// Native selects render their options list with the OS/browser's own styling
// (always light on most systems) regardless of colorScheme — this component
// owns the entire visual from trigger button to options panel.
const CustomSelect = ({
  value,
  onChange,
  name,
  highlight,
  disabled,
  placeholder = "Select…",
  children,
  style,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Parse <option> children → plain {value, label} array
  const options = React.Children.toArray(children)
    .filter((c) => React.isValidElement(c) && c.type === "option")
    .map((c) => ({
      value: String(c.props.value ?? ""),
      label: String(c.props.children ?? ""),
    }));

  const selected = options.find((o) => o.value === String(value ?? ""));

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = (v) => {
    if (onChange) onChange({ target: { name, value: v } });
    setOpen(false);
  };

  const base = highlight ? IH : IS;
  const isEmpty = !selected?.value;

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      {/* Trigger button — same height/radius as inputs */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((p) => !p)}
        style={{
          ...base,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          color: isEmpty ? DS.text1 : DS.text1,
          borderColor: open ? DS.primary : highlight ? DS.amber : DS.border,
          boxShadow: open
            ? `0 0 0 3px rgba(0,200,180,0.18)`
            : highlight
              ? "0 0 0 2px rgba(245,158,11,0.15)"
              : "none",
        }}
      >
        <span
          style={{
            flex: 1,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {selected?.label || placeholder}
        </span>
        <Icon
          name={open ? "chevronUp" : "chevronDown"}
          size={14}
          strokeWidth={2}
          style={{
            flexShrink: 0,
            color: open ? DS.primary : DS.text3,
            transition: "color 0.15s, transform 0.2s",
          }}
        />
      </button>

      {/* Options panel */}
      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 5px)",
            left: 0,
            right: 0,
            zIndex: 200,
            background: DS.surface,
            border: `1px solid ${DS.borderHi}`,
            borderRadius: 12,
            padding: 5,
            maxHeight: 260,
            overflowY: "auto",
            boxShadow:
              "0 20px 48px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.04)",
            scrollbarWidth: "thin",
            scrollbarColor: `${DS.border} transparent`,
          }}
        >
          {options.map((opt) => {
            const isSel = opt.value === String(value ?? "");
            const isEmptyOpt = !opt.value;
            // Show a stage-colour dot for Project Stage options
            const isStageOpt = PROJECT_STAGE_OPTIONS.some(
              (s) => s === opt.label,
            );
            const sc = isStageOpt ? stageColor(opt.label) : null;

            return (
              <div
                key={opt.value}
                onClick={() => !isEmptyOpt && pick(opt.value)}
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  cursor: isEmptyOpt ? "default" : "pointer",
                  fontSize: 13,
                  color: isEmptyOpt ? DS.text3 : isSel ? DS.primary : DS.text1,
                  background: isSel ? DS.primaryDim : "transparent",
                  fontWeight: isSel ? 600 : 400,
                  transition: "background 0.1s, color 0.1s",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  borderLeft: `2px solid ${isSel ? DS.primary : "transparent"}`,
                  userSelect: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isSel && !isEmptyOpt)
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isSel
                    ? DS.primaryDim
                    : "transparent";
                }}
              >
                {/* Stage colour dot — glows with its stage colour */}
                {sc && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 2,
                      flexShrink: 0,
                      background: sc.border,
                      boxShadow: `0 0 6px ${sc.border}AA`,
                    }}
                  />
                )}
                <span
                  style={{
                    flex: 1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    lineHeight: 1.4,
                  }}
                >
                  {opt.label}
                </span>
                {isSel && !isEmptyOpt && (
                  <Icon
                    name="check"
                    size={13}
                    strokeWidth={2.5}
                    style={{ color: DS.primary, flexShrink: 0 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const FormSelect = ({
  label,
  required,
  keyBadge,
  highlight,
  children,
  ...props
}) => (
  <div style={{ marginBottom: 12 }}>
    {label && (
      <FieldLabel required={required} keyBadge={keyBadge}>
        {label}
      </FieldLabel>
    )}
    <CustomSelect highlight={highlight} {...props}>
      {children}
    </CustomSelect>
  </div>
);

const Toast = ({ msg, type }) => {
  if (!msg) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        color: "#fff",
        padding: "11px 20px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 1000,
        whiteSpace: "nowrap",
        boxShadow: "0 4px 8px rgba(0,0,0,0.4),0 16px 32px -8px rgba(0,0,0,0.5)",
        background: type === "error" ? "#BE123C" : "#047857",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Icon
        name={type === "error" ? "close" : "check"}
        size={15}
        strokeWidth={2.3}
      />
      {msg}
    </div>
  );
};

const RecordCard = ({ record, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const color = pctColor(record.pct);
  const sc = stageColor(record.stage);
  const id = record._id || record.id;
  return (
    <div
      className={`dsr-record-card${expanded ? " dsr-card-expanded" : ""}`}
      style={{
        background: DS.card,
        border: `1px solid ${DS.border}`,
        borderRadius: 12,
        overflow: "hidden",
        borderLeft: `4px solid ${sc.border}`,
      }}
    >
      <div style={{ padding: "14px 14px 0 14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: 8,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: DS.text1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {record.customer}
            </div>
            <div style={{ fontSize: 11, color: DS.text2, marginTop: 2 }}>
              {fmtDate(record.date)} · {record.area}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 10,
                padding: "3px 9px",
                borderRadius: 20,
                fontWeight: 600,
                background: "rgba(59,130,246,0.12)",
                color: DS.info,
                border: "1px solid rgba(59,130,246,0.25)",
              }}
            >
              {record.distributor}
            </span>
            <button
              className={`dsr-expand-btn${expanded ? " expanded" : ""}`}
              onClick={() => setExpanded((p) => !p)}
            >
              {expanded ? "▲ Collapse" : "▼ Expand"}
            </button>
          </div>
        </div>
        {record.objective && (
          <div
            style={{
              fontSize: 12,
              color: DS.text1,
              marginBottom: 6,
              lineHeight: 1.4,
              background: "rgba(0,200,180,0.07)",
              borderRadius: 6,
              padding: "6px 10px",
              borderLeft: `3px solid ${DS.primary}`,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: DS.text3,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 2,
              }}
            >
              Objective
            </span>
            {record.objective}
          </div>
        )}
        {record.outcome && (
          <div
            style={{
              fontSize: 12,
              color: DS.text1,
              marginBottom: 8,
              lineHeight: 1.4,
              background: "rgba(59,130,246,0.07)",
              borderRadius: 6,
              padding: "6px 10px",
              borderLeft: `3px solid ${DS.info}`,
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: DS.text3,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "block",
                marginBottom: 2,
              }}
            >
              Visit Outcome
            </span>
            {record.outcome}
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            paddingBottom: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  padding: "3px 8px",
                  borderRadius: 4,
                  fontWeight: 600,
                  background: sc.bg,
                  color: sc.text,
                  border: `1px solid ${sc.border}44`,
                  maxWidth: 200,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {record.stage || "No stage"}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color,
                  marginLeft: 8,
                  flexShrink: 0,
                }}
              >
                {record.pct}%
              </span>
            </div>
            <div style={{ marginBottom: 6 }}>
              <StageLadder stage={record.stage} size="sm" />
            </div>
            <div
              style={{
                height: 5,
                background: DS.border,
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(record.pct, 100)}%`,
                  background: color,
                  borderRadius: 3,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button
              className="dsr-btn-edit"
              onClick={() => onEdit(record)}
              style={{
                color: DS.info,
                background: "transparent",
                border: "1px solid rgba(59,130,246,0.25)",
                height: 30,
                padding: "0 10px",
                borderRadius: 6,
                fontSize: 11,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Icon name="edit" size={12} strokeWidth={2} /> Edit
            </button>
            <button
              className="dsr-btn-danger"
              onClick={() => onDelete(id)}
              style={{
                color: DS.danger,
                background: "transparent",
                border: "1px solid rgba(244,63,94,0.25)",
                height: 30,
                padding: "0 10px",
                borderRadius: 6,
                fontSize: 11,
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Icon name="trash" size={12} strokeWidth={2} /> Delete
            </button>
          </div>
        </div>
      </div>
      <div className={`dsr-card-detail-section${expanded ? " open" : ""}`}>
        <div
          style={{
            margin: "0 14px",
            borderTop: `1px dashed ${DS.border}`,
            paddingTop: 12,
            paddingBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: DS.text3,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Icon name="wallet" size={12} strokeWidth={2} /> Financial Details
            (₹ Lakhs)
          </div>
          <div
            className="dsr-record-detail-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,minmax(0,1fr))",
              gap: "10px 14px",
              padding: "12px 14px",
              background: DS.surface,
              borderRadius: 10,
              border: `1px solid ${DS.border}`,
            }}
          >
            {[
              ["Pot. Dyes", record.potDyes],
              ["Pot. Aux", record.potAux],
              ["Ex. Dyes", record.exDyes],
              ["Ex. Aux", record.exAux],
              ["ABP AM26", record.abp],
              ["YTD Sale", record.ytd],
            ].map(([key, val]) => (
              <div
                key={key}
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  background: DS.card,
                  borderRadius: 8,
                  border: `1px solid ${DS.border}`,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: DS.text3,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 4,
                  }}
                >
                  {key}
                </div>
                <div
                  className="dsr-mono"
                  style={{ fontSize: 15.5, fontWeight: 700, color: DS.gold }}
                >
                  ₹{val}L
                </div>
              </div>
            ))}
          </div>
          <div
            style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            {[
              [
                "Total Potential",
                `₹${(toNum(record.potDyes) + toNum(record.potAux)).toFixed(2)}L/mth`,
                DS.primary,
                "rgba(0,200,180,0.08)",
                "rgba(0,200,180,0.2)",
              ],
              [
                "Total Existing",
                `₹${(toNum(record.exDyes) + toNum(record.exAux)).toFixed(2)}L/mth`,
                DS.info,
                "rgba(59,130,246,0.08)",
                "rgba(59,130,246,0.2)",
              ],
              [
                "YTD vs ABP",
                `${record.pct}%`,
                color,
                "rgba(245,166,35,0.06)",
                "rgba(245,166,35,0.18)",
              ],
            ].map(([lbl, val, clr, bg, bd]) => (
              <div
                key={lbl}
                style={{
                  flex: 1,
                  minWidth: 120,
                  padding: "8px 12px",
                  background: bg,
                  borderRadius: 8,
                  border: `1px solid ${bd}`,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: DS.text3,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {lbl}
                </div>
                <div
                  className="dsr-mono"
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: clr,
                    marginTop: 2,
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MonthAnalysisCard = ({ month, delta, expanded, onToggle }) => (
  <div
    className="dsr-record-card"
    style={{
      background: DS.card,
      border: `1px solid ${DS.border}`,
      borderRadius: 12,
      overflow: "hidden",
      borderLeft: `4px solid ${DS.primary}`,
    }}
  >
    <div style={{ padding: "14px 14px 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: DS.text1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          {month.label}
          {delta !== null && delta !== 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: delta > 0 ? DS.success : DS.danger,
              }}
            >
              {delta > 0 ? `▲ +${delta}` : `▼ ${delta}`} vs last mth
            </span>
          )}
        </div>
        <button
          className={`dsr-expand-btn${expanded ? " expanded" : ""}`}
          onClick={onToggle}
        >
          {expanded ? "▲ Collapse" : "▼ Details"}
        </button>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,minmax(0,1fr))",
          gap: 8,
        }}
      >
        {[
          ["Visits", month.totalVisits, DS.info],
          ["Customers", month.uniqueCustomers, DS.primary],
          ["Potential", `₹${month.totalPot}L`, DS.gold],
          ["Avg YTD/ABP", `${month.avgPct}%`, DS.purple],
        ].map(([lbl, val, clr]) => (
          <div
            key={lbl}
            style={{
              textAlign: "center",
              padding: "8px 4px",
              background: DS.surface,
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: DS.text3,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                marginBottom: 3,
              }}
            >
              {lbl}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: clr }}>
              {val}
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className={`dsr-card-detail-section${expanded ? " open" : ""}`}>
      <div
        style={{
          margin: "0 14px",
          borderTop: `1px dashed ${DS.border}`,
          paddingTop: 12,
          paddingBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: DS.text3,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Icon name="users" size={12} strokeWidth={2} /> Customer-wise visits
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {month.customerRows.map((c) => (
            <div
              key={c.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                background: DS.surface,
                borderRadius: 8,
                border: `1px solid ${DS.border}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: DS.text1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {c.name}
                </div>
                <div style={{ fontSize: 10, color: DS.text2, marginTop: 1 }}>
                  {c.latest.area} · {c.latest.distributor}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <StageLadder stage={c.latest.stage} size="sm" />
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: DS.primary,
                  background: DS.primaryDim,
                  padding: "2px 8px",
                  borderRadius: 20,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  border: "1px solid rgba(0,200,180,0.2)",
                }}
              >
                {c.visits}× visit{c.visits > 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const TABS = [
  { id: "records", icon: "records", label: "Records" },
  { id: "add", icon: "addRecord", label: "Add Record" },
  { id: "customers", icon: "store", label: "Customers" },
  { id: "analysis", icon: "trending", label: "Analysis" },
];

const Sidebar = ({ active, onChange, recordCount }) => (
  <div
    className="dsr-sidebar"
    style={{
      background: `linear-gradient(180deg,${DS.sidebar} 0%,#030A14 100%)`,
      flexDirection: "column",
      padding: "0",
      position: "sticky",
      top: 0,
      height: "100vh",
      overflow: "hidden",
      borderRight: `1px solid ${DS.border}`,
    }}
  >
    <div
      style={{
        padding: "22px 20px 20px",
        borderBottom: `1px solid ${DS.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg,#00E4CC,#009A8E)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 900,
            color: "#06101E",
            flexShrink: 0,
            boxShadow:
              "0 0 16px rgba(0,200,180,0.45),0 4px 12px -2px rgba(0,200,180,0.35)",
          }}
        >
          D
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: DS.text1,
              letterSpacing: "-0.01em",
            }}
          >
            DSR
          </div>
          <div
            style={{
              fontSize: 9.5,
              color: DS.text3,
              fontWeight: 500,
              letterSpacing: "0.02em",
            }}
          >
            Sales Management
          </div>
        </div>
      </div>
    </div>
    <nav style={{ padding: "14px 10px", flex: 1 }}>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`dsr-nav-item${active === t.id ? " active" : ""}`}
          onClick={() => onChange(t.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "10px 12px",
            borderRadius: 9,
            border: "none",
            borderLeft:
              active === t.id
                ? `3px solid ${DS.primary}`
                : "3px solid transparent",
            cursor: "pointer",
            marginBottom: 3,
            fontSize: 13,
            fontWeight: active === t.id ? 700 : 500,
            color: active === t.id ? DS.primary : DS.text2,
            background:
              active === t.id ? "rgba(0,200,180,0.12)" : "transparent",
            textAlign: "left",
            transition: "background 0.2s,color 0.2s,border-color 0.2s",
          }}
        >
          <Icon name={t.icon} size={17} strokeWidth={1.9} />
          <span>{t.label}</span>
          {t.id === "records" && recordCount > 0 && (
            <span
              style={{
                marginLeft: "auto",
                background: "linear-gradient(135deg,#00E4CC,#00A89A)",
                color: "#06101E",
                fontSize: 10,
                fontWeight: 900,
                padding: "1px 7px",
                borderRadius: 10,
                lineHeight: "16px",
                boxShadow: "0 2px 8px rgba(0,200,180,0.35)",
              }}
            >
              {recordCount}
            </span>
          )}
        </button>
      ))}
    </nav>
    <div style={{ padding: "12px 20px", borderTop: `1px solid ${DS.border}` }}>
      <div style={{ fontSize: 10, color: DS.text3, fontWeight: 500 }}>
        {new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </div>
    </div>
  </div>
);

const MobileTabBar = ({ active, onChange, recordCount }) => (
  <div
    className="dsr-mobile-tabbar"
    style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      background: DS.card,
      borderTop: `1px solid ${DS.border}`,
      boxShadow: "0 -4px 16px rgba(0,0,0,0.3)",
      padding: "6px 0 calc(6px + env(safe-area-inset-bottom))",
      justifyContent: "space-around",
    }}
  >
    <button
      onClick={() => window.history.back()}
      style={{
        flex: 1,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: "4px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        color: DS.text3,
      }}
    >
      <Icon name="back" size={19} />
      <span style={{ fontSize: 9 }}>Back</span>
    </button>
    {TABS.map((t) => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        style={{
          flex: 1,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: "4px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          color: active === t.id ? DS.primary : DS.text2,
          position: "relative",
        }}
      >
        <Icon
          name={t.icon}
          size={19}
          strokeWidth={active === t.id ? 2.1 : 1.8}
        />
        <span style={{ fontSize: 9, fontWeight: active === t.id ? 700 : 400 }}>
          {t.label}
        </span>
        {t.id === "records" && recordCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: "22%",
              background: DS.danger,
              color: "#fff",
              fontSize: 8,
              fontWeight: 700,
              width: 14,
              height: 14,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {recordCount > 99 ? "99" : recordCount}
          </span>
        )}
      </button>
    ))}
    <button
      onClick={() => onChange("records")}
      style={{
        flex: 1,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        padding: "4px 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        color: active === "records" ? DS.primary : DS.text2,
      }}
    >
      <Icon name="home" size={19} />
      <span style={{ fontSize: 9 }}>Home</span>
    </button>
  </div>
);

const SectionCard = ({ title, children, style }) => (
  <div
    style={{
      background: DS.card,
      border: `1px solid ${DS.border}`,
      borderRadius: 14,
      padding: "17px",
      marginBottom: 14,
      boxShadow: "0 1px 2px rgba(0,0,0,0.2),0 8px 20px -12px rgba(0,0,0,0.3)",
      ...style,
    }}
  >
    {title && (
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: DS.text3,
          marginBottom: 14,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);

const CustomerModal = ({
  mode,
  editName,
  initialData,
  onSave,
  onDelete,
  onClose,
  saving,
}) => {
  const [name, setName] = useState(editName || "");
  const [data, setData] = useState(initialData || EMPTY_CUSTOMER);
  useEffect(() => {
    setName(editName || "");
    setData(initialData || EMPTY_CUSTOMER);
  }, [editName, initialData]);
  const handleChange = (e) => {
    const { name: f, value } = e.target;
    setData((p) => ({ ...p, [f]: value }));
  };
  const isEdit = mode === "edit";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="dsr-modal-box"
        style={{
          background: DS.card,
          border: `1px solid ${DS.border}`,
          borderRadius: 14,
          padding: 20,
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow:
            "0 8px 16px rgba(0,0,0,0.5),0 32px 64px -16px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="dsr-edit-stripe"
          style={{
            background: isEdit
              ? "linear-gradient(135deg,#0E2A5A,#1A4E9E)"
              : "linear-gradient(135deg,#050E1D,#0A2A5A)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              {isEdit && <Icon name="edit" size={14} strokeWidth={2.1} />}
              {isEdit ? `Edit: ${editName}` : "New customer"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                marginTop: 2,
              }}
            >
              {isEdit
                ? "Master data update karo"
                : "Customer ka master data fill karo"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.10)",
              border: `1px solid rgba(255,255,255,0.15)`,
              width: 28,
              height: 28,
              borderRadius: 6,
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={14} strokeWidth={2.2} />
          </button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <FieldLabel required>Customer name</FieldLabel>
          <input
            className="dsr-input"
            style={IS}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
          />
        </div>
        <div
          className="dsr-grid2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 10,
          }}
        >
          <FormInput
            label="Area"
            required
            type="text"
            name="area"
            value={data.area}
            onChange={handleChange}
            placeholder="Area"
          />
          <FormSelect
            label="Distributor"
            required
            name="distributor"
            value={data.distributor}
            onChange={handleChange}
          >
            <option value="">Select</option>
            {DISTRIBUTOR_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </FormSelect>
        </div>
        <FormSelect
          label="Project stage"
          required
          name="stage"
          value={data.stage}
          onChange={handleChange}
        >
          <option value="">Select stage</option>
          {PROJECT_STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FormSelect>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: DS.text3,
            marginBottom: 10,
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Icon name="wallet" size={12} strokeWidth={2} /> Numbers (₹ Lakhs)
        </div>
        <div
          className="dsr-grid2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 10,
          }}
        >
          <FormInput
            label="Potential Dyes /mth"
            required
            type="number"
            name="potDyes"
            value={data.potDyes}
            onChange={handleChange}
            placeholder="0"
          />
          <FormInput
            label="Potential Aux /mth"
            required
            type="number"
            name="potAux"
            value={data.potAux}
            onChange={handleChange}
            placeholder="0"
          />
          <FormInput
            label="Existing Dyes /mth"
            type="number"
            name="exDyes"
            value={data.exDyes}
            onChange={handleChange}
            placeholder="0"
          />
          <FormInput
            label="Existing Aux /mth"
            type="number"
            name="exAux"
            value={data.exAux}
            onChange={handleChange}
            placeholder="0"
          />
          <div style={{ gridColumn: "1 / -1", marginBottom: 12 }}>
            <FieldLabel required>ABP AM26</FieldLabel>
            <input
              className="dsr-input"
              style={IS}
              type="number"
              name="abp"
              value={data.abp}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {isEdit && (
            <button
              onClick={() => onDelete(editName)}
              style={{
                height: 40,
                padding: "0 14px",
                background: "rgba(244,63,94,0.10)",
                color: DS.danger,
                border: "1px solid rgba(244,63,94,0.30)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                flexShrink: 0,
              }}
            >
              <Icon name="trash" size={13} strokeWidth={2} /> Delete
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 40,
              background: "rgba(255,255,255,0.04)",
              color: DS.text2,
              border: `1px solid ${DS.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            className="dsr-btn-primary"
            onClick={() => onSave(name.trim(), data)}
            disabled={saving}
            style={{
              flex: 2,
              height: 40,
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              color: "#06101E",
            }}
          >
            {saving ? (
              <span
                className="dsr-spinner"
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(0,0,0,0.2)",
                  borderTopColor: "#06101E",
                  margin: 0,
                }}
              />
            ) : (
              <Icon name="check" size={14} strokeWidth={2.3} />
            )}
            {saving ? "Saving…" : isEdit ? "Update customer" : "Save customer"}
          </button>
        </div>
      </div>
    </div>
  );
};

const RecordEditModal = ({
  record,
  customers,
  customerList,
  onSave,
  onClose,
  saving,
}) => {
  const [data, setData] = useState({
    date: record.date ? new Date(record.date).toISOString().slice(0, 10) : "",
    area: record.area || "",
    distributor: record.distributor || "",
    customer: record.customer || "",
    objective: record.objective || "",
    stage: record.stage || "",
    outcome: record.outcome || "",
    potDyes: record.potDyes ?? "",
    potAux: record.potAux ?? "",
    exDyes: record.exDyes ?? "",
    exAux: record.exAux ?? "",
    abp: record.abp ?? "",
    ytd: record.ytd ?? "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((p) => ({ ...p, [name]: value }));
  };
  const handleCustSel = (e) => {
    const val = e.target.value;
    if (customers[val]) {
      const c = customers[val];
      setData((p) => ({
        ...p,
        customer: val,
        area: c.area || "",
        distributor: c.distributor || "",
        stage: c.stage || "",
      }));
    } else setData((p) => ({ ...p, customer: val }));
  };
  const id = record._id || record.id;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="dsr-modal-box"
        style={{
          background: DS.card,
          border: `1px solid ${DS.border}`,
          borderRadius: 14,
          padding: 20,
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow:
            "0 8px 16px rgba(0,0,0,0.5),0 32px 64px -16px rgba(0,0,0,0.6)",
        }}
      >
        <div
          className="dsr-edit-stripe"
          style={{ background: "linear-gradient(135deg,#0E2A5A,#1A4E9E)" }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Icon name="edit" size={14} strokeWidth={2.1} /> Edit record
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                marginTop: 2,
              }}
            >
              {record.customer} · {fmtDate(record.date)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.10)",
              border: "1px solid rgba(255,255,255,0.15)",
              width: 28,
              height: 28,
              borderRadius: 6,
              cursor: "pointer",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="close" size={14} strokeWidth={2.2} />
          </button>
        </div>
        <div
          className="dsr-grid2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 10,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <FieldLabel required>Date</FieldLabel>
            <input
              className="dsr-input"
              style={IS}
              type="date"
              name="date"
              value={data.date}
              onChange={handleChange}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <FieldLabel required>Customer</FieldLabel>
            <CustomSelect
              name="customer"
              value={data.customer}
              onChange={handleCustSel}
              placeholder="Select customer"
            >
              <option value="">Select customer</option>
              {customerList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </CustomSelect>
          </div>
        </div>
        <div
          className="dsr-grid2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 10,
          }}
        >
          <FormInput
            label="Area"
            required
            type="text"
            name="area"
            value={data.area}
            onChange={handleChange}
            placeholder="Area"
          />
          <FormSelect
            label="Distributor"
            required
            name="distributor"
            value={data.distributor}
            onChange={handleChange}
          >
            <option value="">Select</option>
            {DISTRIBUTOR_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </FormSelect>
        </div>
        <FormInput
          label="Objective / Project description"
          type="text"
          name="objective"
          value={data.objective}
          onChange={handleChange}
          placeholder="Describe objective or project"
        />
        <FormSelect
          label="Project stage"
          name="stage"
          value={data.stage}
          onChange={handleChange}
        >
          <option value="">Select stage</option>
          {PROJECT_STAGE_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </FormSelect>
        <FormInput
          label="Visit outcome"
          type="text"
          name="outcome"
          value={data.outcome}
          onChange={handleChange}
          placeholder="e.g. Positive, Follow-up needed…"
        />
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: DS.text3,
            marginBottom: 10,
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <Icon name="wallet" size={12} strokeWidth={2} /> Numbers (₹ Lakhs)
        </div>
        <div
          className="dsr-grid2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 10,
          }}
        >
          <FormInput
            label="Potential Dyes /mth"
            type="number"
            name="potDyes"
            value={data.potDyes}
            onChange={handleChange}
            placeholder="0"
          />
          <FormInput
            label="Potential Aux /mth"
            type="number"
            name="potAux"
            value={data.potAux}
            onChange={handleChange}
            placeholder="0"
          />
          <FormInput
            label="Existing Dyes /mth"
            type="number"
            name="exDyes"
            value={data.exDyes}
            onChange={handleChange}
            placeholder="0"
          />
          <FormInput
            label="Existing Aux /mth"
            type="number"
            name="exAux"
            value={data.exAux}
            onChange={handleChange}
            placeholder="0"
          />
          <FormInput
            label="ABP AM26"
            type="number"
            name="abp"
            value={data.abp}
            onChange={handleChange}
            placeholder="0"
          />
          <FormInput
            label="YTD sale prev. mth"
            type="number"
            name="ytd"
            value={data.ytd}
            onChange={handleChange}
            placeholder="0"
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 40,
              background: "rgba(255,255,255,0.04)",
              color: DS.text2,
              border: `1px solid ${DS.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            className="dsr-btn-primary"
            onClick={() => onSave(id, data)}
            disabled={saving}
            style={{
              flex: 2,
              height: 40,
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              color: "#06101E",
            }}
          >
            {saving ? (
              <span
                className="dsr-spinner"
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(0,0,0,0.2)",
                  borderTopColor: "#06101E",
                  margin: 0,
                }}
              />
            ) : (
              <Icon name="check" size={14} strokeWidth={2.3} />
            )}
            {saving ? "Saving…" : "Update record"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
const DailySalesReport = () => {
  useEffect(() => {
    injectGlobalStyles();
  }, []);
  const [activeTab, setActiveTab] = useState("records");
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [newRecord, setNewRecord] = useState({ ...EMPTY_RECORD });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [modalMode, setModalMode] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [recordSaving, setRecordSaving] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [expandedAnalysisMonths, setExpandedAnalysisMonths] = useState({});
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/dsr/records");
      setRecords(res.data || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);
  const loadCustomers = useCallback(async () => {
    try {
      const res = await apiFetch("/api/dsr/customers");
      setCustomers(res.data || {});
    } catch (err) {
      showToast(err.message, "error");
    }
  }, []);
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const customerLastRecord = useMemo(() => {
    const map = {};
    for (const r of records) {
      if (r.customer && !map[r.customer]) map[r.customer] = r;
    }
    return map;
  }, [records]);

  const monthlyAnalysis = useMemo(() => {
    const map = {};
    for (const r of records) {
      if (!r.date) continue;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!map[key])
        map[key] = {
          key,
          label: d.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric",
          }),
          records: [],
        };
      map[key].records.push(r);
    }
    return Object.values(map)
      .sort((a, b) => (a.key < b.key ? 1 : -1))
      .map((m) => {
        const bc = {};
        m.records.forEach((r) => {
          if (!bc[r.customer]) bc[r.customer] = [];
          bc[r.customer].push(r);
        });
        const customerRows = Object.entries(bc)
          .map(([name, recs]) => {
            const sorted = [...recs].sort(
              (a, b) => new Date(b.date) - new Date(a.date),
            );
            return { name, visits: recs.length, latest: sorted[0] };
          })
          .sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));
        const totalPot = customerRows.reduce(
          (s, c) => s + toNum(c.latest.potDyes) + toNum(c.latest.potAux),
          0,
        );
        const avgPct = m.records.length
          ? m.records.reduce((s, r) => s + (r.pct || 0), 0) / m.records.length
          : 0;
        return {
          key: m.key,
          label: m.label,
          totalVisits: m.records.length,
          uniqueCustomers: customerRows.length,
          avgPct: avgPct.toFixed(1),
          totalPot: totalPot.toFixed(1),
          customerRows,
        };
      });
  }, [records]);

  const toggleAnalysisMonth = (key) =>
    setExpandedAnalysisMonths((p) => ({ ...p, [key]: !p[key] }));
  const selectedCustomerLastRecord = useMemo(() => {
    const name = newRecord.customer;
    if (!name || !customers[name]) return null;
    return customerLastRecord[name] || null;
  }, [newRecord.customer, customers, customerLastRecord]);
  const filteredByDate = useMemo(() => {
    if (activeFilter === "all") return records;
    if (activeFilter === "custom" && filterStart && filterEnd) {
      const s = new Date(filterStart);
      const e = new Date(filterEnd);
      e.setHours(23, 59, 59, 999);
      return records.filter((r) => inRange(r.date, s, e));
    }
    return records;
  }, [records, activeFilter, filterStart, filterEnd]);

  const uniqueLatestRecords = useMemo(() => {
    const seen = {};
    for (const r of filteredByDate) {
      if (!r.customer) continue;
      if (
        !seen[r.customer] ||
        new Date(r.date) > new Date(seen[r.customer].date)
      ) {
        seen[r.customer] = r;
      }
    }
    return Object.values(seen);
  }, [filteredByDate]);
  const filteredRecords = filteredByDate.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.customer.toLowerCase().includes(q) ||
      r.area.toLowerCase().includes(q) ||
      r.distributor.toLowerCase().includes(q) ||
      (r.objective && r.objective.toLowerCase().includes(q))
    );
  });
  const avgPct = filteredByDate.length
    ? (
        filteredByDate.reduce((s, r) => s + (r.pct || 0), 0) /
        filteredByDate.length
      ).toFixed(1)
    : "0.0";

    const totalPot = uniqueLatestRecords
      .reduce((s, r) => s + toNum(r.potDyes) + toNum(r.potAux), 0)
      .toFixed(1);

const totalYTD = uniqueLatestRecords
  .reduce((s, r) => s + toNum(r.ytd), 0)
  .toFixed(1);

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleRecordChange = (e) => {
    const { name, value } = e.target;
    setNewRecord((p) => ({ ...p, [name]: value }));
  };
  const handleCustomerSelect = (e) => {
    const val = e.target.value;
    if (val === "__add__") {
      setModalMode("add");
      setEditingCustomer(null);
      setNewRecord((p) => ({ ...p, customer: "" }));
      return;
    }
    if (customers[val]) {
      const c = customers[val];
      setNewRecord((p) => ({
        ...p,
        customer: val,
        area: c.area || "",
        distributor: c.distributor || "",
        stage: c.stage || "",
        potDyes: c.potDyes || "",
        potAux: c.potAux || "",
        exDyes: c.exDyes || "",
        exAux: c.exAux || "",
        abp: c.abp || "",
      }));
    } else setNewRecord((p) => ({ ...p, customer: val }));
  };

  const addRecord = async () => {
    const { date, area, distributor, customer } = newRecord;
    if (!date) {
      showToast("Date fill karo (required).", "error");
      return;
    }
    if (!area || !distributor || !customer) {
      showToast("Date, Area, Distributor aur Customer zaroori hain.", "error");
      return;
    }
    try {
      setLoading(true);
      const res = await apiFetch("/api/dsr/records", {
        method: "POST",
        body: JSON.stringify({
          date,
          area,
          distributor,
          customer,
          objective: newRecord.objective,
          stage: newRecord.stage,
          outcome: newRecord.outcome,
          potDyes: toNum(newRecord.potDyes),
          potAux: toNum(newRecord.potAux),
          exDyes: toNum(newRecord.exDyes),
          exAux: toNum(newRecord.exAux),
          abp: toNum(newRecord.abp),
          ytd: toNum(newRecord.ytd),
        }),
      });
      setRecords((p) => [res.data, ...p]);
      if (
        customers[customer] &&
        newRecord.stage &&
        newRecord.stage !== customers[customer].stage
      ) {
        const custId = customers[customer]._id;
        if (custId) {
          try {
            const cr = await apiFetch(`/api/dsr/customers/${custId}`, {
              method: "PUT",
              body: JSON.stringify({
                name: customer,
                area: customers[customer].area,
                distributor: customers[customer].distributor,
                stage: newRecord.stage,
                potDyes: customers[customer].potDyes,
                potAux: customers[customer].potAux,
                exDyes: customers[customer].exDyes,
                exAux: customers[customer].exAux,
                abp: customers[customer].abp,
              }),
            });
            setCustomers((p) => ({
              ...p,
              [customer]: { ...p[customer], stage: cr.data.stage },
            }));
          } catch {}
        }
      }
      setNewRecord({ ...EMPTY_RECORD });
      setActiveTab("records");
      showToast("Record save ho gaya!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm("Yeh record delete karein?")) return;
    try {
      await apiFetch(`/api/dsr/records/${id}`, { method: "DELETE" });
      setRecords((p) => p.filter((r) => (r._id || r.id) !== id));
      showToast("Record delete ho gaya.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };
  const updateRecord = async (id, data) => {
    if (!data.date || !data.area || !data.distributor || !data.customer) {
      showToast("Date, Area, Distributor aur Customer zaroori hain.", "error");
      return;
    }
    try {
      setRecordSaving(true);
      const res = await apiFetch(`/api/dsr/records/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          date: data.date,
          area: data.area,
          distributor: data.distributor,
          customer: data.customer,
          objective: data.objective,
          stage: data.stage,
          outcome: data.outcome,
          potDyes: toNum(data.potDyes),
          potAux: toNum(data.potAux),
          exDyes: toNum(data.exDyes),
          exAux: toNum(data.exAux),
          abp: toNum(data.abp),
          ytd: toNum(data.ytd),
        }),
      });
      setRecords((p) => p.map((r) => ((r._id || r.id) === id ? res.data : r)));
      showToast("Record update ho gaya!");
      setEditingRecord(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setRecordSaving(false);
    }
  };

  const NUMERIC_HEADERS = [
    "Potential Dyes (Rs L/mth)",
    "Potential Aux (Rs L/mth)",
    "Existing Dyes (Rs L/mth)",
    "Existing Aux (Rs L/mth)",
    "ABP AM26 (Rs L)",
    "YTD Sale Prev Mth (Rs L)",
    "YTD vs ABP %",
  ];
  const HS = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    fill: { fgColor: { rgb: "040C18" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
    border: { bottom: { style: "thin", color: { rgb: "00C8B4" } } },
  };
  const NS = {
    alignment: { horizontal: "center", vertical: "center" },
    font: { sz: 11 },
  };
  const TS = {
    alignment: { horizontal: "left", vertical: "center" },
    font: { sz: 11 },
  };
  const doExport = (toExport, label = "All") => {
    const sorted = [...toExport].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    const ed = sorted.map((r) => ({
      Date: r.date
        ? new Date(r.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "",
      Area: r.area,
      Distributor: r.distributor,
      Customer: r.customer,
      Objective: r.objective,
      "Project Stage": r.stage,
      "Visit Outcome": r.outcome,
      "Potential Dyes (Rs L/mth)": toNum(r.potDyes),
      "Potential Aux (Rs L/mth)": toNum(r.potAux),
      "Existing Dyes (Rs L/mth)": toNum(r.exDyes),
      "Existing Aux (Rs L/mth)": toNum(r.exAux),
      "ABP AM26 (Rs L)": toNum(r.abp),
      "YTD Sale Prev Mth (Rs L)": toNum(r.ytd),
      "YTD vs ABP %": r.pct || 0,
    }));
    if (!ed.length) {
      showToast("Is range mein koi record nahi hai.", "error");
      return;
    }
    const ck = Object.keys(ed[0]);
    const ns = new Set(NUMERIC_HEADERS);
    const ws = {};
    ck.forEach((k, C) => {
      ws[XLSX.utils.encode_cell({ r: 0, c: C })] = { v: k, t: "s", s: HS };
    });
    ed.forEach((row, ri) => {
      ck.forEach((k, C) => {
        const v = row[k];
        const in_ = ns.has(k);
        ws[XLSX.utils.encode_cell({ r: ri + 1, c: C })] = {
          v,
          t: in_ ? "n" : "s",
          s: in_ ? NS : TS,
        };
      });
    });
    ws["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: ed.length, c: ck.length - 1 },
    });
    ws["!cols"] = [
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 24 },
      { wch: 36 },
      { wch: 30 },
      { wch: 36 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
    ];
    ws["!rows"] = [{ hpt: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DSR Records");
    const fn = `DSR_${label.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const blob = new Blob(
      [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fn;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast(`Excel download ho raha hai! (${ed.length} records)`);
  };

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setModalMode("add");
  };
  const openEditCustomer = (name) => {
    setEditingCustomer(name);
    setModalMode("edit");
  };
  const closeModal = () => {
    setModalMode(null);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (name, data) => {
    if (!name) {
      showToast("Customer naam daalo.", "error");
      return;
    }
    if (!data.area) {
      showToast("Area daalo.", "error");
      return;
    }
    if (!data.distributor) {
      showToast("Distributor select karo.", "error");
      return;
    }
    if (!data.stage) {
      showToast("Project stage select karo.", "error");
      return;
    }
    if (
      data.potDyes === "" ||
      data.potDyes === null ||
      data.potDyes === undefined
    ) {
      showToast("Potential Dyes /mth daalo (required).", "error");
      return;
    }
    if (
      data.potAux === "" ||
      data.potAux === null ||
      data.potAux === undefined
    ) {
      showToast("Potential Aux /mth daalo (required).", "error");
      return;
    }
    if (data.abp === "" || data.abp === null || data.abp === undefined) {
      showToast("ABP AM26 daalo (required).", "error");
      return;
    }
    const payload = {
      name,
      area: data.area,
      distributor: data.distributor,
      stage: data.stage,
      potDyes: toNum(data.potDyes),
      potAux: toNum(data.potAux),
      exDyes: toNum(data.exDyes),
      exAux: toNum(data.exAux),
      abp: toNum(data.abp),
    };
    try {
      setModalSaving(true);
      if (modalMode === "edit") {
        const nc = name !== editingCustomer;
        const oid = customers[editingCustomer]?._id;
        if (!oid) {
          showToast("Customer ID nahi mila.", "error");
          return;
        }
        const res = await apiFetch(`/api/dsr/customers/${oid}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        const up = res.data;
        setCustomers((p) => {
          const n = { ...p };
          if (nc) delete n[editingCustomer];
          n[up.name] = {
            _id: up._id,
            area: up.area,
            distributor: up.distributor,
            stage: up.stage,
            potDyes: up.potDyes,
            potAux: up.potAux,
            exDyes: up.exDyes,
            exAux: up.exAux,
            abp: up.abp,
          };
          return n;
        });
        showToast(
          nc
            ? `Naam update: ${editingCustomer} → ${up.name}`
            : `${name} update ho gaya!`,
        );
      } else {
        const res = await apiFetch("/api/dsr/customers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const nc2 = res.data;
        setCustomers((p) => ({ ...p, ...nc2 }));
        const cd = nc2[name];
        if (cd)
          setNewRecord((p) => ({
            ...p,
            customer: name,
            area: cd.area,
            distributor: cd.distributor,
            stage: cd.stage,
            potDyes: cd.potDyes,
            potAux: cd.potAux,
            exDyes: cd.exDyes,
            exAux: cd.exAux,
            abp: cd.abp,
          }));
        showToast(`${name} add ho gaya!`);
      }
      closeModal();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteCustomer = async (name) => {
    if (!window.confirm(`"${name}" ko delete karein?`)) return;
    const id = customers[name]?._id;
    if (!id) {
      showToast("Customer ID nahi mila.", "error");
      return;
    }
    try {
      await apiFetch(`/api/dsr/customers/${id}`, { method: "DELETE" });
      setCustomers((p) => {
        const n = { ...p };
        delete n[name];
        return n;
      });
      if (newRecord.customer === name) setNewRecord({ ...EMPTY_RECORD });
      showToast(`${name} delete ho gaya.`);
      closeModal();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleImportDone = (imported) => {
    setCustomers((p) => ({ ...p, ...imported }));
    const c = Object.keys(imported).length;
    showToast(`${c} customer${c !== 1 ? "s" : ""} import ho gaye!`);
    setShowImporter(false);
  };
  const customerList = Object.keys(customers).sort();
  const lr = selectedCustomerLastRecord;
  const FILTER_CHIPS = [{ id: "all", label: "All", count: records.length }];

  return (
    <div
      className="dsr-layout"
      style={{
        background: DS.bg,
        fontFamily:
          "'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        color: DS.text1,
        backgroundImage: `radial-gradient(ellipse at 20% 10%,rgba(0,200,180,0.04) 0%,transparent 50%),radial-gradient(ellipse at 80% 90%,rgba(59,130,246,0.03) 0%,transparent 50%)`,
      }}
    >
      <Toast msg={toast.msg} type={toast.type} />
      <Sidebar
        active={activeTab}
        onChange={setActiveTab}
        recordCount={records.length}
      />
      <div
        className="dsr-main"
        style={{
          padding: "16px 16px 80px",
          maxWidth: 520,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          className="dsr-header"
          style={{
            background:
              "linear-gradient(155deg,#040D1C 0%,#092040 55%,#0B2E5A 100%)",
            borderRadius: 16,
            padding: "18px 20px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.4),0 16px 32px -14px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.06)",
            position: "relative",
            overflow: "hidden",
            border: `1px solid ${DS.border}`,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: -70,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(0,200,180,0.18),transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: -40,
              left: -20,
              width: 140,
              height: 140,
              borderRadius: "50%",
              background:
                "radial-gradient(circle,rgba(59,130,246,0.08),transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: DS.primary,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: 3,
              }}
            >
              Field Sales · DSR
            </div>
            <h1
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: DS.text1,
                margin: 0,
                letterSpacing: "-0.01em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Daily Sales Report
            </h1>
            <p
              style={{
                fontSize: 11,
                color: DS.text2,
                marginTop: 3,
                marginBottom: 0,
                fontWeight: 500,
              }}
            >
              Customer data management
            </p>
          </div>
          <button
            className="dsr-topbar-btn"
            onClick={() => setActiveTab("records")}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${DS.border}`,
              background:
                activeTab === "records"
                  ? "rgba(0,200,180,0.20)"
                  : "rgba(255,255,255,0.06)",
              color: activeTab === "records" ? DS.primary : DS.text1,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backdropFilter: "blur(4px)",
            }}
          >
            <Icon name="home" size={17} strokeWidth={2} />
          </button>
        </div>

        <div
          className="dsr-metrics-row"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <MetricCard
            label={
              activeFilter === "all"
                ? "Total records"
                : `Records (${FILTER_CHIPS.find((f) => f.id === activeFilter)?.label || "filtered"})`
            }
            value={filteredByDate.length}
            sub={today}
            accent={DS.info}
          />
          <MetricCard
            label="Avg. YTD vs ABP"
            value={`${avgPct}%`}
            sub="filtered period"
            accent={DS.primary}
          />
          <MetricCard
            label="Total Potential"
            value={`₹${totalPot}L`}
            sub="dyes + aux /mth"
            accent={DS.gold}
          />
          <MetricCard
            label="YTD Sales"
            value={`₹${totalYTD}L`}
            sub="prev. month total"
            accent={DS.purple}
          />
        </div>

        {activeTab === "records" && (
          <>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginBottom: 12,
                overflowX: "auto",
                paddingBottom: 4,
              }}
            >
              {FILTER_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  className={`dsr-filter-chip${activeFilter === chip.id ? " active" : ""}`}
                  onClick={() => setActiveFilter(chip.id)}
                >
                  {chip.label}
                  <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 400 }}>
                    ({chip.count})
                  </span>
                </button>
              ))}
              <button
                className={`dsr-filter-chip${activeFilter === "custom" ? " active" : ""}`}
                onClick={() => setActiveFilter("custom")}
              >
                <Icon name="calendar" size={12} strokeWidth={2} /> Custom
              </button>
            </div>
            {activeFilter === "custom" && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 12,
                  alignItems: "center",
                  background: "rgba(0,200,180,0.06)",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(0,200,180,0.18)",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: DS.primary,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  From
                </span>
                <input
                  type="date"
                  value={filterStart}
                  onChange={(e) => setFilterStart(e.target.value)}
                  className="dsr-input"
                  style={{ ...IS, height: 34, flex: 1 }}
                />
                <span
                  style={{ fontSize: 11, color: DS.primary, fontWeight: 600 }}
                >
                  To
                </span>
                <input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="dsr-input"
                  style={{ ...IS, height: 34, flex: 1 }}
                />
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 8,
                marginBottom: 14,
                alignItems: "center",
              }}
            >
              <div style={{ flex: 1, position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 11,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: DS.text3,
                    display: "flex",
                  }}
                >
                  <Icon name="search" size={15} strokeWidth={2} />
                </span>
                <input
                  type="text"
                  placeholder="Search customer, area, distributor…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dsr-input"
                  style={{ ...IS, paddingLeft: 34 }}
                />
              </div>
              <ExportDropdown records={filteredByDate} onExport={doExport} />
            </div>
            {(activeFilter !== "all" || searchQuery) && (
              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 12, color: DS.text2 }}>Showing</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: DS.primary,
                    background: DS.primaryDim,
                    padding: "2px 10px",
                    borderRadius: 20,
                    border: "1px solid rgba(0,200,180,0.2)",
                  }}
                >
                  {filteredRecords.length} records
                </span>
                {activeFilter !== "all" && (
                  <button
                    onClick={() => setActiveFilter("all")}
                    style={{
                      fontSize: 11,
                      color: DS.text2,
                      background: "transparent",
                      border: `1px solid ${DS.border}`,
                      borderRadius: 20,
                      padding: "2px 8px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    <Icon name="close" size={10} strokeWidth={2.3} /> Clear
                  </button>
                )}
              </div>
            )}
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "56px 16px",
                  color: DS.text2,
                }}
              >
                <div className="dsr-spinner" />
                <div style={{ fontSize: 13, fontWeight: 500 }}>
                  Loading records…
                </div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "56px 16px",
                  color: DS.text2,
                }}
              >
                <div className="dsr-empty-icon">
                  <Icon
                    name="inbox"
                    size={26}
                    strokeWidth={1.6}
                    style={{ color: DS.primary }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: DS.text1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  No records found
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: DS.text2 }}>
                  Try a different filter or search
                </div>
              </div>
            ) : (
              <div
                className="dsr-card-list"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {filteredRecords.map((r) => (
                  <RecordCard
                    key={r._id || r.id}
                    record={r}
                    onDelete={deleteRecord}
                    onEdit={setEditingRecord}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "add" && (
          <>
            <CustomerLastRecord record={selectedCustomerLastRecord} />
            <SectionCard
              title={
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="calendar" size={12} strokeWidth={2} /> Visit
                  details
                </span>
              }
            >
              <div
                className="dsr-grid2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <FieldLabel required>Date</FieldLabel>
                  <input
                    className="dsr-input"
                    style={{
                      ...IS,
                      borderColor: !newRecord.date ? DS.amber : DS.border,
                      background: !newRecord.date
                        ? "rgba(245,158,11,0.06)"
                        : "rgba(255,255,255,0.04)",
                    }}
                    type="date"
                    name="date"
                    value={newRecord.date}
                    onChange={handleRecordChange}
                  />
                  {!newRecord.date && (
                    <div
                      style={{
                        fontSize: 10,
                        color: DS.amber,
                        marginTop: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon name="calendar" size={11} strokeWidth={2} />
                      <span>Date manually select karo</span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <FieldLabel required>Customer</FieldLabel>
                  <CustomSelect
                    name="customer"
                    value={newRecord.customer}
                    onChange={handleCustomerSelect}
                    placeholder="Select customer"
                  >
                    <option value="">Select customer</option>
                    {customerList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__add__">＋ Add new customer</option>
                  </CustomSelect>
                </div>
              </div>
              <div
                className="dsr-grid2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <FormInput
                  label="Area"
                  required
                  type="text"
                  name="area"
                  value={newRecord.area}
                  onChange={handleRecordChange}
                  placeholder="Delhi, Gurgaon…"
                  readOnly={
                    !!(newRecord.customer && customers[newRecord.customer])
                  }
                />
                <FormSelect
                  label="Distributor"
                  required
                  name="distributor"
                  value={newRecord.distributor}
                  onChange={handleRecordChange}
                  disabled={
                    !!(newRecord.customer && customers[newRecord.customer])
                  }
                >
                  <option value="">Select</option>
                  {DISTRIBUTOR_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </FormSelect>
              </div>
              <div style={{ marginBottom: 12 }}>
                <FieldLabel keyBadge>
                  Objective / Project description
                </FieldLabel>
                <input
                  className="dsr-input dsr-input-highlight"
                  style={IH}
                  type="text"
                  name="objective"
                  value={newRecord.objective}
                  onChange={handleRecordChange}
                  placeholder="Describe objective or project"
                />
                {lr?.objective && (
                  <LastHint
                    value={lr.objective}
                    onUse={(v) => setNewRecord((p) => ({ ...p, objective: v }))}
                  />
                )}
              </div>
              <FormSelect
                label="Project stage"
                keyBadge
                highlight
                name="stage"
                value={newRecord.stage}
                onChange={handleRecordChange}
              >
                <option value="">Select stage</option>
                {PROJECT_STAGE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </FormSelect>
              <div style={{ marginBottom: 12 }}>
                <FieldLabel keyBadge>Visit outcome</FieldLabel>
                <input
                  className="dsr-input dsr-input-highlight"
                  style={IH}
                  type="text"
                  name="outcome"
                  value={newRecord.outcome}
                  onChange={handleRecordChange}
                  placeholder="e.g. Positive, Follow-up needed…"
                />
                {lr?.outcome && (
                  <LastHint
                    value={lr.outcome}
                    onUse={(v) => setNewRecord((p) => ({ ...p, outcome: v }))}
                  />
                )}
              </div>
            </SectionCard>
            <SectionCard
              title={
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="wallet" size={12} strokeWidth={2} /> Numbers (₹
                  Lakhs)
                </span>
              }
            >
              <div
                className="dsr-grid2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <FormInput
                  label="Potential Dyes /mth"
                  type="number"
                  name="potDyes"
                  value={newRecord.potDyes}
                  onChange={handleRecordChange}
                  placeholder="0"
                />
                <FormInput
                  label="Potential Aux /mth"
                  type="number"
                  name="potAux"
                  value={newRecord.potAux}
                  onChange={handleRecordChange}
                  placeholder="0"
                />
                <FormInput
                  label="Existing Dyes /mth"
                  type="number"
                  name="exDyes"
                  value={newRecord.exDyes}
                  onChange={handleRecordChange}
                  placeholder="0"
                />
                <FormInput
                  label="Existing Aux /mth"
                  type="number"
                  name="exAux"
                  value={newRecord.exAux}
                  onChange={handleRecordChange}
                  placeholder="0"
                />
                <FormInput
                  label="ABP AM26"
                  type="number"
                  name="abp"
                  value={newRecord.abp}
                  onChange={handleRecordChange}
                  placeholder="0"
                />
                <div style={{ marginBottom: 12 }}>
                  <FieldLabel keyBadge>YTD sale prev. mth</FieldLabel>
                  <input
                    className="dsr-input dsr-input-highlight"
                    style={IH}
                    type="number"
                    name="ytd"
                    value={newRecord.ytd}
                    onChange={handleRecordChange}
                    placeholder="0"
                  />
                  {lr && lr.ytd !== undefined && lr.ytd !== 0 && (
                    <LastHint
                      value={`₹${lr.ytd}L`}
                      onUse={() =>
                        setNewRecord((p) => ({ ...p, ytd: String(lr.ytd) }))
                      }
                    />
                  )}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: DS.info,
                  background: "rgba(59,130,246,0.07)",
                  padding: "9px 12px",
                  borderRadius: 8,
                  marginTop: 4,
                  lineHeight: 1.5,
                  borderLeft: `3px solid ${DS.info}`,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 7,
                }}
              >
                <Icon
                  name="lightbulb"
                  size={13}
                  strokeWidth={2}
                  style={{ marginTop: 1, color: DS.info }}
                />
                <span>
                  Saved customer select karoge toh fields auto-fill ho jaayenge.
                </span>
              </div>
            </SectionCard>
            <button
              className="dsr-btn-primary"
              onClick={addRecord}
              disabled={loading}
              style={{
                width: "100%",
                height: 46,
                border: "none",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.01em",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 12,
                color: "#06101E",
              }}
            >
              {loading ? (
                <span
                  className="dsr-spinner"
                  style={{
                    width: 15,
                    height: 15,
                    border: "2px solid rgba(0,0,0,0.2)",
                    borderTopColor: "#06101E",
                    margin: 0,
                  }}
                />
              ) : (
                <Icon name="addRecord" size={16} strokeWidth={2.1} />
              )}
              {loading ? "Saving…" : "Save record"}
            </button>
          </>
        )}

        {activeTab === "customers" && (
          <SectionCard>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: DS.text1,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Icon name="store" size={15} strokeWidth={2} /> Customer Master{" "}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: DS.text2,
                    marginLeft: 8,
                  }}
                >
                  {customerList.length} total
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="ei-import-btn"
                  onClick={() => setShowImporter(true)}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    background: "#10B981",
                    color: "#06101E",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
                  }}
                >
                  <Icon name="upload" size={13} strokeWidth={2.1} /> Excel
                  Import
                </button>
                <button
                  onClick={openAddCustomer}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    background: "rgba(0,200,180,0.10)",
                    color: DS.primary,
                    border: "1px solid rgba(0,200,180,0.25)",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="addRecord" size={13} strokeWidth={2} /> Add
                </button>
              </div>
            </div>
            {customerList.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 16px",
                  color: DS.text2,
                }}
              >
                <div className="dsr-empty-icon">
                  <Icon
                    name="store"
                    size={26}
                    strokeWidth={1.6}
                    style={{ color: DS.primary }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: DS.text1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  No customers yet
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: DS.text2 }}>
                  Excel Import ya manual Add karo
                </div>
              </div>
            ) : (
              customerList.map((name) => {
                const c = customers[name];
                const lastR = customerLastRecord[name];
                return (
                  <div
                    key={name}
                    className="dsr-customer-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 8px",
                      borderRadius: 8,
                      borderBottom: `1px solid ${DS.border}`,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "rgba(59,130,246,0.12)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: DS.info,
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: DS.text1,
                        }}
                      >
                        {name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: DS.text2, marginTop: 1 }}
                      >
                        {c.area} · {c.distributor}
                        {lastR && (
                          <span style={{ marginLeft: 5, color: DS.text3 }}>
                            · {fmtDate(lastR.date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <StageLadder stage={c.stage} size="sm" />
                    </div>
                    <div className="dsr-row-actions">
                      <button
                        className="dsr-btn-edit"
                        onClick={() => openEditCustomer(name)}
                        style={{
                          height: 30,
                          width: 30,
                          borderRadius: 6,
                          border: "1px solid rgba(59,130,246,0.25)",
                          background: "transparent",
                          color: DS.info,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="edit" size={13} strokeWidth={2} />
                      </button>
                      <button
                        className="dsr-btn-danger"
                        onClick={() => handleDeleteCustomer(name)}
                        style={{
                          height: 30,
                          width: 30,
                          borderRadius: 6,
                          border: "1px solid rgba(244,63,94,0.25)",
                          background: "transparent",
                          color: DS.danger,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon name="trash" size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </SectionCard>
        )}

        {activeTab === "analysis" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: DS.text1,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Icon name="trending" size={15} strokeWidth={2} /> Monthly Visit
                Analysis
              </div>
              <div style={{ fontSize: 11, color: DS.text2 }}>
                {monthlyAnalysis.length} month
                {monthlyAnalysis.length !== 1 ? "s" : ""} tracked
              </div>
            </div>
            {monthlyAnalysis.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "56px 16px",
                  color: DS.text2,
                }}
              >
                <div className="dsr-empty-icon">
                  <Icon
                    name="trending"
                    size={26}
                    strokeWidth={1.6}
                    style={{ color: DS.primary }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 14.5,
                    fontWeight: 700,
                    color: DS.text1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Koi data nahi hai
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: DS.text2 }}>
                  Records add karo, monthly analysis yahan dikhega
                </div>
              </div>
            ) : (
              <div
                className="dsr-card-list"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {monthlyAnalysis.map((m, idx) => {
                  const prev = monthlyAnalysis[idx + 1];
                  const delta = prev ? m.totalVisits - prev.totalVisits : null;
                  const isExp =
                    expandedAnalysisMonths[m.key] !== undefined
                      ? expandedAnalysisMonths[m.key]
                      : idx === 0;
                  return (
                    <MonthAnalysisCard
                      key={m.key}
                      month={m}
                      delta={delta}
                      expanded={isExp}
                      onToggle={() => toggleAnalysisMonth(m.key)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <MobileTabBar
        active={activeTab}
        onChange={setActiveTab}
        recordCount={records.length}
      />

      {modalMode && (
        <CustomerModal
          mode={modalMode}
          editName={editingCustomer}
          initialData={
            modalMode === "edit" &&
            editingCustomer &&
            customers[editingCustomer]
              ? {
                  area: customers[editingCustomer].area || "",
                  distributor: customers[editingCustomer].distributor || "",
                  stage: customers[editingCustomer].stage || "",
                  potDyes: customers[editingCustomer].potDyes ?? "",
                  potAux: customers[editingCustomer].potAux ?? "",
                  exDyes: customers[editingCustomer].exDyes ?? "",
                  exAux: customers[editingCustomer].exAux ?? "",
                  abp: customers[editingCustomer].abp ?? "",
                }
              : EMPTY_CUSTOMER
          }
          onSave={handleSaveCustomer}
          onDelete={handleDeleteCustomer}
          onClose={closeModal}
          saving={modalSaving}
        />
      )}
      {showImporter && (
        <ExcelImporter
          existingCustomers={customers}
          onImportDone={handleImportDone}
          onClose={() => setShowImporter(false)}
          apiBase={API}
          getToken={getToken}
        />
      )}
      {editingRecord && (
        <RecordEditModal
          record={editingRecord}
          customers={customers}
          customerList={customerList}
          onSave={updateRecord}
          onClose={() => setEditingRecord(null)}
          saving={recordSaving}
        />
      )}
    </div>
  );
};

export default DailySalesReport;
