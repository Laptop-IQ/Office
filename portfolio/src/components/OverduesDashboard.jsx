import { useState, useEffect, useRef, useCallback } from "react";
import { XLSX } from "@/lib/xlsx";
import axios from "axios";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, IndianRupee, Trash2, FolderOpen, Loader2, Search, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  pageBg: "var(--ov-pageBg)",
  card: "var(--ov-card)",
  elevated: "var(--ov-elevated)",
  border: "var(--ov-border)",
  borderHi: "var(--ov-borderHi)",
  gold: "var(--ov-gold)",
  goldDim: "var(--ov-goldDim)",
  goldGlow: "var(--ov-goldGlow)",
  text1: "var(--ov-text1)",
  text2: "var(--ov-text2)",
  text3: "var(--ov-text3)",
  critical: "var(--ov-critical)",
  urgent: "var(--ov-urgent)",
  warning: "var(--ov-warning)",
  info: "var(--ov-info)",
  safe: "var(--ov-safe)",
  dangerBg: "var(--ov-dangerBg)",
  urgentBg: "var(--ov-urgentBg)",
  warnBg: "var(--ov-warnBg)",
  infoBg: "var(--ov-infoBg)",
  safeBg: "var(--ov-safeBg)",
};

// ── Shared styles ──────────────────────────────────────────────────────────
const card = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
};

const inputStyle = {
  background: T.elevated,
  border: `1px solid ${T.border}`,
  color: T.text1,
  borderRadius: 8,
  padding: "8px 14px",
  fontSize: 13,
  outline: "none",
  width: "100%",
};

// ── Date utils ─────────────────────────────────────────────────────────────
const toISODate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number" && isFinite(value)) {
    const ms = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000;
    const d = new Date(ms);
    return isNaN(d.getTime())
      ? null
      : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }
  const str = String(value).trim();
  if (!str) return null;
  let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    if (+mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31)
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  m = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    if (+mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31)
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const generic = new Date(str);
  if (!isNaN(generic.getTime())) {
    const y = generic.getFullYear();
    const mo = String(generic.getMonth() + 1).padStart(2, "0");
    const d = String(generic.getDate()).padStart(2, "0");
    return `${y}-${mo}-${d}`;
  }
  return null;
};

const calcDueDays = (dated) => {
  const iso = toISODate(dated);
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const inv = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - inv) / 86400000);
};

const refreshDueDays = (rows) =>
  rows.map((r) => ({
    ...r,
    "Due Days": r["Dated"] ? calcDueDays(r["Dated"]) : null,
  }));

// ── XLSX parser ────────────────────────────────────────────────────────────
const parseXLSX = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, {
          type: "array",
          cellDates: true,
        });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(ws, { raw: true });
        const cleaned = raw.map((r, i) => {
          const obj = {};
          for (const k of Object.keys(r))
            obj[k.trim()] = typeof r[k] === "string" ? r[k].trim() : r[k];
          obj["Ref. Amt."] = Number(
            String(obj["Ref. Amt."] ?? 0).replace(/,/g, ""),
          );
          obj["Pending Amt."] = Number(
            String(obj["Pending Amt."] ?? 0).replace(/,/g, ""),
          );
          const isoDated = toISODate(obj["Dated"]);
          obj["Due Days"] = isoDated ? calcDueDays(isoDated) : null;
          obj["Dated"] =
            isoDated || (typeof obj["Dated"] === "string" ? obj["Dated"] : "");
          if ("Due Date" in obj) {
            const isoDue = toISODate(obj["Due Date"]);
            obj["Due Date"] =
              isoDue ||
              (typeof obj["Due Date"] === "string" ? obj["Due Date"] : "");
          }
          obj._id = i;
          return obj;
        });
        resolve(cleaned);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });

const applyAdjustments = (rows, deletedRefsSet, pendingOverrides) =>
  rows
    .filter((r) => !deletedRefsSet.has(r["Ref. No."]))
    .map((r) =>
      pendingOverrides[r["Ref. No."]] !== undefined
        ? { ...r, "Pending Amt.": pendingOverrides[r["Ref. No."]] }
        : r,
    );

