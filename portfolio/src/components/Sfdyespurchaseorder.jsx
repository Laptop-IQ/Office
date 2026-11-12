import {
  Component,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { XLSX } from "@/lib/xlsx";

// ── Config ──────────────────────────────────────────────────────────────────

const PRICE_TIERS = ["DP7", "DP45", "RSP"];
const GST_RATE = 0.18;
const MAX_UPLOAD_MB = 10;
const MAX_SEARCH_RESULTS = 50;
const DEFAULT_PO_NUMBER = "SNI/001/26-27";

const HEADER_KEYWORDS = [
  "code",
  "sku",
  "name",
  "product",
  "item",
  "description",
  "category",
  "sr",
  "sno",
  "no",
  "dp7",
  "dp45",
  "rsp",
];

// Category keyword → default package size (kg)
const PKG_DEFAULTS_CONFIG = [
  { key: "ecofast", label: "Ecofast", defaultKg: 12 },
  { key: "ecosol", label: "Ecosol", defaultKg: 35 },
];
const OTHER_KEY = "_other";

const TIER_INFO = {
  DP7: { color: "var(--po-accent)", desc: "Dealer ≥7 days" },
  DP45: { color: "var(--po-blue)", desc: "Dealer 45-day" },
  RSP: { color: "var(--po-pink)", desc: "Retail price" },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const todayISO = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const normalize = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[\s_.-]/g, "");

function detectHeaderRowIndex(rawRows, scanLimit = 15) {
  let bestIdx = -1;
  let bestScore = 0;
  const limit = Math.min(rawRows.length, scanLimit);
  for (let r = 0; r < limit; r++) {
    const row = rawRows[r] || [];
    const score = row.filter((cell) => {
      const c = normalize(cell);
      return c && HEADER_KEYWORDS.some((k) => c.includes(normalize(k)));
    }).length;
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestIdx = r;
    }
  }
  return bestIdx;
}

const findCol = (cols, keywords) =>
  cols.find((c) => keywords.some((k) => normalize(c).includes(normalize(k))));

function detectCategory(name, category) {
  const s = `${name} ${category}`.toLowerCase();
  for (const { key } of PKG_DEFAULTS_CONFIG) if (s.includes(key)) return key;
  return null;
}

function formatDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${parseInt(day, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
}

const round4 = (n) => Math.round(n * 10000) / 10000;

function isExactMultiple(qty, pkgSize) {
  const q = parseFloat(qty);
  const p = parseFloat(pkgSize);
  if (!q || !p || p <= 0) return true;
  const ratio = q / p;
  return Math.abs(ratio - Math.round(ratio)) < 0.0001;
}
const snapDown = (qty, pkg) =>
  round4(Math.floor(parseFloat(qty) / parseFloat(pkg)) * parseFloat(pkg));
const snapUp = (qty, pkg) =>
  round4(Math.ceil(parseFloat(qty) / parseFloat(pkg)) * parseFloat(pkg));

// Prevent spreadsheet formula injection in CSV exports
const csvCell = (c) => {
  let s = String(c ?? "");
  if (typeof c === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

// ── Price list template ─────────────────────────────────────────────────────

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
  [1, "EF-001", "Ecofast Sample Red", "Ecofast", 100, 110, 125],
  [2, "ES-001", "Ecosol Sample Blue", "Ecosol", 200, 210, 240],
  [3, "GN-001", "Sample Other Product", "General", 150, 160, 180],
];

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Tries .xlsx first; falls back to CSV if the XLSX wrapper can't write
function downloadTemplate() {
  try {
    const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...TEMPLATE_ROWS]);
    ws["!cols"] = [
      { wch: 6 },
      { wch: 12 },
      { wch: 30 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 10 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Price List");
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveBlob(
      new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "price-list-template.xlsx",
    );
  } catch {
    const csv = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS]
      .map((r) => r.map(csvCell).join(","))
      .join("\n");
    saveBlob(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }),
      "price-list-template.csv",
    );
  }
}

const fmtQty = (q) => {
  const n = parseFloat(q) || 0;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
};
const fmtMoney = (v) => v.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const fmtMoney2 = (v) =>
  v.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const roundPkg = (n) => Math.round(n * 10) / 10;

// ── Theme + screen CSS ──────────────────────────────────────────────────────

