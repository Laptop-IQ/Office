import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import * as XLSX from "xlsx-js-style";
import { useNavigate, useLocation } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

const DS = {
  bg: "#0A0B10",
  sidebar: "#07080B",
  card: "#12141B",
  surface: "#191C25",
  border: "#272B38",
  borderHi: "#3C4153",
  primary: "#D4AF6A",
  primaryGlow: "rgba(212,175,106,0.20)",
  primaryDim: "rgba(212,175,106,0.08)",
  gold: "#E9CF98",
  goldGlow: "rgba(233,207,152,0.20)",
  goldDim: "rgba(233,207,152,0.08)",
  text1: "#F4EFE6",
  text2: "#A9A396",
  text3: "#6E6B63",
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
  // NOTE: @import must be the very first rule, otherwise browsers ignore it.
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=IBM+Plex+Mono:wght@500;600;700&family=Playfair+Display:wght@500;600;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; }
    .dsr-layout, .dsr-layout input, .dsr-layout select, .dsr-layout button, .dsr-layout textarea,
    .dsr-pages, .dsr-pages input, .dsr-pages select, .dsr-pages button, .dsr-pages textarea {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
    }
    .dsr-mono { font-family: 'IBM Plex Mono','SF Mono',ui-monospace,Consolas,monospace; font-feature-settings:"tnum" 1,"zero" 1; letter-spacing:-0.01em; }
    .dsr-layout ::selection { background:rgba(212,175,106,0.28); color:#F4EFE6; }
    .dsr-layout button:focus-visible,.dsr-layout input:focus-visible,.dsr-layout select:focus-visible { outline:2px solid #D4AF6A; outline-offset:2px; border-radius:6px; }
    @media(prefers-reduced-motion:reduce){.dsr-layout *,.dsr-layout *::before,.dsr-layout *::after{animation-duration:0.001ms!important;transition-duration:0.001ms!important;}}

    .dsr-display { font-family:'Playfair Display','Times New Roman',serif!important; letter-spacing:0.005em; font-weight:600; }
    .dsr-pages ::selection { background:rgba(212,175,106,0.30); color:#F4EFE6; }
    .dsr-pages button:focus-visible,.dsr-pages input:focus-visible,.dsr-pages select:focus-visible { outline:2px solid #D4AF6A; outline-offset:2px; border-radius:6px; }
    .dsr-layout, .dsr-pages { background-image:radial-gradient(ellipse at 15% 0%,rgba(212,175,106,0.07) 0%,transparent 45%),radial-gradient(ellipse at 90% 100%,rgba(212,175,106,0.04) 0%,transparent 50%)!important; }
    .dsr-half-card { transition:border-color .2s,box-shadow .2s,transform .2s; }
    .dsr-half-card:hover { border-color:rgba(212,175,106,0.55)!important; box-shadow:0 14px 30px -18px rgba(212,175,106,0.45); transform:translateY(-1px); }
    .dsr-half-open { font-size:11px; font-weight:700; color:#D4AF6A; opacity:0; transform:translateX(-4px); transition:opacity .2s,transform .2s; white-space:nowrap; }
    .dsr-half-card:hover .dsr-half-open, .dsr-half-card:focus-within .dsr-half-open { opacity:1; transform:none; }
    @media(max-width:767px){ .dsr-half-open{opacity:1;transform:none;} }
    @media(max-width:640px){ .dsr-home-text{display:none;} }
    .dsr-home-link:hover { background:rgba(212,175,106,0.15)!important; }
    .dsr-gold-rule { height:1px; border:0; background:linear-gradient(90deg,transparent,rgba(212,175,106,0.55),transparent); margin:0; }
    .dsr-glass { background:linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))!important; backdrop-filter:blur(14px); border:1px solid rgba(212,175,106,0.16)!important; box-shadow:0 1px 0 rgba(255,255,255,0.05) inset,0 18px 40px -20px rgba(0,0,0,0.7)!important; }
    .dsr-pagebar { position:sticky; top:0; z-index:60; background:rgba(10,11,16,0.82); backdrop-filter:blur(16px) saturate(1.3); border-bottom:1px solid rgba(212,175,106,0.18); }
    .dsr-back-btn { display:inline-flex; align-items:center; gap:7px; height:36px; padding:0 14px 0 10px; border-radius:999px; border:1px solid rgba(212,175,106,0.30); background:rgba(212,175,106,0.06); color:#D4AF6A; font-size:12.5px; font-weight:700; cursor:pointer; transition:background .15s,transform .15s; }
    .dsr-back-btn:hover { background:rgba(212,175,106,0.14); transform:translateX(-2px); }
    .dsr-page-enter { animation:dsr-page-in .45s cubic-bezier(0.16,1,0.3,1) both; }
    @keyframes dsr-page-in { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
    .dsr-page-grid { display:grid; grid-template-columns:minmax(0,1fr); gap:20px; align-items:start; }
    .dsr-stat-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
    .dsr-ghost-btn { display:inline-flex; align-items:center; justify-content:center; gap:7px; height:38px; padding:0 14px; border-radius:10px; border:1px solid #272B38; background:rgba(255,255,255,0.03); color:#F4EFE6; font-size:12.5px; font-weight:600; cursor:pointer; transition:border-color .15s,color .15s,background .15s; }
    .dsr-ghost-btn:hover:not(:disabled) { border-color:#D4AF6A; color:#D4AF6A; background:rgba(212,175,106,0.08); }
    .dsr-ghost-btn:disabled { opacity:.45; cursor:not-allowed; }
    .dsr-sticky-actions { position:sticky; bottom:0; z-index:40; margin:20px -16px -16px; padding:14px 16px; background:linear-gradient(180deg,rgba(10,11,16,0),rgba(10,11,16,0.94) 35%); backdrop-filter:blur(8px); }
    @keyframes dsr-shimmer { 0%{background-position:-400px 0;} 100%{background-position:400px 0;} }
    .dsr-skeleton { border-radius:12px; background:linear-gradient(90deg,#14161d 25%,#1c1f29 37%,#14161d 63%); background-size:800px 100%; animation:dsr-shimmer 1.4s infinite linear; }
    @media(min-width:960px){
      .dsr-page-grid.has-aside { grid-template-columns:minmax(0,1fr) 340px; }
      .dsr-aside-sticky { position:sticky; top:84px; }
      .dsr-stat-grid.cols4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
      .dsr-sticky-actions { margin:20px 0 0; padding:0; position:static; background:none; backdrop-filter:none; }
    }
    @keyframes dsr-modal-in { from{opacity:0;transform:translateY(12px) scale(0.97);} to{opacity:1;transform:translateY(0) scale(1);} }
    .dsr-modal-box { animation:dsr-modal-in 0.28s cubic-bezier(0.16,1,0.3,1) both; }
    .dsr-ladder-seg { transition:background-color 0.35s cubic-bezier(0.16,1,0.3,1),box-shadow 0.35s ease; }
    @keyframes dsr-spin { to{transform:rotate(360deg);} }
    .dsr-spinner { width:28px;height:28px;border-radius:50%;border:3px solid rgba(255,255,255,0.08);border-top-color:#D4AF6A;animation:dsr-spin 0.7s linear infinite;margin:0 auto 14px; }
    .dsr-empty-icon { width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(212,175,106,0.12),rgba(59,130,246,0.12));border:1px solid rgba(212,175,106,0.2);display:flex;align-items:center;justify-content:center;font-size:28px;margin:0 auto 14px; }
    .dsr-input:focus { outline:none;border-color:#D4AF6A!important;box-shadow:0 0 0 3px rgba(212,175,106,0.18)!important; }
    .dsr-input-highlight { border-color:#F59E0B!important;background:rgba(245,158,11,0.06)!important;box-shadow:0 0 0 2px rgba(245,158,11,0.15)!important; }
    .dsr-input-highlight:focus { border-color:#D97706!important;box-shadow:0 0 0 3px rgba(217,119,6,0.22)!important; }
    .dsr-btn-primary { background:linear-gradient(135deg,#F2D48F,#A8823A)!important;border:none!important;box-shadow:0 1px 2px rgba(0,0,0,0.25),0 8px 20px -6px rgba(212,175,106,0.50);transition:transform 0.18s cubic-bezier(0.16,1,0.3,1),box-shadow 0.18s ease,filter 0.18s ease; }
    .dsr-btn-primary:hover:not(:disabled) { filter:brightness(1.07);transform:translateY(-1.5px);box-shadow:0 2px 4px rgba(0,0,0,0.3),0 12px 24px -6px rgba(212,175,106,0.60); }
    .dsr-btn-primary:active:not(:disabled) { transform:translateY(0);filter:brightness(0.97); }
    .dsr-btn-primary:disabled { opacity:0.5;cursor:not-allowed;box-shadow:none; }
    .dsr-btn-danger:hover { background:rgba(244,63,94,0.15)!important;color:#FB7185!important;border-color:rgba(244,63,94,0.4)!important; }
    .dsr-btn-edit:hover { background:rgba(59,130,246,0.12)!important;color:#60A5FA!important;border-color:rgba(59,130,246,0.35)!important; }
    .dsr-btn-export { background:linear-gradient(135deg,#0D9B72,#047857)!important;box-shadow:0 1px 2px rgba(0,0,0,0.2),0 8px 18px -6px rgba(4,120,87,0.45);transition:transform 0.18s cubic-bezier(0.16,1,0.3,1),box-shadow 0.18s ease,filter 0.18s ease; }
    .dsr-btn-export:hover { filter:brightness(1.08);transform:translateY(-1.5px); }
    .dsr-record-card { transition:box-shadow 0.25s cubic-bezier(0.16,1,0.3,1),transform 0.25s cubic-bezier(0.16,1,0.3,1),border-color 0.25s ease;box-shadow:0 1px 2px rgba(0,0,0,0.2),0 1px 1px rgba(0,0,0,0.15); }
    .dsr-record-card:hover { box-shadow:0 4px 8px rgba(0,0,0,0.3),0 16px 32px -12px rgba(212,175,106,0.20)!important;transform:translateY(-2px);border-color:#3C4153!important; }
    .dsr-customer-row { transition:background 0.12s;cursor:pointer; }
    .dsr-customer-row:focus-visible { outline:2px solid #D4AF6A;outline-offset:-2px; }
    .dsr-customer-row:hover { background:rgba(212,175,106,0.06)!important; }
    .dsr-customer-row:hover .dsr-row-actions { opacity:1!important; }
    .dsr-row-actions { opacity:0;transition:opacity 0.15s;display:flex;gap:6px;flex-shrink:0; }
    @media(max-width:767px){.dsr-row-actions{opacity:1!important;}}
    .dsr-nav-item:hover { background:rgba(255,255,255,0.05)!important; }
    .dsr-nav-item.active { background:rgba(212,175,106,0.14)!important;color:#D4AF6A!important; }
    .dsr-topbar-btn:hover { background:rgba(255,255,255,0.12)!important; }
    .dsr-topbar-btn:active { background:rgba(255,255,255,0.20)!important; }
    .dsr-visits-btn { transition:background 0.15s,border-color 0.15s,transform 0.15s; }
    .dsr-visits-btn:hover { background:rgba(212,175,106,0.18)!important;border-color:#D4AF6A!important;transform:translateY(-1px); }
    .dsr-export-dropdown { position:relative;display:inline-flex;flex-shrink:0; }
    .dsr-export-menu { position:absolute;top:calc(100% + 6px);right:0;background:#12141B;border:1px solid #272B38;border-radius:12px;padding:8px;min-width:240px;z-index:200;box-shadow:0 8px 32px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3); }
    .dsr-export-menu-item { display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:8px;cursor:pointer;transition:background 0.12s;font-size:13px;font-weight:500;color:#F4EFE6;border:none;background:transparent;width:100%;text-align:left; }
    .dsr-export-menu-item:hover { background:rgba(212,175,106,0.10);color:#D4AF6A; }
    .dsr-export-menu-item.active { background:rgba(212,175,106,0.12);color:#D4AF6A;font-weight:700; }
    .dsr-export-divider { height:1px;background:#272B38;margin:6px 0; }
    .dsr-export-custom-row { padding:10px 12px 4px;display:flex;flex-direction:column;gap:6px; }
    .dsr-export-custom-row label { font-size:11px;font-weight:700;color:#A9A396;text-transform:uppercase;letter-spacing:0.05em; }
    .dsr-export-custom-inputs { display:flex;gap:6px;align-items:center; }
    .dsr-card-expanded { border:1.5px solid #D4AF6A!important;box-shadow:0 4px 8px rgba(0,0,0,0.25),0 16px 40px -10px rgba(212,175,106,0.22)!important; }
    .dsr-expand-btn { height:28px;padding:0 10px;border-radius:6px;border:1px solid #272B38;background:transparent;font-size:11px;font-weight:600;cursor:pointer;color:#A9A396;transition:all 0.15s;display:flex;align-items:center;gap:4px; }
    .dsr-expand-btn:hover,.dsr-expand-btn.expanded { background:rgba(59,130,246,0.10);color:#60A5FA;border-color:rgba(59,130,246,0.35); }
    .dsr-card-detail-section { overflow:hidden;transition:max-height 0.3s cubic-bezier(0.4,0,0.2,1),opacity 0.2s ease;max-height:0;opacity:0; }
    .dsr-card-detail-section.open { max-height:800px;opacity:1; }
    .dsr-filter-chip { display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;border:1px solid #272B38;background:rgba(255,255,255,0.03);font-size:12px;font-weight:600;color:#A9A396;cursor:pointer;transition:all 0.15s;white-space:nowrap; }
    .dsr-filter-chip:hover { border-color:#D4AF6A;color:#D4AF6A;background:rgba(212,175,106,0.08); }
    .dsr-filter-chip.active { background:#D4AF6A;color:#0A0B10;border-color:#D4AF6A; }
    .dsr-cust-banner { background:rgba(212,175,106,0.06);border:1px solid rgba(212,175,106,0.20);border-left:4px solid #D4AF6A;border-radius:10px;padding:12px 14px;margin-bottom:14px; }
    .dsr-cust-banner-title { font-size:10px;font-weight:700;color:#D4AF6A;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;display:flex;align-items:center;gap:5px; }
    .dsr-cust-banner-grid { display:grid;grid-template-columns:1fr 1fr;gap:6px 14px; }
    .dsr-cust-banner-item { display:flex;flex-direction:column;gap:1px; }
    .dsr-cust-banner-key { font-size:9px;color:#6E6B63;font-weight:600;text-transform:uppercase;letter-spacing:0.05em; }
    .dsr-cust-banner-val { font-size:12px;font-weight:700;color:#E9CF98; }
    .dsr-last-hint { display:inline-flex;align-items:center;gap:5px;margin-top:5px;padding:3px 9px 3px 7px;border-radius:20px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);font-size:11px;color:#E9CF98;line-height:1.4;cursor:pointer;transition:background 0.15s;max-width:100%;overflow:hidden; }
    .dsr-last-hint:hover { background:rgba(245,158,11,0.15); }
    .dsr-last-hint .hint-text { overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
    .dsr-last-hint .hint-use { flex-shrink:0;font-weight:700;color:#E9CF98;margin-left:3px; }
    .dsr-edit-stripe { background:linear-gradient(135deg,#1B1D28,#2C3042);border-radius:10px 10px 0 0;margin:-20px -20px 16px -20px;padding:16px 20px;display:flex;align-items:center;justify-content:space-between; }
    .dsr-modal-box::-webkit-scrollbar { width:4px; }
    .dsr-modal-box::-webkit-scrollbar-track { background:#191C25; }
    .dsr-modal-box::-webkit-scrollbar-thumb { background:#272B38;border-radius:2px; }
    .dsr-scroll::-webkit-scrollbar { width:4px; }
    .dsr-scroll::-webkit-scrollbar-track { background:#191C25; }
    .dsr-scroll::-webkit-scrollbar-thumb { background:#272B38;border-radius:2px; }
    @keyframes ei-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.45);}70%{box-shadow:0 0 0 7px rgba(34,197,94,0);}100%{box-shadow:0 0 0 0 rgba(34,197,94,0);} }
    .ei-import-btn { animation:ei-pulse 2s ease-out 1; }
    .ei-import-btn:hover { background:#059669!important; }
    .ei-input { transition:border-color 0.15s,box-shadow 0.15s;outline:none; }
    .ei-input:focus { border-color:#D4AF6A!important;box-shadow:0 0 0 3px rgba(212,175,106,0.18)!important; }
    .ei-row-new { background:rgba(212,175,106,0.05); }
    .ei-row-dup { background:rgba(245,158,11,0.05); }
    .ei-row-new td:first-child { border-left:3px solid #D4AF6A; }
    .ei-row-dup td:first-child { border-left:3px solid #F59E0B; }
    .ei-check:checked { accent-color:#D4AF6A; }
    .ei-btn-primary { background:linear-gradient(135deg,#F2D48F,#A8823A);color:#0A0B10;border:none;border-radius:8px;cursor:pointer;font-weight:700;box-shadow:0 1px 2px rgba(0,0,0,0.2),0 8px 20px -6px rgba(212,175,106,0.45);transition:filter 0.18s,transform 0.18s; }
    .ei-btn-primary:hover:not(:disabled) { filter:brightness(1.07);transform:translateY(-1.5px); }
    .ei-btn-primary:disabled { opacity:0.5;cursor:not-allowed;box-shadow:none; }
    .ei-btn-secondary { background:rgba(255,255,255,0.05);color:#F4EFE6;border:1px solid #272B38;border-radius:8px;cursor:pointer;font-weight:500;transition:background 0.15s; }
    .ei-btn-secondary:hover { background:rgba(255,255,255,0.08); }
    .ei-dropzone { border:2px dashed #272B38;border-radius:12px;background:rgba(255,255,255,0.02);transition:border-color 0.2s,background 0.2s;cursor:pointer; }
    .ei-dropzone.dragover { border-color:#D4AF6A;background:rgba(212,175,106,0.06); }
    .ei-table { border-collapse:collapse;width:100%;font-size:12px; }
    .ei-table th { background:#191C25;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#A9A396;padding:8px 10px;border-bottom:1px solid #272B38;position:sticky;top:0;z-index:1; }
    .ei-table td { padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.04);vertical-align:middle;color:#F4EFE6; }
    .ei-badge { display:inline-block;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700; }
    .ei-badge-new { background:rgba(212,175,106,0.15);color:#D4AF6A;border:1px solid rgba(212,175,106,0.3); }
    .ei-badge-dup { background:rgba(245,158,11,0.12);color:#E9CF98;border:1px solid rgba(245,158,11,0.3); }
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
      "Stage letter ya poora naam. Example: D ya D. Bulk Trials Complete",
    ],
    [
      "Potential / Existing / ABP",
      "Numbers",
      "Rs Lakhs, sirf number. Example: 2.5",
    ],
    ["Contact Person", "No", "Example: Ramesh Gupta"],
    ["Designation", "No", "Example: Owner, Purchase Manager"],
    [
      "Mobile / Alternate Mobile",
      "No",
      "10 digit, 6-9 se start. +91 ya 0 laga ho to bhi chalega. Example: 9876543210",
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
  border: `1px solid #272B38`,
  borderRadius: 8,
  fontSize: 13,
  color: "#F4EFE6",
  background: "rgba(255,255,255,0.04)",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  colorScheme: "dark",
};

const IH = {
  ...IS,
  borderColor: "#F59E0B",
  background: "rgba(245,158,11,0.06)",
  boxShadow: "0 0 0 2px rgba(245,158,11,0.15)",
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
            background: "linear-gradient(135deg,#0B0C11,#1B1D28)",
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
              background: "linear-gradient(135deg,#D4AF6A,#A8823A)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(212,175,106,0.35)",
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
                    "linear-gradient(135deg,rgba(212,175,106,0.12),rgba(59,130,246,0.12))",
                  border: "1px solid rgba(212,175,106,0.2)",
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
                  color: "#0A0B10",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(212,175,106,0.35)",
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
                  style={{ fontSize: 12.5, fontWeight: 700, color: DS.text1 }}
                >
                  Template chahiye?
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: DS.text2,
                    marginTop: 2,
                    lineHeight: 1.45,
                  }}
                >
                  Customer, Area, Distributor, Stage, numbers + Contact Person,
                  Mobile, Email, Address, GSTIN, Notes columns. Download kiya
                  hua customers file bhi seedha wapas upload ho sakta hai.
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
                    fontWeight: 700,
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
                      color: DS.gold,
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
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
                            style={{ color: DS.text2, fontSize: 11.5 }}
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
                            {r._missing.length > 0 && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: DS.danger,
                                  marginTop: 4,
                                  fontWeight: 700,
                                }}
                              >
                                Missing: {r._missing.join(", ")}
                              </div>
                            )}
                            {r._issues.length > 0 && (
                              <div
                                style={{
                                  fontSize: 10,
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
                      borderTopColor: "#0A0B10",
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
                  colorScheme: "dark",
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
          background: "rgba(233,207,152,0.12)",
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

// ── CustomSelect — fully dark-themed replacement for native <select> ───────
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
          color: isEmpty ? DS.text2 : DS.text1,
          borderColor: open ? DS.primary : highlight ? DS.amber : DS.border,
          boxShadow: open
            ? `0 0 0 3px rgba(212,175,106,0.18)`
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
          {selected?.value ? selected.label : selected?.label || placeholder}
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

      {open && !disabled && (
        <div
          className="dsr-scroll"
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
            const isStageOpt = PROJECT_STAGE_OPTIONS.some(
              (s) => s === opt.label,
            );
            const sc = isStageOpt ? stageColor(opt.label) : null;

            return (
              <div
                key={opt.value || "__empty__"}
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
              background: "rgba(212,175,106,0.07)",
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
                "rgba(212,175,106,0.08)",
                "rgba(212,175,106,0.2)",
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
                "rgba(233,207,152,0.06)",
                "rgba(233,207,152,0.18)",
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

const MonthAnalysisCard = ({ month, delta, onOpen }) => (
  <div
    className="dsr-record-card dsr-half-card"
    style={{
      background: DS.card,
      border: `1px solid ${DS.border}`,
      borderRadius: 14,
      overflow: "hidden",
      borderLeft: `4px solid ${DS.primary}`,
    }}
  >
    <div
      role="button"
      tabIndex={0}
      title="Full report kholo"
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
                fontSize: 10,
                fontWeight: 700,
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
              fontSize: 11.5,
              fontWeight: 700,
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
                  background:
                    ri === 0
                      ? `linear-gradient(160deg,${DS.surface},${DS.card})`
                      : DS.surface,
                  borderRadius: 10,
                  border: `1px solid ${ri === 0 ? DS.borderHi : DS.border}`,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: DS.text3,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  {lbl}
                </div>
                <div
                  className="dsr-mono"
                  style={{
                    fontSize: ri === 0 ? 22 : 14,
                    fontWeight: 700,
                    color: clr,
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
  { id: "records", icon: "records", label: "Records" },
  { id: "add", icon: "addRecord", label: "Add Record" },
  { id: "customers", icon: "store", label: "Customers" },
  { id: "analysis", icon: "trending", label: "Analysis" },
];

const Sidebar = ({ active, onChange, recordCount }) => (
  <div
    className="dsr-sidebar"
    style={{
      background: `linear-gradient(180deg,${DS.sidebar} 0%,#050609 100%)`,
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
            background: "linear-gradient(135deg,#F2D48F,#A8823A)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            fontWeight: 900,
            color: "#0A0B10",
            flexShrink: 0,
            boxShadow:
              "0 0 16px rgba(212,175,106,0.45),0 4px 12px -2px rgba(212,175,106,0.35)",
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
    <div style={{ padding: "14px 14px 0" }}>
      <HomeLink />
    </div>
    <nav style={{ padding: "12px 10px 14px", flex: 1 }}>
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
              active === t.id ? "rgba(212,175,106,0.12)" : "transparent",
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
                background: "linear-gradient(135deg,#F2D48F,#A8823A)",
                color: "#0A0B10",
                fontSize: 10,
                fontWeight: 900,
                padding: "1px 7px",
                borderRadius: 10,
                lineHeight: "16px",
                boxShadow: "0 2px 8px rgba(212,175,106,0.35)",
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

// ══════════════════════════════════════════════════════════════════════════
//  PAGES  (popups ab full pages hain)
//  /DailySalesReport/customer/new
//  /DailySalesReport/customer/:name/edit
//  /DailySalesReport/customer/:name/history
//  /DailySalesReport/visits/:name/:monthKey
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
  if (seg[0] === "analysis" && seg[1] && seg[2])
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
        fontWeight: 700,
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
    if (homeGuard && !window.confirm("Unsaved changes hain. Page chhodna hai?"))
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
              fontSize: 11.5,
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
            <span style={{ color: DS.primary, fontWeight: 700 }}>
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
                background: `linear-gradient(145deg,${DS.primaryGlow},rgba(255,255,255,0.02))`,
                border: `1px solid ${DS.primary}`,
                boxShadow: `0 0 0 4px ${DS.primaryDim}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
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
    title={`${what} nahi mila`}
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
      <div style={{ fontSize: 15, fontWeight: 700 }}>
        {what} available nahi hai
      </div>
      <div style={{ fontSize: 12.5, color: DS.text2, margin: "6px 0 18px" }}>
        Ho sakta hai delete ho gaya ho, ya link galat ho.
      </div>
      <button className="dsr-ghost-btn" onClick={onBack}>
        <Icon name="back" size={14} /> Wapas jao
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
        fontSize: 9.5,
        fontWeight: 700,
        color: DS.text3,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      className="dsr-mono"
      style={{
        fontSize: 20,
        fontWeight: 700,
        color: accent,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 10.5, color: DS.text2, marginTop: 3 }}>{sub}</div>
    )}
  </div>
);

const SubHead = ({ icon, children }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      color: DS.text3,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
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
            fontSize: 11,
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
          fontWeight: 800,
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
      <div style={{ fontSize: 13, fontWeight: 700, color: DS.danger }}>
        {title}
      </div>
      <div style={{ fontSize: 11.5, color: DS.text2, marginTop: 3 }}>
        {text}
      </div>
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
        fontWeight: 700,
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
  if (dirty && !window.confirm("Unsaved changes hain. Page chhodna hai?"))
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
        border: `1px solid ${accent}2E`,
        borderRadius: 12,
        padding: "11px 14px",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${accent}1F`,
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
            fontSize: 9.5,
            fontWeight: 800,
            color: accent,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
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
        background: `linear-gradient(160deg,${DS.surface},${DS.card})`,
        border: `1px solid ${isLatest ? DS.primary + "99" : DS.border}`,
        borderLeft: `4px solid ${isLatest ? DS.primary : sc.border}`,
        borderRadius: 16,
        padding: "15px 16px 16px",
        boxShadow: isLatest
          ? `0 0 0 1px ${DS.primaryDim},0 18px 36px -22px rgba(212,175,106,0.35)`
          : undefined,
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
            fontWeight: 700,
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
            style={{ fontSize: 10.5, color: DS.text3, fontWeight: 700 }}
          >
            #{total - index}
          </span>
          {isLatest && (
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: "#0A0B10",
                background: `linear-gradient(135deg,${DS.gold},${DS.primary})`,
                padding: "3px 10px",
                borderRadius: 20,
                letterSpacing: "0.08em",
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
                background: "rgba(255,255,255,0.03)",
                color: DS.text2,
                fontSize: 11.5,
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
        <span style={{ fontSize: 11, color: DS.text2, fontWeight: 600 }}>
          Market penetration
        </span>
        <span
          className="dsr-mono"
          style={{ fontSize: 12, fontWeight: 700, color: pctColor(pen) }}
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
            background: `linear-gradient(90deg,${DS.primary},${DS.gold})`,
            transition: "width .5s cubic-bezier(0.16,1,0.3,1)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 8,
          fontSize: 11,
          color: DS.text2,
        }}
      >
        <span>Existing {fmtL(ex)}</span>
        <span style={{ color: DS.gold, fontWeight: 700 }}>
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
          Abhi tak koi contact detail nahi.
          {onEdit && (
            <button
              className="dsr-ghost-btn"
              style={{ width: "100%", marginTop: 12 }}
              onClick={onEdit}
            >
              <Icon name="addRecord" size={14} /> Contact add karo
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
                border: `1px solid ${DS.primary}55`,
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
                  fontWeight: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {data.contactPerson || name || "—"}
              </div>
              {data.designation && (
                <div style={{ fontSize: 11, color: DS.text2 }}>
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
            <div style={{ marginTop: 8, fontSize: 10.5, color: DS.text2 }}>
              GSTIN{" "}
              <span
                className="dsr-mono"
                style={{ color: DS.gold, fontWeight: 700 }}
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
              <Icon name="copy" size={13} /> Number copy karo
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
        fontSize: 10.5,
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
            fontWeight: 700,
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
            letterSpacing: "0.04em",
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
            fontSize: 10.5,
            marginTop: 5,
            color: DS.danger,
            fontWeight: 600,
          }}
        >
          {cleanMobile(value).length < 10
            ? `${10 - cleanMobile(value).length} digit aur chahiye`
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
              fontWeight: 800,
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
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {name || "Customer name"}
            </div>
            <div style={{ fontSize: 11, color: DS.text2 }}>
              {data.area || "Area"} · {data.distributor || "Distributor"}
            </div>
          </div>
        </div>
        {data.stage && (
          <span
            style={{
              display: "inline-block",
              fontSize: 10.5,
              padding: "3px 9px",
              borderRadius: 5,
              fontWeight: 600,
              background: sc.bg,
              color: sc.text,
              border: `1px solid ${sc.border}55`,
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
              fontWeight: 700,
              color: profilePct >= 70 ? DS.success : DS.primary,
            }}
          >
            {profilePct}%
          </span>
          <span style={{ fontSize: 10.5, color: DS.text2 }}>
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
              background: `linear-gradient(90deg,${DS.primary},${DS.gold})`,
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
        <div style={{ fontSize: 11.5, color: DS.text2 }}>
          {done}/{required.length} required fields complete
        </div>
      </div>

      {isEdit && (
        <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
          <SubHead icon="clock">Activity</SubHead>
          <div style={{ fontSize: 12.5, marginBottom: 12 }}>
            <span
              className="dsr-mono"
              style={{ color: DS.primary, fontWeight: 700 }}
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
            <Icon name="records" size={14} /> Full visit history dekho
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
        isEdit ? "Master data update karo" : "Customer ka master data fill karo"
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
                fontSize: 11,
                marginTop: 6,
                color: DS.amber,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Icon name="alert" size={13} /> "{dupName}" naam se customer pehle
              se hai.
              {onOpenOther && (
                <button
                  className="dsr-ghost-btn"
                  style={{ height: 26, padding: "0 10px", fontSize: 11 }}
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
            placeholder="Person ka naam"
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
            <Icon name="alert" size={13} /> Yeh mobile "{dupMob}" ke saath bhi
            saved hai.
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
          <FieldNote>Email format sahi nahi hai</FieldNote>
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
          style={{ ...IS, textTransform: "uppercase", letterSpacing: "0.06em" }}
        />
        {data.gstin && (
          <FieldNote type={isValidGSTIN(data.gstin) ? "ok" : "error"}>
            {isValidGSTIN(data.gstin)
              ? "GSTIN valid ✓"
              : `${data.gstin.length}/15 — format abhi poora nahi`}
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
          text="Customer master data hat jayega. Yeh action undo nahi hoga."
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
          style={{ fontSize: 30, fontWeight: 700, color: pctColor(livePct) }}
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
        <div style={{ fontSize: 11.5, color: DS.text2 }}>
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
            <div style={{ fontSize: 11, color: DS.text2 }}>
              Outcome: {prev.outcome || "—"}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: DS.text2 }}>
            Is customer ki yeh pehli visit hai.
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
        text="Sirf yeh visit record delete hoga. Customer master data safe rahega."
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
            Abhi koi stage record nahi.
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
                    <div style={{ fontSize: 10.5, color: DS.text3 }}>
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
              fontSize: 11,
              padding: "5px 11px",
              borderRadius: 6,
              fontWeight: 700,
              background: sc.bg,
              color: sc.text,
              border: `1px solid ${sc.border}66`,
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
              fontWeight: 800,
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
          sub={since === null ? "" : since === 0 ? "Aaj" : `${since} din pehle`}
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
          <div style={{ fontSize: 14.5, fontWeight: 700, color: DS.text1 }}>
            Abhi tak koi visit nahi
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Is customer ka pehla record "Add visit" se banao
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
          "{q}" se koi visit match nahi hui.
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
                fontSize: 10.5,
                fontWeight: 700,
                color: DS.text3,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
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
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: DS.primary,
                    background: DS.primaryDim,
                    border: `1px solid ${DS.primary}55`,
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
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 6,
              fontWeight: 700,
              background: sc.bg,
              color: sc.text,
              border: `1px solid ${sc.border}66`,
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
      <span style={{ fontSize: 10.5, color: DS.text3, fontWeight: 700 }}>
        — no change
      </span>
    );
  }
  const up = d > 0;
  return (
    <span
      className="dsr-mono"
      style={{
        fontSize: 10.5,
        fontWeight: 700,
        color: up ? DS.success : DS.danger,
      }}
    >
      {up ? "▲ +" : "▼ "}
      {d.toFixed(digits)}
      {suffix}
    </span>
  );
};

const BarRow = ({ label, value, max, color = DS.primary, right }) => (
  <div style={{ marginBottom: 10 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        fontSize: 11.5,
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
        style={{ color, fontWeight: 700, flexShrink: 0 }}
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
          background: `linear-gradient(90deg,${color}99,${color})`,
          transition: "width .5s cubic-bezier(0.16,1,0.3,1)",
        }}
      />
    </div>
  </div>
);

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
          <div style={{ fontSize: 11, color: DS.text2, marginBottom: 12 }}>
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
                  style={{ fontSize: 13, fontWeight: 700 }}
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
        <SubHead icon="sparkle">Stage distribution</SubHead>
        {stageDist.map(({ st, n }) => (
          <BarRow
            key={st}
            label={st.length > 28 ? `${st.slice(0, 27)}…` : st}
            value={n}
            max={maxStage}
            color={stageColor(st).border}
            right={`${n}`}
          />
        ))}
      </div>

      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <SubHead icon="store">Distributor-wise visits</SubHead>
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
          />
        ))}
      </div>

      <div className="dsr-glass" style={{ borderRadius: 16, padding: 18 }}>
        <SubHead icon="pin">Top areas</SubHead>
        {byArea.map(([k, n]) => (
          <BarRow
            key={k}
            label={k}
            value={n}
            max={byArea[0][1]}
            color={DS.info}
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
                      fontSize: 9.5,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: "#0A0B10",
                      background: `linear-gradient(135deg,${DS.gold},${DS.primary})`,
                      padding: "3px 9px",
                      borderRadius: 20,
                    }}
                  >
                    {h.id === 1 ? "FIRST HALF" : "SECOND HALF"}
                  </span>
                  <span
                    className="dsr-mono"
                    style={{ fontSize: 13, fontWeight: 700 }}
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
                    Is period mein koi visit nahi
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
                          background: "rgba(255,255,255,0.03)",
                          border: `1px solid ${DS.border}`,
                          borderRadius: 9,
                          padding: "8px 10px",
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: DS.text3,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {lbl}
                        </div>
                        <div
                          className="dsr-mono"
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
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
                  <div style={{ fontSize: 10, color: DS.text3, marginTop: 8 }}>
                    ▲▼ = first half ke comparison mein
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
                  fontSize: 9.5,
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
                      ? `linear-gradient(180deg,${DS.gold},${DS.primary})`
                      : `linear-gradient(180deg,${DS.primary}CC,${DS.primary}55)`
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
                fontSize: 9,
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
              `Pichle period mein visit hui, is mein nahi (${notRevisited.length})`,
              notRevisited,
              DS.warning,
            ],
            [
              "New this period",
              `Pehli baar is period mein (${newThisPeriod.length})`,
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
                  fontWeight: 800,
                  color: clr,
                  marginBottom: 3,
                }}
              >
                {ttl}
              </div>
              <div
                style={{ fontSize: 10.5, color: DS.text2, marginBottom: 10 }}
              >
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
                  <span style={{ fontSize: 11.5, color: DS.text3 }}>—</span>
                )}
                {list.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => onOpenCustomer(c.name)}
                    className="dsr-filter-chip"
                    style={{ fontSize: 11, padding: "4px 10px" }}
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
              Koi customer match nahi hua.
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
                    fontSize: 11,
                    color: DS.text3,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.name}
                  </div>
                  <div
                    style={{ fontSize: 10.5, color: DS.text2, marginTop: 2 }}
                  >
                    {c.latest.area} · {c.latest.distributor} · last{" "}
                    {fmtDate(c.latest.date)}
                  </div>
                </div>
                <StageLadder stage={c.latest.stage} size="sm" />
                <div style={{ textAlign: "right", minWidth: 62 }}>
                  <div
                    className="dsr-mono"
                    style={{ fontSize: 12, fontWeight: 700, color: DS.gold }}
                  >
                    {fmtL(pot)}
                  </div>
                  <div
                    className="dsr-mono"
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
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
                    fontSize: 10.5,
                    fontWeight: 700,
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
      (r.customer || "").toLowerCase().includes(q) ||
      (r.area || "").toLowerCase().includes(q) ||
      (r.distributor || "").toLowerCase().includes(q) ||
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
          } catch {
            /* stage sync on customer master is best-effort */
          }
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
    showToast(`Excel download ho raha hai! (${ed.length} records)`);
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
    if (data.mobile && !isValidMobile(cleanMobile(data.mobile))) {
      showToast("Mobile number 10 digit ka sahi number daalo.", "error");
      return;
    }
    if (data.altMobile && !isValidMobile(cleanMobile(data.altMobile))) {
      showToast("Alternate mobile number sahi nahi hai.", "error");
      return;
    }
    if (data.email && !isValidEmail(data.email.trim())) {
      showToast("Email sahi format mein daalo.", "error");
      return;
    }
    if (data.gstin && !isValidGSTIN(data.gstin.trim().toUpperCase())) {
      showToast("GSTIN 15 character ka sahi daalo.", "error");
      return;
    }
    if (
      modalMode !== "edit" &&
      Object.keys(customers).some(
        (k) => k.trim().toLowerCase() === name.trim().toLowerCase(),
      )
    ) {
      showToast("Is naam ka customer pehle se hai.", "error");
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
            : `${name} update ho gaya!`,
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
        showToast(`${name} add ho gaya!`);
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
  const FILTER_CHIPS = [{ id: "all", label: "All", count: records.length }];

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
          "'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
        color: DS.text1,
        backgroundImage: `radial-gradient(ellipse at 20% 10%,rgba(212,175,106,0.04) 0%,transparent 50%),radial-gradient(ellipse at 80% 90%,rgba(59,130,246,0.03) 0%,transparent 50%)`,
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
              "linear-gradient(155deg,#0B0C11 0%,#161821 55%,#222532 100%)",
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
            border: `1px solid rgba(212,175,106,0.28)`,
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
                "radial-gradient(circle,rgba(212,175,106,0.18),transparent 70%)",
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
            <HomeLink compact />
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
              className="dsr-display"
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
            aria-label="Home"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: `1px solid ${DS.border}`,
              background:
                activeTab === "records"
                  ? "rgba(212,175,106,0.20)"
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
                  background: "rgba(212,175,106,0.06)",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(212,175,106,0.18)",
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
                    border: "1px solid rgba(212,175,106,0.2)",
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
                    onEdit={(r) => navigate(ROUTES.editRecord(r._id || r.id))}
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
                color: "#0A0B10",
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
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="dsr-ghost-btn"
                  disabled={visibleCustomerList.length === 0}
                  title="Customers ki poori details Excel mein"
                  onClick={() => {
                    const n = exportCustomersXlsx(
                      customers,
                      visibleCustomerList,
                      customerHistoryMap,
                    );
                    showToast(`Excel download ho raha hai! (${n} customers)`);
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
                    background: "#10B981",
                    color: "#0A0B10",
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
                "{customerQuery}" se koi customer match nahi hua.
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
                        {(c.contactPerson || c.mobile) && (
                          <span style={{ marginLeft: 5, color: DS.gold }}>
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
                    <div style={{ flexShrink: 0 }}>
                      <StageLadder stage={c.stage} size="sm" />
                    </div>
                    <div
                      className="dsr-row-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isValidMobile(c.mobile) && (
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
