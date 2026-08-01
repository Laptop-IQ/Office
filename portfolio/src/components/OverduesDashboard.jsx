import { useState, useEffect, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  pageBg: "#06090F",
  card: "#0B1120",
  elevated: "#101828",
  border: "#1A2640",
  borderHi: "#2A3C60",
  gold: "#D4A017",
  goldDim: "#8A6A08",
  goldGlow: "rgba(212,160,23,0.18)",
  text1: "#E8EDF8",
  text2: "#8895AE",
  text3: "#475569",
  critical: "#F43F5E",
  urgent: "#F97316",
  warning: "#EAB308",
  info: "#3B82F6",
  safe: "#10B981",
  dangerBg: "rgba(244,63,94,0.08)",
  urgentBg: "rgba(249,115,22,0.08)",
  warnBg: "rgba(234,179,8,0.08)",
  infoBg: "rgba(59,130,246,0.08)",
  safeBg: "rgba(16,185,129,0.08)",
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

// SIGNATURE: urgency-scaled glow — the more overdue, the brighter the badge aura
const getDueBadge = (days) => {
  if (days === null || days === undefined || isNaN(days))
    return {
      label: "—",
      style: {
        background: "rgba(255,255,255,0.04)",
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
        border: `1px solid rgba(244,63,94,0.35)`,
        boxShadow:
          "0 0 12px rgba(244,63,94,0.40), 0 0 4px rgba(244,63,94,0.30)",
      },
    };
  if (days > 90)
    return {
      label: `${days}d`,
      style: {
        background: T.urgentBg,
        color: T.urgent,
        border: `1px solid rgba(249,115,22,0.35)`,
        boxShadow:
          "0 0 10px rgba(249,115,22,0.30), 0 0 3px rgba(249,115,22,0.25)",
      },
    };
  if (days > 30)
    return {
      label: `${days}d`,
      style: {
        background: T.warnBg,
        color: T.warning,
        border: `1px solid rgba(234,179,8,0.35)`,
        boxShadow: "0 0 8px rgba(234,179,8,0.20)",
      },
    };
  if (days > 0)
    return {
      label: `${days}d`,
      style: {
        background: T.infoBg,
        color: T.info,
        border: `1px solid rgba(59,130,246,0.30)`,
      },
    };
  return {
    label: `${Math.abs(days)}d ahead`,
    style: {
      background: T.safeBg,
      color: T.safe,
      border: `1px solid rgba(16,185,129,0.30)`,
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
      backdropFilter: "blur(4px)",
    }}
  >
    <div
      style={{
        ...card,
        padding: 28,
        maxWidth: 380,
        width: "100%",
        margin: "0 16px",
        boxShadow: `0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px ${T.borderHi}`,
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
        <span style={{ fontSize: 22, lineHeight: 1 }}>🗑️</span>
        <p style={{ color: T.text1, fontWeight: 700, fontSize: 15 }}>
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

// ── Payment Modal ──────────────────────────────────────────────────────────
const PaymentModal = ({ row, onConfirm, onCancel }) => {
  const [amount, setAmount] = useState("");
  const pending = row["Pending Amt."] || 0;
  const entered = Number(amount) || 0;
  const remaining = Math.max(0, pending - entered);
  const overpaid = entered > pending;
  const clearsFully = entered > 0 && remaining === 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          ...card,
          padding: 28,
          maxWidth: 380,
          width: "100%",
          margin: "0 16px",
          boxShadow: `0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px ${T.borderHi}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 22 }}>💰</span>
          <p style={{ color: T.text1, fontWeight: 700, fontSize: 15 }}>
            Record Payment
          </p>
        </div>
        <p
          style={{
            color: T.text1,
            fontWeight: 600,
            fontSize: 13,
            marginTop: 12,
          }}
        >
          {row["Account"]}
        </p>
        <p
          style={{
            color: T.text3,
            fontSize: 11,
            fontFamily: "monospace",
            marginBottom: 16,
          }}
        >
          {row["Ref. No."]}
        </p>

        <div
          style={{
            background: T.elevated,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            border: `1px solid ${T.border}`,
          }}
        >
          <span style={{ color: T.text2, fontSize: 12 }}>
            Currently Pending
          </span>
          <span
            style={{
              color: T.gold,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              fontSize: 15,
            }}
          >
            {fmt(pending)}
          </span>
        </div>

        <p
          style={{
            color: T.text2,
            fontSize: 11,
            fontWeight: 600,
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Amount Received
        </p>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: T.text3,
              fontSize: 13,
            }}
          >
            ₹
          </span>
          <input
            type="number"
            inputMode="decimal"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            style={{
              ...inputStyle,
              paddingLeft: 28,
              boxShadow: `0 0 0 1px ${T.border}`,
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = `0 0 0 2px ${T.gold}40`;
              e.target.style.borderColor = T.gold;
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = `0 0 0 1px ${T.border}`;
              e.target.style.borderColor = T.border;
            }}
          />
        </div>

        {entered > 0 && (
          <p
            style={{
              fontSize: 12,
              marginTop: 8,
              color: overpaid ? T.warning : clearsFully ? T.safe : T.text2,
            }}
          >
            {overpaid
              ? `That's ${fmt(entered - pending)} over — entry will be cleared.`
              : clearsFully
                ? "Full payment — entry will be removed from overdue list."
                : `Remaining: ${fmt(remaining)}`}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 20,
          }}
        >
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
            onClick={() => entered > 0 && onConfirm(entered)}
            disabled={entered <= 0}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: entered > 0 ? "rgba(16,185,129,0.15)" : T.elevated,
              color: entered > 0 ? T.safe : T.text3,
              fontSize: 13,
              fontWeight: 600,
              cursor: entered > 0 ? "pointer" : "not-allowed",
              boxShadow:
                entered > 0 ? "inset 0 0 0 1px rgba(16,185,129,0.4)" : "none",
            }}
          >
            Confirm Payment
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────
export default function App() {
  const [_boot] = useState(() => lsGet(STORAGE_KEY));
  const [data, setData] = useState(() =>
    Array.isArray(_boot?.data) && _boot.data.length > 0
      ? refreshDueDays(_boot.data)
      : [],
  );
  const [deletedRefs, setDeletedRefs] = useState(
    () => new Set(_boot?.deletedRefs || []),
  );
  const [overrides, setOverrides] = useState(() => _boot?.overrides || {});
  const [fileName, setFileName] = useState(() => _boot?.fileName || "");
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
  const [paymentRow, setPaymentRow] = useState(null);
  const [storageSaving, setStorageSaving] = useState(false);
  const [storageSavedAt, setStorageSavedAt] = useState(() =>
    _boot?.savedAt ? new Date(_boot.savedAt) : null,
  );
  const [storageError, setStorageError] = useState("");
  const saveTimerRef = useRef(null);
  const storageReadyRef = useRef(false);
  const fileRef = useRef();

  useEffect(() => {
    storageReadyRef.current = true;
  }, []);

  useEffect(() => {
    if (!storageReadyRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setStorageSaving(true);
      setStorageError("");
      const now = new Date().toISOString();
      const ok = lsSet(STORAGE_KEY, {
        data,
        deletedRefs: [...deletedRefs],
        overrides,
        fileName,
        savedAt: now,
      });
      if (ok) setStorageSavedAt(new Date(now));
      else
        setStorageError(
          "Auto-save failed — storage full? Use 💾 Excel to back up.",
        );
      setStorageSaving(false);
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [data, deletedRefs, overrides, fileName]);

  const handleFile = useCallback(
    async (file) => {
      if (!file) return;
      setUploading(true);
      setParseErr("");
      try {
        const parsed = await parseXLSX(file);
        if (!parsed.length) throw new Error("No data rows found.");
        setData(applyAdjustments(parsed, deletedRefs, overrides));
        setFileName(file.name);
      } catch (e) {
        setParseErr("Parse failed: " + (e.message || "Unknown error"));
      }
      setUploading(false);
    },
    [deletedRefs, overrides],
  );

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };
  const handleSaveToFile = () => exportToXLSX(data, fileName);
  const handleClearStorage = () => {
    if (
      !window.confirm(
        "Clear all saved data?\n\nDownload an Excel backup first if needed.",
      )
    )
      return;
    lsDel(STORAGE_KEY);
    setData([]);
    setDeletedRefs(new Set());
    setOverrides({});
    setFileName("");
    setStorageSavedAt(null);
    setStorageError("");
  };

  const confirmDeleteRow = (row) => {
    setConfirmModal({
      message: `Delete "${row["Ref. No."]}" for ${row["Account"]}?`,
      onConfirm: () => {
        const ref = row["Ref. No."];
        const nextOverrides = { ...overrides };
        delete nextOverrides[ref];
        setData(data.filter((r) => r._id !== row._id));
        setDeletedRefs(new Set(deletedRefs).add(ref));
        setOverrides(nextOverrides);
        setConfirmModal(null);
      },
    });
  };

  const confirmDeleteAccount = (acctName) => {
    const acctRows = data.filter((r) => r["Account"] === acctName);
    const total = acctRows.reduce((s, r) => s + (r["Pending Amt."] || 0), 0);
    setConfirmModal({
      message: `Delete all ${acctRows.length} entries for "${acctName}" totalling ${fmt(total)}?`,
      onConfirm: () => {
        const nextDeleted = new Set(deletedRefs);
        const nextOverrides = { ...overrides };
        acctRows.forEach((r) => {
          nextDeleted.add(r["Ref. No."]);
          delete nextOverrides[r["Ref. No."]];
        });
        setData(data.filter((r) => r["Account"] !== acctName));
        setDeletedRefs(nextDeleted);
        setOverrides(nextOverrides);
        if (expandedAccount === acctName) setExpandedAccount(null);
        setConfirmModal(null);
      },
    });
  };

  const handleRecordPayment = (amountReceived) => {
    const row = paymentRow;
    if (!row) return;
    const ref = row["Ref. No."];
    const newPending = Math.max(0, (row["Pending Amt."] || 0) - amountReceived);
    const clearedFully = newPending <= 0;
    const next = clearedFully
      ? data.filter((r) => r._id !== row._id)
      : data.map((r) =>
          r._id === row._id ? { ...r, "Pending Amt.": newPending } : r,
        );
    const nextDeleted = new Set(deletedRefs);
    const nextOverrides = { ...overrides };
    if (clearedFully) {
      nextDeleted.add(ref);
      delete nextOverrides[ref];
    } else {
      nextOverrides[ref] = newPending;
    }
    setData(next);
    setDeletedRefs(nextDeleted);
    setOverrides(nextOverrides);
    setPaymentRow(null);
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
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.02em",
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.pageBg,
        fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        color: T.text1,
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }}
    >
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      {paymentRow && (
        <PaymentModal
          row={paymentRow}
          onConfirm={handleRecordPayment}
          onCancel={() => setPaymentRow(null)}
        />
      )}

      {/* ── HEADER ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(6,9,15,0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div
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
                fontWeight: 800,
                letterSpacing: "-0.02em",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span style={{ fontSize: 18 }}>📊</span>
              <span style={{ color: T.gold }}>SF</span>
              <span style={{ color: T.text1 }}>&nbsp;Overdues</span>
            </h1>
            <p
              style={{
                color: T.text3,
                fontSize: 11,
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
                  <span style={{ color: T.info }}>🔄 Saving…</span>
                ) : storageError ? (
                  <span style={{ color: T.warning }}>⚠ {storageError}</span>
                ) : storageSavedAt ? (
                  <span style={{ color: T.safe }}>
                    ✓ Saved{" "}
                    {storageSavedAt.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : data.length === 0 ? (
                  <span style={{ color: T.text3 }}>
                    Upload an Excel file to begin
                  </span>
                ) : null}
              </span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
              💾 <span>Excel</span>
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
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: `0 0 16px ${T.goldGlow}`,
              }}
            >
              ⬇ <span>PDF</span>
            </button>
          </div>
        </div>
      </header>

      <div
        style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 24px 48px" }}
      >
        {/* ── UPLOAD ZONE ── */}
        <div
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
            background: dragOver ? `rgba(212,160,23,0.05)` : T.card,
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
            {uploading ? "⏳" : "📂"}
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ color: T.text1, fontWeight: 600, fontSize: 14 }}>
              {uploading ? "Processing…" : "Upload Excel File"}
            </p>
            <p style={{ color: T.text3, fontSize: 12, marginTop: 2 }}>
              Click or drag & drop — data saves automatically to this browser
            </p>
          </div>
          {data.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearStorage();
              }}
              style={{
                fontSize: 11,
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
                borderTop: `2px solid ${color}`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 12,
                  right: 14,
                  fontSize: 18,
                  opacity: 0.08,
                  fontWeight: 900,
                  color,
                }}
              >
                {icon}
              </div>
              <p
                style={{
                  color: T.text3,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {lbl}
              </p>
              <p
                style={{
                  color,
                  fontSize: 22,
                  fontWeight: 800,
                  marginTop: 6,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: "-0.01em",
                }}
              >
                {val}
              </p>
              <p style={{ color: T.text3, fontSize: 11, marginTop: 4 }}>
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: `1px solid ${T.border}`,
            marginBottom: 20,
          }}
        >
          {[
            ["detail", "📋  Detail View"],
            ["summary", "📊  Account Summary"],
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
                fontWeight: 700,
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
                  🔍
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

            {/* Desktop Table */}
            <div
              className="hidden sm:block"
              style={{ ...card, overflow: "hidden" }}
            >
              <div style={{ overflowX: "auto" }}>
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
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
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
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
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
                                : "rgba(255,255,255,0.012)",
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
                                : "rgba(255,255,255,0.012)")
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
                              fontSize: 11,
                            }}
                          >
                            {r["Ref. No."]}
                          </td>
                          <td
                            style={{
                              padding: "11px 16px",
                              textAlign: "right",
                              color: T.text1,
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            <span
                              style={{
                                color: T.text3,
                                marginRight: 1,
                                fontSize: 11,
                              }}
                            >
                              ₹
                            </span>
                            {Number(r["Pending Amt."]).toLocaleString("en-IN")}
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
                                onClick={() => setPaymentRow(r)}
                                title="Record payment"
                                style={{ ...actionBtn }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.background =
                                    "rgba(16,185,129,0.12)")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.background =
                                    "transparent")
                                }
                              >
                                💰
                              </button>
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
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    <tr
                      style={{
                        background: `rgba(212,160,23,0.05)`,
                        borderTop: `1px solid ${T.gold}40`,
                      }}
                    >
                      <td
                        colSpan={3}
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          color: T.text2,
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        Total · {filtered.length} records
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          color: T.gold,
                          fontWeight: 800,
                          fontSize: 16,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        <span
                          style={{ fontSize: 12, opacity: 0.7, marginRight: 1 }}
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
                <p style={{ fontSize: 40, marginBottom: 12 }}>📂</p>
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
                <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
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
            <p style={{ fontSize: 40, marginBottom: 12 }}>📂</p>
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
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
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

            {/* Desktop Summary Table */}
            <div
              className="hidden sm:block"
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
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
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
                            setExpandedAccount(isExpanded ? null : row.account)
                          }
                          style={{
                            borderBottom: `1px solid ${T.border}`,
                            cursor: "pointer",
                            background: isExpanded ? T.elevated : "transparent",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            if (!isExpanded)
                              e.currentTarget.style.background =
                                "rgba(255,255,255,0.02)";
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
                              fontSize: 11,
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
                                  fontSize: 10,
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
                                background: "rgba(255,255,255,0.06)",
                                color: T.text2,
                                padding: "2px 8px",
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
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
                              fontWeight: 700,
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            <span
                              style={{
                                color: T.text3,
                                fontSize: 11,
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
                                    fontSize: 11,
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
                                    background: `linear-gradient(90deg,${T.gold}99,${T.gold})`,
                                    transition: "width 0.3s",
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  color: T.text3,
                                  fontSize: 11,
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
                              onClick={() => confirmDeleteAccount(row.account)}
                              style={{
                                padding: "4px 10px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                color: T.critical,
                                border: `1px solid rgba(244,63,94,0.25)`,
                                background: "transparent",
                                cursor: "pointer",
                              }}
                            >
                              ✕ All
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
                                  background: `rgba(212,160,23,0.03)`,
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
                                    fontSize: 11,
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
                                    fontSize: 11,
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
                                      fontSize: 10,
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
                                    fontSize: 11,
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
                                      onClick={() => setPaymentRow(r)}
                                      style={{ ...actionBtn }}
                                      onMouseEnter={(e) =>
                                        (e.currentTarget.style.background =
                                          "rgba(16,185,129,0.12)")
                                      }
                                      onMouseLeave={(e) =>
                                        (e.currentTarget.style.background =
                                          "transparent")
                                      }
                                    >
                                      💰
                                    </button>
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
                                      ✕
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
                      background: `rgba(212,160,23,0.05)`,
                      borderTop: `1px solid ${T.gold}40`,
                    }}
                  >
                    <td
                      colSpan={2}
                      style={{
                        padding: "13px 16px",
                        color: T.text2,
                        fontWeight: 700,
                        fontSize: 12,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      Grand Total · {accountSummary.length} accounts
                    </td>
                    <td
                      style={{
                        padding: "13px 16px",
                        textAlign: "center",
                        color: T.text2,
                        fontWeight: 700,
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
                        fontWeight: 800,
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
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      <span
                        style={{ fontSize: 11, opacity: 0.7, marginRight: 1 }}
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
  );
}