const SCREEN_CSS = `
.po-root {
  --po-bg0: #111413;
  --po-bg: #161918;
  --po-surface: #1b1e1d;
  --po-hover: #222625;
  --po-line: #2a2e2c;
  --po-line2: #373c39;
  --po-text: #f3efe6;
  --po-text2: #cfc9bb;
  --po-text3: #b8b2a3;
  --po-dim: #8b8a82;
  --po-accent: #e9b44c;
  --po-accent-hover: #f2c56b;
  --po-on-accent: #1a1205;
  --po-blue: #d9955a;
  --po-pink: #c9776b;
  --po-cyan: #d8b980;
  --po-violet: #c9a86a;
  --po-red: #f0716a;
  --po-redline: #5a2a27;
  --po-errbg: #1f1413;
  --po-scheme: dark;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}
[data-theme="light"] .po-root, .light .po-root {
  --po-bg0: #faf7f0;
  --po-bg: #f3efe6;
  --po-surface: #ffffff;
  --po-hover: #f6f1e5;
  --po-line: #e6dfcf;
  --po-line2: #d6ccb4;
  --po-text: #1c1a14;
  --po-text2: #3d392e;
  --po-text3: #4a4538;
  --po-dim: #7a7566;
  --po-accent: #b7791f;
  --po-accent-hover: #9c6618;
  --po-on-accent: #ffffff;
  --po-blue: #a8622a;
  --po-pink: #a4483c;
  --po-cyan: #8a6a2a;
  --po-violet: #8a6d2f;
  --po-red: #c0392b;
  --po-redline: #f1b9b3;
  --po-errbg: #fdecea;
  --po-scheme: light;
}

.po-screen { min-height: 100vh; background: var(--po-bg0); color: var(--po-text3); }
.po-screen *, .po-screen *::before, .po-screen *::after { box-sizing: border-box; }
.po-screen button { font-family: inherit; }
.po-screen :focus-visible { outline: 2px solid var(--po-accent); outline-offset: 2px; }


.po-main { max-width: 1000px; margin: 0 auto; padding: 24px 24px 240px; }

.po-card { background: var(--po-surface); border: 1px solid var(--po-line); border-radius: 16px; }
.po-meta { padding: 18px 20px; margin-bottom: 14px; }
.po-eyebrow { font-size: 10px; font-weight: 700; color: var(--po-dim); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; }
.po-label { display: block; font-size: 10px; font-weight: 700; color: var(--po-dim); margin-bottom: 6px; letter-spacing: 0.08em; text-transform: uppercase; }
.po-hint { font-size: 10px; color: var(--po-dim); margin-top: 5px; padding-left: 2px; }

.po-grid3 { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 12px; }
.po-controls { margin-bottom: 14px; }

.po-input {
  width: 100%; background: var(--po-bg); border: 1px solid var(--po-line2); border-radius: 8px;
  padding: 10px 12px; color: var(--po-text); font-size: 13px; font-weight: 500;
  outline: none; font-family: inherit; color-scheme: var(--po-scheme); transition: border-color .15s;
}
.po-input:focus { border-color: var(--po-accent); }
.po-input:disabled { opacity: .45; cursor: not-allowed; }
.po-input.mono { font-family: ui-monospace, 'JetBrains Mono', monospace; letter-spacing: 0.04em; }

.po-tiers { display: flex; gap: 4px; }
.po-tier-btn {
  flex: 1; padding: 9px 0; border-radius: 8px; border: 1px solid var(--po-line);
  background: var(--po-bg); color: var(--po-dim); font-size: 11px; font-weight: 800;
  cursor: pointer; letter-spacing: 0.06em; transition: all .15s;
}
.po-tier-btn[aria-pressed="true"] { border-color: var(--tc); color: var(--tc); background: color-mix(in srgb, var(--tc) 10%, transparent); }

.po-upload {
  width: 100%; background: var(--po-bg); border: 1px solid var(--po-line); border-radius: 8px;
  padding: 9px 12px; color: var(--po-dim); font-size: 12px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 6px; transition: all .15s;
}
.po-upload:hover { border-color: color-mix(in srgb, var(--po-accent) 45%, transparent); }
.po-upload.done { color: var(--po-accent); border-color: color-mix(in srgb, var(--po-accent) 30%, transparent); }
.po-upload span.t { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }

.po-link { background: none; border: none; padding: 0; margin-top: 6px; color: var(--po-accent); font-size: 11px; font-weight: 700; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.po-link:hover { color: var(--po-accent-hover); }
.po-link.danger { color: var(--po-red); }
.po-link.danger:hover { color: var(--po-red); opacity: .8; }
.po-empty .po-link { margin-top: 16px; font-size: 12px; }

.po-search-wrap { position: relative; }
.po-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--po-dim); font-size: 15px; pointer-events: none; }
.po-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--po-dim); cursor: pointer; font-size: 18px; padding: 0; line-height: 1; }
.po-dropdown {
  position: absolute; z-index: 100; top: calc(100% + 4px); left: 0; right: 0;
  background: var(--po-surface); border: 1px solid var(--po-line2); border-radius: 12px;
  overflow: hidden auto; max-height: 320px; box-shadow: 0 24px 64px rgba(0,0,0,.45);
}
.po-dd-head { padding: 7px 12px; border-bottom: 1px solid var(--po-line); display: flex; justify-content: space-between; position: sticky; top: 0; background: var(--po-surface); font-size: 10px; color: var(--po-dim); }
.po-dd-empty { padding: 18px 16px; text-align: center; color: var(--po-dim); font-size: 13px; }
.po-dd-item { width: 100%; background: none; border: none; padding: 10px 14px; cursor: pointer; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid var(--po-bg0); text-align: left; transition: background .1s; }
.po-dd-item:hover, .po-dd-item:focus-visible { background: var(--po-hover); }
.po-dd-code { font-size: 9px; color: var(--po-dim); font-weight: 800; font-family: ui-monospace, monospace; letter-spacing: .06em; margin-bottom: 1px; }
.po-dd-name { font-size: 13px; color: var(--po-text); font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.po-dd-tags { display: flex; align-items: center; gap: 5px; margin-top: 2px; font-size: 9px; color: var(--po-dim); }
.po-dd-price { font-size: 14px; font-weight: 800; color: var(--po-accent); }
.po-dd-added { font-size: 8px; font-weight: 700; color: var(--po-accent); background: color-mix(in srgb, var(--po-accent) 10%, transparent); border-radius: 4px; padding: 1px 6px; margin-top: 2px; }

.po-badge { display: inline-flex; align-items: center; background: color-mix(in srgb, var(--po-cyan) 10%, transparent); border: 1px solid color-mix(in srgb, var(--po-cyan) 25%, transparent); border-radius: 4px; padding: 1px 6px; font-size: 9px; font-weight: 800; color: var(--po-cyan); white-space: nowrap; }

.po-status { margin-bottom: 12px; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--po-line); background: var(--po-surface); color: var(--po-text2); display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 500; }
.po-status.success { color: var(--po-accent); border-color: color-mix(in srgb, var(--po-accent) 35%, transparent); background: color-mix(in srgb, var(--po-accent) 8%, var(--po-bg0)); }
.po-status.error { color: var(--po-red); border-color: var(--po-redline); background: var(--po-errbg); }

.po-pkg { padding: 14px 16px; margin-bottom: 14px; border-radius: 12px; }
.po-pkg-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 8px; }
.po-pkg-cell { display: flex; align-items: center; gap: 8px; background: var(--po-bg); border: 1px solid var(--po-line); border-radius: 8px; padding: 8px 11px; }
.po-pkg-cell .po-badge { padding: 2px 7px; font-size: 10px; }
.po-mini { width: 60px; background: var(--po-bg0); border: 1px solid var(--po-line2); border-radius: 6px; padding: 5px 8px; color: var(--po-violet); font-size: 13px; font-weight: 700; text-align: center; outline: none; font-family: inherit; }
.po-mini:focus { border-color: var(--po-violet); }
.po-unit { font-size: 11px; color: var(--po-dim); font-weight: 600; }

.po-empty { border: 1.5px dashed var(--po-line); border-radius: 16px; padding: 56px 24px; text-align: center; background: var(--po-surface); }
.po-empty-icon { width: 56px; height: 56px; border: 1.5px dashed var(--po-line2); border-radius: 14px; margin: 0 auto 18px; display: flex; align-items: center; justify-content: center; font-size: 26px; color: var(--po-line2); }
.po-empty-title { font-size: 15px; font-weight: 700; color: var(--po-dim); margin-bottom: 6px; }
.po-empty-sub { font-size: 12px; color: var(--po-dim); opacity: .7; max-width: 320px; margin: 0 auto; }

.po-table { overflow: hidden; }
.po-row { display: grid; grid-template-columns: 28px 78px 1fr 100px 190px 110px 32px; gap: 8px; padding: 12px 16px; align-items: center; border-bottom: 1px solid var(--po-bg); transition: background .1s; }
.po-row:hover { background: var(--po-hover); }
.po-row.head { padding: 9px 16px; background: var(--po-bg); border-bottom: 1px solid var(--po-line); }
.po-row.head:hover { background: var(--po-bg); }
.po-row.foot { background: var(--po-bg); border-top: 1px solid var(--po-line); border-bottom: none; }
.po-row.foot:hover { background: var(--po-bg); }
.po-th { font-size: 9px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--po-dim); }
.po-r { text-align: right; } .po-c { text-align: center; }
.po-idx { font-size: 10px; font-weight: 600; color: var(--po-dim); }
.po-code { font-size: 10px; color: var(--po-dim); font-weight: 800; font-family: ui-monospace, monospace; letter-spacing: .04em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.po-pname { font-size: 13px; font-weight: 500; color: var(--po-text3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.po-pcat { font-size: 9px; color: var(--po-dim); margin-top: 1px; }
.po-rate { font-size: 14px; font-weight: 800; color: var(--po-text); }
.po-sub { font-size: 9px; color: var(--po-dim); margin-top: 1px; }
.po-col { display: flex; flex-direction: column; gap: 3px; }

.po-num { background: var(--po-bg); border: 1px solid var(--po-line); border-radius: 6px; padding: 5px 8px; color: var(--po-text); font-size: 13px; font-weight: 700; outline: none; font-family: inherit; transition: border-color .15s; -moz-appearance: textfield; }
.po-num::-webkit-outer-spin-button, .po-num::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.po-num:focus { border-color: var(--po-accent); }
.po-num.pkg { width: 62px; text-align: center; color: var(--po-violet); font-size: 12px; border-color: color-mix(in srgb, var(--po-violet) 25%, var(--po-line)); }
.po-num.pkg:focus { border-color: var(--po-violet); }
.po-num.cnt { width: 54px; text-align: center; padding: 5px 6px; font-size: 13px; color: var(--po-accent); border-color: color-mix(in srgb, var(--po-accent) 40%, var(--po-line)); }
.po-num.pkg { width: 58px; }
.po-pkgcell { display: flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap; }
.po-pkgsize { font-size: 13px; font-weight: 800; color: var(--po-violet); }
.po-times { font-size: 11px; color: var(--po-dim); font-weight: 600; }
.po-iconbtn { background: none; border: 1px solid var(--po-line2); border-radius: 4px; color: var(--po-dim); font-size: 11px; line-height: 1.3; padding: 1px 6px; cursor: pointer; transition: all .15s; }
.po-iconbtn:hover { color: var(--po-accent); border-color: var(--po-accent); }
.po-qtyval { font-size: 14px; font-weight: 800; color: var(--po-text); font-variant-numeric: tabular-nums; }
.po-cust-row { display: flex; align-items: center; border-bottom: 1px solid var(--po-bg0); }
.po-cust-row .po-dd-item { flex: 1; min-width: 0; border-bottom: none; }
.po-cust-del { align-self: stretch; background: none; border: none; color: var(--po-dim); cursor: pointer; font-size: 17px; line-height: 1; padding: 0 14px; }
.po-cust-del:hover { color: var(--po-red); background: var(--po-hover); }
.po-num.qty { width: 100%; text-align: right; }
.po-num.invalid { border-color: var(--po-red); color: var(--po-red); }

.po-line-total { font-size: 11px; font-weight: 800; color: var(--po-accent); }
.po-err { font-size: 9px; color: var(--po-red); font-weight: 700; }
.po-snaps { display: flex; gap: 3px; }
.po-snap { font-size: 9px; font-weight: 800; border-radius: 4px; padding: 2px 6px; cursor: pointer; line-height: 1.4; background: transparent; }
.po-snap.down { color: var(--po-accent); border: 1px solid color-mix(in srgb, var(--po-accent) 25%, transparent); background: color-mix(in srgb, var(--po-accent) 8%, transparent); }
.po-snap.up { color: var(--po-blue); border: 1px solid color-mix(in srgb, var(--po-blue) 25%, transparent); background: color-mix(in srgb, var(--po-blue) 8%, transparent); }
.po-remove { background: none; border: none; color: var(--po-dim); cursor: pointer; font-size: 18px; padding: 0; line-height: 1; display: flex; align-items: center; justify-content: center; border-radius: 4px; transition: color .15s; }
.po-remove:hover { color: var(--po-red); }

.po-footer { position: fixed; left: 0; right: 0; bottom: 0; z-index: 50; background: color-mix(in srgb, var(--po-bg0) 98%, transparent); backdrop-filter: blur(20px); border-top: 1px solid var(--po-line); }
.po-footer-in { max-width: 1000px; margin: 0 auto; }
.po-errstrip { display: flex; align-items: center; gap: 8px; padding: 7px 20px; background: var(--po-errbg); border-bottom: 1px solid var(--po-redline); font-size: 11px; font-weight: 700; color: var(--po-red); }
.po-stats { display: grid; grid-template-columns: repeat(6, 1fr); border-bottom: 1px solid var(--po-surface); }
.po-stat { padding: 10px 14px; border-right: 1px solid var(--po-surface); }
.po-stat:last-child { border-right: none; }
.po-stat-l { font-size: 9px; font-weight: 800; color: var(--po-dim); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 2px; }
.po-stat-v { font-size: 14px; font-weight: 800; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.po-stat-v.lg { font-size: 18px; }
.po-actions { display: grid; grid-template-columns: 1fr 1.8fr 1fr 1fr; gap: 8px; padding: 10px 20px; }
.po-toast { padding: 7px 20px; background: color-mix(in srgb, var(--po-accent) 10%, var(--po-bg0)); border-bottom: 1px solid color-mix(in srgb, var(--po-accent) 35%, transparent); font-size: 11px; font-weight: 700; color: var(--po-accent); }
.po-modal-backdrop { position: fixed; inset: 0; z-index: 200; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(8,10,9,.62); backdrop-filter: blur(4px); animation: po-fade .15s ease-out; }
.po-modal { width: 100%; max-width: 420px; background: var(--po-surface); border: 1px solid var(--po-line2); border-radius: 16px; padding: 24px; box-shadow: 0 24px 64px rgba(0,0,0,.45); animation: po-pop .18s ease-out; }
.po-modal-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px; background: color-mix(in srgb, var(--po-red) 12%, transparent); border: 1px solid color-mix(in srgb, var(--po-red) 30%, transparent); }
.po-modal-title { font-size: 16px; font-weight: 800; color: var(--po-text); margin: 0 0 8px; letter-spacing: -.01em; }
.po-modal-msg { font-size: 13px; line-height: 1.55; color: var(--po-text3); margin: 0; }
.po-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; }
.po-modal-btn { padding: 9px 16px; border-radius: 8px; border: 1px solid var(--po-line2); background: none; color: var(--po-text2); font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; }
.po-modal-btn:hover { border-color: var(--po-accent); color: var(--po-accent); }
.po-modal-btn.danger { background: var(--po-red); border-color: transparent; color: var(--po-on-accent); }
.po-modal-btn.danger:hover { filter: brightness(1.08); color: var(--po-on-accent); }
@keyframes po-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes po-pop { from { opacity: 0; transform: translateY(8px) scale(.97); } to { opacity: 1; transform: none; } }
.po-btn { padding: 10px 0; border-radius: 8px; border: 1px solid var(--po-line); background: none; color: var(--po-text2); font-size: 12px; font-weight: 700; cursor: pointer; transition: all .15s; }
.po-btn.danger { color: var(--po-dim); }
.po-btn.danger:hover { border-color: var(--po-redline); color: var(--po-red); }
.po-btn.ghost:hover { border-color: color-mix(in srgb, var(--po-blue) 45%, transparent); color: var(--po-blue); }
.po-btn.primary { background: var(--po-accent); color: var(--po-on-accent); border-color: transparent; font-weight: 800; }
.po-btn.primary:hover:not(:disabled) { background: var(--po-accent-hover); }
.po-btn.primary:disabled { background: var(--po-line); color: var(--po-dim); cursor: not-allowed; }

.po-printwrap { display: flex; gap: 6px; min-width: 0; }
.po-select { flex: 1.3; min-width: 0; background: var(--po-bg); border: 1px solid var(--po-line2); border-radius: 8px; padding: 0 8px; color: var(--po-text2); font-size: 11px; font-weight: 600; font-family: inherit; color-scheme: var(--po-scheme); cursor: pointer; }
.po-select:focus { border-color: var(--po-accent); outline: none; }
.po-btn:disabled { opacity: .45; cursor: not-allowed; }

.po-inputrow { display: flex; gap: 6px; align-items: stretch; }
.po-inputrow .po-input { flex: 1; min-width: 0; }
.po-newpo { flex: 0 0 auto; white-space: nowrap; border-radius: 8px; padding: 0 12px; }
.po-saved { margin-bottom: 14px; overflow: hidden; }
.po-saved-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 20px; background: none; border: none; color: var(--po-text2); font-size: 12px; font-weight: 700; cursor: pointer; }
.po-saved-toggle:hover { background: var(--po-hover); }
.po-saved-count { font-size: 10px; font-weight: 800; color: var(--po-on-accent); background: var(--po-accent); border-radius: 999px; padding: 1px 8px; margin-left: 8px; }
.po-saved-list { max-height: 360px; overflow-y: auto; border-top: 1px solid var(--po-line); }
.po-saved-empty { padding: 28px 20px; text-align: center; color: var(--po-dim); font-size: 12px; }
.po-saved-row { display: flex; align-items: center; gap: 12px; padding: 11px 20px; border-bottom: 1px solid var(--po-bg); }
.po-saved-row:last-child { border-bottom: none; }
.po-saved-row:hover { background: var(--po-hover); }
.po-saved-row.current { box-shadow: inset 3px 0 0 var(--po-accent); }
.po-saved-main { flex: 1; min-width: 0; }
.po-saved-po { font-size: 12px; font-weight: 800; color: var(--po-text); font-family: ui-monospace, monospace; letter-spacing: .03em; }
.po-saved-cust { font-size: 12px; color: var(--po-text3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.po-saved-meta { font-size: 10px; color: var(--po-dim); margin-top: 2px; }
.po-saved-amt { font-size: 13px; font-weight: 800; color: var(--po-accent); text-align: right; white-space: nowrap; }
.po-saved-btns { display: flex; gap: 6px; }
.po-mini-btn { padding: 6px 12px; border-radius: 6px; border: 1px solid var(--po-line2); background: none; color: var(--po-text2); font-size: 11px; font-weight: 700; cursor: pointer; transition: all .15s; }
.po-mini-btn:hover { border-color: var(--po-accent); color: var(--po-accent); }
.po-mini-btn.del:hover { border-color: var(--po-redline); color: var(--po-red); }

@media (max-width: 820px) {
  .po-saved-row { flex-wrap: wrap; }
  .po-saved-btns { width: 100%; }
  .po-main { padding: 16px 12px 260px; }
  .po-grid3 { grid-template-columns: 1fr; }
  .po-stats { grid-template-columns: repeat(3, 1fr); }
  .po-stat { border-bottom: 1px solid var(--po-surface); }
  .po-table { overflow-x: auto; }
  .po-row { min-width: 800px; }
  .po-actions { grid-template-columns: 1fr 1fr; }
  .po-printwrap { grid-column: 1 / -1; }
}
@media (prefers-reduced-motion: reduce) { .po-screen * { transition: none !important; animation: none !important; } }
`;

