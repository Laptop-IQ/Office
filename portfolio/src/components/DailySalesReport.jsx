import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import { XLSX } from "@/lib/xlsx";
import { useNavigate, useLocation } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

const DS = {
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
  A: {
    bg: "var(--st-A-bg)",
    text: "var(--st-A-text)",
    border: "var(--ds-primary)",
  },
  B: {
    bg: "var(--st-B-bg)",
    text: "var(--st-B-text)",
    border: "var(--ds-primary)",
  },
  C: {
    bg: "var(--st-C-bg)",
    text: "var(--st-C-text)",
    border: "var(--ds-primary)",
  },
  D: {
    bg: "var(--st-D-bg)",
    text: "var(--st-D-text)",
    border: "var(--ds-primary)",
  },
  E: {
    bg: "var(--st-E-bg)",
    text: "var(--st-E-text)",
    border: "var(--ds-primary)",
  },
  F: {
    bg: "var(--st-F-bg)",
    text: "var(--st-F-text)",
    border: "var(--ds-primary)",
  },
  G: {
    bg: "var(--st-G-bg)",
    text: "var(--st-G-text)",
    border: "var(--ds-primary)",
  },
  H: {
    bg: "var(--st-H-bg)",
    text: "var(--st-H-text)",
    border: "var(--ds-success)",
  },
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
                  ? `0 0 7px color-mix(in srgb, ${sc.border} 73.3%, transparent), 0 0 2px ${sc.border}`
                  : "none",
            }}
          />
        ))}
      </div>
      <span
        style={{
          fontSize: size === "sm" ? 9 : 10,
          fontWeight: 600,
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
    case "phone":
      return (
        <svg {...c}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...c}>
          <path d="M20 11.5a8 8 0 01-11.8 7L4 20l1.6-4.1A8 8 0 1120 11.5z" />
          <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-.8.8a3.5 3.5 0 01-1.5-1.5l.8-.8-1-2L9 9.5z" />
        </svg>
      );
    case "mail":
      return (
        <svg {...c}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
        </svg>
      );
    case "user":
      return (
        <svg {...c}>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M5 20v-1a5 5 0 015-5h4a5 5 0 015 5v1" />
        </svg>
      );
    case "copy":
      return (
        <svg {...c}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V6a2 2 0 012-2h9" />
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
  contactPerson: "",
  designation: "",
  mobile: "",
  altMobile: "",
  email: "",
  address: "",
  gstin: "",
  notes: "",
};
const CONTACT_FIELDS = [
  "contactPerson",
  "designation",
  "mobile",
  "altMobile",
  "email",
  "address",
  "gstin",
  "notes",
];
const pickContact = (o) =>
  Object.fromEntries(CONTACT_FIELDS.map((k) => [k, o?.[k] ?? ""]));
// "+91 98765 43210" -> "9876543210"
const cleanMobile = (v) =>
  String(v ?? "")
    .replace(/\D/g, "")
    .replace(/^(91|0)(?=\d{10}$)/, "")
    .slice(0, 10);
const isValidMobile = (v) => /^[6-9]\d{9}$/.test(v || "");
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
const isValidGSTIN = (v) =>
  /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v || "");
const fmtMobile = (v) => (v ? `+91 ${v.slice(0, 5)} ${v.slice(5)}` : "");
const DESIGNATION_SUGGESTIONS = [
  "Owner",
  "Partner",
  "Director",
  "Manager",
  "Purchase Manager",
  "Dyeing Master",
  "Production Head",
  "Accountant",
];
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
const inRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