const exportToXLSX = (rows, baseName) => {
  const cols = [
    "Salesman",
    "Account",
    "Dated",
    "Type",
    "Ref. No.",
    "Ref. Amt.",
    "Pending Amt.",
    "Due",
    "Due Date",
    "Due Days",
  ];
  const plain = rows.map((r) => {
    const o = {};
    cols.forEach((c) => {
      if (r[c] !== undefined) o[c] = r[c];
    });
    return o;
  });
  const ws = XLSX.utils.json_to_sheet(plain, { header: cols });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const stamp = new Date().toISOString().slice(0, 10);
  const clean = (baseName || "SF_Overdues").replace(/\.xlsx?$/i, "");
  XLSX.writeFile(wb, `${clean}_saved_${stamp}.xlsx`);
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN");

// Urgency badge: colour steps with how overdue the bill is
const getDueBadge = (days) => {
  if (days === null || days === undefined || isNaN(days))
    return {
      label: "—",
      style: {
        background: "color-mix(in srgb, var(--wash) 4.0%, transparent)",
        color: T.text3,
        border: `1px solid ${T.border}`,
      },
    };
  if (days > 180)
    return {
      label: `${days}d`,
      style: {
        background: T.dangerBg,
        color: T.critical,
        border: `1px solid var(--ov-critical)`,
      },
    };
  if (days > 90)
    return {
      label: `${days}d`,
      style: {
        background: T.urgentBg,
        color: T.urgent,
        border: `1px solid var(--ov-urgent)`,
      },
    };
  if (days > 30)
    return {
      label: `${days}d`,
      style: {
        background: T.warnBg,
        color: T.warning,
        border: `1px solid var(--ov-warning)`,
      },
    };
  if (days > 0)
    return {
      label: `${days}d`,
      style: {
        background: T.infoBg,
        color: T.info,
        border: `1px solid var(--ov-border)`,
      },
    };
  return {
    label: `${Math.abs(days)}d ahead`,
    style: {
      background: T.safeBg,
      color: T.safe,
      border: `1px solid var(--ov-safe)`,
    },
  };
};

const getPdfTitle = (search, filteredData) => {
  const q = search.trim();
  if (!q) return "Supple Rubber Overdues Report - All";
  const accounts = [
    ...new Set(filteredData.map((r) => r["Account"]).filter(Boolean)),
  ];
  if (accounts.length === 1)
    return `Supple Rubber Overdues Report - ${accounts[0]}`;
  if (accounts.length <= 3)
    return `Supple Rubber Overdues Report - ${accounts.join(", ")}`;
  return `Supple Rubber Overdues Report - ${q.toUpperCase()}`;
};

const buildAccountSummary = (data) => {
  const map = {};
  data.forEach((r) => {
    const acct = r["Account"] || "Unknown";
    if (!map[acct])
      map[acct] = {
        account: acct,
        total: 0,
        entries: 0,
        maxDays: 0,
        overdueAmt: 0,
        overdueCount: 0,
      };
    map[acct].total += r["Pending Amt."] || 0;
    map[acct].entries += 1;
    map[acct].maxDays = Math.max(map[acct].maxDays, r["Due Days"] ?? 0);
    if ((r["Due Days"] ?? 0) > 0) {
      map[acct].overdueAmt += r["Pending Amt."] || 0;
      map[acct].overdueCount += 1;
    }
  });
  return Object.values(map).sort((a, b) => b.total - a.total);
};

// ── PDF (kept print-white for readability) ──────────────────────────────────
const generatePDF = (data, title) => {
  const total = data.reduce((s, r) => s + (r["Pending Amt."] || 0), 0);
  const overdue = data.filter((r) => r["Due Days"] > 0);
  const overdueTotal = overdue.reduce(
    (s, r) => s + (r["Pending Amt."] || 0),
    0,
  );
  const maxDays = data.length
    ? Math.max(...data.map((r) => r["Due Days"] ?? 0))
    : 0;
  const maxAcct = (
    data.find((r) => r["Due Days"] === maxDays)?.["Account"] ?? ""
  ).slice(0, 22);
  const getBadgeClass = (days) => {
    if (days > 180) return "badge badge-red";
    if (days > 90) return "badge badge-orange";
    if (days > 30) return "badge badge-yellow";
    if (days > 0) return "badge badge-blue";
    return "badge badge-green";
  };
  const rows = data
    .map((r) => {
      const d = getDueBadge(r["Due Days"]);
      const bc = getBadgeClass(r["Due Days"]);
      return `<tr><td>${r["Account"]}</td><td style="white-space:nowrap">${r["Dated"]}</td><td style="font-family:monospace;font-size:10px">${r["Ref. No."]}</td><td style="text-align:right;font-weight:600">₹${Number(r["Pending Amt."]).toLocaleString("en-IN")}</td><td style="text-align:center"><span class="${bc}">${d.label}</span></td></tr>`;
    })
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
<style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}body{font-family:Arial,sans-serif;color:#1e293b;background:#fff;padding:20px}.hdr{background:#1e3a5f!important;color:#fff!important;padding:16px 20px;border-radius:8px;margin-bottom:16px}.hdr h1{font-size:18px;font-weight:700;color:#fff!important}.hdr .sub{font-size:11px;color:#cbd5e1!important;margin-top:3px}.stats{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap}.stat{flex:1;min-width:120px;background:#f8fafc!important;border-radius:6px;padding:10px 12px;border:1.5px solid #94a3b8!important;border-left:4px solid #2563eb!important}.stat.red{border-left:4px solid #dc2626!important}.stat.orange{border-left:4px solid #ea580c!important}.stat.purple{border-left:4px solid #7c3aed!important}.stat .val{font-size:16px;font-weight:700;color:#1e3a5f}.stat .lbl{font-size:9px;color:#64748b;margin-top:3px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}.stat .sub2{font-size:9px;color:#64748b;margin-top:2px}table{width:100%;border-collapse:collapse;border:2px solid #334155!important}thead tr{background:#1e3a5f!important}thead th{padding:7px 8px;font-size:10px;font-weight:700;color:#fff!important;text-align:left;border-right:1px solid #475569!important;border-bottom:2px solid #475569!important}thead th:last-child{border-right:none!important}tbody tr{border-bottom:1px solid #94a3b8!important}tbody tr:nth-child(even){background:#f1f5f9!important}tbody td{border:1px solid #94a3b8!important;padding:5px 8px;font-size:10.5px;color:#1e293b}.total-row td{font-weight:700;background:#dbeafe!important;font-size:11px;padding:7px 8px;border:1.5px solid #2563eb!important;color:#1e3a5f!important}.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:700;border:1px solid transparent}.badge-red{background:#fee2e2!important;color:#991b1b!important;border-color:#fca5a5!important}.badge-orange{background:#ffedd5!important;color:#9a3412!important;border-color:#fdba74!important}.badge-yellow{background:#fef9c3!important;color:#854d0e!important;border-color:#fde047!important}.badge-blue{background:#dbeafe!important;color:#1e40af!important;border-color:#93c5fd!important}.badge-green{background:#dcfce7!important;color:#166534!important;border-color:#86efac!important}.footer{margin-top:14px;font-size:9px;color:#64748b;text-align:center;border-top:1px solid #cbd5e1;padding-top:8px}@media print{body{padding:10px}table{page-break-inside:auto}tr{page-break-inside:avoid}thead{display:table-header-group}}</style></head><body>
<div class="hdr"><h1>${title}</h1><div class="sub">Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div></div>
<div class="stats"><div class="stat"><div class="val">${fmt(total)}</div><div class="lbl">Total Pending</div><div class="sub2">${data.length} entries</div></div><div class="stat red"><div class="val">${overdue.length}</div><div class="lbl">Overdue Entries</div><div class="sub2">${fmt(overdueTotal)}</div></div><div class="stat orange"><div class="val">${fmt(overdueTotal)}</div><div class="lbl">Overdue Amount</div><div class="sub2">${overdue.length} entries</div></div><div class="stat purple"><div class="val">${maxDays}d</div><div class="lbl">Max Due Days</div><div class="sub2">${maxAcct}</div></div></div>
<table><thead><tr><th>Account</th><th>Date</th><th>Ref. No.</th><th style="text-align:right">Pending Amt.</th><th style="text-align:center">Due Days</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="3" style="text-align:right;padding-right:12px">TOTAL (${data.length} records)</td><td style="text-align:right;font-size:12px">₹${total.toLocaleString("en-IN")}</td><td></td></tr></tbody></table>
<div class="footer">Supple Rubber &nbsp;•&nbsp; Confidential &nbsp;•&nbsp; ${new Date().toLocaleString("en-IN")}</div></body></html>`;
  const w = window.open("", "_blank");
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

// ── Storage ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "sf-overdues-v1";
const lsGet = (k) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
};
const lsSet = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch {
    return false;
  }
};
const lsDel = (k) => {
  try {
    localStorage.removeItem(k);
  } catch {}
};

// ── Confirm Modal ──────────────────────────────────────────────────────────
const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.7)",
    }}
  >
    <div
      style={{
        ...card,
        padding: 28,
        maxWidth: 380,
        width: "100%",
        margin: "0 16px",
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Trash2 size={22} strokeWidth={1.5} aria-hidden="true" />
        <p style={{ color: T.text1, fontWeight: 600, fontSize: 15 }}>
          Confirm Delete
        </p>
      </div>
      <p
        style={{
          color: T.text2,
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: 24,
        }}
      >
        {message}
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: `1px solid ${T.border}`,
            background: "transparent",
            color: T.text2,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "none",
            background: "rgba(244,63,94,0.15)",
            color: T.critical,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "inset 0 0 0 1px rgba(244,63,94,0.4)",
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Payment pages ─────────────────────────────────────────────────────────
// Payment received, payment history and row payments are full pages
// (/OverduesDashboard/payment, /history, /record), not popups.
const OVP_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');
  .ovp { --ovp-pri: var(--ov-gold); --ovp-pri-fg: #1a1408; min-height: 100vh; background: var(--ov-pageBg); color: var(--ov-text1); font-family: 'Geist','Inter','Segoe UI',Arial,sans-serif; -webkit-font-smoothing: antialiased; }
  html[data-theme="light"] .ovp { --ovp-pri: #171717; --ovp-pri-fg: #ffffff; }
  .ovp *, .ovp *::before, .ovp *::after { box-sizing: border-box; }
  .ovp-bar { height: 56px; border-bottom: 1px solid var(--ov-border); }
  .ovp-bar-in { height: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .ovp-brand { display: inline-flex; align-items: center; gap: 10px; color: var(--ov-text1); text-decoration: none; font-size: 16px; font-weight: 500; }
  .ovp-mark { width: 12px; height: 12px; border-radius: 3px; background: var(--ov-gold); }
  .ovp-back { min-height: 36px; padding: 0 12px; margin-right: -12px; display: inline-flex; align-items: center; gap: 8px; border-radius: 8px; color: var(--ov-text2); text-decoration: none; font-size: 14px; transition: color .15s, background-color .15s; }
  .ovp-back:hover { color: var(--ov-text1); background: var(--ov-elevated); }
  .ovp-wrap { max-width: 1200px; margin: 0 auto; padding: 32px 24px 96px; }
  .ovp-wrap.narrow { max-width: 600px; }
  .ovp-crumbs { display: flex; gap: 8px; font-size: 13px; color: var(--ov-text3); margin-bottom: 8px; }
  .ovp-crumbs a { color: var(--ov-text2); text-decoration: none; }
  .ovp-crumbs a:hover { color: var(--ov-text1); }
  .ovp-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
  .ovp-title { margin: 0; font-size: 28px; line-height: 1.15; font-weight: 500; letter-spacing: -.02em; }
  .ovp-sub { margin-top: 6px; font-size: 14px; color: var(--ov-text2); }
  .ovp-card { background: var(--ov-card); border: 1px solid var(--ov-border); border-radius: 12px; padding: 24px; }
  .ovp-form { display: grid; gap: 20px; }
  .ovp-label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; }
  .ovp-in { width: 100%; height: 44px; padding: 0 12px; border-radius: 10px; border: 1px solid var(--ov-border); background: var(--ov-elevated); color: var(--ov-text1); font: inherit; font-size: 15px; outline: none; transition: border-color .15s; }
  .ovp-in:hover { border-color: var(--ov-borderHi); }
  .ovp-in:focus { border-color: var(--ov-gold); box-shadow: 0 0 0 1px var(--ov-gold); }
  .ovp-amt { position: relative; }
  .ovp-amt > span { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--ov-text3); }
  .ovp-amt .ovp-in { padding-left: 28px; font-variant-numeric: tabular-nums; }
  .ovp-note { margin: 0; font-size: 13px; line-height: 20px; color: var(--ov-text2); }
  .ovp-note.ok { color: var(--ov-safe); }
  .ovp-note.warn { color: var(--ov-warning); }
  .ovp-note.bad { color: var(--ov-critical); }
  .ovp-facts { display: grid; gap: 0; border: 1px solid var(--ov-border); border-radius: 10px; overflow: hidden; }
  .ovp-fact { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; padding: 12px 14px; font-size: 14px; color: var(--ov-text2); }
  .ovp-fact + .ovp-fact { border-top: 1px solid var(--ov-border); }
  .ovp-fact b { color: var(--ov-text1); font-weight: 500; font-variant-numeric: tabular-nums; text-align: right; }
  .ovp-foot { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; padding-top: 4px; }
  .ovp-btn { height: 44px; padding: 0 18px; border-radius: 10px; border: 1px solid var(--ov-border); background: var(--ov-elevated); color: var(--ov-text1); font: inherit; font-size: 14px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; white-space: nowrap; transition: background-color .15s, border-color .15s, transform .15s; }
  .ovp-btn:hover:not(:disabled) { border-color: var(--ov-borderHi); }
  .ovp-btn:active:not(:disabled) { transform: scale(.98); }
  .ovp-btn.pri { background: var(--ovp-pri); color: var(--ovp-pri-fg); border-color: transparent; }
  .ovp-btn:disabled { opacity: .5; cursor: not-allowed; }
  .ovp-btn:focus-visible, .ovp-back:focus-visible, .ovp-brand:focus-visible { outline: 2px solid var(--ov-gold); outline-offset: 2px; }
  .ovp-kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
  .ovp-kpi { padding: 18px 20px; border-radius: 12px; background: var(--ov-card); border: 1px solid var(--ov-border); }
  .ovp-kpi span { display: block; font-size: 13px; color: var(--ov-text2); }
  .ovp-kpi b { display: block; margin-top: 8px; font-size: 26px; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
  .ovp-tbl-wrap { overflow-x: auto; border: 1px solid var(--ov-border); border-radius: 12px; background: var(--ov-card); }
  .ovp-tbl { width: 100%; min-width: 820px; border-collapse: separate; border-spacing: 0; font-size: 14px; }
  .ovp-tbl th { text-align: left; padding: 12px 16px; font-size: 13px; font-weight: 500; color: var(--ov-text3); background: var(--ov-elevated); border-bottom: 1px solid var(--ov-border); white-space: nowrap; }
  .ovp-tbl td { padding: 14px 16px; border-bottom: 1px solid var(--ov-border); vertical-align: top; }
  .ovp-tbl tbody tr:last-child td { border-bottom: 0; }
  .ovp-tbl .r { text-align: right; font-variant-numeric: tabular-nums; }
  .ovp-tbl .mut { color: var(--ov-text2); }
  .ovp-alloc { display: grid; gap: 4px; }
  .ovp-alloc div { color: var(--ov-text2); }
  .ovp-alloc b { color: var(--ov-text1); font-weight: 500; }
  .ovp-paid { color: var(--ov-safe); }
  .ovp-empty { padding: 56px 20px; text-align: center; color: var(--ov-text2); }
  @media (max-width: 720px) {
    .ovp-bar-in { padding: 0 16px; }
    .ovp-wrap { padding: 24px 16px 96px; }
    .ovp-title { font-size: 24px; }
    .ovp-card { padding: 20px 16px; }
    .ovp-kpis { grid-template-columns: 1fr; }
    .ovp-btn { flex: 1 1 100%; }
  }
  @media (prefers-reduced-motion: reduce) { .ovp-btn, .ovp-back, .ovp-in { transition: none; } }
`;

const OvPage = ({ title, subtitle, crumb, narrow, actions, children }) => (
  <div className="ovp">
    <style>{OVP_CSS}</style>
    <header className="ovp-bar">
      <div className="ovp-bar-in">
        <Link to="/" className="ovp-brand">
          <span className="ovp-mark" aria-hidden="true" />
          My Office Workplace
        </Link>
        <Link to="/OverduesDashboard" className="ovp-back">
          <ArrowLeft size={16} strokeWidth={1.5} aria-hidden="true" />
          Back to overdues
        </Link>
      </div>
    </header>
    <main className={`ovp-wrap${narrow ? " narrow" : ""}`}>
      <nav className="ovp-crumbs" aria-label="Breadcrumb">
        <Link to="/OverduesDashboard">Overdues</Link>
        <span aria-hidden="true">/</span>
        <span style={{ color: "var(--ov-text1)" }}>{crumb || title}</span>
      </nav>
      <div className="ovp-head">
        <div>
          <h1 className="ovp-title">{title}</h1>
          {subtitle && <div className="ovp-sub">{subtitle}</div>}
        </div>
        {actions}
      </div>
      {children}
    </main>
  </div>
);

// ── Customer payment received (FIFO allocation) ───────────────────────────
const PaymentReceivedPage = ({ rows, onConfirm, busy, error }) => {
  const navigate = useNavigate();
  const accounts = [...new Set(rows.map((r) => r["Account"]).filter(Boolean))].sort();
  const [account, setAccount] = useState(accounts[0] || "");
  const [amount, setAmount] = useState("");
  const value = Number(amount);
  const mine = rows.filter((r) => r["Account"] === account);
  const pending = mine.reduce((sum, r) => sum + (Number(r["Pending Amt."]) || 0), 0);

  return (
    <OvPage
      title="Payment received"
      subtitle="Payment is adjusted against the oldest pending bills first (FIFO)"
      narrow
    >
      <form
        className="ovp-card ovp-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (account && value > 0 && !busy) onConfirm(account, value);
        }}
      >
        <div>
          <label className="ovp-label" htmlFor="ovp-account">Customer</label>
          <select
            id="ovp-account"
            className="ovp-in"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
          >
            {accounts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {account && (
          <div className="ovp-facts">
            <div className="ovp-fact">
              <span>Pending bills</span>
              <b>{mine.length}</b>
            </div>
            <div className="ovp-fact">
              <span>Total pending</span>
              <b>{fmt(pending)}</b>
            </div>
          </div>
        )}

        <div>
          <label className="ovp-label" htmlFor="ovp-amount">Amount received</label>
          <div className="ovp-amt">
            <span aria-hidden="true">₹</span>
            <input
              id="ovp-amount"
              className="ovp-in"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>
          {value > 0 && (
            <p className={`ovp-note ${value > pending ? "warn" : "ok"}`} style={{ marginTop: 8 }}>
              {value > pending
                ? `${fmt(value - pending)} is more than the pending amount and will stay unallocated.`
                : `Pending after this payment: ${fmt(pending - value)}`}
            </p>
          )}
        </div>

        {error && <p className="ovp-note bad" role="alert">{error}</p>}

        <div className="ovp-foot">
          <button type="button" className="ovp-btn" onClick={() => navigate("/OverduesDashboard")}>
            Cancel
          </button>
          <button type="submit" className="ovp-btn pri" disabled={!account || !(value > 0) || busy}>
            {busy ? "Saving" : "Confirm and allocate"}
          </button>
        </div>
      </form>
    </OvPage>
  );
};


const PaymentHistoryPage = ({ payments }) => {
  const totalReceived = payments.reduce(
    (s, p) => s + (Number(p.amountReceived) || 0),
    0,
  );
  const totalAllocated = payments.reduce(
    (s, p) => s + (Number(p.allocatedAmount) || 0),
    0,
  );
  const downloadPDF = () => {
    const esc = (value) =>
      String(value ?? "").replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[char],
      );
    const money = (value) =>
      `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    const totalUnallocated = payments.reduce(
      (sum, payment) => sum + (Number(payment.unallocatedAmount) || 0),
      0,
    );
    const allocationRate =
      totalReceived > 0
        ? Math.min(100, Math.round((totalAllocated / totalReceived) * 100))
        : 0;
    const paymentCards = [...payments]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .map((payment, index) => {
        const received = Number(payment.amountReceived) || 0;
        const allocated = Number(payment.allocatedAmount) || 0;
        const unallocated = Number(payment.unallocatedAmount) || 0;
        const allocations = (payment.allocations || [])
          .map(
            (allocation) => `
          <tr>
            <td><span class="bill-ref">${esc(allocation.refNo || "—")}</span></td>
            <td class="num">${money(allocation.amount)}</td>
            <td>${
              allocation.pendingAfter === 0
                ? '<span class="status paid">Fully paid</span>'
                : '<span class="status partial">Balance pending</span>'
            }</td>
          </tr>`,
          )
          .join("");
        return `
          <section class="payment-card">
            <div class="payment-top">
              <div class="payment-ident">
                <span class="payment-index">${String(index + 1).padStart(2, "0")}</span>
                <div>
                  <div class="customer">${esc(payment.account || "Unknown customer")}</div>
                  <div class="date">${esc(
                    payment.createdAt
                      ? new Date(payment.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Date not available",
                  )}</div>
                </div>
              </div>
              <div class="received-block"><span>PAYMENT RECEIVED</span><strong>${money(received)}</strong></div>
            </div>
            <div class="payment-metrics">
              <div class="metric allocated"><span>Allocated to bills</span><strong>${money(allocated)}</strong></div>
              <div class="metric unallocated"><span>Unallocated amount</span><strong>${money(unallocated)}</strong></div>
            </div>
            <div class="allocation-heading">
              <div><strong>Bill-wise allocation</strong><span>Oldest pending bills are adjusted first (FIFO)</span></div>
              <span class="allocation-count">${(payment.allocations || []).length} bill(s)</span>
            </div>
            ${
              (payment.allocations || []).length
                ? `<table class="allocation-table"><thead><tr><th>Bill / Reference No.</th><th class="num">Amount applied</th><th>Status after payment</th></tr></thead><tbody>${allocations}</tbody></table>`
                : '<div class="no-allocation">No bill allocation recorded for this payment.</div>'
            }
            ${unallocated > 0 ? `<div class="notice"><strong>${money(unallocated)} not allocated</strong><span>This amount is recorded as unallocated; it is not shown as an advance balance.</span></div>` : ""}
          </section>`;
      })
      .join("");

    const w = window.open("", "_blank");
    if (!w) {
      alert("Please allow pop-ups to export PDF.");
      return;
    }
    w.document.write(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SF Overdues · Payment History</title>
<style>
  :root{color-scheme:light;--navy:#14233f;--navy2:#21395f;--gold:#b88a17;--ink:#182338;--muted:#66758b;--line:#dce4ef;--paper:#fff;--soft:#f4f7fb;--green:#13795b;--green-bg:#e7f6ef;--amber:#95620b;--amber-bg:#fff5dc}
  *{box-sizing:border-box}
  body{margin:0;background:#eef2f7;color:var(--ink);font:13px/1.45 Inter,Segoe UI,Arial,sans-serif;padding:28px}
  .report{max-width:1100px;margin:0 auto;background:var(--paper);padding:30px;border:1px solid #e4eaf2;border-radius:18px;box-shadow:0 12px 40px rgba(20,35,63,.08)}
  .brandbar{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:20px;border-bottom:1px solid var(--line)}
  .brand{display:flex;align-items:center;gap:12px}.brand-mark{display:grid;place-items:center;width:44px;height:44px;border-radius:12px;background:var(--navy);color:#f4ce68;font-size:15px;font-weight:900;letter-spacing:-1px}
  .eyebrow{font-size:10px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:var(--gold)}
  h1{font-size:25px;line-height:1.2;margin:4px 0;color:var(--navy);letter-spacing:-.6px}
  .subtitle{color:var(--muted);font-size:11px;margin-top:5px}.generated{text-align:right;color:var(--muted);font-size:10px;line-height:1.6}
  .overview{margin:22px 0 14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
  .summary{border:1px solid var(--line);border-radius:12px;padding:15px 16px;background:#fff;min-width:0}
  .summary.received{border-top:3px solid var(--gold)}.summary.allocated{border-top:3px solid #15966b}.summary.unallocated{border-top:3px solid #d99a18}
  .summary-label{font-size:10px;font-weight:800;letter-spacing:.65px;color:var(--muted);text-transform:uppercase}
  .summary-value{font-size:22px;font-weight:850;letter-spacing:-.5px;margin-top:7px;color:var(--navy);overflow-wrap:anywhere}
  .summary-note{font-size:10px;color:var(--muted);margin-top:4px}
  .allocation-overview{padding:13px 15px;border-radius:10px;background:var(--soft);margin-bottom:22px;display:flex;align-items:center;gap:14px}
  .progress-copy{min-width:0;flex:1}.progress-title{font-size:11px;font-weight:800;color:var(--navy)}.progress-sub{font-size:10px;color:var(--muted);margin-top:2px}
  .progress-track{height:7px;border-radius:99px;background:#dfe7f1;overflow:hidden;margin-top:8px}.progress-fill{height:100%;background:#15966b;border-radius:99px;width:${allocationRate}%}
  .progress-percent{font-size:17px;font-weight:850;color:var(--green);white-space:nowrap}
  .section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:24px 0 12px;color:var(--navy);font-size:14px;font-weight:850}
  .section-title span{font-size:10px;font-weight:600;color:var(--muted)}
  .payment-card{border:1px solid var(--line);border-radius:13px;margin:0 0 14px;overflow:hidden;break-inside:avoid;page-break-inside:avoid}
  .payment-top{padding:15px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;background:linear-gradient(110deg,#f7f9fc,#fff);border-bottom:1px solid var(--line)}
  .payment-ident{display:flex;align-items:center;gap:11px;min-width:0}.payment-index{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;background:var(--navy);color:#fff;border-radius:10px;font-size:11px;font-weight:800}
  .customer{font-size:14px;font-weight:850;color:var(--navy);overflow-wrap:anywhere}.date{font-size:10px;color:var(--muted);margin-top:3px}
  .received-block{text-align:right;flex:0 0 auto}.received-block span{display:block;font-size:9px;letter-spacing:.7px;color:var(--muted);font-weight:800}.received-block strong{display:block;color:var(--navy);font-size:18px;margin-top:2px}
  .payment-metrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 16px}
  .metric{padding:10px 12px;border-radius:9px;background:var(--soft);min-width:0}.metric span{display:block;font-size:10px;color:var(--muted);font-weight:700}.metric strong{display:block;font-size:14px;margin-top:4px;overflow-wrap:anywhere}
  .metric.allocated strong{color:var(--green)}.metric.unallocated strong{color:var(--amber)}
  .allocation-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px 9px;border-top:1px solid var(--line)}
  .allocation-heading strong{display:block;font-size:11px;color:var(--navy)}.allocation-heading span{font-size:10px;color:var(--muted)}.allocation-count{white-space:nowrap;padding:4px 8px;border-radius:99px;background:#edf2f8;color:var(--navy)!important;font-weight:800}
  table{width:100%;border-collapse:collapse}.allocation-table{font-size:10.5px}.allocation-table th{background:#f3f6fa;color:#58677e;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.4px;font-weight:800}
  .allocation-table td,.allocation-table th{padding:9px 16px;border-top:1px solid #e9eef5}.num{text-align:right;white-space:nowrap}.bill-ref{font-weight:800;color:var(--navy)}
  .status{display:inline-block;padding:3px 7px;border-radius:99px;font-size:9px;font-weight:800;white-space:nowrap}.paid{color:var(--green);background:var(--green-bg)}.partial{color:var(--amber);background:var(--amber-bg)}
  .no-allocation{padding:12px 16px;color:var(--muted);font-size:10px;background:#fafbfd;border-top:1px solid var(--line)}
  .notice{display:flex;flex-direction:column;gap:3px;margin:0 16px 14px;padding:10px 12px;border-radius:8px;background:var(--amber-bg);border:1px solid #f2dfaa;color:var(--amber);font-size:10px}.notice span{color:#795c22}
  .empty{padding:34px;text-align:center;border:1px dashed #cbd5e1;border-radius:12px;color:var(--muted);background:#fafbfd}
  footer{display:flex;justify-content:space-between;gap:12px;border-top:1px solid var(--line);margin-top:24px;padding-top:12px;color:var(--muted);font-size:9px}
  @page{size:A4 portrait;margin:12mm}
  @media(max-width:650px){body{padding:0;background:#fff}.report{padding:16px;border:0;box-shadow:none;border-radius:0}.overview{grid-template-columns:1fr}.brandbar{align-items:flex-start}.generated{max-width:110px}.payment-top{align-items:flex-start}.summary-value{font-size:20px}}
  @media print{body{padding:0;background:#fff;font-size:11px}.report{max-width:none;padding:0;border:0;border-radius:0;box-shadow:none}.brandbar,.payment-card,.summary,.allocation-overview{print-color-adjust:exact;-webkit-print-color-adjust:exact}.overview{gap:8px;margin:16px 0 10px}.summary{padding:10px}.summary-value{font-size:18px}.payment-card{margin-bottom:10px}.payment-top{padding:10px 12px}.payment-metrics{padding:8px 12px}.allocation-heading{padding:9px 12px 7px}.allocation-table td,.allocation-table th{padding:7px 12px}.notice{margin:0 12px 10px}footer{margin-top:14px}.no-print{display:none!important}}
</style></head><body><main class="report">
  <div class="brandbar"><div class="brand"><div class="brand-mark">SF</div><div><div class="eyebrow">Accounts receivable</div><h1>Payment History</h1><div class="subtitle">Clear overview of collections and bill-wise adjustments</div></div></div><div class="generated"><strong>SF OVERDUES</strong><br>Generated ${esc(new Date().toLocaleString("en-IN"))}<br>${payments.length} payment record(s)</div></div>
  <section class="overview">
    <div class="summary received"><div class="summary-label">Total received</div><div class="summary-value">${money(totalReceived)}</div><div class="summary-note">Money collected from customers</div></div>
    <div class="summary allocated"><div class="summary-label">Allocated to bills</div><div class="summary-value">${money(totalAllocated)}</div><div class="summary-note">Applied against outstanding invoices</div></div>
    <div class="summary unallocated"><div class="summary-label">Unallocated</div><div class="summary-value">${money(totalUnallocated)}</div><div class="summary-note">Not applied to bills / advance not tracked here</div></div>
  </section>
  <section class="allocation-overview"><div class="progress-copy"><div class="progress-title">Collection allocation</div><div class="progress-sub">${money(totalAllocated)} of ${money(totalReceived)} received has been applied to bills.</div><div class="progress-track"><div class="progress-fill"></div></div></div><div class="progress-percent">${allocationRate}%<div style="font-size:9px;font-weight:700;color:#66758b;text-align:right">allocated</div></div></section>
  <div class="section-title">Payment records <span>Newest first · FIFO bill allocation</span></div>
  ${paymentCards || '<div class="empty"><strong>No payment records found</strong><br><span>Your recorded payments will appear here.</span></div>'}
  <footer><span>Confidential · SF Overdues</span><span>Amounts shown in INR (₹) · Generated ${esc(new Date().toLocaleDateString("en-IN"))}</span></footer>
</main><script>window.onload=()=>window.print()</script></body></html>`);
    w.document.close();
  };
  const totalUnallocated = payments.reduce(
    (s, p) => s + (Number(p.unallocatedAmount) || 0),
    0,
  );
  return (
    <OvPage
      title="Payment history"
      subtitle={`${payments.length} record${payments.length === 1 ? "" : "s"}`}
      actions={
        <button type="button" className="ovp-btn pri" onClick={downloadPDF} disabled={!payments.length}>
          Download PDF
        </button>
      }
    >
      <div className="ovp-kpis">
        <div className="ovp-kpi">
          <span>Total received</span>
          <b>{fmt(totalReceived)}</b>
        </div>
        <div className="ovp-kpi">
          <span>Allocated to bills</span>
          <b>{fmt(totalAllocated)}</b>
        </div>
        <div className="ovp-kpi">
          <span>Unallocated</span>
          <b>{fmt(totalUnallocated)}</b>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="ovp-card ovp-empty">No payments recorded yet</div>
      ) : (
        <div className="ovp-tbl-wrap">
          <table className="ovp-tbl">
            <thead>
              <tr>
                <th>Date and time</th>
                <th>Customer</th>
                <th className="r">Received</th>
                <th className="r">Allocated</th>
                <th className="r">Unallocated</th>
                <th>Bill-wise allocation (FIFO)</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="mut" style={{ whiteSpace: "nowrap" }}>
                    {new Date(p.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td style={{ fontWeight: 500 }}>{p.account}</td>
                  <td className="r" style={{ fontWeight: 500 }}>{fmt(p.amountReceived)}</td>
                  <td className="r mut">{fmt(p.allocatedAmount)}</td>
                  <td className="r" style={{ color: Number(p.unallocatedAmount) > 0 ? "var(--ov-warning)" : "var(--ov-text3)" }}>
                    {fmt(p.unallocatedAmount)}
                  </td>
                  <td>
                    <div className="ovp-alloc">
                      {(p.allocations || []).map((a) => (
                        <div key={`${a.refNo}-${a.amount}`}>
                          <b>{a.refNo}</b> · {fmt(a.amount)}
                          {a.pendingAfter === 0 ? <span className="ovp-paid"> · Paid</span> : null}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </OvPage>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function App() {
  const [_boot] = useState(() => lsGet(STORAGE_KEY));
  const [data, setData] = useState([]);
  const [deletedRefs, setDeletedRefs] = useState(new Set());
  const [overrides, setOverrides] = useState({});
  const [fileName, setFileName] = useState("");
  const [search, setSearch] = useState("");
  const [filterDue, setFilterDue] = useState("all");
  const [sortCol, setSortCol] = useState("Due Days");
  const [sortDir, setSortDir] = useState("desc");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [parseErr, setParseErr] = useState("");
  const [activeTab, setActiveTab] = useState("detail");
  const [summarySort, setSummarySort] = useState("total");
  const [expandedAccount, setExpandedAccount] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [storageSaving, setStorageSaving] = useState(false);
  const [storageSavedAt, setStorageSavedAt] = useState(null);
  const [storageError, setStorageError] = useState("");
  const [paymentHistory, setPaymentHistory] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const sub = location.pathname.replace(/^\/OverduesDashboard\/?/i, "").replace(/\/$/, "");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [syncReady, setSyncReady] = useState(false);
  const fileRef = useRef();

  const refreshCloudData = useCallback(async () => {
    setStorageSaving(true);
    setStorageError("");
    try {
      const [overdueRes, paymentRes] = await Promise.all([
        api.get("/overdues"),
        api.get("/overdues/payments"),
      ]);
      let cloudRows = overdueRes.data?.data || [];
      // Migrate the old browser-only data once, but only when the server has no records.
      if (
        cloudRows.length === 0 &&
        Array.isArray(_boot?.data) &&
        _boot.data.length
      ) {
        try {
          const migrated = await api.post("/overdues/migrate-local", {
            data: _boot.data,
            fileName: _boot.fileName || "Local data migration",
          });
          cloudRows = migrated.data?.data || [];
        } catch (migrationError) {
          console.warn(
            "Legacy local data migration skipped:",
            migrationError.response?.data?.message || migrationError.message,
          );
        }
      }
      setData(refreshDueDays(cloudRows));
      setFileName(overdueRes.data?.fileName || _boot?.fileName || "");
      setPaymentHistory(paymentRes.data?.payments || []);
      setStorageSavedAt(new Date());
      setSyncReady(true);
    } catch (error) {
      setStorageError(
        error.response?.data?.message ||
          "Cloud sync unavailable. Check backend/API URL and login.",
      );
    } finally {
      setStorageSaving(false);
    }
  }, [_boot]);

  useEffect(() => {
    refreshCloudData();
  }, [refreshCloudData]);

  const handleFile = useCallback(async (file) => {
    if (!file) return;
    setUploading(true);
    setParseErr("");
    setStorageSaving(true);
    setStorageError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await api.post("/overdues/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setData(refreshDueDays(response.data?.data || []));
      setFileName(response.data?.fileName || file.name);
      setStorageSavedAt(new Date());
      setSyncReady(true);
    } catch (error) {
      setParseErr(
        error.response?.data?.message ||
          "Upload failed. Please confirm backend connection and try again.",
      );
      setStorageError(
        error.response?.status === 401
          ? "Please login again to sync data."
          : "Cloud save failed",
      );
    } finally {
      setUploading(false);
      setStorageSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };
  const handleSaveToFile = () => exportToXLSX(data, fileName);
  const handleClearStorage = async () => {
    if (
      !window.confirm(
        "Clear all synced overdue entries and payment history for your account?\n\nThis action cannot be undone.",
      )
    )
      return;
    setStorageSaving(true);
    setStorageError("");
    try {
      await api.delete("/overdues/clear");
      setData([]);
      setPaymentHistory([]);
      setDeletedRefs(new Set());
      setOverrides({});
      setFileName("");
      setStorageSavedAt(new Date());
    } catch (error) {
      setStorageError(
        error.response?.data?.message || "Could not clear cloud data",
      );
    } finally {
      setStorageSaving(false);
    }
  };

  const confirmDeleteRow = (row) => {
    setConfirmModal({
      message: `Delete "${row["Ref. No."]}" for ${row["Account"]}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/overdues/${row._id}`);
          setData((current) => current.filter((r) => r._id !== row._id));
          setConfirmModal(null);
          setStorageSavedAt(new Date());
        } catch (error) {
          setStorageError(error.response?.data?.message || "Delete failed");
          setConfirmModal(null);
        }
      },
    });
  };

  const confirmDeleteAccount = (acctName) => {
    const acctRows = data.filter((r) => r["Account"] === acctName);
    const total = acctRows.reduce(
      (sum, r) => sum + (r["Pending Amt."] || 0),
      0,
    );
    setConfirmModal({
      message: `Delete all ${acctRows.length} entries for "${acctName}" totalling ${fmt(total)}?`,
      onConfirm: async () => {
        try {
          await api.delete(`/overdues/account/${encodeURIComponent(acctName)}`);
          setData((current) =>
            current.filter((r) => r["Account"] !== acctName),
          );
          if (expandedAccount === acctName) setExpandedAccount(null);
          setConfirmModal(null);
          setStorageSavedAt(new Date());
        } catch (error) {
          setStorageError(error.response?.data?.message || "Delete failed");
          setConfirmModal(null);
        }
      },
    });
  };


  const handleCustomerPayment = async (account, amount) => {
    setPaymentBusy(true);
    setStorageError("");
    try {
      await api.post("/overdues/payments", { account, amount });
      await refreshCloudData();
      navigate("/OverduesDashboard");
    } catch (error) {
      setStorageError(
        error.response?.data?.message || "Payment could not be saved to cloud",
      );
    } finally {
      setPaymentBusy(false);
    }
  };

  const filtered = data
    .filter((r) => {
      const q = search.toLowerCase();
      if (
        q &&
        !(
          (r["Account"] || "").toLowerCase().includes(q) ||
          (r["Ref. No."] || "").toLowerCase().includes(q) ||
          (r["Salesman"] || "").toLowerCase().includes(q)
        )
      )
        return false;
      if (filterDue === "overdue" && r["Due Days"] <= 0) return false;
      if (filterDue === "notdue" && r["Due Days"] > 0) return false;
      if (filterDue === "critical" && r["Due Days"] <= 90) return false;
      return true;
    })
    .sort((a, b) => {
      const av = a[sortCol],
        bv = b[sortCol];
      if (av == null) return 1;
      if (bv == null) return -1;
      return sortDir === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });

  const total = filtered.reduce((s, r) => s + (r["Pending Amt."] || 0), 0);
  const overdueRows = filtered.filter((r) => r["Due Days"] > 0);
  const overdueTotal = overdueRows.reduce(
    (s, r) => s + (r["Pending Amt."] || 0),
    0,
  );
  const criticalRows = filtered.filter((r) => r["Due Days"] > 90);
  const maxDueDays = filtered.length
    ? Math.max(...filtered.map((r) => r["Due Days"] ?? 0))
    : 0;
  const maxDueAcct =
    filtered.find((r) => r["Due Days"] === maxDueDays)?.["Account"] ?? "";
  const pdfTitle = getPdfTitle(search, filtered);

  const accountSummary = buildAccountSummary(data).sort((a, b) => {
    if (summarySort === "entries") return b.entries - a.entries;
    if (summarySort === "maxDays") return b.maxDays - a.maxDays;
    return b.total - a.total;
  });
  const grandTotal = accountSummary.reduce((s, r) => s + r.total, 0);
  const maxBar = accountSummary[0]?.total || 1;

  const thSort = (col) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  // KPI card accent colors
  const kpiCards = [
    {
      lbl: "Total Pending",
      val: fmt(total),
      sub: `${filtered.length} entries`,
      color: T.gold,
      icon: "₹",
    },
    {
      lbl: "Overdue Amount",
      val: fmt(overdueTotal),
      sub: `${overdueRows.length} bills`,
      color: T.critical,
      icon: "!",
    },
    {
      lbl: "Critical 90d+",
      val: criticalRows.length,
      sub: fmt(criticalRows.reduce((s, r) => s + (r["Pending Amt."] || 0), 0)),
      color: T.urgent,
      icon: "▲",
    },
    {
      lbl: "Max Due Days",
      val: `${maxDueDays}d`,
      sub:
        maxDueAcct.length > 18
          ? maxDueAcct.slice(0, 18) + "…"
          : maxDueAcct || "—",
      color: "#A78BFA",
      icon: "◷",
    },
  ];

  const badgePill = {
    display: "inline-flex",
    alignItems: "center",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    };
  const actionBtn = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
  };

  if (sub === "payment")
    return (
      <PaymentReceivedPage
        key={data.length}
        rows={data}
        onConfirm={handleCustomerPayment}
        busy={paymentBusy}
        error={storageError}
      />
    );
  if (sub === "history") return <PaymentHistoryPage payments={paymentHistory} />;
  if (sub) return <Navigate to="/OverduesDashboard" replace />;

  return (
    <>
      <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap');
      * { box-sizing: border-box; }
      html, body, #root { width: 100%; min-width: 0; margin: 0; }
      button, input, select { font: inherit; }
      .sf-shell { width: 100%; overflow-x: hidden; }
      .sf-container { width: min(1280px, 100%); margin: 0 auto; padding-left: 24px; padding-right: 24px; }
      .sf-header-inner { width: min(1280px, 100%); margin: 0 auto; padding: 14px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
      .sf-header-actions { display:flex; gap:10px; flex-wrap:wrap; }
      .sf-kpi-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
      .sf-filters { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
      .sf-tabs { display:flex; gap:0; border-bottom:1px solid ${T.border}; margin-bottom:20px; overflow-x:auto; overflow-y:hidden; scrollbar-width:none; }
      .sf-tabs::-webkit-scrollbar { display:none; }
      .sf-tabs button { flex:0 0 auto; }
      .desktop-table { display:block; }
      .mobile-list { display:none; }
      .mobile-summary { display:none; }
      .sf-upload { display:flex; align-items:center; gap:16px; }
      .sf-upload-copy { flex:1; min-width:0; }
      .sf-upload-copy p { overflow-wrap:anywhere; }
      @media (max-width: 768px) {
        .sf-container { padding:16px 12px 32px !important; }
        .sf-header-inner { padding:12px; align-items:flex-start; }
        .sf-header-inner h1 { font-size:18px !important; }
        .sf-header-actions { width:100%; display:grid; grid-template-columns:1fr 1fr !important; gap:8px; }
        .sf-header-actions button { width:100%; justify-content:center; }
        .sf-kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)) !important; gap:8px; margin-bottom:14px; }
        .sf-kpi-grid > div { min-width:0; padding:14px 12px !important; }
        .sf-kpi-grid > div p:nth-child(3) { font-size:18px !important; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .sf-filters { display:grid; grid-template-columns:1fr; gap:8px; }
        .sf-filters > div, .sf-filters select { width:100% !important; min-width:0 !important; }
        .sf-tabs button { padding:10px 12px !important; font-size:12px !important; }
        .desktop-table { display:none !important; }
        .mobile-list { display:flex; flex-direction:column; gap:10px; }
        .mobile-card { background:${T.card}; border:1px solid ${T.border}; border-radius:12px; padding:13px; width:100%; min-width:0; }
        .mobile-card-row { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; min-width:0; }
        .mobile-card-label { color:${T.text3}; font-size:12px; font-weight:500; }
        .mobile-card-value { color:${T.text1}; font-size:13px; font-weight:600; overflow-wrap:anywhere; min-width:0; }
        .mobile-card-account { font-size:14px; font-weight:700; overflow-wrap:anywhere; min-width:0; }
        .mobile-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:12px; }
        .mobile-actions button { min-height:38px; border-radius:8px; border:1px solid ${T.border}; background:${T.elevated}; color:${T.text1}; font-weight:700; cursor:pointer; }
        .sf-upload { padding:14px !important; align-items:flex-start !important; }
        .sf-upload > span { flex:0 0 auto; }
        .sf-upload-copy { min-width:0; }
        .sf-upload-copy p { font-size:12px !important; }
        .sf-upload-clear { align-self:center; }
        .mobile-summary { display:flex; flex-direction:column; gap:10px; }
        .mobile-summary-card { background:${T.card}; border:1px solid ${T.border}; border-radius:12px; overflow:hidden; }
        .mobile-summary-main { padding:13px; cursor:pointer; }
        .mobile-summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:12px; }
        .mobile-summary-grid > div { min-width:0; }
        .mobile-summary-expanded { border-top:1px solid ${T.border}; padding:10px 13px 13px; background:var(--ov-elevated); }
        .mobile-sub-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; padding:10px 0; border-bottom:1px solid ${T.border}; }
        .mobile-sub-row:last-child { border-bottom:0; }
        .mobile-sub-actions { display:flex; gap:4px; justify-content:flex-end; }
        .mobile-sub-actions button { width:34px; height:34px; border-radius:7px; border:1px solid ${T.border}; background:${T.elevated}; cursor:pointer; }
        .mobile-summary-total { padding:13px; background:var(--ov-elevated); border:1px solid color-mix(in srgb, ${T.gold} 25%, transparent); border-radius:12px; }
      }
      @media (max-width: 380px) {
        .sf-kpi-grid { grid-template-columns:1fr !important; }
        .sf-header-actions { grid-template-columns:1fr; }
        .mobile-summary-grid { grid-template-columns:1fr 1fr; }
      }
    `}</style>
      <div
        className="sf-shell"
        style={{
          minHeight: "100vh",
          background: T.pageBg,
          fontFamily: "'Geist','Inter','Segoe UI',Arial,sans-serif",
          color: T.text1,
        }}
      >
        {confirmModal && (
          <ConfirmModal
            message={confirmModal.message}
            onConfirm={confirmModal.onConfirm}
            onCancel={() => setConfirmModal(null)}
          />
        )}

        {/* ── HEADER ── */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "var(--ov-headerBg)",
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <div
            className="sf-header-inner"
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span style={{ color: T.gold }}>SF</span>
                <span style={{ color: T.text1 }}>&nbsp;Overdues</span>
              </h1>
              <p
                style={{
                  color: T.text3,
                  fontSize: 12,
                  marginTop: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ color: T.text2 }}>
                  {fileName || "No file loaded"}
                </span>
                <span>·</span>
                <span>{data.length} records</span>
                <span>·</span>
                <span>
                  {new Date().toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span style={{ marginLeft: 4 }}>
                  {storageSaving ? (
                    <span style={{ color: T.info }}>Syncing…</span>
                  ) : storageError ? (
                    <span style={{ color: T.warning }}>{storageError}</span>
                  ) : storageSavedAt ? (
                    <span style={{ color: T.safe }}>
                      Cloud synced{" "}
                      {storageSavedAt.toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  ) : data.length === 0 ? (
                    <span style={{ color: T.text3 }}>
                      Connect to cloud or upload Excel
                    </span>
                  ) : null}
                </span>
              </p>
            </div>
            <div
              className="sf-header-actions"
              style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
            >
              <button
                onClick={refreshCloudData}
                disabled={storageSaving}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.text2,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: storageSaving ? "wait" : "pointer",
                }}
              >
                {storageSaving ? "Syncing…" : "Sync now"}
              </button>
              <button
                onClick={() => {
                  setStorageError("");
                  navigate("/OverduesDashboard/payment");
                }}
                disabled={!data.length}
                style={{
                  padding: "8px 13px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: T.elevated,
                  color: T.text1,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: data.length ? "pointer" : "not-allowed",
                }}
              >
                <IndianRupee size={14} strokeWidth={1.5} aria-hidden="true" /> Payment received
              </button>
              <button
                onClick={async () => {
                  setStorageSaving(true);
                  try {
                    const r = await api.get("/overdues/payments");
                    setPaymentHistory(r.data?.payments || []);
                    navigate("/OverduesDashboard/history");
                  } catch (e) {
                    setStorageError(
                      e.response?.data?.message ||
                        "Payment history could not be loaded",
                    );
                  } finally {
                    setStorageSaving(false);
                  }
                }}
                style={{
                  padding: "8px 13px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.text1,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Payment history ({paymentHistory.length})
              </button>
              <button
                onClick={handleSaveToFile}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.text2,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>Excel</span>
              </button>
              <button
                onClick={() => generatePDF(filtered, pdfTitle)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: T.gold,
                  color: "#000",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>PDF</span>
              </button>
            </div>
          </div>
        </header>

        <div
          className="sf-container"
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "24px 24px 48px",
          }}
        >
          {/* ── UPLOAD ZONE ── */}
          <div
            className="sf-upload"
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? T.gold : T.border}`,
              borderRadius: 12,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
              background: dragOver ? T.elevated : T.card,
              transition: "all 0.2s",
              marginBottom: 20,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <span style={{ fontSize: 26, lineHeight: 1 }}>
              {uploading ? <Loader2 size={26} strokeWidth={1.5} aria-hidden="true" /> : <FolderOpen size={26} strokeWidth={1.5} aria-hidden="true" />}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ color: T.text1, fontWeight: 600, fontSize: 14 }}>
                {uploading ? "Processing…" : "Upload Excel File"}
              </p>
              <p style={{ color: T.text3, fontSize: 12, marginTop: 2 }}>
                Click or drag & drop — records sync to your account database
              </p>
            </div>
            {data.length > 0 && (
              <button
                className="sf-upload-clear"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearStorage();
                }}
                style={{
                  fontSize: 12,
                  color: T.critical,
                  background: "transparent",
                  border: `1px solid rgba(244,63,94,0.25)`,
                  borderRadius: 6,
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Clear data
              </button>
            )}
          </div>

          {parseErr && (
            <div
              style={{
                background: "rgba(244,63,94,0.08)",
                border: `1px solid rgba(244,63,94,0.25)`,
                color: T.critical,
                fontSize: 13,
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
              }}
            >
              {parseErr}
            </div>
          )}

          {/* ── KPI CARDS ── */}
          <div
            className="sf-kpi-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {kpiCards.map(({ lbl, val, sub, color, icon }) => (
              <div
                key={lbl}
                style={{
                  ...card,
                  padding: "18px 20px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    color: T.text3,
                    fontSize: 12,
                    fontWeight: 600,
                    }}
                >
                  {lbl}
                </p>
                <p
                  style={{
                    color: T.text1,
                    fontSize: 24,
                    fontWeight: 500,
                    marginTop: 6,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {val}
                </p>
                <p style={{ color: T.text3, fontSize: 12, marginTop: 4 }}>
                  {sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── TABS ── */}
          <div
            className="sf-tabs"
            style={{
              display: "flex",
              gap: 0,
              borderBottom: `1px solid ${T.border}`,
              marginBottom: 20,
            }}
          >
            {[
              ["detail", "Detail view"],
              ["summary", "Account summary"],
            ].map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "10px 20px",
                  border: "none",
                  borderBottom:
                    activeTab === tab
                      ? `2px solid ${T.gold}`
                      : "2px solid transparent",
                  background: "transparent",
                  color: activeTab === tab ? T.gold : T.text3,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: -1,
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ══ TAB 1: DETAIL VIEW ══ */}
          {activeTab === "detail" && (
            <>
              {/* Filters */}
              <div
                className="sf-filters"
                style={{
                  display: "flex",
                  gap: 10,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: T.text3,
                      fontSize: 14,
                    }}
                  >
                    <Search size={16} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search account, ref no., salesman…"
                    style={{ ...inputStyle, paddingLeft: 36 }}
                  />
                </div>
                <select
                  value={filterDue}
                  onChange={(e) => setFilterDue(e.target.value)}
                  style={{
                    ...inputStyle,
                    width: "auto",
                    minWidth: 150,
                    cursor: "pointer",
                  }}
                >
                  <option value="all">All Entries</option>
                  <option value="overdue">Overdue Only</option>
                  <option value="critical">Critical (90d+)</option>
                  <option value="notdue">Not Yet Due</option>
                </select>
              </div>

              {/* Mobile-friendly list: keeps every record visible without horizontal scrolling */}
              <div className="mobile-list">
                {filtered.map((r) => {
                  const badge = getDueBadge(r["Due Days"]);
                  return (
                    <div className="mobile-card" key={`mobile-${r._id}`}>
                      <div className="mobile-card-row">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="mobile-card-label">Account</div>
                          <div className="mobile-card-account">
                            {r["Account"] || "—"}
                          </div>
                        </div>
                        <span
                          style={{
                            ...badgePill,
                            ...badge.style,
                            flexShrink: 0,
                          }}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div
                        className="mobile-summary-grid"
                        style={{ marginTop: 12 }}
                      >
                        <div>
                          <div className="mobile-card-label">Date</div>
                          <div className="mobile-card-value">
                            {r["Dated"] || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="mobile-card-label">Pending</div>
                          <div
                            className="mobile-card-value"
                            style={{ color: T.gold }}
                          >
                            ₹
                            {Number(r["Pending Amt."] || 0).toLocaleString(
                              "en-IN",
                            )}
                          </div>
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <div className="mobile-card-label">Reference No.</div>
                          <div
                            className="mobile-card-value"
                            style={{ fontFamily: "monospace", color: T.text2 }}
                          >
                            {r["Ref. No."] || "—"}
                          </div>
                        </div>
                      </div>
                      <div className="mobile-actions">
                        <button
                          onClick={() => confirmDeleteRow(r)}
                          style={{
                            color: T.critical,
                            borderColor: "rgba(244,63,94,.25)",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length > 0 && (
                  <div className="mobile-summary-total">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">
                        Total · {filtered.length} records
                      </span>
                      <strong style={{ color: T.gold, fontSize: 16 }}>
                        ₹{total.toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Table */}
              <div
                className="desktop-table"
                style={{ ...card, overflow: "hidden" }}
              >
                <div style={{ overflowX: "auto", overflowY: "hidden" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 13,
                    }}
                  >
                    <thead>
                      <tr style={{ background: T.elevated }}>
                        {[
                          ["Account", "Account"],
                          ["Dated", "Dated"],
                          ["Ref. No.", "Ref. No."],
                          ["Pending Amt.", "Pending Amt."],
                          ["Due Days", "Due Days"],
                        ].map(([label, col]) => (
                          <th
                            key={col}
                            onClick={() => thSort(col)}
                            style={{
                              padding: "11px 16px",
                              textAlign:
                                col === "Pending Amt."
                                  ? "right"
                                  : col === "Due Days"
                                    ? "center"
                                    : "left",
                              color: T.text3,
                              fontSize: 12,
                              fontWeight: 600,
                              borderBottom: `1px solid ${T.border}`,
                              cursor: "pointer",
                              userSelect: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {label}
                            <span
                              style={{
                                marginLeft: 4,
                                opacity: sortCol === col ? 1 : 0.3,
                                color: sortCol === col ? T.gold : T.text3,
                              }}
                            >
                              {sortCol === col
                                ? sortDir === "asc"
                                  ? "↑"
                                  : "↓"
                                : "↕"}
                            </span>
                          </th>
                        ))}
                        <th
                          style={{
                            padding: "11px 16px",
                            color: T.text3,
                            fontSize: 12,
                            fontWeight: 600,
                            borderBottom: `1px solid ${T.border}`,
                            textAlign: "center",
                          }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => {
                        const badge = getDueBadge(r["Due Days"]);
                        return (
                          <tr
                            key={r._id}
                            style={{
                              background:
                                i % 2 === 0
                                  ? "transparent"
                                  : "color-mix(in srgb, var(--wash) 1.2%, transparent)",
                              borderBottom: `1px solid ${T.border}`,
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = T.elevated)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                i % 2 === 0
                                  ? "transparent"
                                  : "color-mix(in srgb, var(--wash) 1.2%, transparent)")
                            }
                          >
                            <td
                              style={{
                                padding: "11px 16px",
                                color: T.text1,
                                fontWeight: 500,
                                maxWidth: 240,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={r["Account"]}
                            >
                              {r["Account"]}
                            </td>
                            <td
                              style={{
                                padding: "11px 16px",
                                color: T.text2,
                                whiteSpace: "nowrap",
                                fontSize: 12,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {r["Dated"]}
                            </td>
                            <td
                              style={{
                                padding: "11px 16px",
                                color: T.text3,
                                fontFamily: "monospace",
                                fontSize: 12,
                              }}
                            >
                              {r["Ref. No."]}
                            </td>
                            <td
                              style={{
                                padding: "11px 16px",
                                textAlign: "right",
                                color: T.text1,
                                fontWeight: 600,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              <span
                                style={{
                                  color: T.text3,
                                  marginRight: 1,
                                  fontSize: 12,
                                }}
                              >
                                ₹
                              </span>
                              {Number(r["Pending Amt."]).toLocaleString(
                                "en-IN",
                              )}
                            </td>
                            <td
                              style={{
                                padding: "11px 16px",
                                textAlign: "center",
                              }}
                            >
                              <span style={{ ...badgePill, ...badge.style }}>
                                {badge.label}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "11px 16px",
                                textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  gap: 4,
                                  justifyContent: "center",
                                }}
                              >
                                <button
                                  onClick={() => confirmDeleteRow(r)}
                                  title="Delete entry"
                                  style={{ ...actionBtn }}
                                  onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                      "rgba(244,63,94,0.12)")
                                  }
                                  onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                      "transparent")
                                  }
                                >
                                  <X size={14} strokeWidth={1.5} aria-hidden="true" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      <tr
                        style={{
                          background: T.elevated,
                          borderTop: `1px solid color-mix(in srgb, ${T.gold} 25%, transparent)`,
                        }}
                      >
                        <td
                          colSpan={3}
                          style={{
                            padding: "12px 16px",
                            textAlign: "right",
                            color: T.text2,
                            fontWeight: 600,
                            fontSize: 12,
                            }}
                        >
                          Total · {filtered.length} records
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            textAlign: "right",
                            color: T.gold,
                            fontWeight: 600,
                            fontSize: 16,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              opacity: 0.7,
                              marginRight: 1,
                            }}
                          >
                            ₹
                          </span>
                          {total.toLocaleString("en-IN")}
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {filtered.length === 0 && data.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "64px 0",
                    color: T.text3,
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 15, color: T.text2 }}>
                    No data loaded yet
                  </p>
                  <p style={{ fontSize: 13, marginTop: 6 }}>
                    Upload an Excel file above to get started.
                  </p>
                </div>
              )}
              {filtered.length === 0 && data.length > 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "64px 0",
                    color: T.text3,
                  }}
                >
                  <p style={{ fontWeight: 600, fontSize: 15, color: T.text2 }}>
                    No records match your filters
                  </p>
                </div>
              )}
            </>
          )}

          {/* ══ TAB 2: ACCOUNT SUMMARY ══ */}
          {activeTab === "summary" && data.length === 0 && (
            <div
              style={{ textAlign: "center", padding: "64px 0", color: T.text3 }}
            >
              <p style={{ fontWeight: 600, fontSize: 15, color: T.text2 }}>
                No data loaded yet
              </p>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                Upload an Excel file above to get started.
              </p>
            </div>
          )}
          {activeTab === "summary" && data.length > 0 && (
            <div>
              {/* Sort pills */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 16,
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    color: T.text3,
                    fontSize: 12,
                    fontWeight: 600,
                    }}
                >
                  Sort by
                </span>
                {[
                  ["total", "Pending Amount"],
                  ["entries", "No. of Bills"],
                  ["maxDays", "Max Due Days"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSummarySort(key)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      border: `1px solid ${T.border}`,
                      background: summarySort === key ? T.gold : "transparent",
                      color: summarySort === key ? "#000" : T.text2,
                      transition: "all 0.15s",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Mobile-friendly account cards */}
              <div className="mobile-summary">
                {accountSummary.map((row, i) => {
                  const pct = ((row.total / grandTotal) * 100).toFixed(1);
                  const barW = Math.round((row.total / maxBar) * 100);
                  const isExpanded = expandedAccount === row.account;
                  const subRows = data
                    .filter((r) => r["Account"] === row.account)
                    .sort(
                      (a, b) => (b["Due Days"] ?? 0) - (a["Due Days"] ?? 0),
                    );
                  const badge = getDueBadge(row.maxDays);
                  return (
                    <div
                      className="mobile-summary-card"
                      key={`mobile-summary-${row.account}`}
                    >
                      <div
                        className="mobile-summary-main"
                        onClick={() =>
                          setExpandedAccount(isExpanded ? null : row.account)
                        }
                      >
                        <div className="mobile-card-row">
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="mobile-card-label">
                              #{i + 1} · Account
                            </div>
                            <div className="mobile-card-account">
                              {row.account}
                            </div>
                          </div>
                          <span
                            style={{
                              ...badgePill,
                              ...badge.style,
                              flexShrink: 0,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="mobile-summary-grid">
                          <div>
                            <div className="mobile-card-label">Bills</div>
                            <div className="mobile-card-value">
                              {row.entries}
                            </div>
                          </div>
                          <div>
                            <div className="mobile-card-label">Pending</div>
                            <div
                              className="mobile-card-value"
                              style={{ color: T.gold }}
                            >
                              ₹{row.total.toLocaleString("en-IN")}
                            </div>
                          </div>
                          <div>
                            <div className="mobile-card-label">Overdue</div>
                            <div
                              className="mobile-card-value"
                              style={{
                                color: row.overdueAmt ? T.critical : T.safe,
                              }}
                            >
                              {row.overdueAmt
                                ? `₹${row.overdueAmt.toLocaleString("en-IN")}`
                                : "—"}
                            </div>
                          </div>
                          <div>
                            <div className="mobile-card-label">Share</div>
                            <div className="mobile-card-value">{pct}%</div>
                          </div>
                        </div>
                        <div
                          style={{
                            marginTop: 10,
                            height: 4,
                            background: T.border,
                            borderRadius: 999,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${barW}%`,
                              height: "100%",
                              background: T.gold,
                              borderRadius: 999,
                            }}
                          />
                        </div>
                        <div
                          style={{ marginTop: 9, color: T.text3, fontSize: 12 }}
                        >
                          {isExpanded ? "▲ Hide bills" : "▼ Show bills"} · Tap
                          card to expand
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mobile-summary-expanded">
                          {subRows.map((r) => {
                            const sb = getDueBadge(r["Due Days"]);
                            return (
                              <div
                                className="mobile-sub-row"
                                key={`mobile-sub-${r._id}`}
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div
                                    className="mobile-card-value"
                                    style={{ fontFamily: "monospace" }}
                                  >
                                    {r["Ref. No."] || "—"}
                                  </div>
                                  <div
                                    style={{
                                      color: T.text3,
                                      fontSize: 12,
                                      marginTop: 4,
                                    }}
                                  >
                                    {r["Dated"] || "—"} · {r["Type"] || "—"} ·{" "}
                                    <span style={{ color: T.gold }}>
                                      ₹
                                      {Number(
                                        r["Pending Amt."] || 0,
                                      ).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                  <div style={{ marginTop: 6 }}>
                                    <span style={{ ...badgePill, ...sb.style }}>
                                      {sb.label}
                                    </span>
                                  </div>
                                </div>
                                <div className="mobile-sub-actions">
                                  <button
                                    onClick={() => confirmDeleteRow(r)}
                                    title="Delete entry"
                                    style={{ color: T.critical }}
                                  >
                                    <X size={14} strokeWidth={1.5} aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteAccount(row.account);
                            }}
                            style={{
                              width: "100%",
                              marginTop: 10,
                              padding: "9px 12px",
                              borderRadius: 8,
                              border: "1px solid rgba(244,63,94,.25)",
                              background: "transparent",
                              color: T.critical,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Delete all {row.entries} bills
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="mobile-summary-total">
                  <div className="mobile-card-label">
                    Grand Total · {accountSummary.length} accounts ·{" "}
                    {data.length} records
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      color: T.gold,
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    ₹{grandTotal.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              {/* Desktop Summary Table */}
              <div
                className="desktop-table"
                style={{ ...card, overflow: "hidden" }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr style={{ background: T.elevated }}>
                      {[
                        "#",
                        "Account Name",
                        "Bills",
                        "Total Pending",
                        "Overdue Amt.",
                        "Max Days",
                        "Share",
                        "Action",
                      ].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            padding: "11px 16px",
                            color: T.text3,
                            fontSize: 12,
                            fontWeight: 600,
                            borderBottom: `1px solid ${T.border}`,
                            textAlign:
                              i >= 2 && i <= 4
                                ? i === 2
                                  ? "center"
                                  : "right"
                                : i === 6
                                  ? "left"
                                  : i === 7
                                    ? "center"
                                    : "left",
                            minWidth: h === "Share" ? "130px" : "auto",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {accountSummary.map((row, i) => {
                      const pct = ((row.total / grandTotal) * 100).toFixed(1);
                      const barW = Math.round((row.total / maxBar) * 100);
                      const isExpanded = expandedAccount === row.account;
                      const subRows = data
                        .filter((r) => r["Account"] === row.account)
                        .sort((a, b) => b["Due Days"] - a["Due Days"]);
                      const badge = getDueBadge(row.maxDays);
                      return (
                        <>
                          <tr
                            key={row.account}
                            onClick={() =>
                              setExpandedAccount(
                                isExpanded ? null : row.account,
                              )
                            }
                            style={{
                              borderBottom: `1px solid ${T.border}`,
                              cursor: "pointer",
                              background: isExpanded
                                ? T.elevated
                                : "transparent",
                              transition: "background 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              if (!isExpanded)
                                e.currentTarget.style.background =
                                  "color-mix(in srgb, var(--wash) 2.0%, transparent)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = isExpanded
                                ? T.elevated
                                : "transparent";
                            }}
                          >
                            <td
                              style={{
                                padding: "12px 16px",
                                color: T.text3,
                                fontFamily: "monospace",
                                fontSize: 12,
                              }}
                            >
                              {i + 1}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                color: T.text1,
                                fontWeight: 600,
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <span
                                  style={{
                                    color: T.text3,
                                    fontSize: 12,
                                    display: "inline-block",
                                    transition: "transform 0.2s",
                                    transform: isExpanded
                                      ? "rotate(90deg)"
                                      : "rotate(0)",
                                  }}
                                >
                                  ▶
                                </span>
                                <span
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: 200,
                                  }}
                                  title={row.account}
                                >
                                  {row.account}
                                </span>
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <span
                                style={{
                                  background: "color-mix(in srgb, var(--wash) 6.0%, transparent)",
                                  color: T.text2,
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {row.entries}
                              </span>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "right",
                                color: T.text1,
                                fontWeight: 600,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              <span
                                style={{
                                  color: T.text3,
                                  fontSize: 12,
                                  marginRight: 1,
                                }}
                              >
                                ₹
                              </span>
                              {row.total.toLocaleString("en-IN")}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "right",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {row.overdueAmt > 0 ? (
                                <span
                                  style={{ color: T.critical, fontWeight: 600 }}
                                >
                                  <span
                                    style={{
                                      fontSize: 12,
                                      opacity: 0.7,
                                      marginRight: 1,
                                    }}
                                  >
                                    ₹
                                  </span>
                                  {row.overdueAmt.toLocaleString("en-IN")}
                                </span>
                              ) : (
                                <span style={{ color: T.safe, fontSize: 12 }}>
                                  —
                                </span>
                              )}
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                            >
                              <span style={{ ...badgePill, ...badge.style }}>
                                {badge.label}
                              </span>
                            </td>
                            <td style={{ padding: "12px 16px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                }}
                              >
                                <div
                                  style={{
                                    flex: 1,
                                    background: T.border,
                                    borderRadius: 999,
                                    height: 4,
                                    minWidth: 80,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${barW}%`,
                                      height: 4,
                                      borderRadius: 999,
                                      background: T.gold,
                                      transition: "width 0.3s",
                                    }}
                                  />
                                </div>
                                <span
                                  style={{
                                    color: T.text3,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    width: 38,
                                    textAlign: "right",
                                    flexShrink: 0,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {pct}%
                                </span>
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "12px 16px",
                                textAlign: "center",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() =>
                                  confirmDeleteAccount(row.account)
                                }
                                style={{
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: T.critical,
                                  border: `1px solid rgba(244,63,94,0.25)`,
                                  background: "transparent",
                                  cursor: "pointer",
                                }}
                              >
                                All
                              </button>
                            </td>
                          </tr>
                          {isExpanded &&
                            subRows.map((r, j) => {
                              const sb = getDueBadge(r["Due Days"]);
                              return (
                                <tr
                                  key={`${row.account}-${j}`}
                                  style={{
                                    background: T.elevated,
                                    borderBottom: `1px solid ${T.border}`,
                                  }}
                                >
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      color: T.text3,
                                    }}
                                  >
                                    └
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      color: T.text3,
                                      fontFamily: "monospace",
                                      fontSize: 12,
                                      paddingLeft: 32,
                                    }}
                                  >
                                    {r["Ref. No."]}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      textAlign: "center",
                                      color: T.text3,
                                      fontSize: 12,
                                    }}
                                  >
                                    {r["Dated"]}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      textAlign: "right",
                                      color: T.text2,
                                      fontWeight: 600,
                                      fontSize: 12,
                                      fontVariantNumeric: "tabular-nums",
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 12,
                                        opacity: 0.7,
                                        marginRight: 1,
                                      }}
                                    >
                                      ₹
                                    </span>
                                    {Number(r["Pending Amt."]).toLocaleString(
                                      "en-IN",
                                    )}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      textAlign: "right",
                                      color: T.text3,
                                      fontSize: 12,
                                    }}
                                  >
                                    {r["Type"]}
                                  </td>
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <span style={{ ...badgePill, ...sb.style }}>
                                      {sb.label}
                                    </span>
                                  </td>
                                  <td />
                                  <td
                                    style={{
                                      padding: "8px 16px",
                                      textAlign: "center",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 4,
                                        justifyContent: "center",
                                      }}
                                    >
                                      <button
                                        onClick={() => confirmDeleteRow(r)}
                                        style={{ ...actionBtn }}
                                        onMouseEnter={(e) =>
                                          (e.currentTarget.style.background =
                                            "rgba(244,63,94,0.12)")
                                        }
                                        onMouseLeave={(e) =>
                                          (e.currentTarget.style.background =
                                            "transparent")
                                        }
                                      >
                                        <X size={14} strokeWidth={1.5} aria-hidden="true" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </>
                      );
                    })}
                    <tr
                      style={{
                        background: T.elevated,
                        borderTop: `1px solid color-mix(in srgb, ${T.gold} 25%, transparent)`,
                      }}
                    >
                      <td
                        colSpan={2}
                        style={{
                          padding: "13px 16px",
                          color: T.text2,
                          fontWeight: 600,
                          fontSize: 12,
                          }}
                      >
                        Grand Total · {accountSummary.length} accounts
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          textAlign: "center",
                          color: T.text2,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {data.length}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          textAlign: "right",
                          color: T.gold,
                          fontWeight: 600,
                          fontSize: 16,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        <span
                          style={{ fontSize: 12, opacity: 0.7, marginRight: 1 }}
                        >
                          ₹
                        </span>
                        {grandTotal.toLocaleString("en-IN")}
                      </td>
                      <td
                        style={{
                          padding: "13px 16px",
                          textAlign: "right",
                          color: T.critical,
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        <span
                          style={{ fontSize: 12, opacity: 0.7, marginRight: 1 }}
                        >
                          ₹
                        </span>
                        {data
                          .filter((r) => r["Due Days"] > 0)
                          .reduce((s, r) => s + (r["Pending Amt."] || 0), 0)
                          .toLocaleString("en-IN")}
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