// ── Standalone print document (rendered in an isolated iframe) ──────────────

const cssStr = (v) =>
  String(v ?? "")
    .replace(/[\\"]/g, "\\$&")
    .replace(/[\r\n]+/g, " ");

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];
const twoDigits = (x) =>
  x < 20
    ? ONES[x]
    : TENS[Math.floor(x / 10)] + (x % 10 ? ` ${ONES[x % 10]}` : "");
const threeDigits = (x) =>
  (x >= 100
    ? `${ONES[Math.floor(x / 100)]} Hundred${x % 100 ? " " : ""}`
    : "") + (x % 100 ? twoDigits(x % 100) : "");

// 125000.50 → "Rupees One Lakh Twenty Five Thousand and Fifty Paise Only"
function inrWords(amount) {
  const total = Math.round((Number(amount) || 0) * 100);
  let rupees = Math.floor(total / 100);
  const paise = total % 100;
  const parts = [];
  const crore = Math.floor(rupees / 10000000);
  rupees %= 10000000;
  const lakh = Math.floor(rupees / 100000);
  rupees %= 100000;
  const thousand = Math.floor(rupees / 1000);
  rupees %= 1000;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (rupees) parts.push(threeDigits(rupees));
  const main = parts.length ? parts.join(" ") : paise ? "" : "Zero";
  const paisePart = paise ? `${twoDigits(paise)} Paise` : "";
  return `Rupees ${[main, paisePart].filter(Boolean).join(" and ")} Only`;
}

const DOC_CSS = `
@page {
  size: A4 portrait;
  margin: 14mm 14mm 16mm;
  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font: 7pt Arial, Helvetica, sans-serif;
    color: #555;
  }
}
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; background: #fff; }
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 9.5pt;
  line-height: 1.4;
  color: #000;
  font-variant-numeric: tabular-nums;
}

/* Heading */
.doc-head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 18pt; padding-bottom: 9pt; border-bottom: 1.5pt solid #000;
}
.brand { flex: 1; min-width: 0; }
.brand-name { max-width: 340pt; color: #000; font-weight: 700; line-height: 1.15; overflow-wrap: anywhere; }
.doc-title { flex: 0 0 auto; text-align: right; }
.doc-kind {
  display: inline-block; padding: 3pt 9pt; border: 1.2pt solid #000;
  font-size: 10pt; font-weight: 700; letter-spacing: 1.5pt; text-transform: uppercase;
}
.doc-no { margin-top: 7pt; font-size: 9.5pt; font-weight: 700; }
.doc-date { margin-top: 2pt; font-size: 9.5pt; font-weight: 700; }
.rule { height: 12pt; }

/* Items */
.items { width: 100%; border-collapse: collapse; table-layout: fixed; border: .8pt solid #000; }
.items thead { display: table-header-group; }
.items thead th {
  padding: 6pt 5pt; background: #e9e9e9; color: #000;
  font-size: 8pt; font-weight: 700; text-transform: uppercase; text-align: left;
  border: .8pt solid #000; white-space: nowrap;
}
.items thead th.c { text-align: center; }
.items thead th.r { text-align: right; }
.items td { padding: 6pt 5pt; border: .8pt solid #000; vertical-align: middle; font-size: 9pt; overflow-wrap: anywhere; }
.items tbody tr { page-break-inside: avoid; }
.items td.n { text-align: center; }
.items td.code { font-size: 8.5pt; }
.pn { font-weight: 700; }
.items td.qty { text-align: center; white-space: nowrap; }
.items td.rate, .items td.amt { text-align: right; white-space: nowrap; }
.items tfoot td {
  padding: 6pt 5pt; border: .8pt solid #000; background: #f3f3f3;
  font-size: 8.5pt; font-weight: 700; white-space: nowrap;
}
.items tfoot td.lbl { text-align: right; letter-spacing: .5pt; }
.items tfoot td.v.qty { text-align: center; }
.items tfoot td.v.amt { text-align: right; }

/* Totals */
.summary { display: flex; justify-content: space-between; align-items: flex-start; gap: 16pt; margin-top: 12pt; page-break-inside: avoid; }
.k { margin-bottom: 3pt; font-size: 7.5pt; font-weight: 700; letter-spacing: .8pt; text-transform: uppercase; }
.words { flex: 1; max-width: 250pt; padding: 7pt 9pt; border: .8pt solid #000; }
.words .t { font-size: 9pt; font-weight: 700; line-height: 1.45; }
.note { margin-top: 7pt; font-size: 7pt; color: #444; }
.totals { width: 210pt; border: .8pt solid #000; }
.totals > div { display: flex; justify-content: space-between; align-items: center; gap: 12pt; padding: 5pt 9pt; border-bottom: .8pt solid #000; font-size: 9pt; }
.totals > div:last-child { border-bottom: 0; }
.totals .grand { background: #e9e9e9; font-weight: 700; font-size: 10pt; }
.totals .grand .v { font-size: 11.5pt; }

/* Signature boxes (packing slip) */
.sign { display: flex; justify-content: flex-end; margin-top: 45pt; page-break-inside: avoid; }
.sign > div { width: 165pt; text-align: center; }
.sign .for { margin-bottom: 30pt; font-size: 8pt; }
.sign .line { padding-top: 4pt; border-top: .8pt solid #000; font-size: 8pt; font-weight: 700; }

@media screen { body { max-width: 210mm; margin: 0 auto; } }
@media print {
  body { width: auto; }
  .items { break-inside: auto; }
  .items tr, .summary, .sign { break-inside: avoid; }
}
`;

// ── Print views ─────────────────────────────────────────────────────────────

const PRINT_VIEWS = [
  { id: "standard", label: "Standard" },
  { id: "compact", label: "Compact (More Rows)" },
  { id: "landscape", label: "Landscape (A4)" },
  { id: "large", label: "Large Print" },
  { id: "noprice", label: "Quantity Only (No Prices)" },
  { id: "dispatch", label: "Packing Slip" },
];

const DOC_EXTRA_CSS = `
.chk { display: inline-block; width: 11pt; height: 11pt; border: .9pt solid #000; vertical-align: middle; }
.sign.multi { justify-content: space-between; gap: 20pt; }
.sign.multi > div { width: 150pt; }
`;

const DOC_COMPACT_CSS = `
.rule { height: 8pt; }
.items thead th { padding: 4pt; font-size: 7pt; }
.items td { padding: 3pt 4pt; font-size: 8pt; }
.items tfoot td { padding: 4pt; }
.summary { margin-top: 8pt; }
.totals > div { padding: 3pt 8pt; }
`;

const DOC_LANDSCAPE_CSS = `
@page { size: A4 landscape; margin: 12mm 14mm 14mm; }
`;

const DOC_LARGE_CSS = `
.items thead th { font-size: 9pt; padding: 8pt 6pt; }
.items td { font-size: 10.5pt; padding: 9pt 6pt; }
.items td.code { font-size: 9.5pt; }
.items tfoot td { font-size: 9.5pt; }
.words .t { font-size: 11pt; }
.totals > div { font-size: 10.5pt; }
`;

const VIEW_CSS = {
  compact: DOC_COMPACT_CSS,
  landscape: DOC_LANDSCAPE_CSS,
  large: DOC_LARGE_CSS,
};

const resolveView = (view) =>
  PRINT_VIEWS.some((x) => x.id === view) ? view : "standard";

// Renders the print HTML to a PNG blob (no external libraries).
// HTML → isolated iframe (to measure) → SVG <foreignObject> → canvas → PNG.
function renderOrderPng(fullHtml, landscape) {
  return new Promise((resolve, reject) => {
    const W = landscape ? 1123 : 794; // A4 @ 96dpi
    const SC = 2; // retina-sharp output
    const parsed = new DOMParser().parseFromString(fullHtml, "text/html");
    const css = Array.from(parsed.querySelectorAll("style"))
      .map((el) => el.textContent)
      .join("\n")
      .replace(/@page\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, "");
    const capCss = `body{max-width:none!important;margin:0!important}
.cap{width:${W}px;padding:53px;box-sizing:border-box;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;font-size:9.5pt;line-height:1.4;font-variant-numeric:tabular-nums}`;
    const doc = `<!doctype html><html><head><meta charset="utf-8"><style>${css}\n${capCss}</style></head><body><div class="cap">${parsed.body.innerHTML}</div></body></html>`;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = `position:fixed;left:-99999px;top:0;width:${W}px;height:10px;border:0;visibility:hidden;`;

    iframe.onload = () => {
      try {
        const idoc = iframe.contentDocument;
        const cap = idoc.querySelector(".cap");
        const H = Math.ceil(cap.getBoundingClientRect().height);
        const wrap = idoc.createElement("div");
        wrap.appendChild(idoc.querySelector("style").cloneNode(true));
        wrap.appendChild(cap.cloneNode(true));
        const xhtml = new XMLSerializer().serializeToString(wrap);
        iframe.remove();

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * SC}" height="${H * SC}" viewBox="0 0 ${W} ${H}"><foreignObject x="0" y="0" width="${W}" height="${H}">${xhtml}</foreignObject></svg>`;
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = W * SC;
            canvas.height = H * SC;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(
              (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
              "image/png",
            );
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error("SVG render failed"));
        img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      } catch (e) {
        iframe.remove();
        reject(e);
      }
    };
    iframe.onerror = () => {
      iframe.remove();
      reject(new Error("iframe failed"));
    };
    iframe.srcdoc = doc;
    document.body.appendChild(iframe);
  });
}

