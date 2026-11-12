import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SF_LOGO } from "./sfLogo";
import { XLSX } from "@/lib/xlsx";

// ─── Utilities ────────────────────────────────────────────────────────────────
const num = (v) => Number(v) || 0;

// Price calculation settings.
//  auto   → DP45 × 1.25 + 15
//  manual → chosen column × (1 + markup%)
//  then commission and transport are added in both modes.
const DEFAULT_PRICING = {
  mode: "auto",
  base: "dp45",
  markup: 25,
  commission: 0,
  commType: "pct", // "pct" = % of price · "flat" = ₹ per kg
  transport: 0,
  transType: "flat",
};
const BASE_LABEL = { dp7: "DP7", dp45: "DP45", rsp: "RSP" };
const pricingSummary = (pr) => {
  const p = { ...DEFAULT_PRICING, ...(pr || {}) };
  const parts = [
    p.mode === "auto" ? "Auto" : `${BASE_LABEL[p.base]} +${num(p.markup)}%`,
  ];
  if (num(p.commission))
    parts.push(
      `Comm ${num(p.commission)}${p.commType === "pct" ? "%" : "/kg"}`,
    );
  if (num(p.transport))
    parts.push(
      `Transport ${num(p.transport)}${p.transType === "pct" ? "%" : "/kg"}`,
    );
  return parts.join(" · ");
};
const priceParts = (p, pr) => {
  const auto = pr.mode === "auto";
  const base = num(auto ? p.dp45 : p[pr.base]);
  const add = auto ? 15 : 0;
  const mk = auto ? 25 : num(pr.markup);
  const core = base * (1 + mk / 100) + add;
  const com =
    pr.commType === "pct"
      ? (core * num(pr.commission)) / 100
      : num(pr.commission);
  const tr =
    pr.transType === "pct"
      ? (core * num(pr.transport)) / 100
      : num(pr.transport);
  return { base, add, mk, core, com, tr, total: Math.round(core + com + tr) };
};
const fmtDate = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const inr = (n) => Number(n).toLocaleString("en-IN");

// ─── Excel template ───────────────────────────────────────────────────────────
const TEMPLATE_HEADERS = [
  "SR",
  "Code",
  "Product Name",
  "Category",
  "DP7",
  "DP45",
  "RSP",
];
const TEMPLATE_ROWS = [
  [1, "RD-001", "Reactive Red 195", "REACTIVE DYES", 310, 325, 420],
  [2, "RD-002", "Reactive Blue 19", "REACTIVE DYES", 295, 310, 400],
  [3, "AX-001", "Soaping Agent", "AUXILIARIES", 140, 150, 210],
];
const downloadTemplate = () => {
  try {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...TEMPLATE_ROWS]);
    ws["!cols"] = [8, 12, 30, 20, 10, 10, 10].map((wch) => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Price Sheet");
    XLSX.writeFile(wb, "price-sheet-template.xlsx");
  } catch {
    // Fallback: CSV
    const csv = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "price-sheet-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }
};

const STORAGE_KEY = "sf_pricelist_products";
const STORAGE_NAME_KEY = "sf_pricelist_filename";
const CONTACT_KEY = "sf_pricelist_contacts";
const OPTS_KEY = "sf_pricelist_opts";
const PRICING_KEY = "sf_pricelist_pricing";
const CUSTOMERS_KEY = "sf_pricelist_customers";
const SAVED_KEY = "sf_pricelist_saved";
// Options stored with each customer's saved price list
const SNAP_OPT_KEYS = [
  "terms",
  "gst",
  "round",
  "sort",
  "validDays",
  "notes",
  "refNo",
];
const uid = () =>
  `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const roundBy = (v, step) => {
  const st = Number(step) || 1;
  return Math.round(v / st) * st;
};
const fmtDateTime = (ms) =>
  new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
const samePrices = (a, b) => {
  const ka = Object.keys(a || {});
  return (
    ka.length === Object.keys(b || {}).length && ka.every((k) => a[k] === b[k])
  );
};
const LOGO_KEY = "sf_pricelist_logo";
const COMPANY_KEY = "sf_pricelist_company";

const THEMES = {
  forest: { label: "Forest", brand: "#0f3d2e" },
  navy: { label: "Navy", brand: "#14284b" },
  teal: { label: "Teal", brand: "#0b4f5c" },
  maroon: { label: "Maroon", brand: "#5a1a2b" },
  indigo: { label: "Indigo", brand: "#2c2a6b" },
  terracotta: { label: "Terracotta", brand: "#9a3d1f" },
  olive: { label: "Olive", brand: "#4b5a1f" },
  charcoal: { label: "Charcoal", brand: "#1f2328" },
};
const DEFAULT_OPTS = {
  layout: "editorial",
  theme: "forest",
  validDays: 0,
  sort: "sheet",
  adjust: 0,
  terms: "30 days",
  gst: "none",
  round: 1,
  refNo: "",
  notes: "Prices are per kg and subject to change without prior notice.",
};
const GST_LABEL = { extra: "Extra", incl: "Included" };
const DEFAULT_COMPANY = {
  name: "SF Dyes Private Limited",
  tagline: "Eco-friendly textile dyes & auxiliaries",
};
const EMPTY_CONTACTS = {
  tech: { name: "", phone: "" },
  enq: { name: "", phone: "" },
};

// ─── Server sync (price sheet follows the user across devices) ───────────────
const PL_API = `${import.meta.env.VITE_API_URL || ""}/pricelist`;
const plFetch = async (method, body, path = "") => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(PL_API + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

const readJSON = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};
const writeJSON = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* storage full or unavailable */
  }
};

const loadCustomers = () => {
  const v = readJSON(CUSTOMERS_KEY);
  return Array.isArray(v) ? v.filter((c) => c && c.name) : [];
};
const loadSaved = () => {
  const v = readJSON(SAVED_KEY);
  return Array.isArray(v)
    ? v.filter((c) => c && c.id && c.name && c.current && c.current.keys)
    : [];
};
const loadPricing = () => ({
  ...DEFAULT_PRICING,
  ...(readJSON(PRICING_KEY) || {}),
});
const loadOpts = () => ({ ...DEFAULT_OPTS, ...(readJSON(OPTS_KEY) || {}) });
const loadCompany = () => ({
  ...DEFAULT_COMPANY,
  ...(readJSON(COMPANY_KEY) || {}),
});
const loadContacts = () => {
  const c = readJSON(CONTACT_KEY);
  return c
    ? {
        tech: { ...EMPTY_CONTACTS.tech, ...c.tech },
        enq: { ...EMPTY_CONTACTS.enq, ...c.enq },
      }
    : EMPTY_CONTACTS;
};
const loadLogo = () => {
  try {
    const v = localStorage.getItem(LOGO_KEY);
    if (v === "none") return null;
    return v || SF_LOGO;
  } catch {
    return SF_LOGO;
  }
};
const saveToStorage = (products, fileName) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    localStorage.setItem(STORAGE_NAME_KEY, fileName);
  } catch {
    /* ignore */
  }
};
const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const name = localStorage.getItem(STORAGE_NAME_KEY) || "";
    return { products: data ? JSON.parse(data) : [], fileName: name };
  } catch {
    return { products: [], fileName: "" };
  }
};
const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_NAME_KEY);
  } catch {
    /* ignore */
  }
};

// Shrink an uploaded image to max 320px (PNG keeps transparency)
const resizeLogo = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("Could not read the file"));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("This file is not a valid image"));
      img.onload = () => {
        const k = Math.min(1, 320 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/png"));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

// ─── Icons ────────────────────────────────────────────────────────────────────
const Svg = ({ cls = "w-4 h-4", sw = 1.8, children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={sw}
    className={cls}
    aria-hidden="true"
  >
    {children}
  </svg>
);
const Icon = {
  Check: ({ size = "w-4 h-4" }) => (
    <Svg cls={size} sw={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </Svg>
  ),
  ChevronRight: () => (
    <Svg sw={2}>
      <polyline points="9 18 15 12 9 6" />
    </Svg>
  ),
  X: ({ size = "w-4 h-4" }) => (
    <Svg cls={size} sw={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </Svg>
  ),
  User: () => (
    <Svg cls="w-5 h-5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Svg>
  ),
  Back: () => (
    <Svg sw={2}>
      <polyline points="15 18 9 12 15 6" />
    </Svg>
  ),
  Search: () => (
    <Svg>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </Svg>
  ),
  Print: () => (
    <Svg>
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </Svg>
  ),
  Trash: () => (
    <Svg>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </Svg>
  ),
  Upload: () => (
    <Svg cls="w-5 h-5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </Svg>
  ),
  File: () => (
    <Svg>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </Svg>
  ),
  Home: () => (
    <Svg cls="w-3.5 h-3.5" sw={2}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  ),
  Calendar: () => (
    <Svg cls="w-3 h-3" sw={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </Svg>
  ),
  Edit: () => (
    <Svg cls="w-3 h-3" sw={2}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </Svg>
  ),
  Eye: () => (
    <Svg cls="w-[17px] h-[17px]">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  ),
  Tag: () => (
    <Svg cls="w-[17px] h-[17px]">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </Svg>
  ),
  Bookmark: () => (
    <Svg>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </Svg>
  ),
  Refresh: () => (
    <Svg>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </Svg>
  ),
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@media print {
  @page { margin:12mm 12mm; size:A4 portrait; }
  body { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; color-adjust:exact !important; }
  body * { visibility:hidden !important; }
  #sf-print-area, #sf-print-area * { visibility:visible !important; }
  #sf-print-area { position:absolute; left:0; top:0; width:100%; background:#fff; z-index:9999; }
  html, body { height:auto !important; overflow:visible !important; }
  .pl-paper-wrap { padding:0 !important; max-width:none !important; }
  .pl-sheet { box-shadow:none !important; border-radius:0 !important; zoom:1 !important; }
  .no-print { display:none !important; }
  .print-page-break { page-break-before:always; }
}
.no-scrollbar::-webkit-scrollbar{display:none}
.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
`;