const injectGlobalStyles = () => {
  if (document.getElementById("dsr-global-styles")) return;
  const style = document.createElement("style");
  style.id = "dsr-global-styles";
  if (!document.getElementById("dsr-fonts")) {
    // non-render-blocking font stylesheet (was a CSS @import)
    const fl = document.createElement("link");
    fl.id = "dsr-fonts";
    fl.rel = "stylesheet";
    fl.href =
      "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap";
    document.head.appendChild(fl);
  }
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    .dsr-layout, .dsr-layout input, .dsr-layout select, .dsr-layout button, .dsr-layout textarea,
    .dsr-pages, .dsr-pages input, .dsr-pages select, .dsr-pages button, .dsr-pages textarea {
      font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .dsr-mono { font-family: 'Geist Mono',ui-monospace,SFMono-Regular,Menlo,monospace; font-feature-settings:"tnum" 1,"zero" 1; letter-spacing:-0.01em; }
    .dsr-layout ::selection { background:rgba(212,175,106,0.28); color:var(--ds-text1); }
    .dsr-layout button:focus-visible,.dsr-layout input:focus-visible,.dsr-layout select:focus-visible { outline:2px solid var(--ds-primary); outline-offset:2px; border-radius:6px; }
    @media(prefers-reduced-motion:reduce){.dsr-layout *,.dsr-layout *::before,.dsr-layout *::after{animation-duration:0.001ms!important;transition-duration:0.001ms!important;}}

    .dsr-display { font-family:'Geist',-apple-system,sans-serif!important; letter-spacing:-0.01em; font-weight:500; }
    .dsr-pages ::selection { background:rgba(212,175,106,0.30); color:var(--ds-text1); }
    .dsr-pages button:focus-visible,.dsr-pages input:focus-visible,.dsr-pages select:focus-visible { outline:2px solid var(--ds-primary); outline-offset:2px; border-radius:6px; }
        .dsr-half-card { transition:border-color .2s,box-shadow .2s,transform .2s; }
    .dsr-half-card:hover { border-color:var(--ds-borderHi)!important; }
    .dsr-half-open { font-size:12px; font-weight:700; color:var(--ds-primary); opacity:0; transform:translateX(-4px); transition:opacity .2s,transform .2s; white-space:nowrap; }
    .dsr-half-card:hover .dsr-half-open, .dsr-half-card:focus-within .dsr-half-open { opacity:1; transform:none; }
    @media(max-width:767px){ .dsr-half-open{opacity:1;transform:none;} }
    @media(max-width:640px){ .dsr-home-text{display:none;} }
    .dsr-home-link:hover { background:var(--ds-surface)!important; }
    .dsr-gold-rule { height:1px; border:0; background:var(--ds-border); margin:0; }
    .dsr-glass { background:var(--ds-glass-bg)!important; border:1px solid var(--ds-glass-border)!important; box-shadow:var(--ds-shadow-glass)!important; }
    .dsr-pagebar { position:sticky; top:0; z-index:60; background:var(--ds-pagebar); border-bottom:1px solid var(--ds-glass-border); }
    .dsr-back-btn { display:inline-flex; align-items:center; gap:7px; height:36px; padding:0 14px 0 10px; border-radius:8px; border:1px solid var(--ds-border); background:transparent; color:var(--ds-text2); font-size:13px; font-weight:500; cursor:pointer; transition:background .15s,color .15s; }
    .dsr-back-btn:hover { background:var(--ds-surface); color:var(--ds-text1); }
    .dsr-page-enter { animation:dsr-page-in .3s cubic-bezier(0.16,1,0.3,1) both; }
    @keyframes dsr-page-in { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }
    .dsr-page-grid { display:grid; grid-template-columns:minmax(0,1fr); gap:20px; align-items:start; }
    .dsr-stat-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .dsr-bar-row { cursor:pointer; border-radius:10px; padding:7px 9px 8px; margin:0 -9px 4px; transition:background .15s; }
    .dsr-bar-row:hover { background:var(--ds-surface); }
    .dsr-bar-row:focus-visible { outline:2px solid var(--ds-primary); outline-offset:1px; }
    .dsr-viewall { display:inline-flex; align-items:center; gap:4px; height:24px; padding:0 9px; border-radius:999px; border:1px solid var(--ds-border); background:transparent; color:var(--ds-text2); font-size:12px; font-weight:500; cursor:pointer; transition:background .15s,border-color .15s; }
    .dsr-viewall:hover { background:var(--ds-surface); color:var(--ds-text1); }
    .dsr-seg { display:flex; gap:4px; padding:4px; border-radius:12px; background:var(--ds-surface); border:1px solid var(--ds-border); margin-bottom:14px; }
    .dsr-seg button { flex:1; display:inline-flex; align-items:center; justify-content:center; gap:5px; height:30px; border:0; border-radius:9px; background:transparent; color:var(--ds-text2); font-weight:600; font-size:12px; font-family:inherit; cursor:pointer; transition:background .15s,color .15s; }
    .dsr-seg button:hover { color:var(--ds-text1); }
    .dsr-seg button.active { background:var(--ds-card); color:var(--ds-primary); box-shadow:var(--ds-shadow-card-sm); }
    .dsr-rank-row { text-align:left; width:100%; min-width:0; box-sizing:border-box; padding:10px 12px; border-radius:12px; border:1px solid transparent; background:transparent; color:var(--ds-text1); font-family:inherit; cursor:pointer; transition:background .15s,border-color .15s; }
    .dsr-rank-row:hover { background:var(--ds-surface); }
    .dsr-rank-row.on { background:var(--ds-card); border-color:var(--ds-primary); box-shadow:var(--ds-shadow-card-sm); }
    .dsr-rank-top { display:flex; justify-content:space-between; gap:8px; font-size:12px; font-weight:600; margin-bottom:6px; }
    .dsr-rank-name { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dsr-rank-bar { height:5px; border-radius:4px; background:var(--ds-border); overflow:hidden; }
    .dsr-rank-bar > div { height:100%; border-radius:4px; transition:width .5s cubic-bezier(0.16,1,0.3,1); }
    .dsr-rank-sub { font-size:12px; color:var(--ds-text3); margin-top:6px; }
    .dsr-trend { display:flex; align-items:flex-end; gap:3px; height:120px; }
    .dsr-trend-col { flex:1; min-width:0; height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; gap:4px; font-size:12px; color:var(--ds-text3); }
    .dsr-trend-col > div { width:100%; border-radius:4px 4px 2px 2px; }
    .dsr-trend-bar { background:var(--ds-borderHi); transition:height .4s cubic-bezier(0.16,1,0.3,1); }
    .dsr-trend-col.peak .dsr-trend-bar { background:var(--ds-primary); }
    .dsr-trend-col span { height:11px; line-height:11px; }
    .dsr-mini-row { display:flex; justify-content:space-between; align-items:center; gap:10px; width:100%; padding:8px 10px; margin-bottom:4px; border:1px solid var(--ds-border); border-radius:10px; background:var(--ds-surface); color:var(--ds-text1); font-weight:600; font-size:12px; font-family:inherit; cursor:pointer; text-align:left; transition:border-color .15s; }
    .dsr-mini-row:hover { border-color:var(--ds-borderHi); }
    .dsr-itable-wrap { overflow-x:auto; border:1px solid var(--ds-border); border-radius:12px; }
    .dsr-itable { min-width:680px; }
    .dsr-irow { display:grid; grid-template-columns:minmax(170px,2.2fr) 60px 70px 90px 120px 100px; gap:10px; align-items:center; padding:10px 14px; border-bottom:1px solid var(--ds-border); font-size:12.5px; }
    .dsr-irow:last-child { border-bottom:0; }
    .dsr-irow:not(.head):hover { background:var(--ds-surface); }
    .dsr-irow.head { position:sticky; top:0; font-size:12px; font-weight:500; color:var(--ds-text3); background:var(--ds-surface); }
    .dsr-link { display:flex; flex-direction:column; gap:2px; align-items:flex-start; background:none; border:0; padding:0; font-weight:600; font-size:13px; font-family:inherit; color:var(--ds-text1); cursor:pointer; text-align:left; }
    .dsr-link:hover { color:var(--ds-primary); }
    .dsr-link small { font-size:12px; font-weight:500; color:var(--ds-text3); }
    .dsr-link.mono { font-family:'Geist Mono',ui-monospace,monospace; font-weight:700; color:var(--ds-info); }
    .dsr-stage-chip { display:inline-flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:8px; border:1px solid; font-style:normal; font-size:12px; font-weight:600; }
    .dsr-nv { position:relative; padding:16px 12px 14px; flex:1; overflow-y:auto; }
    .dsr-nv-lab { font-size:12px; font-weight:400; color:var(--ds-text3); padding:0 12px 8px; }
    .dsr-nv-list { position:relative; display:grid; gap:6px; }
    .dsr-nv-ind { position:absolute; left:0; right:0; top:0; height:56px; border-radius:10px; pointer-events:none; background:var(--ds-surface); border:1px solid var(--ds-border); transform:translateY(calc(var(--i, 0) * 62px)); transition:transform .28s cubic-bezier(0.22,1,0.36,1), opacity .2s; }
    .dsr-nv-item { position:relative; z-index:1; display:flex; align-items:center; gap:12px; width:100%; height:56px; padding:0 12px; border:0; border-radius:10px; background:transparent; cursor:pointer; text-align:left; font-family:inherit; color:var(--ds-text2); transition:color .2s; }
    .dsr-nv-item:hover { color:var(--ds-text1); }
        .dsr-nv-item:focus-visible { outline:2px solid var(--ds-primary); outline-offset:-2px; }
    .dsr-nv-ic { width:34px; height:34px; border-radius:8px; flex:none; display:grid; place-items:center; background:var(--ds-surface); border:1px solid var(--ds-border); transition:background .2s, color .2s; }
    .dsr-nv-item.active { color:var(--ds-text1); }
        .dsr-nv-item.active .dsr-nv-ic { background:var(--ds-primary); border-color:transparent; color:#1a1408; }
    html[data-theme="light"] .dsr-nv-item.active .dsr-nv-ic { color:#ffffff; }
    .dsr-nv-t { display:flex; flex-direction:column; min-width:0; line-height:1.2; }
    .dsr-nv-t b { font-size:14px; font-weight:500; }
    .dsr-nv-t small { font-size:12px; font-weight:400; color:var(--ds-text3); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .dsr-nv-item.active .dsr-nv-t b { color:var(--ds-primary); }
    .dsr-nv-cnt { margin-left:auto; min-width:26px; padding:2px 8px; border-radius:999px; text-align:center; font-size:12px; font-weight:500; font-family:'Geist Mono',ui-monospace,monospace; color:var(--ds-text2); background:var(--ds-card); border:1px solid var(--ds-border); }
    .dsr-nv-kbd { margin-left:auto; font-family:'Geist Mono',ui-monospace,monospace; font-size:12px; font-weight:500; color:var(--ds-text3); border:1px solid var(--ds-border); border-radius:6px; padding:0 6px; line-height:18px; background:var(--ds-surface); }
    .dsr-nv-foot { display:flex; align-items:center; gap:8px; padding:14px 20px; border-top:1px solid var(--ds-border); font-size:12px; font-weight:600; color:var(--ds-text3); }
    .dsr-mtb { display:none; align-items:stretch; padding:8px 6px calc(8px + env(safe-area-inset-bottom)); background:var(--ds-card); border-top:1px solid var(--ds-border); box-shadow:var(--ds-shadow-bar); }
    .dsr-mtb button { flex:1; position:relative; display:flex; flex-direction:column; align-items:center; gap:4px; border:0; background:none; padding:2px 0; font-family:inherit; font-size:12px; font-weight:500; color:var(--ds-text3); cursor:pointer; transition:color .2s; }
    .dsr-mtb .ic { width:42px; height:30px; border-radius:15px; display:grid; place-items:center; transition:background .2s; }
    .dsr-mtb button.active { color:var(--ds-primary); font-weight:600; }
    .dsr-mtb button.active .ic { background:var(--ds-surface); }
    .dsr-mtb .badge { position:absolute; top:-3px; right:calc(50% - 26px); min-width:16px; height:16px; padding:0 4px; border-radius:8px; display:grid; place-items:center; font-style:normal; font-size:12px; font-weight:500; color:#fff; background:var(--ds-danger); }
    @media (prefers-reduced-motion:reduce) { .dsr-nv-ind, .dsr-nv-item, .dsr-nv-ic, .dsr-mtb .ic { transition:none; } }
    .dsr-rc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(min(100%,440px),1fr)); gap:14px; }
    .dsr-rc { position:relative; background:var(--ds-card); border:1px solid var(--ds-border); border-radius:12px; padding:16px; overflow:hidden; transition:border-color .15s; }
    .dsr-rc:hover { border-color:var(--ds-borderHi); }
    .dsr-rc-h { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .dsr-rc-av { width:42px; height:42px; border-radius:50%; flex:none; display:grid; place-items:center; font-size:13px; font-weight:500; color:var(--ds-text2); background:var(--ds-surface); border:1px solid var(--ds-border); }
    .dsr-rc-av.sm { width:30px; height:30px; border-radius:50%; font-size:12px; }
    .dsr-rc-id { flex:1; min-width:0; }
    .dsr-rc-name { display:block; max-width:100%; background:none; border:0; padding:0; font-family:inherit; font-size:16px; font-weight:500; color:var(--ds-text1); cursor:pointer; text-align:left; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dsr-rc-name:hover { color:var(--ds-primary); }
    .dsr-rc-meta { display:flex; align-items:center; gap:6px; flex-wrap:wrap; font-size:13px; color:var(--ds-text2); margin-top:3px; }
    .dsr-rc-meta i { opacity:.5; font-style:normal; }
    .dsr-rc-ago { margin-left:2px; padding:1px 8px; border-radius:999px; font-size:12px; font-weight:500; background:var(--ds-surface); color:var(--ds-text2); }
    .dsr-rc-ring { --p:0; --c:var(--ds-primary); position:relative; width:48px; height:48px; flex:none; border-radius:50%; display:grid; place-items:center; background:conic-gradient(var(--c) calc(var(--p) * 1%), var(--ds-border) 0); }
    .dsr-rc-ring::before { content:""; position:absolute; inset:4.5px; border-radius:50%; background:var(--ds-card); }
    .dsr-rc-ring b { position:relative; font-size:12px; font-weight:500; color:var(--c); font-family:'Geist Mono',ui-monospace,monospace; }
    .dsr-rc-ring b i { font-style:normal; font-size:8px; margin-left:1px; opacity:.8; }
    .dsr-rc-tags { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
    .dsr-rc-stage { max-width:100%; padding:4px 10px; border-radius:8px; border:1px solid; font-size:12px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .dsr-rc-dist { padding:4px 10px; border-radius:999px; font-size:12px; font-weight:500; color:var(--ds-text2); background:transparent; border:1px solid var(--ds-border); }
    .dsr-rc-note { border-radius:10px; padding:9px 12px; margin-bottom:8px; background:var(--ds-surface); border:1px solid var(--ds-border); }
    .dsr-rc-note span { display:block; font-size:12px; font-weight:400; color:var(--ds-text3); margin-bottom:2px; }
    .dsr-rc-note p { margin:0; font-size:12.5px; line-height:1.45; color:var(--ds-text1); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
    .dsr-rc.open .dsr-rc-note p { -webkit-line-clamp:unset; display:block; }
        .dsr-rc-f { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-top:12px; padding-top:10px; border-top:1px solid var(--ds-border); }
    .dsr-rc-acts { display:flex; gap:6px; }
    .dsr-rc-more { display:inline-flex; align-items:center; gap:5px; background:none; border:0; padding:6px 4px; font-family:inherit; font-size:13px; font-weight:500; color:var(--ds-text2); cursor:pointer; }
    .dsr-rc-more:hover { color:var(--ds-text1); }
    .dsr-rc-btn { display:inline-flex; align-items:center; justify-content:center; gap:5px; height:32px; padding:0 12px; border-radius:8px; border:1px solid var(--ds-border); background:transparent; color:var(--ds-text2); font-family:inherit; font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; transition:background .15s,color .15s,border-color .15s; }
    .dsr-rc-btn:hover { color:var(--ds-text1); border-color:var(--ds-borderHi); background:var(--ds-surface); }
    .dsr-rc-btn.info { color:var(--ds-text2); }
    .dsr-rc-btn.info:hover { border-color:var(--ds-borderHi); background:var(--ds-surface); color:var(--ds-text1); }
    .dsr-rc-btn.danger { color:var(--ds-danger); padding:0 9px; }
    .dsr-rc-btn.danger:hover { border-color:color-mix(in srgb, var(--ds-danger) 55%, var(--ds-border)); background:color-mix(in srgb, var(--ds-danger) 10%, transparent); color:var(--ds-danger); }
    .dsr-rc-btn.danger.armed { background:var(--ds-danger); border-color:var(--ds-danger); color:#fff; }
    .dsr-rc-btn.icon { width:30px; padding:0; }
    .dsr-rc-fin { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:12px; }
    .dsr-rc-fin div { padding:9px 10px; border-radius:10px; background:var(--ds-surface); border:1px solid var(--ds-border); text-align:center; }
    .dsr-rc-fin div.wide { grid-column:span 3; display:flex; justify-content:space-between; align-items:center; text-align:left; }
    .dsr-rc-fin span { display:block; font-size:12px; font-weight:400; color:var(--ds-text3); margin-bottom:2px; }
    .dsr-rc-fin div.wide span { margin:0; }
    .dsr-rc-fin b { font-size:15px; font-weight:500; color:var(--ds-text1); }
    .dsr-rc-letter { display:inline-grid; place-items:center; width:26px; height:26px; border-radius:8px; border:1px solid; font-style:normal; font-size:12px; font-weight:500; }
    .dsr-ins { display:grid; grid-template-columns:minmax(0,2.2fr) minmax(0,1fr) minmax(0,1fr); gap:12px; margin-bottom:16px; }
    .dsr-ins-card { text-align:left; font-family:inherit; color:inherit; padding:16px; border-radius:12px; background:var(--ds-card); border:1px solid var(--ds-border); }
    button.dsr-ins-card { cursor:pointer; transition:border-color .15s; }
    button.dsr-ins-card:hover { border-color:var(--ds-borderHi); }
    .dsr-ins-card.on { border-color:var(--ds-primary); }
    .dsr-ins-t { font-size:13px; font-weight:400; color:var(--ds-text3); }
    .dsr-ins-v { font-size:32px; font-weight:500; letter-spacing:-.02em; margin-top:8px; line-height:1; }
    .dsr-ins-s { font-size:13px; color:var(--ds-text2); margin-top:8px; }
    .dsr-fun { display:grid; grid-template-columns:repeat(8,1fr); gap:6px; margin-top:10px; }
    .dsr-fun-b { display:flex; flex-direction:column; align-items:center; gap:5px; padding:6px 2px 5px; border-radius:10px; border:1px solid transparent; background:transparent; font-family:inherit; cursor:pointer; transition:background .15s, border-color .15s; }
    .dsr-fun-b:hover { background:var(--ds-surface); }
    .dsr-fun-b.on { background:var(--ds-surface); border-color:var(--ds-borderHi); }
    .dsr-fun-b .n { font-size:12px; font-weight:600; color:var(--c); font-family:'Geist Mono',ui-monospace,monospace; }
    .dsr-fun-b .bar { width:100%; height:38px; display:flex; align-items:flex-end; justify-content:center; }
    .dsr-fun-b .bar i { display:block; width:60%; min-width:10px; border-radius:4px 4px 2px 2px; background:var(--c); transition:height .4s cubic-bezier(0.16,1,0.3,1); }
    .dsr-fun-b .l { font-size:12px; font-weight:500; color:var(--ds-text2); }
    @media (max-width:860px) { .dsr-ins { grid-template-columns:repeat(2,minmax(0,1fr)); } .dsr-ins-card.funnel { grid-column:1 / -1; } }
    .dsr-tb { display:grid; gap:10px; margin-bottom:14px; }
    .dsr-tb-row { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .dsr-tb-row.chips { flex-wrap:nowrap; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
    .dsr-tb-row.chips::-webkit-scrollbar { display:none; }
    .dsr-tb-row.sel .grow { flex:1; }
    .dsr-tb-search { position:relative; flex:1; min-width:220px; }
    .dsr-tb-search .ic { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--ds-text3); display:flex; }
    .dsr-tb-search kbd { position:absolute; right:12px; top:50%; transform:translateY(-50%); font-family:'Geist Mono',ui-monospace,monospace; font-size:12px; font-weight:500; color:var(--ds-text3); border:1px solid var(--ds-border); border-radius:6px; padding:1px 7px; background:var(--ds-surface); }
    .dsr-tb-search .clr { position:absolute; right:10px; top:50%; transform:translateY(-50%); width:24px; height:24px; border-radius:50%; border:0; background:var(--ds-surface); color:var(--ds-text2); cursor:pointer; display:grid; place-items:center; }
    .dsr-tb-custom { display:flex; gap:8px; align-items:center; background:var(--ds-primaryDim); padding:10px 12px; border-radius:12px; border:1px solid var(--ds-border); }
    .dsr-tb-custom span { font-size:12px; font-weight:500; color:var(--ds-text2); }
    .dsr-filter-chip .cnt { font-size:12px; font-weight:500; opacity:.7; margin-left:2px; }
    .dsr-seg2 { display:inline-flex; padding:3px; gap:2px; border-radius:10px; background:var(--ds-surface); border:1px solid var(--ds-border); }
    .dsr-seg2 button { width:32px; height:30px; border:0; border-radius:8px; background:transparent; color:var(--ds-text2); font-size:15px; cursor:pointer; }
    .dsr-seg2 button.on { background:var(--ds-card); color:var(--ds-primary); box-shadow:var(--ds-shadow-card-sm); }
    html:has(.dsr-layout), body:has(.dsr-layout) { background:var(--ds-bg); }
    .dsr-mlist { border:1px solid var(--ds-border); border-radius:12px; background:var(--ds-card); overflow:hidden; }
    .dsr-mrow { display:grid; grid-template-columns:minmax(150px,1.6fr) repeat(4,minmax(80px,1fr)) minmax(120px,1.1fr) 112px; align-items:center; gap:12px; padding:0 18px; min-height:56px; width:100%; border:0; border-top:1px solid var(--ds-border); background:transparent; color:var(--ds-text1); font-family:inherit; font-size:14px; text-align:left; cursor:pointer; transition:background-color .15s; }
    .dsr-mrow:first-child { border-top:0; }
    .dsr-mrow.head { min-height:44px; background:var(--ds-surface); color:var(--ds-text3); font-size:13px; cursor:default; }
    .dsr-mrow:not(.head):hover { background:var(--ds-surface); }
    .dsr-mrow:not(.head):focus-visible { outline:2px solid var(--ds-primary); outline-offset:-2px; }
    .dsr-mrow .num { text-align:right; font-variant-numeric:tabular-nums; }
    .dsr-mrow .mon { font-weight:500; }
    .dsr-mrow .chg { font-size:13px; }
    .dsr-mrow > .hide-sm:not(.num) { padding-left:16px; }
    .dsr-mrow .go { justify-self:end; display:inline-flex; align-items:center; gap:6px; height:32px; padding:0 12px; border:1px solid var(--ds-border); border-radius:8px; font-size:13px; font-weight:500; color:var(--ds-text2); }
    .dsr-mrow:not(.head):hover .go { color:var(--ds-text1); border-color:var(--ds-borderHi); }
    @media (max-width: 860px) {
      .dsr-mrow { grid-template-columns:minmax(0,1.4fr) repeat(2,minmax(56px,.7fr)) auto; padding:0 14px; gap:8px; }
      .dsr-mrow .hide-sm { display:none; }
    }
    .dsr-tb-row.act { font-size:12px; color:var(--ds-text2); }
    .dsr-tb-row.act .res b { color:var(--ds-primary); }
    .dsr-x { display:inline-flex; align-items:center; gap:6px; height:26px; padding:0 10px; border-radius:999px; border:1px solid var(--ds-border); background:var(--ds-surface); color:var(--ds-text1); font-family:inherit; font-size:12px; font-weight:700; cursor:pointer; }
    .dsr-x:hover { border-color:var(--ds-borderHi); }
    .dsr-x.clear { background:transparent; color:var(--ds-text2); border-color:var(--ds-border); }
    .dsr-rt-wrap { overflow-x:auto; border:1px solid var(--ds-border); border-radius:12px; background:var(--ds-card); }
    .dsr-rt { min-width:820px; }
    .dsr-rt-r { display:grid; grid-template-columns:minmax(180px,2fr) 110px minmax(90px,1fr) minmax(100px,1fr) 56px 70px 76px; gap:12px; align-items:center; padding:10px 16px; border-bottom:1px solid var(--ds-border); font-size:12.5px; color:var(--ds-text1); }
    .dsr-rt-r:last-child { border-bottom:0; }
    .dsr-rt-r:not(.head):hover { background:var(--ds-surface); }
    .dsr-rt-r.head { position:sticky; top:0; font-size:12px; font-weight:500; color:var(--ds-text3); background:var(--ds-surface); }
    .dsr-rt-r small { display:block; font-size:12px; color:var(--ds-text3); margin-top:1px; }
    .dsr-rt-name { display:flex; align-items:center; gap:10px; min-width:0; background:none; border:0; padding:0; font-family:inherit; font-size:14px; font-weight:500; color:var(--ds-text1); cursor:pointer; text-align:left; }
    .dsr-rt-name:hover { color:var(--ds-primary); }
    .dsr-rt .acts { display:flex; gap:5px; justify-content:flex-end; }
    .dsr-more-btn { display:block; margin:16px auto 0; }
    @media (prefers-reduced-motion:reduce) { .dsr-rc, .dsr-rc:hover { transition:none; transform:none; } }
    .dsr-ghost-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; height:38px; padding:0 14px; border-radius:10px; border:1px solid var(--ds-border); background:color-mix(in srgb, var(--wash) 3.0%, transparent); color:var(--ds-text1); font-size:12.5px; font-weight:600; cursor:pointer; transition:border-color .15s,color .15s,background .15s; }
    .dsr-ghost-btn:hover:not(:disabled) { border-color:var(--ds-borderHi); color:var(--ds-text1); background:var(--ds-surface); }
    .dsr-ghost-btn:disabled { opacity:.45; cursor:not-allowed; }
    .dsr-sticky-actions { position:sticky; bottom:0; z-index:40; margin:20px -16px -16px; padding:14px 16px; background:var(--ds-bg); border-top:1px solid var(--ds-border); }
    @keyframes dsr-shimmer { 0%{background-position:-400px 0;} 100%{background-position:400px 0;} }
    .dsr-skeleton { border-radius:12px; background:linear-gradient(90deg,var(--ds-sk1) 25%,var(--ds-sk2) 37%,var(--ds-sk1) 63%); background-size:800px 100%; animation:dsr-shimmer 1.4s infinite linear; }
    @media(min-width:960px){
      .dsr-page-grid.has-aside { grid-template-columns:minmax(0,1fr) 340px; }
      .dsr-aside-sticky { position:sticky; top:84px; }
      .dsr-stat-grid.cols4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
      .dsr-sticky-actions { margin:20px 0 0; padding:0; position:static; background:none; backdrop-filter:none; }
    }
    @keyframes dsr-modal-in { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:none;} }
    .dsr-modal-box { animation:dsr-modal-in 0.22s cubic-bezier(0.22,1,0.36,1) both; }
    .dsr-ladder-seg { transition:background-color 0.35s cubic-bezier(0.16,1,0.3,1),box-shadow 0.35s ease; }
    @keyframes dsr-spin { to{transform:rotate(360deg);} }
    .dsr-spinner { width:28px;height:28px;border-radius:50%;border:3px solid color-mix(in srgb, var(--wash) 8.0%, transparent);border-top-color:var(--ds-primary);animation:dsr-spin 0.7s linear infinite;margin:0 auto 14px; }
    .dsr-empty-icon { width:64px;height:64px;border-radius:50%;background:var(--ds-surface);border:1px solid var(--ds-border);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 14px; }
    .dsr-input:focus { outline:none;border-color:var(--ds-primary)!important;box-shadow:0 0 0 1px var(--ds-primary)!important; }
    .dsr-input-highlight { border-color:var(--ds-borderHi)!important; }
    .dsr-input-highlight:focus { border-color:var(--ds-primary)!important;box-shadow:0 0 0 1px var(--ds-primary)!important; }
    .dsr-btn-primary { background:var(--ds-primary)!important;color:#1a1408!important;border:none!important;box-shadow:var(--ds-shadow-btn);transition:background-color 0.16s ease,transform 0.16s ease; }
    html[data-theme="light"] .dsr-btn-primary { background:#171717!important;color:#fff!important; }
    .dsr-btn-primary:hover:not(:disabled) { filter:brightness(1.07); }
    .dsr-btn-primary:active:not(:disabled) { transform:scale(0.98); }
    .dsr-btn-primary:disabled { opacity:0.5;cursor:not-allowed;box-shadow:none; }
    .dsr-btn-danger:hover { background:rgba(244,63,94,0.15)!important;color:#FB7185!important;border-color:rgba(244,63,94,0.4)!important; }
    .dsr-btn-edit:hover { background:rgba(59,130,246,0.12)!important;color:#60A5FA!important;border-color:rgba(59,130,246,0.35)!important; }
    .dsr-btn-export { background:var(--ds-surface)!important;color:var(--ds-text1)!important;border:1px solid var(--ds-border)!important;box-shadow:none!important;transition:background-color 0.16s ease,border-color 0.16s ease; }
    .dsr-btn-export:hover { border-color:var(--ds-borderHi)!important; }
    .dsr-record-card { transition:border-color 0.15s ease; }
    .dsr-record-card:hover { border-color:var(--ds-borderHi)!important; }
    .dsr-customer-row { transition:background 0.12s;cursor:pointer; }
    .dsr-customer-row:focus-visible { outline:2px solid var(--ds-primary);outline-offset:-2px; }
    .dsr-customer-row:hover { background:var(--ds-surface)!important; }
    .dsr-customer-row:hover .dsr-row-actions { opacity:1!important; }
        .dsr-cust-ladder { flex:0 0 140px; width:140px; display:block; text-align:left; }
    .dsr-cust-ladder > div { display:inline-flex; }
    .dsr-row-actions { opacity:0;transition:opacity 0.15s;display:flex;gap:6px;flex-shrink:0;width:102px;justify-content:flex-end; }
    @media(max-width:520px){ .dsr-cust-ladder { flex-basis:104px; width:104px; } }
    .dsr-row-actions { opacity:0;transition:opacity 0.15s;display:flex;gap:6px;flex-shrink:0; }
    @media(max-width:767px){.dsr-row-actions{opacity:1!important;}}
    .dsr-topbar-btn:hover { background:color-mix(in srgb, var(--wash) 12.0%, transparent)!important; }
    .dsr-topbar-btn:active { background:color-mix(in srgb, var(--wash) 20.0%, transparent)!important; }
    .dsr-visits-btn { transition:background 0.15s,border-color 0.15s; }
    .dsr-visits-btn:hover { background:var(--ds-surface)!important;border-color:var(--ds-borderHi)!important; }
    .dsr-export-dropdown { position:relative;display:inline-flex;flex-shrink:0; }
    .dsr-export-menu { position:absolute;top:calc(100% + 6px);right:0;background:var(--ds-card);border:1px solid var(--ds-border);border-radius:12px;padding:8px;min-width:240px;z-index:200;box-shadow:var(--ds-shadow-menu); }
    .dsr-export-menu-item { display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;transition:background 0.12s;font-size:13px;font-weight:500;color:var(--ds-text1);border:none;background:transparent;width:100%;text-align:left; }
    .dsr-export-menu-item:hover { background:var(--ds-surface);color:var(--ds-text1); }
    .dsr-export-menu-item.active { background:var(--ds-surface);color:var(--ds-primary);font-weight:500; }
    .dsr-export-divider { height:1px;background:var(--ds-border);margin:6px 0; }
    .dsr-export-custom-row { padding:10px 12px 4px;display:flex;flex-direction:column;gap:6px; }
    .dsr-export-custom-row label { font-size:12px;font-weight:500;color:var(--ds-text2); }
    .dsr-export-custom-inputs { display:flex;gap:6px;align-items:center; }
    .dsr-card-expanded { border:1px solid var(--ds-primary)!important; }
    .dsr-expand-btn { height:28px;padding:0 10px;border-radius:6px;border:1px solid var(--ds-border);background:transparent;font-size:12px;font-weight:500;cursor:pointer;color:var(--ds-text2);transition:background 0.15s,color 0.15s;display:flex;align-items:center;gap:4px; }
    .dsr-expand-btn:hover,.dsr-expand-btn.expanded { background:var(--ds-surface);color:var(--ds-text1);border-color:var(--ds-borderHi); }
    .dsr-card-detail-section { overflow:hidden;transition:max-height 0.3s cubic-bezier(0.4,0,0.2,1),opacity 0.2s ease;max-height:0;opacity:0; }
    .dsr-card-detail-section.open { max-height:800px;opacity:1; }
    .dsr-filter-chip { display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;border:1px solid var(--ds-border);background:color-mix(in srgb, var(--wash) 3.0%, transparent);font-size:12px;font-weight:600;color:var(--ds-text2);cursor:pointer;transition:all 0.15s;white-space:nowrap; }
    .dsr-filter-chip:hover { border-color:var(--ds-borderHi);color:var(--ds-text1);background:var(--ds-surface); }
    .dsr-filter-chip.active { background:var(--ds-primary);color:#1a1408;border-color:var(--ds-primary); }
    html[data-theme="light"] .dsr-filter-chip.active { background:#171717;color:#fff;border-color:#171717; }
    .dsr-cust-banner { background:var(--ds-surface);border:1px solid var(--ds-border);border-radius:10px;padding:12px 14px;margin-bottom:14px; }
    .dsr-cust-banner-title { font-size:12px;font-weight:500;color:var(--ds-text2);margin-bottom:8px;display:flex;align-items:center;gap:5px; }
    .dsr-cust-banner-grid { display:grid;grid-template-columns:1fr 1fr;gap:6px 14px; }
    .dsr-cust-banner-item { display:flex;flex-direction:column;gap:1px; }
    .dsr-cust-banner-key { font-size:12px;color:var(--ds-text3);font-weight:400; }
    .dsr-cust-banner-val { font-size:13px;font-weight:500;color:var(--ds-text1); }
    .dsr-last-hint { display:inline-flex;align-items:center;gap:5px;margin-top:5px;padding:3px 9px 3px 7px;border-radius:20px;background:var(--ds-surface);border:1px solid var(--ds-border);font-size:12px;color:var(--ds-text2);line-height:1.4;cursor:pointer;transition:background 0.15s;max-width:100%;overflow:hidden; }
    .dsr-last-hint:hover { background:var(--ds-card); }
    .dsr-last-hint .hint-text { overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .dsr-last-hint .hint-use { flex-shrink:0;font-weight:500;color:var(--ds-primary);margin-left:3px; }
    .dsr-edit-stripe { background:var(--ds-surface);border-bottom:1px solid var(--ds-border);border-radius:10px 10px 0 0;margin:-20px -20px 16px -20px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between; }
    .dsr-modal-box::-webkit-scrollbar { width:4px; }
    .dsr-modal-box::-webkit-scrollbar-track { background:var(--ds-surface); }
    .dsr-modal-box::-webkit-scrollbar-thumb { background:var(--ds-border);border-radius:2px; }
    .dsr-scroll::-webkit-scrollbar { width:4px; }
    .dsr-scroll::-webkit-scrollbar-track { background:var(--ds-surface); }
    .dsr-scroll::-webkit-scrollbar-thumb { background:var(--ds-border);border-radius:2px; }
        .ei-import-btn:hover { border-color:var(--ds-borderHi)!important; }
    .ei-input { transition:border-color 0.15s,box-shadow 0.15s;outline:none; }
    .ei-input:focus { border-color:var(--ds-primary)!important;box-shadow:0 0 0 1px var(--ds-primary)!important; }
    .ei-row-new { background:rgba(212,175,106,0.05); }
    .ei-row-dup { background:rgba(245,158,11,0.05); }
    .ei-check:checked { accent-color:var(--ds-primary); }
    .ei-btn-primary { background:var(--ds-primary);color:#1a1408;border:none;border-radius:8px;cursor:pointer;font-weight:500;box-shadow:var(--ds-shadow-btn);transition:filter 0.18s,transform 0.18s; }
    .ei-btn-primary:hover:not(:disabled) { filter:brightness(1.07); }
    .ei-btn-primary:disabled { opacity:0.5;cursor:not-allowed;box-shadow:none; }
    .ei-btn-secondary { background:color-mix(in srgb, var(--wash) 5.0%, transparent);color:var(--ds-text1);border:1px solid var(--ds-border);border-radius:8px;cursor:pointer;font-weight:500;transition:background 0.15s; }
    .ei-btn-secondary:hover { background:color-mix(in srgb, var(--wash) 8.0%, transparent); }
    .ei-dropzone { border:2px dashed var(--ds-border);border-radius:12px;background:color-mix(in srgb, var(--wash) 2.0%, transparent);transition:border-color 0.2s,background 0.2s;cursor:pointer; }
    .ei-dropzone.dragover { border-color:var(--ds-primary);background:rgba(212,175,106,0.06); }
    .ei-table { border-collapse:collapse;width:100%;font-size:12px; }
    .ei-table th { background:var(--ds-surface);font-size:12px;font-weight:500;color:var(--ds-text2);padding:8px 10px;border-bottom:1px solid var(--ds-border);position:sticky;top:0;z-index:1; }
    .ei-table td { padding:8px 10px;border-bottom:1px solid color-mix(in srgb, var(--wash) 4.0%, transparent);vertical-align:middle;color:var(--ds-text1); }
    .ei-badge { display:inline-block;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:500; }
    .ei-badge-new { background:rgba(212,175,106,0.15);color:var(--ds-primary);border:1px solid rgba(212,175,106,0.3); }
    .ei-badge-dup { background:var(--ds-surface);color:var(--ds-text2);border:1px solid var(--ds-border); }
    .ei-toast { position:fixed;top:20px;left:50%;transform:translateX(-50%);color:#fff;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:500;z-index:9999;white-space:nowrap;box-shadow:var(--ds-shadow-menu);display:flex;align-items:center;gap:8px; }
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
  "Customer Name": "name",
  Name: "name",
  Area: "area",
  Distributor: "distributor",
  "Project Stage": "stage",
  Stage: "stage",
  "Potential - Dyes (Rs L/mth)": "potDyes",
  "Potential Dyes (Rs L/mth)": "potDyes",
  "Potential - Aux (Rs L/mth)": "potAux",
  "Potential Aux (Rs L/mth)": "potAux",
  "Existing Bus: Dyes (Rs L/mth)": "exDyes",
  "Existing Dyes (Rs L/mth)": "exDyes",
  "Existing Bus: Aux (Rs L/mth)": "exAux",
  "Existing Aux (Rs L/mth)": "exAux",
  "ABP AM26  (Rs L)": "abp",
  "ABP AM26 (Rs L)": "abp",
  "YTD Sale till end of Prev Mth (Rs L)": "ytd",
  "Contact Person": "contactPerson",
  "Contact Person Name": "contactPerson",
  "Person Name": "contactPerson",
  Designation: "designation",
  Mobile: "mobile",
  "Mobile Number": "mobile",
  "Mobile No": "mobile",
  Phone: "mobile",
  "Contact Number": "mobile",
  "Alternate Mobile": "altMobile",
  "Alt Mobile": "altMobile",
  "Alternate Number": "altMobile",
  Email: "email",
  "Email ID": "email",
  Address: "address",
  Location: "address",
  GSTIN: "gstin",
  "GST No": "gstin",
  "GST Number": "gstin",
  Notes: "notes",
  Remarks: "notes",
};
const eiNorm = (h) =>
  String(h ?? "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
const EI_COL_LOWER = Object.fromEntries(
  Object.entries(EI_COL_MAP).map(([k, v]) => [eiNorm(k), v]),
);
const eiKey = (h) => EI_COL_LOWER[eiNorm(h)];

// ── Customer Excel download / template (same headers the importer reads) ──
const CUSTOMER_XLSX_COLS = [
  ["Customer", 28, (n) => n],
  ["Area", 18, (n, c) => c.area],
  ["Distributor", 20, (n, c) => c.distributor],
  ["Project Stage", 34, (n, c) => c.stage],
  ["Potential - Dyes (Rs L/mth)", 16, (n, c) => toNum(c.potDyes)],
  ["Potential - Aux (Rs L/mth)", 16, (n, c) => toNum(c.potAux)],
  ["Existing Bus: Dyes (Rs L/mth)", 16, (n, c) => toNum(c.exDyes)],
  ["Existing Bus: Aux (Rs L/mth)", 16, (n, c) => toNum(c.exAux)],
  ["ABP AM26 (Rs L)", 14, (n, c) => toNum(c.abp)],
  ["Contact Person", 22, (n, c) => c.contactPerson || ""],
  ["Designation", 18, (n, c) => c.designation || ""],
  ["Mobile", 15, (n, c) => c.mobile || ""],
  ["Alternate Mobile", 15, (n, c) => c.altMobile || ""],
  ["Email", 28, (n, c) => c.email || ""],
  ["Address", 34, (n, c) => c.address || ""],
  ["GSTIN", 18, (n, c) => c.gstin || ""],
  ["Notes", 36, (n, c) => c.notes || ""],
];
const XL_HEAD_STYLE = {
  font: { bold: true, color: { rgb: "0A0B10" }, sz: 11 },
  fill: { patternType: "solid", fgColor: { rgb: "D4AF6A" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  border: {
    top: { style: "thin", color: { rgb: "A8823A" } },
    bottom: { style: "thin", color: { rgb: "A8823A" } },
    left: { style: "thin", color: { rgb: "A8823A" } },
    right: { style: "thin", color: { rgb: "A8823A" } },
  },
};
const XL_CELL_STYLE = (zebra) => ({
  font: { sz: 10.5 },
  fill: zebra
    ? { patternType: "solid", fgColor: { rgb: "F6F1E6" } }
    : undefined,
  alignment: { vertical: "center", wrapText: true },
  border: {
    bottom: { style: "hair", color: { rgb: "CFC7B5" } },
  },
});
const styleSheet = (ws, widths, nRows, nCols) => {
  ws["!cols"] = widths.map((w) => ({ wch: w }));
  ws["!rows"] = [{ hpt: 34 }];
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: Math.max(nRows, 1), c: nCols - 1 },
    }),
  };
  for (let c = 0; c < nCols; c++) {
    const a = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[a]) ws[a].s = XL_HEAD_STYLE;
    for (let r = 1; r <= nRows; r++) {
      const b = XLSX.utils.encode_cell({ r, c });
      if (ws[b]) ws[b].s = XL_CELL_STYLE(r % 2 === 0);
    }
  }
};
const exportCustomersXlsx = (customers, names, historyMap) => {
  const head = [
    ...CUSTOMER_XLSX_COLS.map((c) => c[0]),
    "Total Visits",
    "Last Visit",
  ];
  const body = names.map((n) => {
    const c = customers[n] || {};
    const h = historyMap[n] || [];
    return [
      ...CUSTOMER_XLSX_COLS.map((col) => col[2](n, c)),
      h.length,
      h[0] ? fmtDate(h[0].date) : "",
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
  styleSheet(
    ws,
    [...CUSTOMER_XLSX_COLS.map((c) => c[1]), 12, 16],
    body.length,
    head.length,
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const stamp = new Date().toISOString().slice(0, 10);
  downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `DSR_Customers_${stamp}.xlsx`,
  );
  return body.length;
};
const downloadCustomerTemplate = () => {
  const head = CUSTOMER_XLSX_COLS.map((c) => c[0]);
  const ws = XLSX.utils.aoa_to_sheet([head]);
  styleSheet(
    ws,
    CUSTOMER_XLSX_COLS.map((c) => c[1]),
    0,
    head.length,
  );
  const info = [
    ["Column", "Required?", "Rules / example"],
    ["Customer", "Yes", "Unique customer name. Example: ABC Dyeing Pvt Ltd"],
    ["Area", "Yes", "Example: Barhi"],
    ["Distributor", "Yes", `One of: ${DISTRIBUTOR_OPTIONS.join(" / ")}`],
    [
      "Project Stage",
      "Yes",
      "Stage letter or full name. Example: D or D. Bulk Trials Complete",
    ],
    [
      "Potential / Existing / ABP",
      "Numbers",
      "Rs Lakhs, numbers only. Example: 2.5",
    ],
    ["Contact Person", "No", "Example: Ramesh Gupta"],
    ["Designation", "No", "Example: Owner, Purchase Manager"],
    [
      "Mobile / Alternate Mobile",
      "No",
      "10 digits, starting with 6-9. A +91 or leading 0 is fine. Example: 9876543210",
    ],
    ["Email", "No", "Example: name@company.com"],
    ["Address", "No", "Free text"],
    ["GSTIN", "No", "15 character. Example: 07AABCU9603R1ZM"],
    ["Notes", "No", "Free text"],
  ];
  const wi = XLSX.utils.aoa_to_sheet(info);
  wi["!cols"] = [{ wch: 28 }, { wch: 12 }, { wch: 80 }];
  for (let c = 0; c < 3; c++) {
    const a = XLSX.utils.encode_cell({ r: 0, c });
    if (wi[a]) wi[a].s = XL_HEAD_STYLE;
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  XLSX.utils.book_append_sheet(wb, wi, "Instructions");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "DSR_Customer_Import_Template.xlsx",
  );
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
  border: `1px solid var(--ds-border)`,
  borderRadius: 8,
  fontSize: 13,
  color: "var(--ds-text1)",
  background: "color-mix(in srgb, var(--wash) 4.0%, transparent)",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

const IH = {
  ...IS,
  borderColor: "#F59E0B",
  background: "rgba(245,158,11,0.06)",
  boxShadow: "none",
};

// ── ExcelImporter ──────────────────────────────────────────────────────────
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
            if (raw[i].some((c) => eiKey(c) === "name")) {
              hi = i;
              break;
            }
          }
          const headers = raw[hi].map((h) => String(h).trim());
          const dataRows = raw.slice(hi + 1);
          const seenInFile = {};
          dataRows.forEach((row, i) => {
            const ci = headers.findIndex((h) => eiKey(h) === "name");
            const cn = ci >= 0 ? String(row[ci] || "").trim() : "";
            if (cn) seenInFile[cn] = i;
          });
          const parsed = [];
          dataRows.forEach((row, i) => {
            const obj = {};
            headers.forEach((h, j) => {
              const key = eiKey(h);
              if (key && obj[key] === undefined) obj[key] = row[j];
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
            const issues = [];
            const mob = cleanMobile(obj.mobile);
            const alt = cleanMobile(obj.altMobile);
            const em = String(obj.email ?? "")
              .trim()
              .toLowerCase();
            const gst = String(obj.gstin ?? "")
              .trim()
              .toUpperCase();
            n.contactPerson = String(obj.contactPerson ?? "").trim();
            n.designation = String(obj.designation ?? "").trim();
            n.address = String(obj.address ?? "").trim();
            n.notes = String(obj.notes ?? "").trim();
            n.mobile = isValidMobile(mob) ? mob : "";
            n.altMobile = isValidMobile(alt) ? alt : "";
            n.email = isValidEmail(em) ? em : "";
            n.gstin = isValidGSTIN(gst) ? gst : "";
            if (obj.mobile && !n.mobile) issues.push("Mobile");
            if (obj.altMobile && !n.altMobile) issues.push("Alt mobile");
            if (em && !n.email) issues.push("Email");
            if (gst && !n.gstin) issues.push("GSTIN");
            n._missing = [
              !n.area && "Area",
              !DISTRIBUTOR_OPTIONS.includes(n.distributor) && "Distributor",
              !n.stage && "Stage",
            ].filter(Boolean);
            n._issues = issues;
            n._isDup = !!existingCustomers[name];
            n._status = n._isDup ? "dup" : "new";
            parsed.push(n);
          });
          setRows(parsed);
          const sel = {};
          parsed.forEach((r, idx) => {
            sel[idx] = !r._isDup && r._missing.length === 0;
          });
          setSelected(sel);
          setDone(false);
        } catch (err) {
          showEiToast("Could not parse file: " + err.message, "error");
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
      s[i] = !r._isDup && r._missing.length === 0;
    });
    setSelected(s);
  };
  const selectAll = () => {
    const s = {};
    rows.forEach((r, i) => {
      s[i] = r._missing.length === 0;
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
      showEiToast("No customer selected.", "error");
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
      // contact: overwrite sirf non-empty values ko (khali cell purana data na mitaye)
      [
        "contactPerson",
        "designation",
        "mobile",
        "altMobile",
        "email",
        "address",
        "gstin",
        "notes",
      ].forEach((k) => {
        if (r[k]) p[k] = r[k];
      });
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
              imported[r.name] = { ...d.data, ...pickContact(d.data) };
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
    } else showEiToast("Import failed.", "error");
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
          boxShadow: "var(--ds-shadow-modal)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "var(--ds-banner)",
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
              background: DS.primary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon
              name="upload"
              size={19}
              strokeWidth={2}
              style={{ color: "#0A0B10" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: DS.text1 }}>
              Import Customers from Excel
            </div>
            <div style={{ fontSize: 12, color: DS.text2, marginTop: 2 }}>
              DVR.xlsx or any DSR format
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: `1px solid ${DS.border}`,
              background: "color-mix(in srgb, var(--wash) 6.0%, transparent)",
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
                  background: DS.surface,
                  border: `1px solid ${DS.border}`,
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
                  fontWeight: 600,
                  color: DS.text1,
                  marginBottom: 6,
                }}
              >
                Drop the Excel file here
              </div>
              <div style={{ fontSize: 13, color: DS.text2, marginBottom: 16 }}>
                or click to select (.xlsx, .xls)
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 20px",
                  background: DS.primary,
                  color: "#0A0B10",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <Icon name="upload" size={13} strokeWidth={2.1} /> Browse File
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
          {rows.length === 0 && (
            <div
              className="dsr-glass"
              style={{
                borderRadius: 14,
                padding: "14px 16px",
                marginTop: 14,
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div
                  style={{ fontSize: 12.5, fontWeight: 600, color: DS.text1 }}
                >
                  Template chahiye?
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: DS.text2,
                    marginTop: 2,
                    lineHeight: 1.45,
                  }}
                >
                  Customer, Area, Distributor, Stage, numbers + Contact Person,
                  Mobile, Email, Address, GSTIN, Notes columns. A previously
                  downloaded customers file can be uploaded back as-is.
                </div>
              </div>
              <button
                className="dsr-ghost-btn"
                onClick={downloadCustomerTemplate}
              >
                <Icon name="download" size={14} /> Template download
              </button>
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
                    background: "rgba(212,175,106,0.12)",
                    color: DS.primary,
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    border: "1px solid rgba(212,175,106,0.25)",
                  }}
                >
                  <Icon name="sparkle" size={11} />
                  {newCount} Naye
                </div>
                {dupCount > 0 && (
                  <div
                    style={{
                      padding: "6px 14px",
                      background: "rgba(233,207,152,0.10)",
                      color: DS.text1,
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      border: "1px solid rgba(233,207,152,0.25)",
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
                    background: DS.surface,
                    border: `1px solid ${DS.border}`,
                    borderRadius: 10,
                    marginBottom: 14,
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: DS.text1,
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Icon name="alert" size={12} strokeWidth={2} /> For
                    duplicates:
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
                    fontSize: 12,
                    padding: "4px 10px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Icon name="check" size={11} strokeWidth={2.3} /> New only
                </button>
                <button
                  className="ei-btn-secondary"
                  onClick={selectAll}
                  style={{
                    fontSize: 12,
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
                    fontSize: 12,
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
                      <th className="ei-desktop-only">Contact</th>
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
                              disabled={
                                r._missing.length > 0 ||
                                (r._isDup && dupAction === "skip")
                              }
                            />
                          </td>
                          <td style={{ fontWeight: 600, color: DS.text1 }}>
                            {r.name}
                          </td>
                          <td style={{ color: DS.text2 }}>{r.area}</td>
                          <td
                            className="ei-desktop-only"
                            style={{ color: DS.text2, fontSize: 12 }}
                          >
                            {r.contactPerson || r.mobile ? (
                              <>
                                {r.contactPerson}
                                {r.contactPerson && r.mobile ? " · " : ""}
                                <span className="dsr-mono">{r.mobile}</span>
                              </>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td
                            className="ei-desktop-only"
                            style={{ color: DS.text1 }}
                          >
                            ₹{r.potDyes}L
                          </td>
                          <td
                            className="ei-desktop-only"
                            style={{ color: DS.text1 }}
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
                            {r._missing.length > 0 && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: DS.danger,
                                  marginTop: 4,
                                  fontWeight: 600,
                                }}
                              >
                                Missing: {r._missing.join(", ")}
                              </div>
                            )}
                            {r._issues.length > 0 && (
                              <div
                                style={{
                                  fontSize: 12,
                                  color: DS.amber,
                                  marginTop: 4,
                                  fontWeight: 600,
                                }}
                              >
                                ⚠ {r._issues.join(", ")} invalid — skip
                              </div>
                            )}
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
                      borderTopColor: "#0A0B10",
                      margin: 0,
                    }}
                  />
                ) : (
                  <Icon name="upload" size={14} strokeWidth={2.1} />
                )}
                {importing
                  ? "Importing…"
                  : !rows.length
                    ? "Upload a file first"
                    : `${selectedRows.length} Customers`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── ExportDropdown ─────────────────────────────────────────────────────────
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
              fontSize: 12,
              fontWeight: 600,
              color: DS.text3,
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
            <span style={{ marginLeft: "auto", fontSize: 12, color: DS.text3 }}>
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
                  colorScheme: "dark",
                }}
              />
              <span style={{ fontSize: 12, color: DS.text3 }}>to</span>
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
                  colorScheme: "dark",
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
            fontSize: 12,
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
          <span style={{ fontWeight: 600 }}>Objective: </span>
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
          <span style={{ fontWeight: 600 }}>Outcome: </span>
          {record.outcome}
        </div>
      )}
      {record.stage && (
        <div style={{ marginBottom: 8 }}>
          <span
            style={{
              fontSize: 12,
              padding: "3px 8px",
              borderRadius: 4,
              fontWeight: 600,
              background: sc.bg,
              color: sc.text,
              border: `1px solid color-mix(in srgb, ${sc.border} 26.7%, transparent)`,
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
      boxShadow: "var(--ds-shadow-card)",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        fontSize: 12,
        color: DS.text3,
        fontWeight: 600,
        marginBottom: 7,
      }}
    >
      {label}
    </div>
    <div
      className="dsr-mono"
      style={{ fontSize: 24, fontWeight: 500, color: DS.text1, lineHeight: 1 }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          fontSize: 12,
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
      fontSize: 12,
      color: DS.text2,
      marginBottom: 5,
      fontWeight: 600,
    }}
  >
    {children}
    {required && <span style={{ color: DS.danger, marginLeft: 2 }}>*</span>}
    {keyBadge && (
      <span
        style={{
          marginLeft: 6,
          fontSize: 12,
          fontWeight: 600,
          color: DS.text1,
          background: "rgba(233,207,152,0.12)",
          padding: "1px 6px 1px 5px",
          borderRadius: 4,
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

// ── CustomSelect — themed replacement for native <select> ──────────────────
// The menu is rendered in a portal with fixed positioning, so it is never
// clipped by a card / modal (overflow:hidden), flips upward when there is no
// room below, and works with the keyboard (↑ ↓ Enter Esc Home End).
const CustomSelect = ({
  value,
  onChange,
  name,
  highlight,
  disabled,
  placeholder = "Select…",
  children,
  style,
  compact = false,
  allowEmpty = false,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const options = React.Children.toArray(children)
    .filter((c) => React.isValidElement(c) && c.type === "option")
    .map((c) => ({
      value:
        c.props.value !== undefined
          ? String(c.props.value)
          : String(c.props.children ?? ""),
      label: String(c.props.children ?? ""),
    }));

  const cur = String(value ?? "");
  const selIdx = options.findIndex((o) => o.value === cur);
  const selected = options[selIdx];
  const canPick = (o) => allowEmpty || o.value !== "";

  const place = useCallback(() => {
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const below = vh - r.bottom - 12;
    const above = r.top - 12;
    const want = Math.min(260, options.length * 38 + 12);
    const up = below < Math.min(want, 190) && above > below;
    const width = Math.max(r.width, compact ? 190 : r.width);
    setPos({
      left: Math.max(8, Math.min(r.left, vw - width - 8)),
      width,
      top: up ? undefined : r.bottom + 5,
      bottom: up ? vh - r.top + 5 : undefined,
      maxH: Math.max(120, Math.min(260, up ? above : below)),
    });
  }, [options.length, compact]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // keep the highlighted option visible
  useEffect(() => {
    if (!open || hi < 0) return;
    menuRef.current
      ?.querySelector(`[data-i="${hi}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, hi, pos]);

  const openMenu = () => {
    if (disabled) return;
    setHi(selIdx >= 0 ? selIdx : options.findIndex(canPick));
    setOpen(true);
  };

  const pick = (v) => {
    if (onChange) onChange({ target: { name, value: v } });
    setOpen(false);
    btnRef.current?.focus();
  };

  const move = (dir) => {
    if (!options.length) return;
    let i = hi;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (canPick(options[i])) break;
    }
    setHi(i);
  };

  const onKeyDown = (e) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setHi(options.findIndex(canPick));
    } else if (e.key === "End") {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i--)
        if (canPick(options[i])) {
          setHi(i);
          break;
        }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (hi >= 0 && canPick(options[hi])) pick(options[hi].value);
    }
  };

  const base = highlight ? IH : IS;
  const isEmpty = !selected?.value;

  return (
    <div ref={wrapRef} style={{ position: "relative", ...style }}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        disabled={disabled}
        style={{
          ...base,
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: compact ? 36 : base.height,
          minWidth: compact ? 130 : undefined,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          color: isEmpty && !allowEmpty ? DS.text2 : DS.text1,
          borderColor: open ? DS.primary : highlight ? DS.amber : DS.border,
          boxShadow: open
            ? `0 0 0 1px ${DS.primary}`
            : highlight
              ? `0 0 0 1px ${DS.primary}`
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
          {selected?.value ? selected.label : selected?.label || placeholder}
        </span>
        <Icon
          name={open ? "chevronUp" : "chevronDown"}
          size={14}
          strokeWidth={2}
          style={{
            flexShrink: 0,
            color: open ? DS.primary : DS.text3,
            transition: "color 0.15s",
          }}
        />
      </button>

      {open &&
        !disabled &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="dsr-scroll"
            style={{
              position: "fixed",
              left: pos.left,
              width: pos.width,
              top: pos.top,
              bottom: pos.bottom,
              zIndex: 1200,
              background: DS.surface,
              border: `1px solid ${DS.borderHi}`,
              borderRadius: 12,
              padding: 5,
              maxHeight: pos.maxH,
              overflowY: "auto",
              boxShadow: "var(--ds-shadow-pop)",
              scrollbarWidth: "thin",
              scrollbarColor: `${DS.border} transparent`,
              fontFamily:
                "'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
            }}
          >
            {options.map((opt, i) => {
              const isSel = opt.value === cur;
              const isEmptyOpt = !opt.value;
              const disabledOpt = !canPick(opt);
              const isStageOpt = PROJECT_STAGE_OPTIONS.some(
                (st) => st === opt.label,
              );
              const sc = isStageOpt ? stageColor(opt.label) : null;
              const active = i === hi && !disabledOpt;
              return (
                <div
                  key={opt.value || "__empty__"}
                  role="option"
                  aria-selected={isSel}
                  data-i={i}
                  onClick={() => !disabledOpt && pick(opt.value)}
                  onMouseEnter={() => !disabledOpt && setHi(i)}
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    cursor: disabledOpt ? "default" : "pointer",
                    fontSize: 13,
                    color: disabledOpt
                      ? DS.text3
                      : isSel
                        ? DS.primary
                        : DS.text1,
                    background: isSel
                      ? DS.primaryDim
                      : active
                        ? "color-mix(in srgb, var(--wash) 6%, transparent)"
                        : "transparent",
                    fontWeight: isSel ? 600 : 400,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    borderLeft: `2px solid ${isSel ? DS.primary : "transparent"}`,
                    userSelect: "none",
                    opacity: isEmptyOpt && allowEmpty && !isSel ? 0.85 : 1,
                  }}
                >
                  {sc && (
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        flexShrink: 0,
                        background: sc.border,
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
                    title={opt.label}
                  >
                    {opt.label}
                  </span>
                  {isSel && !disabledOpt && (
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
          </div>,
          document.body,
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
        boxShadow: "var(--ds-shadow-raised)",
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

// ══════════════════════════════════════════════════════════════════════════
//  RECORDS PRO UI – toolbar, insights, premium cards, compact table
// ══════════════════════════════════════════════════════════════════════════
const dsrHue = (s) =>
  [...String(s || "")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
const dsrInitials = (n) =>
  String(n || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";
const agoLabel = (d) => {
  const n = daysSince(d);
  if (n === null) return "";
  return n === 0 ? "Today" : n === 1 ? "Yesterday" : `${n} days ago`;
};
const stageLetter = (s) => (s || "").trim()[0]?.toUpperCase() || "";

const REC_SORTS = [
  ["new", "Newest first"],
  ["old", "Oldest first"],
  ["name", "Customer A–Z"],
  ["pct", "Highest YTD/ABP"],
  ["pctLow", "Lowest YTD/ABP"],
  ["pot", "Highest potential"],
];
const REC_PRESETS = [
  ["all", "All time"],
  ["today", "Today"],
  ["7", "7 days"],
  ["month", "This month"],
  ["lastmonth", "Last month"],
];
const presetRange = (id) => {
  const now = new Date();
  const sod = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const eod = (d) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  if (id === "today") return [sod(now), eod(now)];
  if (id === "7") {
    const s = sod(now);
    s.setDate(s.getDate() - 6);
    return [s, eod(now)];
  }
  if (id === "month")
    return [
      new Date(now.getFullYear(), now.getMonth(), 1),
      eod(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    ];
  if (id === "lastmonth")
    return [
      new Date(now.getFullYear(), now.getMonth() - 1, 1),
      eod(new Date(now.getFullYear(), now.getMonth(), 0)),
    ];
  return null;
};
const recPot = (r) => toNum(r.potDyes) + toNum(r.potAux);

const RecordCard = ({ record, onDelete, onEdit, onOpen }) => {
  const [expanded, setExpanded] = useState(false);
  const [armed, setArmed] = useState(false);
  const color = pctColor(record.pct);
  const sc = stageColor(record.stage);
  const id = record._id || record.id;
  const askDelete = () => {
    if (armed) return onDelete(id);
    setArmed(true);
    setTimeout(() => setArmed(false), 3000);
  };
  return (
    <article
      className={`dsr-rc${expanded ? " open" : ""}`}
      style={{ "--sc": sc.border }}
    >
      <header className="dsr-rc-h">
        <span
          className="dsr-rc-av"
          style={{ "--h": dsrHue(record.customer) }}
          aria-hidden="true"
        >
          {dsrInitials(record.customer)}
        </span>
        <div className="dsr-rc-id">
          <button
            className="dsr-rc-name"
            onClick={onOpen}
            title="Open customer history"
          >
            {record.customer}
          </button>
          <div className="dsr-rc-meta">
            <span>{fmtDate(record.date)}</span>
            <i>·</i>
            <span>{record.area || "—"}</span>
            <span className="dsr-rc-ago">{agoLabel(record.date)}</span>
          </div>
        </div>
        <div
          className="dsr-rc-ring"
          style={{
            "--p": Math.min(Number(record.pct) || 0, 100),
            "--c": color,
          }}
          title={`YTD vs ABP: ${record.pct}%`}
        >
          <b>
            {Math.round(Number(record.pct) || 0)}
            <i>%</i>
          </b>
        </div>
      </header>

      <div className="dsr-rc-tags">
        <span
          className="dsr-rc-stage"
          style={{
            background: sc.bg,
            color: sc.text,
            borderColor: `color-mix(in srgb, ${sc.border} 35%, transparent)`,
          }}
        >
          {record.stage || "No stage"}
        </span>
        {record.distributor && (
          <span className="dsr-rc-dist">{record.distributor}</span>
        )}
      </div>
      <div style={{ margin: "2px 0 10px" }}>
        <StageLadder stage={record.stage} size="sm" />
      </div>

      {record.objective && (
        <div className="dsr-rc-note obj">
          <span>Objective</span>
          <p>{record.objective}</p>
        </div>
      )}
      {record.outcome && (
        <div className="dsr-rc-note out">
          <span>Visit outcome</span>
          <p>{record.outcome}</p>
        </div>
      )}

      <footer className="dsr-rc-f">
        <button
          className="dsr-rc-more"
          onClick={() => setExpanded((p) => !p)}
          aria-expanded={expanded}
        >
          <Icon
            name={expanded ? "chevronUp" : "chevronDown"}
            size={13}
            strokeWidth={2.2}
          />
          {expanded ? "Less" : "Financials"}
        </button>
        <div className="dsr-rc-acts">
          <button className="dsr-rc-btn" onClick={onOpen} title="Visit history">
            <Icon name="records" size={13} strokeWidth={2} /> History
          </button>
          <button className="dsr-rc-btn info" onClick={() => onEdit(record)}>
            <Icon name="edit" size={13} strokeWidth={2} /> Edit
          </button>
          <button
            className={`dsr-rc-btn danger${armed ? " armed" : ""}`}
            onClick={askDelete}
            aria-label="Delete record"
          >
            <Icon name="trash" size={13} strokeWidth={2} />
            {armed && " Confirm?"}
          </button>
        </div>
      </footer>

      {expanded && (
        <div className="dsr-rc-fin">
          {[
            ["Pot. Dyes", record.potDyes],
            ["Pot. Aux", record.potAux],
            ["Ex. Dyes", record.exDyes],
            ["Ex. Aux", record.exAux],
            ["ABP AM26", record.abp],
            ["YTD sale", record.ytd],
          ].map(([k, v]) => (
            <div key={k}>
              <span>{k}</span>
              <b className="dsr-mono">₹{v}L</b>
            </div>
          ))}
          <div className="wide">
            <span>Total potential</span>
            <b className="dsr-mono" style={{ color: DS.primary }}>
              ₹{recPot(record).toFixed(2)}L/mth
            </b>
          </div>
          <div className="wide">
            <span>Total existing</span>
            <b className="dsr-mono" style={{ color: DS.info }}>
              ₹{(toNum(record.exDyes) + toNum(record.exAux)).toFixed(2)}L/mth
            </b>
          </div>
        </div>
      )}
    </article>
  );
};

const RecordRows = ({ rows, onOpen, onEdit, onDelete }) => (
  <div className="dsr-rt-wrap">
    <div className="dsr-rt">
      <div className="dsr-rt-r head">
        <span>Customer</span>
        <span>Date</span>
        <span>Area</span>
        <span>Distributor</span>
        <span>Stage</span>
        <span>YTD/ABP</span>
        <span />
      </div>
      {rows.map((r) => {
        const sc = stageColor(r.stage);
        const id = r._id || r.id;
        return (
          <div key={id} className="dsr-rt-r" style={{ "--sc": sc.border }}>
            <button className="dsr-rt-name" onClick={() => onOpen(r.customer)}>
              <span
                className="dsr-rc-av sm"
                style={{ "--h": dsrHue(r.customer) }}
              >
                {dsrInitials(r.customer)}
              </span>
              {r.customer}
            </button>
            <span>
              {fmtDate(r.date)}
              <small>{agoLabel(r.date)}</small>
            </span>
            <span>{r.area || "—"}</span>
            <span>{r.distributor || "—"}</span>
            <span>
              <em
                className="dsr-rc-letter"
                style={{
                  background: sc.bg,
                  color: sc.text,
                  borderColor: sc.border,
                }}
                title={r.stage}
              >
                {stageLetter(r.stage) || "–"}
              </em>
            </span>
            <span
              className="dsr-mono"
              style={{ color: pctColor(r.pct), fontWeight: 600 }}
            >
              {r.pct}%
            </span>
            <span className="acts">
              <button
                className="dsr-rc-btn info icon"
                onClick={() => onEdit(r)}
                aria-label="Edit record"
              >
                <Icon name="edit" size={13} strokeWidth={2} />
              </button>
              <button
                className="dsr-rc-btn danger icon"
                onClick={() => onDelete(id)}
                aria-label="Delete record"
              >
                <Icon name="trash" size={13} strokeWidth={2} />
              </button>
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

const RecordsInsights = ({
  latest,
  todayCount,
  followCount,
  followOnly,
  onFollow,
  stage,
  onStage,
  topArea,
}) => {
  const counts = {};
  latest.forEach((r) => {
    const l = stageLetter(r.stage);
    if (l) counts[l] = (counts[l] || 0) + 1;
  });
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="dsr-ins">
      <div className="dsr-ins-card funnel">
        <div className="dsr-ins-t">Pipeline · customers by stage</div>
        <div className="dsr-fun" role="group" aria-label="Filter by stage">
          {PROJECT_STAGE_OPTIONS.map((st) => {
            const l = st[0];
            const n = counts[l] || 0;
            const col = stageColor(st).border;
            return (
              <button
                key={l}
                className={`dsr-fun-b${stage === l ? " on" : ""}`}
                style={{ "--c": col }}
                onClick={() => onStage(stage === l ? "" : l)}
                title={st}
                aria-pressed={stage === l}
              >
                <span className="n">{n}</span>
                <span className="bar">
                  <i style={{ height: `${Math.max(6, (n / max) * 100)}%` }} />
                </span>
                <span className="l">{l}</span>
              </button>
            );
          })}
        </div>
      </div>
      <button
        className={`dsr-ins-card stat${followOnly ? " on" : ""}`}
        onClick={onFollow}
        aria-pressed={followOnly}
      >
        <div className="dsr-ins-t">Follow-ups due</div>
        <div
          className="dsr-ins-v dsr-mono"
          style={{ color: followCount ? DS.warning : DS.success }}
        >
          {followCount}
        </div>
        <div className="dsr-ins-s">
          no visit in 14+ days · {followOnly ? "showing" : "tap to filter"}
        </div>
      </button>
      <div className="dsr-ins-card stat">
        <div className="dsr-ins-t">Visits today</div>
        <div className="dsr-ins-v dsr-mono" style={{ color: DS.text1 }}>
          {todayCount}
        </div>
        <div className="dsr-ins-s">
          {topArea ? `Top area: ${topArea}` : "no data yet"}
        </div>
      </div>
    </div>
  );
};

const RecordsToolbar = (p) => {
  const active = [
    p.preset !== "all" && [
      "preset",
      p.preset === "custom"
        ? "Custom range"
        : REC_PRESETS.find((x) => x[0] === p.preset)?.[1],
      () => p.setPreset("all"),
    ],
    p.stage && ["stage", `Stage ${p.stage}`, () => p.setStage("")],
    p.dist && ["dist", p.dist, () => p.setDist("")],
    p.area && ["area", p.area, () => p.setArea("")],
    p.followOnly && ["follow", "Follow-ups due", () => p.setFollowOnly(false)],
    p.q && ["q", `“${p.q}”`, () => p.setQ("")],
  ].filter(Boolean);
  return (
    <div className="dsr-tb">
      <div className="dsr-tb-row">
        <div className="dsr-tb-search">
          <span className="ic">
            <Icon name="search" size={15} strokeWidth={2} />
          </span>
          <input
            ref={p.searchRef}
            className="dsr-input"
            style={{ ...IS, paddingLeft: 36, paddingRight: 64 }}
            placeholder="Search customer, area, distributor, objective…"
            value={p.q}
            onChange={(e) => p.setQ(e.target.value)}
            aria-label="Search records"
          />
          {p.q ? (
            <button
              className="clr"
              onClick={() => p.setQ("")}
              aria-label="Clear search"
            >
              <Icon name="close" size={12} strokeWidth={2.4} />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </div>
        {p.exportNode}
      </div>
      <div className="dsr-tb-row chips" role="group" aria-label="Date range">
        {REC_PRESETS.map(([id, label]) => (
          <button
            key={id}
            className={`dsr-filter-chip${p.preset === id ? " active" : ""}`}
            onClick={() => p.setPreset(id)}
          >
            {label} <span className="cnt">{p.counts[id]}</span>
          </button>
        ))}
        <button
          className={`dsr-filter-chip${p.preset === "custom" ? " active" : ""}`}
          onClick={() => p.setPreset("custom")}
        >
          <Icon name="calendar" size={12} strokeWidth={2} /> Custom
        </button>
      </div>
      {p.preset === "custom" && (
        <div className="dsr-tb-custom">
          <span>From</span>
          <input
            type="date"
            value={p.start}
            onChange={(e) => p.setStart(e.target.value)}
            className="dsr-input"
            style={{ ...IS, height: 34, flex: 1 }}
            aria-label="From date"
          />
          <span>To</span>
          <input
            type="date"
            value={p.end}
            onChange={(e) => p.setEnd(e.target.value)}
            className="dsr-input"
            style={{ ...IS, height: 34, flex: 1 }}
            aria-label="To date"
          />
        </div>
      )}
      <div className="dsr-tb-row sel">
        <CustomSelect
          compact
          allowEmpty
          ariaLabel="Stage"
          style={{ maxWidth: 210 }}
          value={p.stage}
          onChange={(e) => p.setStage(e.target.value)}
        >
          <option value="">All stages</option>
          {PROJECT_STAGE_OPTIONS.map((st) => (
            <option key={st[0]} value={st[0]}>
              {st}
            </option>
          ))}
        </CustomSelect>
        <CustomSelect
          compact
          allowEmpty
          ariaLabel="Distributor"
          style={{ maxWidth: 210 }}
          value={p.dist}
          onChange={(e) => p.setDist(e.target.value)}
        >
          <option value="">All distributors</option>
          {p.dists.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </CustomSelect>
        <CustomSelect
          compact
          allowEmpty
          ariaLabel="Area"
          style={{ maxWidth: 210 }}
          value={p.area}
          onChange={(e) => p.setArea(e.target.value)}
        >
          <option value="">All areas</option>
          {p.areas.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </CustomSelect>
        <div className="grow" />
        <CustomSelect
          compact
          ariaLabel="Sort records"
          style={{ maxWidth: 210 }}
          value={p.sort}
          onChange={(e) => p.setSort(e.target.value)}
        >
          {REC_SORTS.map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </CustomSelect>
        <div className="dsr-seg2" role="group" aria-label="View">
          <button
            className={p.view === "cards" ? "on" : ""}
            onClick={() => p.setView("cards")}
            aria-label="Card view"
            title="Card view"
          >
            ▦
          </button>
          <button
            className={p.view === "table" ? "on" : ""}
            onClick={() => p.setView("table")}
            aria-label="Table view"
            title="Table view"
          >
            ☰
          </button>
        </div>
      </div>
      {(active.length > 0 || p.total !== p.shown) && (
        <div className="dsr-tb-row act">
          <span className="res">
            <b>{p.shown}</b> of {p.total} records
          </span>
          {active.map(([k, label, off]) => (
            <button key={k} className="dsr-x" onClick={off}>
              {label}
              <Icon name="close" size={10} strokeWidth={2.6} />
            </button>
          ))}
          {active.length > 0 && (
            <button className="dsr-x clear" onClick={p.onClear}>
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const MonthAnalysisList = ({ rows, onOpen }) => (
  <div className="dsr-mlist" role="table" aria-label="Monthly visit analysis">
    <div className="dsr-mrow head" role="row">
      <span role="columnheader">Month</span>
      <span role="columnheader" className="num">
        Visits
      </span>
      <span role="columnheader" className="num">
        Customers
      </span>
      <span role="columnheader" className="num hide-sm">
        Potential
      </span>
      <span role="columnheader" className="num hide-sm">
        Avg YTD/ABP
      </span>
      <span role="columnheader" className="hide-sm">
        Vs last month
      </span>
      <span role="columnheader" />
    </div>
    {rows.map(({ month, delta }) => (
      <button
        key={month.key}
        type="button"
        role="row"
        className="dsr-mrow"
        onClick={() => onOpen(month)}
        aria-label={`Open full report for ${month.label}`}
      >
        <span className="mon" role="cell">
          {month.label}
        </span>
        <span className="num" role="cell">
          {month.totalVisits}
        </span>
        <span className="num" role="cell">
          {month.uniqueCustomers}
        </span>
        <span className="num hide-sm" role="cell">{`₹${month.totalPot}L`}</span>
        <span className="num hide-sm" role="cell">{`${month.avgPct}%`}</span>
        <span
          className="chg hide-sm"
          role="cell"
          style={{
            color:
              delta === null || delta === 0
                ? DS.text3
                : delta > 0
                  ? DS.success
                  : DS.danger,
          }}
        >
          {delta === null || delta === 0
            ? "—"
            : `${delta > 0 ? "+" : ""}${delta} visits`}
        </span>
        <span className="go" role="cell">
          Full report ›
        </span>
      </button>
    ))}
  </div>
);

const MonthAnalysisCard = ({ month, delta, onOpen }) => (
  <div
    className="dsr-record-card dsr-half-card"
    style={{
      background: DS.card,
      border: `1px solid ${DS.border}`,
      borderRadius: 14,
      overflow: "hidden",
    }}
  >
    <div
      role="button"
      tabIndex={0}
      title="Open full report"
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      style={{ padding: "14px 14px 16px", cursor: "pointer" }}
    >
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
          className="dsr-display"
          style={{
            fontSize: 17,
            color: DS.text1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            minWidth: 0,
          }}
        >
          {month.label}
          {delta !== null && delta !== 0 && (
            <span
              style={{
                fontFamily: "'Manrope',sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: delta > 0 ? DS.success : DS.danger,
              }}
            >
              {delta > 0 ? `▲ +${delta}` : `▼ ${delta}`} vs last mth
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: DS.primary,
              background: DS.primaryDim,
              border: "1px solid rgba(212,175,106,0.35)",
              borderRadius: 20,
              padding: "5px 12px",
              whiteSpace: "nowrap",
            }}
          >
            Full report ›
          </span>
        </div>
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {[
          [
            ["Visits", month.totalVisits, DS.info],
            ["Customers", month.uniqueCustomers, DS.primary],
          ],
          [
            ["Potential", `₹${month.totalPot}L`, DS.gold],
            ["Avg YTD/ABP", `${month.avgPct}%`, DS.purple],
          ],
        ].map((row, ri) => (
          <div
            key={ri}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 8,
            }}
          >
            {row.map(([lbl, val, clr]) => (
              <div
                key={lbl}
                style={{
                  textAlign: "center",
                  padding: ri === 0 ? "12px 6px" : "9px 6px",
                  background: ri === 0 ? DS.card : DS.surface,
                  borderRadius: 10,
                  border: `1px solid ${ri === 0 ? DS.borderHi : DS.border}`,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: DS.text3,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  {lbl}
                </div>
                <div
                  className="dsr-mono"
                  style={{
                    fontSize: ri === 0 ? 22 : 14,
                    fontWeight: 500,
                    color: DS.text1,
                  }}
                >
                  {val}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TABS = [
  {
    id: "records",
    icon: "records",
    label: "Records",
    hint: "All visit entries",
  },
  {
    id: "add",
    icon: "addRecord",
    label: "Add Record",
    hint: "Log a new visit",
  },
  {
    id: "customers",
    icon: "store",
    label: "Customers",
    hint: "Customer master",
  },
  {
    id: "analysis",
    icon: "trending",
    label: "Analysis",
    hint: "Monthly insights",
  },
];

const Sidebar = ({ active, onChange, recordCount }) => (
  <div
    className="dsr-sidebar"
    style={{
      background: DS.sidebar,
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
            background: DS.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 900,
            color: "#0A0B10",
            flexShrink: 0,
          }}
        >
          D
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: DS.text1,
              letterSpacing: "-0.01em",
            }}
          >
            DSR
          </div>
          <div
            style={{
              fontSize: 12,
              color: DS.text3,
              fontWeight: 500,
            }}
          >
            Sales Management
          </div>
        </div>
      </div>
    </div>
   
    <nav className="dsr-nv" aria-label="DSR sections">
      <div className="dsr-nv-lab">Workspace</div>
      <div className="dsr-nv-list">
        <span
          className="dsr-nv-ind"
          aria-hidden="true"
          style={{
            "--i": Math.max(
              0,
              TABS.findIndex((t) => t.id === active),
            ),
            opacity: TABS.some((t) => t.id === active) ? 1 : 0,
          }}
        />
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`dsr-nv-item${active === t.id ? " active" : ""}`}
            onClick={() => onChange(t.id)}
            aria-current={active === t.id ? "page" : undefined}
          >
            <span className="dsr-nv-ic">
              <Icon
                name={t.icon}
                size={17}
                strokeWidth={active === t.id ? 2.1 : 1.8}
              />
            </span>
            <span className="dsr-nv-t">
              <b>{t.label}</b>
              <small>{t.hint}</small>
            </span>
            {t.id === "records" && recordCount > 0 && (
              <span className="dsr-nv-cnt">{recordCount}</span>
            )}
            {t.id === "add" && (
              <kbd className="dsr-nv-kbd" title="Keyboard shortcut">
                N
              </kbd>
            )}
          </button>
        ))}
      </div>
    </nav>
    <div className="dsr-nv-foot">
      <Icon name="calendar" size={12} strokeWidth={2} />
      <div>
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
  <nav
    className="dsr-mobile-tabbar dsr-mtb"
    aria-label="DSR sections"
    style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      justifyContent: "space-around",
    }}
  >
    <button onClick={() => window.history.back()} aria-label="Back">
      <span className="ic">
        <Icon name="back" size={18} strokeWidth={1.9} />
      </span>
      <span>Back</span>
    </button>
    {TABS.map((t) => (
      <button
        key={t.id}
        className={active === t.id ? "active" : ""}
        onClick={() => onChange(t.id)}
        aria-current={active === t.id ? "page" : undefined}
      >
        <span className="ic">
          <Icon
            name={t.icon}
            size={18}
            strokeWidth={active === t.id ? 2.2 : 1.8}
          />
        </span>
        <span>{t.label.replace("Add Record", "Add")}</span>
        {t.id === "records" && recordCount > 0 && (
          <i className="badge">{recordCount > 99 ? "99+" : recordCount}</i>
        )}
      </button>
    ))}
    <button onClick={() => onChange("records")} aria-label="Home">
      <span className="ic">
        <Icon name="home" size={18} strokeWidth={1.8} />
      </span>
      <span>Home</span>
    </button>
  </nav>
);

const SectionCard = ({ title, children, style }) => (
  <div
    style={{
      background: DS.card,
      border: `1px solid ${DS.border}`,
      borderRadius: 14,
      padding: "17px",
      marginBottom: 14,
      boxShadow: "var(--ds-shadow-card)",
      ...style,
    }}
  >
    {title && (
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: DS.text3,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
//  PAGES  (popups ab full pages hain)
//  /DailySalesReport/customer/new
//  /DailySalesReport/customer/:name/edit
//  /DailySalesReport/customer/:name/history
//  /DailySalesReport/visits/:name/:monthKey
//  /DailySalesReport/analysis/:monthKey/:period/by/:stage|distributor|area[/:value]
//  /DailySalesReport/record/:id/edit
// ══════════════════════════════════════════════════════════════════════════
const BASE = "/DailySalesReport";
const ROUTES = {
  base: BASE,
  newCustomer: `${BASE}/customer/new`,
  editCustomer: (n) => `${BASE}/customer/${encodeURIComponent(n)}/edit`,
  history: (n) => `${BASE}/customer/${encodeURIComponent(n)}/history`,
  visits: (n, monthKey, half) =>
    `${BASE}/visits/${encodeURIComponent(n)}/${encodeURIComponent(monthKey)}${half ? `?half=${half}` : ""}`,
  period: (monthKey, period) =>
    `${BASE}/analysis/${encodeURIComponent(monthKey)}/${period}`,
  insight: (monthKey, period, kind, value) =>
    `${BASE}/analysis/${encodeURIComponent(monthKey)}/${period}/by/${kind}${
      value ? `/${encodeURIComponent(value)}` : ""
    }`,
  editRecord: (id) => `${BASE}/record/${encodeURIComponent(id)}/edit`,
};

const safeDecode = (v) => {
  try {
    return decodeURIComponent(v);
  } catch {
    return v;
  }
};

const parseRoute = (pathname) => {
  const m = pathname
    .replace(/\/+$/, "")
    .match(/^\/dailysalesreport(?:\/(.*))?$/i);
  const seg = (m && m[1] ? m[1].split("/") : []).map(safeDecode);
  if (seg[0] === "customer" && seg[1] === "new" && seg.length === 2)
    return { type: "customerNew" };
  if (seg[0] === "customer" && seg[1] && seg[2] === "edit")
    return { type: "customerEdit", name: seg[1] };
  if (seg[0] === "customer" && seg[1] && seg[2] === "history")
    return { type: "history", name: seg[1] };
  if (seg[0] === "visits" && seg[1] && seg[2])
    return { type: "visits", name: seg[1], monthKey: seg[2] };
  if (
    seg[0] === "analysis" &&
    seg[1] &&
    seg[2] &&
    seg[3] === "by" &&
    INSIGHT_KINDS[seg[4]]
  )
    return {
      type: "insight",
      monthKey: seg[1],
      period: seg[2],
      kind: seg[4],
      value: seg[5],
    };
  if (seg[0] === "analysis" && seg[1] && seg[2] && !seg[3])
    return { type: "period", monthKey: seg[1], period: seg[2] };
  if (seg[0] === "record" && seg[1] && seg[2] === "edit")
    return { type: "recordEdit", id: seg[1] };
  return { type: "list" };
};

const daysSince = (d) => {
  const t = new Date(d).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
};
const fmtL = (n) => `₹${Math.round((Number(n) || 0) * 10) / 10}L`;

const HOME_PATH = "/";
const HOME_LABEL = "My Office Workplace";

const HomeLink = ({ compact = false }) => {
  const navigate = useNavigate();
  return (
    <a
      href={HOME_PATH}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return; // new tab still works
        e.preventDefault();
        navigate(HOME_PATH);
      }}
      title={`${HOME_LABEL} (home page)`}
      className="dsr-home-link"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        height: compact ? 26 : 30,
        padding: compact ? "0 10px 0 8px" : "0 12px 0 10px",
        borderRadius: 999,
        border: "1px solid rgba(212,175,106,0.30)",
        background: "rgba(212,175,106,0.06)",
        color: DS.primary,
        fontSize: compact ? 10.5 : 11.5,
        fontWeight: 600,
        textDecoration: "none",
        whiteSpace: "nowrap",
        marginBottom: compact ? 8 : 0,
        transition: "background .15s",
      }}
    >
      <Icon name="home" size={compact ? 12 : 13} strokeWidth={2.2} />
      {HOME_LABEL}
    </a>
  );
};

// ── PageShell — premium full page frame (top bar + hero + content/aside) ───
const PageShell = ({
  eyebrow,
  title,
  subtitle,
  avatar,
  badge,
  onBack,
  actions,
  aside,
  children,
  maxWidth = 1180,
  homeGuard = false,
}) => {
  const navigate = useNavigate();
  const goHome = () => {
    if (
      homeGuard &&
      !window.confirm("You have unsaved changes. Leave this page?")
    )
      return;
    navigate(HOME_PATH);
  };
  return (
    <div
      className="dsr-pages"
      style={{ minHeight: "100vh", background: DS.bg, color: DS.text1 }}
    >
      <div className="dsr-pagebar">
        <div
          style={{
            maxWidth,
            margin: "0 auto",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button className="dsr-back-btn" onClick={onBack}>
            <Icon name="back" size={14} strokeWidth={2.2} /> Back
          </button>
          <button
            className="dsr-back-btn"
            onClick={goHome}
            title={`${HOME_LABEL} (home page)`}
            aria-label={`${HOME_LABEL} home page`}
            style={{ padding: "0 12px" }}
          >
            <Icon name="home" size={14} strokeWidth={2.2} />
            <span className="dsr-home-text">{HOME_LABEL}</span>
          </button>
          <div
            style={{
              minWidth: 0,
              flex: 1,
              fontSize: 12,
              color: DS.text2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <button
              onClick={() => navigate(BASE)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "inherit",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              Daily Sales Report
            </button>
            <span style={{ color: DS.text3, margin: "0 7px" }}>/</span>
            <span style={{ color: DS.primary, fontWeight: 600 }}>
              {eyebrow}
            </span>
          </div>
          {actions && (
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {actions}
            </div>
          )}
        </div>
      </div>

      <div
        className="dsr-page-enter"
        style={{ maxWidth, margin: "0 auto", padding: "26px 16px 72px" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          {avatar && (
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: "50%",
                background: DS.surface,
                border: `1px solid ${DS.primary}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 600,
                color: DS.primary,
                flexShrink: 0,
              }}
            >
              {avatar}
            </div>
          )}
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1
              className="dsr-display"
              style={{
                margin: 0,
                fontSize: "clamp(22px,4.2vw,34px)",
                lineHeight: 1.15,
                color: DS.text1,
                wordBreak: "break-word",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <div style={{ fontSize: 12.5, color: DS.text2, marginTop: 5 }}>
                {subtitle}
              </div>
            )}
          </div>
          {badge}
        </div>
        <hr className="dsr-gold-rule" style={{ marginBottom: 22 }} />
        <div className={`dsr-page-grid${aside ? " has-aside" : ""}`}>
          <div style={{ minWidth: 0 }}>{children}</div>
          {aside && <aside className="dsr-aside-sticky">{aside}</aside>}
        </div>
      </div>
    </div>
  );
};

const PageLoading = ({ onBack, eyebrow = "Loading" }) => (
  <PageShell eyebrow={eyebrow} title="Loading…" onBack={onBack} maxWidth={900}>
    <div style={{ display: "grid", gap: 14 }}>
      <div className="dsr-skeleton" style={{ height: 110 }} />
      <div className="dsr-skeleton" style={{ height: 220 }} />
      <div className="dsr-skeleton" style={{ height: 160 }} />
    </div>
  </PageShell>
);

const PageNotFound = ({ onBack, what }) => (
  <PageShell
    eyebrow="Not found"
    title={`${what} not found`}
    onBack={onBack}
    maxWidth={900}
  >
    <div
      className="dsr-glass"
      style={{ borderRadius: 16, padding: "44px 20px", textAlign: "center" }}
    >
      <div className="dsr-empty-icon">
        <Icon
          name="alert"
          size={26}
          strokeWidth={1.6}
          style={{ color: DS.primary }}
        />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600 }}>
        {what} is not available
      </div>
      <div style={{ fontSize: 12.5, color: DS.text2, margin: "6px 0 18px" }}>
        It may have been deleted, or the link is incorrect.
      </div>
      <button className="dsr-ghost-btn" onClick={onBack}>
        <Icon name="back" size={14} /> Go back
      </button>
    </div>
  </PageShell>
);

const StatTile = ({ label, value, sub, accent = DS.primary }) => (
  <div
    className="dsr-glass"
    style={{ borderRadius: 14, padding: "14px 15px", minWidth: 0 }}
  >
    <div
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: DS.text3,
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      className="dsr-mono"
      style={{
        fontSize: 20,
        fontWeight: 600,
        color: accent,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 12, color: DS.text2, marginTop: 3 }}>{sub}</div>
    )}
  </div>
);

const SubHead = ({ icon, children }) => (
  <div
    style={{
      fontSize: 12,
      fontWeight: 600,
      color: DS.text3,
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 6,
    }}
  >
    {icon && <Icon name={icon} size={12} strokeWidth={2} />} {children}
  </div>
);

const Grid2 = ({ children }) => (
  <div
    className="dsr-grid2"
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(2,minmax(0,1fr))",
      gap: 12,
    }}
  >
    {children}
  </div>
);

const SaveBar = ({ onCancel, onSave, saving, label, dirty }) => (
  <div className="dsr-sticky-actions">
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {dirty && (
        <span
          style={{
            fontSize: 12,
            color: DS.amber,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 5,
            marginRight: "auto",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: DS.amber,
            }}
          />
          Unsaved changes
        </span>
      )}
      <button
        className="dsr-ghost-btn"
        onClick={onCancel}
        style={{ marginLeft: dirty ? 0 : "auto", height: 42 }}
      >
        Cancel
      </button>
      <button
        className="dsr-btn-primary"
        onClick={onSave}
        disabled={saving}
        style={{
          height: 42,
          padding: "0 26px",
          border: "none",
          borderRadius: 10,
          fontSize: 13.5,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "#0A0B10",
          minWidth: 170,
        }}
      >
        {saving ? (
          <span
            className="dsr-spinner"
            style={{
              width: 14,
              height: 14,
              border: "2px solid rgba(0,0,0,0.2)",
              borderTopColor: "#0A0B10",
              margin: 0,
            }}
          />
        ) : (
          <Icon name="check" size={15} strokeWidth={2.4} />
        )}
        {saving ? "Saving…" : label}
      </button>
    </div>
  </div>
);

const DangerZone = ({ title, text, label, onClick }) => (
  <div
    style={{
      marginTop: 6,
      border: "1px solid rgba(244,63,94,0.30)",
      background: "rgba(244,63,94,0.05)",
      borderRadius: 14,
      padding: "16px 17px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      flexWrap: "wrap",
    }}
  >
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: DS.danger }}>
        {title}
      </div>
      <div style={{ fontSize: 12, color: DS.text2, marginTop: 3 }}>{text}</div>
    </div>
    <button
      className="dsr-btn-danger"
      onClick={onClick}
      style={{
        height: 38,
        padding: "0 16px",
        background: "rgba(244,63,94,0.10)",
        color: DS.danger,
        border: "1px solid rgba(244,63,94,0.35)",
        borderRadius: 10,
        fontSize: 12.5,
        fontWeight: 600,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      <Icon name="trash" size={13} strokeWidth={2} /> {label}
    </button>
  </div>
);

// unsaved-changes guard (tab close / refresh)
const useUnsavedGuard = (dirty) => {
  useEffect(() => {
    if (!dirty) return undefined;
    const h = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
};

const confirmLeave = (dirty, fn) => () => {
  if (dirty && !window.confirm("You have unsaved changes. Leave this page?"))
    return;
  fn();
};

// ── VisitCard — one visit, shared by History & Visits pages ────────────────
const VisitCard = ({ r, index, total, onEdit }) => {
  const sc = stageColor(r.stage);
  const isLatest = index === 0;
  const block = (icon, label, text, accent, tint) => (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        background: tint,
        border: `1px solid color-mix(in srgb, ${accent} 18.0%, transparent)`,
        borderRadius: 12,
        padding: "11px 14px",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `color-mix(in srgb, ${accent} 12.2%, transparent)`,
          color: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Icon name={icon} size={14} strokeWidth={2.1} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: accent,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: DS.text1,
            lineHeight: 1.5,
            wordBreak: "break-word",
          }}
        >
          {text || (
            <span style={{ color: DS.text3, fontWeight: 500 }}>— none —</span>
          )}
        </div>
      </div>
    </div>
  );
  return (
    <div
      className="dsr-record-card"
      style={{
        background: DS.card,
        border: `1px solid ${isLatest ? DS.primary + "99" : DS.border}`,
        borderRadius: 16,
        padding: "15px 16px 16px",
        boxShadow: isLatest ? `0 0 0 1px ${DS.primaryDim}` : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 13,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Icon
            name="calendar"
            size={15}
            strokeWidth={2}
            style={{ color: DS.primary }}
          />
          {fmtDate(r.date) || "Date missing"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="dsr-mono"
            style={{ fontSize: 12, color: DS.text3, fontWeight: 600 }}
          >
            #{total - index}
          </span>
          {isLatest && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#0A0B10",
                background: DS.primary,
                padding: "3px 10px",
                borderRadius: 20,
              }}
            >
              LATEST
            </span>
          )}
          {onEdit && (
            <button
              className="dsr-btn-edit"
              onClick={() => onEdit(r)}
              style={{
                height: 30,
                padding: "0 12px",
                borderRadius: 8,
                border: `1px solid ${DS.border}`,
                background: "color-mix(in srgb, var(--wash) 3.0%, transparent)",
                color: DS.text2,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <Icon name="edit" size={12} strokeWidth={2} /> Edit
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {block(
          "pin",
          "Objective",
          r.objective,
          DS.primary,
          "rgba(212,175,106,0.06)",
        )}
        {block(
          "check",
          "Visit outcome",
          r.outcome,
          "#8FB4E8",
          "rgba(143,180,232,0.06)",
        )}
      </div>
    </div>
  );
};

const downloadBlob = (blob, filename) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
};

const exportCustomerHistory = (name, customer, records) => {
  const rows = [
    [
      "Date",
      "Customer",
      "Area",
      "Distributor",
      "Stage",
      "Objective",
      "Outcome",
      "Potential Dyes",
      "Potential Aux",
      "Existing Dyes",
      "Existing Aux",
      "ABP AM26",
      "YTD",
      "YTD vs ABP %",
    ],
    ...records.map((r) => [
      fmtDate(r.date),
      name,
      r.area || customer?.area || "",
      r.distributor || customer?.distributor || "",
      r.stage || "",
      r.objective || "",
      r.outcome || "",
      toNum(r.potDyes),
      toNum(r.potAux),
      toNum(r.exDyes),
      toNum(r.exAux),
      toNum(r.abp),
      toNum(r.ytd),
      r.pct ?? 0,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = rows[0].map((_, i) => ({ wch: i === 5 || i === 6 ? 36 : 16 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Visit history");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `${name.replace(/[^\w\- ]+/g, "")}_history.xlsx`,
  );
};

// ── Mini potential/existing meter used in side panels ─────────────────────
const PotentialMeter = ({ pot, ex }) => {
  const headroom = Math.max(0, pot - ex);
  const pen = pot > 0 ? Math.min(100, (ex / pot) * 100) : 0;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 7,
        }}
      >
        <span style={{ fontSize: 12, color: DS.text2, fontWeight: 600 }}>
          Market penetration
        </span>
        <span
          className="dsr-mono"
          style={{ fontSize: 12, fontWeight: 600, color: pctColor(pen) }}
        >
          {pen.toFixed(0)}%
        </span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 5,
          background: DS.border,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pen}%`,
            height: "100%",
            background: DS.primary,
            transition: "width .5s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 12,
          color: DS.text2,
        }}
      >
        <span>Existing {fmtL(ex)}</span>
        <span style={{ color: DS.text1, fontWeight: 600 }}>
          Headroom {fmtL(headroom)}
        </span>
      </div>
    </div>
  );
};

// ── Contact helpers ────────────────────────────────────────────────────────
const ActionLink = ({
  href,
  icon,
  label,
  color = DS.text1,
  disabled,
  external,
}) => (
  <a
    href={disabled ? undefined : href}
    target={external ? "_blank" : undefined}
    rel={external ? "noopener noreferrer" : undefined}
    onClick={(e) => disabled && e.preventDefault()}
    aria-disabled={disabled}
    className="dsr-ghost-btn"
    style={{
      flex: 1,
      minWidth: 0,
      textDecoration: "none",
      color: disabled ? DS.text3 : color,
      opacity: disabled ? 0.45 : 1,
      pointerEvents: disabled ? "none" : "auto",
    }}
  >
    <Icon name={icon} size={14} strokeWidth={2} /> {label}
  </a>
);

const ContactCard = ({ data, name, onEdit }) => {
  const mob = cleanMobile(data.mobile);
  const alt = cleanMobile(data.altMobile);
  const has =
    data.contactPerson ||
    mob ||
    alt ||
    data.email ||
    data.address ||
    data.gstin;
  return (
    <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
      <SubHead icon="user">Contact</SubHead>
      {!has ? (
        <div style={{ fontSize: 12, color: DS.text2, lineHeight: 1.5 }}>
          No contact details yet.
          {onEdit && (
            <button
              className="dsr-ghost-btn"
              style={{ width: "100%", marginTop: 12 }}
              onClick={onEdit}
            >
              <Icon name="addRecord" size={14} /> Add contact
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: DS.primaryDim,
                border: `1px solid color-mix(in srgb, ${DS.primary} 33%, transparent)`,
                color: DS.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="user" size={18} strokeWidth={1.9} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {data.contactPerson || name || "—"}
              </div>
              {data.designation && (
                <div style={{ fontSize: 12, color: DS.text2 }}>
                  {data.designation}
                </div>
              )}
            </div>
          </div>
          {[
            ["phone", mob && fmtMobile(mob)],
            ["phone", alt && `${fmtMobile(alt)} (alt)`],
            ["mail", data.email],
            ["pin", data.address],
          ]
            .filter(([, v]) => v)
            .map(([ic, v], i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 9,
                  alignItems: "flex-start",
                  fontSize: 12,
                  padding: "6px 0",
                  borderTop: i ? `1px dashed ${DS.border}` : "none",
                  wordBreak: "break-word",
                }}
              >
                <Icon
                  name={ic}
                  size={13}
                  strokeWidth={2}
                  style={{ color: DS.primary, marginTop: 2 }}
                />
                <span className={ic === "phone" ? "dsr-mono" : undefined}>
                  {v}
                </span>
              </div>
            ))}
          {data.gstin && (
            <div style={{ marginTop: 8, fontSize: 12, color: DS.text2 }}>
              GSTIN{" "}
              <span
                className="dsr-mono"
                style={{ color: DS.text1, fontWeight: 600 }}
              >
                {data.gstin}
              </span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <ActionLink
              href={`tel:+91${mob}`}
              icon="phone"
              label="Call"
              color={DS.success}
              disabled={!isValidMobile(mob)}
            />
            <ActionLink
              href={`https://wa.me/91${mob}`}
              icon="whatsapp"
              label="WhatsApp"
              color="#25D366"
              external
              disabled={!isValidMobile(mob)}
            />
          </div>
          {data.email && (
            <div style={{ display: "flex", marginTop: 8 }}>
              <ActionLink
                href={`mailto:${data.email}`}
                icon="mail"
                label="Email"
                color={DS.info}
                disabled={!isValidEmail(data.email)}
              />
            </div>
          )}
          {isValidMobile(mob) && (
            <button
              className="dsr-ghost-btn"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => navigator.clipboard?.writeText(mob)}
            >
              <Icon name="copy" size={13} /> Copy number
            </button>
          )}
        </>
      )}
    </div>
  );
};

const FieldNote = ({ type = "error", children }) =>
  children ? (
    <div
      style={{
        fontSize: 12,
        marginTop: -6,
        marginBottom: 10,
        fontWeight: 600,
        color:
          type === "error"
            ? DS.danger
            : type === "warn"
              ? DS.amber
              : DS.success,
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {children}
    </div>
  ) : null;

const MobileInput = ({
  label,
  name,
  value,
  onChange,
  required,
  placeholder,
}) => {
  const ok = isValidMobile(value);
  return (
    <div style={{ marginBottom: 12 }}>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div style={{ position: "relative" }}>
        <span
          className="dsr-mono"
          style={{
            position: "absolute",
            left: 1,
            top: 1,
            bottom: 1,
            width: 42,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
            color: DS.primary,
            background: DS.primaryDim,
            borderRadius: "7px 0 0 7px",
            borderRight: `1px solid ${DS.border}`,
          }}
        >
          +91
        </span>
        <input
          className="dsr-input"
          style={{
            ...IS,
            paddingLeft: 54,
            paddingRight: 34,
          }}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || "98765 43210"}
          maxLength={14}
        />
        {value && (
          <span
            style={{
              position: "absolute",
              right: 11,
              top: 11,
              color: ok ? DS.success : DS.danger,
            }}
          >
            <Icon name={ok ? "check" : "alert"} size={15} strokeWidth={2.3} />
          </span>
        )}
      </div>
      {value && !ok && (
        <div
          style={{
            fontSize: 12,
            marginTop: 5,
            color: DS.danger,
            fontWeight: 600,
          }}
        >
          {cleanMobile(value).length < 10
            ? `${10 - cleanMobile(value).length} more digit(s) needed`
            : "Number 6–9 se start hona chahiye"}
        </div>
      )}
    </div>
  );
};

// ═════════ PAGE 1 — Customer Add / Edit ═══════════════════════════════════
const CustomerFormPage = ({
  mode,
  editName,
  initialData,
  lastRecord,
  visitCount,
  allCustomers = {},
  onOpenOther,
  onSave,
  onDelete,
  onCancel,
  onOpenHistory,
  saving,
}) => {
  const isEdit = mode === "edit";
  const [name, setName] = useState(editName || "");
  const [data, setData] = useState(initialData || EMPTY_CUSTOMER);
  const dirty =
    name !== (editName || "") ||
    JSON.stringify(data) !== JSON.stringify(initialData || EMPTY_CUSTOMER);
  useUnsavedGuard(dirty);
  const handleChange = (e) => {
    const { name: f, value } = e.target;
    let v = value;
    if (f === "mobile" || f === "altMobile") v = cleanMobile(value);
    if (f === "gstin")
      v = value
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, "")
        .slice(0, 15);
    setData((p) => ({ ...p, [f]: v }));
  };
  const pot = toNum(data.potDyes) + toNum(data.potAux);

  // duplicate checks (warnings)
  const nameKey = name.trim().toLowerCase();
  const dupName =
    nameKey &&
    Object.keys(allCustomers).find(
      (k) => k.toLowerCase() === nameKey && k !== editName,
    );
  const dupMobile = (m) =>
    isValidMobile(m)
      ? Object.entries(allCustomers).find(
          ([k, c]) => k !== editName && (c.mobile === m || c.altMobile === m),
        )?.[0]
      : null;
  const dupMob = dupMobile(data.mobile);
  const profileFields = [
    data.contactPerson,
    data.designation,
    isValidMobile(data.mobile) && data.mobile,
    data.email,
    data.address,
    data.gstin,
    data.notes,
  ];
  const profilePct = Math.round(
    (profileFields.filter(Boolean).length / profileFields.length) * 100,
  );
  const ex = toNum(data.exDyes) + toNum(data.exAux);
  const required = [
    name.trim(),
    data.area,
    data.distributor,
    data.stage,
    data.potDyes !== "",
    data.potAux !== "",
    data.abp !== "",
  ];
  const done = required.filter(Boolean).length;
  const sc = stageColor(data.stage);

  const aside = (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <SubHead icon="sparkle">Live summary</SubHead>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: DS.primaryDim,
              border: `1px solid ${DS.primary}`,
              color: DS.primary,
              fontWeight: 600,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {getInitials(name || "?")}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name || "Customer name"}
            </div>
            <div style={{ fontSize: 12, color: DS.text2 }}>
              {data.area || "Area"} · {data.distributor || "Distributor"}
            </div>
          </div>
        </div>
        {data.stage && (
          <span
            style={{
              display: "inline-block",
              fontSize: 12,
              padding: "3px 9px",
              borderRadius: 5,
              fontWeight: 600,
              background: sc.bg,
              color: sc.text,
              border: `1px solid color-mix(in srgb, ${sc.border} 33.3%, transparent)`,
              marginBottom: 8,
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {data.stage}
          </span>
        )}
        <StageLadder stage={data.stage} />
        <div className="dsr-stat-grid" style={{ margin: "16px 0" }}>
          <StatTile label="Potential /mth" value={fmtL(pot)} />
          <StatTile
            label="ABP AM26"
            value={fmtL(toNum(data.abp))}
            accent={DS.gold}
          />
        </div>
        <PotentialMeter pot={pot} ex={ex} />
      </div>

      <ContactCard data={data} name={name} />

      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <SubHead icon="sparkle">Profile completeness</SubHead>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <span
            className="dsr-mono"
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: profilePct >= 70 ? DS.success : DS.primary,
            }}
          >
            {profilePct}%
          </span>
          <span style={{ fontSize: 12, color: DS.text2 }}>
            contact · GST · notes
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 4,
            background: DS.border,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${profilePct}%`,
              height: "100%",
              background: DS.primary,
              transition: "width .4s",
            }}
          />
        </div>
      </div>

      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <SubHead icon="check">Form checklist</SubHead>
        <div
          style={{
            height: 6,
            borderRadius: 4,
            background: DS.border,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: `${(done / required.length) * 100}%`,
              height: "100%",
              background: done === required.length ? DS.success : DS.primary,
              transition: "width .3s",
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: DS.text2 }}>
          {done}/{required.length} required fields complete
        </div>
      </div>

      {isEdit && (
        <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
          <SubHead icon="clock">Activity</SubHead>
          <div style={{ fontSize: 12.5, marginBottom: 12 }}>
            <span
              className="dsr-mono"
              style={{ color: DS.primary, fontWeight: 600 }}
            >
              {visitCount}
            </span>{" "}
            visit{visitCount === 1 ? "" : "s"} recorded
          </div>
          <CustomerLastRecord record={lastRecord} />
          <button
            className="dsr-ghost-btn"
            style={{ width: "100%" }}
            onClick={onOpenHistory}
          >
            <Icon name="records" size={14} /> View full visit history
          </button>
        </div>
      )}
    </div>
  );

  return (
    <PageShell
      eyebrow={isEdit ? "Edit customer" : "New customer"}
      title={isEdit ? editName : "Naya customer"}
      subtitle={
        isEdit ? "Update master data" : "Fill in the customer master data"
      }
      avatar={isEdit ? getInitials(editName) : "+"}
      onBack={confirmLeave(dirty, onCancel)}
      homeGuard={dirty}
      aside={aside}
      maxWidth={1100}
    >
      <SectionCard title="Basic details">
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
          {dupName && (
            <div
              style={{
                fontSize: 12,
                marginTop: 6,
                color: DS.amber,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Icon name="alert" size={13} /> A customer named "{dupName}"
              already exists.
              {onOpenOther && (
                <button
                  className="dsr-ghost-btn"
                  style={{ height: 26, padding: "0 10px", fontSize: 12 }}
                  onClick={() => onOpenOther(dupName)}
                >
                  Open ›
                </button>
              )}
            </div>
          )}
        </div>
        <Grid2>
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
        </Grid2>
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
      </SectionCard>

      <SectionCard title="Contact details">
        <Grid2>
          <FormInput
            label="Contact person"
            type="text"
            name="contactPerson"
            value={data.contactPerson}
            onChange={handleChange}
            placeholder="Person name"
            autoComplete="name"
          />
          <div style={{ marginBottom: 12 }}>
            <FieldLabel>Designation</FieldLabel>
            <input
              className="dsr-input"
              style={IS}
              type="text"
              name="designation"
              list="dsr-designations"
              value={data.designation}
              onChange={handleChange}
              placeholder="Owner, Manager…"
            />
            <datalist id="dsr-designations">
              {DESIGNATION_SUGGESTIONS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <MobileInput
            label="Mobile number"
            name="mobile"
            value={data.mobile}
            onChange={handleChange}
          />
          <MobileInput
            label="Alternate mobile"
            name="altMobile"
            value={data.altMobile}
            onChange={handleChange}
            placeholder="Optional"
          />
        </Grid2>
        {dupMob && (
          <FieldNote type="warn">
            <Icon name="alert" size={13} /> This mobile is also saved with "
            {dupMob}".
          </FieldNote>
        )}
        <FormInput
          label="Email"
          type="email"
          name="email"
          value={data.email}
          onChange={handleChange}
          placeholder="name@company.com"
          autoComplete="email"
        />
        {data.email && !isValidEmail(data.email) && (
          <FieldNote>Invalid email format</FieldNote>
        )}
        <FormInput
          label="Address / Location"
          type="text"
          name="address"
          value={data.address}
          onChange={handleChange}
          placeholder="Unit no., road, city"
        />
        <FormInput
          label="GSTIN"
          type="text"
          name="gstin"
          value={data.gstin}
          onChange={handleChange}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
          style={{ ...IS }}
        />
        {data.gstin && (
          <FieldNote type={isValidGSTIN(data.gstin) ? "ok" : "error"}>
            {isValidGSTIN(data.gstin)
              ? "GSTIN valid ✓"
              : `${data.gstin.length}/15 — format incomplete`}
          </FieldNote>
        )}
        <div style={{ marginBottom: 4 }}>
          <FieldLabel>Notes / remarks</FieldLabel>
          <textarea
            className="dsr-input"
            name="notes"
            value={data.notes}
            onChange={handleChange}
            placeholder="Preferred time, decision maker, special instructions…"
            style={{
              ...IS,
              height: 84,
              padding: "10px 12px",
              resize: "vertical",
              lineHeight: 1.5,
              fontFamily: "inherit",
            }}
          />
        </div>
      </SectionCard>

      <SectionCard title="Numbers (₹ Lakhs)">
        <Grid2>
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
        </Grid2>
        <FormInput
          label="ABP AM26"
          required
          type="number"
          name="abp"
          value={data.abp}
          onChange={handleChange}
          placeholder="0"
        />
      </SectionCard>

      {isEdit && (
        <DangerZone
          title="Delete customer"
          text="The customer master data will be removed. This action cannot be undone."
          label="Delete customer"
          onClick={() => onDelete(editName)}
        />
      )}

      <SaveBar
        dirty={dirty}
        saving={saving}
        onCancel={confirmLeave(dirty, onCancel)}
        onSave={() => onSave(name.trim(), data)}
        label={isEdit ? "Update customer" : "Save customer"}
      />
    </PageShell>
  );
};

// ═════════ PAGE 2 — Record Edit ═══════════════════════════════════════════
const RecordEditPage = ({
  record,
  customers,
  customerList,
  history,
  onSave,
  onDelete,
  onCancel,
  onOpenHistory,
  saving,
}) => {
  const initial = {
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
  };
  const [data, setData] = useState(initial);
  const dirty = JSON.stringify(data) !== JSON.stringify(initial);
  useUnsavedGuard(dirty);
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
  const abp = toNum(data.abp);
  const ytd = toNum(data.ytd);
  const livePct = abp > 0 ? (ytd / abp) * 100 : 0;
  const otherVisits = (history || []).filter((r) => (r._id || r.id) !== id);
  const prev = otherVisits.find(
    (r) => new Date(r.date) <= new Date(record.date),
  );

  const aside = (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <SubHead icon="trending">YTD vs ABP (live)</SubHead>
        <div
          className="dsr-mono"
          style={{ fontSize: 30, fontWeight: 600, color: pctColor(livePct) }}
        >
          {livePct.toFixed(1)}%
        </div>
        <div
          style={{
            height: 8,
            borderRadius: 5,
            background: DS.border,
            overflow: "hidden",
            margin: "10px 0 8px",
          }}
        >
          <div
            style={{
              width: `${Math.min(100, livePct)}%`,
              height: "100%",
              background: pctColor(livePct),
              transition: "width .4s",
            }}
          />
        </div>
        <div style={{ fontSize: 12, color: DS.text2 }}>
          {fmtL(ytd)} of {fmtL(abp)} ABP
        </div>
        <div style={{ marginTop: 14 }}>
          <StageLadder stage={data.stage} />
        </div>
      </div>

      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <SubHead icon="clock">Pichli visit</SubHead>
        {prev ? (
          <>
            <CustomerLastRecord record={prev} />
            <div style={{ fontSize: 12, color: DS.text2 }}>
              Outcome: {prev.outcome || "—"}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: DS.text2 }}>
            This is the customer's first visit.
          </div>
        )}
        <button
          className="dsr-ghost-btn"
          style={{ width: "100%", marginTop: 12 }}
          onClick={onOpenHistory}
        >
          <Icon name="records" size={14} /> {otherVisits.length + 1} visits ·
          history
        </button>
      </div>
    </div>
  );

  return (
    <PageShell
      eyebrow="Edit record"
      title={record.customer || "Record"}
      subtitle={`${fmtDate(record.date)} · visit record edit`}
      avatar={getInitials(record.customer || "?")}
      onBack={confirmLeave(dirty, onCancel)}
      homeGuard={dirty}
      aside={aside}
      maxWidth={1100}
    >
      <SectionCard title="Visit details">
        <Grid2>
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
        </Grid2>
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
      </SectionCard>

      <SectionCard title="Numbers (₹ Lakhs)">
        <Grid2>
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
        </Grid2>
      </SectionCard>

      <DangerZone
        title="Delete this record"
        text="Only this visit record will be deleted. The customer master data stays safe."
        label="Delete record"
        onClick={() => onDelete(id)}
      />

      <SaveBar
        dirty={dirty}
        saving={saving}
        onCancel={confirmLeave(dirty, onCancel)}
        onSave={() => onSave(id, data)}
        label="Update record"
      />
    </PageShell>
  );
};

// ═════════ PAGE 3 — Customer History ══════════════════════════════════════
const CustomerHistoryPage = ({
  name,
  customer,
  records,
  onBack,
  onEditCustomer,
  onAddVisit,
  onEditRecord,
  onOpenMonth,
}) => {
  const [q, setQ] = useState("");
  const total = records.length;
  const latest = records[0];
  const first = records[total - 1];
  const currentStage = latest?.stage || customer?.stage || "";
  const sc = stageColor(currentStage);
  const avgPct = total
    ? records.reduce((s, r) => s + (r.pct || 0), 0) / total
    : 0;
  const since = latest ? daysSince(latest.date) : null;
  const pot = toNum(customer?.potDyes) + toNum(customer?.potAux);
  const ex = toNum(customer?.exDyes) + toNum(customer?.exAux);

  const journey = useMemo(() => {
    const chrono = [...records].reverse();
    const out = [];
    let prev = null;
    chrono.forEach((r) => {
      if (r.stage && r.stage !== prev) {
        out.push({ stage: r.stage, date: r.date });
        prev = r.stage;
      }
    });
    return out;
  }, [records]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = [];
    const idx = {};
    records.forEach((r, i) => {
      if (
        needle &&
        !`${r.outcome || ""} ${r.objective || ""} ${r.stage || ""}`
          .toLowerCase()
          .includes(needle)
      )
        return;
      const d = new Date(r.date);
      const valid = !isNaN(d.getTime());
      const key = valid
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : "unknown";
      if (idx[key] === undefined) {
        idx[key] = out.length;
        out.push({
          key,
          label: valid
            ? d.toLocaleDateString("en-IN", { month: "long", year: "numeric" })
            : "Date missing",
          items: [],
        });
      }
      out[idx[key]].items.push({ r, i });
    });
    return out;
  }, [records, q]);

  const aside = (
    <div style={{ display: "grid", gap: 14 }}>
      <ContactCard
        data={pickContact(customer)}
        name={name}
        onEdit={onEditCustomer}
      />
      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <SubHead icon="store">Customer master</SubHead>
        <div className="dsr-stat-grid" style={{ marginBottom: 14 }}>
          <StatTile label="Potential /mth" value={fmtL(pot)} />
          <StatTile label="Existing /mth" value={fmtL(ex)} accent={DS.gold} />
          <StatTile
            label="ABP AM26"
            value={fmtL(customer?.abp)}
            accent={DS.gold}
          />
          <StatTile label="Latest YTD" value={fmtL(latest?.ytd)} />
        </div>
        <PotentialMeter pot={pot} ex={ex} />
      </div>

      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <SubHead icon="trending">Stage journey</SubHead>
        {journey.length === 0 ? (
          <div style={{ fontSize: 12, color: DS.text2 }}>
            No stage records yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 0 }}>
            {journey.map((j, i) => {
              const c = stageColor(j.stage);
              const isCur = i === journey.length - 1;
              return (
                <div
                  key={`${j.stage}-${i}`}
                  style={{ display: "flex", gap: 11 }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        background: isCur ? c.border : DS.surface,
                        border: `2px solid ${c.border}`,
                        marginTop: 4,
                      }}
                    />
                    {i < journey.length - 1 && (
                      <span
                        style={{
                          flex: 1,
                          width: 2,
                          background: DS.border,
                          minHeight: 22,
                        }}
                      />
                    )}
                  </div>
                  <div style={{ paddingBottom: 12, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: isCur ? 700 : 600,
                        color: isCur ? c.text : DS.text1,
                        lineHeight: 1.35,
                      }}
                    >
                      {j.stage}
                    </div>
                    <div style={{ fontSize: 12, color: DS.text3 }}>
                      {fmtDate(j.date)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <PageShell
      eyebrow="Customer history"
      title={name}
      subtitle={`${customer?.area || latest?.area || "—"} · ${customer?.distributor || latest?.distributor || "—"}`}
      avatar={getInitials(name)}
      onBack={onBack}
      aside={aside}
      badge={
        currentStage ? (
          <span
            style={{
              fontSize: 12,
              padding: "5px 11px",
              borderRadius: 6,
              fontWeight: 600,
              background: sc.bg,
              color: sc.text,
              border: `1px solid color-mix(in srgb, ${sc.border} 40.0%, transparent)`,
              maxWidth: 300,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentStage}
          </span>
        ) : null
      }
      actions={
        <>
          <button className="dsr-ghost-btn" onClick={onEditCustomer}>
            <Icon name="edit" size={13} /> Edit
          </button>
          <button
            className="dsr-btn-primary"
            onClick={onAddVisit}
            style={{
              height: 38,
              padding: "0 16px",
              border: "none",
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 600,
              color: "#0A0B10",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="addRecord" size={14} strokeWidth={2.2} /> Add visit
          </button>
        </>
      }
    >
      <div className="dsr-stat-grid cols4" style={{ marginBottom: 18 }}>
        <StatTile
          label="Total visits"
          value={total}
          sub={first ? `Since ${fmtDate(first.date)}` : ""}
        />
        <StatTile
          label="Last visit"
          value={latest ? fmtDate(latest.date) : "—"}
          sub={
            since === null ? "" : since === 0 ? "Today" : `${since} days ago`
          }
          accent={since !== null && since > 30 ? DS.warning : DS.gold}
        />
        <StatTile
          label="Avg YTD vs ABP"
          value={`${avgPct.toFixed(1)}%`}
          accent={pctColor(avgPct)}
        />
        <StatTile
          label="Stage steps"
          value={journey.length}
          sub="stage changes tracked"
          accent={DS.info}
        />
      </div>

      <div
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}
      >
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Icon
            name="search"
            size={14}
            style={{ position: "absolute", left: 12, top: 12, color: DS.text3 }}
          />
          <input
            className="dsr-input"
            style={{ ...IS, paddingLeft: 34, height: 40 }}
            placeholder="Outcome / objective / stage search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          className="dsr-ghost-btn"
          style={{ height: 40 }}
          disabled={!total}
          onClick={() => exportCustomerHistory(name, customer, records)}
        >
          <Icon name="download" size={14} /> Export Excel
        </button>
      </div>

      {total === 0 ? (
        <div
          className="dsr-glass"
          style={{
            borderRadius: 16,
            textAlign: "center",
            padding: "44px 16px",
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
          <div style={{ fontSize: 14.5, fontWeight: 600, color: DS.text1 }}>
            No visits yet
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Create this customer's first record with "Add visit"
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 30,
            color: DS.text2,
            fontSize: 13,
          }}
        >
          No visits match "{q}".
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key} style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
                fontSize: 12,
                fontWeight: 600,
                color: DS.text3,
              }}
            >
              <span>{g.label}</span>
              <span style={{ color: DS.primary }}>
                · {g.items.length} visit{g.items.length > 1 ? "s" : ""}
              </span>
              <span style={{ flex: 1, height: 1, background: DS.border }} />
              {g.key !== "unknown" && (
                <button
                  className="dsr-visits-btn"
                  onClick={() => onOpenMonth(g.key)}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: DS.primary,
                    background: DS.primaryDim,
                    border: `1px solid color-mix(in srgb, ${DS.primary} 33%, transparent)`,
                    borderRadius: 20,
                    padding: "3px 11px",
                    cursor: "pointer",
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  Month view →
                </button>
              )}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {g.items.map(({ r, i }) => (
                <VisitCard
                  key={r._id || r.id || i}
                  r={r}
                  index={i}
                  total={total}
                  onEdit={onEditRecord}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </PageShell>
  );
};

// ═════════ PAGE 4 — Month Visits ══════════════════════════════════════════
const VisitsPage = ({
  name,
  month,
  records,
  otherMonths,
  currentKey,
  onBack,
  onOpenHistory,
  onEditRecord,
  onOpenMonth,
}) => {
  const total = records.length;
  const latest = records[0];
  const avgPct = total
    ? records.reduce((s, r) => s + (r.pct || 0), 0) / total
    : 0;
  const sc = stageColor(latest?.stage);
  return (
    <PageShell
      eyebrow="Month visits"
      title={name}
      subtitle={`${month} · ${total} visit${total === 1 ? "" : "s"} (latest first)`}
      avatar={getInitials(name)}
      onBack={onBack}
      actions={
        <button className="dsr-ghost-btn" onClick={onOpenHistory}>
          <Icon name="records" size={13} /> Full history
        </button>
      }
      aside={
        otherMonths.length > 1 ? (
          <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
            <SubHead icon="calendar">Other months</SubHead>
            <div style={{ display: "grid", gap: 8 }}>
              {otherMonths.map((m) => (
                <button
                  key={m.key}
                  onClick={() => onOpenMonth(m.key)}
                  className="dsr-filter-chip"
                  style={{
                    justifyContent: "space-between",
                    borderRadius: 10,
                    padding: "9px 12px",
                    background: m.key === currentKey ? DS.primary : undefined,
                    color: m.key === currentKey ? "#0A0B10" : undefined,
                    borderColor: m.key === currentKey ? DS.primary : undefined,
                  }}
                >
                  <span>{m.label}</span>
                  <span className="dsr-mono">{m.visits}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null
      }
    >
      <div className="dsr-stat-grid cols4" style={{ marginBottom: 18 }}>
        <StatTile label="Visits" value={total} sub={month} />
        <StatTile
          label="Latest visit"
          value={latest ? fmtDate(latest.date) : "—"}
          accent={DS.gold}
        />
        <StatTile
          label="Avg YTD vs ABP"
          value={`${avgPct.toFixed(1)}%`}
          accent={pctColor(avgPct)}
        />
        <StatTile
          label="Latest YTD"
          value={fmtL(latest?.ytd)}
          accent={DS.info}
        />
      </div>
      {latest?.stage && (
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 6,
              fontWeight: 600,
              background: sc.bg,
              color: sc.text,
              border: `1px solid color-mix(in srgb, ${sc.border} 40.0%, transparent)`,
            }}
          >
            {latest.stage}
          </span>
          <StageLadder stage={latest.stage} size="sm" />
        </div>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        {records.map((r, i) => (
          <VisitCard
            key={r._id || r.id || i}
            r={r}
            index={i}
            total={total}
            onEdit={onEditRecord}
          />
        ))}
      </div>
    </PageShell>
  );
};

// ═════════ PAGE 5 — Period / Month Analysis Report ═══════════════════════
const Delta = ({ cur, prev, suffix = "", digits = 0 }) => {
  if (prev === null || prev === undefined) return null;
  const d = Number(cur) - Number(prev);
  if (!isFinite(d) || Math.abs(d) < 0.05) {
    return (
      <span style={{ fontSize: 12, color: DS.text3, fontWeight: 600 }}>
        — no change
      </span>
    );
  }
  const up = d > 0;
  return (
    <span
      className="dsr-mono"
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: up ? DS.success : DS.danger,
      }}
    >
      {up ? "▲ +" : "▼ "}
      {d.toFixed(digits)}
      {suffix}
    </span>
  );
};

const PanelHead = ({ icon, children, onOpen }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
    }}
  >
    <SubHead icon={icon}>{children}</SubHead>
    {onOpen && (
      <button className="dsr-viewall" onClick={onOpen}>
        Details
        <span style={{ transform: "rotate(45deg)", display: "flex" }}>
          <Icon name="arrowUp" size={11} strokeWidth={2.2} />
        </span>
      </button>
    )}
  </div>
);

const BarRow = ({ label, value, max, color = DS.primary, right, onClick }) => (
  <div
    className={onClick ? "dsr-bar-row" : undefined}
    style={onClick ? undefined : { marginBottom: 10 }}
    {...(onClick
      ? {
          role: "button",
          tabIndex: 0,
          onClick,
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          },
          title: "Open details",
        }
      : {})}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        fontSize: 12,
        marginBottom: 4,
      }}
    >
      <span
        style={{
          color: DS.text1,
          fontWeight: 600,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <span
        className="dsr-mono"
        style={{ color, fontWeight: 600, flexShrink: 0 }}
      >
        {right ?? value}
      </span>
    </div>
    <div
      style={{
        height: 6,
        borderRadius: 4,
        background: DS.border,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${max > 0 ? (value / max) * 100 : 0}%`,
          height: "100%",
          background: color,
          transition: "width .5s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════
//  INSIGHT PAGE  –  Stage / Distributor / Area deep-dive
//  /DailySalesReport/analysis/:monthKey/:period/by/:kind[/:value]
//  Period report ke side panels (Stage distribution, Distributor-wise visits,
//  Top areas) par click karne se yahan aate hain.
// ══════════════════════════════════════════════════════════════════════════
const INSIGHT_KINDS = {
  stage: { label: "Stage distribution", short: "Stage", icon: "sparkle" },
  distributor: {
    label: "Distributor-wise visits",
    short: "Distributor",
    icon: "store",
  },
  area: { label: "Top areas", short: "Area", icon: "pin" },
};

// customer ko uske LATEST visit ke hisaab se group mein daalte hain
const insightId = (kind, c) => {
  const l = c.latest || {};
  if (kind === "stage") return (l.stage || "").trim()[0]?.toUpperCase() || "-";
  if (kind === "distributor") return (l.distributor || "").trim() || "—";
  return (l.area || "").trim() || "—";
};
const insightLabel = (kind, id) => {
  if (kind !== "stage") return id;
  return PROJECT_STAGE_OPTIONS.find((s) => s[0] === id) || "Not staged";
};
const custPot = (c) => toNum(c.latest.potDyes) + toNum(c.latest.potAux);
const custEx = (c) => toNum(c.latest.exDyes) + toNum(c.latest.exAux);
const custHeadroom = (c) => Math.max(0, custPot(c) - custEx(c));

const buildInsightGroups = (rows, kind) => {
  const m = new Map();
  if (kind === "stage")
    PROJECT_STAGE_OPTIONS.forEach((s) =>
      m.set(s[0], { id: s[0], customers: [] }),
    );
  rows.forEach((c) => {
    const id = insightId(kind, c);
    if (!m.has(id)) m.set(id, { id, customers: [] });
    m.get(id).customers.push(c);
  });
  const out = [...m.values()].map((g) => {
    const cs = g.customers;
    const sum = (fn) => cs.reduce((s, c) => s + fn(c), 0);
    return {
      ...g,
      label: insightLabel(kind, g.id),
      visits: sum((c) => c.visits),
      n: cs.length,
      repeat: cs.filter((c) => c.visits > 1).length,
      pot: sum(custPot),
      headroom: sum(custHeadroom),
      ytd: sum((c) => toNum(c.latest.ytd)),
      abp: sum((c) => toNum(c.latest.abp)),
      pct: cs.length ? sum((c) => c.latest.pct || 0) / cs.length : 0,
    };
  });
  return kind === "stage"
    ? out
    : out.sort((a, b) => b.visits - a.visits || a.label.localeCompare(b.label));
};

const InsightPage = ({
  kind,
  selected,
  month,
  period,
  prev,
  onBack,
  onSelect,
  onSwitchKind,
  onOpenCustomer,
  onOpenVisits,
}) => {
  const data = period === "full" ? month : month.halves[Number(period) - 1];
  const rows = data.customerRows;
  const pv = prev?.data;
  const [yy, mm] = month.key.split("-").map(Number);
  const lastDay = new Date(yy, mm, 0).getDate();
  const dFrom = period === "2" ? 16 : 1;
  const dTo = period === "1" ? 15 : lastDay;
  const periodTitle = period === "full" ? "Full month" : data.title;
  const meta = INSIGHT_KINDS[kind];
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("visits");

  const groups = useMemo(() => buildInsightGroups(rows, kind), [rows, kind]);
  const prevGroups = useMemo(
    () => (pv ? buildInsightGroups(pv.customerRows, kind) : null),
    [pv, kind],
  );
  const periodVisits = Math.max(1, data.totalVisits);
  const maxVisits = Math.max(1, ...groups.map((g) => g.visits));

  const active = selected
    ? groups.find((g) => g.id === selected) || null
    : groups.find((g) => g.visits > 0) || groups[0] || null;
  const pg = active && prevGroups?.find((g) => g.id === active.id);

  // daily trend of the selected group
  const daily = useMemo(() => {
    const arr = [];
    for (let d = dFrom; d <= dTo; d++) arr.push({ d, n: 0 });
    (active?.customers || []).forEach((c) =>
      c.records.forEach((r) => {
        const slot = arr.find((x) => x.d === new Date(r.date).getDate());
        if (slot) slot.n += 1;
      }),
    );
    return arr;
  }, [active, dFrom, dTo]);
  const maxDaily = Math.max(1, ...daily.map((x) => x.n));
  const peak = daily.reduce((a, b) => (b.n > a.n ? b : a), { d: 0, n: 0 });
  const activeDays = daily.filter((x) => x.n > 0).length;

  // cross breakdowns (e.g. area ke andar kaun se stage / distributor)
  const cross = useMemo(() => {
    if (!active) return [];
    return Object.keys(INSIGHT_KINDS)
      .filter((k) => k !== kind)
      .map((k) => {
        const m = {};
        active.customers.forEach((c) => {
          const id = insightId(k, c);
          m[id] = (m[id] || 0) + c.visits;
        });
        const list = Object.entries(m)
          .map(([id, n]) => ({ id, n, label: insightLabel(k, id) }))
          .sort((a, b) => b.n - a.n)
          .slice(0, 6);
        return { k, list };
      });
  }, [active, kind]);

  // follow-up gap is measured against the end of the period (or today)
  const refEnd = useMemo(() => {
    const e = new Date(yy, mm - 1, dTo, 23, 59, 59);
    return e > new Date() ? new Date() : e;
  }, [yy, mm, dTo]);
  const gapOf = (c) =>
    Math.max(0, Math.floor((refEnd - new Date(c.latest.date)) / 86400000));

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = (active?.customers || []).filter(
      (c) =>
        !needle ||
        `${c.name} ${c.latest.area || ""} ${c.latest.distributor || ""} ${c.latest.stage || ""}`
          .toLowerCase()
          .includes(needle),
    );
    const cmp = {
      visits: (a, b) => b.visits - a.visits || a.name.localeCompare(b.name),
      pot: (a, b) => custPot(b) - custPot(a),
      headroom: (a, b) => custHeadroom(b) - custHeadroom(a),
      pct: (a, b) => (b.latest.pct || 0) - (a.latest.pct || 0),
      recent: (a, b) => new Date(b.latest.date) - new Date(a.latest.date),
      name: (a, b) => a.name.localeCompare(b.name),
    }[sort];
    return [...list].sort(cmp);
  }, [active, q, sort]);

  const silent = (active?.customers || []).filter((c) => gapOf(c) >= 10);
  const opportunity = [...(active?.customers || [])]
    .filter((c) => custHeadroom(c) > 0)
    .sort((a, b) => custHeadroom(b) - custHeadroom(a))
    .slice(0, 4);

  const exportGroup = () => {
    if (!active) return;
    const head = [
      "Date",
      "Customer",
      "Area",
      "Distributor",
      "Stage",
      "Objective",
      "Outcome",
      "Potential Dyes",
      "Potential Aux",
      "ABP AM26",
      "YTD",
      "YTD vs ABP %",
    ];
    const body = active.customers
      .flatMap((c) => c.records)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((r) => [
        fmtDate(r.date),
        r.customer,
        r.area || "",
        r.distributor || "",
        r.stage || "",
        r.objective || "",
        r.outcome || "",
        toNum(r.potDyes),
        toNum(r.potAux),
        toNum(r.abp),
        toNum(r.ytd),
        r.pct ?? 0,
      ]);
    const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
    ws["!cols"] = head.map((_, i) => ({ wch: i === 5 || i === 6 ? 36 : 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, meta.short.slice(0, 28));
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const safe = String(active.id)
      .replace(/[^\w-]+/g, "_")
      .slice(0, 30);
    downloadBlob(
      new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `DSR_${month.key}_${period}_${kind}_${safe}.xlsx`,
    );
  };

  const withDelta = (text, cur, p, suffix = "", digits = 0) => (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "baseline" }}>
      <span>{text}</span>
      {pg && <Delta cur={cur} prev={p} suffix={suffix} digits={digits} />}
    </span>
  );

  // ── aside: kind switch + ranked list ────────────────────────────────────
  const aside = (
    <div className="dsr-glass" style={{ borderRadius: 16, padding: 16 }}>
      <div className="dsr-seg" role="tablist" aria-label="Breakdown type">
        {Object.entries(INSIGHT_KINDS).map(([k, v]) => (
          <button
            key={k}
            role="tab"
            aria-selected={k === kind}
            className={k === kind ? "active" : ""}
            onClick={() => k !== kind && onSwitchKind(k)}
          >
            <Icon name={v.icon} size={12} strokeWidth={2} /> {v.short}
          </button>
        ))}
      </div>
      <SubHead>
        {groups.length} {meta.short.toLowerCase()}
        {groups.length === 1 ? "" : "s"} · {periodTitle}
      </SubHead>
      <div
        style={{
          display: "grid",
          gap: 6,
          gridTemplateColumns: "minmax(0,1fr)",
        }}
      >
        {groups.map((g) => {
          const on = active && g.id === active.id;
          const sc = kind === "stage" ? stageColor(g.id) : null;
          const color = sc ? sc.border : kind === "area" ? DS.info : DS.primary;
          return (
            <button
              key={g.id}
              className={`dsr-rank-row${on ? " on" : ""}`}
              onClick={() => onSelect(g.id)}
              aria-pressed={on}
              style={{ opacity: g.visits === 0 && !on ? 0.55 : 1 }}
            >
              <div className="dsr-rank-top">
                <span className="dsr-rank-name">{g.label}</span>
                <span className="dsr-mono" style={{ color, fontWeight: 600 }}>
                  {g.visits}
                </span>
              </div>
              <div className="dsr-rank-bar">
                <div
                  style={{
                    width: `${(g.visits / maxVisits) * 100}%`,
                    background: color,
                  }}
                />
              </div>
              <div className="dsr-rank-sub">
                {g.n} customer{g.n === 1 ? "" : "s"} ·{" "}
                {Math.round((g.visits / periodVisits) * 100)}% of visits
              </div>
            </button>
          );
        })}
        {groups.length === 0 && (
          <div style={{ fontSize: 12, color: DS.text2 }}>No data</div>
        )}
      </div>
    </div>
  );

  const title = active ? active.label : meta.label;

  return (
    <PageShell
      eyebrow={`${meta.short} insights`}
      title={title.length > 44 ? `${title.slice(0, 43)}…` : title}
      subtitle={`${periodTitle} · ${month.label}${
        active
          ? ` · ${Math.round((active.visits / periodVisits) * 100)}% of period visits`
          : ""
      }`}
      avatar={meta.short[0]}
      onBack={onBack}
      aside={aside}
      actions={
        <button
          className="dsr-ghost-btn"
          style={{ height: 36 }}
          disabled={!active || active.n === 0}
          onClick={exportGroup}
        >
          <Icon name="download" size={13} /> Excel
        </button>
      }
    >
      {!active ? (
        <div
          className="dsr-glass"
          style={{ borderRadius: 16, padding: 36, textAlign: "center" }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            This {meta.short.toLowerCase()} was not found in this period
          </div>
          <div style={{ fontSize: 12, color: DS.text2 }}>
            Pick another {meta.short.toLowerCase()} from the list.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: 16,
            gridTemplateColumns: "minmax(0,1fr)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,170px),1fr))",
              gap: 12,
            }}
          >
            <MetricCard
              label="Visits"
              value={active.visits}
              accent={DS.info}
              sub={withDelta(
                `${Math.round((active.visits / periodVisits) * 100)}% of period`,
                active.visits,
                pg?.visits,
              )}
            />
            <MetricCard
              label="Customers"
              value={active.n}
              sub={withDelta(
                `${active.repeat} repeat visited`,
                active.n,
                pg?.n,
              )}
            />
            <MetricCard
              label="Potential"
              value={fmtL(active.pot)}
              sub={withDelta(
                "latest per customer",
                Number(active.pot.toFixed(1)),
                pg ? Number(pg.pot.toFixed(1)) : undefined,
                "L",
                1,
              )}
            />
            <MetricCard
              label="Headroom"
              value={fmtL(active.headroom)}
              accent={DS.success}
              sub="potential − existing"
            />
            <MetricCard
              label="Total YTD"
              value={fmtL(active.ytd)}
              sub={`of ${fmtL(active.abp)} ABP`}
            />
            <MetricCard
              label="Avg YTD/ABP"
              value={`${active.pct.toFixed(1)}%`}
              accent={DS.purple}
              sub={withDelta(
                "customer average",
                Number(active.pct.toFixed(1)),
                pg ? Number(pg.pct.toFixed(1)) : undefined,
                "%",
                1,
              )}
            />
          </div>

          <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
            <SubHead icon="trending">Visit trend · {periodTitle}</SubHead>
            <div className="dsr-trend" role="img" aria-label="Daily visits">
              {daily.map((x) => (
                <div
                  key={x.d}
                  className={`dsr-trend-col${x.d === peak.d && x.n > 0 ? " peak" : ""}`}
                  title={`${x.d} ${month.label.split(" ")[0]} · ${x.n} visit${x.n === 1 ? "" : "s"}`}
                >
                  <div
                    className="dsr-trend-bar"
                    style={{
                      height: `${Math.max(x.n ? 8 : 3, (x.n / maxDaily) * 100)}%`,
                    }}
                  />
                  <span>{x.d % 5 === 0 || x.d === dFrom ? x.d : ""}</span>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: DS.text2, marginTop: 10 }}>
              {activeDays} active day{activeDays === 1 ? "" : "s"}
              {peak.n > 0 && (
                <>
                  {" "}
                  · busiest <b style={{ color: DS.text1 }}>{peak.d}</b> (
                  {peak.n} visit{peak.n === 1 ? "" : "s"})
                </>
              )}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(min(100%,260px),1fr))",
              gap: 16,
            }}
          >
            {cross.map(({ k, list }) => (
              <div
                key={k}
                className="dsr-glass"
                style={{ borderRadius: 16, padding: 18 }}
              >
                <SubHead icon={INSIGHT_KINDS[k].icon}>
                  By {INSIGHT_KINDS[k].short.toLowerCase()}
                </SubHead>
                {list.map((x) => (
                  <BarRow
                    key={x.id}
                    label={
                      x.label.length > 30 ? `${x.label.slice(0, 29)}…` : x.label
                    }
                    value={x.n}
                    max={list[0].n}
                    color={
                      k === "stage"
                        ? stageColor(x.id).border
                        : k === "area"
                          ? DS.info
                          : DS.primary
                    }
                  />
                ))}
              </div>
            ))}
          </div>

          {(silent.length > 0 || opportunity.length > 0) && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit,minmax(min(100%,260px),1fr))",
                gap: 16,
              }}
            >
              <div
                className="dsr-glass"
                style={{ borderRadius: 16, padding: 18 }}
              >
                <SubHead icon="clock">Follow-up due · 10+ days silent</SubHead>
                {silent.length === 0 ? (
                  <div style={{ fontSize: 12, color: DS.text2 }}>
                    All customers were visited recently 👌
                  </div>
                ) : (
                  silent
                    .sort((a, b) => gapOf(b) - gapOf(a))
                    .slice(0, 5)
                    .map((c) => (
                      <button
                        key={c.name}
                        className="dsr-mini-row"
                        onClick={() => onOpenCustomer(c.name)}
                      >
                        <span>{c.name}</span>
                        <span
                          className="dsr-mono"
                          style={{ color: DS.warning, fontWeight: 600 }}
                        >
                          {gapOf(c)}d
                        </span>
                      </button>
                    ))
                )}
              </div>
              <div
                className="dsr-glass"
                style={{ borderRadius: 16, padding: 18 }}
              >
                <SubHead icon="lightbulb">Biggest headroom</SubHead>
                {opportunity.length === 0 ? (
                  <div style={{ fontSize: 12, color: DS.text2 }}>
                    No headroom data
                  </div>
                ) : (
                  opportunity.map((c) => (
                    <button
                      key={c.name}
                      className="dsr-mini-row"
                      onClick={() => onOpenCustomer(c.name)}
                    >
                      <span>{c.name}</span>
                      <span
                        className="dsr-mono"
                        style={{ color: DS.success, fontWeight: 600 }}
                      >
                        {fmtL(custHeadroom(c))}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
            <div
              style={{
                display: "flex",
                gap: 10,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 12,
              }}
            >
              <SubHead icon="users">Customers · {shown.length}</SubHead>
              <div style={{ flex: 1 }} />
              <input
                className="dsr-input"
                placeholder="Search customer…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ ...IS, height: 34, width: 200, maxWidth: "100%" }}
                aria-label="Search customers"
              />
              <CustomSelect
                compact
                ariaLabel="Sort customers"
                style={{ minWidth: 150 }}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="visits">Most visits</option>
                <option value="recent">Latest visit</option>
                <option value="pot">Potential</option>
                <option value="headroom">Headroom</option>
                <option value="pct">YTD / ABP %</option>
                <option value="name">Name</option>
              </CustomSelect>
            </div>
            <div className="dsr-itable-wrap">
              <div className="dsr-itable">
                <div className="dsr-irow head">
                  <span>Customer</span>
                  <span>Stage</span>
                  <span>Visits</span>
                  <span>Potential</span>
                  <span>YTD / ABP</span>
                  <span>Last visit</span>
                </div>
                {shown.map((c) => {
                  const sc = stageColor(c.latest.stage);
                  const gap = gapOf(c);
                  return (
                    <div key={c.name} className="dsr-irow">
                      <button
                        className="dsr-link"
                        onClick={() => onOpenCustomer(c.name)}
                        title="Open customer history"
                      >
                        {c.name}
                        <small>
                          {[c.latest.area, c.latest.distributor]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                      </button>
                      <span>
                        {c.latest.stage ? (
                          <em
                            className="dsr-stage-chip"
                            style={{
                              background: sc.bg,
                              color: sc.text,
                              borderColor: sc.border,
                            }}
                          >
                            {c.latest.stage.trim()[0]}
                          </em>
                        ) : (
                          "—"
                        )}
                      </span>
                      <button
                        className="dsr-link mono"
                        onClick={() => onOpenVisits(c.name)}
                        title="View visits in this period"
                      >
                        {c.visits}
                      </button>
                      <span className="dsr-mono">{fmtL(custPot(c))}</span>
                      <span
                        className="dsr-mono"
                        style={{ color: pctColor(c.latest.pct || 0) }}
                      >
                        {fmtL(toNum(c.latest.ytd))}{" "}
                        <small>{(c.latest.pct || 0).toFixed(0)}%</small>
                      </span>
                      <span style={{ fontSize: 12 }}>
                        {new Date(c.latest.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                        {gap >= 10 && (
                          <small style={{ color: DS.warning, marginLeft: 6 }}>
                            {gap}d
                          </small>
                        )}
                      </span>
                    </div>
                  );
                })}
                {shown.length === 0 && (
                  <div style={{ padding: 18, fontSize: 12, color: DS.text2 }}>
                    No customers found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

const PeriodReportPage = ({
  month,
  period,
  prev,
  onBack,
  onOlder,
  onNewer,
  onSwitch,
  onOpenCustomer,
  onOpenVisits,
  onOpenInsight,
}) => {
  const data = period === "full" ? month : month.halves[Number(period) - 1];
  const rows = data.customerRows;
  const recs = useMemo(() => rows.flatMap((c) => c.records), [rows]);
  const [yy, mm] = month.key.split("-").map(Number);
  const lastDay = new Date(yy, mm, 0).getDate();
  const dFrom = period === "2" ? 16 : 1;
  const dTo = period === "1" ? 15 : lastDay;
  const periodTitle = period === "full" ? "Full month" : data.title;
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("visits");

  const sumLatest = (key) => rows.reduce((s, c) => s + toNum(c.latest[key]), 0);
  const totalYTD = sumLatest("ytd");
  const totalABP = sumLatest("abp");
  const repeat = rows.filter((c) => c.visits > 1).length;
  const avgVisits = rows.length ? data.totalVisits / rows.length : 0;

  const daily = useMemo(() => {
    const arr = [];
    for (let d = dFrom; d <= dTo; d++) arr.push({ d, n: 0 });
    recs.forEach((r) => {
      const day = new Date(r.date).getDate();
      const slot = arr.find((x) => x.d === day);
      if (slot) slot.n += 1;
    });
    return arr;
  }, [recs, dFrom, dTo]);
  const peak = daily.reduce((a, b) => (b.n > a.n ? b : a), { d: 0, n: 0 });
  const maxDaily = Math.max(1, ...daily.map((x) => x.n));
  const activeDays = daily.filter((x) => x.n > 0).length;

  const stageDist = PROJECT_STAGE_OPTIONS.map((st) => ({
    st,
    n: rows.filter((c) => (c.latest.stage || "").trim()[0] === st[0]).length,
  }));
  const maxStage = Math.max(1, ...stageDist.map((x) => x.n));

  const byDist = useMemo(() => {
    const m = {};
    recs.forEach((r) => {
      const k = r.distributor || "—";
      m[k] = (m[k] || 0) + 1;
    });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [recs]);
  const byArea = useMemo(() => {
    const m = {};
    rows.forEach((c) => {
      const k = c.latest.area || "—";
      m[k] = (m[k] || 0) + c.visits;
    });
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [rows]);

  const prevNames = new Set((prev?.data.customerRows || []).map((c) => c.name));
  const curNames = new Set(rows.map((c) => c.name));
  const notRevisited = (prev?.data.customerRows || []).filter(
    (c) => !curNames.has(c.name),
  );
  const newThisPeriod = rows.filter((c) => !prevNames.has(c.name));

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter(
      (c) =>
        !needle ||
        `${c.name} ${c.latest.area || ""} ${c.latest.distributor || ""} ${c.latest.stage || ""}`
          .toLowerCase()
          .includes(needle),
    );
    const pot = (c) => toNum(c.latest.potDyes) + toNum(c.latest.potAux);
    const cmp = {
      visits: (a, b) => b.visits - a.visits || a.name.localeCompare(b.name),
      pot: (a, b) => pot(b) - pot(a),
      pct: (a, b) => (b.latest.pct || 0) - (a.latest.pct || 0),
      name: (a, b) => a.name.localeCompare(b.name),
    }[sort];
    return [...list].sort(cmp);
  }, [rows, q, sort]);

  const exportPeriod = () => {
    const head = [
      "Date",
      "Customer",
      "Area",
      "Distributor",
      "Stage",
      "Objective",
      "Outcome",
      "Potential Dyes",
      "Potential Aux",
      "Existing Dyes",
      "Existing Aux",
      "ABP AM26",
      "YTD",
      "YTD vs ABP %",
    ];
    const body = [...recs]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((r) => [
        fmtDate(r.date),
        r.customer,
        r.area || "",
        r.distributor || "",
        r.stage || "",
        r.objective || "",
        r.outcome || "",
        toNum(r.potDyes),
        toNum(r.potAux),
        toNum(r.exDyes),
        toNum(r.exAux),
        toNum(r.abp),
        toNum(r.ytd),
        r.pct ?? 0,
      ]);
    const ws = XLSX.utils.aoa_to_sheet([head, ...body]);
    ws["!cols"] = head.map((_, i) => ({ wch: i === 5 || i === 6 ? 36 : 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Period report");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    downloadBlob(
      new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `DSR_${month.key}_${period === "full" ? "full" : period === "1" ? "1-15" : `16-${lastDay}`}.xlsx`,
    );
  };

  const pv = prev?.data;
  const navBtn = (label, fn, dir) => (
    <button
      className="dsr-ghost-btn"
      disabled={!fn}
      onClick={fn || undefined}
      style={{ height: 36 }}
    >
      {dir === "l" && <Icon name="back" size={13} />} {label}
    </button>
  );

  const aside = (
    <div style={{ display: "grid", gap: 14 }}>
      {pv && (
        <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
          <SubHead icon="trending">vs previous period</SubHead>
          <div style={{ fontSize: 12, color: DS.text2, marginBottom: 12 }}>
            {prev.label}
          </div>
          {[
            ["Visits", data.totalVisits, pv.totalVisits, "", 0],
            ["Customers", data.uniqueCustomers, pv.uniqueCustomers, "", 0],
            [
              "Potential (₹L)",
              Number(data.totalPot),
              Number(pv.totalPot),
              "L",
              1,
            ],
            ["Avg YTD/ABP", Number(data.avgPct), Number(pv.avgPct), "%", 1],
          ].map(([lbl, cur, pr, suf, dg]) => (
            <div
              key={lbl}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: `1px dashed ${DS.border}`,
              }}
            >
              <span style={{ fontSize: 12, color: DS.text2 }}>{lbl}</span>
              <span
                style={{ display: "flex", gap: 10, alignItems: "baseline" }}
              >
                <span
                  className="dsr-mono"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  {cur}
                </span>
                <Delta cur={cur} prev={pr} suffix={suf} digits={dg} />
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <PanelHead icon="sparkle" onOpen={() => onOpenInsight("stage")}>
          Stage distribution
        </PanelHead>
        {stageDist.map(({ st, n }) => (
          <BarRow
            key={st}
            label={st.length > 28 ? `${st.slice(0, 27)}…` : st}
            value={n}
            max={maxStage}
            color={stageColor(st).border}
            right={`${n}`}
            onClick={() => onOpenInsight("stage", st[0])}
          />
        ))}
      </div>

      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <PanelHead icon="store" onOpen={() => onOpenInsight("distributor")}>
          Distributor-wise visits
        </PanelHead>
        {byDist.length === 0 && (
          <div style={{ fontSize: 12, color: DS.text2 }}>No data</div>
        )}
        {byDist.map(([k, n]) => (
          <BarRow
            key={k}
            label={k}
            value={n}
            max={byDist[0][1]}
            color={DS.primary}
            onClick={() => onOpenInsight("distributor", k)}
          />
        ))}
      </div>

      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <PanelHead icon="pin" onOpen={() => onOpenInsight("area")}>
          Top areas
        </PanelHead>
        {byArea.map(([k, n]) => (
          <BarRow
            key={k}
            label={k}
            value={n}
            max={byArea[0][1]}
            color={DS.info}
            onClick={() => onOpenInsight("area", k)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <PageShell
      eyebrow="Period report"
      title={month.label}
      subtitle={
        period === "full"
          ? `Full month · ${month.totalVisits} visits`
          : `${data.title} ${month.label.split(" ")[0]} · ${period === "1" ? "First half" : "Second half"}`
      }
      avatar={period === "full" ? "M" : period === "1" ? "1H" : "2H"}
      onBack={onBack}
      aside={aside}
      actions={
        <>
          {navBtn("Older", onOlder, "l")}
          <button
            className="dsr-ghost-btn"
            disabled={!onNewer}
            onClick={onNewer || undefined}
            style={{ height: 36 }}
          >
            Newer{" "}
            <span style={{ transform: "rotate(180deg)", display: "flex" }}>
              <Icon name="back" size={13} />
            </span>
          </button>
          <button
            className="dsr-ghost-btn"
            style={{ height: 36 }}
            onClick={exportPeriod}
          >
            <Icon name="download" size={13} /> Excel
          </button>
        </>
      }
    >
      <div
        style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}
      >
        {[
          ["full", "Full month"],
          ["1", `1 – 15`],
          ["2", `16 – ${lastDay}`],
        ].map(([id, lbl]) => (
          <button
            key={id}
            className={`dsr-filter-chip${period === id ? " active" : ""}`}
            onClick={() => period !== id && onSwitch(id)}
            style={{ padding: "7px 16px", fontSize: 12.5 }}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="dsr-stat-grid cols4" style={{ marginBottom: 12 }}>
        <StatTile
          label="Visits"
          value={data.totalVisits}
          sub={pv ? undefined : periodTitle}
          accent={DS.info}
        />
        <StatTile
          label="Customers"
          value={data.uniqueCustomers}
          sub={`${repeat} repeat visited`}
        />
        <StatTile
          label="Potential"
          value={`₹${data.totalPot}L`}
          sub="latest per customer"
          accent={DS.gold}
        />
        <StatTile
          label="Avg YTD/ABP"
          value={`${data.avgPct}%`}
          accent={DS.purple}
        />
      </div>
      <div className="dsr-stat-grid cols4" style={{ marginBottom: 18 }}>
        <StatTile
          label="Total YTD"
          value={fmtL(totalYTD)}
          sub={`of ${fmtL(totalABP)} ABP`}
          accent={DS.success}
        />
        <StatTile label="Visits / customer" value={avgVisits.toFixed(1)} />
        <StatTile
          label="Active days"
          value={`${activeDays}/${daily.length}`}
          sub="field visit days"
          accent={DS.info}
        />
        <StatTile
          label="Busiest day"
          value={peak.n ? `${peak.d}` : "—"}
          sub={peak.n ? `${peak.n} visits` : ""}
          accent={DS.primary}
        />
      </div>

      <SectionCard title={`Month split · 1 – 15 vs 16 – ${lastDay}`}>
        <div
          className="dsr-grid2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 12,
          }}
        >
          {month.halves.map((h) => {
            const active = period === String(h.id);
            const other = month.halves[h.id === 1 ? 1 : 0];
            return (
              <div
                key={h.id}
                role="button"
                tabIndex={0}
                onClick={() => !active && onSwitch(String(h.id))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!active) onSwitch(String(h.id));
                  }
                }}
                className="dsr-half-card"
                style={{
                  background: active ? DS.primaryDim : DS.surface,
                  border: `1px solid ${active ? DS.primary : DS.border}`,
                  borderRadius: 14,
                  padding: 14,
                  cursor: active ? "default" : "pointer",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#0A0B10",
                      background: DS.primary,
                      padding: "3px 9px",
                      borderRadius: 20,
                    }}
                  >
                    {h.id === 1 ? "FIRST HALF" : "SECOND HALF"}
                  </span>
                  <span
                    className="dsr-mono"
                    style={{ fontSize: 13, fontWeight: 600 }}
                  >
                    {h.title}
                  </span>
                </div>
                {h.totalVisits === 0 ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: DS.text3,
                      textAlign: "center",
                      padding: "12px 0",
                    }}
                  >
                    No visits in this period
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2,minmax(0,1fr))",
                      gap: 8,
                    }}
                  >
                    {[
                      [
                        "Visits",
                        h.totalVisits,
                        other.totalVisits,
                        DS.info,
                        "",
                        0,
                      ],
                      [
                        "Customers",
                        h.uniqueCustomers,
                        other.uniqueCustomers,
                        DS.primary,
                        "",
                        0,
                      ],
                      [
                        "Potential",
                        `₹${h.totalPot}L`,
                        Number(other.totalPot),
                        DS.gold,
                        "L",
                        1,
                        Number(h.totalPot),
                      ],
                      [
                        "Avg YTD/ABP",
                        `${h.avgPct}%`,
                        Number(other.avgPct),
                        DS.purple,
                        "%",
                        1,
                        Number(h.avgPct),
                      ],
                    ].map(([lbl, val, oth, clr, suf, dg, raw]) => (
                      <div
                        key={lbl}
                        style={{
                          background:
                            "color-mix(in srgb, var(--wash) 3.0%, transparent)",
                          border: `1px solid ${DS.border}`,
                          borderRadius: 9,
                          padding: "8px 10px",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            color: DS.text3,
                            fontWeight: 600,
                          }}
                        >
                          {lbl}
                        </div>
                        <div
                          className="dsr-mono"
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: clr,
                            margin: "2px 0",
                          }}
                        >
                          {val}
                        </div>
                        {h.id === 2 && (
                          <Delta
                            cur={raw ?? val}
                            prev={oth}
                            suffix={suf}
                            digits={dg}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {h.id === 2 && h.totalVisits > 0 && (
                  <div style={{ fontSize: 12, color: DS.text3, marginTop: 8 }}>
                    ▲▼ = compared with the first half
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Daily visits">
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: period === "full" ? 3 : 6,
            height: 150,
            paddingTop: 8,
          }}
        >
          {daily.map((x) => (
            <div
              key={x.d}
              title={`${x.d} ${month.label.split(" ")[0]} · ${x.n} visit${x.n === 1 ? "" : "s"}`}
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                height: "100%",
              }}
            >
              <span
                className="dsr-mono"
                style={{
                  fontSize: 12,
                  color: x.n ? DS.gold : "transparent",
                  marginBottom: 3,
                }}
              >
                {x.n || 0}
              </span>
              <div
                style={{
                  width: "100%",
                  maxWidth: 26,
                  height: `${(x.n / maxDaily) * 100}%`,
                  minHeight: x.n ? 4 : 2,
                  borderRadius: "5px 5px 2px 2px",
                  background: x.n
                    ? x.d === peak.d
                      ? DS.primary
                      : DS.borderHi
                    : DS.border,
                }}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            gap: period === "full" ? 3 : 6,
            marginTop: 6,
          }}
        >
          {daily.map((x) => (
            <div
              key={x.d}
              className="dsr-mono"
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: "center",
                fontSize: 12,
                color: DS.text3,
              }}
            >
              {period === "full" && x.d % 5 !== 1 ? "" : x.d}
            </div>
          ))}
        </div>
      </SectionCard>

      {pv && (notRevisited.length > 0 || newThisPeriod.length > 0) && (
        <div
          className="dsr-grid2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 12,
            marginBottom: 14,
          }}
        >
          {[
            [
              "Follow-up pending",
              `Visited last period, not this one (${notRevisited.length})`,
              notRevisited,
              DS.warning,
            ],
            [
              "New this period",
              `First visit in this period (${newThisPeriod.length})`,
              newThisPeriod,
              DS.success,
            ],
          ].map(([ttl, sub, list, clr]) => (
            <div
              key={ttl}
              className="dsr-glass"
              style={{ borderRadius: 16, padding: 16, minWidth: 0 }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: clr,
                  marginBottom: 3,
                }}
              >
                {ttl}
              </div>
              <div style={{ fontSize: 12, color: DS.text2, marginBottom: 10 }}>
                {sub}
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  maxHeight: 130,
                  overflowY: "auto",
                }}
                className="dsr-scroll"
              >
                {list.length === 0 && (
                  <span style={{ fontSize: 12, color: DS.text3 }}>—</span>
                )}
                {list.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => onOpenCustomer(c.name)}
                    className="dsr-filter-chip"
                    style={{ fontSize: 12, padding: "4px 10px" }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <SectionCard title={`Customers · ${shown.length}`}>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
            <Icon
              name="search"
              size={14}
              style={{
                position: "absolute",
                left: 12,
                top: 12,
                color: DS.text3,
              }}
            />
            <input
              className="dsr-input"
              style={{ ...IS, paddingLeft: 34, height: 40 }}
              placeholder="Customer / area / distributor…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              ["visits", "Visits"],
              ["pot", "Potential"],
              ["pct", "YTD/ABP"],
              ["name", "A–Z"],
            ].map(([id, lbl]) => (
              <button
                key={id}
                className={`dsr-filter-chip${sort === id ? " active" : ""}`}
                onClick={() => setSort(id)}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {shown.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                fontSize: 12.5,
                color: DS.text2,
              }}
            >
              No matching customers.
            </div>
          )}
          {shown.map((c, i) => {
            const pot = toNum(c.latest.potDyes) + toNum(c.latest.potAux);
            const pct = c.latest.pct || 0;
            return (
              <div
                key={c.name}
                className="dsr-customer-row"
                role="button"
                tabIndex={0}
                onClick={() => onOpenCustomer(c.name)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenCustomer(c.name);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 13px",
                  background: DS.surface,
                  border: `1px solid ${DS.border}`,
                  borderRadius: 12,
                  flexWrap: "wrap",
                }}
              >
                <span
                  className="dsr-mono"
                  style={{
                    width: 22,
                    fontSize: 12,
                    color: DS.text3,
                    fontWeight: 600,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.name}
                  </div>
                  <div style={{ fontSize: 12, color: DS.text2, marginTop: 2 }}>
                    {c.latest.area} · {c.latest.distributor} · last{" "}
                    {fmtDate(c.latest.date)}
                  </div>
                </div>
                <StageLadder stage={c.latest.stage} size="sm" />
                <div style={{ textAlign: "right", minWidth: 62 }}>
                  <div
                    className="dsr-mono"
                    style={{ fontSize: 12, fontWeight: 600, color: DS.text1 }}
                  >
                    {fmtL(pot)}
                  </div>
                  <div
                    className="dsr-mono"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: pctColor(pct),
                    }}
                  >
                    {pct}%
                  </div>
                </div>
                <button
                  type="button"
                  className="dsr-visits-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenVisits(c.name);
                  }}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: DS.primary,
                    background: DS.primaryDim,
                    padding: "4px 11px",
                    borderRadius: 20,
                    border: "1px solid rgba(212,175,106,0.35)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {c.visits}× visit{c.visits > 1 ? "s" : ""} ›
                </button>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </PageShell>
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
  const [modalSaving, setModalSaving] = useState(false);
  const [recordSaving, setRecordSaving] = useState(false);
  const [showImporter, setShowImporter] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [distFilter, setDistFilter] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [followOnly, setFollowOnly] = useState(false);
  const [sortBy, setSortBy] = useState("new");
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("dsr_view") === "table" ? "table" : "cards";
    } catch {
      return "cards";
    }
  });
  const [analysisView, setAnalysisView] = useState(() => {
    try {
      return localStorage.getItem("dsr_analysis_view") === "list"
        ? "list"
        : "cards";
    } catch {
      return "cards";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("dsr_analysis_view", analysisView);
    } catch {
      /* ignore */
    }
  }, [analysisView]);
  const [visibleCount, setVisibleCount] = useState(30);
  const searchRef = useRef(null);
  const [customerQuery, setCustomerQuery] = useState("");
  const [recordsLoaded, setRecordsLoaded] = useState(false);
  const [customersLoaded, setCustomersLoaded] = useState(false);

  // ── Routing: popups ab pages hain ──────────────────────────────────────
  const navigate = useNavigate();
  const location = useLocation();
  const route = useMemo(
    () => parseRoute(location.pathname),
    [location.pathname],
  );
  const goBack = useCallback(() => {
    if (location.key !== "default") navigate(-1);
    else navigate(BASE, { replace: true });
  }, [location.key, navigate]);
  const toList = useCallback(
    () => navigate(BASE, { replace: true }),
    [navigate],
  );
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const modalMode =
    route.type === "customerNew"
      ? "add"
      : route.type === "customerEdit"
        ? "edit"
        : null;
  const editingCustomer = route.type === "customerEdit" ? route.name : null;

  const toastTimer = useRef(null);
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast({ msg: "", type: "" }),
      3000,
    );
  }, []);
  useEffect(
    () => () => toastTimer.current && clearTimeout(toastTimer.current),
    [],
  );

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/dsr/records");
      setRecords(res.data || []);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
      setRecordsLoaded(true);
    }
  }, [showToast]);
  const loadCustomers = useCallback(async () => {
    try {
      const res = await apiFetch("/api/dsr/customers");
      setCustomers(res.data || {});
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setCustomersLoaded(true);
    }
  }, [showToast]);
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

  // All records per customer, latest → oldest (start to now)
  const customerHistoryMap = useMemo(() => {
    const map = {};
    for (const r of records) {
      if (!r.customer) continue;
      (map[r.customer] = map[r.customer] || []).push(r);
    }
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => new Date(b.date) - new Date(a.date)),
    );
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
        const summarize = (recs) => {
          const bc = {};
          recs.forEach((r) => {
            if (!bc[r.customer]) bc[r.customer] = [];
            bc[r.customer].push(r);
          });
          const customerRows = Object.entries(bc)
            .map(([name, rs]) => {
              // latest visit first
              const sorted = [...rs].sort(
                (a, b) => new Date(b.date) - new Date(a.date),
              );
              return {
                name,
                visits: rs.length,
                latest: sorted[0],
                records: sorted,
              };
            })
            .sort(
              (a, b) => b.visits - a.visits || a.name.localeCompare(b.name),
            );
          const totalPot = customerRows.reduce(
            (s, c) => s + toNum(c.latest.potDyes) + toNum(c.latest.potAux),
            0,
          );
          const avgPct = recs.length
            ? recs.reduce((s, r) => s + (r.pct || 0), 0) / recs.length
            : 0;
          return {
            totalVisits: recs.length,
            uniqueCustomers: customerRows.length,
            avgPct: avgPct.toFixed(1),
            totalPot: totalPot.toFixed(1),
            customerRows,
          };
        };
        const [yy, mm] = m.key.split("-").map(Number);
        const lastDay = new Date(yy, mm, 0).getDate();
        const firstHalf = m.records.filter(
          (r) => new Date(r.date).getDate() <= 15,
        );
        const secondHalf = m.records.filter(
          (r) => new Date(r.date).getDate() > 15,
        );
        return {
          key: m.key,
          label: m.label,
          ...summarize(m.records),
          halves: [
            { id: 1, title: "1 – 15", ...summarize(firstHalf) },
            { id: 2, title: `16 – ${lastDay}`, ...summarize(secondHalf) },
          ],
        };
      });
  }, [records]);

  const selectedCustomerLastRecord = useMemo(() => {
    const name = newRecord.customer;
    if (!name || !customers[name]) return null;
    return customerLastRecord[name] || null;
  }, [newRecord.customer, customers, customerLastRecord]);
  useEffect(() => {
    try {
      localStorage.setItem("dsr_view", viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);
  useEffect(
    () => setVisibleCount(30),
    [
      activeFilter,
      filterStart,
      filterEnd,
      stageFilter,
      distFilter,
      areaFilter,
      followOnly,
      sortBy,
      searchQuery,
    ],
  );

  const filteredByDate = useMemo(() => {
    if (activeFilter === "all") return records;
    if (activeFilter === "custom") {
      if (!filterStart || !filterEnd) return records;
      const s = new Date(filterStart);
      const e = new Date(filterEnd);
      e.setHours(23, 59, 59, 999);
      return records.filter((r) => inRange(r.date, s, e));
    }
    const range = presetRange(activeFilter);
    return range
      ? records.filter((r) => inRange(r.date, range[0], range[1]))
      : records;
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

  // latest visit per customer over ALL records → follow-up detection
  const latestAll = useMemo(() => {
    const m = {};
    records.forEach((r) => {
      if (
        r.customer &&
        (!m[r.customer] || new Date(r.date) > new Date(m[r.customer].date))
      )
        m[r.customer] = r;
    });
    return m;
  }, [records]);
  const followUps = useMemo(
    () =>
      Object.values(latestAll).filter((r) => (daysSince(r.date) ?? 0) >= 14),
    [latestAll],
  );
  const distOptions = useMemo(
    () =>
      [...new Set(records.map((r) => r.distributor).filter(Boolean))].sort(),
    [records],
  );
  const areaOptions = useMemo(
    () => [...new Set(records.map((r) => r.area).filter(Boolean))].sort(),
    [records],
  );
  const presetCounts = useMemo(() => {
    const out = { all: records.length };
    REC_PRESETS.slice(1).forEach(([id]) => {
      const rg = presetRange(id);
      out[id] = records.filter((r) => inRange(r.date, rg[0], rg[1])).length;
    });
    return out;
  }, [records]);
  const todayCount = useMemo(() => {
    const rg = presetRange("today");
    return records.filter((r) => inRange(r.date, rg[0], rg[1])).length;
  }, [records]);
  const topArea = useMemo(() => {
    const m = {};
    filteredByDate.forEach((r) => r.area && (m[r.area] = (m[r.area] || 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  }, [filteredByDate]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = filteredByDate.filter((r) => {
      if (stageFilter && stageLetter(r.stage) !== stageFilter) return false;
      if (distFilter && r.distributor !== distFilter) return false;
      if (areaFilter && r.area !== areaFilter) return false;
      if (followOnly && latestAll[r.customer] !== r) return false;
      if (followOnly && (daysSince(r.date) ?? 0) < 14) return false;
      if (!q) return true;
      return (
        (r.customer || "").toLowerCase().includes(q) ||
        (r.area || "").toLowerCase().includes(q) ||
        (r.distributor || "").toLowerCase().includes(q) ||
        (r.objective || "").toLowerCase().includes(q) ||
        (r.outcome || "").toLowerCase().includes(q)
      );
    });
    const by = {
      new: (a, b) => new Date(b.date) - new Date(a.date),
      old: (a, b) => new Date(a.date) - new Date(b.date),
      name: (a, b) => (a.customer || "").localeCompare(b.customer || ""),
      pct: (a, b) => (b.pct || 0) - (a.pct || 0),
      pctLow: (a, b) => (a.pct || 0) - (b.pct || 0),
      pot: (a, b) => recPot(b) - recPot(a),
    }[sortBy];
    return sortBy === "new" ? list : [...list].sort(by);
  }, [
    filteredByDate,
    searchQuery,
    stageFilter,
    distFilter,
    areaFilter,
    followOnly,
    latestAll,
    sortBy,
  ]);

  const clearAllFilters = () => {
    setActiveFilter("all");
    setStageFilter("");
    setDistFilter("");
    setAreaFilter("");
    setFollowOnly(false);
    setSearchQuery("");
  };

  // keyboard shortcuts: "/" search · "n" new record · Esc clears search
  useEffect(() => {
    const h = (e) => {
      const t = e.target;
      const typing =
        t &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) ||
          t.isContentEditable);
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (route.type !== "list") return;
      if (e.key === "/" && !typing && activeTab === "records") {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "n" && !typing) {
        e.preventDefault();
        setActiveTab("add");
      } else if (e.key === "Escape" && t === searchRef.current) {
        setSearchQuery("");
        t.blur();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [route.type, activeTab]);

  const handleRecordChange = (e) => {
    const { name, value } = e.target;
    setNewRecord((p) => ({ ...p, [name]: value }));
  };
  const handleCustomerSelect = (e) => {
    const val = e.target.value;
    if (val === "__add__") {
      navigate(ROUTES.newCustomer);
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
      showToast("Please fill in the date (required).", "error");
      return;
    }
    if (!area || !distributor || !customer) {
      showToast("Date, Area, Distributor and Customer are required.", "error");
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
          } catch {
            /* stage sync on customer master is best-effort */
          }
        }
      }
      setNewRecord({ ...EMPTY_RECORD });
      setActiveTab("records");
      showToast("Record saved!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm("Delete this record?")) return;
    try {
      await apiFetch(`/api/dsr/records/${id}`, { method: "DELETE" });
      setRecords((p) => p.filter((r) => (r._id || r.id) !== id));
      showToast("Record deleted.");
      return true;
    } catch (err) {
      showToast(err.message, "error");
    }
    return false;
  };
  const deleteRecordAndLeave = async (id) => {
    const ok = await deleteRecord(id);
    if (ok) toList();
  };
  const updateRecord = async (id, data) => {
    if (!data.date || !data.area || !data.distributor || !data.customer) {
      showToast("Date, Area, Distributor and Customer are required.", "error");
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
      showToast("Record updated!");
      goBack();
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
      showToast("There are no records in this range.", "error");
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
        const isNum = ns.has(k);
        ws[XLSX.utils.encode_cell({ r: ri + 1, c: C })] = {
          v: isNum ? v : (v ?? ""),
          t: isNum ? "n" : "s",
          s: isNum ? NS : TS,
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
    showToast(`Downloading Excel! (${ed.length} records)`);
  };

  const openAddCustomer = () => navigate(ROUTES.newCustomer);
  const openEditCustomer = (name) => navigate(ROUTES.editCustomer(name));
  const startVisitFor = (name) => {
    handleCustomerSelect({ target: { value: name } });
    setActiveTab("add");
    navigate(BASE);
  };

  const handleSaveCustomer = async (name, data) => {
    if (!name) {
      showToast("Enter the customer name.", "error");
      return;
    }
    if (!data.area) {
      showToast("Enter the area.", "error");
      return;
    }
    if (!data.distributor) {
      showToast("Please select a distributor.", "error");
      return;
    }
    if (!data.stage) {
      showToast("Please select a project stage.", "error");
      return;
    }
    if (
      data.potDyes === "" ||
      data.potDyes === null ||
      data.potDyes === undefined
    ) {
      showToast("Enter Potential Dyes /mth (required).", "error");
      return;
    }
    if (
      data.potAux === "" ||
      data.potAux === null ||
      data.potAux === undefined
    ) {
      showToast("Enter Potential Aux /mth (required).", "error");
      return;
    }
    if (data.abp === "" || data.abp === null || data.abp === undefined) {
      showToast("Enter ABP AM26 (required).", "error");
      return;
    }
    if (data.mobile && !isValidMobile(cleanMobile(data.mobile))) {
      showToast("Enter a valid 10-digit mobile number.", "error");
      return;
    }
    if (data.altMobile && !isValidMobile(cleanMobile(data.altMobile))) {
      showToast("The alternate mobile number is invalid.", "error");
      return;
    }
    if (data.email && !isValidEmail(data.email.trim())) {
      showToast("Enter the email in a valid format.", "error");
      return;
    }
    if (data.gstin && !isValidGSTIN(data.gstin.trim().toUpperCase())) {
      showToast("Enter a valid 15-character GSTIN.", "error");
      return;
    }
    if (
      modalMode !== "edit" &&
      Object.keys(customers).some(
        (k) => k.trim().toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      showToast("A customer with this name already exists.", "error");
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
      contactPerson: (data.contactPerson || "").trim(),
      designation: (data.designation || "").trim(),
      mobile: cleanMobile(data.mobile),
      altMobile: cleanMobile(data.altMobile),
      email: (data.email || "").trim().toLowerCase(),
      address: (data.address || "").trim(),
      gstin: (data.gstin || "").trim().toUpperCase(),
      notes: (data.notes || "").trim(),
    };
    try {
      setModalSaving(true);
      if (modalMode === "edit") {
        const nameChanged = name !== editingCustomer;
        const oid = customers[editingCustomer]?._id;
        if (!oid) {
          showToast("Customer ID not found.", "error");
          return;
        }
        const res = await apiFetch(`/api/dsr/customers/${oid}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        const up = res.data;
        setCustomers((p) => {
          const n = { ...p };
          if (nameChanged) delete n[editingCustomer];
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
            ...pickContact(up),
          };
          return n;
        });
        showToast(
          nameChanged
            ? `Naam update: ${editingCustomer} → ${up.name}`
            : `${name} updated!`,
        );
      } else {
        const res = await apiFetch("/api/dsr/customers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const created = res.data;
        setCustomers((p) => ({ ...p, ...created }));
        const cd = created[name];
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
        showToast(`${name} added!`);
      }
      if (modalMode === "edit" && name !== editingCustomer) toList();
      else goBack();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteCustomer = async (name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const id = customers[name]?._id;
    if (!id) {
      showToast("Customer ID not found.", "error");
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
      showToast(`${name} deleted.`);
      toList();
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
  const visibleCustomerList = customerList.filter((n) => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) return true;
    const c = customers[n] || {};
    return `${n} ${c.area || ""} ${c.distributor || ""} ${c.contactPerson || ""} ${c.mobile || ""} ${c.altMobile || ""} ${c.email || ""} ${c.gstin || ""}`
      .toLowerCase()
      .includes(q);
  });
  const lr = selectedCustomerLastRecord;
  if (route.type !== "list") {
    let page = null;
    if (route.type === "customerNew") {
      page = (
        <CustomerFormPage
          key="new"
          mode="add"
          initialData={EMPTY_CUSTOMER}
          allCustomers={customers}
          onOpenOther={(n) => navigate(ROUTES.editCustomer(n))}
          onSave={handleSaveCustomer}
          onCancel={goBack}
          saving={modalSaving}
        />
      );
    } else if (route.type === "customerEdit") {
      const c = customers[route.name];
      if (!customersLoaded)
        page = <PageLoading onBack={goBack} eyebrow="Edit customer" />;
      else if (!c) page = <PageNotFound what="Customer" onBack={toList} />;
      else
        page = (
          <CustomerFormPage
            key={route.name}
            mode="edit"
            editName={route.name}
            initialData={{
              area: c.area || "",
              distributor: c.distributor || "",
              stage: c.stage || "",
              potDyes: c.potDyes ?? "",
              potAux: c.potAux ?? "",
              exDyes: c.exDyes ?? "",
              exAux: c.exAux ?? "",
              abp: c.abp ?? "",
              ...pickContact(c),
            }}
            allCustomers={customers}
            onOpenOther={(n) => navigate(ROUTES.editCustomer(n))}
            lastRecord={customerLastRecord[route.name]}
            visitCount={(customerHistoryMap[route.name] || []).length}
            onSave={handleSaveCustomer}
            onDelete={handleDeleteCustomer}
            onCancel={goBack}
            onOpenHistory={() => navigate(ROUTES.history(route.name))}
            saving={modalSaving}
          />
        );
    } else if (route.type === "history") {
      const c = customers[route.name];
      if (!customersLoaded || !recordsLoaded)
        page = <PageLoading onBack={goBack} eyebrow="Customer history" />;
      else if (!c) page = <PageNotFound what="Customer" onBack={toList} />;
      else
        page = (
          <CustomerHistoryPage
            key={route.name}
            name={route.name}
            customer={c}
            records={customerHistoryMap[route.name] || []}
            onBack={goBack}
            onEditCustomer={() => navigate(ROUTES.editCustomer(route.name))}
            onAddVisit={() => startVisitFor(route.name)}
            onEditRecord={(r) => navigate(ROUTES.editRecord(r._id || r.id))}
            onOpenMonth={(k) => navigate(ROUTES.visits(route.name, k))}
          />
        );
    } else if (route.type === "visits") {
      const m = monthlyAnalysis.find((x) => x.key === route.monthKey);
      const half = new URLSearchParams(location.search).get("half");
      const hObj =
        m && (half === "1" || half === "2") ? m.halves[Number(half) - 1] : null;
      const row = (hObj || m)?.customerRows.find((x) => x.name === route.name);
      if (!recordsLoaded)
        page = <PageLoading onBack={goBack} eyebrow="Month visits" />;
      else if (!row) page = <PageNotFound what="Visits" onBack={toList} />;
      else
        page = (
          <VisitsPage
            key={`${route.name}-${route.monthKey}-${half || "all"}`}
            name={route.name}
            month={hObj ? `${m.label} (${hObj.title})` : m.label}
            currentKey={m.key}
            records={row.records}
            otherMonths={monthlyAnalysis
              .map((x) => {
                const r = x.customerRows.find((y) => y.name === route.name);
                return r
                  ? { key: x.key, label: x.label, visits: r.visits }
                  : null;
              })
              .filter(Boolean)}
            onBack={goBack}
            onOpenHistory={() => navigate(ROUTES.history(route.name))}
            onEditRecord={(r) => navigate(ROUTES.editRecord(r._id || r.id))}
            onOpenMonth={(k) =>
              navigate(ROUTES.visits(route.name, k), { replace: true })
            }
          />
        );
    } else if (route.type === "period") {
      const idx = monthlyAnalysis.findIndex((x) => x.key === route.monthKey);
      const m = monthlyAnalysis[idx];
      const per = route.period;
      if (!recordsLoaded)
        page = <PageLoading onBack={goBack} eyebrow="Period report" />;
      else if (!m || !["1", "2", "full"].includes(per))
        page = <PageNotFound what="Report" onBack={toList} />;
      else {
        let prevData = null;
        let prevLabel = "";
        if (per === "full") {
          const pm = monthlyAnalysis[idx + 1];
          if (pm) {
            prevData = pm;
            prevLabel = pm.label;
          }
        } else if (per === "2") {
          prevData = m.halves[0];
          prevLabel = `${m.label} · ${m.halves[0].title}`;
        } else {
          const pm = monthlyAnalysis[idx + 1];
          if (pm) {
            prevData = pm.halves[1];
            prevLabel = `${pm.label} · ${pm.halves[1].title}`;
          }
        }
        const list =
          per === "full"
            ? monthlyAnalysis.map((x) => ({ m: x, p: "full" }))
            : monthlyAnalysis.flatMap((x) =>
                [
                  { m: x, p: "2" },
                  { m: x, p: "1" },
                ].filter((e) => x.halves[Number(e.p) - 1].totalVisits > 0),
              );
        const li = list.findIndex((e) => e.m.key === m.key && e.p === per);
        const older = li >= 0 ? list[li + 1] : null;
        const newer = li > 0 ? list[li - 1] : null;
        page = (
          <PeriodReportPage
            key={`${m.key}-${per}`}
            month={m}
            period={per}
            prev={prevData ? { data: prevData, label: prevLabel } : null}
            onBack={goBack}
            onOlder={
              older
                ? () =>
                    navigate(ROUTES.period(older.m.key, older.p), {
                      replace: true,
                    })
                : null
            }
            onNewer={
              newer
                ? () =>
                    navigate(ROUTES.period(newer.m.key, newer.p), {
                      replace: true,
                    })
                : null
            }
            onSwitch={(p) =>
              navigate(ROUTES.period(m.key, p), { replace: true })
            }
            onOpenCustomer={(n) => navigate(ROUTES.history(n))}
            onOpenVisits={(n) =>
              navigate(
                ROUTES.visits(n, m.key, per === "full" ? undefined : per),
              )
            }
            onOpenInsight={(k, v) => navigate(ROUTES.insight(m.key, per, k, v))}
          />
        );
      }
    } else if (route.type === "insight") {
      const idx = monthlyAnalysis.findIndex((x) => x.key === route.monthKey);
      const m = monthlyAnalysis[idx];
      const per = route.period;
      if (!recordsLoaded)
        page = <PageLoading onBack={goBack} eyebrow="Insights" />;
      else if (!m || !["1", "2", "full"].includes(per))
        page = <PageNotFound what="Report" onBack={toList} />;
      else {
        let prevData = null;
        let prevLabel = "";
        if (per === "full") {
          const pm = monthlyAnalysis[idx + 1];
          if (pm) {
            prevData = pm;
            prevLabel = pm.label;
          }
        } else if (per === "2") {
          prevData = m.halves[0];
          prevLabel = `${m.label} · ${m.halves[0].title}`;
        } else {
          const pm = monthlyAnalysis[idx + 1];
          if (pm) {
            prevData = pm.halves[1];
            prevLabel = `${pm.label} · ${pm.halves[1].title}`;
          }
        }
        page = (
          <InsightPage
            key={`${m.key}-${per}-${route.kind}`}
            kind={route.kind}
            selected={route.value}
            month={m}
            period={per}
            prev={prevData ? { data: prevData, label: prevLabel } : null}
            onBack={goBack}
            onSelect={(v) =>
              navigate(ROUTES.insight(m.key, per, route.kind, v), {
                replace: true,
              })
            }
            onSwitchKind={(k) =>
              navigate(ROUTES.insight(m.key, per, k), { replace: true })
            }
            onOpenCustomer={(n) => navigate(ROUTES.history(n))}
            onOpenVisits={(n) =>
              navigate(
                ROUTES.visits(n, m.key, per === "full" ? undefined : per),
              )
            }
          />
        );
      }
    } else if (route.type === "recordEdit") {
      const rec = records.find((r) => (r._id || r.id) === route.id);
      if (!recordsLoaded)
        page = <PageLoading onBack={goBack} eyebrow="Edit record" />;
      else if (!rec) page = <PageNotFound what="Record" onBack={toList} />;
      else
        page = (
          <RecordEditPage
            key={route.id}
            record={rec}
            customers={customers}
            customerList={customerList}
            history={customerHistoryMap[rec.customer] || []}
            onSave={updateRecord}
            onDelete={deleteRecordAndLeave}
            onCancel={goBack}
            onOpenHistory={() => navigate(ROUTES.history(rec.customer))}
            saving={recordSaving}
          />
        );
    }
    return (
      <>
        <Toast msg={toast.msg} type={toast.type} />
        {page}
      </>
    );
  }

  return (
    <div
      className="dsr-layout"
      style={{
        background: DS.bg,
        fontFamily:
          "'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        color: DS.text1,
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
        {activeTab === "records" && (
          <>
            <RecordsInsights
              latest={uniqueLatestRecords}
              todayCount={todayCount}
              followCount={followUps.length}
              followOnly={followOnly}
              onFollow={() => setFollowOnly((v) => !v)}
              stage={stageFilter}
              onStage={setStageFilter}
              topArea={topArea}
            />
            <RecordsToolbar
              searchRef={searchRef}
              q={searchQuery}
              setQ={setSearchQuery}
              preset={activeFilter}
              setPreset={setActiveFilter}
              counts={presetCounts}
              start={filterStart}
              end={filterEnd}
              setStart={setFilterStart}
              setEnd={setFilterEnd}
              stage={stageFilter}
              setStage={setStageFilter}
              dist={distFilter}
              setDist={setDistFilter}
              area={areaFilter}
              setArea={setAreaFilter}
              dists={distOptions}
              areas={areaOptions}
              sort={sortBy}
              setSort={setSortBy}
              view={viewMode}
              setView={setViewMode}
              followOnly={followOnly}
              setFollowOnly={setFollowOnly}
              shown={filteredRecords.length}
              total={records.length}
              onClear={clearAllFilters}
              exportNode={
                <ExportDropdown records={filteredRecords} onExport={doExport} />
              }
            />
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
                    fontWeight: 600,
                    color: DS.text1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  No records found
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: DS.text2 }}>
                  Try a different filter or search
                </div>
                {filteredRecords.length < records.length && (
                  <button
                    className="dsr-ghost-btn"
                    style={{ marginTop: 14 }}
                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === "table" ? (
                  <RecordRows
                    rows={filteredRecords.slice(0, visibleCount)}
                    onOpen={(n) => navigate(ROUTES.history(n))}
                    onEdit={(r) => navigate(ROUTES.editRecord(r._id || r.id))}
                    onDelete={(id) => deleteRecord(id, true)}
                  />
                ) : (
                  <div className="dsr-rc-grid">
                    {filteredRecords.slice(0, visibleCount).map((r) => (
                      <RecordCard
                        key={r._id || r.id}
                        record={r}
                        onDelete={(id) => deleteRecord(id, true)}
                        onEdit={(rec) =>
                          navigate(ROUTES.editRecord(rec._id || rec.id))
                        }
                        onOpen={() => navigate(ROUTES.history(r.customer))}
                      />
                    ))}
                  </div>
                )}
                {filteredRecords.length > visibleCount && (
                  <button
                    className="dsr-ghost-btn dsr-more-btn"
                    onClick={() => setVisibleCount((n) => n + 30)}
                  >
                    Show 30 more · {filteredRecords.length - visibleCount} left
                  </button>
                )}
              </>
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
                        : "color-mix(in srgb, var(--wash) 4.0%, transparent)",
                    }}
                    type="date"
                    name="date"
                    value={newRecord.date}
                    onChange={handleRecordChange}
                  />
                  {!newRecord.date && (
                    <div
                      style={{
                        fontSize: 12,
                        color: DS.amber,
                        marginTop: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Icon name="calendar" size={11} strokeWidth={2} />
                      <span>Select date manually</span>
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
                  fontSize: 12,
                  color: DS.info,
                  background: DS.surface,
                  padding: "9px 12px",
                  borderRadius: 8,
                  marginTop: 4,
                  lineHeight: 1.5,
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
                  Select a saved customer and the fields will auto-fill.
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
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 12,
                color: "inherit",
              }}
            >
              {loading ? (
                <span
                  className="dsr-spinner"
                  style={{
                    width: 15,
                    height: 15,
                    border: "2px solid rgba(0,0,0,0.2)",
                    borderTopColor: "#0A0B10",
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
                  fontWeight: 600,
                  color: DS.text1,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Icon name="store" size={15} strokeWidth={2} /> Customer Master{" "}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: DS.text2,
                    marginLeft: 8,
                  }}
                >
                  {customerList.length} total
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="dsr-ghost-btn"
                  disabled={visibleCustomerList.length === 0}
                  title="Full customer details in Excel"
                  onClick={() => {
                    const n = exportCustomersXlsx(
                      customers,
                      visibleCustomerList,
                      customerHistoryMap,
                    );
                    showToast(`Downloading Excel! (${n} customers)`);
                  }}
                  style={{ height: 34, fontSize: 12 }}
                >
                  <Icon name="download" size={13} strokeWidth={2.1} /> Download
                  {customerQuery.trim()
                    ? ` (${visibleCustomerList.length})`
                    : ""}
                </button>
                <button
                  className="ei-import-btn"
                  onClick={() => setShowImporter(true)}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    background: DS.surface,
                    color: DS.text1,
                    border: `1px solid ${DS.border}`,
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Icon name="upload" size={13} strokeWidth={2.1} /> Excel
                  Upload
                </button>
                <button
                  onClick={openAddCustomer}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    background: "rgba(212,175,106,0.10)",
                    color: DS.primary,
                    border: "1px solid rgba(212,175,106,0.25)",
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
            {customerList.length > 0 && (
              <div style={{ position: "relative", marginBottom: 12 }}>
                <Icon
                  name="search"
                  size={14}
                  style={{
                    position: "absolute",
                    left: 12,
                    top: 12,
                    color: DS.text3,
                  }}
                />
                <input
                  className="dsr-input"
                  style={{ ...IS, paddingLeft: 34, height: 40 }}
                  placeholder="Naam, area, contact person, mobile, GSTIN…"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />
              </div>
            )}
            {customerList.length > 0 && visibleCustomerList.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: 24,
                  fontSize: 12.5,
                  color: DS.text2,
                }}
              >
                No customers match "{customerQuery}".
              </div>
            )}
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
                    fontWeight: 600,
                    color: DS.text1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  No customers yet
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: DS.text2 }}>
                  Import from Excel or add manually
                </div>
              </div>
            ) : (
              visibleCustomerList.map((name) => {
                const c = customers[name];
                const lastR = customerLastRecord[name];
                return (
                  <div
                    key={name}
                    className="dsr-customer-row"
                    role="button"
                    tabIndex={0}
                    title="Visit history dekhein"
                    onClick={() => navigate(ROUTES.history(name))}
                    onKeyDown={(e) => {
                      if (e.target !== e.currentTarget) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        navigate(ROUTES.history(name));
                      }
                    }}
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
                        background: DS.surface,
                        border: `1px solid ${DS.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 500,
                        color: DS.text2,
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
                        style={{ fontSize: 12, color: DS.text2, marginTop: 1 }}
                      >
                        {c.area} · {c.distributor}
                        {(c.contactPerson || c.mobile) && (
                          <span style={{ marginLeft: 5, color: DS.text1 }}>
                            · {c.contactPerson}
                            {c.contactPerson && c.mobile ? " · " : ""}
                            {c.mobile && (
                              <span className="dsr-mono">{c.mobile}</span>
                            )}
                          </span>
                        )}
                        {lastR && (
                          <span style={{ marginLeft: 5, color: DS.text3 }}>
                            · {fmtDate(lastR.date)}
                          </span>
                        )}
                        <span style={{ marginLeft: 5, color: DS.primary }}>
                          · {(customerHistoryMap[name] || []).length} visit
                          {(customerHistoryMap[name] || []).length !== 1
                            ? "s"
                            : ""}
                        </span>
                      </div>
                    </div>
                    <div className="dsr-cust-ladder">
                      <StageLadder stage={c.stage} size="sm" />
                    </div>
                    <div
                      className="dsr-row-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isValidMobile(c.mobile) ? (
                        <a
                          href={`tel:+91${c.mobile}`}
                          aria-label={`Call ${name}`}
                          title={`Call ${fmtMobile(c.mobile)}`}
                          style={{
                            height: 30,
                            width: 30,
                            borderRadius: 6,
                            border: "1px solid rgba(34,197,94,0.30)",
                            color: DS.success,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Icon name="phone" size={13} strokeWidth={2} />
                        </a>
                      ) : (
                        <span
                          style={{ width: 30, height: 30 }}
                          aria-hidden="true"
                        />
                      )}
                      <button
                        className="dsr-btn-edit"
                        onClick={() => openEditCustomer(name)}
                        aria-label={`Edit ${name}`}
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
                        aria-label={`Delete ${name}`}
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
                  fontWeight: 600,
                  color: DS.text1,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Icon name="trending" size={15} strokeWidth={2} /> Monthly Visit
                Analysis
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: DS.text2 }}>
                  {monthlyAnalysis.length} month
                  {monthlyAnalysis.length !== 1 ? "s" : ""} tracked
                </span>
                {monthlyAnalysis.length > 0 && (
                  <div
                    className="dsr-seg2"
                    role="group"
                    aria-label="Analysis view"
                  >
                    <button
                      className={analysisView === "cards" ? "on" : ""}
                      onClick={() => setAnalysisView("cards")}
                      aria-label="Card view"
                      aria-pressed={analysisView === "cards"}
                      title="Card view"
                    >
                      ▦
                    </button>
                    <button
                      className={analysisView === "list" ? "on" : ""}
                      onClick={() => setAnalysisView("list")}
                      aria-label="List view"
                      aria-pressed={analysisView === "list"}
                      title="List view"
                    >
                      ☰
                    </button>
                  </div>
                )}
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
                    fontWeight: 600,
                    color: DS.text1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  No data available
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: DS.text2 }}>
                  Add records and the monthly analysis will appear here
                </div>
              </div>
            ) : analysisView === "list" ? (
              <MonthAnalysisList
                rows={monthlyAnalysis.map((m, idx) => {
                  const prev = monthlyAnalysis[idx + 1];
                  return {
                    month: m,
                    delta: prev ? m.totalVisits - prev.totalVisits : null,
                  };
                })}
                onOpen={(m) => navigate(ROUTES.period(m.key, "full"))}
              />
            ) : (
              <div
                className="dsr-card-list"
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {monthlyAnalysis.map((m, idx) => {
                  const prev = monthlyAnalysis[idx + 1];
                  const delta = prev ? m.totalVisits - prev.totalVisits : null;
                  return (
                    <MonthAnalysisCard
                      key={m.key}
                      month={m}
                      delta={delta}
                      onOpen={() => navigate(ROUTES.period(m.key, "full"))}
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

      {showImporter && (
        <ExcelImporter
          existingCustomers={customers}
          onImportDone={handleImportDone}
          onClose={() => setShowImporter(false)}
          apiBase={API}
          getToken={getToken}
        />
      )}
    </div>
  );
};

export default DailySalesReport;
