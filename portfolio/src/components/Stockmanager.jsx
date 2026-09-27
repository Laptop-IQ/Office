import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  API_BASE,
  apiHeaders,
  getToken,
  getUserIdFromToken,
  CATEGORIES,
  getCategory,
  TABS,
  ALL_COLUMNS,
  LOCKED_COLS,
  EMPTY_PRODUCT,
  SEED,
  genId,
  nowStr,
  todayStr,
  detectColumns,
} from "./shared";
import DispatchTab from "./DispatchTab";

// ── Design tokens (matches SF Overdues theme) ───────────────────────────────
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

const card = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
};
const inputStyle = (focusColor) => ({
  background: T.elevated,
  border: `1px solid ${T.border}`,
  color: T.text1,
  borderRadius: 8,
  padding: "9px 14px",
  fontSize: 13,
  outline: "none",
  width: "100%",
});
const smBtn = (bg, color, border) => ({
  padding: "8px 14px",
  borderRadius: 8,
  border: border || "none",
  background: bg,
  color,
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  whiteSpace: "nowrap",
});
const rowBtn = (bg, color, border) => ({
  padding: "4px 10px",
  borderRadius: 6,
  border: border || "none",
  background: bg,
  color,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
});
const td = (align) => ({
  padding: "11px 14px",
  textAlign: align || "left",
  verticalAlign: "top",
});
const badgePill = {
  display: "inline-flex",
  alignItems: "center",
  padding: "3px 10px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.02em",
};

// status → badge style (urgency-scaled glow, consistent with overdues theme)
const statusBadge = (isZero, isLow) => {
  if (isZero)
    return {
      label: "OUT",
      style: {
        background: T.dangerBg,
        color: T.critical,
        border: "1px solid rgba(244,63,94,0.35)",
        boxShadow: "0 0 10px rgba(244,63,94,0.35)",
      },
    };
  if (isLow)
    return {
      label: "LOW",
      style: {
        background: T.warnBg,
        color: T.warning,
        border: "1px solid rgba(234,179,8,0.35)",
        boxShadow: "0 0 8px rgba(234,179,8,0.20)",
      },
    };
  return {
    label: "OK",
    style: {
      background: T.safeBg,
      color: T.safe,
      border: "1px solid rgba(16,185,129,0.30)",
    },
  };
};

// ── Local FormField (replaces shared.js styling dependency) ─────────────────
const FormField = ({ label, children }) => (
  <div style={{ marginBottom: 4 }}>
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
      {label}
    </p>
    {children}
  </div>
);

const EMPTY_PRODUCT_PKG = {
  ...EMPTY_PRODUCT,
  packageSize: "",
  packageCount: "",
};

const computePkgQty = (packageSize, packageCount) => {
  const size = parseInt(packageSize, 10);
  const count = parseInt(packageCount, 10);
  if (
    packageSize !== "" &&
    !isNaN(size) &&
    size > 0 &&
    packageCount !== "" &&
    !isNaN(count) &&
    count >= 0
  ) {
    return size * count;
  }
  return null;
};
const isPkgTracked = (row) =>
  !!row && computePkgQty(row.packageSize, row.packageCount) !== null;

/* ── Permanent localStorage storage ──────────────────────────────────────── */
const lsKey = () => `chem_stock_app_v1_${getUserIdFromToken() || "anon"}`;
const lsLoad = () => {
  try {
    const raw = localStorage.getItem(lsKey());
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d?.stocks ? d : null;
  } catch {
    return null;
  }
};
const lsSave = (d) => {
  try {
    localStorage.setItem(lsKey(), JSON.stringify(d));
    return true;
  } catch (e) {
    console.warn("localStorage full?", e);
    return false;
  }
};
const lsClear = () => {
  try {
    localStorage.removeItem(lsKey());
  } catch {}
};

/* ── Backend API ──────────────────────────────────────────────────────────── */
const loadData = async () => {
  const local = lsLoad();
  const token = getToken();
  if (!token) return { authError: true };
  try {
    const res = await fetch(API_BASE, { headers: apiHeaders() });
    if (res.status === 401) return { authError: true };
    if (!res.ok)
      return local ? { ...local, offline: true } : { loadFailed: true };
    const remote = await res.json();
    if (!remote?.stocks)
      return local ? { ...local, offline: true } : { loadFailed: true };
    if (local?.savedAt && remote.updatedAt) {
      return local.savedAt > new Date(remote.updatedAt).getTime()
        ? local
        : remote;
    }
    return remote;
  } catch {
    return local ? { ...local, offline: true } : { loadFailed: true };
  }
};
const clearRemoteData = async () => {
  lsClear();
  try {
    await fetch(API_BASE, { method: "DELETE", headers: apiHeaders() });
  } catch {}
};

