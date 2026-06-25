import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import * as XLSX from "xlsx-js-style";

const API = import.meta.env.VITE_API_BASE_URL;

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
  A: { bg: "#EEF6FF", text: "#2563EB", border: "#2563EB" },
  B: { bg: "#F0FDF4", text: "#16A34A", border: "#16A34A" },
  C: { bg: "#FFFBEB", text: "#B45309", border: "#F59E0B" },
  D: { bg: "#FFF7ED", text: "#C2410C", border: "#F97316" },
  E: { bg: "#FDF4FF", text: "#7E22CE", border: "#A855F7" },
  F: { bg: "#F0FDFA", text: "#0F766E", border: "#14B8A6" },
  G: { bg: "#FFF1F2", text: "#BE123C", border: "#F43F5E" },
  H: { bg: "#F0FDF4", text: "#065F46", border: "#10B981" },
};

const stageColor = (stage) => {
  if (!stage) return { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" };
  const letter = stage.trim()[0]?.toUpperCase();
  return (
    STAGE_COLOR[letter] || { bg: "#F3F4F6", text: "#6B7280", border: "#D1D5DB" }
  );
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
  if (pct >= 80) return "#10B981";
  if (pct >= 60) return "#F59E0B";
  return "#3B82F6";
};

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// ─── Date Filter Helpers ──────────────────────────────────────────────────────
const getWeekRange = (weeksBack) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - weeksBack * 7);
  return { start, end };
};

const toISO = (d) => d.toISOString().slice(0, 10);

const inRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