const PL_CSS = `
.pl-root, .pl-root input, .pl-root button, .pl-root select {
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.pl-root *, .pl-root *::before, .pl-root *::after { box-sizing: border-box; }
.pl-root ::selection { background: rgba(212,175,106,0.28); color: var(--ds-text1); }
.pl-root button:focus-visible, .pl-root input:focus-visible { outline: 2px solid var(--ds-primary); outline-offset: 2px; border-radius: 6px; }
.pl-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-feature-settings: "tnum" 1, "zero" 1; letter-spacing: -0.01em; }

/* sidebar */
.pl-sidebar { display: flex; flex-direction: column; width: 300px; flex: none; position: sticky; top: 0; height: 100vh; overflow: hidden; background: var(--ds-sidebar); border-right: 1px solid var(--ds-border); }
.pl-brand { padding: 22px 20px 20px; border-bottom: 1px solid var(--ds-border); display: flex; align-items: center; gap: 11px; }
.pl-logo { width: 36px; height: 36px; border-radius: 10px; background: var(--ds-primary); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 900; color: #0A0B10; flex: none; }
.pl-home { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 12px 0 10px; border-radius: 999px; border: 1px solid rgba(212,175,106,0.30); background: rgba(212,175,106,0.06); color: var(--ds-primary); font-size: 11.5px; font-weight: 600; text-decoration: none; white-space: nowrap; transition: background .15s; cursor: pointer; }
.pl-home:hover { background: var(--ds-surface); }
.pl-nv { padding: 16px 12px 14px; flex: 1; overflow-y: auto; }
.pl-nv-lab { font-size: 12px; color: var(--ds-text3); padding: 0 12px 8px; }
.pl-nv-list { display: grid; gap: 6px; }
.pl-nv-item { display: flex; align-items: center; gap: 12px; width: 100%; height: 56px; padding: 0 12px; border: 1px solid transparent; border-radius: 10px; background: transparent; cursor: pointer; text-align: left; color: var(--ds-text2); transition: color .2s, background .2s, border-color .2s; }
.pl-nv-item:hover:not(:disabled) { color: var(--ds-text1); }
.pl-nv-item:disabled { cursor: not-allowed; opacity: .55; }
.pl-nv-item.active { background: var(--ds-surface); border-color: var(--ds-border); color: var(--ds-text1); }
.pl-nv-ic { width: 34px; height: 34px; border-radius: 8px; flex: none; display: grid; place-items: center; background: var(--ds-surface); border: 1px solid var(--ds-border); transition: background .2s, color .2s; }
.pl-nv-item.active .pl-nv-ic { background: var(--ds-primary); border-color: transparent; color: #1a1408; }
html[data-theme="light"] .pl-nv-item.active .pl-nv-ic { color: #fff; }
.pl-nv-item.done .pl-nv-ic { color: var(--ds-success); }
.pl-nv-t { display: flex; flex-direction: column; min-width: 0; line-height: 1.2; }
.pl-nv-t b { font-size: 14px; font-weight: 500; }
.pl-nv-t small { font-size: 12px; font-weight: 400; color: var(--ds-text3); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pl-nv-item.active .pl-nv-t b { color: var(--ds-primary); }
.pl-nv-cnt { margin-left: auto; min-width: 26px; padding: 2px 8px; border-radius: 999px; text-align: center; font-size: 12px; font-weight: 500; color: var(--ds-text2); background: var(--ds-card); border: 1px solid var(--ds-border); }
.pl-nv-foot { display: flex; align-items: center; gap: 8px; padding: 14px 20px; border-top: 1px solid var(--ds-border); font-size: 12px; font-weight: 600; color: var(--ds-text3); }

/* mobile top bar */
.pl-mobilebar { display: none; position: sticky; top: 0; z-index: 40; background: var(--ds-pagebar); border-bottom: 1px solid var(--ds-border); padding: 10px 14px; align-items: center; gap: 10px; }
@media (max-width: 767px) { .pl-sidebar { display: none; } .pl-mobilebar { display: flex; } }

/* surfaces */
.pl-card { background: var(--ds-card); border: 1px solid var(--ds-border); border-radius: 12px; box-shadow: var(--ds-shadow-card); }
.pl-title { font-size: 14px; font-weight: 600; color: var(--ds-text1); display: flex; align-items: center; gap: 7px; letter-spacing: -0.01em; }
.pl-sub { font-size: 13px; color: var(--ds-text2); }
.pl-label { display: block; font-size: 12px; font-weight: 500; color: var(--ds-text3); margin-bottom: 8px; }
.pl-input { width: 100%; height: 42px; padding: 0 12px; border: 1px solid var(--ds-border); border-radius: 8px; font-size: 13px; color: var(--ds-text1); background: color-mix(in srgb, var(--wash) 4%, transparent); outline: none; transition: border-color .15s, box-shadow .15s; }
.pl-input::placeholder { color: var(--ds-text3); }
.pl-input:focus { border-color: var(--ds-primary); box-shadow: 0 0 0 1px var(--ds-primary); }

/* buttons */
.pl-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 38px; padding: 0 14px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--ds-border); background: var(--ds-surface); color: var(--ds-text1); transition: background-color .16s, border-color .16s, transform .16s, color .16s; white-space: nowrap; }
.pl-btn:hover:not(:disabled) { border-color: var(--ds-borderHi); }
.pl-btn:active:not(:disabled) { transform: scale(0.98); }
.pl-btn.ghost { background: transparent; color: var(--ds-text2); }
.pl-btn.ghost:hover:not(:disabled) { background: var(--ds-surface); color: var(--ds-text1); }
.pl-btn.primary { background: var(--ds-primary); color: #1a1408; border-color: transparent; box-shadow: var(--ds-shadow-btn); }
html[data-theme="light"] .pl-btn.primary { background: #171717; color: #fff; }
.pl-btn.primary:hover:not(:disabled) { filter: brightness(1.07); }
.pl-btn.danger { color: var(--ds-danger); background: transparent; }
.pl-btn.danger:hover:not(:disabled) { background: rgba(229,72,77,0.1); border-color: rgba(229,72,77,0.4); }
.pl-btn.solid-danger { background: var(--ds-danger); color: #fff; border-color: transparent; }
.pl-btn:disabled { opacity: .5; cursor: not-allowed; box-shadow: none; }
.pl-btn.sm { height: 30px; padding: 0 10px; font-size: 12px; }

/* chips */
.pl-chip { display: inline-flex; align-items: center; gap: 7px; height: 30px; padding: 0 12px; border-radius: 999px; font-size: 12px; font-weight: 500; white-space: nowrap; cursor: pointer; background: transparent; color: var(--ds-text2); border: 1px solid var(--ds-border); transition: background .15s, color .15s, border-color .15s; }
.pl-chip:hover { border-color: var(--ds-borderHi); color: var(--ds-text1); }
.pl-chip.on { background: var(--ds-primaryDim); color: var(--ds-primary); border-color: rgba(212,175,106,0.35); }
.pl-chip .n { font-size: 11px; opacity: .75; }
.pl-pill { display: inline-block; font-size: 12px; font-weight: 500; padding: 2px 10px; border-radius: 999px; color: var(--ds-text2); background: var(--ds-surface); border: 1px solid var(--ds-border); }

/* table */
.pl-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pl-table th { padding: 14px 16px; text-align: left; font-size: 13px; font-weight: 400; color: var(--ds-text3); background: var(--ds-surface); border-bottom: 1px solid var(--ds-border); white-space: nowrap; }
.pl-table td { padding: 13px 16px; color: var(--ds-text1); border-bottom: 1px solid var(--ds-border); }
.pl-table tbody tr { cursor: pointer; transition: background .12s; }
.pl-table tbody tr:hover { background: var(--ds-surface); }
.pl-table tbody tr.sel { background: var(--ds-primaryDim); }
.pl-table tbody tr:last-child td { border-bottom: 0; }
.pl-check { width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid var(--ds-borderHi); display: inline-flex; align-items: center; justify-content: center; color: #1a1408; transition: background .12s, border-color .12s; }
html[data-theme="light"] .pl-check { color: #fff; }
.pl-check.on { background: var(--ds-primary); border-color: var(--ds-primary); }
html[data-theme="light"] .pl-check.on { background: #171717; border-color: #171717; }

/* drop zone */
.pl-drop { border: 1.5px dashed var(--ds-borderHi); border-radius: 12px; padding: 44px 20px; text-align: center; cursor: pointer; background: var(--ds-surface); transition: border-color .15s, background .15s; }
.pl-drop:hover, .pl-drop.drag { border-color: var(--ds-primary); background: var(--ds-primaryDim); }
.pl-icobox { width: 44px; height: 44px; border-radius: 10px; display: grid; place-items: center; background: var(--ds-surface); border: 1px solid var(--ds-border); color: var(--ds-primary); flex: none; }

/* bars, dropdown, segmented, picker */
.pl-actionbar { position: sticky; bottom: 0; z-index: 30; background: var(--ds-pagebar); border-top: 1px solid var(--ds-border); padding: 12px 24px; }
.pl-topbar { position: sticky; top: 0; z-index: 30; background: var(--ds-pagebar); border-bottom: 1px solid var(--ds-border); padding: 12px 24px; }
.pl-dd { position: relative; }
.pl-dd-btn { width: 100%; height: 42px; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 0 12px; border: 1px solid var(--ds-border); border-radius: 8px; background: color-mix(in srgb, var(--wash) 4%, transparent); color: var(--ds-text1); font-size: 13px; cursor: pointer; transition: border-color .15s, box-shadow .15s; }
.pl-dd-btn:hover { border-color: var(--ds-borderHi); }
.pl-dd.open .pl-dd-btn { border-color: var(--ds-primary); box-shadow: 0 0 0 1px var(--ds-primary); }
.pl-dd-menu { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 60; background: var(--ds-card); border: 1px solid var(--ds-borderHi); border-radius: 10px; padding: 5px; box-shadow: 0 14px 34px rgba(0,0,0,.38); animation: pl-pop .12s ease-out; }
.pl-dd-opt { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 9px 10px; border: 0; border-radius: 7px; background: transparent; color: var(--ds-text2); font-size: 13px; text-align: left; cursor: pointer; }
.pl-dd-opt.act { background: var(--ds-surface); color: var(--ds-text1); }
.pl-dd-opt.sel { color: var(--ds-primary); font-weight: 500; }
@keyframes pl-pop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.pl-seg { display: inline-flex; padding: 3px; gap: 2px; border-radius: 9px; background: var(--ds-card); border: 1px solid var(--ds-border); }
.pl-seg button { height: 28px; padding: 0 12px; border: 0; border-radius: 6px; background: transparent; color: var(--ds-text2); font-size: 12px; font-weight: 500; cursor: pointer; transition: background .15s, color .15s; }
.pl-seg button.on { background: var(--ds-primaryDim); color: var(--ds-primary); }
.pl-pick { max-height: 210px; overflow-y: auto; border: 1px solid var(--ds-border); border-radius: 8px; background: var(--ds-card); }
.pl-pick button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 12px; border: 0; border-bottom: 1px solid var(--ds-border); background: transparent; color: var(--ds-text2); font-size: 12.5px; text-align: left; cursor: pointer; }
.pl-pick button:last-child { border-bottom: 0; }
.pl-pick button:hover { background: var(--ds-surface); }
.pl-pick button.on { color: var(--ds-text1); background: var(--ds-primaryDim); }
.pl-pick .nm { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-pick .pr { font-size: 12px; color: var(--ds-text3); }
.pl-pick button.on .pr { color: var(--ds-primary); font-weight: 500; }
.pl-pick s { color: var(--ds-text3); margin-right: 4px; }
.pl-root input[type=number] { appearance: textfield; -moz-appearance: textfield; }
.pl-root input[type=number]::-webkit-outer-spin-button, .pl-root input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.pl-print-only { display: none; }
@media print { .pl-print-only { display: inline !important; } }
.pl-pe-wrap { display: inline-flex; align-items: center; gap: 4px; }
.pl-pe { width: 88px; height: 30px; padding: 0 8px; text-align: right; font: inherit; font-weight: 700; font-size: 14px; color: var(--brand); background: #fff; border: 1px solid var(--rule); border-radius: 6px; outline: none; }
.pl-pe:focus { border-color: var(--gold); box-shadow: 0 0 0 2px rgba(201,162,75,.28); }
.pl-pe.mod { border-color: var(--gold); background: #fffaf0; }
.pl-pe-x { border: 0; background: transparent; color: var(--mute); cursor: pointer; font-size: 15px; line-height: 1; padding: 0 2px; }
.pl-pe-x:hover { color: var(--brand); }
.pl-no-scroll::-webkit-scrollbar { display: none; }
.pl-no-scroll { -ms-overflow-style: none; scrollbar-width: none; }
@media (max-width: 767px) { .pl-actionbar, .pl-topbar { padding: 10px 14px; } }

/* ── printable sheet · refined print document ── */
.pl-paper-wrap { max-width: 794px; margin: 0 auto; padding: 28px 16px 56px; }
.pl-sheet {
  --ink:#1a1d1c; --mute:#6b716e; --rule:#d9dcda; --brand:#0f3d2e; --gold:var(--brand);
  --tint:color-mix(in srgb, var(--brand) 7%, #fff);
  background:#fff; color:var(--ink); border-radius:2px; overflow:visible;
  padding:32px 52px 26px; box-shadow:0 1px 3px rgba(0,0,0,.3);
  font-family:'Segoe UI', Arial, Helvetica, sans-serif;
  font-size:13px; line-height:1.45; font-variant-numeric:tabular-nums;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
}

/* letterhead: thick rule + hairline underneath */
.pl-sh-head { position:relative; display:flex; justify-content:space-between; align-items:center; gap:24px; padding-bottom:14px; border-bottom:3px solid var(--brand); }
.pl-sh-head::after { content:""; position:absolute; left:0; right:0; bottom:-8px; border-bottom:1px solid var(--brand); }
.pl-sh-left { display:flex; align-items:center; gap:16px; padding:0; background:none; clip-path:none; color:var(--ink); }
.pl-sh-logo { width:60px; height:60px; border-radius:50%; overflow:hidden; flex:none; background:#fff; border:1px solid var(--rule); display:flex; align-items:center; justify-content:center; box-shadow:none; }
.pl-sh-logo img { width:100%; height:100%; object-fit:cover; display:block; }
.pl-sh-logo span { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:var(--brand); color:#fff; font-size:26px; font-weight:700; }
.pl-sh-co { font-size:22px; font-weight:700; letter-spacing:-0.01em; line-height:1.15; color:var(--brand); }
.pl-sh-tag { font-size:12px; color:var(--mute); margin-top:4px; }
.pl-sh-doc { text-align:right; padding:0; flex:none; display:block; }
.pl-sh-doc .t { font-family:inherit; font-size:24px; font-weight:400; font-style:normal; letter-spacing:.16em; text-transform:uppercase; line-height:1.1; color:var(--brand); }
.pl-sh-doc .ref { margin-top:2px; font-size:12px; letter-spacing:.04em; color:var(--mute); }
.pl-sh-doc .d { display:block; margin-top:7px; padding:0; border:0; background:none; border-radius:0; font-size:12.5px; font-weight:400; letter-spacing:.04em; text-transform:none; color:var(--mute); }

.pl-page { width:100%; border-collapse:collapse; border-spacing:0; }
.pl-page > thead { display:table-header-group; }
.pl-page > thead > tr > td { padding:0 0 16px; }
.pl-page > tbody > tr > td { padding:0; vertical-align:top; }
.pl-sh-body { padding:0; }

/* customer + terms: open layout, no box */
.pl-sh-to { display:flex; justify-content:space-between; align-items:flex-end; gap:28px; margin-top:4px; padding:0 0 12px; background:none; border:0; border-bottom:1px solid var(--rule); border-radius:0; box-shadow:none; }
.pl-sh-who { display:block; }
.pl-sh-who .ava { display:none; }
.pl-sh-to .k { font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--mute); }
.pl-sh-to .who { font-family:inherit; font-size:22px; font-weight:600; letter-spacing:-0.01em; line-height:1.2; margin-top:5px; color:var(--ink); }
.pl-sh-to .loc { font-size:12.5px; color:var(--mute); margin-top:2px; }
.pl-sh-kv { display:flex; gap:30px; margin:0; }
.pl-sh-kv > div { text-align:left; }
.pl-sh-kv dt { font-size:10px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:var(--mute); }
.pl-sh-kv dd { margin:4px 0 0; font-size:14px; font-weight:600; color:var(--ink); }

/* tables */
.pl-sec { margin-top:22px; }
.pl-tbl { width:100%; border-collapse:collapse; table-layout:fixed; }
.pl-tbl thead { display:table-header-group; }
.pl-tbl tr { break-inside:avoid; }
.pl-tbl tr.cat th { background:var(--brand); color:#fff; border:0; border-radius:0; padding:8px 12px; font-family:inherit; font-size:12.5px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; text-align:left; line-height:1.3; }
.pl-tbl tr.cat th::after { content:none; }
.pl-tbl tr.cat th .num { display:none; }
.pl-tbl tr.cat th em { float:right; font-family:inherit; font-style:normal; font-weight:400; font-size:12px; letter-spacing:.02em; text-transform:none; color:#fff; opacity:.85; margin:0; }
.pl-tbl tr.cols th { padding:9px 12px 7px; font-size:10px; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:var(--mute); text-align:left; background:none; border:0; border-bottom:1px solid var(--rule); }
.pl-tbl th.r, .pl-tbl td.r { text-align:right; }
.pl-tbl tr.cols th.r { text-align:right; position:relative; left:.14em; }
.pl-tbl td { padding:9px 12px; border:0; border-bottom:1px solid var(--rule); vertical-align:middle; background:none; }
.pl-tbl tbody tr:hover td { background:var(--tint); }
.pl-tbl td.no { color:var(--mute); font-size:12px; }
.pl-tbl td.cd { color:var(--mute); font-size:12px; }
.pl-tbl td.nm { font-weight:500; text-transform:uppercase; letter-spacing:.02em; font-size:12.5px; }
.pl-tbl td.pr { font-weight:700; font-size:14px; color:var(--ink); white-space:nowrap; background:none; }
.pl-tbl td.pr i { font-style:normal; font-weight:400; color:var(--mute); margin-right:3px; font-size:12px; }
.pl-tbl tbody tr:last-child td { border-bottom:1px solid var(--brand); }

/* closing block: contact left, signature right */
.pl-sh-end { display:flex; justify-content:space-between; align-items:flex-end; gap:30px; margin-top:26px; padding-top:14px; border-top:1px solid var(--rule); break-inside:avoid; }
.pl-sh-contact { display:block; margin:0; padding:0; border:0; background:none; color:var(--ink); }
.pl-sh-contact .h { font-family:inherit; font-size:10px; font-weight:600; font-style:normal; letter-spacing:.16em; text-transform:uppercase; color:var(--mute); padding:0; border:0; margin-bottom:8px; }
.pl-sh-contact .cols { display:flex; flex-wrap:wrap; gap:10px 38px; }
.pl-sh-contact .lb { font-size:11.5px; font-weight:400; letter-spacing:0; text-transform:none; color:var(--mute); }
.pl-sh-contact .nm { font-size:12.5px; margin-top:0; opacity:1; }
.pl-sh-contact .ph { font-size:15px; font-weight:400; letter-spacing:.02em; line-height:1.3; color:var(--ink); }

.pl-sh-foot { display:flex; justify-content:space-between; gap:16px; margin-top:14px; padding:0; border:0; font-size:10.5px; letter-spacing:.02em; color:var(--mute); }

.pl-page > tfoot { display:table-footer-group; }
.pl-page > tfoot > tr > td { padding:0; }
.pl-sh-end { display:block; margin-top:14px; padding-top:10px; border-top:1px solid var(--rule); }
.pl-sh-end .cols { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
.pl-sh-end .it:last-child:not(:first-child) { text-align:right; }
.pl-sh-foot { margin-top:8px; }
@media print { .pl-sheet { padding:0 !important; box-shadow:none !important; } }
@media (max-width: 640px) {
  .pl-sheet { padding:22px 16px; }
  .pl-sh-head { flex-direction:column; align-items:flex-start; }
  .pl-sh-doc { text-align:left; }
  .pl-sh-to { flex-direction:column; align-items:flex-start; }
  .pl-sh-kv { flex-wrap:wrap; gap:14px 24px; }
  .pl-sh-end { flex-direction:column; align-items:flex-start; }
  }

/* "Editorial" layout: same document, rules instead of the solid category bar */
.pl-sheet.ed .pl-tbl tr.cat th { background:none; color:var(--brand); padding:0 0 8px; font-size:13.5px; letter-spacing:.12em; border-bottom:1.5px solid var(--brand); }
.pl-sheet.ed .pl-tbl tr.cat th em { color:var(--mute); opacity:1; }
.pl-sheet.ed .pl-tbl tr.cols th, .pl-sheet.ed .pl-tbl td { padding-left:0; padding-right:8px; }
.pl-sheet.ed .pl-tbl tr.cols th.r, .pl-sheet.ed .pl-tbl td.r { padding-right:0; }
`;