// ── Remembered price tier per customer (localStorage) ───────────────────────

const TIER_STORE_KEY = "sf-po-customer-tiers";
const custKey = (name) =>
  String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
const loadTierMap = () => {
  try {
    const o = JSON.parse(localStorage.getItem(TIER_STORE_KEY) || "{}");
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
};
const saveTierMap = (m) => {
  try {
    localStorage.setItem(TIER_STORE_KEY, JSON.stringify(m));
  } catch {
    /* storage unavailable — tier just won't persist */
  }
};

// ── Remembered PO number (localStorage) ─────────────────────────────────────

const PO_STORE_KEY = "sf-po-last-po-number";
const loadPoNumber = () => {
  try {
    const v = localStorage.getItem(PO_STORE_KEY);
    return v && v.trim() ? v : DEFAULT_PO_NUMBER;
  } catch {
    return DEFAULT_PO_NUMBER;
  }
};
const savePoNumber = (v) => {
  try {
    localStorage.setItem(PO_STORE_KEY, v);
  } catch {
    /* storage unavailable — PO number just won't persist */
  }
};

// ── Saved orders (localStorage), keyed by PO number ─────────────────────────

const SAVED_KEY = "sf-po-saved-orders";
const poKey = (v) =>
  String(v ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
// Next PO number in the same format, e.g. SNI/001/26-27 → SNI/002/26-27.
// Looks at the current number and every saved PO, and never returns one already saved.
function nextPoNumber(current, savedMap) {
  const m =
    String(current ?? "")
      .trim()
      .match(/^(.*?)(\d+)(\/[^/]*)$/) ||
    String(current ?? "")
      .trim()
      .match(/^(.*?)(\d+)(\D*)$/);
  if (!m) return DEFAULT_PO_NUMBER;
  const [, prefix, digits, suffix] = m;
  const width = digits.length;
  const same = (po) => {
    const x =
      String(po ?? "")
        .trim()
        .match(/^(.*?)(\d+)(\/[^/]*)$/) ||
      String(po ?? "")
        .trim()
        .match(/^(.*?)(\d+)(\D*)$/);
    return x && poKey(x[1]) === poKey(prefix) && poKey(x[3]) === poKey(suffix)
      ? parseInt(x[2], 10)
      : 0;
  };
  let seq = Math.max(
    parseInt(digits, 10),
    ...Object.values(savedMap || {}).map((r) => same(r.poNumber)),
  );
  let next;
  do {
    seq += 1;
    next = `${prefix}${String(seq).padStart(width, "0")}${suffix}`;
  } while (savedMap && savedMap[poKey(next)]);
  return next;
}

const loadSavedOrders = () => {
  try {
    const o = JSON.parse(localStorage.getItem(SAVED_KEY) || "{}");
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
};
const persistSavedOrders = (m) => {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(m));
    return true;
  } catch {
    return false;
  }
};

// ── Remembered customer names (localStorage) ────────────────────────────────

const CUST_LIST_KEY = "sf-po-customers";
const loadCustomerList = () => {
  try {
    const raw = localStorage.getItem(CUST_LIST_KEY);
    if (raw !== null) {
      const arr = JSON.parse(raw);
      return Array.isArray(arr)
        ? arr.filter((x) => typeof x === "string" && x.trim())
        : [];
    }
    // first run: seed from customers of already-saved POs
    const seen = new Set();
    const out = [];
    Object.values(loadSavedOrders()).forEach((r) => {
      const n = String(r?.customerName ?? "").trim();
      if (n && !seen.has(custKey(n))) {
        seen.add(custKey(n));
        out.push(n);
      }
    });
    return out;
  } catch {
    return [];
  }
};
const saveCustomerList = (list) => {
  try {
    localStorage.setItem(CUST_LIST_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — list just won't persist */
  }
};

// ── Saved price list (localStorage) — survives page refresh ─────────────────

const PRICELIST_KEY = "sf-po-price-list";
const DEFAULT_UPLOAD_LABEL = "Upload price list (.xlsx / .csv)";
const loadPriceList = () => {
  try {
    const o = JSON.parse(localStorage.getItem(PRICELIST_KEY) || "null");
    return o && Array.isArray(o.products) && o.products.length > 0 ? o : null;
  } catch {
    return null;
  }
};
const savePriceList = (products, label) => {
  try {
    localStorage.setItem(
      PRICELIST_KEY,
      JSON.stringify({ products, label, savedAt: new Date().toISOString() }),
    );
    return true;
  } catch {
    return false; // storage full or unavailable
  }
};
const clearPriceList = () => {
  try {
    localStorage.removeItem(PRICELIST_KEY);
  } catch {
    /* ignore */
  }
};

// ── Component ───────────────────────────────────────────────────────────────

function SFDyesPurchaseOrderInner() {
  const [poNumber, setPoNumber] = useState(loadPoNumber);
  const [date, setDate] = useState(todayISO);
  const [customerName, setCustomerName] = useState("");
  const [priceTier, setPriceTier] = useState("DP7");
  const [printView, setPrintView] = useState("standard");
  const [copyMsg, setCopyMsg] = useState("");
  const [savedOrders, setSavedOrders] = useState(loadSavedOrders);
  const [lastSavedKey, setLastSavedKey] = useState("");
  const [showSaved, setShowSaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [initialPriceList] = useState(loadPriceList);
  const [products, setProducts] = useState(
    () => initialPriceList?.products || [],
  );
  const [uploadLabel, setUploadLabel] = useState(
    () => initialPriceList?.label || DEFAULT_UPLOAD_LABEL,
  );
  const [uploadedFile, setUploadedFile] = useState(Boolean(initialPriceList));
  const [uploadStatus, setUploadStatus] = useState(null);
  const [customers, setCustomers] = useState(loadCustomerList);
  const [showCust, setShowCust] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [editPkgId, setEditPkgId] = useState(null);
  const [pkgDraft, setPkgDraft] = useState("");
  const [pkgDefaults, setPkgDefaults] = useState(() => ({
    ...Object.fromEntries(PKG_DEFAULTS_CONFIG.map((c) => [c.key, c.defaultKg])),
    [OTHER_KEY]: 12,
  }));

  const fileInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const custWrapRef = useRef(null);
  const statusTimer = useRef(null);
  const copyTimer = useRef(null);
  const tierMapRef = useRef(null);
  if (tierMapRef.current === null) tierMapRef.current = loadTierMap();

  // Inject styles once; remove on unmount
  useEffect(() => {
    document.getElementById("sf-po-styles")?.remove();
    const style = document.createElement("style");
    style.id = "sf-po-styles";
    style.textContent = SCREEN_CSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Remember the last-used PO number
  useEffect(() => {
    if (poNumber.trim()) savePoNumber(poNumber);
  }, [poNumber]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target))
        setShowSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(
    () => () => {
      clearTimeout(statusTimer.current);
      clearTimeout(copyTimer.current);
    },
    [],
  );

  // Esc closes the confirm dialog
  useEffect(() => {
    if (!confirmDialog) return;
    const onKey = (e) => {
      if (e.key === "Escape") setConfirmDialog(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmDialog]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (custWrapRef.current && !custWrapRef.current.contains(e.target))
        setShowCust(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Remember customer names for the dropdown
  const addCustomer = (name) => {
    const n = String(name ?? "").trim();
    if (!n) return;
    setCustomers((prev) => {
      if (prev.some((c) => custKey(c) === custKey(n))) return prev;
      const next = [n, ...prev].slice(0, 300);
      saveCustomerList(next);
      return next;
    });
  };
  const removeCustomer = (name) =>
    setCustomers((prev) => {
      const next = prev.filter((c) => custKey(c) !== custKey(name));
      saveCustomerList(next);
      return next;
    });
  const custOptions = useMemo(() => {
    const q = custKey(customerName);
    const list = customers
      .filter((n) => !q || custKey(n).includes(q))
      .sort((a, b) => a.localeCompare(b));
    // hide the list when the typed text already is the only match
    return list.length === 1 && custKey(list[0]) === q ? [] : list;
  }, [customers, customerName]);

  // Remember the price tier per customer
  const rememberTier = (tier = priceTier, name = customerName) => {
    const k = custKey(name);
    if (!k || tierMapRef.current[k] === tier) return;
    tierMapRef.current = { ...tierMapRef.current, [k]: tier };
    saveTierMap(tierMapRef.current);
  };
  const chooseTier = (t) => {
    setPriceTier(t);
    rememberTier(t);
  };
  // When a known customer is entered, restore their last-used tier
  useEffect(() => {
    const t = tierMapRef.current[custKey(customerName)];
    if (t && PRICE_TIERS.includes(t)) setPriceTier(t);
  }, [customerName]);
  const savedTier = tierMapRef.current[custKey(customerName)];

  // PO number already saved? (checked live on every render / keystroke)
  const existingSaved = savedOrders[poKey(poNumber)];
  const poStatus = !poKey(poNumber)
    ? null
    : poKey(poNumber) === lastSavedKey
      ? { type: "ok", msg: "✓ Order saved" }
      : existingSaved
        ? {
            type: "warn",
            msg: `⚠ This PO number is already saved (${formatDate(existingSaved.date)}${
              existingSaved.customerName
                ? ` · ${existingSaved.customerName}`
                : ""
            }). Saving will replace it.`,
          }
        : null;

  // Saved POs, newest first
  const savedList = useMemo(
    () =>
      Object.entries(savedOrders)
        .map(([key, rec]) => ({ key, ...rec }))
        .sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt))),
    [savedOrders],
  );

  // ── Derived data ──────────────────────────────────────────────────────────

  const getDefaultPkg = useCallback(
    (product) => {
      const cat = detectCategory(product.name, product.category || "");
      return (cat && pkgDefaults[cat]) || pkgDefaults[OTHER_KEY] || 12;
    },
    [pkgDefaults],
  );

  const getPrice = (item) => item.prices?.[priceTier] ?? 0;
  const getTotal = (item) => (parseFloat(item.qty) || 0) * getPrice(item);
  const pkgCountOf = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const pkg = parseFloat(item.pkgSize) || 1;
    return roundPkg(qty / pkg);
  };

  // Qty validation is derived from items, so it can never go stale
  const qtyErrors = useMemo(() => {
    const out = {};
    orderItems.forEach((i) => {
      if (!isExactMultiple(i.qty, i.pkgSize)) {
        const down = snapDown(i.qty, i.pkgSize);
        out[i._id] = {
          pkgKg: i.pkgSize,
          nearDown: down > 0 ? down : null,
          nearUp: snapUp(i.qty, i.pkgSize),
        };
      }
    });
    return out;
  }, [orderItems]);

  const errorCount = Object.keys(qtyErrors).length;
  const hasEmptyQty = orderItems.some((i) => !(parseFloat(i.qty) > 0));
  const canExport = orderItems.length > 0 && errorCount === 0 && !hasEmptyQty;

  const totalItems = orderItems.length;
  const totalQty = orderItems.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
  const totalPkgs = orderItems.reduce((s, i) => s + pkgCountOf(i), 0);
  const orderValue = orderItems.reduce((s, i) => s + getTotal(i), 0);
  const gstAmount = Math.round(orderValue * GST_RATE * 100) / 100;
  const grandTotal = orderValue + gstAmount;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.code && p.code.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)),
      )
      .slice(0, MAX_SEARCH_RESULTS);
  }, [products, searchQuery]);

  // ── File upload ───────────────────────────────────────────────────────────

  const flashStatus = (status, ms) => {
    clearTimeout(statusTimer.current);
    setUploadStatus(status);
    if (ms) statusTimer.current = setTimeout(() => setUploadStatus(null), ms);
  };

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      flashStatus({
        type: "error",
        msg: `File is larger than ${MAX_UPLOAD_MB} MB.`,
      });
      return;
    }
    flashStatus({ type: "loading", msg: `Reading ${file.name}…` });
    try {
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const merged = new Map();
      const sheetsUsed = [];

      wb.SheetNames.forEach((sheetName) => {
        const rawRows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
          header: 1,
          defval: "",
          blankrows: false,
        });
        if (!rawRows.length) return;
        const headerRowIdx = detectHeaderRowIndex(rawRows);
        if (headerRowIdx === -1) return;

        const headerRow = rawRows[headerRowIdx].map(
          (h, i) => String(h ?? "").trim() || `Col${i + 1}`,
        );
        const rows = rawRows
          .slice(headerRowIdx + 1)
          .filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
        if (!rows.length) return;

        const codeCol = findCol(headerRow, ["code", "productcode", "sku"]);
        const nameCol = findCol(headerRow, [
          "name",
          "productname",
          "itemname",
          "description",
          "product",
        ]);
        const catCol = findCol(headerRow, ["category", "cat", "type", "group"]);
        const tierCols = {};
        PRICE_TIERS.forEach((t) => {
          const found = headerRow.find((c) => normalize(c) === normalize(t));
          if (found) tierCols[t] = found;
        });
        if (!nameCol && !codeCol) return;

        const tierKeys = Object.keys(tierCols);
        let sheetHadRows = false;

        rows.forEach((r) => {
          const row = {};
          headerRow.forEach((h, i) => {
            row[h] = r[i] ?? "";
          });
          const name = nameCol ? String(row[nameCol] ?? "").trim() : "";
          if (!name) return;

          const allPricesBlank =
            tierKeys.length > 0 &&
            tierKeys.every((t) => String(row[tierCols[t]] ?? "").trim() === "");
          const code = codeCol ? String(row[codeCol] ?? "").trim() : "";
          if (allPricesBlank && !code) return;

          const category = catCol
            ? String(row[catCol] ?? "").trim() || "General"
            : "General";
          const prices = Object.fromEntries(
            PRICE_TIERS.map((t) => [
              t,
              tierCols[t]
                ? parseFloat(String(row[tierCols[t]]).replace(/,/g, "")) || 0
                : 0,
            ]),
          );

          sheetHadRows = true;
          const key = name.toUpperCase();
          const existing = merged.get(key);
          if (!existing) {
            merged.set(key, {
              code,
              name,
              category,
              prices,
              _id: `imp_${merged.size}`,
            });
          } else {
            if (code) existing.code = code;
            if (category !== "General") existing.category = category;
            PRICE_TIERS.forEach((t) => {
              if (prices[t] > 0) existing.prices[t] = prices[t];
            });
          }
        });

        if (sheetHadRows) sheetsUsed.push(sheetName);
      });

      if (merged.size === 0)
        throw new Error(
          "No recognizable price data found. Expected columns: Code, Name, DP7, DP45, RSP.",
        );

      const parsed = Array.from(merged.values());
      setProducts(parsed);
      setOrderItems([]);
      setUploadedFile(true);
      const label = `${parsed.length} products · ${file.name}`;
      setUploadLabel(label);
      const persisted = savePriceList(parsed, label);
      const note =
        sheetsUsed.length > 1
          ? ` (merged from ${sheetsUsed.length} sheets: ${sheetsUsed.join(", ")})`
          : "";
      flashStatus(
        {
          type: "success",
          msg: `${parsed.length} products loaded from ${file.name}${note}${
            persisted
              ? ""
              : " — could not be saved, you will need to upload again after refresh"
          }`,
        },
        5000,
      );
    } catch (err) {
      flashStatus({
        type: "error",
        msg: err?.message || "Could not read this file.",
      });
    }
  }, []);

  // Confirmation dialog (replaces window.confirm)
  const askConfirm = ({ title, msg, yesLabel = "Confirm", onYes }) =>
    setConfirmDialog({ title, msg, yesLabel, onYes });
  const dismissConfirm = () => setConfirmDialog(null);

  // Remove the uploaded price list (state + localStorage)
  const doClearPriceList = () => {
    clearPriceList(); // remove from localStorage
    setProducts([]);
    setUploadedFile(false);
    setUploadLabel(DEFAULT_UPLOAD_LABEL);
    setSearchQuery("");
    setShowSearch(false);
    flashStatus({ type: "success", msg: "Price list cleared" }, 3000);
  };
  const handleClearPriceList = () =>
    askConfirm({
      title: "Clear price list?",
      msg: "The uploaded price list will be removed from this device. Items already in your order will stay, but you won't be able to search for new products until you upload a price list again.",
      yesLabel: "Yes, clear it",
      onYes: doClearPriceList,
    });

  // ── Order mutations ───────────────────────────────────────────────────────

  const addItem = (product) => {
    const defPkg = getDefaultPkg(product);
    setOrderItems((prev) => {
      const exists = prev.some((i) => i._id === product._id);
      if (exists)
        return prev.map((i) =>
          i._id === product._id
            ? {
                ...i,
                qty: round4(
                  (parseFloat(i.qty) || 0) + (parseFloat(i.pkgSize) || defPkg),
                ),
              }
            : i,
        );
      return [...prev, { ...product, qty: defPkg, pkgSize: defPkg }];
    });
    setSearchQuery("");
    setShowSearch(false);
  };

  const removeItem = (id) =>
    setOrderItems((prev) => prev.filter((i) => i._id !== id));

  const updateQty = (id, value) =>
    setOrderItems((prev) =>
      prev.map((i) => (i._id === id ? { ...i, qty: value } : i)),
    );

  // Changing the pkg size keeps the package count, so qty (kg) follows it
  const updatePkgSize = (id, value) => {
    const n = parseFloat(value);
    if (!(n > 0)) return;
    setOrderItems((prev) =>
      prev.map((i) => {
        if (i._id !== id) return i;
        const oldPkg = parseFloat(i.pkgSize) || n;
        const q = parseFloat(i.qty);
        const count = q > 0 ? Math.max(1, Math.round(q / oldPkg)) : 0;
        return {
          ...i,
          pkgSize: n,
          qty: count ? round4(count * n) : i.qty,
        };
      }),
    );
  };

  const startEditPkg = (item) => {
    setEditPkgId(item._id);
    setPkgDraft(String(item.pkgSize));
  };
  const commitEditPkg = (id) => {
    updatePkgSize(id, pkgDraft);
    setEditPkgId(null);
  };

  // Type number of packages → qty (kg) = packages × pkg size
  const updatePkgCount = (id, value) =>
    setOrderItems((prev) =>
      prev.map((i) => {
        if (i._id !== id) return i;
        if (value === "") return { ...i, qty: "" };
        const n = parseInt(value, 10);
        if (!(n >= 0)) return i;
        return { ...i, qty: round4(n * (parseFloat(i.pkgSize) || 1)) };
      }),
    );

  const updatePkgDefault = (key, value) => {
    const n = parseFloat(value);
    if (!(n > 0)) return;
    setPkgDefaults((prev) => ({ ...prev, [key]: n }));
  };

  const clearOrder = () => {
    if (
      orderItems.length > 0 &&
      !window.confirm("Clear all items from this order?")
    )
      return;
    setOrderItems([]);
    setCustomerName("");
    setDate(todayISO());
    setLastSavedKey("");
  };

  // ── New PO number ─────────────────────────────────────────────────────────

  const generateNewPo = () => {
    const next = nextPoNumber(poNumber, loadSavedOrders());
    setPoNumber(next);
    setLastSavedKey("");
    showCopyMsg(`New PO number: ${next}`);
  };

  // ── Save order ────────────────────────────────────────────────────────────

  const saveOrder = () => {
    if (!canExport) return;
    const key = poKey(poNumber);
    if (!key) {
      window.alert("PO Number is empty.");
      return;
    }
    // fresh read, in case another tab saved the same PO
    const current = loadSavedOrders();
    const prev = current[key];
    if (
      prev &&
      !window.confirm(
        `PO "${poNumber.trim()}" is already saved (${formatDate(prev.date)}${
          prev.customerName ? `, ${prev.customerName}` : ""
        }).\n\nDo you want to replace it?`,
      )
    )
      return;

    rememberTier();
    addCustomer(customerName);
    const record = {
      poNumber: poNumber.trim(),
      date,
      customerName: customerName.trim(),
      priceTier,
      items: orderItems,
      totals: {
        items: totalItems,
        qty: totalQty,
        packages: roundPkg(totalPkgs),
        subtotal: orderValue,
        gst: gstAmount,
        grandTotal,
      },
      savedAt: new Date().toISOString(),
    };
    const next = { ...current, [key]: record };
    if (!persistSavedOrders(next)) {
      window.alert("Could not save — browser storage is not available.");
      return;
    }
    setSavedOrders(next);
    setLastSavedKey(key);
    showCopyMsg(prev ? "✓ Order replaced and saved" : "✓ Order saved");
  };

  // Load a saved PO back into the editor
  const loadSavedOrder = (key) => {
    const rec = savedOrders[key];
    if (!rec) return;
    if (
      orderItems.length > 0 &&
      !window.confirm(
        "The current order will be replaced and unsaved changes will be lost. Continue?",
      )
    )
      return;
    // keep the remembered tier in sync so the customer effect doesn't override it
    rememberTier(rec.priceTier, rec.customerName);
    setPoNumber(rec.poNumber);
    setDate(rec.date);
    setCustomerName(rec.customerName || "");
    setPriceTier(rec.priceTier);
    setOrderItems(Array.isArray(rec.items) ? rec.items : []);
    setLastSavedKey(key);
    setShowSaved(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showCopyMsg(`✓ PO ${rec.poNumber} loaded`);
  };

  const deleteSavedOrder = (key) => {
    const rec = savedOrders[key];
    if (!rec) return;
    if (!window.confirm(`Delete saved PO "${rec.poNumber}"?`)) return;
    const next = { ...loadSavedOrders() };
    delete next[key];
    if (!persistSavedOrders(next)) {
      window.alert("Could not delete — browser storage is not available.");
      return;
    }
    setSavedOrders(next);
    if (lastSavedKey === key) setLastSavedKey("");
    showCopyMsg("✓ Saved PO deleted");
  };

  // ── Print (isolated iframe so host-app CSS can't affect the output) ───────

  const orderReady = () => {
    if (orderItems.length === 0) {
      window.alert("The order has no items.");
      return false;
    }
    if (
      !customerName.trim() &&
      !window.confirm("Customer / Firm name is empty. Continue anyway?")
    )
      return false;
    return true;
  };

  const buildPrintHtml = (v) => {
    const priced = v !== "noprice" && v !== "dispatch";

    // Column library
    const col = {
      n: {
        w: "28pt",
        th: "#",
        c: "c",
        td: (it, i) => `<td class="n">${i + 1}</td>`,
      },
      code: {
        w: "58pt",
        th: "Code",
        c: "",
        td: (it) => `<td class="code">${esc(it.code || "—")}</td>`,
      },
      name: {
        w: "",
        th: "Product Name",
        c: "",
        td: (it) => `<td><div class="pn">${esc(it.name)}</div></td>`,
      },
      rate: {
        w: "62pt",
        th: "Rate",
        c: "r",
        td: (it) => `<td class="rate">₹ ${fmtMoney2(getPrice(it))}</td>`,
      },
      pkg: {
        w: "52pt",
        th: "Pkg Size",
        c: "c",
        td: (it) => `<td class="qty">${esc(it.pkgSize ?? "—")}</td>`,
      },
      npk: {
        w: "52pt",
        th: "Packages",
        c: "c",
        td: (it) => `<td class="qty">${pkgCountOf(it)}</td>`,
      },
      qty: {
        w: "66pt",
        th: "Qty (kg)",
        c: "c",
        td: (it) => `<td class="qty">${fmtQty(it.qty)} KG</td>`,
      },
      amt: {
        w: "76pt",
        th: "Amount",
        c: "r",
        td: (it) => `<td class="amt">₹ ${fmtMoney2(getTotal(it))}</td>`,
      },
      chk: {
        w: "48pt",
        th: "Packed",
        c: "c",
        td: () => `<td class="qty"><span class="chk"></span></td>`,
      },
    };
    const layout = priced
      ? ["n", "code", "name", "rate", "pkg", "qty", "amt"]
      : v === "dispatch"
        ? ["n", "code", "name", "pkg", "npk", "qty", "chk"]
        : ["n", "code", "name", "pkg", "npk", "qty"];
    const cols = layout.map((k) => ({ k, ...col[k] }));

    const colgroup = `<colgroup>${cols
      .map((c) => `<col${c.w ? ` style="width:${c.w}"` : ""}>`)
      .join("")}</colgroup>`;
    const thead = `<tr>${cols
      .map((c) => `<th${c.c ? ` class="${c.c}"` : ""}>${c.th}</th>`)
      .join("")}</tr>`;
    const rows = orderItems
      .map(
        (item, idx) => `<tr>${cols.map((c) => c.td(item, idx)).join("")}</tr>`,
      )
      .join("");

    const labelSpan = cols.findIndex((c) => c.k === "npk" || c.k === "qty");
    const footCells = cols
      .slice(labelSpan)
      .map((c) =>
        c.k === "npk"
          ? `<td class="v qty">${roundPkg(totalPkgs)}</td>`
          : c.k === "qty"
            ? `<td class="v qty">${fmtQty(totalQty)} KG</td>`
            : c.k === "amt"
              ? `<td class="v amt">₹ ${fmtMoney2(orderValue)}</td>`
              : "<td></td>",
      )
      .join("");
    const foot = `<tfoot><tr><td class="lbl" colspan="${labelSpan}">TOTAL</td>${footCells}</tr></tfoot>`;

    const gstPct = Math.round(GST_RATE * 100);
    const summary = priced
      ? `<section class="summary">
      <div class="words">
        <div class="k">Amount in words</div>
        <div class="t">${esc(inrWords(grandTotal))}</div>
        <div class="note">Rates are per kg. GST @ ${gstPct}% is included in the grand total.</div>
      </div>
      <div class="totals">
        <div><span class="l">Subtotal</span><span>₹ ${fmtMoney2(orderValue)}</span></div>
        <div><span class="l">GST @ ${gstPct}%</span><span>₹ ${fmtMoney2(gstAmount)}</span></div>
        <div class="grand"><span class="l">Grand total</span><span class="v">₹ ${fmtMoney2(grandTotal)}</span></div>
      </div>
    </section>`
      : "";

    const sigBox = (title, forLine) =>
      `<div><div class="for">${forLine || "&nbsp;"}</div><div class="line">${title}</div></div>`;
    const sign =
      v === "dispatch"
        ? `<section class="sign multi">${sigBox("Packed By")}${sigBox("Checked By")}</section>`
        : "";

    const custName = customerName.trim();
    const baseSize =
      custName.length > 40
        ? 15
        : custName.length > 26
          ? 20
          : custName.length > 18
            ? 26
            : 30;
    const nameSize =
      Math.round(
        baseSize * (v === "compact" ? 0.8 : v === "large" ? 1.15 : 1) * 10,
      ) / 10;
    const docKind = v === "dispatch" ? "Packing Slip" : "Purchase Order";
    const safePoNumber = esc(poNumber || "Purchase Order");
    const safeTitle = cssStr(poNumber || "Purchase Order");
    const extraCss = DOC_EXTRA_CSS + (VIEW_CSS[v] || "");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safePoNumber}</title>
  <style>${DOC_CSS}</style>
  <style>${extraCss}</style>
  <style>
    @page {
      @bottom-left {
        content: "Sainath Industries  ·  ${safeTitle}";
        font: 7pt Arial, Helvetica, sans-serif;
        color: #9a9384;
      }
    }
  </style>
</head>
<body>
  <header class="doc-head">
    <div class="brand">
      <div class="brand-text">
        <div class="brand-name" style="font-size:${nameSize}pt">${esc(custName || "—")}</div>
      </div>
    </div>
    <div class="doc-title">
      <div class="doc-kind">${docKind}</div>
      <div class="doc-no">PO No.: ${safePoNumber}</div>
      <div class="doc-date">Date: ${esc(formatDate(date))}</div>
    </div>
  </header>
  <div class="rule"></div>

  <table class="items">
    ${colgroup}
    <thead>${thead}</thead>
    <tbody>${rows}</tbody>
    ${foot}
  </table>

  ${summary}
  ${sign}
</body>
</html>`;

    return html;
  };

  const printOrder = (view = "standard") => {
    const v = resolveView(view);
    if (!orderReady()) return;
    rememberTier();
    addCustomer(customerName);
    const html = buildPrintHtml(v);

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("title", "Purchase order print preview");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";

    const prevTitle = document.title;
    let cleaned = false;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      document.title = prevTitle;
      iframe.remove();
    };

    iframe.onload = async () => {
      if (cleaned) return;
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        return;
      }
      try {
        if (win.document.fonts?.ready) {
          await Promise.race([
            win.document.fonts.ready,
            new Promise((resolve) => setTimeout(resolve, 2000)),
          ]);
        }
        if (cleaned || !iframe.isConnected) return;

        document.title = poNumber || "Purchase Order";
        win.addEventListener("afterprint", cleanup, { once: true });
        win.focus();
        win.print();
        setTimeout(cleanup, 60000);
      } catch (error) {
        console.error("Purchase order printing failed:", error);
        cleanup();
      }
    };

    iframe.onerror = () => {
      console.error("Unable to load purchase order print document.");
      cleanup();
    };

    try {
      iframe.srcdoc = html;
      document.body.appendChild(iframe);
    } catch (error) {
      console.error("Unable to create print document:", error);
      cleanup();
    }
  };

  const showCopyMsg = (msg) => {
    clearTimeout(copyTimer.current);
    setCopyMsg(msg);
    copyTimer.current = setTimeout(() => setCopyMsg(""), 4500);
  };

  // Copies the order as a PNG image (for WhatsApp / email paste)
  const copyOrderImage = async (view = "standard") => {
    const v = resolveView(view);
    if (!orderReady()) return;
    rememberTier();
    addCustomer(customerName);
    showCopyMsg("Creating image…");
    const blobPromise = renderOrderPng(buildPrintHtml(v), v === "landscape");
    blobPromise.catch(() => {}); // handled below
    try {
      if (!navigator.clipboard?.write || !window.ClipboardItem)
        throw new Error("clipboard-unsupported");
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blobPromise }),
      ]);
      showCopyMsg("✓ Image copied — paste it into WhatsApp / Email");
    } catch (err) {
      try {
        const blob = await blobPromise;
        const safeName = (poNumber || "purchase-order").replace(
          /[\\/:*?"<>|]/g,
          "-",
        );
        saveBlob(blob, `${safeName}.png`);
        showCopyMsg(
          "Browser blocked copying, so the image was downloaded instead",
        );
      } catch (e2) {
        console.error("Order image failed:", e2);
        showCopyMsg("Could not create the image. Use Print / Save PDF.");
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const meta = [
    {
      label: "PO Number",
      value: poNumber,
      set: setPoNumber,
      type: "text",
      mono: true,
    },
    { label: "Date", value: date, set: setDate, type: "date" },
    {
      label: "Customer / Firm Name",
      value: customerName,
      set: setCustomerName,
      type: "text",
      ph: "Enter customer or firm name",
      cust: true,
    },
  ];

  const stats = [
    { label: "Products", value: totalItems, color: "var(--po-text2)" },
    {
      label: "Total Weight",
      value: `${fmtQty(totalQty)} kg`,
      color: "var(--po-blue)",
    },
    {
      label: "Packages",
      value: `${roundPkg(totalPkgs)} pkg`,
      color: "var(--po-violet)",
    },
    {
      label: "Subtotal",
      value: `₹${fmtMoney2(orderValue)}`,
      color: "var(--po-text2)",
    },
    {
      label: "GST @ 18%",
      value: `₹${fmtMoney2(gstAmount)}`,
      color: "var(--po-pink)",
    },
    {
      label: "Grand Total",
      value: `₹${fmtMoney2(grandTotal)}`,
      color: "var(--po-accent)",
      large: true,
    },
  ];

  return (
    <div className="po-root">
      <div className="po-screen">
        <main className="po-main">
          {/* Order details */}
          <section className="po-card po-meta">
            <div className="po-eyebrow">Order Details</div>
            <div className="po-grid3">
              {meta.map((f) => (
                <div
                  key={f.label}
                  ref={f.cust ? custWrapRef : undefined}
                  style={{ position: "relative" }}
                >
                  <label className="po-label" htmlFor={`po-${f.label}`}>
                    {f.label}
                  </label>
                  <div className="po-inputrow">
                    <input
                      id={`po-${f.label}`}
                      className={`po-input${f.mono ? " mono" : ""}`}
                      type={f.type}
                      value={f.value}
                      placeholder={f.ph}
                      autoComplete={f.cust ? "off" : undefined}
                      onChange={(e) => {
                        f.set(e.target.value);
                        if (f.cust) setShowCust(true);
                      }}
                      onFocus={f.cust ? () => setShowCust(true) : undefined}
                      onKeyDown={
                        f.cust
                          ? (e) => {
                              if (e.key === "Escape") setShowCust(false);
                            }
                          : undefined
                      }
                    />
                    {f.label === "PO Number" && (
                      <button
                        type="button"
                        className="po-mini-btn po-newpo"
                        title="Generate the next PO number"
                        onClick={generateNewPo}
                      >
                        + New
                      </button>
                    )}
                  </div>
                  {f.cust && showCust && custOptions.length > 0 && (
                    <div className="po-dropdown" role="listbox">
                      <div className="po-dd-head">
                        <span style={{ fontWeight: 600 }}>Saved customers</span>
                        <span>Click to select</span>
                      </div>
                      {custOptions.map((name) => (
                        <div key={name} className="po-cust-row">
                          <button
                            type="button"
                            className="po-dd-item"
                            onClick={() => {
                              setCustomerName(name);
                              setShowCust(false);
                            }}
                          >
                            <div className="po-dd-name">{name}</div>
                          </button>
                          <button
                            type="button"
                            className="po-cust-del"
                            title="Remove from saved list"
                            aria-label={`Remove ${name} from saved customers`}
                            onClick={() => removeCustomer(name)}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {f.label === "PO Number" && poStatus && (
                    <div
                      className="po-hint"
                      role={poStatus.type === "warn" ? "alert" : "status"}
                      style={{
                        color:
                          poStatus.type === "warn"
                            ? "var(--po-red)"
                            : "var(--po-accent)",
                        fontWeight: 700,
                      }}
                    >
                      {poStatus.msg}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Saved POs */}
          <section className="po-card po-saved">
            <button
              type="button"
              className="po-saved-toggle"
              aria-expanded={showSaved}
              onClick={() => setShowSaved((s) => !s)}
            >
              <span>
                📋 Saved POs
                <span className="po-saved-count">{savedList.length}</span>
              </span>
              <span aria-hidden="true">{showSaved ? "▲" : "▼"}</span>
            </button>
            {showSaved && (
              <div className="po-saved-list">
                {savedList.length === 0 ? (
                  <div className="po-saved-empty">
                    No POs saved yet. Build an order and click Save Order.
                  </div>
                ) : (
                  savedList.map((rec) => (
                    <div
                      key={rec.key}
                      className={`po-saved-row${rec.key === poKey(poNumber) ? " current" : ""}`}
                    >
                      <div className="po-saved-main">
                        <div className="po-saved-po">{rec.poNumber}</div>
                        <div className="po-saved-cust">
                          {rec.customerName || "— no customer —"}
                        </div>
                        <div className="po-saved-meta">
                          {formatDate(rec.date)} · {rec.totals?.items ?? 0}{" "}
                          items · {fmtQty(rec.totals?.qty)} kg · {rec.priceTier}
                        </div>
                      </div>
                      <div className="po-saved-amt">
                        ₹{fmtMoney2(rec.totals?.grandTotal || 0)}
                      </div>
                      <div className="po-saved-btns">
                        <button
                          type="button"
                          className="po-mini-btn"
                          onClick={() => loadSavedOrder(rec.key)}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          className="po-mini-btn del"
                          aria-label={`Delete ${rec.poNumber}`}
                          onClick={() => deleteSavedOrder(rec.key)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Controls */}
          <div className="po-grid3 po-controls">
            <div>
              <span className="po-label">Price Tier</span>
              <div className="po-tiers" role="group" aria-label="Price tier">
                {PRICE_TIERS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="po-tier-btn"
                    aria-pressed={priceTier === t}
                    style={{ "--tc": TIER_INFO[t].color }}
                    onClick={() => chooseTier(t)}
                    title={TIER_INFO[t].desc}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="po-hint">
                {TIER_INFO[priceTier].desc}
                {savedTier === priceTier
                  ? " · remembered for this customer ✓"
                  : ""}
              </div>
            </div>

            <div>
              <span className="po-label">Price List</span>
              <button
                type="button"
                className={`po-upload${uploadedFile ? " done" : ""}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <span style={{ fontSize: 14 }}>{uploadedFile ? "✓" : "↑"}</span>
                <span className="t">{uploadLabel}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              {uploadedFile && (
                <div className="po-hint">
                  {products.length} products available ·{" "}
                  <button
                    type="button"
                    className="po-link danger"
                    style={{ marginTop: 0, fontSize: 10 }}
                    onClick={handleClearPriceList}
                  >
                    ✕ Clear file
                  </button>
                </div>
              )}
            </div>

            <div ref={searchWrapRef} className="po-search-wrap">
              <label className="po-label" htmlFor="po-search">
                Search Products
              </label>
              <div style={{ position: "relative" }}>
                <span className="po-search-icon" aria-hidden="true">
                  ⌕
                </span>
                <input
                  id="po-search"
                  className="po-input"
                  style={{ padding: "10px 36px" }}
                  type="text"
                  autoComplete="off"
                  value={searchQuery}
                  disabled={!uploadedFile}
                  placeholder={
                    uploadedFile
                      ? "Name, code or category…"
                      : "Upload a price list first"
                  }
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowSearch(false);
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="po-search-clear"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearch(false);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {showSearch && searchQuery.trim().length > 0 && (
                <div className="po-dropdown">
                  {filteredProducts.length === 0 ? (
                    <div className="po-dd-empty">
                      No products match "{searchQuery}"
                    </div>
                  ) : (
                    <>
                      <div className="po-dd-head">
                        <span style={{ fontWeight: 600 }}>
                          {filteredProducts.length} result
                          {filteredProducts.length !== 1 ? "s" : ""}
                        </span>
                        <span>Click to add</span>
                      </div>
                      {filteredProducts.map((p) => {
                        const inOrder = orderItems.some((i) => i._id === p._id);
                        const cat = detectCategory(p.name, p.category || "");
                        return (
                          <button
                            key={p._id}
                            type="button"
                            className="po-dd-item"
                            onClick={() => addItem(p)}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {p.code && (
                                <div className="po-dd-code">{p.code}</div>
                              )}
                              <div className="po-dd-name">{p.name}</div>
                              <div className="po-dd-tags">
                                {p.category && p.category !== "General" && (
                                  <span>{p.category}</span>
                                )}
                                {cat && (
                                  <span className="po-badge">
                                    {getDefaultPkg(p)}kg
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div className="po-dd-price">
                                ₹
                                {(p.prices[priceTier] || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </div>
                              <div
                                style={{ fontSize: 9, color: "var(--po-dim)" }}
                              >
                                per kg
                              </div>
                              {inOrder && (
                                <div className="po-dd-added">+ added</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Status banner */}
          {uploadStatus && (
            <div className={`po-status ${uploadStatus.type}`} role="status">
              <span>
                {uploadStatus.type === "success"
                  ? "✓"
                  : uploadStatus.type === "error"
                    ? "✗"
                    : "⟳"}
              </span>
              {uploadStatus.msg}
            </div>
          )}

          {/* Package defaults */}
          {uploadedFile && (
            <section className="po-card po-pkg">
              <div
                className="po-eyebrow"
                style={{ marginBottom: 10, fontSize: 9 }}
              >
                Default Package Sizes
              </div>
              <div className="po-pkg-grid">
                {[
                  ...PKG_DEFAULTS_CONFIG,
                  { key: OTHER_KEY, label: "Others" },
                ].map((cfg) => (
                  <div key={cfg.key} className="po-pkg-cell">
                    <span className="po-badge">{cfg.label}</span>
                    <input
                      className="po-mini"
                      type="number"
                      min="1"
                      step="1"
                      aria-label={`${cfg.label} package size in kg`}
                      value={pkgDefaults[cfg.key]}
                      onChange={(e) =>
                        updatePkgDefault(cfg.key, e.target.value)
                      }
                    />
                    <span className="po-unit">kg/pkg</span>
                  </div>
                ))}
              </div>
              <div className="po-hint" style={{ marginTop: 8 }}>
                Auto-detected per product · Defaults apply to newly added items
                · Override per row below
              </div>
            </section>
          )}

          {/* Empty state */}
          {!uploadedFile && orderItems.length === 0 && (
            <div className="po-empty">
              <div className="po-empty-icon">↑</div>
              <div className="po-empty-title">No price list loaded</div>
              <div className="po-empty-sub">
                Upload an .xlsx or .csv file with columns: Code, Name, DP7,
                DP45, RSP
              </div>
              <button
                type="button"
                className="po-link"
                onClick={downloadTemplate}
              >
                ↓ Download template file
              </button>
            </div>
          )}

          {/* Order table */}
          {(uploadedFile || orderItems.length > 0) && (
            <section className="po-card po-table">
              <div className="po-row head">
                {[
                  "#",
                  "Code",
                  "Product Name",
                  "Rate",
                  "Pkg Size × Pkgs",
                  "Qty (kg)",
                  "",
                ].map((h, i) => (
                  <span
                    key={i}
                    className={`po-th ${i === 4 ? "po-c" : i >= 3 ? "po-r" : ""}`}
                    style={i === 4 ? { color: "var(--po-violet)" } : undefined}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {orderItems.length === 0 ? (
                <div style={{ padding: "52px 24px", textAlign: "center" }}>
                  <div
                    className="po-empty-icon"
                    style={{
                      width: 44,
                      height: 44,
                      fontSize: 20,
                      borderRadius: 10,
                      marginBottom: 14,
                    }}
                  >
                    +
                  </div>
                  <div
                    style={{
                      color: "var(--po-dim)",
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    No products added
                  </div>
                  <div
                    style={{
                      color: "var(--po-dim)",
                      opacity: 0.7,
                      fontSize: 11,
                      marginTop: 4,
                    }}
                  >
                    Search a product above to add it to the order
                  </div>
                </div>
              ) : (
                <>
                  {orderItems.map((item, idx) => {
                    const err = qtyErrors[item._id];
                    const emptyQty = !(parseFloat(item.qty) > 0);
                    return (
                      <div key={item._id} className="po-row">
                        <span className="po-idx">{idx + 1}</span>
                        <div className="po-code" title={item.code}>
                          {item.code || "—"}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div className="po-pname" title={item.name}>
                            {item.name}
                          </div>
                          {item.category && item.category !== "General" && (
                            <div className="po-pcat">{item.category}</div>
                          )}
                        </div>

                        <div className="po-r">
                          <div className="po-rate">
                            ₹{getPrice(item).toLocaleString("en-IN")}
                          </div>
                          <div className="po-sub">per kg</div>
                        </div>

                        <div className="po-pkgcell">
                          {editPkgId === item._id ? (
                            <>
                              <input
                                className="po-num pkg"
                                type="number"
                                min="1"
                                step="any"
                                autoFocus
                                title="Package size (kg per package)"
                                aria-label={`Package size for ${item.name}`}
                                value={pkgDraft}
                                onChange={(e) => setPkgDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    commitEditPkg(item._id);
                                  if (e.key === "Escape") setEditPkgId(null);
                                }}
                              />
                              <button
                                type="button"
                                className="po-iconbtn"
                                title="Save package size"
                                aria-label="Save package size"
                                onClick={() => commitEditPkg(item._id)}
                              >
                                ✓
                              </button>
                            </>
                          ) : (
                            <>
                              <span
                                className="po-pkgsize"
                                title="Package size (kg per package)"
                              >
                                {fmtQty(item.pkgSize)} kg
                              </span>
                              <button
                                type="button"
                                className="po-iconbtn"
                                title="Edit package size"
                                aria-label={`Edit package size for ${item.name}`}
                                onClick={() => startEditPkg(item)}
                              >
                                ✎
                              </button>
                            </>
                          )}
                          <span className="po-times">×</span>
                          <input
                            className="po-num cnt"
                            type="number"
                            min="0"
                            step="1"
                            title="Number of packages"
                            aria-label={`Number of packages for ${item.name}`}
                            value={
                              String(item.qty) === "" ? "" : pkgCountOf(item)
                            }
                            onChange={(e) =>
                              updatePkgCount(item._id, e.target.value)
                            }
                          />
                          <span className="po-times">pkg</span>
                        </div>

                        <div
                          className="po-col"
                          style={{ alignItems: "flex-end" }}
                        >
                          <div
                            className="po-qtyval"
                            title="Auto-calculated: packages × pkg size"
                          >
                            {emptyQty ? "—" : `${fmtQty(item.qty)} kg`}
                          </div>
                          {err ? (
                            <div
                              className="po-col"
                              style={{ alignItems: "flex-end", gap: 2 }}
                            >
                              <span className="po-err">
                                Not a multiple of {err.pkgKg} kg
                              </span>
                              <div className="po-snaps">
                                {err.nearDown && (
                                  <button
                                    type="button"
                                    className="po-snap down"
                                    title={`Round down to ${err.nearDown} kg`}
                                    onClick={() =>
                                      updateQty(item._id, err.nearDown)
                                    }
                                  >
                                    ↓ {err.nearDown} kg
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="po-snap up"
                                  title={`Round up to ${err.nearUp} kg`}
                                  onClick={() =>
                                    updateQty(item._id, err.nearUp)
                                  }
                                >
                                  ↑ {err.nearUp} kg
                                </button>
                              </div>
                            </div>
                          ) : emptyQty ? (
                            <span className="po-err">Enter pkg count</span>
                          ) : (
                            <span className="po-line-total">
                              ₹{fmtMoney(getTotal(item))}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className="po-remove"
                          title="Remove item"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeItem(item._id)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  <div className="po-row foot">
                    <span />
                    <span />
                    <span
                      style={{
                        fontSize: 11,
                        color: "var(--po-dim)",
                        fontWeight: 600,
                      }}
                    >
                      {totalItems} product{totalItems !== 1 ? "s" : ""}
                    </span>
                    <span />
                    <span
                      className="po-c"
                      style={{
                        fontSize: 11,
                        color: "var(--po-violet)",
                        fontWeight: 700,
                      }}
                    >
                      {roundPkg(totalPkgs)} pkg
                    </span>
                    <span
                      className="po-r"
                      style={{
                        fontSize: 12,
                        color: "var(--po-dim)",
                        fontWeight: 700,
                      }}
                    >
                      {fmtQty(totalQty)} kg
                    </span>
                    <span />
                  </div>
                </>
              )}
            </section>
          )}
        </main>

        {/* Fixed footer */}
        <footer className="po-footer">
          <div className="po-footer-in">
            {copyMsg && (
              <div className="po-toast" role="status">
                {copyMsg}
              </div>
            )}
            {errorCount > 0 && (
              <div className="po-errstrip" role="alert">
                <span>⚠</span>
                <span>
                  {errorCount} item{errorCount !== 1 ? "s have" : " has"} qty
                  not matching package size — fix or snap using the ↓ ↑ buttons
                </span>
              </div>
            )}
            <div className="po-stats">
              {stats.map((s) => (
                <div key={s.label} className="po-stat">
                  <div className="po-stat-l">{s.label}</div>
                  <div
                    className={`po-stat-v${s.large ? " lg" : ""}`}
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="po-actions">
              <button
                type="button"
                className="po-btn danger"
                onClick={clearOrder}
              >
                Clear Order
              </button>
              <div className="po-printwrap">
                <select
                  className="po-select"
                  aria-label="Print view"
                  value={printView}
                  onChange={(e) => setPrintView(e.target.value)}
                >
                  {PRINT_VIEWS.map((pv) => (
                    <option key={pv.id} value={pv.id}>
                      {pv.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="po-btn ghost"
                  style={{ flex: 1 }}
                  onClick={() => printOrder(printView)}
                  disabled={orderItems.length === 0}
                >
                  🖨 Print / PDF
                </button>
              </div>
              <button
                type="button"
                className="po-btn ghost"
                onClick={() => copyOrderImage(printView)}
                disabled={orderItems.length === 0}
                title="Copy the order as an image (paste into WhatsApp / Email)"
              >
                🖼 Copy Image
              </button>
              <button
                type="button"
                className="po-btn primary"
                onClick={saveOrder}
                disabled={!canExport}
                title={
                  !canExport && orderItems.length > 0
                    ? "Fix quantity errors before saving"
                    : ""
                }
              >
                💾 Save Order
              </button>
            </div>
          </div>
        </footer>

        {confirmDialog && (
          <div
            className="po-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) dismissConfirm();
            }}
          >
            <div
              className="po-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="po-modal-title"
              aria-describedby="po-modal-msg"
            >
              <div className="po-modal-icon" aria-hidden="true">
                🔔
              </div>
              <h2 className="po-modal-title" id="po-modal-title">
                {confirmDialog.title}
              </h2>
              <p className="po-modal-msg" id="po-modal-msg">
                {confirmDialog.msg}
              </p>
              <div className="po-modal-actions">
                <button
                  type="button"
                  className="po-modal-btn"
                  autoFocus
                  onClick={dismissConfirm}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="po-modal-btn danger"
                  onClick={() => {
                    const fn = confirmDialog.onYes;
                    dismissConfirm();
                    fn();
                  }}
                >
                  {confirmDialog.yesLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Error boundary: show the error on screen instead of a blank page ────────

const ALL_STORAGE_KEYS = [PRICELIST_KEY, TIER_STORE_KEY, PO_STORE_KEY];

class PurchaseOrderBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Purchase order page crashed:", error, info?.componentStack);
  }
  resetAndReload = () => {
    try {
      // saved orders (SAVED_KEY) are kept on purpose
      ALL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    window.location.reload();
  };
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div
        style={{
          padding: 24,
          maxWidth: 720,
          margin: "40px auto",
          fontFamily: "system-ui, sans-serif",
          color: "#c0392b",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Purchase Order page error</h2>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            background: "#fdecea",
            border: "1px solid #f1b9b3",
            borderRadius: 8,
            padding: 12,
            fontSize: 13,
          }}
        >
          {String(error?.stack || error?.message || error)}
        </pre>
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>{" "}
        <button type="button" onClick={this.resetAndReload}>
          Reset saved price list &amp; reload
        </button>
      </div>
    );
  }
}

export default function SFDyesPurchaseOrder() {
  return (
    <PurchaseOrderBoundary>
      <SFDyesPurchaseOrderInner />
    </PurchaseOrderBoundary>
  );
}