// ─── Global Styles ────────────────────────────────────────────────────────────
const injectGlobalStyles = () => {
  if (document.getElementById("dsr-global-styles")) return;
  const style = document.createElement("style");
  style.id = "dsr-global-styles";
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }

    .dsr-input:focus {
      outline: none;
      border-color: #00B8A2 !important;
      box-shadow: 0 0 0 3px rgba(0,184,162,0.15) !important;
    }
    .dsr-input-highlight {
      border-color: #F59E0B !important;
      background: #FFFBEB !important;
      box-shadow: 0 0 0 2px rgba(245,158,11,0.18) !important;
    }
    .dsr-input-highlight:focus {
      border-color: #D97706 !important;
      box-shadow: 0 0 0 3px rgba(217,119,6,0.22) !important;
    }

    .dsr-btn-primary:hover:not(:disabled) { background: #009e8c !important; transform: translateY(-1px); }
    .dsr-btn-primary:active:not(:disabled) { transform: translateY(0); }
    .dsr-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .dsr-btn-danger:hover { background: #FEE2E2 !important; color: #BE123C !important; }
    .dsr-btn-edit:hover { background: #EEF6FF !important; color: #1D4ED8 !important; }
    .dsr-btn-export:hover { background: #065F46 !important; }
    .dsr-record-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
    .dsr-record-card:hover { box-shadow: 0 6px 24px rgba(11,46,78,0.12) !important; transform: translateY(-2px); }
    .dsr-customer-row { transition: background 0.12s; }
    .dsr-customer-row:hover { background: #F0FDFA !important; }
    .dsr-customer-row:hover .dsr-row-actions { opacity: 1 !important; }
    .dsr-row-actions { opacity: 0; transition: opacity 0.15s; display: flex; gap: 6px; flex-shrink: 0; }
    @media (max-width: 767px) { .dsr-row-actions { opacity: 1 !important; } }
    .dsr-nav-item:hover { background: rgba(255,255,255,0.08) !important; }
    .dsr-nav-item.active { background: rgba(0,184,162,0.18) !important; color: #00B8A2 !important; }
    .dsr-nav-action:hover { background: rgba(255,255,255,0.10) !important; }
    .dsr-topbar-btn:hover { background: rgba(255,255,255,0.15) !important; }
    .dsr-topbar-btn:active { background: rgba(255,255,255,0.25) !important; }

    /* Export Dropdown */
    .dsr-export-dropdown { position: relative; display: inline-flex; flex-shrink: 0; }
    .dsr-export-menu {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      background: #fff;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 8px;
      min-width: 240px;
      z-index: 200;
      box-shadow: 0 8px 32px rgba(11,46,78,0.14);
    }
    .dsr-export-menu-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.12s;
      font-size: 13px;
      font-weight: 500;
      color: #374151;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
    }
    .dsr-export-menu-item:hover { background: #F0FDF4; color: #047857; }
    .dsr-export-menu-item.active { background: #F0FDF4; color: #047857; font-weight: 700; }
    .dsr-export-divider { height: 1px; background: #F3F4F6; margin: 6px 0; }
    .dsr-export-custom-row {
      padding: 10px 12px 4px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .dsr-export-custom-row label { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.05em; }
    .dsr-export-custom-inputs { display: flex; gap: 6px; align-items: center; }
    .dsr-export-custom-inputs input { flex: 1; height: 32px; padding: 0 8px; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 12px; }

    /* Expanded card */
    .dsr-card-expanded {
      border: 1.5px solid #00B8A2 !important;
      box-shadow: 0 8px 32px rgba(0,184,162,0.12) !important;
    }
    .dsr-expand-btn {
      height: 28px;
      padding: 0 10px;
      border-radius: 6px;
      border: 1px solid #E5E7EB;
      background: transparent;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      color: #6B7280;
      transition: all 0.15s;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .dsr-expand-btn:hover { background: #EEF6FF; color: #1D4ED8; border-color: #BFDBFE; }
    .dsr-expand-btn.expanded { background: #EEF6FF; color: #1D4ED8; border-color: #BFDBFE; }

    /* Expanded detail section */
    .dsr-card-detail-section {
      overflow: hidden;
      transition: max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease;
      max-height: 0;
      opacity: 0;
    }
    .dsr-card-detail-section.open {
      max-height: 800px;
      opacity: 1;
    }

    /* Filter chips */
    .dsr-filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid #E5E7EB;
      background: #fff;
      font-size: 12px;
      font-weight: 600;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .dsr-filter-chip:hover { border-color: #00B8A2; color: #00B8A2; background: #F0FDFA; }
    .dsr-filter-chip.active { background: #00B8A2; color: #fff; border-color: #00B8A2; }

    .dsr-cust-banner {
      background: #F0FDFA;
      border: 1px solid #99F6E4;
      border-left: 4px solid #00B8A2;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }
    .dsr-cust-banner-title {
      font-size: 10px; font-weight: 700; color: #0F766E;
      text-transform: uppercase; letter-spacing: 0.06em;
      margin-bottom: 8px; display: flex; align-items: center; gap: 5px;
    }
    .dsr-cust-banner-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; }
    .dsr-cust-banner-item { display: flex; flex-direction: column; gap: 1px; }
    .dsr-cust-banner-key { font-size: 9px; color: #5EEAD4; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .dsr-cust-banner-val { font-size: 12px; font-weight: 600; color: #134E4A; }

    .dsr-last-hint {
      display: inline-flex; align-items: center; gap: 5px;
      margin-top: 5px; padding: 3px 9px 3px 7px; border-radius: 20px;
      background: #FEF3C7; border: 1px solid #FDE68A; font-size: 11px;
      color: #92400E; line-height: 1.4; cursor: pointer;
      transition: background 0.15s; max-width: 100%; overflow: hidden;
    }
    .dsr-last-hint:hover { background: #FDE68A; }
    .dsr-last-hint .hint-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .dsr-last-hint .hint-use { flex-shrink: 0; font-weight: 700; color: #B45309; margin-left: 3px; }

    .dsr-edit-stripe {
      background: linear-gradient(135deg, #1D4ED8, #2563EB);
      border-radius: 10px 10px 0 0;
      margin: -20px -20px 16px -20px;
      padding: 16px 20px;
      display: flex; align-items: center; justify-content: space-between;
    }

    .dsr-modal-box::-webkit-scrollbar { width: 4px; }
    .dsr-modal-box::-webkit-scrollbar-track { background: #F3F4F6; }
    .dsr-modal-box::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 2px; }

    @keyframes ei-pulse {
      0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
      70%  { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
      100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
    }
    .ei-import-btn { animation: ei-pulse 2s ease-out 1; }
    .ei-import-btn:hover { background: #059669 !important; }

    .ei-input { transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
    .ei-input:focus { border-color: #00B8A2 !important; box-shadow: 0 0 0 3px rgba(0,184,162,0.15) !important; }
    .ei-row-new { background: #F0FDF4; }
    .ei-row-dup { background: #FFF7ED; }
    .ei-row-new td:first-child { border-left: 3px solid #10B981; }
    .ei-row-dup td:first-child { border-left: 3px solid #F59E0B; }
    .ei-check:checked { accent-color: #00B8A2; }
    .ei-btn-primary { background: #00B8A2; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; transition: background 0.15s, transform 0.1s; }
    .ei-btn-primary:hover:not(:disabled) { background: #009e8c; transform: translateY(-1px); }
    .ei-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .ei-btn-secondary { background: #F3F4F6; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; cursor: pointer; font-weight: 500; transition: background 0.15s; }
    .ei-btn-secondary:hover { background: #E5E7EB; }
    .ei-dropzone { border: 2px dashed #D1D5DB; border-radius: 12px; background: #FAFAFA; transition: border-color 0.2s, background 0.2s; cursor: pointer; }
    .ei-dropzone.dragover { border-color: #00B8A2; background: #F0FDFA; }
    .ei-table { border-collapse: collapse; width: 100%; font-size: 12px; }
    .ei-table th { background: #F3F4F6; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; padding: 8px 10px; border-bottom: 1px solid #E5E7EB; position: sticky; top: 0; z-index: 1; }
    .ei-table td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: middle; color: #111827; }
    .ei-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; }
    .ei-badge-new { background: #D1FAE5; color: #065F46; }
    .ei-badge-dup { background: #FEF3C7; color: #92400E; }
    .ei-toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); color: #fff; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 9999; white-space: nowrap; box-shadow: 0 8px 24px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 8px; }
    @media (max-width: 640px) { .ei-desktop-only { display: none !important; } }

    @media (min-width: 768px) {
      .dsr-layout { display: grid !important; grid-template-columns: 220px 1fr !important; min-height: 100vh !important; }
      .dsr-sidebar { display: flex !important; }
      .dsr-mobile-tabbar { display: none !important; }
      .dsr-main { padding: 28px 32px !important; max-width: 800px !important; }
      .dsr-header { padding: 20px 24px !important; margin-bottom: 20px !important; }
      .dsr-metrics-row { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
      .dsr-grid2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      .dsr-record-detail-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
      .dsr-cust-banner-grid { grid-template-columns: repeat(3, 1fr) !important; }
    }
    @media (max-width: 767px) {
      .dsr-sidebar { display: none !important; }
      .dsr-mobile-tabbar { display: flex !important; }
    }
  `;
  document.head.appendChild(style);
};

// ─── ExcelImporter Column Map ─────────────────────────────────────────────────
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

// ─── ExcelImporter Component ──────────────────────────────────────────────────
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
          let headerRowIdx = 0;
          for (let i = 0; i < Math.min(5, raw.length); i++) {
            if (raw[i].some((cell) => String(cell).trim() === "Customer")) {
              headerRowIdx = i;
              break;
            }
          }
          const headers = raw[headerRowIdx].map((h) => String(h).trim());
          const dataRows = raw.slice(headerRowIdx + 1);
          const seenInFile = {};
          dataRows.forEach((row, i) => {
            const custIdx = headers.indexOf("Customer");
            const custName =
              custIdx >= 0 ? String(row[custIdx] || "").trim() : "";
            if (custName) seenInFile[custName] = i;
          });
          const parsed = [];
          dataRows.forEach((row, i) => {
            const obj = {};
            headers.forEach((h, j) => {
              const key = EI_COL_MAP[h];
              if (key) obj[key] = row[j];
            });
            const name = String(obj.name || "").trim();
            if (!name) return;
            if (seenInFile[name] !== i) return;
            const normalized = {
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
            const isDup = !!existingCustomers[name];
            normalized._isDup = isDup;
            normalized._status = isDup ? "dup" : "new";
            parsed.push(normalized);
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
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  };
  const handleFileChange = (e) => {
    if (e.target.files[0]) parseFile(e.target.files[0]);
  };
  const toggleRow = (idx) => setSelected((p) => ({ ...p, [idx]: !p[idx] }));
  const selectAllNew = () => {
    const sel = {};
    rows.forEach((r, i) => {
      sel[i] = !r._isDup;
    });
    setSelected(sel);
  };
  const selectAll = () => {
    const sel = {};
    rows.forEach((r, i) => {
      sel[i] = r._status !== "skip";
    });
    setSelected(sel);
  };
  const deselectAll = () => {
    const sel = {};
    rows.forEach((_, i) => {
      sel[i] = false;
    });
    setSelected(sel);
  };

  const selectedRows = rows.filter((_, i) => selected[i]);
  const newCount = rows.filter((r) => !r._isDup).length;
  const dupCount = rows.filter((r) => r._isDup).length;

  const handleImport = async () => {
    if (selectedRows.length === 0) {
      showEiToast("Koi customer select nahi kiya.", "error");
      return;
    }
    setImporting(true);
    let successCount = 0,
      failCount = 0;
    const importedCustomers = {};
    for (const r of selectedRows) {
      const payload = {
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
          const existingId = existingCustomers[r.name]?._id;
          if (existingId) {
            const res = await fetch(
              `${apiBase}/api/dsr/customers/${existingId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getTokenProp()}`,
                },
                body: JSON.stringify(payload),
              },
            );
            const data = await res.json();
            if (res.ok && data.data) {
              importedCustomers[r.name] = data.data;
              successCount++;
            } else failCount++;
          } else failCount++;
        } else if (!r._isDup) {
          const res = await fetch(`${apiBase}/api/dsr/customers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getTokenProp()}`,
            },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (res.ok && data.data) {
            Object.assign(importedCustomers, data.data);
            successCount++;
          } else failCount++;
        }
      } catch {
        failCount++;
      }
    }
    setImporting(false);
    setDone(true);
    if (successCount > 0) {
      showEiToast(
        `${successCount} customer${successCount > 1 ? "s" : ""} import ho gaye!${failCount > 0 ? ` (${failCount} fail)` : ""}`,
      );
      if (onImportDone) onImportDone(importedCustomers);
    } else showEiToast("Import fail ho gaya.", "error");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,46,78,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 16,
        backdropFilter: "blur(2px)",
      }}
    >
      {eiToast.msg && (
        <div
          className="ei-toast"
          style={{
            background: eiToast.type === "error" ? "#BE123C" : "#047857",
          }}
        >
          {eiToast.type === "error" ? "✕" : "✓"} {eiToast.msg}
        </div>
      )}
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 700,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 64px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, #0B2E4E, #185FA5)",
            padding: "18px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #10B981, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            📥
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              Excel se Customers Import karo
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                marginTop: 2,
              }}
            >
              DVR.xlsx ya koi bhi DSR format ki file upload karo
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.1)",
              color: "#fff",
              cursor: "pointer",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
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
              <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0B2E4E",
                  marginBottom: 6,
                }}
              >
                Excel file yahan drop karo
              </div>
              <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 16 }}>
                ya click karke select karo (.xlsx, .xls)
              </div>
              <div
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  background: "#00B8A2",
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                📂 File Browse karo
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                style={{ display: "none" }}
                onChange={handleFileChange}
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
                    background: "#D1FAE5",
                    color: "#065F46",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ✦ {newCount} Naye
                </div>
                {dupCount > 0 && (
                  <div
                    style={{
                      padding: "6px 14px",
                      background: "#FEF3C7",
                      color: "#92400E",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ⚠ {dupCount} Exist
                  </div>
                )}
                <div
                  style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280" }}
                >
                  {selectedRows.length} selected
                </div>
              </div>
              {dupCount > 0 && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#FFF7ED",
                    border: "1px solid #FDE68A",
                    borderLeft: "4px solid #F59E0B",
                    borderRadius: 10,
                    marginBottom: 14,
                    fontSize: 12,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#92400E",
                      marginBottom: 8,
                    }}
                  >
                    ⚠ Duplicates ke liye:
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
                          border: `1px solid ${dupAction === val ? "#F59E0B" : "#E5E7EB"}`,
                          background: dupAction === val ? "#FEF3C7" : "#fff",
                          fontWeight: dupAction === val ? 700 : 400,
                          color: dupAction === val ? "#92400E" : "#374151",
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
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="ei-btn-secondary"
                  onClick={selectAllNew}
                  style={{ fontSize: 11, padding: "4px 10px" }}
                >
                  ✓ Sirf naye
                </button>
                <button
                  className="ei-btn-secondary"
                  onClick={selectAll}
                  style={{ fontSize: 11, padding: "4px 10px" }}
                >
                  ✓ Sab select
                </button>
                <button
                  className="ei-btn-secondary"
                  onClick={deselectAll}
                  style={{ fontSize: 11, padding: "4px 10px" }}
                >
                  ✕ Deselect all
                </button>
              </div>
              <div
                style={{
                  border: "1px solid #E5E7EB",
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
                      const isSelected = !!selected[idx];
                      return (
                        <tr
                          key={idx}
                          className={
                            r._isDup
                              ? "ei-row-dup"
                              : isSelected
                                ? "ei-row-new"
                                : ""
                          }
                          style={{ cursor: "pointer" }}
                          onClick={() => toggleRow(idx)}
                        >
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              className="ei-check"
                              checked={isSelected}
                              onChange={() => toggleRow(idx)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={r._isDup && dupAction === "skip"}
                            />
                          </td>
                          <td style={{ fontWeight: 600, color: "#0B2E4E" }}>
                            {r.name}
                          </td>
                          <td>{r.area}</td>
                          <td className="ei-desktop-only">₹{r.potDyes}L</td>
                          <td className="ei-desktop-only">₹{r.abp}L</td>
                          <td>
                            <span
                              className={`ei-badge ${r._isDup ? "ei-badge-dup" : "ei-badge-new"}`}
                            >
                              {r._isDup ? "⚠ Dup" : "✦ New"}
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
                  style={{ fontSize: 12, padding: "5px 14px" }}
                >
                  🔄 Alag file upload karo
                </button>
              </div>
            </>
          )}
        </div>
        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            gap: 10,
            alignItems: "center",
            background: "#FAFAFA",
            flexShrink: 0,
          }}
        >
          {done ? (
            <button
              className="ei-btn-primary"
              onClick={onClose}
              style={{ flex: 1, height: 42, fontSize: 14 }}
            >
              ✓ Done — Close karo
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
                disabled={
                  importing || selectedRows.length === 0 || rows.length === 0
                }
                style={{ flex: 2, height: 42, fontSize: 14 }}
              >
                {importing
                  ? `⏳ Import ho raha hai…`
                  : rows.length === 0
                    ? "📂 Pehle file upload karo"
                    : `📥 ${selectedRows.length} Customers Import karo`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Export Dropdown Component ────────────────────────────────────────────────
const EXPORT_OPTIONS = [
  { id: "all", label: "All records", icon: "📊", weeks: null },
  { id: "custom", label: "Custom range", icon: "🗓", weeks: null },
];

const ExportDropdown = ({ records, onExport }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleExport = (optId) => {
    const opt = EXPORT_OPTIONS.find((o) => o.id === optId);
    let filtered = records;
    if (opt?.weeks) {
      const { start, end } = getWeekRange(opt.weeks);
      filtered = records.filter((r) => inRange(r.date, start, end));
    } else if (optId === "custom" && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      filtered = records.filter((r) => inRange(r.date, start, end));
    }
    onExport(filtered, opt?.label || "Custom");
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
          transition: "background 0.15s",
        }}
      >
        ⬇ Export {open ? "▲" : "▼"}
      </button>
      {open && (
        <div className="dsr-export-menu">
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#9CA3AF",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              padding: "2px 12px 6px",
            }}
          >
            Export range
          </div>
          {EXPORT_OPTIONS.filter((o) => o.id !== "custom").map((opt) => (
            <button
              key={opt.id}
              className={`dsr-export-menu-item${selected === opt.id ? " active" : ""}`}
              onClick={() => {
                setSelected(opt.id);
                handleExport(opt.id);
              }}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              {opt.weeks && (
                <span
                  style={{ marginLeft: "auto", fontSize: 10, color: "#9CA3AF" }}
                >
                  {
                    records.filter((r) =>
                      inRange(
                        r.date,
                        ...Object.values(getWeekRange(opt.weeks)),
                      ),
                    ).length
                  }{" "}
                  records
                </span>
              )}
              {!opt.weeks && opt.id === "all" && (
                <span
                  style={{ marginLeft: "auto", fontSize: 10, color: "#9CA3AF" }}
                >
                  {records.length} records
                </span>
              )}
            </button>
          ))}
          <div className="dsr-export-divider" />
          <div className="dsr-export-custom-row">
            <label>Custom date range</label>
            <div className="dsr-export-custom-inputs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="dsr-input"
                style={{
                  flex: 1,
                  height: 32,
                  padding: "0 8px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="dsr-input"
                style={{
                  flex: 1,
                  height: 32,
                  padding: "0 8px",
                  border: "1px solid #D1D5DB",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
            </div>
            <button
              onClick={() => {
                setSelected("custom");
                handleExport("custom");
              }}
              disabled={!customStart || !customEnd}
              style={{
                marginTop: 4,
                height: 32,
                background: customStart && customEnd ? "#047857" : "#E5E7EB",
                color: customStart && customEnd ? "#fff" : "#9CA3AF",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: customStart && customEnd ? "pointer" : "not-allowed",
                transition: "background 0.15s",
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

// ─── Customer Last-Record Banner ──────────────────────────────────────────────
const CustomerLastRecord = ({ record }) => {
  if (!record) return null;
  const sc = stageColor(record.stage);
  return (
    <div className="dsr-cust-banner">
      <div className="dsr-cust-banner-title">
        <span>📌</span>
        <span>{record.customer} — last visit</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 400,
            color: "#0F766E",
          }}
        >
          {fmtDate(record.date)}
        </span>
      </div>
      {record.objective && (
        <div
          style={{
            fontSize: 12,
            color: "#134E4A",
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
            color: "#134E4A",
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
      <span style={{ fontSize: 10, flexShrink: 0 }}>🕐</span>
      <span className="hint-text">
        <span style={{ fontWeight: 600, marginRight: 3 }}>Last:</span>
        {value}
      </span>
      <span className="hint-use">↑ reuse</span>
    </div>
  );
};

const MetricCard = ({ label, value, sub, accent }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 10,
      padding: "14px 16px",
      border: "1px solid #E5E7EB",
      borderTop: `3px solid ${accent || "#00B8A2"}`,
    }}
  >
    <div
      style={{
        fontSize: 10,
        color: "#8A9BB0",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      style={{ fontSize: 24, fontWeight: 700, color: "#0B2E4E", lineHeight: 1 }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 11, color: "#8A9BB0", marginTop: 4 }}>{sub}</div>
    )}
  </div>
);

const FieldLabel = ({ children, required, keyBadge }) => (
  <label
    style={{
      display: "block",
      fontSize: 11,
      color: "#4B5563",
      marginBottom: 5,
      fontWeight: 600,
      letterSpacing: "0.02em",
    }}
  >
    {children}
    {required && <span style={{ color: "#F43F5E", marginLeft: 2 }}>*</span>}
    {keyBadge && (
      <span
        style={{
          marginLeft: 6,
          fontSize: 10,
          fontWeight: 700,
          color: "#D97706",
          background: "#FEF3C7",
          padding: "1px 6px",
          borderRadius: 4,
          letterSpacing: "0.03em",
        }}
      >
        ★ KEY
      </span>
    )}
  </label>
);

const inputStyle = {
  width: "100%",
  height: 38,
  padding: "0 12px",
  border: "1px solid #D1D5DB",
  borderRadius: 8,
  fontSize: 13,
  color: "#111827",
  background: "#FAFAFA",
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};
const inputHighlightStyle = {
  ...inputStyle,
  borderColor: "#F59E0B",
  background: "#FFFBEB",
  boxShadow: "0 0 0 2px rgba(245,158,11,0.18)",
};

const FormInput = ({ label, required, keyBadge, highlight, ...props }) => (
  <div style={{ marginBottom: 12 }}>
    {label && (
      <FieldLabel required={required} keyBadge={keyBadge}>
        {label}
      </FieldLabel>
    )}
    <input
      className={highlight ? "dsr-input dsr-input-highlight" : "dsr-input"}
      style={highlight ? inputHighlightStyle : inputStyle}
      {...props}
    />
  </div>
);

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
    <select
      className={highlight ? "dsr-input dsr-input-highlight" : "dsr-input"}
      style={{
        ...(highlight ? inputHighlightStyle : inputStyle),
        cursor: "pointer",
      }}
      {...props}
    >
      {children}
    </select>
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
        padding: "10px 20px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 500,
        zIndex: 1000,
        whiteSpace: "nowrap",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
        background: type === "error" ? "#BE123C" : "#047857",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      {type === "error" ? "✕" : "✓"} {msg}
    </div>
  );
};

// ─── Enhanced Record Card with Expand/Collapse ────────────────────────────────
const RecordCard = ({ record, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const color = pctColor(record.pct);
  const sc = stageColor(record.stage);
  const id = record._id || record.id;

  return (
    <div
      className={`dsr-record-card${expanded ? " dsr-card-expanded" : ""}`}
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        overflow: "hidden",
        borderLeft: `4px solid ${sc.border}`,
      }}
    >
      {/* Main visible content */}
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
                color: "#0B2E4E",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {record.customer}
            </div>
            <div style={{ fontSize: 11, color: "#8A9BB0", marginTop: 2 }}>
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
                background: "#EEF6FF",
                color: "#1D4ED8",
                border: "1px solid #BFDBFE",
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

        {/* Objective & Outcome – always visible */}
        {record.objective && (
          <div
            style={{
              fontSize: 12,
              color: "#374151",
              marginBottom: 6,
              lineHeight: 1.4,
              background: "#F0FDF4",
              borderRadius: 6,
              padding: "6px 10px",
              borderLeft: "3px solid #10B981",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#6B7280",
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
              color: "#374151",
              marginBottom: 8,
              lineHeight: 1.4,
              background: "#EFF6FF",
              borderRadius: 6,
              padding: "6px 10px",
              borderLeft: "3px solid #3B82F6",
            }}
          >
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#6B7280",
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

        {/* Compact summary row — always visible */}
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
            <div
              style={{
                height: 5,
                background: "#E5E7EB",
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
          <button
            className="dsr-btn-danger"
            onClick={() => onDelete(id)}
            style={{
              color: "#BE123C",
              background: "transparent",
              border: "1px solid #FECACA",
              height: 30,
              padding: "0 10px",
              borderRadius: 6,
              fontSize: 11,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            🗑 Delete
          </button>
        </div>
      </div>

      {/* Expandable detail section */}
      <div className={`dsr-card-detail-section${expanded ? " open" : ""}`}>
        <div
          style={{
            margin: "0 14px",
            borderTop: "1px dashed #E5E7EB",
            paddingTop: 12,
            paddingBottom: 14,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#8A9BB0",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            💰 Financial Details (₹ Lakhs)
          </div>
          <div
            className="dsr-record-detail-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "10px 14px",
              padding: "12px 14px",
              background: "#F9FAFB",
              borderRadius: 10,
              border: "1px solid #F3F4F6",
            }}
          >
            {[
              ["Pot. Dyes", record.potDyes, "#2563EB"],
              ["Pot. Aux", record.potAux, "#7C3AED"],
              ["Ex. Dyes", record.exDyes, "#0F766E"],
              ["Ex. Aux", record.exAux, "#0F766E"],
              ["ABP AM26", record.abp, "#B45309"],
              ["YTD Sale", record.ytd, "#7C3AED"],
            ].map(([key, val, clr]) => (
              <div
                key={key}
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  background: "#fff",
                  borderRadius: 8,
                  border: "1px solid #F3F4F6",
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: "#9CA3AF",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 4,
                  }}
                >
                  {key}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: clr }}>
                  ₹{val}L
                </div>
              </div>
            ))}
          </div>
          <div
            style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            <div
              style={{
                flex: 1,
                minWidth: 120,
                padding: "8px 12px",
                background: "#F0FDF4",
                borderRadius: 8,
                border: "1px solid #A7F3D0",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "#6B7280",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Potential
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#047857",
                  marginTop: 2,
                }}
              >
                ₹{(toNum(record.potDyes) + toNum(record.potAux)).toFixed(2)}
                L/mth
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 120,
                padding: "8px 12px",
                background: "#EFF6FF",
                borderRadius: 8,
                border: "1px solid #BFDBFE",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "#6B7280",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Total Existing
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#1D4ED8",
                  marginTop: 2,
                }}
              >
                ₹{(toNum(record.exDyes) + toNum(record.exAux)).toFixed(2)}L/mth
              </div>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 120,
                padding: "8px 12px",
                background: "#FFF7ED",
                borderRadius: 8,
                border: "1px solid #FDE68A",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: "#6B7280",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                YTD vs ABP
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: color,
                  marginTop: 2,
                }}
              >
                {record.pct}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "records", icon: "📋", label: "Records" },
  { id: "add", icon: "➕", label: "Add Record" },
  { id: "customers", icon: "🏪", label: "Customers" },
];

const Sidebar = ({ active, onChange, recordCount }) => (
  <div
    className="dsr-sidebar"
    style={{
      background: "#0B2E4E",
      flexDirection: "column",
      padding: "0",
      position: "sticky",
      top: 0,
      height: "100vh",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        padding: "24px 20px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
            DSR
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
            Sales Management
          </div>
        </div>
      </div>
    </div>
    <nav style={{ padding: "12px 10px", flex: 1 }}>
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
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            marginBottom: 2,
            fontSize: 13,
            fontWeight: active === t.id ? 600 : 400,
            color: active === t.id ? "#00B8A2" : "rgba(255,255,255,0.6)",
            background:
              active === t.id ? "rgba(0,184,162,0.18)" : "transparent",
            textAlign: "left",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span>{t.label}</span>
          {t.id === "records" && recordCount > 0 && (
            <span
              style={{
                marginLeft: "auto",
                background: "#00B8A2",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 7px",
                borderRadius: 10,
                lineHeight: "16px",
              }}
            >
              {recordCount}
            </span>
          )}
        </button>
      ))}
    </nav>
    <div
      style={{
        padding: "12px 20px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
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
      background: "#fff",
      borderTop: "1px solid #E5E7EB",
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
        color: "#9CA3AF",
      }}
    >
      <span style={{ fontSize: 20 }}>←</span>
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
          color: active === t.id ? "#00B8A2" : "#9CA3AF",
          position: "relative",
        }}
      >
        <span style={{ fontSize: 20 }}>{t.icon}</span>
        <span style={{ fontSize: 9, fontWeight: active === t.id ? 700 : 400 }}>
          {t.label}
        </span>
        {t.id === "records" && recordCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: "22%",
              background: "#F43F5E",
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
        color: active === "records" ? "#00B8A2" : "#9CA3AF",
      }}
    >
      <span style={{ fontSize: 20 }}>🏠</span>
      <span style={{ fontSize: 9 }}>Home</span>
    </button>
  </div>
);

const SectionCard = ({ title, children, style }) => (
  <div
    style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      padding: "16px",
      marginBottom: 14,
      ...style,
    }}
  >
    {title && (
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: "#8A9BB0",
          marginBottom: 14,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {title}
      </div>
    )}
    {children}
  </div>
);

// ─── Customer Modal ───────────────────────────────────────────────────────────
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
    const { name: field, value } = e.target;
    setData((prev) => ({ ...prev, [field]: value }));
  };
  const isEdit = mode === "edit";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,46,78,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
        padding: 16,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        className="dsr-modal-box"
        style={{
          background: "#fff",
          borderRadius: 14,
          padding: 20,
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        <div
          className="dsr-edit-stripe"
          style={{
            background: isEdit
              ? "linear-gradient(135deg, #1D4ED8, #2563EB)"
              : "linear-gradient(135deg, #0B2E4E, #185FA5)",
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>
              {isEdit ? `✏️ Edit: ${editName}` : "New customer"}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
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
              background: "rgba(255,255,255,0.15)",
              border: "none",
              width: 28,
              height: 28,
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 14,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <FieldLabel required>Customer name</FieldLabel>
          <input
            className="dsr-input"
            style={inputStyle}
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
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
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
            color: "#8A9BB0",
            marginBottom: 10,
            marginTop: 4,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          💰 Numbers (₹ Lakhs)
        </div>
        <div
          className="dsr-grid2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
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
              style={inputStyle}
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
                background: "#FFF1F2",
                color: "#BE123C",
                border: "1px solid #FECACA",
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
              🗑 Delete
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 40,
              background: "#F3F4F6",
              color: "#374151",
              border: "1px solid #E5E7EB",
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
              background: isEdit ? "#2563EB" : "#00B8A2",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {saving
              ? "⏳ Saving…"
              : isEdit
                ? "✓ Update customer"
                : "✓ Save customer"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [showImporter, setShowImporter] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");

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

  const selectedCustomerLastRecord = useMemo(() => {
    const name = newRecord.customer;
    if (!name || !customers[name]) return null;
    return customerLastRecord[name] || null;
  }, [newRecord.customer, customers, customerLastRecord]);

  // Filter records based on active filter
  const filteredByDate = useMemo(() => {
    if (activeFilter === "all") return records;
    if (activeFilter === "custom" && filterStart && filterEnd) {
      const start = new Date(filterStart);
      const end = new Date(filterEnd);
      end.setHours(23, 59, 59, 999);
      return records.filter((r) => inRange(r.date, start, end));
    }
    return records;
  }, [records, activeFilter, filterStart, filterEnd]);

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
  const totalPot = filteredByDate
    .reduce((s, r) => s + toNum(r.potDyes) + toNum(r.potAux), 0)
    .toFixed(1);
  const totalYTD = filteredByDate
    .reduce((s, r) => s + toNum(r.ytd), 0)
    .toFixed(1);
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleRecordChange = (e) => {
    const { name, value } = e.target;
    setNewRecord((prev) => ({ ...prev, [name]: value }));
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
      setNewRecord((prev) => ({
        ...prev,
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
    } else setNewRecord((prev) => ({ ...prev, customer: val }));
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
      setRecords((prev) => [res.data, ...prev]);
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
      setRecords((prev) => prev.filter((r) => (r._id || r.id) !== id));
      showToast("Record delete ho gaya.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ─── Enhanced Export with center alignment (xlsx-js-style) ──────────────────
  const NUMERIC_HEADERS = [
    "Potential Dyes (Rs L/mth)",
    "Potential Aux (Rs L/mth)",
    "Existing Dyes (Rs L/mth)",
    "Existing Aux (Rs L/mth)",
    "ABP AM26 (Rs L)",
    "YTD Sale Prev Mth (Rs L)",
    "YTD vs ABP %",
  ];

  const HEADER_STYLE = {
    font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
    fill: { fgColor: { rgb: "0B2E4E" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: false },
    border: {
      bottom: { style: "thin", color: { rgb: "00B8A2" } },
    },
  };

  const NUM_CELL_STYLE = {
    alignment: { horizontal: "center", vertical: "center" },
    font: { sz: 11 },
  };

  const TEXT_CELL_STYLE = {
    alignment: { horizontal: "left", vertical: "center" },
    font: { sz: 11 },
  };

  const doExport = (recordsToExport, label = "All") => {
    const sorted = [...recordsToExport].sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
    const exportData = sorted.map((r) => ({
      Date: r.date
        ? new Date(r.date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "",
      Customer: r.customer,
      Area: r.area,
      Distributor: r.distributor,
      "Project Stage": r.stage,
      Objective: r.objective,
      "Visit Outcome": r.outcome,
      "Potential Dyes (Rs L/mth)": toNum(r.potDyes),
      "Potential Aux (Rs L/mth)": toNum(r.potAux),
      "Existing Dyes (Rs L/mth)": toNum(r.exDyes),
      "Existing Aux (Rs L/mth)": toNum(r.exAux),
      "ABP AM26 (Rs L)": toNum(r.abp),
      "YTD Sale Prev Mth (Rs L)": toNum(r.ytd),
      "YTD vs ABP %": r.pct || 0,
    }));

    if (exportData.length === 0) {
      showToast("Is range mein koi record nahi hai.", "error");
      return;
    }

    const colKeys = Object.keys(exportData[0]);
    const numericSet = new Set(NUMERIC_HEADERS);

    // Build worksheet manually cell-by-cell so styles apply correctly
    const ws = {};

    // Header row (R=0)
    colKeys.forEach((key, C) => {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C });
      ws[addr] = { v: key, t: "s", s: HEADER_STYLE };
    });

    // Data rows (R=1..n)
    exportData.forEach((row, rowIdx) => {
      colKeys.forEach((key, C) => {
        const addr = XLSX.utils.encode_cell({ r: rowIdx + 1, c: C });
        const val = row[key];
        const isNum = numericSet.has(key);
        ws[addr] = {
          v: val,
          t: isNum ? "n" : "s",
          s: isNum ? NUM_CELL_STYLE : TEXT_CELL_STYLE,
        };
      });
    });

    // Set worksheet range
    ws["!ref"] = XLSX.utils.encode_range({
      s: { r: 0, c: 0 },
      e: { r: exportData.length, c: colKeys.length - 1 },
    });

    // Column widths
    ws["!cols"] = [
      { wch: 18 },
      { wch: 24 },
      { wch: 14 },
      { wch: 16 },
      { wch: 30 },
      { wch: 36 },
      { wch: 36 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
      { wch: 14 },
      { wch: 24 },
      { wch: 14 },
    ];

    // Row height for header
    ws["!rows"] = [{ hpt: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DSR Records");

    const filename = `DSR_${label.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    const outBlob = new Blob(
      [XLSX.write(wb, { bookType: "xlsx", type: "array" })],
      {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(outBlob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
    showToast(`Excel download ho raha hai! (${exportData.length} records)`);
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
        const nameChanged = name !== editingCustomer;
        const oldId = customers[editingCustomer]?._id;
        if (!oldId) {
          showToast("Customer ID nahi mila.", "error");
          return;
        }
        const res = await apiFetch(`/api/dsr/customers/${oldId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        const updated = res.data;
        setCustomers((prev) => {
          const next = { ...prev };
          if (nameChanged) delete next[editingCustomer];
          next[updated.name] = {
            _id: updated._id,
            area: updated.area,
            distributor: updated.distributor,
            stage: updated.stage,
            potDyes: updated.potDyes,
            potAux: updated.potAux,
            exDyes: updated.exDyes,
            exAux: updated.exAux,
            abp: updated.abp,
          };
          return next;
        });
        showToast(
          nameChanged
            ? `Naam update: ${editingCustomer} → ${updated.name}`
            : `${name} update ho gaya!`,
        );
      } else {
        const res = await apiFetch("/api/dsr/customers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const newCust = res.data;
        setCustomers((prev) => ({ ...prev, ...newCust }));
        const custData = newCust[name];
        if (custData)
          setNewRecord((prev) => ({
            ...prev,
            customer: name,
            area: custData.area,
            distributor: custData.distributor,
            stage: custData.stage,
            potDyes: custData.potDyes,
            potAux: custData.potAux,
            exDyes: custData.exDyes,
            exAux: custData.exAux,
            abp: custData.abp,
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
      setCustomers((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      if (newRecord.customer === name) setNewRecord({ ...EMPTY_RECORD });
      showToast(`${name} delete ho gaya.`);
      closeModal();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleImportDone = (importedCustomers) => {
    setCustomers((prev) => ({ ...prev, ...importedCustomers }));
    const count = Object.keys(importedCustomers).length;
    showToast(`${count} customer${count !== 1 ? "s" : ""} import ho gaye!`);
    setShowImporter(false);
  };

  const customerList = Object.keys(customers).sort();
  const lr = selectedCustomerLastRecord;

  const FILTER_CHIPS = [{ id: "all", label: "All", count: records.length }];

  return (
    <div
      className="dsr-layout"
      style={{
        background: "#F4F6F9",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: "#111827",
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
        {/* Header */}
        <div
          className="dsr-header"
          style={{
            background: "linear-gradient(135deg, #0B2E4E 0%, #185FA5 100%)",
            borderRadius: 14,
            padding: "16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >

          
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                margin: 0,
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
                color: "rgba(255,255,255,0.55)",
                marginTop: 2,
                marginBottom: 0,
              }}
            >
              Customer data management
            </p>
          </div>
          <button
            className="dsr-topbar-btn"
            onClick={() => setActiveTab("records")}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.18)",
              background:
                activeTab === "records"
                  ? "rgba(0,184,162,0.30)"
                  : "rgba(255,255,255,0.08)",
              color: activeTab === "records" ? "#00B8A2" : "#fff",
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            🏠
          </button>
        </div>

        {/* Metrics */}
        <div
          className="dsr-metrics-row"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
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
            accent="#3B82F6"
          />
          <MetricCard
            label="Avg. YTD vs ABP"
            value={`${avgPct}%`}
            sub="filtered period"
            accent="#00B8A2"
          />
          <MetricCard
            label="Total Potential"
            value={`₹${totalPot}L`}
            sub="dyes + aux /mth"
            accent="#F59E0B"
          />
          <MetricCard
            label="YTD Sales"
            value={`₹${totalYTD}L`}
            sub="prev. month total"
            accent="#A855F7"
          />
        </div>

        {/* RECORDS TAB */}
        {activeTab === "records" && (
          <>
            {/* Filter chips */}
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
                🗓 Custom
              </button>
            </div>

            {/* Custom date inputs */}
            {activeFilter === "custom" && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 12,
                  alignItems: "center",
                  background: "#F0FDFA",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #99F6E4",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: "#0F766E",
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
                  style={{ ...inputStyle, height: 34, flex: 1 }}
                />
                <span
                  style={{ fontSize: 11, color: "#0F766E", fontWeight: 600 }}
                >
                  To
                </span>
                <input
                  type="date"
                  value={filterEnd}
                  onChange={(e) => setFilterEnd(e.target.value)}
                  className="dsr-input"
                  style={{ ...inputStyle, height: 34, flex: 1 }}
                />
              </div>
            )}

            {/* Search + Export */}
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
                    fontSize: 14,
                    color: "#9CA3AF",
                  }}
                >
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search customer, area, distributor…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="dsr-input"
                  style={{ ...inputStyle, paddingLeft: 34 }}
                />
              </div>
              <ExportDropdown records={filteredByDate} onExport={doExport} />
            </div>

            {/* Result count badge */}
            {(activeFilter !== "all" || searchQuery) && (
              <div
                style={{
                  marginBottom: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 12, color: "#6B7280" }}>Showing</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#047857",
                    background: "#D1FAE5",
                    padding: "2px 10px",
                    borderRadius: 20,
                  }}
                >
                  {filteredRecords.length} records
                </span>
                {activeFilter !== "all" && (
                  <button
                    onClick={() => setActiveFilter("all")}
                    style={{
                      fontSize: 11,
                      color: "#6B7280",
                      background: "transparent",
                      border: "1px solid #E5E7EB",
                      borderRadius: 20,
                      padding: "2px 8px",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Clear filter
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 16px",
                  color: "#8A9BB0",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 13 }}>Loading records…</div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 16px",
                  color: "#8A9BB0",
                }}
              >
                <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}
                >
                  No records found
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Try a different filter or search
                </div>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {filteredRecords.map((r) => (
                  <RecordCard
                    key={r._id || r.id}
                    record={r}
                    onDelete={deleteRecord}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ADD RECORD TAB */}
        {activeTab === "add" && (
          <>
            <CustomerLastRecord record={selectedCustomerLastRecord} />
            <SectionCard title="📅 Visit details">
              <div
                className="dsr-grid2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                  gap: 10,
                }}
              >
                <div style={{ marginBottom: 12 }}>
                  <FieldLabel required>Date</FieldLabel>
                  <input
                    className="dsr-input"
                    style={{
                      ...inputStyle,
                      borderColor: !newRecord.date ? "#F59E0B" : "#D1D5DB",
                      background: !newRecord.date ? "#FFFBEB" : "#FAFAFA",
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
                        color: "#B45309",
                        marginTop: 3,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>📅</span>
                      <span>Date manually select karo</span>
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <FieldLabel required>Customer</FieldLabel>
                  <select
                    className="dsr-input"
                    style={{ ...inputStyle, cursor: "pointer" }}
                    name="customer"
                    value={newRecord.customer}
                    onChange={handleCustomerSelect}
                  >
                    <option value="">Select customer</option>
                    {customerList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__add__">＋ Add new customer</option>
                  </select>
                </div>
              </div>
              <div
                className="dsr-grid2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
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
                  style={inputHighlightStyle}
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
                name="stage"
                value={newRecord.stage}
                onChange={handleRecordChange}
                disabled={
                  !!(newRecord.customer && customers[newRecord.customer])
                }
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
                  style={inputHighlightStyle}
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
            <SectionCard title="💰 Numbers (₹ Lakhs)">
              <div
                className="dsr-grid2"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0,1fr))",
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
                    style={inputHighlightStyle}
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
                  color: "#6B7280",
                  background: "#EFF6FF",
                  padding: "9px 12px",
                  borderRadius: 8,
                  marginTop: 4,
                  lineHeight: 1.5,
                  borderLeft: "3px solid #3B82F6",
                }}
              >
                💡 Saved customer select karoge toh fields auto-fill ho
                jaayenge.
              </div>
            </SectionCard>
            <button
              className="dsr-btn-primary"
              onClick={addRecord}
              disabled={loading}
              style={{
                width: "100%",
                height: 44,
                background: "#00B8A2",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {loading ? "⏳ Saving…" : "✚ Save record"}
            </button>
          </>
        )}

        {/* CUSTOMERS TAB */}
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
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0B2E4E" }}>
                🏪 Customer Master{" "}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 400,
                    color: "#8A9BB0",
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
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  📥 Excel Import
                </button>
                <button
                  onClick={openAddCustomer}
                  style={{
                    height: 34,
                    padding: "0 14px",
                    background: "#F0FDF4",
                    color: "#047857",
                    border: "1px solid #A7F3D0",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  ＋ Add
                </button>
              </div>
            </div>
            {customerList.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 16px",
                  color: "#8A9BB0",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 8 }}>🏪</div>
                <div
                  style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}
                >
                  No customers yet
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Excel Import ya manual Add karo
                </div>
              </div>
            ) : (
              customerList.map((name) => {
                const c = customers[name];
                const sc = stageColor(c.stage);
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
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "#EEF6FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#1D4ED8",
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
                          color: "#111827",
                        }}
                      >
                        {name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#8A9BB0", marginTop: 1 }}
                      >
                        {c.area} · {c.distributor}
                        {lastR && (
                          <span style={{ marginLeft: 5, color: "#9CA3AF" }}>
                            · {fmtDate(lastR.date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "3px 9px",
                        borderRadius: 4,
                        fontWeight: 600,
                        background: sc.bg,
                        color: sc.text,
                        flexShrink: 0,
                      }}
                    >
                      {c.stage ? c.stage.split(".")[0] : "—"}
                    </span>
                    <div className="dsr-row-actions">
                      <button
                        className="dsr-btn-edit"
                        onClick={() => openEditCustomer(name)}
                        style={{
                          height: 30,
                          width: 30,
                          borderRadius: 6,
                          border: "1px solid #BFDBFE",
                          background: "transparent",
                          color: "#1D4ED8",
                          fontSize: 13,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="dsr-btn-danger"
                        onClick={() => handleDeleteCustomer(name)}
                        style={{
                          height: 30,
                          width: 30,
                          borderRadius: 6,
                          border: "1px solid #FECACA",
                          background: "transparent",
                          color: "#BE123C",
                          fontSize: 13,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </SectionCard>
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
    </div>
  );
};

export default DailySalesReport;