let styleInjected = false;
const injectStyles = () => {
  if (!document.getElementById("pl-fonts")) {
    const fl = document.createElement("link");
    fl.id = "pl-fonts";
    fl.rel = "stylesheet";
    fl.href =
      "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap";
    document.head.appendChild(fl);
  }
  if (styleInjected) return;
  const s = document.createElement("style");
  s.id = "pl-styles";
  s.textContent = GLOBAL_CSS + PL_CSS;
  document.head.appendChild(s);
  styleInjected = true;
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [products, setProducts] = useState([]);
  const [fileName, setFileName] = useState("");
  const [parseErr, setParseErr] = useState("");
  const [dragging, setDragging] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [sync, setSync] = useState("idle"); // idle | syncing | synced | error
  const uploadedRef = useRef(false);

  const [step, setStep] = useState(0); // 0=upload 1=customer 2=select 3=preview
  const [customerName, setCN] = useState("");
  const [customerCity, setCC] = useState("");
  const [contacts, setContacts] = useState(loadContacts);
  const [logo, setLogo] = useState(loadLogo);
  const [logoErr, setLogoErr] = useState("");
  const logoRef = useRef(null);
  const [company, setCompany] = useState(loadCompany);
  const [opts, setOpts] = useState(loadOpts);
  const [pricing, setPricing] = useState(loadPricing);
  const [customers, setCustomers] = useState(loadCustomers);
  const [savedLists, setSavedLists] = useState(loadSaved);
  const [activeId, setActiveId] = useState(null); // saved list currently opened
  const [notice, setNotice] = useState("");
  const [openHist, setOpenHist] = useState(null);
  const [savedSearch, setSavedSearch] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [showChanges, setShowChanges] = useState(false);
  const flashT = useRef(null);
  const flash = (m) => {
    setNotice(m);
    clearTimeout(flashT.current);
    flashT.current = setTimeout(() => setNotice(""), 3400);
  };
  const [showOpts, setShowOpts] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adjust, setAdjust] = useState("");
  const [adjScope, setAdjScope] = useState("all");
  const [adjKeys, setAdjKeys] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [overrides, setOverrides] = useState({});
  const [showCodes, setShowCodes] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("ALL");
  const [selected, setSelected] = useState({});

  const fileRef = useRef(null);
  const navigate = useNavigate();

  const setOpt = (k, v) => setOpts((o) => ({ ...o, [k]: v }));
  const setContact = (who, field, val) =>
    setContacts((c) => ({ ...c, [who]: { ...c[who], [field]: val } }));

  // persistence
  useEffect(() => {
    try {
      if (logo === SF_LOGO) localStorage.removeItem(LOGO_KEY);
      else localStorage.setItem(LOGO_KEY, logo === null ? "none" : logo);
    } catch {
      /* ignore */
    }
  }, [logo]);
  useEffect(() => writeJSON(COMPANY_KEY, company), [company]);
  useEffect(() => writeJSON(OPTS_KEY, opts), [opts]);
  useEffect(() => writeJSON(PRICING_KEY, pricing), [pricing]);
  useEffect(() => writeJSON(CUSTOMERS_KEY, customers), [customers]);
  useEffect(() => writeJSON(SAVED_KEY, savedLists), [savedLists]);

  // Merge customer-wise saved lists with the server (newest save wins)
  useEffect(() => {
    let alive = true;
    plFetch("GET", undefined, "/customers")
      .then((data) => {
        if (!alive || !Array.isArray(data.customers)) return;
        const map = new Map(data.customers.map((c) => [c.id, c]));
        loadSaved().forEach((c) => {
          const srv = map.get(c.id);
          if (!srv || (c.savedAt || 0) > (srv.savedAt || 0)) {
            map.set(c.id, c);
            plFetch("PUT", c, `/customers/${c.id}`).catch(() => {});
          }
        });
        setSavedLists(
          [...map.values()].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)),
        );
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Auto-save the customer (most recent first) once the user moves past step 2
  useEffect(() => {
    const name = customerName.trim();
    if (step < 2 || !name) return;
    setCustomers((list) => {
      const rest = list.filter(
        (c) => c.name.toLowerCase() !== name.toLowerCase(),
      );
      return [{ name, city: customerCity.trim() }, ...rest].slice(0, 200);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);
  useEffect(() => writeJSON(CONTACT_KEY, contacts), [contacts]);

  useEffect(() => {
    injectStyles();
    const { products: stored, fileName: storedName } = loadFromStorage();
    if (stored.length) {
      setProducts(stored);
      setFileName(storedName);
      setStep(1);
    }
  }, []);

  // Load the saved price sheet from the server (source of truth across devices)
  useEffect(() => {
    let alive = true;
    setSync("syncing");
    plFetch("GET")
      .then((data) => {
        if (!alive || uploadedRef.current) return;
        if (Array.isArray(data.products) && data.products.length) {
          setProducts(data.products);
          setFileName(data.fileName || "");
          saveToStorage(data.products, data.fileName || "");
          setStep((st) => (st === 0 ? 1 : st));
          setSync("synced");
        } else {
          // Nothing on the server yet: upload what this device already has
          const { products: local, fileName: localName } = loadFromStorage();
          if (local.length) {
            return plFetch("PUT", {
              products: local,
              fileName: localName,
            }).then(() => alive && setSync("synced"));
          }
          setSync("idle");
        }
      })
      .catch(() => alive && setSync("error"));
    return () => {
      alive = false;
    };
  }, []);

  const coName = company.name.trim() || DEFAULT_COMPANY.name;

  const onLogoFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/"))
      return setLogoErr("Please choose an image file (PNG, JPG, SVG, WebP)");
    if (file.size > 5 * 1024 * 1024)
      return setLogoErr("Image is too large (max 5 MB)");
    try {
      setLogo(await resizeLogo(file));
      setLogoErr("");
    } catch (e) {
      setLogoErr(e.message);
    }
  };

  // ── Parse Excel ───────────────────────────────────────────────────────────
  const parseFile = useCallback((file) => {
    setParseErr("");
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setParseErr("Please upload an .xlsx, .xls or .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setParseErr("Could not read the file.");
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!rows.length) {
          setParseErr("The sheet appears to be empty.");
          return;
        }
        const norm = (obj) => {
          const o = {};
          Object.keys(obj).forEach((k) => {
            o[k.trim().toLowerCase().replace(/\s+/g, "")] = obj[k];
          });
          return o;
        };
        const mapped = rows
          .map((raw, idx) => {
            const r = norm(raw);
            const sr = r["sr"] ?? r["srno"] ?? r["#"] ?? idx + 1;
            const name =
              r["productname"] ??
              r["name"] ??
              r["product"] ??
              r["description"] ??
              "";
            const code = r["code"] ?? r["productcode"] ?? "";
            const dp7 = parseFloat(r["dp7"] ?? r["dp-7"] ?? 0) || 0;
            const dp45 = parseFloat(r["dp45"] ?? r["dp-45"] ?? 0) || 0;
            const rsp = parseFloat(r["rsp"] ?? 0) || 0;
            const rawCat = String(r["category"] ?? r["cat"] ?? "")
              .trim()
              .toUpperCase();
            const category =
              rawCat && rawCat !== "UNCATEGORISED" ? rawCat : "GENERAL";
            return {
              sr,
              code: String(code).trim(),
              name: String(name).trim(),
              dp7,
              dp45,
              rsp,
              category,
            };
          })
          .filter((p) => p.name);
        if (!mapped.length) {
          setParseErr(
            "No valid product rows found. Check headers: SR, Code, Product Name, DP7, DP45, RSP",
          );
          return;
        }
        setProducts(mapped);
        setFileName(file.name);
        setSelected({});
        saveToStorage(mapped, file.name);
        uploadedRef.current = true;
        setSync("syncing");
        plFetch("PUT", { products: mapped, fileName: file.name })
          .then(() => setSync("synced"))
          .catch(() => setSync("error"));
        setStep(1);
      } catch {
        setParseErr(
          "Could not parse the file. Ensure it is a valid Excel/CSV.",
        );
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const handleRemoveFile = () => {
    clearStorage();
    uploadedRef.current = true;
    plFetch("DELETE")
      .then(() => setSync("idle"))
      .catch(() => setSync("error"));
    setProducts([]);
    setFileName("");
    setSelected({});
    setOverrides({});
    setConfirmRemove(false);
    setActiveId(null);
    setStep(0);
    setCN("");
    setCC("");
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      parseFile(e.dataTransfer.files[0]);
    },
    [parseFile],
  );

  // ── Derived data ──────────────────────────────────────────────────────────
  const categories = useMemo(
    () => ["ALL", ...new Set(products.map((p) => p.category))],
    [products],
  );
  const catCounts = useMemo(() => {
    const c = { ALL: products.length };
    products.forEach((p) => {
      c[p.category] = (c[p.category] || 0) + 1;
    });
    return c;
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        (selCat === "ALL" || p.category === selCat) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q)),
    );
  }, [products, selCat, search]);

  const key = (p) => `${p.category}||${p.name}`;
  const toggle = (p) => setSelected((s) => ({ ...s, [key(p)]: !s[key(p)] }));
  const selAll = () => {
    const u = {};
    filtered.forEach((p) => {
      u[key(p)] = true;
    });
    setSelected((s) => ({ ...s, ...u }));
  };
  const deselAll = () => setSelected({});

  const selectedProducts = useMemo(
    () => products.filter((p) => selected[`${p.category}||${p.name}`]),
    [products, selected],
  );
  const grouped = useMemo(() => {
    const g = {};
    selectedProducts.forEach((p) => {
      (g[p.category] = g[p.category] || []).push(p);
    });
    return g;
  }, [selectedProducts]);
  const selCount = selectedProducts.length;

  const handlePrint = () => {
    injectStyles();
    // The browser uses the page title as the default PDF file name
    const prevTitle = document.title;
    const safe = (customerName || "").replace(/[\\/:*?"<>|]+/g, "").trim();
    if (safe) document.title = `${safe} - Price List`;
    const restore = () => {
      document.title = prevTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  const today = fmtDate();
  const hasCustomer = !!customerName.trim();
  const flatSel = Object.values(grouped).flat();
  const adjPct = Number(adjust) || 0;
  const roundStep = Number(opts.round) || 1;
  const roundTo = (v) => Math.round(v / roundStep) * roundStep;
  const basePrice = (p) => {
    const base = priceParts(p, pricing).total;
    const on = adjPct !== 0 && (adjScope === "all" || adjKeys.includes(key(p)));
    return roundTo(on ? base * (1 + adjPct / 100) : base);
  };
  const priceOf = (p) => {
    const ov = overrides[key(p)];
    return ov !== undefined && ov !== "" ? Number(ov) : basePrice(p);
  };
  const sp = editMode ? basePrice : priceOf; // keep row order stable while typing
  const editedCount = flatSel.filter(
    (p) => overrides[key(p)] !== undefined && overrides[key(p)] !== "",
  ).length;
  const adjCount =
    adjPct === 0
      ? 0
      : adjScope === "all"
        ? flatSel.length
        : flatSel.filter((p) => adjKeys.includes(key(p))).length;
  const sortedGrouped = Object.fromEntries(
    Object.entries(grouped).map(([c, ps]) => {
      const arr = [...ps];
      if (opts.sort === "name")
        arr.sort((a, b) => a.name.localeCompare(b.name));
      if (opts.sort === "low") arr.sort((a, b) => sp(a) - sp(b));
      if (opts.sort === "high") arr.sort((a, b) => sp(b) - sp(a));
      return [c, arr];
    }),
  );
  const brand =
    opts.theme === "custom"
      ? opts.customColor || "#0f3d2e"
      : (THEMES[opts.theme] || THEMES.forest).brand;
  const validTill =
    opts.validDays > 0
      ? new Date(Date.now() + opts.validDays * 864e5).toLocaleDateString(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          },
        )
      : "";

  const buildWhatsApp = () => {
    const L = [
      `*${coName}* · Price List`,
      today,
      `For: ${customerName}${customerCity ? ", " + customerCity : ""}`,
      `Prices in ₹ per kg · ${opts.terms}`,
    ];
    if (opts.gst !== "none") L.push(`GST: ${GST_LABEL[opts.gst]}`);
    if (validTill) L.push(`Valid till ${validTill}`);
    if (opts.refNo.trim()) L.push(`Ref: ${opts.refNo.trim()}`);
    Object.entries(sortedGrouped).forEach(([cat, ps]) => {
      L.push("", `*${cat}*`);
      ps.forEach((x, i) => L.push(`${i + 1}. ${x.name} — ₹${inr(priceOf(x))}`));
    });
    [
      ["Technical Support", contacts.tech],
      ["Enquiry", contacts.enq],
    ].forEach(([t, c]) => {
      if (c.name.trim() || c.phone.trim())
        L.push(
          "",
          `${t}: ${[c.name.trim(), c.phone.trim()].filter(Boolean).join(" · ")}`,
        );
    });
    return L.join("\n");
  };
  const shareWhatsApp = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(buildWhatsApp())}`,
      "_blank",
      "noopener",
    );
  const copyWhatsApp = async () => {
    try {
      await navigator.clipboard.writeText(buildWhatsApp());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  // ── Customer-wise saved price lists ──────────────────────────────────────
  const prodByKey = new Map(products.map((p) => [key(p), p]));
  const activeRec = savedLists.find(
    (c) => c.name.toLowerCase() === customerName.trim().toLowerCase(),
  );
  const pricesNow = Object.fromEntries(
    flatSel.map((p) => [key(p), priceOf(p)]),
  );
  const isSaved =
    !!activeRec &&
    activeRec.name === customerName.trim() &&
    (activeRec.city || "") === customerCity.trim() &&
    activeRec.current.keys.length === flatSel.length &&
    samePrices(activeRec.current.prices, pricesNow);
  const changes =
    activeId && activeRec && activeRec.id === activeId
      ? flatSel.filter((p) => {
          const o = overrides[key(p)];
          return o !== undefined && o !== "" && Number(o) !== basePrice(p);
        })
      : [];

  const outdatedMap = {};
  savedLists.forEach((c) => {
    const pr = { ...DEFAULT_PRICING, ...(c.current.pricing || {}) };
    const rnd = c.current.opts?.round ?? 1;
    let n = 0;
    c.current.keys.forEach((k) => {
      const p = prodByKey.get(k);
      if (p && roundBy(priceParts(p, pr).total, rnd) !== c.current.prices[k])
        n++;
    });
    outdatedMap[c.id] = n;
  });

  const pushSaved = (rec) =>
    plFetch("PUT", rec, `/customers/${rec.id}`).catch(() =>
      flash("Saved on this device only (sync failed)"),
    );

  const saveCurrent = () => {
    if (!hasCustomer || !selCount) return;
    const name = customerName.trim();
    const snap = {
      keys: flatSel.map(key),
      prices: pricesNow,
      pricing,
      opts: Object.fromEntries(SNAP_OPT_KEYS.map((k) => [k, opts[k]])),
      savedAt: Date.now(),
    };
    let history = activeRec?.history || [];
    if (activeRec && !samePrices(activeRec.current.prices, snap.prices))
      history = [activeRec.current, ...history].slice(0, 5);
    const rec = {
      id: activeRec?.id || uid(),
      name,
      city: customerCity.trim(),
      current: snap,
      history,
      savedAt: snap.savedAt,
    };
    setSavedLists((l) => [rec, ...l.filter((c) => c.id !== rec.id)]);
    setActiveId(rec.id);
    pushSaved(rec);
    flash(`Saved price list for ${name}`);
  };

  const openSaved = (c, snap = c.current) => {
    const pr = { ...DEFAULT_PRICING, ...(snap.pricing || {}) };
    const rnd = snap.opts?.round ?? opts.round;
    const sel = {};
    const ov = {};
    let missing = 0;
    snap.keys.forEach((k) => {
      const p = prodByKey.get(k);
      if (!p) {
        missing++;
        return;
      }
      sel[k] = true;
      const saved = snap.prices[k];
      if (
        saved !== undefined &&
        Number(saved) !== roundBy(priceParts(p, pr).total, rnd)
      )
        ov[k] = saved;
    });
    setCN(c.name);
    setCC(c.city || "");
    setSelected(sel);
    setPricing(pr);
    setOpts((o) => ({ ...o, ...(snap.opts || {}) }));
    setOverrides(ov);
    setAdjust("");
    setAdjScope("all");
    setAdjKeys([]);
    setEditMode(false);
    setActiveId(c.id);
    setShowChanges(false);
    setStep(3);
    flash(
      missing
        ? `Opened · ${missing} product${missing > 1 ? "s" : ""} no longer in the sheet`
        : "Opened saved price list",
    );
  };

  // Recalculate every saved price from the current sheet (keeps old version in history)
  const recalcRecord = (c) => {
    const snap = c.current;
    const pr = { ...DEFAULT_PRICING, ...(snap.pricing || {}) };
    const rnd = snap.opts?.round ?? 1;
    const keys = [];
    const prices = {};
    let changed = 0;
    snap.keys.forEach((k) => {
      const p = prodByKey.get(k);
      if (!p) return;
      keys.push(k);
      prices[k] = roundBy(priceParts(p, pr).total, rnd);
      if (prices[k] !== snap.prices[k]) changed++;
    });
    const now = Date.now();
    return {
      changed,
      dropped: snap.keys.length - keys.length,
      rec: {
        ...c,
        current: { ...snap, keys, prices, savedAt: now },
        history: [snap, ...(c.history || [])].slice(0, 5),
        savedAt: now,
      },
    };
  };
  const updateOne = (c) => {
    const { changed, dropped, rec } = recalcRecord(c);
    if (!changed && !dropped)
      return flash(`${c.name}: prices are already up to date`);
    setSavedLists((l) => [rec, ...l.filter((x) => x.id !== rec.id)]);
    pushSaved(rec);
    flash(`${c.name}: ${changed} price${changed === 1 ? "" : "s"} updated`);
  };
  const updateAll = () => {
    const todo = savedLists
      .filter((c) => outdatedMap[c.id] > 0)
      .map((c) => recalcRecord(c));
    if (!todo.length) return flash("All saved price lists are up to date");
    if (
      !window.confirm(
        `Update ${todo.length} saved price list${todo.length > 1 ? "s" : ""} to the current sheet prices? Old versions stay in history.`,
      )
    )
      return;
    const ids = new Set(todo.map((t) => t.rec.id));
    setSavedLists((l) => [
      ...todo.map((t) => t.rec),
      ...l.filter((c) => !ids.has(c.id)),
    ]);
    todo.forEach((t) => pushSaved(t.rec));
    flash(`Updated ${todo.length} price list${todo.length > 1 ? "s" : ""}`);
  };
  const duplicateSaved = (c) => {
    const nm = (
      window.prompt("Name for the copy", `${c.name} (copy)`) || ""
    ).trim();
    if (!nm) return;
    if (savedLists.some((x) => x.name.toLowerCase() === nm.toLowerCase()))
      return flash("A customer with this name already exists");
    const now = Date.now();
    const rec = {
      ...c,
      id: uid(),
      name: nm,
      history: [],
      savedAt: now,
      current: { ...c.current, savedAt: now },
    };
    setSavedLists((l) => [rec, ...l]);
    pushSaved(rec);
    flash(`Copied to ${nm}`);
  };
  const deleteSaved = (c) => {
    setSavedLists((l) => l.filter((x) => x.id !== c.id));
    if (activeId === c.id) setActiveId(null);
    setConfirmDel(null);
    plFetch("DELETE", undefined, `/customers/${c.id}`).catch(() => {});
    flash(`Deleted ${c.name}`);
  };
  const exportExcel = () => {
    try {
      const rows = [["Category", "Code", "Product", "Rs / Kg"]];
      Object.entries(sortedGrouped).forEach(([cat, ps]) =>
        ps.forEach((x) => rows.push([cat, x.code, x.name, priceOf(x)])),
      );
      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [20, 12, 36, 12].map((wch) => ({ wch }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Price List");
      const safe = (customerName || "price-list")
        .replace(/[\\/:*?"<>|]+/g, "")
        .trim();
      XLSX.writeFile(wb, `${safe} - price list.xlsx`);
    } catch {
      flash("Excel export failed");
    }
  };
  const existingSaved =
    activeRec && activeRec.id !== activeId ? activeRec : null;

  const shell = {
    toast: notice,
    step,
    setStep,
    navigate,
    productCount: products.length,
    savedCount: savedLists.length,
    canGo: [
      true,
      products.length > 0,
      products.length > 0 && hasCustomer,
      products.length > 0 && hasCustomer && selCount > 0,
      true,
    ],
  };

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 0 — Upload
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 0)
    return (
      <Shell
        {...shell}
        title="Upload Price Sheet"
        icon={<Icon.Upload />}
        meta="Step 1 of 4"
      >
        <div className="max-w-xl mx-auto">
          <div className="pl-card" style={{ padding: 24 }}>
            <div
              role="button"
              tabIndex={0}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileRef.current?.click();
                }
              }}
              className={`pl-drop${dragging ? " drag" : ""}`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  parseFile(e.target.files[0]);
                  e.target.value = "";
                }}
              />
              <div className="pl-icobox mx-auto mb-4">
                <Icon.Upload />
              </div>
              <p
                style={{
                  color: "var(--ds-text1)",
                  fontSize: 15,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {dragging ? "Drop file here" : "Drag & drop Excel file"}
              </p>
              <p className="pl-sub" style={{ marginTop: 4 }}>
                or click to browse &nbsp;·&nbsp;{" "}
                <span style={{ color: "var(--ds-text3)" }}>
                  .xlsx .xls .csv
                </span>
              </p>
            </div>

            {parseErr && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-2"
                style={{
                  padding: 12,
                  borderRadius: 8,
                  fontSize: 13,
                  color: "var(--ds-danger)",
                  background: "rgba(229,72,77,0.1)",
                  border: "1px solid rgba(229,72,77,0.25)",
                }}
              >
                <Icon.X /> {parseErr}
              </div>
            )}

            <div
              className="mt-5"
              style={{
                borderTop: "1px solid var(--ds-border)",
                paddingTop: 16,
              }}
            >
              <div
                className="flex items-center justify-between gap-3 flex-wrap"
                style={{ marginBottom: 8 }}
              >
                <p className="pl-label" style={{ marginBottom: 0 }}>
                  Expected column headers
                </p>
                <button className="pl-btn sm" onClick={downloadTemplate}>
                  <Icon.File /> Download template
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  "SR",
                  "Code",
                  "Product Name",
                  "Category",
                  "DP7",
                  "DP45",
                  "RSP",
                ].map((c) => (
                  <span key={c} className="pl-pill pl-mono">
                    {c}
                  </span>
                ))}
              </div>
              <p className="pl-sub" style={{ fontSize: 12, marginTop: 10 }}>
                Product Name is required · Empty Category becomes GENERAL · Set
                the price formula in the next steps (Auto / Manual)
              </p>
            </div>
          </div>
        </div>
      </Shell>
    );

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1 — Customer Details
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 1)
    return (
      <Shell
        {...shell}
        title="Customer Details"
        icon={<Icon.User />}
        meta="Step 2 of 4"
      >
        <div className="max-w-xl mx-auto">
          <div className="pl-card" style={{ padding: 24 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="pl-icobox">
                <Icon.User />
              </div>
              <div>
                <h2
                  style={{
                    color: "var(--ds-text1)",
                    fontSize: 16,
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  Customer Details
                </h2>
                <p className="pl-sub" style={{ fontSize: 12, marginTop: 2 }}>
                  Appears on the printed price list
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <CustomerField
                label="Customer / Firm Name *"
                value={customerName}
                onChange={setCN}
                customers={[
                  ...customers,
                  ...savedLists
                    .filter(
                      (s) =>
                        !customers.some(
                          (c) => c.name.toLowerCase() === s.name.toLowerCase(),
                        ),
                    )
                    .map((s) => ({ name: s.name, city: s.city })),
                ]}
                onPick={(c) => {
                  setCN(c.name);
                  setCC(c.city || "");
                }}
                onRemove={(c) =>
                  setCustomers((l) => l.filter((x) => x.name !== c.name))
                }
                placeholder="e.g. Sai Nath Textiles Pvt Ltd"
              />
              {existingSaved && (
                <div
                  className="flex items-center gap-3 flex-wrap"
                  style={{
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: "var(--ds-primaryDim)",
                    border: "1px solid rgba(212,175,106,0.35)",
                    fontSize: 12.5,
                    color: "var(--ds-primary)",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 180 }}>
                    Saved price list found · {existingSaved.current.keys.length}{" "}
                    products · {fmtDateTime(existingSaved.savedAt)}
                  </span>
                  <button
                    className="pl-btn sm"
                    onClick={() => openSaved(existingSaved)}
                  >
                    Open saved list
                  </button>
                </div>
              )}
              <Field
                label="City / Address (optional)"
                value={customerCity}
                onChange={setCC}
                placeholder="e.g. Surat, Gujarat"
              />
            </div>

            {/* Company details */}
            <div
              className="mt-6"
              style={{
                borderTop: "1px solid var(--ds-border)",
                paddingTop: 18,
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 14 }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ds-text1)",
                    }}
                  >
                    Your company
                  </p>
                  <p className="pl-sub" style={{ fontSize: 12, marginTop: 2 }}>
                    Shown in the price list header · saved on this device
                  </p>
                </div>
                {(company.name !== DEFAULT_COMPANY.name ||
                  company.tagline !== DEFAULT_COMPANY.tagline) && (
                  <button
                    className="pl-btn ghost sm"
                    onClick={() => setCompany(DEFAULT_COMPANY)}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div
                className="flex items-center gap-3.5"
                style={{ marginBottom: 16 }}
              >
                <div
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: "50%",
                    background: "#fff",
                    border: "1px solid var(--ds-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 5,
                    flex: "none",
                    overflow: "hidden",
                  }}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: "50%",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontSize: 26,
                        fontWeight: 700,
                        color: "#0f3d2e",
                      }}
                    >
                      {coName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="pl-label" style={{ marginBottom: 6 }}>
                    Logo
                  </p>
                  <input
                    ref={logoRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      onLogoFile(e.target.files[0]);
                      e.target.value = "";
                    }}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      className="pl-btn sm"
                      onClick={() => logoRef.current?.click()}
                    >
                      <Icon.Upload />{" "}
                      {logo && logo !== SF_LOGO ? "Change" : "Upload logo"}
                    </button>
                    {logo && (
                      <button
                        className="pl-btn danger sm"
                        onClick={() => setLogo(null)}
                      >
                        Remove
                      </button>
                    )}
                    {logo !== SF_LOGO && (
                      <button
                        className="pl-btn ghost sm"
                        onClick={() => {
                          setLogo(SF_LOGO);
                          setLogoErr("");
                        }}
                      >
                        Use default
                      </button>
                    )}
                  </div>
                  {logoErr && (
                    <p
                      role="alert"
                      style={{
                        fontSize: 12,
                        color: "var(--ds-danger)",
                        marginTop: 6,
                      }}
                    >
                      {logoErr}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <Field
                  label="Company name"
                  value={company.name}
                  onChange={(v) => setCompany((c) => ({ ...c, name: v }))}
                  placeholder={DEFAULT_COMPANY.name}
                />
                <Field
                  label="Tagline (optional)"
                  value={company.tagline}
                  onChange={(v) => setCompany((c) => ({ ...c, tagline: v }))}
                  placeholder="e.g. Eco-friendly textile dyes & auxiliaries"
                />
              </div>
            </div>

            {/* Contacts */}
            <div
              className="mt-6"
              style={{
                borderTop: "1px solid var(--ds-border)",
                paddingTop: 18,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--ds-text1)",
                }}
              >
                Contact on price list
              </p>
              <p
                className="pl-sub"
                style={{ fontSize: 12, marginTop: 2, marginBottom: 14 }}
              >
                Optional · saved on this device, leave blank to hide
              </p>
              <div className="space-y-4">
                <ContactRow
                  title="Technical Support"
                  value={contacts.tech}
                  onChange={(f, v) => setContact("tech", f, v)}
                />
                <ContactRow
                  title="Enquiry / Orders"
                  value={contacts.enq}
                  onChange={(f, v) => setContact("enq", f, v)}
                />
              </div>
            </div>

            {/* Loaded file */}
            <div
              className="mt-6 flex items-center gap-3"
              style={{
                padding: 12,
                borderRadius: 10,
                background: "var(--ds-surface)",
                border: "1px solid var(--ds-border)",
              }}
            >
              <div
                className="pl-icobox"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  color: "var(--ds-success)",
                }}
              >
                <Icon.File />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="truncate"
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ds-text1)",
                  }}
                >
                  {fileName}
                </p>
                <p style={{ fontSize: 12, color: "var(--ds-text3)" }}>
                  <span className="pl-mono">{products.length}</span> products ·{" "}
                  {sync === "synced"
                    ? "synced to your account"
                    : sync === "syncing"
                      ? "syncing…"
                      : sync === "error"
                        ? "saved on this device only (sync failed)"
                        : "saved locally"}
                </p>
              </div>
              {!confirmRemove ? (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="pl-btn danger sm"
                >
                  <Icon.Trash /> Remove
                </button>
              ) : (
                <div className="flex-none flex items-center gap-1.5">
                  <span style={{ fontSize: 12, color: "var(--ds-text3)" }}>
                    Sure?
                  </span>
                  <button
                    onClick={handleRemoveFile}
                    className="pl-btn solid-danger sm"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmRemove(false)}
                    className="pl-btn sm"
                  >
                    No
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(0)}
                className="pl-btn"
                style={{ height: 42 }}
              >
                <Icon.Refresh /> Change File
              </button>
              <button
                onClick={() => hasCustomer && setStep(2)}
                disabled={!hasCustomer}
                className="pl-btn primary flex-1"
                style={{ height: 42 }}
              >
                Select Products <Icon.ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </Shell>
    );

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2 — Product Selection
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 2)
    return (
      <Shell
        {...shell}
        title="Select Products"
        icon={<Icon.Tag />}
        meta={
          <>
            <span className="pl-mono" style={{ color: "var(--ds-primary)" }}>
              {selCount}
            </span>{" "}
            selected · <span className="pl-mono">{products.length}</span>{" "}
            products
          </>
        }
        footer={
          <div className="pl-actionbar no-print">
            <div className="max-w-6xl mx-auto flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="pl-btn"
                style={{ height: 42 }}
              >
                <Icon.Back /> Back
              </button>
              <button
                onClick={() => selCount > 0 && setStep(3)}
                disabled={selCount === 0}
                className="pl-btn primary flex-1"
                style={{ height: 42 }}
              >
                Preview & Print &nbsp;·&nbsp;{" "}
                <span className="pl-mono">{selCount}</span> products{" "}
                <Icon.ChevronRight />
              </button>
            </div>
          </div>
        }
      >
        <div className="max-w-6xl mx-auto">
          <div className="pl-card" style={{ padding: 16 }}>
            <div className="flex flex-wrap gap-2.5 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--ds-text3)" }}
                >
                  <Icon.Search />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product name or code…"
                  aria-label="Search products"
                  className="pl-input"
                  style={{ paddingLeft: 36, height: 38 }}
                />
              </div>
              <button onClick={selAll} className="pl-btn">
                <Icon.Check size="w-3.5 h-3.5" /> Select visible (
                {filtered.length})
              </button>
              <button onClick={deselAll} className="pl-btn danger">
                <Icon.X size="w-3.5 h-3.5" /> Clear all
              </button>
            </div>

            <div className="mt-3 -mx-4 px-4 overflow-x-auto pl-no-scroll">
              <div
                className="flex gap-1.5 pb-0.5"
                style={{ minWidth: "max-content" }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelCat(cat)}
                    className={`pl-chip${selCat === cat ? " on" : ""}`}
                  >
                    {cat === "ALL" ? "All" : cat}
                    <span className="n pl-mono">{catCounts[cat] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pl-card mt-4" style={{ padding: 16 }}>
            <PricingPanel
              pricing={pricing}
              setPricing={setPricing}
              sample={selectedProducts[0] || filtered[0] || products[0]}
            />
          </div>

          <div className="pl-card mt-4 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="pl-table">
                <thead>
                  <tr>
                    <th style={{ width: 44, textAlign: "center" }}>
                      <span className="pl-check" />
                    </th>
                    <th style={{ width: 130 }}>Code</th>
                    <th>Product Name</th>
                    <th style={{ width: 130, textAlign: "right" }}>
                      Cust. Price
                    </th>
                    <th style={{ width: 160 }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        style={{
                          textAlign: "center",
                          padding: "56px 16px",
                          color: "var(--ds-text2)",
                          cursor: "default",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 600,
                            color: "var(--ds-text1)",
                          }}
                        >
                          No products match your search
                        </div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          Try a different name, code or category
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => {
                      const k = key(p);
                      const isSel = !!selected[k];
                      return (
                        <tr
                          key={k}
                          onClick={() => toggle(p)}
                          className={isSel ? "sel" : ""}
                          aria-selected={isSel}
                        >
                          <td style={{ textAlign: "center" }}>
                            <span className={`pl-check${isSel ? " on" : ""}`}>
                              {isSel && <Icon.Check size="w-2.5 h-2.5" />}
                            </span>
                          </td>
                          <td
                            className="pl-mono"
                            style={{ color: "var(--ds-text3)", fontSize: 12 }}
                          >
                            {p.code || "—"}
                          </td>
                          <td
                            style={{
                              fontWeight: isSel ? 500 : 400,
                              lineHeight: 1.3,
                            }}
                          >
                            {p.name}
                          </td>
                          <td
                            className="pl-mono"
                            style={{
                              textAlign: "right",
                              color: "var(--ds-primary)",
                              fontWeight: 500,
                            }}
                          >
                            ₹ {priceParts(p, pricing).total}
                          </td>
                          <td>
                            <span className="pl-pill">{p.category}</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Shell>
    );

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3 — Print Preview
  // ════════════════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════════════════
  // STEP 4 — Saved price lists (customer-wise)
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 4) {
    const q = savedSearch.trim().toLowerCase();
    const list = savedLists.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q),
    );
    const outdatedTotal = savedLists.filter(
      (c) => outdatedMap[c.id] > 0,
    ).length;
    const noSheet = products.length === 0;
    return (
      <Shell
        {...shell}
        title="Saved Price Lists"
        icon={<Icon.Bookmark />}
        meta={
          <>
            <span className="pl-mono">{savedLists.length}</span> customers
          </>
        }
      >
        <div className="max-w-4xl mx-auto">
          <div className="pl-card" style={{ padding: 16 }}>
            <div className="flex flex-wrap gap-2.5 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--ds-text3)" }}
                >
                  <Icon.Search />
                </span>
                <input
                  value={savedSearch}
                  onChange={(e) => setSavedSearch(e.target.value)}
                  placeholder="Search customer or city…"
                  aria-label="Search saved price lists"
                  className="pl-input"
                  style={{ paddingLeft: 36, height: 38 }}
                />
              </div>
              <button
                className="pl-btn"
                onClick={updateAll}
                disabled={noSheet || outdatedTotal === 0}
                title="Recalculate every outdated saved list from the current sheet"
              >
                <Icon.Refresh /> Update all outdated
                {outdatedTotal > 0 && (
                  <span className="pl-mono" style={{ opacity: 0.8 }}>
                    {outdatedTotal}
                  </span>
                )}
              </button>
            </div>
            {noSheet && (
              <p
                style={{
                  fontSize: 12,
                  marginTop: 10,
                  color: "var(--ds-primary)",
                }}
              >
                Upload a price sheet to open or update saved lists.
              </p>
            )}
          </div>

          {list.length === 0 ? (
            <div
              className="pl-card mt-4"
              style={{ padding: "48px 16px", textAlign: "center" }}
            >
              <div
                style={{
                  fontSize: 14.5,
                  fontWeight: 600,
                  color: "var(--ds-text1)",
                }}
              >
                {savedLists.length
                  ? "No customers match"
                  : "No saved price lists yet"}
              </div>
              <div className="pl-sub" style={{ fontSize: 12, marginTop: 4 }}>
                {savedLists.length
                  ? "Try a different name or city"
                  : "Build a price list and press “Save for customer” in the preview"}
              </div>
            </div>
          ) : (
            <div className="grid gap-3 mt-4">
              {list.map((c) => {
                const out = outdatedMap[c.id] || 0;
                const hist = c.history || [];
                const histOpen = openHist === c.id;
                return (
                  <div key={c.id} className="pl-card" style={{ padding: 16 }}>
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "var(--ds-text1)",
                          }}
                        >
                          {c.name}
                        </p>
                        <p
                          className="pl-sub"
                          style={{ fontSize: 12, marginTop: 2 }}
                        >
                          {c.city ? `${c.city} · ` : ""}
                          <span className="pl-mono">
                            {c.current.keys.length}
                          </span>{" "}
                          products · saved {fmtDateTime(c.savedAt)}
                        </p>
                        <div
                          className="flex gap-2 flex-wrap"
                          style={{ marginTop: 8 }}
                        >
                          <span className="pl-pill">
                            {pricingSummary(c.current.pricing)}
                          </span>
                          {c.current.opts?.terms && (
                            <span className="pl-pill">
                              {c.current.opts.terms}
                            </span>
                          )}
                          {c.current.opts?.gst &&
                            c.current.opts.gst !== "none" && (
                              <span className="pl-pill">
                                GST {GST_LABEL[c.current.opts.gst]}
                              </span>
                            )}
                          {out > 0 && (
                            <span
                              className="pl-pill"
                              style={{
                                color: "var(--ds-primary)",
                                borderColor: "rgba(212,175,106,0.35)",
                                background: "var(--ds-primaryDim)",
                              }}
                            >
                              {out} price{out > 1 ? "s" : ""} outdated
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap items-center">
                        <button
                          className="pl-btn primary sm"
                          disabled={noSheet}
                          onClick={() => openSaved(c)}
                        >
                          Open
                        </button>
                        <button
                          className="pl-btn sm"
                          disabled={noSheet}
                          onClick={() => updateOne(c)}
                          title="Recalculate prices from the current sheet"
                        >
                          <Icon.Refresh /> Update prices
                        </button>
                        <button
                          className="pl-btn ghost sm"
                          onClick={() => setOpenHist(histOpen ? null : c.id)}
                          aria-expanded={histOpen}
                        >
                          History ({hist.length})
                        </button>
                        <button
                          className="pl-btn ghost sm"
                          onClick={() => duplicateSaved(c)}
                        >
                          Duplicate
                        </button>
                        {confirmDel === c.id ? (
                          <span className="flex items-center gap-1.5">
                            <span
                              style={{ fontSize: 12, color: "var(--ds-text3)" }}
                            >
                              Delete?
                            </span>
                            <button
                              className="pl-btn solid-danger sm"
                              onClick={() => deleteSaved(c)}
                            >
                              Yes
                            </button>
                            <button
                              className="pl-btn sm"
                              onClick={() => setConfirmDel(null)}
                            >
                              No
                            </button>
                          </span>
                        ) : (
                          <button
                            className="pl-btn danger sm"
                            onClick={() => setConfirmDel(c.id)}
                            aria-label={`Delete ${c.name}`}
                          >
                            <Icon.Trash />
                          </button>
                        )}
                      </div>
                    </div>

                    {histOpen && (
                      <div
                        style={{
                          marginTop: 12,
                          borderTop: "1px solid var(--ds-border)",
                          paddingTop: 10,
                        }}
                      >
                        {hist.length === 0 ? (
                          <p className="pl-sub" style={{ fontSize: 12 }}>
                            No earlier versions yet. A version is kept whenever
                            prices change.
                          </p>
                        ) : (
                          hist.map((h, i) => (
                            <div
                              key={h.savedAt || i}
                              className="flex items-center justify-between gap-3"
                              style={{
                                padding: "7px 0",
                                borderBottom:
                                  i < hist.length - 1
                                    ? "1px solid var(--ds-border)"
                                    : 0,
                                fontSize: 12.5,
                              }}
                            >
                              <span style={{ color: "var(--ds-text2)" }}>
                                {fmtDateTime(h.savedAt)} ·{" "}
                                <span className="pl-mono">{h.keys.length}</span>{" "}
                                products · {pricingSummary(h.pricing)}
                              </span>
                              <button
                                className="pl-btn ghost sm"
                                disabled={noSheet}
                                onClick={() => openSaved(c, h)}
                              >
                                Open this version
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Shell>
    );
  }

  const contactRows = [
    ["Technical Support", contacts.tech],
    ["Enquiry / Orders", contacts.enq],
  ].filter(([, c]) => c.name.trim() || c.phone.trim());

  const restoreOriginal = (k) =>
    setOverrides((o) => {
      const n = { ...o };
      delete n[k];
      return n;
    });

  return (
    <Shell
      {...shell}
      title="Preview & Print"
      icon={<Icon.Eye />}
      meta={
        <>
          <span className="pl-mono">{selCount}</span> products ·{" "}
          <span className="pl-mono">{Object.keys(grouped).length}</span>{" "}
          categories
        </>
      }
      bare
    >
      {/* Screen toolbar */}
      <div className="no-print pl-topbar">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => setStep(2)} className="pl-btn ghost">
            <Icon.Back /> Edit
          </button>
          <div className="flex-1 min-w-0">
            <p
              className="truncate"
              style={{
                color: "var(--ds-text1)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {customerName}
            </p>
            <p style={{ color: "var(--ds-text3)", fontSize: 12 }}>
              <span className="pl-mono">{selCount}</span> products ·{" "}
              <span className="pl-mono">{Object.keys(grouped).length}</span>{" "}
              categories
            </p>
          </div>
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`pl-chip${editMode ? " on" : ""} hidden sm:inline-flex`}
            title="Edit individual prices"
            aria-pressed={editMode}
          >
            <Icon.Edit /> Edit prices
            {editedCount > 0 && (
              <span className="n pl-mono">{editedCount}</span>
            )}
          </button>
          {editedCount > 0 && (
            <button
              onClick={() => setOverrides({})}
              className="pl-btn ghost sm hidden md:inline-flex"
            >
              Reset edits
            </button>
          )}
          <button
            onClick={() => setShowCodes((v) => !v)}
            className={`pl-chip${showCodes ? " on" : ""} hidden sm:inline-flex`}
            title="Show product codes on the price list"
            aria-pressed={showCodes}
          >
            <Icon.Check size="w-3 h-3" /> Codes
          </button>
          <div
            className="hidden md:flex items-center gap-1"
            title="Preview zoom (does not affect print)"
          >
            <button
              className="pl-btn sm"
              style={{ width: 30, padding: 0 }}
              onClick={() =>
                setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(1)))
              }
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              className="pl-btn sm pl-mono"
              style={{ width: 54, padding: 0 }}
              onClick={() => setZoom(1)}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              className="pl-btn sm"
              style={{ width: 30, padding: 0 }}
              onClick={() =>
                setZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(1)))
              }
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
          <button
            onClick={saveCurrent}
            disabled={isSaved}
            className={`pl-btn${isSaved ? " ghost" : ""}`}
            title="Save this price list for the customer"
          >
            {isSaved ? (
              <>
                <Icon.Check size="w-3.5 h-3.5" /> Saved
              </>
            ) : (
              <>
                <Icon.Bookmark />{" "}
                {activeRec ? "Save changes" : "Save for customer"}
              </>
            )}
          </button>
          <button onClick={handlePrint} className="pl-btn primary">
            <Icon.Print /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Options panel (screen only) */}
      <div
        className="no-print"
        style={{ maxWidth: 794, margin: "22px auto 0", padding: "0 16px" }}
      >
        <div className="pl-card">
          <div
            className="flex items-center justify-between gap-3"
            style={{ padding: "12px 16px" }}
          >
            <button
              onClick={() => setShowOpts((v) => !v)}
              className="pl-title"
              style={{ background: "none", border: 0, cursor: "pointer" }}
              aria-expanded={showOpts}
            >
              <span
                style={{
                  display: "inline-flex",
                  transform: showOpts ? "rotate(90deg)" : "none",
                  transition: "transform .15s",
                }}
              >
                <Icon.ChevronRight />
              </span>
              Price list options
              {adjPct !== 0 && (
                <span
                  className="pl-pill"
                  style={{
                    color: "var(--ds-primary)",
                    borderColor: "rgba(212,175,106,0.35)",
                    background: "var(--ds-primaryDim)",
                  }}
                >
                  {adjPct > 0 ? "+" : ""}
                  {adjPct}% · {adjCount} item{adjCount === 1 ? "" : "s"}
                </span>
              )}
            </button>
            <div className="flex gap-2">
              <button onClick={copyWhatsApp} className="pl-btn sm">
                {copied ? (
                  <>
                    <Icon.Check size="w-3.5 h-3.5" /> Copied
                  </>
                ) : (
                  "Copy for WhatsApp"
                )}
              </button>
              <button onClick={shareWhatsApp} className="pl-btn sm">
                Share on WhatsApp
              </button>
              <button onClick={exportExcel} className="pl-btn sm">
                Excel
              </button>
            </div>
          </div>
          {showOpts && (
            <div
              style={{
                padding: "4px 16px 18px",
                borderTop: "1px solid var(--ds-border)",
              }}
            >
              <div
                className="grid gap-3.5 mt-3.5"
                style={{
                  gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                }}
              >
                <div>
                  <label className="pl-label" style={{ marginBottom: 6 }}>
                    Valid for
                  </label>
                  <Dropdown
                    value={opts.validDays}
                    onChange={(v) => setOpt("validDays", v)}
                    options={[
                      { value: 0, label: "No validity" },
                      { value: 7, label: "7 days" },
                      { value: 15, label: "15 days" },
                      { value: 30, label: "30 days" },
                    ]}
                  />
                </div>
                <div>
                  <label className="pl-label" style={{ marginBottom: 6 }}>
                    Sort products
                  </label>
                  <Dropdown
                    value={opts.sort}
                    onChange={(v) => setOpt("sort", v)}
                    options={[
                      { value: "sheet", label: "As in Excel" },
                      { value: "name", label: "Name A–Z" },
                      { value: "low", label: "Price low → high" },
                      { value: "high", label: "Price high → low" },
                    ]}
                  />
                </div>
                <div>
                  <label className="pl-label" style={{ marginBottom: 6 }}>
                    Payment terms
                  </label>
                  <Dropdown
                    value={opts.terms}
                    onChange={(v) => setOpt("terms", v)}
                    options={[
                      "Advance",
                      "7 days",
                      "15 days",
                      "30 days",
                      "45 days",
                    ].map((v) => ({ value: v, label: v }))}
                  />
                </div>
                <div>
                  <label className="pl-label" style={{ marginBottom: 6 }}>
                    GST
                  </label>
                  <Dropdown
                    value={opts.gst}
                    onChange={(v) => setOpt("gst", v)}
                    options={[
                      { value: "none", label: "Not shown" },
                      { value: "extra", label: "Extra" },
                      { value: "incl", label: "Included" },
                    ]}
                  />
                </div>
                <div>
                  <label className="pl-label" style={{ marginBottom: 6 }}>
                    Round prices to
                  </label>
                  <Dropdown
                    value={opts.round}
                    onChange={(v) => setOpt("round", v)}
                    options={[
                      { value: 1, label: "Nearest ₹1" },
                      { value: 5, label: "Nearest ₹5" },
                      { value: 10, label: "Nearest ₹10" },
                    ]}
                  />
                </div>
                <div>
                  <label className="pl-label" style={{ marginBottom: 6 }}>
                    Reference no. (optional)
                  </label>
                  <input
                    className="pl-input"
                    value={opts.refNo}
                    onChange={(e) => setOpt("refNo", e.target.value)}
                    placeholder="e.g. PL/2026/014"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="pl-label" style={{ marginBottom: 8 }}>
                  Layout
                </label>
                <div className="pl-seg">
                  <button
                    className={opts.layout !== "bold" ? "on" : ""}
                    onClick={() => setOpt("layout", "editorial")}
                  >
                    Editorial
                  </button>
                  <button
                    className={opts.layout === "bold" ? "on" : ""}
                    onClick={() => setOpt("layout", "bold")}
                  >
                    Bold
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="pl-label" style={{ marginBottom: 8 }}>
                  Theme colour
                </label>
                <div className="flex gap-2.5 flex-wrap">
                  {Object.entries(THEMES).map(([id, t]) => (
                    <button
                      key={id}
                      title={t.label}
                      aria-label={t.label}
                      aria-pressed={(opts.theme || "forest") === id}
                      onClick={() => setOpt("theme", id)}
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: t.brand,
                        cursor: "pointer",
                        border: "2px solid var(--ds-card)",
                        boxShadow:
                          (opts.theme || "forest") === id
                            ? `0 0 0 2px ${t.brand}, 0 0 0 4px var(--ds-primary)`
                            : "0 0 0 1px var(--ds-borderHi)",
                        transition: "box-shadow .15s",
                      }}
                    />
                  ))}
                  <label
                    title="Custom colour"
                    aria-label="Custom colour"
                    style={{
                      position: "relative",
                      width: 30,
                      height: 30,
                      borderRadius: "50%",
                      cursor: "pointer",
                      background:
                        "conic-gradient(#e5484d,#f5a623,#46a758,#2bb5c9,#4f6bed,#c04fd6,#e5484d)",
                      border: "2px solid var(--ds-card)",
                      boxShadow:
                        opts.theme === "custom"
                          ? "0 0 0 2px var(--ds-text2), 0 0 0 4px var(--ds-primary)"
                          : "0 0 0 1px var(--ds-borderHi)",
                    }}
                  >
                    <input
                      type="color"
                      value={opts.customColor || "#0f3d2e"}
                      onChange={(e) =>
                        setOpts((o) => ({
                          ...o,
                          customColor: e.target.value,
                          theme: "custom",
                        }))
                      }
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                      }}
                    />
                  </label>
                </div>
              </div>

              <div
                className="mt-4"
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "var(--ds-surface)",
                  border: "1px solid var(--ds-border)",
                }}
              >
                <PricingPanel
                  pricing={pricing}
                  setPricing={setPricing}
                  sample={flatSel[0]}
                />
              </div>

              {/* Price adjustment */}
              <div
                className="mt-4"
                style={{
                  padding: 14,
                  borderRadius: 10,
                  background: "var(--ds-surface)",
                  border: "1px solid var(--ds-border)",
                }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--ds-text1)",
                      }}
                    >
                      Price adjustment
                    </p>
                    <p
                      className="pl-sub"
                      style={{ fontSize: 12, marginTop: 2 }}
                    >
                      Applies to this price list only · not saved
                    </p>
                  </div>
                  <div className="pl-seg" role="tablist">
                    <button
                      className={adjScope === "all" ? "on" : ""}
                      onClick={() => setAdjScope("all")}
                    >
                      All products
                    </button>
                    <button
                      className={adjScope === "selected" ? "on" : ""}
                      onClick={() => setAdjScope("selected")}
                    >
                      Selected items
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap mt-3">
                  <div className="relative" style={{ width: 130 }}>
                    <input
                      type="number"
                      step="0.5"
                      min="-50"
                      max="100"
                      placeholder="0"
                      aria-label="Adjustment percent"
                      className="pl-input"
                      style={{ paddingRight: 30 }}
                      value={adjust}
                      onChange={(e) => setAdjust(e.target.value)}
                    />
                    <span
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "var(--ds-text3)", fontSize: 13 }}
                    >
                      %
                    </span>
                  </div>
                  {[-5, -2, 2, 5].map((d) => (
                    <button
                      key={d}
                      className={`pl-chip${adjPct === d ? " on" : ""}`}
                      onClick={() => setAdjust(String(d))}
                    >
                      {d > 0 ? "+" : "−"}
                      {Math.abs(d)}%
                    </button>
                  ))}
                  {adjPct !== 0 && (
                    <button
                      className="pl-btn ghost sm"
                      onClick={() => setAdjust("")}
                    >
                      Reset
                    </button>
                  )}
                </div>

                {adjScope === "selected" && (
                  <div className="mt-3">
                    <div
                      className="flex items-center justify-between"
                      style={{ marginBottom: 6 }}
                    >
                      <span style={{ fontSize: 12, color: "var(--ds-text3)" }}>
                        <span
                          className="pl-mono"
                          style={{ color: "var(--ds-text1)" }}
                        >
                          {
                            adjKeys.filter((k) =>
                              flatSel.some((p) => key(p) === k),
                            ).length
                          }
                        </span>{" "}
                        of {flatSel.length} selected
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          className="pl-btn ghost sm"
                          onClick={() => setAdjKeys(flatSel.map(key))}
                        >
                          Select all
                        </button>
                        <button
                          className="pl-btn ghost sm"
                          onClick={() => setAdjKeys([])}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="pl-pick">
                      {flatSel.map((p) => {
                        const k = key(p);
                        const on = adjKeys.includes(k);
                        const base = priceParts(p, pricing).total;
                        return (
                          <button
                            key={k}
                            className={on ? "on" : ""}
                            onClick={() =>
                              setAdjKeys((a) =>
                                a.includes(k)
                                  ? a.filter((x) => x !== k)
                                  : [...a, k],
                              )
                            }
                          >
                            <span className={`pl-check${on ? " on" : ""}`}>
                              {on && <Icon.Check size="w-2.5 h-2.5" />}
                            </span>
                            <span className="nm">{p.name}</span>
                            <span className="pl-mono pr">
                              {on && adjPct !== 0 ? (
                                <>
                                  <s>₹{inr(base)}</s> ₹{inr(priceOf(p))}
                                </>
                              ) : (
                                `₹${inr(base)}`
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {adjPct !== 0 && adjCount === 0 && (
                      <p
                        style={{
                          fontSize: 12,
                          color: "var(--ds-warning, var(--ds-primary))",
                          marginTop: 8,
                        }}
                      >
                        Tick at least one product to apply the adjustment.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="pl-label" style={{ marginBottom: 6 }}>
                  Note at the bottom
                </label>
                <input
                  className="pl-input"
                  value={opts.notes}
                  onChange={(e) => setOpt("notes", e.target.value)}
                  placeholder="e.g. Prices ex-factory, GST extra"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {editMode && (
        <div
          className="no-print"
          style={{ maxWidth: 794, margin: "14px auto 0", padding: "0 16px" }}
        >
          <div
            className="flex items-center gap-3 flex-wrap"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--ds-primaryDim)",
              border: "1px solid rgba(212,175,106,0.35)",
              color: "var(--ds-primary)",
              fontSize: 12.5,
            }}
          >
            <span style={{ flex: 1, minWidth: 200 }}>
              Editing prices · type a new amount in any price box, press Enter
              to jump to the next. Edited prices are highlighted.
            </span>
            <button className="pl-btn sm" onClick={() => setEditMode(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {changes.length > 0 && (
        <div
          className="no-print"
          style={{ maxWidth: 794, margin: "14px auto 0", padding: "0 16px" }}
        >
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--ds-primaryDim)",
              border: "1px solid rgba(212,175,106,0.35)",
              color: "var(--ds-primary)",
              fontSize: 12.5,
            }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span style={{ flex: 1, minWidth: 200 }}>
                <b className="pl-mono">{changes.length}</b> saved price
                {changes.length > 1 ? "s differ" : " differs"} from the current
                sheet / formula
              </span>
              <button
                className="pl-btn ghost sm"
                onClick={() => setShowChanges((v) => !v)}
              >
                {showChanges ? "Hide" : "Review"}
              </button>
              <button
                className="pl-btn sm"
                onClick={() =>
                  setOverrides((o) => {
                    const n = { ...o };
                    changes.forEach((p) => delete n[key(p)]);
                    return n;
                  })
                }
              >
                Update all to new
              </button>
            </div>
            {showChanges && (
              <div style={{ marginTop: 10, maxHeight: 220, overflowY: "auto" }}>
                {changes.map((p) => {
                  const old = Number(overrides[key(p)]);
                  const nw = basePrice(p);
                  const d = nw - old;
                  return (
                    <div
                      key={key(p)}
                      className="flex items-center gap-3"
                      style={{
                        padding: "6px 0",
                        borderTop: "1px solid rgba(212,175,106,0.2)",
                      }}
                    >
                      <span
                        style={{
                          flex: 1,
                          minWidth: 0,
                          color: "var(--ds-text1)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </span>
                      <span
                        className="pl-mono"
                        style={{ color: "var(--ds-text2)" }}
                      >
                        ₹{inr(old)} → ₹{inr(nw)}
                      </span>
                      <span
                        className="pl-mono"
                        style={{
                          width: 54,
                          textAlign: "right",
                          color:
                            d > 0 ? "var(--ds-danger)" : "var(--ds-success)",
                        }}
                      >
                        {d > 0 ? "+" : ""}
                        {inr(d)}
                      </span>
                      <button
                        className="pl-btn ghost sm"
                        onClick={() => restoreOriginal(key(p))}
                      >
                        Use new
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PRINT DOCUMENT ─────────────────────────────────────────────── */}
      <div id="sf-print-area" className="pl-paper-wrap">
        <article
          className={`pl-sheet${opts.layout === "bold" ? "" : " ed"}`}
          style={{ zoom, "--brand": brand }}
        >
          <table className="pl-page">
            <thead>
              <tr>
                <td>
                  <header className="pl-sh-head">
                    <div className="pl-sh-left">
                      <div className="pl-sh-logo">
                        {logo ? (
                          <img src={logo} alt="" />
                        ) : (
                          <span>{coName.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="pl-sh-co">{coName}</div>
                        {company.tagline.trim() && (
                          <div className="pl-sh-tag">{company.tagline}</div>
                        )}
                      </div>
                    </div>
                    <div className="pl-sh-doc">
                      <div className="t">Price List</div>
                      <div className="d">{today}</div>
                      {opts.refNo.trim() && (
                        <div className="ref">Ref: {opts.refNo.trim()}</div>
                      )}
                    </div>
                  </header>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div className="pl-sh-body">
                    <div className="pl-sh-to">
                      <div className="pl-sh-who">
                        <div className="ava">
                          {customerName.trim().charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="k">Prepared for</div>
                          <div className="who">{customerName}</div>
                          {customerCity && (
                            <div className="loc">{customerCity}</div>
                          )}
                        </div>
                      </div>
                      <dl className="pl-sh-kv">
                        <div>
                          <dt>Price basis</dt>
                          <dd>₹ per kg</dd>
                        </div>
                        <div>
                          <dt>Terms</dt>
                          <dd>{opts.terms}</dd>
                        </div>
                        {opts.gst !== "none" && (
                          <div>
                            <dt>GST</dt>
                            <dd>{GST_LABEL[opts.gst]}</dd>
                          </div>
                        )}
                        {validTill && (
                          <div>
                            <dt>Valid till</dt>
                            <dd>{validTill}</dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {Object.entries(sortedGrouped).map(([cat, prods], ci) => {
                      return (
                        <section
                          key={cat}
                          className="pl-sec"
                          style={{
                            breakInside: prods.length <= 14 ? "avoid" : "auto",
                          }}
                        >
                          <table className="pl-tbl">
                            <colgroup>
                              <col style={{ width: 48 }} />
                              {showCodes && <col style={{ width: 96 }} />}
                              <col />
                              <col style={{ width: 120 }} />
                            </colgroup>
                            <thead>
                              <tr className="cat">
                                <th colSpan={showCodes ? 4 : 3}>
                                  <span className="num">
                                    {String(ci + 1).padStart(2, "0")}
                                  </span>
                                  {cat}
                                  <em>
                                    {prods.length}{" "}
                                    {prods.length > 1 ? "items" : "item"}
                                  </em>
                                </th>
                              </tr>
                              <tr className="cols">
                                <th>No.</th>
                                {showCodes && <th>Code</th>}
                                <th>Product</th>
                                <th className="r">Rs / Kg</th>
                              </tr>
                            </thead>
                            <tbody>
                              {prods.map((p, i) => {
                                const k = key(p);
                                const ov = overrides[k] !== undefined;
                                return (
                                  <tr key={k}>
                                    <td className="no">{i + 1}</td>
                                    {showCodes && (
                                      <td className="cd">{p.code || "—"}</td>
                                    )}
                                    <td className="nm">{p.name}</td>
                                    <td className="pr r">
                                      {editMode ? (
                                        <>
                                          <span className="no-print pl-pe-wrap">
                                            {ov && (
                                              <button
                                                className="pl-pe-x"
                                                title="Restore original"
                                                aria-label="Restore original price"
                                                onClick={() =>
                                                  restoreOriginal(k)
                                                }
                                              >
                                                ↺
                                              </button>
                                            )}
                                            <input
                                              className={`pl-pe${ov ? " mod" : ""}`}
                                              type="number"
                                              min="0"
                                              step="any"
                                              aria-label={`Price for ${p.name}`}
                                              value={
                                                ov ? overrides[k] : priceOf(p)
                                              }
                                              onChange={(e) =>
                                                setOverrides((o) => ({
                                                  ...o,
                                                  [k]: e.target.value,
                                                }))
                                              }
                                              onBlur={() => {
                                                if (
                                                  overrides[k] === "" ||
                                                  (ov &&
                                                    Number(overrides[k]) ===
                                                      basePrice(p))
                                                )
                                                  restoreOriginal(k);
                                              }}
                                              onFocus={(e) => e.target.select()}
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                  e.preventDefault();
                                                  const els = [
                                                    ...document.querySelectorAll(
                                                      ".pl-pe",
                                                    ),
                                                  ];
                                                  const nx =
                                                    els[
                                                      els.indexOf(e.target) + 1
                                                    ];
                                                  if (nx) nx.focus();
                                                  else e.target.blur();
                                                }
                                              }}
                                            />
                                          </span>
                                          <span className="pl-print-only">
                                            <i>₹</i>
                                            {inr(priceOf(p))}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <i>₹</i>
                                          {inr(priceOf(p))}
                                        </>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </section>
                      );
                    })}
                  </div>
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td>
                  {contactRows.length > 0 && (
                    <div className="pl-sh-end">
                      <div className="cols">
                        {contactRows.map(([t, c]) => (
                          <div key={t} className="it">
                            <div className="lb">{t}</div>
                            {c.name.trim() && (
                              <div className="nm">{c.name}</div>
                            )}
                            {c.phone.trim() && (
                              <div className="ph">{c.phone}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <footer className="pl-sh-foot">
                    <span>{opts.notes}</span>
                    <span>Not a tax invoice</span>
                  </footer>
                </td>
              </tr>
            </tfoot>
          </table>
        </article>
      </div>
    </Shell>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const STEPS = [
  { label: "Upload", hint: "Excel price sheet", icon: () => <Icon.Upload /> },
  { label: "Customer", hint: "Who it's for", icon: () => <Icon.User /> },
  { label: "Products", hint: "Pick items to list", icon: () => <Icon.Tag /> },
  { label: "Preview", hint: "Print / save PDF", icon: () => <Icon.Eye /> },
  {
    label: "Saved",
    hint: "Customer price lists",
    icon: () => <Icon.Bookmark />,
  },
];

function Shell({
  step,
  setStep,
  navigate,
  canGo,
  productCount,
  title,
  icon,
  meta,
  children,
  footer,
  bare,
  toast,
  savedCount,
}) {
  const goHome = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    navigate("/");
  };
  return (
    <div
      className="pl-root"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--ds-bg)",
        color: "var(--ds-text1)",
      }}
    >
      <aside className="pl-sidebar no-print">
        <div className="pl-brand">
          <div className="pl-logo">P</div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--ds-text1)",
                letterSpacing: "-0.01em",
              }}
            >
              Price List
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ds-text3)",
                fontWeight: 500,
              }}
            >
              Quotation Builder
            </div>
          </div>
        </div>

        <nav className="pl-nv" aria-label="Price list steps">
          <div className="pl-nv-lab">Workflow</div>
          <div className="pl-nv-list">
            {STEPS.map((s, i) => {
              const active = step === i;
              const done = step < 4 && i < step;
              return (
                <button
                  key={s.label}
                  className={`pl-nv-item${active ? " active" : ""}${done ? " done" : ""}`}
                  disabled={!canGo[i]}
                  onClick={() => canGo[i] && setStep(i)}
                  aria-current={active ? "step" : undefined}
                >
                  <span className="pl-nv-ic">
                    {done ? <Icon.Check size="w-4 h-4" /> : s.icon()}
                  </span>
                  <span className="pl-nv-t">
                    <b>{s.label}</b>
                    <small>{s.hint}</small>
                  </span>
                  {i === 4 && savedCount > 0 && (
                    <span className="pl-nv-cnt pl-mono">{savedCount}</span>
                  )}
                  {i === 2 && productCount > 0 && (
                    <span className="pl-nv-cnt pl-mono">{productCount}</span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>
        <div className="pl-nv-foot">
          <Icon.Calendar />
          <div>{fmtDate().replace(/^0/, "")}</div>
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="pl-mobilebar no-print">
          <button
            className="pl-btn sm"
            onClick={() => navigate("/")}
            aria-label="My Office Workplace"
          >
            <Icon.Home />
          </button>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                style={{
                  width: 18,
                  height: 4,
                  borderRadius: 2,
                  background:
                    i <= step ? "var(--ds-primary)" : "var(--ds-border)",
                }}
              />
            ))}
          </div>
        </div>

        <main style={{ flex: 1, minWidth: 0 }}>
          {!bare && (
            <div className="no-print" style={{ padding: "28px 24px 18px" }}>
              <div className="flex items-center justify-between gap-3 flex-wrap max-w-6xl mx-auto">
                <div className="pl-title" style={{ fontSize: 15 }}>
                  <span
                    style={{
                      color: "var(--ds-primary)",
                      display: "inline-flex",
                    }}
                  >
                    {icon}
                  </span>{" "}
                  {title}
                </div>
                <span className="pl-sub">{meta}</span>
              </div>
            </div>
          )}
          <div style={bare ? undefined : { padding: "0 24px 28px" }}>
            {children}
          </div>
        </main>
        {footer}
      </div>
      {toast && (
        <div
          className="no-print"
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            zIndex: 80,
            padding: "10px 16px",
            borderRadius: 10,
            fontSize: 13,
            background: "var(--ds-card)",
            color: "var(--ds-text1)",
            border: "1px solid var(--ds-borderHi)",
            boxShadow: "0 14px 34px rgba(0,0,0,.38)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function Dropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) =>
      ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const cur = options.find((o) => o.value === value) || options[0];
  const openMenu = () => {
    setHi(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  };
  const onKey = (e) => {
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHi((h) => (h + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => (h - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(options[hi].value);
      setOpen(false);
    }
  };
  return (
    <div className={`pl-dd${open ? " open" : ""}`} ref={ref}>
      <button
        type="button"
        className="pl-dd-btn"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{cur.label}</span>
        <span
          style={{
            display: "inline-flex",
            color: "var(--ds-text3)",
            transform: open ? "rotate(-90deg)" : "rotate(90deg)",
            transition: "transform .15s",
          }}
        >
          <Icon.ChevronRight />
        </span>
      </button>
      {open && (
        <div className="pl-dd-menu" role="listbox">
          {options.map((o, i) => (
            <button
              key={String(o.value)}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`pl-dd-opt${i === hi ? " act" : ""}${o.value === value ? " sel" : ""}`}
              onMouseEnter={() => setHi(i)}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              {o.label}
              {o.value === value && <Icon.Check size="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactRow({ title, value, onChange }) {
  return (
    <div>
      <label className="pl-label" style={{ marginBottom: 6 }}>
        {title}
      </label>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <input
          value={value.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Name"
          aria-label={`${title} name`}
          className="pl-input"
        />
        <input
          type="tel"
          inputMode="tel"
          value={value.phone}
          onChange={(e) =>
            onChange("phone", e.target.value.replace(/[^0-9+\-\s()]/g, ""))
          }
          placeholder="Phone number"
          aria-label={`${title} phone`}
          className="pl-input"
        />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="pl-label">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-input"
      />
    </div>
  );
}

function PricingPanel({ pricing, setPricing, sample }) {
  const [open, setOpen] = useState(false); // hidden by default
  const set = (k, v) => setPricing((x) => ({ ...x, [k]: v }));
  const auto = pricing.mode === "auto";
  const parts = sample ? priceParts(sample, pricing) : null;
  const unit = (key, label) => (
    <div className="pl-seg">
      <button
        className={pricing[key] === "pct" ? "on" : ""}
        onClick={() => set(key, "pct")}
        aria-label={`${label} in percent`}
      >
        %
      </button>
      <button
        className={pricing[key] === "flat" ? "on" : ""}
        onClick={() => set(key, "flat")}
        aria-label={`${label} flat rupees per kg`}
      >
        ₹ / kg
      </button>
    </div>
  );
  const numInput = (key, ph, w = 110) => (
    <input
      type="number"
      step="any"
      min="0"
      placeholder={ph}
      className="pl-input"
      style={{ width: w }}
      value={pricing[key]}
      onChange={(e) => set(key, e.target.value)}
      aria-label={key}
    />
  );
  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: 0,
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              color: "var(--ds-text3)",
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform .15s",
            }}
          >
            <Icon.ChevronRight />
          </span>
          <span>
            <span
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ds-text1)",
              }}
            >
              Price calculation
            </span>
            <span
              className="pl-sub"
              style={{ display: "block", fontSize: 12, marginTop: 2 }}
            >
              {open
                ? "Saved on this device · applies to all products"
                : `${auto ? "Auto" : "Manual"} · ${
                    auto
                      ? "DP45 × 1.25 + 15"
                      : `${BASE_LABEL[pricing.base]} × ${(1 + num(pricing.markup) / 100).toFixed(2)}`
                  }${num(pricing.commission) ? " · commission" : ""}${num(pricing.transport) ? " · transport" : ""}`}
            </span>
          </span>
        </button>
        {open && (
          <div className="pl-seg">
            <button
              className={auto ? "on" : ""}
              onClick={() => set("mode", "auto")}
            >
              Auto
            </button>
            <button
              className={!auto ? "on" : ""}
              onClick={() => set("mode", "manual")}
            >
              Manual
            </button>
          </div>
        )}
      </div>

      {open && (
        <>
          {auto && (
            <p
              className="pl-sub pl-mono"
              style={{ fontSize: 12.5, marginTop: 12 }}
            >
              DP45 × 1.25 + 15
            </p>
          )}

          <div
            className="flex items-end gap-3 flex-wrap"
            style={{ marginTop: 12 }}
          >
            {!auto && (
              <>
                <div style={{ width: 104 }}>
                  <label className="pl-label" style={{ marginBottom: 6 }}>
                    Base column
                  </label>
                  <Dropdown
                    value={pricing.base}
                    onChange={(v) => set("base", v)}
                    options={[
                      { value: "dp7", label: "DP7" },
                      { value: "dp45", label: "DP45" },
                      { value: "rsp", label: "RSP" },
                    ]}
                  />
                </div>
                <div>
                  <label className="pl-label" style={{ marginBottom: 6 }}>
                    Markup %
                  </label>
                  {numInput("markup", "0", 84)}
                </div>
              </>
            )}
            <div>
              <label className="pl-label" style={{ marginBottom: 6 }}>
                Commission
              </label>
              <div className="flex items-center gap-1.5">
                {numInput("commission", "0", 84)}
                {unit("commType", "Commission")}
              </div>
            </div>
            <div>
              <label className="pl-label" style={{ marginBottom: 6 }}>
                Transport charge
              </label>
              <div className="flex items-center gap-1.5">
                {numInput("transport", "0", 84)}
                {unit("transType", "Transport")}
              </div>
            </div>
            <button
              className="pl-btn ghost sm"
              style={{ marginBottom: 6 }}
              onClick={() => setPricing(DEFAULT_PRICING)}
            >
              Reset
            </button>
          </div>

          {parts && (
            <p
              className="pl-sub pl-mono"
              style={{ fontSize: 12, marginTop: 12, lineHeight: 1.6 }}
            >
              Example · {sample.name}: {inr(parts.base)} ×{" "}
              {(1 + parts.mk / 100).toFixed(2)}
              {parts.add > 0 && <> + {inr(parts.add)}</>} ={" "}
              {inr(Math.round(parts.core))}
              {parts.com > 0 && <> + comm {inr(Math.round(parts.com))}</>}
              {parts.tr > 0 && (
                <> + transport {inr(Math.round(parts.tr))}</>
              )} ={" "}
              <b style={{ color: "var(--ds-primary)" }}>₹{inr(parts.total)}</b>
              {!auto && parts.base === 0 && (
                <span style={{ color: "var(--ds-danger)" }}>
                  {" "}
                  · {BASE_LABEL[pricing.base]} is empty for this product
                </span>
              )}
            </p>
          )}
        </>
      )}
    </div>
  );
}

function CustomerField({
  label,
  value,
  onChange,
  customers,
  onPick,
  onRemove,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = (e) =>
      ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  const q = value.trim().toLowerCase();
  const list = customers.filter((c) => !q || c.name.toLowerCase().includes(q));
  return (
    <div className={`pl-dd${open ? " open" : ""}`} ref={ref}>
      <label className="pl-label">{label}</label>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={placeholder}
        autoComplete="off"
        className="pl-input"
      />
      {open && list.length > 0 && (
        <div
          className="pl-dd-menu"
          role="listbox"
          style={{ top: "calc(100% + 4px)", maxHeight: 240, overflowY: "auto" }}
        >
          {list.map((c) => (
            <div
              key={c.name}
              className="pl-dd-opt"
              role="option"
              aria-selected={c.name === value}
              style={{ cursor: "pointer" }}
              onClick={() => {
                onPick(c);
                setOpen(false);
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", color: "var(--ds-text1)" }}>
                  {c.name}
                </span>
                {c.city && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 11.5,
                      color: "var(--ds-text3)",
                    }}
                  >
                    {c.city}
                  </span>
                )}
              </span>
              <button
                type="button"
                className="pl-pe-x"
                title="Remove from saved"
                aria-label={`Remove ${c.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(c);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