/* ── PDF export (kept print-white for readability, dark accents) ──────────── */
const exportPDF = (
  stocks,
  tab,
  tabLabel,
  filterLow = false,
  catFilter = "ALL",
  customTitle = null,
) => {
  let data = filterLow
    ? Object.entries(stocks).flatMap(([t, ps]) =>
        ps
          .filter((p) => p.qty <= p.minQty)
          .map((p) => ({ ...p, _tab: TABS.find((x) => x.id === t)?.label })),
      )
    : (stocks[tab] || []).filter((p) =>
        catFilter === "ALL"
          ? true
          : (p.category || getCategory(p.name)) === catFilter,
      );

  const title =
    customTitle ||
    (filterLow
      ? "Low Stock Report — All Locations"
      : `${tabLabel} · ${catFilter !== "ALL" ? CATEGORIES[catFilter]?.label || catFilter : "All Categories"}`);

  const totalQty = data.reduce((s, p) => s + (p.qty || 0), 0);
  const lowCount = data.filter((p) => p.qty <= p.minQty).length;
  const outCount = data.filter((p) => p.qty === 0).length;

  const rows = data
    .map((p, i) => {
      const isLow = p.qty <= p.minQty,
        isZero = p.qty === 0;
      const cat = CATEGORIES[p.category || getCategory(p.name)];
      const sc = isZero ? "#DC2626" : isLow ? "#D97706" : "#059669";
      const st = isZero ? "OUT OF STOCK" : isLow ? "LOW" : "OK";
      return `<tr style="background:${i % 2 === 0 ? "#fff" : "#F9FAFB"}">
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;color:#6B7280">${i + 1}</td>
      ${filterLow ? `<td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:11px">${p._tab || ""}</td>` : ""}
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;font-weight:600;color:#111">${p.name}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;text-align:center">
        <span style="background:${cat?.bg || "#F3F4F6"};color:${cat?.color || "#555"};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">${cat?.label || p.category || ""}</span>
      </td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;font-weight:700;text-align:center;color:${sc}">${p.qty} ${p.unit || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:10px;text-align:center;color:#6B7280">${isPkgTracked(p) ? `${p.packageCount} × ${p.packageSize}${p.unit || ""}` : "—"}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;text-align:center;color:#6B7280">${p.minQty} ${p.unit || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;text-align:center">
        <span style="background:${isZero ? "#FEE2E2" : isLow ? "#FEF3C7" : "#D1FAE5"};color:${sc};padding:2px 8px;border-radius:10px;font-weight:700;font-size:10px">${st}</span>
      </td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:10px;color:#DC2626">${p.reorderNote || ""}</td>
    </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>@media print{body{margin:0}.no-print{display:none}}body{font-family:Arial,sans-serif;margin:0;padding:20px}table{width:100%;border-collapse:collapse}th{padding:9px 10px;background:#0F172A;color:#fff;font-size:10px;text-transform:uppercase;letter-spacing:.05em;text-align:left}.sb{display:inline-block;padding:10px 20px;border-radius:8px;margin-right:10px;margin-bottom:16px}</style>
    </head><body>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #0F172A">
      <div><div style="font-size:22px;font-weight:900;color:#0F172A">⚗ Chemical Stock Report</div>
      <div style="font-size:13px;color:#555;margin-top:4px">${title} · Generated: ${new Date().toLocaleString("en-IN")}</div></div>
    </div>
    <div style="margin-bottom:16px">
      <div class="sb" style="background:#EFF6FF;color:#1D4ED8"><strong style="font-size:20px">${data.length}</strong><br><span style="font-size:11px">Total Products</span></div>
      <div class="sb" style="background:#ECFDF5;color:#065F46"><strong style="font-size:20px">${totalQty}</strong><br><span style="font-size:11px">Total Quantity</span></div>
      <div class="sb" style="background:#FEF3C7;color:#92400E"><strong style="font-size:20px">${lowCount}</strong><br><span style="font-size:11px">Low Stock</span></div>
      <div class="sb" style="background:#FEE2E2;color:#991B1B"><strong style="font-size:20px">${outCount}</strong><br><span style="font-size:11px">Out of Stock</span></div>
    </div>
    <button class="no-print" onclick="window.print()" style="margin-bottom:16px;padding:8px 20px;background:#0F172A;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">🖨 Print / Save PDF</button>
    <table><thead><tr><th>#</th>${filterLow ? "<th>Location</th>" : ""}<th>Product Name</th><th>Category</th><th>Qty</th><th>Package</th><th>Min Qty</th><th>Status</th><th>Reorder Note</th></tr></thead>
    <tbody>${rows}</tbody></table></body></html>`;

  const w = window.open("", "_blank", "width=1100,height=800");
  w.document.write(html);
  w.document.close();
};

/* ── Shared Confirm Modal ─────────────────────────────────────────────────── */
const ConfirmModal = ({
  icon,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  danger = true,
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 202,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(4px)",
      padding: 20,
    }}
  >
    <div
      style={{
        ...card,
        padding: 28,
        maxWidth: 360,
        width: "100%",
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
        <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
        <p style={{ color: T.text1, fontWeight: 700, fontSize: 15 }}>{title}</p>
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
            background: danger
              ? "rgba(244,63,94,0.15)"
              : "rgba(16,185,129,0.15)",
            color: danger ? T.critical : T.safe,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: `inset 0 0 0 1px ${danger ? "rgba(244,63,94,0.4)" : "rgba(16,185,129,0.4)"}`,
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function ChemicalStockManager() {
  const [stocks, setStocksRaw] = useState(SEED);
  const [dispatches, setDispatches] = useState([]);
  const [changeLog, setChangeLog] = useState([]);
  const [lastUpdated, setLastUpdated] = useState({});
  const [companyName, setCompanyName] = useState("My Chemical Store");
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncState, setSyncState] = useState("idle");

  const [activeTab, setActiveTab] = useState("sample");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [newRow, setNewRow] = useState(EMPTY_PRODUCT_PKG);
  const [toastMsg, setToastMsg] = useState(null);
  const [importMode, setImportMode] = useState("manual");
  const [confirmDel, setConfirmDel] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showColPicker, setShowColPicker] = useState(false);
  const [visibleCols, setVisibleCols] = useState(
    ALL_COLUMNS.filter((c) => c.default).map((c) => c.id),
  );

  const fileRef = useRef();
  const colPickerRef = useRef();
  const importJSONRef = useRef();
  const dispatchTabRef = useRef();

  const toast = useCallback((msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3200);
  }, []);

  useEffect(() => {
    (async () => {
      const saved = await loadData();
      if (saved?.authError) {
        toast("Session expired — please login again", "error");
        window.location.href = "/login";
        return;
      }
      if (saved?.loadFailed) {
        toast("Server se connect nahi ho paya — retry karein", "error");
        setSyncState("load-error");
        return;
      }
      setStocksRaw(saved.stocks || SEED);
      setChangeLog(saved.changeLog || []);
      setLastUpdated(saved.lastUpdated || {});
      setCompanyName(saved.companyName || "My Chemical Store");
      setDispatches(saved.dispatches || []);
      if (saved.offline)
        toast("⚠ Offline — local data se chal rahe hain", "error");
      setIsLoaded(true);
    })();
  }, [toast]);

  useEffect(() => {
    if (!isLoaded) return;
    const payload = {
      stocks,
      changeLog,
      lastUpdated,
      companyName,
      dispatches,
      savedAt: Date.now(),
    };
    const ok = lsSave(payload);
    setSyncState(ok ? "saving" : "error");
    const t = setTimeout(async () => {
      try {
        const res = await fetch(API_BASE, {
          method: "PUT",
          headers: apiHeaders(),
          body: JSON.stringify(payload),
        });
        if (res.status === 401) {
          setSyncState("auth-error");
          return;
        }
        setSyncState(res.ok ? "synced" : "remote-error");
      } catch {
        setSyncState("remote-error");
      }
    }, 800);
    return () => clearTimeout(t);
  }, [stocks, changeLog, lastUpdated, companyName, dispatches, isLoaded]);

  useEffect(() => {
    const h = (e) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target))
        setShowColPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const setStocks = useCallback(
    (u) => setStocksRaw((p) => (typeof u === "function" ? u(p) : u)),
    [],
  );

  const logAction = (action, tab, details) => {
    const entry = { id: genId(), action, tab, details, time: nowStr() };
    setChangeLog((p) => [entry, ...p].slice(0, 200));
    setLastUpdated((p) => ({ ...p, [tab]: nowStr() }));
  };

  const exportDataJSON = () => {
    const payload = { stocks, changeLog, lastUpdated, companyName, dispatches };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chemical_stock_backup_${todayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup file download ho gayi ✓");
  };

  const importDataJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const d = JSON.parse(evt.target.result);
        if (!d?.stocks)
          return toast("Invalid backup file — stocks nahi mili", "error");
        setStocksRaw(d.stocks || SEED);
        setChangeLog(d.changeLog || []);
        setLastUpdated(d.lastUpdated || {});
        setCompanyName(d.companyName || "My Chemical Store");
        setDispatches(d.dispatches || []);
        toast("Data restore ho gaya ✓");
      } catch {
        toast("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const current = stocks[activeTab] || [];
  const tabLabel = TABS.find((t) => t.id === activeTab)?.label || "";
  const totalLow = Object.values(stocks)
    .flat()
    .filter((p) => p.qty <= p.minQty).length;

  const catCounts = {},
    catLowCounts = {};
  current.forEach((p) => {
    const cat = p.category || getCategory(p.name);
    catCounts[cat] = (catCounts[cat] || 0) + 1;
    if (p.qty <= p.minQty) catLowCounts[cat] = (catLowCounts[cat] || 0) + 1;
  });

  const filtered = current.filter((p) => {
    const ms =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.batch || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier || "").toLowerCase().includes(search.toLowerCase());
    const ml = showLowOnly ? p.qty <= p.minQty : true;
    const mc =
      catFilter === "ALL"
        ? true
        : (p.category || getCategory(p.name)) === catFilter;
    return ms && ml && mc;
  });

  const handleAdd = () => {
    if (!newRow.name.trim()) return toast("Product name required", "error");
    const p = {
      ...newRow,
      id: genId(),
      qty: parseInt(newRow.qty) || 0,
      minQty: parseInt(newRow.minQty) || 0,
      category: newRow.category || getCategory(newRow.name),
      packageSize:
        newRow.packageSize !== "" ? parseInt(newRow.packageSize) || "" : "",
      packageCount:
        newRow.packageCount !== "" ? parseInt(newRow.packageCount) || 0 : "",
    };
    setStocks((s) => ({ ...s, [activeTab]: [...s[activeTab], p] }));
    logAction("ADD", activeTab, `"${p.name}" added (QT: ${p.qty} ${p.unit})`);
    setNewRow(EMPTY_PRODUCT_PKG);
    setAddMode(false);
    toast(`"${p.name}" added ✓`);
  };

  const handleSaveEdit = () => {
    if (!editRow.name.trim()) return toast("Product name required", "error");
    const updated = {
      ...editRow,
      qty: parseInt(editRow.qty) || 0,
      minQty: parseInt(editRow.minQty) || 0,
      packageSize:
        editRow.packageSize !== "" ? parseInt(editRow.packageSize) || "" : "",
      packageCount:
        editRow.packageCount !== "" ? parseInt(editRow.packageCount) || 0 : "",
    };
    const prev = current.find((p) => p.id === editRow.id);
    setStocks((s) => ({
      ...s,
      [activeTab]: s[activeTab].map((p) => (p.id === editRow.id ? updated : p)),
    }));
    const ch = [];
    if (prev.qty !== updated.qty) ch.push(`QT: ${prev.qty}→${updated.qty}`);
    if (prev.name !== updated.name) ch.push("Name changed");
    logAction(
      "EDIT",
      activeTab,
      `"${updated.name}" ${ch.join(", ") || "updated"}`,
    );
    setEditRow(null);
    toast("Saved ✓");
  };

  const handleDelete = (id) => setConfirmDel(current.find((p) => p.id === id));

  const confirmDelete = () => {
    setStocks((s) => ({
      ...s,
      [activeTab]: s[activeTab].filter((p) => p.id !== confirmDel.id),
    }));
    logAction("DELETE", activeTab, `"${confirmDel.name}" deleted`);
    toast("Deleted", "error");
    setConfirmDel(null);
  };

  const nudgeQty = (id, delta) => {
    const p = current.find((x) => x.id === id);
    if (!p) return;
    if (isPkgTracked(p)) {
      const newCount = Math.max(0, (parseInt(p.packageCount, 10) || 0) + delta);
      const newQty = p.packageSize * newCount;
      setStocks((s) => ({
        ...s,
        [activeTab]: s[activeTab].map((x) =>
          x.id === id ? { ...x, qty: newQty, packageCount: newCount } : x,
        ),
      }));
      logAction(
        "QTY",
        activeTab,
        `"${p.name}" Packages: ${p.packageCount} → ${newCount} (QT: ${p.qty} → ${newQty})`,
      );
      return;
    }
    const newQty = Math.max(0, p.qty + delta);
    setStocks((s) => ({
      ...s,
      [activeTab]: s[activeTab].map((x) =>
        x.id === id ? { ...x, qty: newQty } : x,
      ),
    }));
    logAction("QTY", activeTab, `"${p.name}" QT: ${p.qty} → ${newQty}`);
  };

  const handleFile = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (!rows.length) return toast("File is empty", "error");
          const { nameCol, qtyCol, minQtyCol } = detectColumns(rows[0]);
          const imported = rows
            .slice(1)
            .filter((r) => r[nameCol] && String(r[nameCol]).trim())
            .map((r) => ({
              id: genId(),
              name: String(r[nameCol]).trim(),
              qty: parseInt(r[qtyCol]) || 0,
              minQty: parseInt(r[minQtyCol]) || 0,
              unit: "kg",
              category: getCategory(String(r[nameCol])),
              batch: "",
              expiry: "",
              supplier: "",
              reorderNote: "",
              packageSize: "",
              packageCount: "",
            }));
          if (!imported.length) return toast("No valid data found", "error");
          setStocks((s) => ({
            ...s,
            [activeTab]: [...s[activeTab], ...imported],
          }));
          logAction(
            "IMPORT",
            activeTab,
            `${imported.length} products imported`,
          );
          toast(`${imported.length} products imported ✓`);
        } catch {
          toast("Failed to read file", "error");
        }
      };
      reader.readAsBinaryString(file);
      e.target.value = "";
    },
    [activeTab],
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((p, i) => ({
        "S.N": i + 1,
        "Product Name": p.name,
        Category: CATEGORIES[p.category]?.label || p.category,
        QT: p.qty,
        Unit: p.unit,
        "Min QT": p.minQty,
        "Package Size": p.packageSize || "",
        "No. of Packages": p.packageCount || "",
        Status: p.qty <= p.minQty ? "LOW" : "OK",
        "Reorder Note": p.reorderNote || "",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tabLabel);
    XLSX.writeFile(wb, `${activeTab}_stock_${Date.now()}.xlsx`);
    toast("Excel exported ✓");
  };

  const switchTab = (id) => {
    setActiveTab(id);
    setSearch("");
    setCatFilter("ALL");
    setShowLowOnly(false);
    setEditRow(null);
    setAddMode(false);
  };

  const isColVisible = (id) => visibleCols.includes(id);
  const toggleCol = (id) => {
    if (LOCKED_COLS.includes(id)) return;
    setVisibleCols((v) =>
      v.includes(id) ? v.filter((c) => c !== id) : [...v, id],
    );
  };

  const drawerData = editRow || (addMode ? newRow : null);
  const setDrawer = editRow ? setEditRow : setNewRow;

  const syncLabel =
    syncState === "error"
      ? "⚠ Local save failed"
      : syncState === "auth-error"
        ? "⚠ Session expired"
        : syncState === "remote-error"
          ? "⚠ Server save failed (local safe)"
          : syncState === "synced"
            ? "✓ Synced"
            : syncState === "saving"
              ? "🔄 Saving…"
              : "✓ Saved";
  const syncColor =
    syncState === "synced"
      ? T.safe
      : syncState === "saving"
        ? T.info
        : syncState.includes("error")
          ? T.warning
          : T.safe;

  if (!isLoaded)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.pageBg,
          fontFamily: "'Inter','Segoe UI',Arial,sans-serif",
        }}
      >
        <div style={{ textAlign: "center", color: T.text2 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⚗</div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 14,
              color: T.text1,
            }}
          >
            {syncState === "load-error"
              ? "Server se connect nahi ho paya"
              : "Loading stock data…"}
          </div>
          {syncState === "load-error" && (
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "9px 20px",
                borderRadius: 9,
                border: "none",
                background: T.gold,
                color: "#000",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ↻ Retry
            </button>
          )}
        </div>
      </div>
    );

  const kpis = [
    {
      lbl: "Products",
      val: current.length,
      sub: `in ${tabLabel}`,
      color: T.gold,
      icon: "📦",
    },
    {
      lbl: "Total Qty",
      val: current.reduce((s, p) => s + p.qty, 0),
      sub: "units on hand",
      color: T.info,
      icon: "📊",
    },
    {
      lbl: "Low Stock",
      val: current.filter((p) => p.qty <= p.minQty).length,
      sub: "below minimum",
      color: T.warning,
      icon: "⚠",
    },
    {
      lbl: "Out of Stock",
      val: current.filter((p) => p.qty === 0).length,
      sub: "needs reorder",
      color: T.critical,
      icon: "🚫",
    },
  ];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { width: 100%; min-width: 0; margin: 0; }
        button, input, select, textarea { font: inherit; }
        input::placeholder { color: ${T.text3}; }
        .csm-shell { width: 100%; overflow-x: hidden; }
        .csm-container { width: min(1280px, 100%); margin: 0 auto; padding: 24px 24px 96px; }
        .csm-header-inner { width: min(1280px, 100%); margin: 0 auto; padding: 14px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
        .csm-header-actions { display:flex; gap:8px; flex-wrap:wrap; }
        .csm-kpi-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; margin-bottom:20px; }
        .csm-tabs { display:flex; gap:4px; flex-wrap:wrap; margin-bottom:16px; }
        .csm-toolbar { display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; align-items:center; }
        .desktop-table { display:block; }
        .mobile-list { display:none; }
        select { color-scheme: dark; }
        @media (max-width: 820px) {
          .csm-container { padding:14px 12px 100px !important; }
          .csm-header-inner { padding:12px; align-items:flex-start; }
          .csm-header-inner h1 { font-size:17px !important; }
          .csm-header-actions { width:100%; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
          .csm-header-actions button { width:100%; justify-content:center; }
          .csm-kpi-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-bottom:14px; }
          .csm-kpi-grid > div { min-width:0; padding:14px 12px !important; }
          .csm-kpi-grid > div p:nth-child(3) { font-size:19px !important; }
          .desktop-table { display:none !important; }
          .mobile-list { display:flex; flex-direction:column; gap:10px; }
          .mobile-card { background:${T.card}; border:1px solid ${T.border}; border-radius:12px; padding:13px; }
          .mobile-card-row { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; min-width:0; }
          .mobile-card-label { color:${T.text3}; font-size:10px; text-transform:uppercase; letter-spacing:.06em; font-weight:700; }
          .mobile-card-value { color:${T.text1}; font-size:13px; font-weight:600; overflow-wrap:anywhere; }
          .mobile-card-name { font-size:14px; font-weight:700; overflow-wrap:anywhere; }
          .mobile-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:11px; }
          .mobile-qty-stepper { display:flex; align-items:center; gap:8px; margin-top:11px; background:${T.elevated}; border:1px solid ${T.border}; border-radius:8px; padding:8px 10px; justify-content:space-between; }
          .mobile-qty-stepper button { width:32px; height:32px; border-radius:7px; border:1px solid ${T.border}; background:${T.card}; color:${T.text1}; font-size:16px; cursor:pointer; }
          .mobile-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:11px; }
          .mobile-actions button { min-height:36px; border-radius:8px; border:1px solid ${T.border}; background:${T.elevated}; color:${T.text1}; font-weight:700; cursor:pointer; font-size:12px; }
          .csm-toolbar { flex-direction:column; align-items:stretch; }
          .csm-toolbar > * { width:100% !important; }
        }
        @media (max-width: 380px) {
          .csm-kpi-grid { grid-template-columns:1fr; }
          .csm-header-actions { grid-template-columns:1fr; }
        }
      `}</style>
      <div
        className="csm-shell"
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
        {/* Toast */}
        {toastMsg && (
          <div
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              left: 16,
              zIndex: 999,
              background:
                toastMsg.type === "error"
                  ? "rgba(244,63,94,0.95)"
                  : "rgba(16,185,129,0.95)",
              color: "#06090F",
              padding: "11px 18px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 8px 30px rgba(0,0,0,.4)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              maxWidth: 380,
              marginLeft: "auto",
            }}
          >
            {toastMsg.type === "error" ? "✕" : "✓"} {toastMsg.msg}
          </div>
        )}

        {/* ── Edit / Add Drawer ── */}
        {(editRow || addMode) && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 200,
              background: "rgba(0,0,0,.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setEditRow(null);
                setAddMode(false);
              }
            }}
          >
            <div
              style={{
                ...card,
                borderRadius: "18px 18px 0 0",
                width: "100%",
                maxWidth: 580,
                maxHeight: "92vh",
                overflowY: "auto",
                padding: 24,
                borderBottom: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 800,
                    color: T.text1,
                  }}
                >
                  {editRow ? "✏ Edit Product" : "＋ Add Product"}
                </h3>
                <button
                  onClick={() => {
                    setEditRow(null);
                    setAddMode(false);
                  }}
                  style={{
                    background: T.elevated,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    width: 30,
                    height: 30,
                    cursor: "pointer",
                    fontSize: 18,
                    color: T.text2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
              {drawerData && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div style={{ gridColumn: "1/-1" }}>
                    <FormField label="Product Name *">
                      <input
                        value={drawerData.name}
                        onChange={(e) =>
                          setDrawer((r) => ({ ...r, name: e.target.value }))
                        }
                        style={inputStyle()}
                        placeholder="e.g. ECOFAST BLUE B"
                      />
                    </FormField>
                  </div>
                  <FormField label="Package Size">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={String(drawerData.packageSize ?? "")}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d+$/.test(v))
                          setDrawer((r) => {
                            const q = computePkgQty(v, r.packageCount);
                            return {
                              ...r,
                              packageSize: v,
                              qty: q !== null ? String(q) : r.qty,
                            };
                          });
                      }}
                      style={inputStyle()}
                      placeholder="e.g. 25"
                    />
                  </FormField>
                  <FormField label="No. of Packages">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={String(drawerData.packageCount ?? "")}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d+$/.test(v))
                          setDrawer((r) => {
                            const q = computePkgQty(r.packageSize, v);
                            return {
                              ...r,
                              packageCount: v,
                              qty: q !== null ? String(q) : r.qty,
                            };
                          });
                      }}
                      style={inputStyle()}
                      placeholder="e.g. 10"
                    />
                  </FormField>
                  <FormField
                    label={
                      isPkgTracked(drawerData)
                        ? `Quantity (= ${drawerData.packageCount} × ${drawerData.packageSize}${drawerData.unit || ""})`
                        : "Quantity *"
                    }
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      value={String(drawerData.qty ?? "")}
                      disabled={isPkgTracked(drawerData)}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d+$/.test(v))
                          setDrawer((r) => ({ ...r, qty: v }));
                      }}
                      style={{
                        ...inputStyle(),
                        ...(isPkgTracked(drawerData)
                          ? { opacity: 0.5, cursor: "not-allowed" }
                          : {}),
                      }}
                      placeholder="0"
                    />
                  </FormField>
                  <FormField label="Min Quantity *">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={String(drawerData.minQty ?? "")}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "" || /^\d+$/.test(v))
                          setDrawer((r) => ({ ...r, minQty: v }));
                      }}
                      style={inputStyle()}
                      placeholder="0"
                    />
                  </FormField>
                  <FormField label="Unit">
                    <select
                      value={drawerData.unit || "kg"}
                      onChange={(e) =>
                        setDrawer((r) => ({ ...r, unit: e.target.value }))
                      }
                      style={{
                        ...inputStyle(),
                        appearance: "auto",
                        cursor: "pointer",
                      }}
                    >
                      {["kg", "g", "L", "ml", "pcs", "box", "drum", "bag"].map(
                        (u) => (
                          <option key={u}>{u}</option>
                        ),
                      )}
                    </select>
                  </FormField>
                  <FormField label="Category">
                    <select
                      value={drawerData.category || "OTHER"}
                      onChange={(e) =>
                        setDrawer((r) => ({ ...r, category: e.target.value }))
                      }
                      style={{
                        ...inputStyle(),
                        appearance: "auto",
                        cursor: "pointer",
                      }}
                    >
                      {Object.entries(CATEGORIES).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <div style={{ gridColumn: "1/-1" }}>
                    <FormField label="Batch No.">
                      <input
                        value={drawerData.batch || ""}
                        onChange={(e) =>
                          setDrawer((r) => ({ ...r, batch: e.target.value }))
                        }
                        style={inputStyle()}
                        placeholder="e.g. BC-001"
                      />
                    </FormField>
                  </div>
                  <FormField label="Expiry Date">
                    <input
                      type="date"
                      value={drawerData.expiry || ""}
                      onChange={(e) =>
                        setDrawer((r) => ({ ...r, expiry: e.target.value }))
                      }
                      style={inputStyle()}
                    />
                  </FormField>
                  <FormField label="Supplier">
                    <input
                      value={drawerData.supplier || ""}
                      onChange={(e) =>
                        setDrawer((r) => ({ ...r, supplier: e.target.value }))
                      }
                      style={inputStyle()}
                      placeholder="Supplier name"
                    />
                  </FormField>
                  <div style={{ gridColumn: "1/-1" }}>
                    <FormField label="Reorder Note">
                      <input
                        value={drawerData.reorderNote || ""}
                        onChange={(e) =>
                          setDrawer((r) => ({
                            ...r,
                            reorderNote: e.target.value,
                          }))
                        }
                        style={inputStyle()}
                        placeholder="e.g. Min 5kg order"
                      />
                    </FormField>
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button
                  onClick={editRow ? handleSaveEdit : handleAdd}
                  style={{
                    flex: 1,
                    padding: 13,
                    borderRadius: 10,
                    border: "none",
                    background: T.gold,
                    color: "#000",
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: "pointer",
                    boxShadow: `0 0 16px ${T.goldGlow}`,
                  }}
                >
                  {editRow ? "💾 Save Changes" : "✚ Add Product"}
                </button>
                <button
                  onClick={() => {
                    setEditRow(null);
                    setAddMode(false);
                  }}
                  style={{
                    padding: "13px 18px",
                    borderRadius: 10,
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
              </div>
            </div>
          </div>
        )}

        {/* ── Detail Modal ── */}
        {detailRow && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 201,
              background: "rgba(0,0,0,.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setDetailRow(null);
            }}
          >
            <div
              style={{
                ...card,
                borderRadius: "18px 18px 0 0",
                width: "100%",
                maxWidth: 520,
                maxHeight: "85vh",
                overflowY: "auto",
                padding: 24,
                borderBottom: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 800,
                    color: T.text1,
                  }}
                >
                  {detailRow.name}
                </h3>
                <button
                  onClick={() => setDetailRow(null)}
                  style={{
                    background: T.elevated,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    width: 30,
                    height: 30,
                    cursor: "pointer",
                    fontSize: 18,
                    color: T.text2,
                  }}
                >
                  ×
                </button>
              </div>
              {(() => {
                const cat =
                  CATEGORIES[detailRow.category || getCategory(detailRow.name)];
                const isLow = detailRow.qty <= detailRow.minQty,
                  isZero = detailRow.qty === 0;
                const badge = statusBadge(isZero, isLow);
                const fields = [
                  ["Quantity", `${detailRow.qty} ${detailRow.unit || ""}`],
                  ...(isPkgTracked(detailRow)
                    ? [
                        [
                          "Package Size",
                          `${detailRow.packageCount} × ${detailRow.packageSize} ${detailRow.unit || ""}`,
                        ],
                      ]
                    : []),
                  [
                    "Min Quantity",
                    `${detailRow.minQty} ${detailRow.unit || ""}`,
                  ],
                  ["Category", cat?.label || detailRow.category],
                  ...(detailRow.batch ? [["Batch", detailRow.batch]] : []),
                  ...(detailRow.expiry ? [["Expiry", detailRow.expiry]] : []),
                  ...(detailRow.supplier
                    ? [["Supplier", detailRow.supplier]]
                    : []),
                  ["Reorder Note", detailRow.reorderNote || "None"],
                ];
                return (
                  <>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 0",
                        borderBottom: `1px solid ${T.border}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: T.text2,
                          fontWeight: 600,
                        }}
                      >
                        Status
                      </span>
                      <span style={{ ...badgePill, ...badge.style }}>
                        {badge.label}
                      </span>
                    </div>
                    {fields.map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px 0",
                          borderBottom: `1px solid ${T.border}`,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: T.text2,
                            fontWeight: 600,
                          }}
                        >
                          {k}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            color: T.text1,
                            fontWeight: 500,
                            maxWidth: "60%",
                            textAlign: "right",
                          }}
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                  </>
                );
              })()}
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => {
                    setEditRow({ ...detailRow });
                    setDetailRow(null);
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: "none",
                    background: T.gold,
                    color: "#000",
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  ✏ Edit
                </button>
                <button
                  onClick={() => {
                    handleDelete(detailRow.id);
                    setDetailRow(null);
                  }}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: "none",
                    background: "rgba(244,63,94,0.15)",
                    color: T.critical,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "inset 0 0 0 1px rgba(244,63,94,0.4)",
                  }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmDel && (
          <ConfirmModal
            icon="🗑️"
            title="Delete Product?"
            message={`"${confirmDel.name}" permanently remove ho jaayega.`}
            confirmLabel="Delete"
            onConfirm={confirmDelete}
            onCancel={() => setConfirmDel(null)}
          />
        )}

        {/* ── Settings Modal ── */}
        {showSettings && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 202,
              background: "rgba(0,0,0,.7)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowSettings(false);
            }}
          >
            <div
              style={{
                ...card,
                padding: 28,
                width: "100%",
                maxWidth: 420,
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: `0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px ${T.borderHi}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontWeight: 800,
                    fontSize: 15,
                    color: T.text1,
                  }}
                >
                  ⚙ Settings
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    background: T.elevated,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    width: 30,
                    height: 30,
                    cursor: "pointer",
                    fontSize: 18,
                    color: T.text2,
                  }}
                >
                  ×
                </button>
              </div>
              <FormField label="Company / Store Name">
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  style={inputStyle()}
                />
              </FormField>
              <div
                style={{
                  background: T.safeBg,
                  border: `1px solid rgba(16,185,129,0.3)`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  marginTop: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>💾</span>
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: T.safe }}
                  >
                    Browser Storage — Permanent Save
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: T.text2,
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  Aapka saara data browser ke{" "}
                  <strong style={{ color: T.text1 }}>localStorage</strong> mein
                  permanently save hota hai.
                  <br />
                  Page refresh, browser restart — sab ke baad bhi data safe
                  rehta hai.
                  <br />
                  <span style={{ color: T.text3 }}>
                    Sirf browser data clear karne se delete hoga.
                  </span>
                </p>
              </div>
              <div
                style={{
                  paddingBottom: 16,
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.text2,
                    textTransform: "uppercase",
                    letterSpacing: ".05em",
                    marginBottom: 10,
                  }}
                >
                  📁 Backup & Restore
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={exportDataJSON}
                    style={{
                      flex: 1,
                      padding: 11,
                      borderRadius: 9,
                      border: `1.5px solid rgba(16,185,129,0.35)`,
                      background: T.safeBg,
                      color: T.safe,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ⬇ Download Backup
                  </button>
                  <button
                    onClick={() => importJSONRef.current.click()}
                    style={{
                      flex: 1,
                      padding: 11,
                      borderRadius: 9,
                      border: `1.5px solid rgba(59,130,246,0.35)`,
                      background: T.infoBg,
                      color: T.info,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ⬆ Restore Backup
                  </button>
                </div>
                <input
                  ref={importJSONRef}
                  type="file"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={importDataJSON}
                />
                <p
                  style={{
                    fontSize: 10,
                    color: T.text3,
                    marginTop: 8,
                    textAlign: "center",
                  }}
                >
                  JSON file mein saara data (stocks + dispatches + history) save
                  hota hai
                </p>
              </div>
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, color: T.text2, marginBottom: 10 }}>
                  ⚠ Danger Zone
                </p>
                <button
                  onClick={async () => {
                    if (
                      window.confirm(
                        "Browser storage + server ka saara data delete hoga! Sure?",
                      )
                    ) {
                      await clearRemoteData();
                      window.location.reload();
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: 11,
                    borderRadius: 9,
                    border: `1px solid rgba(244,63,94,0.3)`,
                    background: T.dangerBg,
                    color: T.critical,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  🗑 Clear All Data
                </button>
              </div>
            </div>
          </div>
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
          <div className="csm-header-inner">
            <div>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  margin: 0,
                }}
              >
                <span style={{ fontSize: 18 }}>⚗</span>
                <span style={{ color: T.gold }}>{companyName}</span>
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
                <span style={{ color: T.text2 }}>Chemical Stock Manager</span>
                <span>·</span>
                {totalLow > 0 && (
                  <>
                    <span style={{ color: T.critical, fontWeight: 700 }}>
                      ⚠ {totalLow} low
                    </span>
                    <span>·</span>
                  </>
                )}
                <span style={{ color: syncColor }}>{syncLabel}</span>
              </p>
            </div>
            <div className="csm-header-actions">
              <button
                onClick={() => exportPDF(stocks, activeTab, tabLabel, true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid rgba(244,63,94,0.3)`,
                  background: "transparent",
                  color: T.critical,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📄 PDF Alert
              </button>
              <button
                onClick={() =>
                  exportPDF(stocks, activeTab, tabLabel, false, catFilter)
                }
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "none",
                  background: T.gold,
                  color: "#000",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: `0 0 16px ${T.goldGlow}`,
                }}
              >
                ⬇ PDF Report
              </button>
              <button
                onClick={() => setShowSettings(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: "transparent",
                  color: T.text2,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                ⚙
              </button>
            </div>
          </div>
        </header>

        <div className="csm-container">
          {/* Tab bar */}
          <div className="csm-tabs">
            {TABS.map((t) => {
              const low =
                t.id !== "dispatch"
                  ? (stocks[t.id] || []).filter((p) => p.qty <= p.minQty).length
                  : 0;
              const dCount = t.id === "dispatch" ? dispatches.length : 0;
              const act = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => switchTab(t.id)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    background: act ? T.gold : T.card,
                    color: act ? "#000" : T.text2,
                    fontWeight: act ? 800 : 600,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: act ? `0 0 14px ${T.goldGlow}` : "none",
                  }}
                >
                  {t.icon} {t.label}
                  {low > 0 && (
                    <span
                      style={{
                        background: act ? "rgba(0,0,0,0.2)" : T.dangerBg,
                        color: act ? "#000" : T.critical,
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: 8,
                      }}
                    >
                      {low}
                    </span>
                  )}
                  {t.id === "dispatch" && dCount > 0 && (
                    <span
                      style={{
                        background: act ? "rgba(0,0,0,0.2)" : T.infoBg,
                        color: act ? "#000" : T.info,
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "1px 6px",
                        borderRadius: 8,
                      }}
                    >
                      {dCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ══ DISPATCH TAB ══ */}
          {activeTab === "dispatch" && (
            <DispatchTab
              ref={dispatchTabRef}
              stocks={stocks}
              dispatches={dispatches}
              setStocksRaw={setStocksRaw}
              setDispatches={setDispatches}
              setChangeLog={setChangeLog}
              setLastUpdated={setLastUpdated}
              toast={toast}
              companyName={companyName}
              theme={T}
            />
          )}

          {/* ══ STOCK TABS ══ */}
          {activeTab !== "dispatch" && (
            <>
              {/* KPI cards */}
              <div className="csm-kpi-grid">
                {kpis.map(({ lbl, val, sub, color, icon }) => (
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
                        opacity: 0.1,
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

              {/* Toolbar */}
              <div className="csm-toolbar">
                <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
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
                    placeholder="Search name, batch, supplier…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ ...inputStyle(), paddingLeft: 36 }}
                  />
                </div>
                <select
                  value={catFilter}
                  onChange={(e) => setCatFilter(e.target.value)}
                  style={{
                    ...inputStyle(),
                    width: "auto",
                    minWidth: 165,
                    cursor: "pointer",
                    fontWeight: catFilter !== "ALL" ? 700 : 400,
                  }}
                >
                  <option value="ALL">All Categories ({current.length})</option>
                  {Object.entries(CATEGORIES).map(([k, v]) => {
                    const count = catCounts[k] || 0;
                    if (!count) return null;
                    const lc = catLowCounts[k] || 0;
                    return (
                      <option key={k} value={k}>
                        {v.label} ({count}
                        {lc > 0 ? ` ⚠${lc}` : ""})
                      </option>
                    );
                  })}
                </select>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                    color: T.text2,
                    cursor: "pointer",
                    userSelect: "none",
                    whiteSpace: "nowrap",
                    padding: "0 4px",
                  }}
                >
                  <div
                    onClick={() => setShowLowOnly((v) => !v)}
                    style={{
                      width: 34,
                      height: 18,
                      borderRadius: 9,
                      background: showLowOnly ? T.critical : T.border,
                      position: "relative",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 2,
                        left: showLowOnly ? 17 : 2,
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: "#fff",
                        transition: "left .2s",
                      }}
                    />
                  </div>
                  Low only
                </label>
                <button
                  onClick={() => {
                    const ld = filtered.filter((p) => p.qty <= p.minQty);
                    if (!ld.length) return toast("No low stock items", "error");
                    const cl =
                      catFilter !== "ALL"
                        ? ` · ${CATEGORIES[catFilter]?.label || catFilter}`
                        : "";
                    exportPDF(
                      { [activeTab]: ld },
                      activeTab,
                      tabLabel,
                      false,
                      "ALL",
                      `Low Stock — ${tabLabel}${cl}`,
                    );
                  }}
                  style={smBtn(
                    T.dangerBg,
                    T.critical,
                    "1.5px solid rgba(244,63,94,0.3)",
                  )}
                >
                  📄 Low PDF
                </button>
                <div
                  style={{
                    display: "flex",
                    borderRadius: 8,
                    border: `1.5px solid ${T.border}`,
                    overflow: "hidden",
                  }}
                >
                  {["manual", "excel"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setImportMode(m)}
                      style={{
                        padding: "8px 12px",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 700,
                        background: importMode === m ? T.gold : "transparent",
                        color: importMode === m ? "#000" : T.text2,
                      }}
                    >
                      {m === "manual" ? "✏ Manual" : "📊 Excel"}
                    </button>
                  ))}
                </div>
                {importMode === "excel" && (
                  <button
                    onClick={() => fileRef.current.click()}
                    style={smBtn(T.info, "#fff", "none")}
                  >
                    ↑ Upload
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }}
                  onChange={handleFile}
                />
                <button
                  onClick={exportExcel}
                  style={smBtn(
                    T.safeBg,
                    T.safe,
                    "1.5px solid rgba(16,185,129,0.3)",
                  )}
                >
                  ↓ Excel
                </button>

                {/* Column picker */}
                <div style={{ position: "relative" }} ref={colPickerRef}>
                  <button
                    onClick={() => setShowColPicker((v) => !v)}
                    style={smBtn(
                      showColPicker ? T.gold : T.elevated,
                      showColPicker ? "#000" : T.text2,
                      `1.5px solid ${T.border}`,
                    )}
                  >
                    ⊞ Cols{" "}
                    <span
                      style={{
                        background: showColPicker
                          ? "rgba(0,0,0,0.15)"
                          : T.border,
                        color: showColPicker ? "#000" : T.text2,
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "1px 5px",
                        borderRadius: 6,
                        marginLeft: 4,
                      }}
                    >
                      {visibleCols.length}
                    </span>
                  </button>
                  {showColPicker && (
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 6px)",
                        right: 0,
                        zIndex: 150,
                        ...card,
                        boxShadow: "0 12px 32px rgba(0,0,0,.5)",
                        padding: "10px 0",
                        minWidth: 200,
                      }}
                    >
                      <div
                        style={{
                          padding: "0 14px 8px",
                          fontSize: 10,
                          fontWeight: 800,
                          color: T.text3,
                          textTransform: "uppercase",
                          letterSpacing: ".06em",
                        }}
                      >
                        Columns
                      </div>
                      {ALL_COLUMNS.map((col) => {
                        const locked = LOCKED_COLS.includes(col.id);
                        const checked = isColVisible(col.id);
                        return (
                          <div
                            key={col.id}
                            onClick={() => !locked && toggleCol(col.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "7px 14px",
                              cursor: locked ? "not-allowed" : "pointer",
                              userSelect: "none",
                            }}
                          >
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 4,
                                border: `2px solid ${checked ? T.gold : T.border}`,
                                background: checked ? T.gold : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                opacity: locked ? 0.4 : 1,
                              }}
                            >
                              {checked && (
                                <span
                                  style={{
                                    color: "#000",
                                    fontSize: 10,
                                    fontWeight: 900,
                                  }}
                                >
                                  ✓
                                </span>
                              )}
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                color: locked ? T.text3 : T.text2,
                                fontWeight: checked ? 600 : 400,
                              }}
                            >
                              {col.label}
                              {locked && (
                                <span style={{ fontSize: 9, color: T.text3 }}>
                                  {" "}
                                  (fixed)
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAddMode(true);
                    setNewRow(EMPTY_PRODUCT_PKG);
                  }}
                  style={smBtn(T.gold, "#000", "none")}
                >
                  ＋ Add
                </button>
              </div>

              {lastUpdated[activeTab] && (
                <p style={{ fontSize: 11, color: T.text3, marginBottom: 10 }}>
                  💾 {syncState === "saving" ? "Syncing…" : "Saved"} · Last:{" "}
                  <strong style={{ color: T.text2 }}>
                    {lastUpdated[activeTab]}
                  </strong>
                  {catFilter !== "ALL" && (
                    <span
                      style={{
                        marginLeft: 10,
                        background: T.elevated,
                        color: T.gold,
                        padding: "2px 8px",
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      {CATEGORIES[catFilter]?.label} ·{" "}
                      {catCounts[catFilter] || 0} products
                      {catLowCounts[catFilter]
                        ? ` · ⚠ ${catLowCounts[catFilter]} low`
                        : ""}
                    </span>
                  )}
                </p>
              )}

              {/* Mobile card list */}
              <div className="mobile-list">
                {filtered.length === 0 && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "48px 0",
                      color: T.text3,
                    }}
                  >
                    <p style={{ fontSize: 34, marginBottom: 10 }}>
                      {showLowOnly ? "✅" : "🔍"}
                    </p>
                    <p
                      style={{ fontWeight: 600, fontSize: 14, color: T.text2 }}
                    >
                      {showLowOnly
                        ? "No low-stock items here"
                        : "No products found"}
                    </p>
                  </div>
                )}
                {filtered.map((p) => {
                  const isLow = p.qty <= p.minQty,
                    isZero = p.qty === 0;
                  const cat = CATEGORIES[p.category || getCategory(p.name)];
                  const badge = statusBadge(isZero, isLow);
                  return (
                    <div
                      className="mobile-card"
                      key={p.id}
                      onClick={() => setDetailRow(p)}
                    >
                      <div className="mobile-card-row">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div className="mobile-card-name">{p.name}</div>
                          <span
                            style={{
                              display: "inline-block",
                              marginTop: 5,
                              background: cat?.bg ? undefined : T.elevated,
                              color: cat?.color || T.text2,
                              background: T.elevated,
                              border: `1px solid ${T.border}`,
                              padding: "2px 8px",
                              borderRadius: 8,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {cat?.label || p.category}
                          </span>
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
                      <div className="mobile-grid2">
                        <div>
                          <div className="mobile-card-label">Quantity</div>
                          <div
                            className="mobile-card-value"
                            style={{
                              color: isZero
                                ? T.critical
                                : isLow
                                  ? T.warning
                                  : T.text1,
                            }}
                          >
                            {p.qty} {p.unit}
                          </div>
                        </div>
                        <div>
                          <div className="mobile-card-label">Min Qty</div>
                          <div className="mobile-card-value">
                            {p.minQty} {p.unit}
                          </div>
                        </div>
                        {p.batch && (
                          <div>
                            <div className="mobile-card-label">Batch</div>
                            <div className="mobile-card-value">{p.batch}</div>
                          </div>
                        )}
                        {isPkgTracked(p) && (
                          <div>
                            <div className="mobile-card-label">Package</div>
                            <div className="mobile-card-value">
                              {p.packageCount} × {p.packageSize}
                              {p.unit}
                            </div>
                          </div>
                        )}
                      </div>
                      <div
                        className="mobile-qty-stepper"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => nudgeQty(p.id, -1)}>−</button>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 15,
                            color: T.text1,
                          }}
                        >
                          {p.qty}{" "}
                          <span
                            style={{
                              fontSize: 10,
                              color: T.text3,
                              fontWeight: 600,
                            }}
                          >
                            {p.unit}
                          </span>
                        </span>
                        <button onClick={() => nudgeQty(p.id, +1)}>+</button>
                      </div>
                      <div
                        className="mobile-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button onClick={() => setEditRow({ ...p })}>
                          ✏ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          style={{
                            color: T.critical,
                            borderColor: "rgba(244,63,94,.3)",
                          }}
                        >
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length > 0 && (
                  <div
                    style={{
                      ...card,
                      padding: "13px 16px",
                      background: T.elevated,
                      border: `1px solid ${T.gold}40`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          color: T.text2,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {filtered.length} of {current.length} products
                      </span>
                      <span
                        style={{ color: T.gold, fontWeight: 800, fontSize: 15 }}
                      >
                        {filtered.reduce((s, p) => s + p.qty, 0)} total qty
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop table */}
              <div
                className="desktop-table"
                style={{ ...card, overflow: "hidden" }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 13,
                      minWidth: 640,
                    }}
                  >
                    <thead>
                      <tr style={{ background: T.elevated }}>
                        {ALL_COLUMNS.filter((c) => isColVisible(c.id)).map(
                          (col) => (
                            <th
                              key={col.id}
                              style={{
                                padding: "11px 14px",
                                color: T.text3,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                borderBottom: `1px solid ${T.border}`,
                                whiteSpace: "nowrap",
                                textAlign: [
                                  "qty",
                                  "minQty",
                                  "status",
                                  "category",
                                ].includes(col.id)
                                  ? "center"
                                  : col.id === "actions"
                                    ? "right"
                                    : "left",
                              }}
                            >
                              {col.label}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr>
                          <td
                            colSpan={visibleCols.length}
                            style={{
                              padding: "48px 12px",
                              textAlign: "center",
                              color: T.text3,
                              fontSize: 13,
                            }}
                          >
                            {showLowOnly
                              ? "✅ No low-stock items here"
                              : "No products found"}
                          </td>
                        </tr>
                      )}
                      {filtered.map((p, idx) => {
                        const isLow = p.qty <= p.minQty,
                          isZero = p.qty === 0;
                        const cat =
                          CATEGORIES[p.category || getCategory(p.name)];
                        const badge = statusBadge(isZero, isLow);
                        const qtyColor = isZero
                          ? T.critical
                          : isLow
                            ? T.warning
                            : T.text1;
                        return (
                          <tr
                            key={p.id}
                            style={{
                              borderBottom: `1px solid ${T.border}`,
                              cursor: "pointer",
                              background:
                                idx % 2 === 0
                                  ? "transparent"
                                  : "rgba(255,255,255,0.012)",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = T.elevated)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background =
                                idx % 2 === 0
                                  ? "transparent"
                                  : "rgba(255,255,255,0.012)")
                            }
                            onClick={() => setDetailRow(p)}
                          >
                            {isColVisible("idx") && (
                              <td style={td()}>
                                <span style={{ color: T.text3, fontSize: 11 }}>
                                  {idx + 1}
                                </span>
                              </td>
                            )}
                            {isColVisible("name") && (
                              <td style={td()}>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: T.text1,
                                    fontSize: 12,
                                  }}
                                >
                                  {p.name}
                                </div>
                                {p.reorderNote &&
                                  !isColVisible("reorderNote") && (
                                    <div
                                      style={{
                                        fontSize: 10,
                                        color: T.warning,
                                        marginTop: 2,
                                      }}
                                    >
                                      ↺ {p.reorderNote}
                                    </div>
                                  )}
                              </td>
                            )}
                            {isColVisible("category") && (
                              <td style={td("center")}>
                                <span
                                  style={{
                                    background: T.elevated,
                                    border: `1px solid ${T.border}`,
                                    color: T.text2,
                                    padding: "2px 8px",
                                    borderRadius: 10,
                                    fontSize: 10,
                                    fontWeight: 700,
                                  }}
                                >
                                  {cat?.label || p.category}
                                </span>
                              </td>
                            )}
                            {isColVisible("batch") && (
                              <td
                                style={{
                                  ...td(),
                                  fontSize: 11,
                                  color: T.text2,
                                }}
                              >
                                {p.batch || (
                                  <span style={{ color: T.text3 }}>—</span>
                                )}
                              </td>
                            )}
                            {isColVisible("expiry") && (
                              <td
                                style={{
                                  ...td(),
                                  fontSize: 11,
                                  color:
                                    p.expiry && new Date(p.expiry) < new Date()
                                      ? T.critical
                                      : T.text2,
                                }}
                              >
                                {p.expiry || (
                                  <span style={{ color: T.text3 }}>—</span>
                                )}
                              </td>
                            )}
                            {isColVisible("supplier") && (
                              <td
                                style={{
                                  ...td(),
                                  fontSize: 11,
                                  color: T.text2,
                                }}
                              >
                                {p.supplier || (
                                  <span style={{ color: T.text3 }}>—</span>
                                )}
                              </td>
                            )}
                            {isColVisible("qty") && (
                              <td
                                style={td("center")}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 4,
                                  }}
                                >
                                  <button
                                    onClick={() => nudgeQty(p.id, -1)}
                                    title={
                                      isPkgTracked(p)
                                        ? `−1 package (${p.packageSize}${p.unit})`
                                        : "−1"
                                    }
                                    style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 5,
                                      border: `1px solid ${T.border}`,
                                      background: T.elevated,
                                      cursor: "pointer",
                                      fontSize: 14,
                                      color: T.text2,
                                    }}
                                  >
                                    −
                                  </button>
                                  <span
                                    style={{
                                      fontWeight: 800,
                                      fontSize: 13,
                                      color: qtyColor,
                                      minWidth: 30,
                                      textAlign: "center",
                                    }}
                                  >
                                    {p.qty}
                                  </span>
                                  <button
                                    onClick={() => nudgeQty(p.id, +1)}
                                    title={
                                      isPkgTracked(p)
                                        ? `+1 package (${p.packageSize}${p.unit})`
                                        : "+1"
                                    }
                                    style={{
                                      width: 22,
                                      height: 22,
                                      borderRadius: 5,
                                      border: `1px solid ${T.border}`,
                                      background: T.elevated,
                                      cursor: "pointer",
                                      fontSize: 14,
                                      color: T.text2,
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: T.text3,
                                    textAlign: "center",
                                  }}
                                >
                                  {p.unit}
                                </div>
                                {isPkgTracked(p) && (
                                  <div
                                    style={{
                                      fontSize: 9,
                                      color: T.text3,
                                      textAlign: "center",
                                    }}
                                  >
                                    {p.packageCount} × {p.packageSize}
                                    {p.unit}
                                  </div>
                                )}
                              </td>
                            )}
                            {isColVisible("minQty") && (
                              <td
                                style={{
                                  ...td("center"),
                                  color: T.text2,
                                  fontSize: 12,
                                }}
                              >
                                {p.minQty} {p.unit}
                              </td>
                            )}
                            {isColVisible("status") && (
                              <td style={td("center")}>
                                <span style={{ ...badgePill, ...badge.style }}>
                                  {badge.label}
                                </span>
                              </td>
                            )}
                            {isColVisible("reorderNote") && (
                              <td
                                style={{
                                  ...td(),
                                  fontSize: 11,
                                  color: T.warning,
                                  maxWidth: 160,
                                }}
                              >
                                {p.reorderNote || ""}
                              </td>
                            )}
                            {isColVisible("actions") && (
                              <td
                                style={td("right")}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 5,
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <button
                                    onClick={() => setEditRow({ ...p })}
                                    style={rowBtn(
                                      T.infoBg,
                                      T.info,
                                      "1.5px solid rgba(59,130,246,0.3)",
                                    )}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p.id)}
                                    style={rowBtn(
                                      T.dangerBg,
                                      T.critical,
                                      "1.5px solid rgba(244,63,94,0.3)",
                                    )}
                                  >
                                    Del
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filtered.length > 0 && (
                  <div
                    style={{
                      padding: "12px 16px",
                      background: `rgba(212,160,23,0.05)`,
                      borderTop: `1px solid ${T.gold}40`,
                      display: "flex",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    <span style={{ fontSize: 11, color: T.text2 }}>
                      {filtered.length} of {current.length} products
                      {search && (
                        <span style={{ color: T.gold }}> · "{search}"</span>
                      )}
                      {catFilter !== "ALL" && (
                        <span style={{ color: T.text2 }}>
                          {" "}
                          · {CATEGORIES[catFilter]?.label}
                        </span>
                      )}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        fontSize: 11,
                        color: T.text2,
                      }}
                    >
                      <span>
                        QT:{" "}
                        <strong style={{ color: T.gold }}>
                          {filtered.reduce((s, p) => s + p.qty, 0)}
                        </strong>
                      </span>
                      <span>
                        Low:{" "}
                        <strong style={{ color: T.warning }}>
                          {filtered.filter((p) => p.qty <= p.minQty).length}
                        </strong>
                      </span>
                      <span>
                        Out:{" "}
                        <strong style={{ color: T.critical }}>
                          {filtered.filter((p) => p.qty === 0).length}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {importMode === "excel" && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "12px 16px",
                    background: T.infoBg,
                    borderRadius: 10,
                    border: `1.5px solid rgba(59,130,246,0.3)`,
                    fontSize: 11,
                    color: T.info,
                  }}
                >
                  <strong>📊 Excel Format:</strong> S.N | Product Name | QT
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Mobile bottom bar ── */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(6,9,15,0.94)",
            backdropFilter: "blur(16px)",
            display: "flex",
            borderTop: `1px solid ${T.border}`,
            zIndex: 100,
          }}
        >
          {[
            { id: "stock", icon: "📦", label: "Stock" },
            {
              id: "alerts",
              icon: "⚠",
              label: totalLow > 0 ? `Alerts(${totalLow})` : "Alerts",
            },
            {
              id: "add",
              icon: "＋",
              label: activeTab === "dispatch" ? "Dispatch" : "Add",
            },
            { id: "pdf", icon: "📄", label: "PDF" },
            { id: "log", icon: "📋", label: "Log" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "add") {
                  if (activeTab === "dispatch")
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  else {
                    setAddMode(true);
                    setNewRow(EMPTY_PRODUCT_PKG);
                  }
                } else if (item.id === "pdf") {
                  if (activeTab === "dispatch")
                    dispatchTabRef.current?.exportPDF();
                  else exportPDF(stocks, activeTab, tabLabel, false, catFilter);
                } else if (item.id === "log") {
                  if (!changeLog.length) {
                    toast("No changes yet", "error");
                    return;
                  }
                  const rows = changeLog
                    .slice(0, 50)
                    .map((e) => {
                      const cols = {
                        ADD: ["#D1FAE5", "#065F46"],
                        DELETE: ["#FEE2E2", "#991B1B"],
                        IMPORT: ["#DBEAFE", "#1E40AF"],
                        EDIT: ["#FEF3C7", "#92400E"],
                        QTY: ["#F0FDF4", "#166534"],
                        DISPATCH: ["#F3E8FF", "#6D28D9"],
                        UNDO_DISPATCH: ["#FEF3C7", "#92400E"],
                      };
                      const [bg, col] = cols[e.action] || [
                        "#F3F4F6",
                        "#374151",
                      ];
                      return `<tr><td style="padding:8px 10px;border-bottom:1px solid #F3F4F6"><span style="background:${bg};color:${col};font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px">${e.action}</span></td><td style="padding:8px 10px;border-bottom:1px solid #F3F4F6;font-size:11px">${TABS.find((t) => t.id === e.tab)?.label || e.tab}</td><td style="padding:8px 10px;border-bottom:1px solid #F3F4F6;font-size:11px">${e.details}</td><td style="padding:8px 10px;border-bottom:1px solid #F3F4F6;font-size:10px;color:#94a3b8;white-space:nowrap">${e.time}</td></tr>`;
                    })
                    .join("");
                  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Log</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th{padding:8px 10px;background:#0F172A;color:#fff;font-size:10px;text-transform:uppercase;text-align:left}</style></head><body><h2 style="color:#0F172A">📋 Change Log</h2><table><thead><tr><th>Action</th><th>Location</th><th>Details</th><th>Time</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
                  const w = window.open("", "_blank", "width=900,height=700");
                  w.document.write(html);
                  w.document.close();
                } else if (item.id === "alerts") {
                  exportPDF(stocks, activeTab, tabLabel, true);
                }
              }}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                color: T.text2,
                cursor: "pointer",
                padding: "10px 4px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: T.text2 }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
