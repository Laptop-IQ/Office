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
import "@/features/dsr/dsr.css";
import {
  API,
  BASE,
  CUSTOMER_XLSX_COLS,
  DS,
  INSIGHT_KINDS,
  IS,
  Icon,
  PROJECT_STAGE_OPTIONS,
  PageShell,
  ROUTES,
  SectionCard,
  StageLadder,
  XL_HEAD_STYLE,
  apiFetch,
  cleanMobile,
  daysSince,
  downloadBlob,
  exportCustomersXlsx,
  fmtDate,
  fmtL,
  fmtMobile,
  getInitials,
  getToken,
  isValidMobile,
  parseRoute,
  stageColor,
  styleSheet,
  toNum,
} from "@/features/dsr/shared";
import {
  KeyCustomersPanel,
  KeyViewSwitch,
  KeyStarButton,
  useKeyCustomers,
  countKeyCustomers,
  pickKeyFields,
  mergeKeyFields,
} from "@/features/keyCustomers";

const DISTRIBUTOR_OPTIONS = ["Supple", "Shree Jee Traders"];

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
const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || "");
const isValidGSTIN = (v) =>
  /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(v || "");
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
const pctColor = (pct) => {
  if (pct >= 80) return DS.success;
  if (pct >= 60) return DS.amber;
  return DS.info;
};
const inRange = (dateStr, start, end) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d >= start && d <= end;
};

// Geist fonts: non-render-blocking stylesheet (the component CSS now lives in features/dsr/dsr.css)
const injectFonts = () => {
  if (document.getElementById("dsr-fonts")) return;
  const fl = document.createElement("link");
  fl.id = "dsr-fonts";
  fl.rel = "stylesheet";
  fl.href =
    "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500&display=swap";
  document.head.appendChild(fl);
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
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[rgba(0,0,0,0.80)]"
    >
      {eiToast.msg && (
        <div
          className={`ei-toast ${eiToast.type === "error" ? "bg-[#BE123C]" : "bg-[#047857]"}`}

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
        className="dsr-modal-box flex flex-col w-full max-w-[700px] max-h-[92vh] bg-ds-card rounded-2xl border border-solid border-ds-border [box-shadow:var(--ds-shadow-modal)] overflow-hidden"

      >
        <div
          className="flex items-center gap-3 shrink-0 py-4.5 px-5 bg-ds-banner border-b border-solid border-b-ds-border"
        >
          <div
            className="flex items-center justify-center shrink-0 w-10 h-10 bg-ds-primary rounded-[10px]"
          >
            <Icon
              name="upload"
              size={19}
              strokeWidth={2}
              className="text-[#0A0B10]"
            />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-semibold text-ds-text1">
              Import Customers from Excel
            </div>
            <div className="mt-0.5 text-[12px] text-ds-text2">
              DVR.xlsx or any DSR format
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 [background:color-mix(in_srgb,_var(--wash)_6.0%,_transparent)] text-ds-text2 rounded-lg border border-solid border-ds-border cursor-pointer"
          >
            <Icon name="close" size={15} strokeWidth={2.2} />
          </button>
        </div>
        <div className="flex-1 p-5 overflow-y-auto">
          {rows.length === 0 && (
            <div
              className={`ei-dropzone${dragOver ? " dragover" : ""} py-10 px-5 text-center`}

              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div
                className="flex items-center justify-center w-16 h-16 mt-0 mb-3.5 mx-auto bg-ds-surface rounded-[50%] border border-solid border-ds-border"
              >
                <Icon
                  name="sheet"
                  size={28}
                  strokeWidth={1.6}
                  className="text-ds-primary"
                />
              </div>
              <div
                className="mb-1.5 text-[15px] font-semibold text-ds-text1"
              >
                Drop the Excel file here
              </div>
              <div className="mb-4 text-[13px] text-ds-text2">
                or click to select (.xlsx, .xls)
              </div>
              <div
                className="inline-flex items-center gap-1.5 py-2 px-5 text-[13px] font-semibold bg-ds-primary text-[#0A0B10] rounded-lg cursor-pointer"
              >
                <Icon name="upload" size={13} strokeWidth={2.1} /> Browse File
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files[0]) parseFile(e.target.files[0]);
                }}
              />
            </div>
          )}
          {rows.length === 0 && (
            <div
              className="dsr-glass flex items-center gap-3 flex-wrap py-3.5 px-4 mt-3.5 rounded-[14px]"

            >
              <div className="flex-1 min-w-[200px]">
                <div
                  className="text-[12.5px] font-semibold text-ds-text1"
                >
                  Template chahiye?
                </div>
                <div
                  className="mt-0.5 text-[12px] leading-[1.45] text-ds-text2"
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
                className="flex gap-2 flex-wrap items-center mb-3.5"
              >
                <div
                  className="flex items-center gap-[5px] py-1.5 px-3.5 text-[12px] font-semibold bg-[rgba(212,175,106,0.12)] text-ds-primary rounded-[20px] border border-solid border-[rgba(212,175,106,0.25)]"
                >
                  <Icon name="sparkle" size={11} />
                  {newCount} Naye
                </div>
                {dupCount > 0 && (
                  <div
                    className="flex items-center gap-[5px] py-1.5 px-3.5 text-[12px] font-semibold bg-[rgba(233,207,152,0.10)] text-ds-text1 rounded-[20px] border border-solid border-[rgba(233,207,152,0.25)]"
                  >
                    <Icon name="alert" size={12} strokeWidth={2} />
                    {dupCount} Exist
                  </div>
                )}
                <div
                  className="ml-auto text-[12px] text-ds-text2"
                >
                  {selectedRows.length} selected
                </div>
              </div>
              {dupCount > 0 && (
                <div
                  className="py-2.5 px-3.5 mb-3.5 text-[12px] bg-ds-surface rounded-[10px] border border-solid border-ds-border"
                >
                  <div
                    className="flex items-center gap-[5px] mb-2 font-semibold text-ds-text1"
                  >
                    <Icon name="alert" size={12} strokeWidth={2} /> For
                    duplicates:
                  </div>
                  <div className="flex gap-2">
                    {["skip", "overwrite"].map((val) => (
                      <label
                        key={val}
                        className={`flex items-center gap-1.5 py-[5px] px-3 rounded-md cursor-pointer ${dupAction === val ? "bg-[rgba(245,158,11,0.10)]" : "bg-transparent"} ${dupAction === val ? "font-bold" : "font-normal"} ${dupAction === val ? "text-ds-gold" : "text-ds-text2"}`} style={{ border: `1px solid ${dupAction === val ? DS.amber : DS.border}` }}
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
              <div className="flex gap-2 mb-2.5">
                <button
                  className="ei-btn-secondary inline-flex items-center gap-1 py-1 px-2.5 text-[12px]"
                  onClick={selectAllNew}

                >
                  <Icon name="check" size={11} strokeWidth={2.3} /> New only
                </button>
                <button
                  className="ei-btn-secondary inline-flex items-center gap-1 py-1 px-2.5 text-[12px]"
                  onClick={selectAll}

                >
                  <Icon name="check" size={11} strokeWidth={2.3} /> Sab
                </button>
                <button
                  className="ei-btn-secondary inline-flex items-center gap-1 py-1 px-2.5 text-[12px]"
                  onClick={deselectAll}

                >
                  <Icon name="close" size={11} strokeWidth={2.3} /> Deselect
                </button>
              </div>
              <div
                className="rounded-[10px] border border-solid border-ds-border overflow-hidden overflow-x-auto"
              >
                <table className="ei-table">
                  <thead>
                    <tr>
                      <th className="w-9"></th>
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
                          className={`${r._isDup ? "ei-row-dup" : isSel ? "ei-row-new" : ""} cursor-pointer`}

                          onClick={() => toggleRow(idx)}
                        >
                          <td className="text-center">
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
                          <td className="font-semibold text-ds-text1">
                            {r.name}
                          </td>
                          <td className="text-ds-text2">{r.area}</td>
                          <td
                            className="ei-desktop-only text-[12px] text-ds-text2"

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
                            className="ei-desktop-only text-ds-text1"

                          >
                            ₹{r.potDyes}L
                          </td>
                          <td
                            className="ei-desktop-only text-ds-text1"

                          >
                            ₹{r.abp}L
                          </td>
                          <td>
                            <span
                              className={`ei-badge ${r._isDup ? "ei-badge-dup" : "ei-badge-new"} inline-flex items-center gap-[3px]`}

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
                                className="mt-1 text-[12px] font-semibold text-ds-danger"
                              >
                                Missing: {r._missing.join(", ")}
                              </div>
                            )}
                            {r._issues.length > 0 && (
                              <div
                                className="mt-1 text-[12px] font-semibold text-ds-amber"
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
              <div className="mt-3 text-center">
                <button
                  className="ei-btn-secondary inline-flex items-center gap-[5px] py-[5px] px-3.5 text-[12px]"
                  onClick={() => {
                    setRows([]);
                    setSelected({});
                    setDone(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}

                >
                  <Icon name="refresh" size={12} strokeWidth={2} /> Alag file
                </button>
              </div>
            </>
          )}
        </div>
        <div
          className="flex gap-2.5 items-center shrink-0 py-3.5 px-5 bg-ds-surface border-t border-solid border-t-ds-border"
        >
          {done ? (
            <button
              className="ei-btn-primary flex flex-1 items-center justify-center gap-1.5 h-[42px] text-[14px]"
              onClick={onClose}

            >
              <Icon name="check" size={14} strokeWidth={2.3} /> Done — Close
            </button>
          ) : (
            <>
              <button
                className="ei-btn-secondary flex-1 h-[42px] text-[13px]"
                onClick={onClose}

              >
                Cancel
              </button>
              <button
                className="ei-btn-primary flex [flex:2] items-center justify-center gap-1.5 h-[42px] text-[14px]"
                onClick={handleImport}
                disabled={importing || !selectedRows.length || !rows.length}

              >
                {importing ? (
                  <span
                    className="dsr-spinner w-[14px] h-[14px] m-0 border-t-2 border-solid border-t-[#0A0B10] border-r-2 border-r-[rgba(0,0,0,0.2)] border-b-2 border-b-[rgba(0,0,0,0.2)] border-l-2 border-l-[rgba(0,0,0,0.2)]"

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
        className="dsr-btn-export flex items-center gap-1.5 h-[38px] py-0 px-3.5 text-[12px] font-semibold whitespace-nowrap bg-[#047857] text-[#fff] rounded-lg border-0 cursor-pointer"
        onClick={() => setOpen((p) => !p)}

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
            className="pt-0.5 pb-1.5 px-3 text-[12px] font-semibold text-ds-text3"
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
            <span className="ml-auto text-[12px] text-ds-text3">
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
                className="ei-input flex-1 h-8 py-0 px-2 text-[12px] bg-ds-surface text-ds-text1 rounded-md border border-solid border-ds-border [color-scheme:dark]"

              />
              <span className="text-[12px] text-ds-text3">to</span>
              <input
                type="date"
                value={ce}
                onChange={(e) => setCe(e.target.value)}
                className="ei-input flex-1 h-8 py-0 px-2 text-[12px] bg-ds-surface text-ds-text1 rounded-md border border-solid border-ds-border [color-scheme:dark]"

              />
            </div>
            <button
              onClick={() => {
                setSel("custom");
                doExp("custom");
              }}
              disabled={!cs || !ce}
              className={`h-8 mt-1 text-[12px] font-semibold rounded-md border-0 ${cs && ce ? "bg-[#047857]" : "bg-ds-border"} ${cs && ce ? "text-[#fff]" : "text-ds-text3"} ${cs && ce ? "cursor-pointer" : "cursor-not-allowed"}`}
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
          className="ml-auto text-[12px] font-normal text-ds-text2"
        >
          {fmtDate(record.date)}
        </span>
      </div>
      {record.objective && (
        <div
          className="mb-[5px] text-[12px] leading-[1.4] text-ds-text1"
        >
          <span className="font-semibold">Objective: </span>
          {record.objective}
        </div>
      )}
      {record.outcome && (
        <div
          className="mb-2 text-[12px] leading-[1.4] text-ds-text1"
        >
          <span className="font-semibold">Outcome: </span>
          {record.outcome}
        </div>
      )}
      {record.stage && (
        <div className="mb-2">
          <span
            className="py-[3px] px-2 text-[12px] font-semibold rounded-sm" style={{ background: sc.bg, color: sc.text, border: `1px solid color-mix(in srgb, ${sc.border} 26.7%, transparent)` }}
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
      <Icon name="clock" size={11} strokeWidth={2} className="shrink-0" />
      <span className="hint-text">
        <span className="mr-[3px] font-semibold">Last:</span>
        {value}
      </span>
      <span
        className="hint-use inline-flex items-center gap-0.5"

      >
        <Icon name="arrowUp" size={10} strokeWidth={2.4} /> reuse
      </span>
    </div>
  );
};

const MetricCard = ({ label, value, sub, accent }) => (
  <div
    className="relative pt-[15px] pb-3.5 px-4 bg-ds-card rounded-[14px] border border-solid border-ds-border [box-shadow:var(--ds-shadow-card)] overflow-hidden"
  >
    <div
      className="mb-[7px] text-[12px] font-semibold text-ds-text3"
    >
      {label}
    </div>
    <div
      className="dsr-mono text-[24px] font-medium leading-none text-ds-text1"

    >
      {value}
    </div>
    {sub && (
      <div
        className="mt-[5px] text-[12px] font-medium text-ds-text2"
      >
        {sub}
      </div>
    )}
  </div>
);

const FieldLabel = ({ children, required, keyBadge }) => (
  <label
    className="block mb-[5px] text-[12px] font-semibold text-ds-text2"
  >
    {children}
    {required && <span className="ml-0.5 text-ds-danger">*</span>}
    {keyBadge && (
      <span
        className="inline-flex items-center gap-[3px] py-[1px] pl-[5px] pr-1.5 ml-1.5 text-[12px] font-semibold text-ds-text1 bg-[rgba(233,207,152,0.12)] rounded-sm"
      >
        <Icon name="sparkle" size={9} /> KEY
      </span>
    )}
  </label>
);

const FormInput = ({ label, required, keyBadge, highlight, ...props }) => (
  <div className="mb-3">
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
    // Re-position when the page / a parent scrolls — but NOT when the menu's own
    // list is scrolled (capture-phase "scroll" also fires for the menu itself; reacting
    // to it re-rendered the menu on every touch-scroll frame and fought the scrolling).
    const onScroll = (e) => {
      if (menuRef.current && menuRef.current.contains(e.target)) return;
      place();
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const h = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", h);
    return () => document.removeEventListener("pointerdown", h);
  }, [open]);

  // Keep the highlighted option visible — only when the menu opens or the user moves
  // with the keyboard. Never on hover / touch-scroll / re-position, otherwise the list
  // snaps back to the highlighted option and cannot be scrolled on phones.
  const revealRef = useRef(false);
  const hasPos = !!pos;
  useEffect(() => {
    if (!open || hi < 0 || !hasPos || !revealRef.current) return;
    revealRef.current = false;
    const m = menuRef.current;
    const el = m?.querySelector(`[data-i="${hi}"]`);
    if (!m || !el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < m.scrollTop) m.scrollTop = Math.max(0, top - 5);
    else if (bottom > m.scrollTop + m.clientHeight)
      m.scrollTop = bottom - m.clientHeight + 5;
  }, [open, hi, hasPos]);

  const openMenu = () => {
    if (disabled) return;
    revealRef.current = true;
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
    revealRef.current = true;
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
      revealRef.current = true;
      setHi(options.findIndex(canPick));
    } else if (e.key === "End") {
      e.preventDefault();
      for (let i = options.length - 1; i >= 0; i--)
        if (canPick(options[i])) {
          revealRef.current = true;
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
          className="flex-1 text-left text-ellipsis whitespace-nowrap overflow-hidden"
        >
          {selected?.value ? selected.label : selected?.label || placeholder}
        </span>
        <Icon
          name={open ? "chevronUp" : "chevronDown"}
          size={14}
          strokeWidth={2}
          className={`shrink-0 [transition:color_0.15s] ${open ? "text-ds-primary" : "text-ds-text3"}`}
        />
      </button>

      {open &&
        !disabled &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            className="dsr-scroll fixed z-[1200] p-[5px] bg-ds-surface rounded-xl border border-solid border-ds-border-hi overflow-y-auto overscroll-contain touch-pan-y [box-shadow:var(--ds-shadow-pop)] [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [scrollbar-color:var(--ds-border)_transparent]"
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH, fontFamily:
                "'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}
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
                  className={`flex items-center gap-2 py-[9px] px-3 text-[13px] rounded-lg select-none ${disabledOpt ? "cursor-default" : "cursor-pointer"} ${isSel ? "font-semibold" : "font-normal"} ${isEmptyOpt && allowEmpty && !isSel ? "opacity-85" : "opacity-100"}`} style={{ color: disabledOpt
                      ? DS.text3
                      : isSel
                        ? DS.primary
                        : DS.text1, background: isSel
                      ? DS.primaryDim
                      : active
                        ? "color-mix(in srgb, var(--wash) 6%, transparent)"
                        : "transparent", borderLeft: `2px solid ${isSel ? DS.primary : "transparent"}` }}
                >
                  {sc && (
                    <span
                      className="shrink-0 w-2 h-2 rounded-xs" style={{ background: sc.border }}
                    />
                  )}
                  <span
                    className="flex-1 text-ellipsis whitespace-nowrap leading-[1.4] overflow-hidden"
                    title={opt.label}
                  >
                    {opt.label}
                  </span>
                  {isSel && !disabledOpt && (
                    <Icon
                      name="check"
                      size={13}
                      strokeWidth={2.5}
                      className="shrink-0 text-ds-primary"
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
  <div className="mb-3">
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
      className={`fixed z-[1000] top-5 left-[50%] flex items-center gap-2 py-[11px] px-5 text-[13px] font-semibold whitespace-nowrap text-[#fff] rounded-xl [box-shadow:var(--ds-shadow-raised)] [transform:translateX(-50%)] ${type === "error" ? "bg-[#BE123C]" : "bg-[#047857]"}`}
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
      <div className="mt-0.5 mb-2.5 mx-0">
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
            <b className="dsr-mono text-ds-primary">
              ₹{recPot(record).toFixed(2)}L/mth
            </b>
          </div>
          <div className="wide">
            <span>Total existing</span>
            <b className="dsr-mono text-ds-info">
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
              className="dsr-mono font-semibold"
              style={{ color: pctColor(r.pct) }}
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

// ── Browser cache for the DSR page ─────────────────────────────────────────
// Records + customers are kept in localStorage (separate per logged-in user, see
// lib/userScopedStorage.js). The page paints from this copy instantly and refreshes
// from the server silently in the background, so there is no loading screen after
// the first visit.
const DSR_CACHE_KEY = "dsr_cache_v1";
const readDsrCache = () => {
  try {
    const o = JSON.parse(localStorage.getItem(DSR_CACHE_KEY) || "null");
    return o && typeof o === "object" ? o : null;
  } catch {
    return null;
  }
};
const writeDsrCache = (patch) => {
  try {
    const cur = readDsrCache() || {};
    localStorage.setItem(
      DSR_CACHE_KEY,
      JSON.stringify({ ...cur, ...patch, savedAt: Date.now() }),
    );
  } catch {
    /* storage full / unavailable — page still works, just without the cache */
  }
};

// ── Records loading experience ─────────────────────────────────────────────
// Skeleton that mirrors the real table / card layout, an animated status header
// with rotating messages, and an honest "server is waking up" hint if it drags on.
const LOAD_MESSAGES = [
  "Loading records…",
  "Fetching visit history…",
  "Syncing customers…",
  "Almost there…",
];

const Sk = ({ w = "100%", h = 12, r = 6, style }) => (
  <span
    className="dsr-skeleton"
    style={{
      display: "block",
      width: w,
      height: h,
      borderRadius: r,
      flex: "none",
      ...style,
    }}
  />
);

const RecordsLoading = ({ view }) => {
  const [msg, setMsg] = useState(0);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const t = setInterval(
      () => setMsg((n) => (n + 1) % LOAD_MESSAGES.length),
      2400,
    );
    const s = setTimeout(() => setSlow(true), 8000);
    return () => {
      clearInterval(t);
      clearTimeout(s);
    };
  }, []);
  const rows = Array.from({ length: 6 });
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <div className="dsr-load-head">
        <span className="dsr-wave" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div className="dsr-load-txt">
          <span key={msg} className="dsr-load-msg">
            {LOAD_MESSAGES[msg]}
          </span>
          {slow && (
            <small className="dsr-load-slow">
              Taking a little longer than usual — the server may be waking up.
            </small>
          )}
        </div>
        <span className="dsr-load-prog" aria-hidden="true">
          <i />
        </span>
      </div>

      {view === "table" ? (
        <div className="dsr-rt-wrap" aria-hidden="true">
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
            {rows.map((_, n) => (
              <div
                key={n}
                className="dsr-rt-r dsr-rise"
                style={{ animationDelay: `${n * 70}ms` }}
              >
                <span className="flex items-center gap-2.5">
                  <Sk w={30} h={30} r={15} />
                  <Sk w={`${52 + ((n * 17) % 36)}%`} h={13} />
                </span>
                <Sk w="72%" />
                <Sk w={`${55 + ((n * 11) % 30)}%`} />
                <Sk w={`${45 + ((n * 19) % 40)}%`} />
                <Sk w={28} h={22} r={11} />
                <Sk w={38} />
                <span />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="dsr-rc-grid" aria-hidden="true">
          {rows.map((_, n) => (
            <article
              key={n}
              className="dsr-rc dsr-rise"
              style={{ animationDelay: `${n * 80}ms` }}
            >
              <div className="flex items-center gap-3">
                <Sk w={42} h={42} r={21} />
                <div className="grid flex-1 gap-2">
                  <Sk w={`${48 + ((n * 13) % 30)}%`} h={14} />
                  <Sk w="34%" h={11} />
                </div>
                <Sk w={46} h={22} r={11} />
              </div>
              <div className="flex gap-2 mt-3.5 mb-3 mx-0">
                <Sk w={70} h={22} r={11} />
                <Sk w={90} h={22} r={11} />
              </div>
              <Sk h={8} r={4} style={{ marginBottom: 14 }} />
              <div className="grid gap-2">
                <Sk w="92%" />
                <Sk w="64%" />
              </div>
              <div
                className="flex justify-between mt-4"
              >
                <Sk w={84} h={26} r={8} />
                <Sk w={140} h={26} r={8} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

const RecordsInsights = ({
  latest,
  todayCount,
  followCount,
  followOnly,
  onFollow,
  stage,
  onStage,
  topArea,
  loading = false,
}) => {
  const counts = {};
  latest.forEach((r) => {
    const l = stageLetter(r.stage);
    if (l) counts[l] = (counts[l] || 0) + 1;
  });
  const max = Math.max(1, ...Object.values(counts));
  return (
    <div className="dsr-ins" aria-busy={loading}>
      <div className="dsr-ins-card funnel">
        <div className="dsr-ins-t">Pipeline · customers by stage</div>
        <div className="dsr-fun" role="group" aria-label="Filter by stage">
          {PROJECT_STAGE_OPTIONS.map((st, idx) => {
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
                disabled={loading}
              >
                <span className="n">
                  {loading ? (
                    <Sk w={14} h={11} r={4} style={{ margin: "0 auto" }} />
                  ) : (
                    <span className="dsr-pop">{n}</span>
                  )}
                </span>
                <span className="bar">
                  {loading ? (
                    <i
                      className="sk"
                      style={{
                        height: `${[45, 75, 55, 90, 50, 70, 40, 60][idx % 8]}%`,
                        animationDelay: `${idx * 90}ms`,
                      }}
                    />
                  ) : (
                    <i style={{ height: `${Math.max(6, (n / max) * 100)}%` }} />
                  )}
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
        disabled={loading}
      >
        <div className="dsr-ins-t">Follow-ups due</div>
        <div
          className={`dsr-ins-v dsr-mono ${followCount ? "text-ds-warning" : "text-ds-success"}`}

        >
          {loading ? (
            <Sk w={56} h={30} r={8} />
          ) : (
            <span className="dsr-pop">{followCount}</span>
          )}
        </div>
        <div className="dsr-ins-s">
          no visit in 14+ days · {followOnly ? "showing" : "tap to filter"}
        </div>
      </button>
      <div className="dsr-ins-card stat">
        <div className="dsr-ins-t">Visits today</div>
        <div className="dsr-ins-v dsr-mono text-ds-text1">
          {loading ? (
            <Sk w={56} h={30} r={8} />
          ) : (
            <span className="dsr-pop">{todayCount}</span>
          )}
        </div>
        <div className="dsr-ins-s">
          {loading ? (
            <Sk w="62%" h={12} style={{ marginTop: 2 }} />
          ) : topArea ? (
            `Top area: ${topArea}`
          ) : (
            "no data yet"
          )}
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
    p.keyOnly && ["key", "Key customers", () => p.setKeyOnly(false)],
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
            className="dsr-input dsr-field pl-9 pr-16"

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
            {label}{" "}
            {p.loading ? (
              <span
                className="cnt dsr-skeleton inline-block w-4 h-[10px] align-middle rounded-[5px]"

              />
            ) : (
              <span className="cnt">{p.counts[id]}</span>
            )}
          </button>
        ))}
        <button
          className={`dsr-filter-chip${p.preset === "custom" ? " active" : ""}`}
          onClick={() => p.setPreset("custom")}
        >
          <Icon name="calendar" size={12} strokeWidth={2} /> Custom
        </button>
        {(p.keyCount > 0 || p.keyOnly) && (
          <button
            className={`dsr-filter-chip${p.keyOnly ? " active" : ""}`}
            aria-pressed={!!p.keyOnly}
            title="Show visits of key customers only"
            onClick={() => p.setKeyOnly(!p.keyOnly)}
          >
            <Icon name="star" size={12} strokeWidth={2} /> Key only{" "}
            <span className="cnt">{p.keyCount}</span>
          </button>
        )}
      </div>
      {p.preset === "custom" && (
        <div className="dsr-tb-custom">
          <span>From</span>
          <input
            type="date"
            value={p.start}
            onChange={(e) => p.setStart(e.target.value)}
            className="dsr-input dsr-field flex-1 h-[34px]"

            aria-label="From date"
          />
          <span>To</span>
          <input
            type="date"
            value={p.end}
            onChange={(e) => p.setEnd(e.target.value)}
            className="dsr-input dsr-field flex-1 h-[34px]"

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
    className="dsr-record-card dsr-half-card bg-ds-card rounded-[14px] border border-solid border-ds-border overflow-hidden"

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
      className="pt-3.5 pb-4 px-3.5 cursor-pointer"
    >
      <div
        className="flex justify-between items-center gap-2 mb-3"
      >
        <div
          className="dsr-display flex items-center gap-2.5 flex-wrap min-w-0 text-[17px] text-ds-text1"

        >
          {month.label}
          {delta !== null && delta !== 0 && (
            <span
              className={`text-[12px] font-semibold ${delta > 0 ? "text-ds-success" : "text-ds-danger"}`} style={{ fontFamily: "'Manrope',sans-serif" }}
            >
              {delta > 0 ? `▲ +${delta}` : `▼ ${delta}`} vs last mth
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="py-[5px] px-3 text-[12px] font-semibold whitespace-nowrap text-ds-primary bg-ds-primary-dim rounded-[20px] border border-solid border-[rgba(212,175,106,0.35)]"
          >
            Full report ›
          </span>
        </div>
      </div>
      <div className="grid gap-2">
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
            className="grid gap-2 grid-cols-2"
          >
            {row.map(([lbl, val, clr]) => (
              <div
                key={lbl}
                className={`min-w-0 text-center rounded-[10px] ${ri === 0 ? "py-3 px-1.5" : "py-[9px] px-1.5"} ${ri === 0 ? "bg-ds-card" : "bg-ds-surface"}`} style={{ border: `1px solid ${ri === 0 ? DS.borderHi : DS.border}` }}
              >
                <div
                  className="mb-1 text-[12px] font-semibold text-ds-text3"
                >
                  {lbl}
                </div>
                <div
                  className={`dsr-mono font-medium text-ds-text1 ${ri === 0 ? "text-[22px]" : "text-[14px]"}`}

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
    className="dsr-sidebar sticky top-0 flex-col h-screen p-0 bg-ds-sidebar border-r border-solid border-r-ds-border overflow-hidden"

  >
    <div
      className="pt-5.5 pb-5 px-5 border-b border-solid border-b-ds-border"
    >
      <div className="flex items-center gap-[11px]">
        <div
          className="flex items-center justify-center shrink-0 w-9 h-9 text-[16px] font-black bg-ds-primary text-[#0A0B10] rounded-[10px]"
        >
          D
        </div>
        <div>
          <div
            className="text-[14px] font-semibold tracking-[-0.01em] text-ds-text1"
          >
            DSR
          </div>
          <div
            className="text-[12px] font-medium text-ds-text3"
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
          className={`dsr-nv-ind ${TABS.some((t) => t.id === active) ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
          style={{ "--i": Math.max(
              0,
              TABS.findIndex((t) => t.id === active),
            ) }}
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
    className="dsr-mobile-tabbar dsr-mtb fixed z-50 right-0 bottom-0 left-0 justify-around"
    aria-label="DSR sections"

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

const PageLoading = ({ onBack }) => (
  <PageShell title="Loading…" onBack={onBack} maxWidth={900}>
    <div className="grid gap-3.5">
      <div className="dsr-skeleton h-[110px]" />
      <div className="dsr-skeleton h-[220px]" />
      <div className="dsr-skeleton h-[160px]" />
    </div>
  </PageShell>
);

const PageNotFound = ({ onBack, what }) => (
  <PageShell
    title={`${what} not found`}
    onBack={onBack}
    maxWidth={900}
  >
    <div
      className="dsr-glass py-11 px-5 text-center rounded-2xl"

    >
      <div className="dsr-empty-icon">
        <Icon
          name="alert"
          size={26}
          strokeWidth={1.6}
          className="text-ds-primary"
        />
      </div>
      <div className="text-[15px] font-semibold">
        {what} is not available
      </div>
      <div className="mt-1.5 mb-4.5 mx-0 text-[12.5px] text-ds-text2">
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
    className="dsr-glass min-w-0 py-3.5 px-[15px] rounded-[14px]"

  >
    <div
      className="mb-1.5 text-[12px] font-semibold text-ds-text3"
    >
      {label}
    </div>
    <div
      className="dsr-mono text-[20px] font-semibold text-ellipsis whitespace-nowrap overflow-hidden"
      style={{ color: accent }}
    >
      {value}
    </div>
    {sub && (
      <div className="mt-[3px] text-[12px] text-ds-text2">{sub}</div>
    )}
  </div>
);

const SubHead = ({ icon, children }) => (
  <div
    className="flex items-center gap-1.5 mb-3 text-[12px] font-semibold text-ds-text3"
  >
    {icon && <Icon name={icon} size={12} strokeWidth={2} />} {children}
  </div>
);

const Grid2 = ({ children }) => (
  <div
    className="dsr-grid2 grid gap-3 grid-cols-2"

  >
    {children}
  </div>
);

const SaveBar = ({ onCancel, onSave, saving, label, dirty }) => (
  <div className="dsr-sticky-actions">
    <div className="flex gap-2.5 items-center">
      {dirty && (
        <span
          className="flex items-center gap-[5px] mr-auto text-[12px] font-semibold text-ds-amber"
        >
          <span
            className="w-[6px] h-[6px] bg-ds-amber rounded-[50%]"
          />
          Unsaved changes
        </span>
      )}
      <button
        className={`dsr-ghost-btn h-[42px] ${dirty ? "ml-0" : "ml-auto"}`}
        onClick={onCancel}

      >
        Cancel
      </button>
      <button
        className="dsr-btn-primary flex items-center justify-center gap-2 h-[42px] min-w-[170px] py-0 px-6.5 text-[13.5px] font-semibold text-[#0A0B10] rounded-[10px] border-0 cursor-pointer"
        onClick={onSave}
        disabled={saving}

      >
        {saving ? (
          <span
            className="dsr-spinner w-[14px] h-[14px] m-0 border-t-2 border-solid border-t-[#0A0B10] border-r-2 border-r-[rgba(0,0,0,0.2)] border-b-2 border-b-[rgba(0,0,0,0.2)] border-l-2 border-l-[rgba(0,0,0,0.2)]"

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
    className="flex items-center gap-3.5 flex-wrap py-4 px-[17px] mt-1.5 bg-[rgba(244,63,94,0.05)] rounded-[14px] border border-solid border-[rgba(244,63,94,0.30)]"
  >
    <div className="flex-1 min-w-[200px]">
      <div className="text-[13px] font-semibold text-ds-danger">
        {title}
      </div>
      <div className="mt-[3px] text-[12px] text-ds-text2">{text}</div>
    </div>
    <button
      className="dsr-btn-danger flex items-center gap-1.5 h-[38px] py-0 px-4 text-[12.5px] font-semibold bg-[rgba(244,63,94,0.10)] text-ds-danger rounded-[10px] border border-solid border-[rgba(244,63,94,0.35)] cursor-pointer"
      onClick={onClick}

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
      className="flex gap-3 items-start py-[11px] px-3.5 rounded-xl" style={{ background: tint, border: `1px solid color-mix(in srgb, ${accent} 18.0%, transparent)` }}
    >
      <div
        className="flex items-center justify-center shrink-0 w-7 h-7 mt-[1px] rounded-lg" style={{ background: `color-mix(in srgb, ${accent} 12.2%, transparent)`, color: accent }}
      >
        <Icon name={icon} size={14} strokeWidth={2.1} />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="mb-1 text-[12px] font-semibold" style={{ color: accent }}
        >
          {label}
        </div>
        <div
          className="text-[13.5px] font-semibold leading-normal [word-break:break-word] text-ds-text1"
        >
          {text || (
            <span className="font-medium text-ds-text3">— none —</span>
          )}
        </div>
      </div>
    </div>
  );
  return (
    <div
      className={`dsr-record-card pt-[15px] pb-4 px-4 bg-ds-card rounded-2xl ${isLatest ? "[box-shadow:0_0_0_1px_var(--ds-primaryDim)]" : ""}`}
      style={{ border: `1px solid ${isLatest ? DS.primary + "99" : DS.border}` }}
    >
      <div
        className="flex items-center justify-between gap-2 flex-wrap mb-[13px]"
      >
        <div
          className="flex items-center gap-2 text-[14px] font-semibold"
        >
          <Icon
            name="calendar"
            size={15}
            strokeWidth={2}
            className="text-ds-primary"
          />
          {fmtDate(r.date) || "Date missing"}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="dsr-mono text-[12px] font-semibold text-ds-text3"

          >
            #{total - index}
          </span>
          {isLatest && (
            <span
              className="py-[3px] px-2.5 text-[12px] font-semibold text-[#0A0B10] bg-ds-primary rounded-[20px]"
            >
              LATEST
            </span>
          )}
          {onEdit && (
            <button
              className="dsr-btn-edit flex items-center gap-[5px] h-[30px] py-0 px-3 text-[12px] font-semibold [background:color-mix(in_srgb,_var(--wash)_3.0%,_transparent)] text-ds-text2 rounded-lg border border-solid border-ds-border cursor-pointer"
              onClick={() => onEdit(r)}

            >
              <Icon name="edit" size={12} strokeWidth={2} /> Edit
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-2.5">
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
        className="flex justify-between mb-[7px]"
      >
        <span className="text-[12px] font-semibold text-ds-text2">
          Market penetration
        </span>
        <span
          className="dsr-mono text-[12px] font-semibold"
          style={{ color: pctColor(pen) }}
        >
          {pen.toFixed(0)}%
        </span>
      </div>
      <div
        className="h-2 bg-ds-border rounded-[5px] overflow-hidden"
      >
        <div
          className="h-full bg-ds-primary [transition:width_.5s_cubic-bezier(0.16,1,0.3,1)]" style={{ width: `${pen}%` }}
        />
      </div>
      <div
        className="flex justify-between mt-2 text-[12px] text-ds-text2"
      >
        <span>Existing {fmtL(ex)}</span>
        <span className="font-semibold text-ds-text1">
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
    className={`dsr-ghost-btn flex-1 min-w-0 no-underline ${disabled ? "opacity-45" : "opacity-100"} ${disabled ? "pointer-events-none" : "pointer-events-auto"}`}
    style={{ color: disabled ? DS.text3 : color }}
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
    <div className="dsr-glass p-4.5 rounded-2xl">
      <SubHead icon="user">Contact</SubHead>
      {!has ? (
        <div className="text-[12px] leading-normal text-ds-text2">
          No contact details yet.
          {onEdit && (
            <button
              className="dsr-ghost-btn w-full mt-3"

              onClick={onEdit}
            >
              <Icon name="addRecord" size={14} /> Add contact
            </button>
          )}
        </div>
      ) : (
        <>
          <div
            className="flex items-center gap-[11px] mb-3"
          >
            <div
              className="flex items-center justify-center shrink-0 w-10 h-10 bg-ds-primary-dim text-ds-primary rounded-xl border border-solid [border-color:color-mix(in_srgb,_var(--ds-primary)_33%,_transparent)]"
            >
              <Icon name="user" size={18} strokeWidth={1.9} />
            </div>
            <div className="min-w-0">
              <div
                className="text-[14px] font-semibold text-ellipsis whitespace-nowrap overflow-hidden"
              >
                {data.contactPerson || name || "—"}
              </div>
              {data.designation && (
                <div className="text-[12px] text-ds-text2">
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
                className={`flex gap-[9px] items-start py-1.5 px-0 text-[12px] [word-break:break-word] ${i ? "border-t border-dashed border-t-ds-border" : "border-t-0"}`}
              >
                <Icon
                  name={ic}
                  size={13}
                  strokeWidth={2}
                  className="mt-0.5 text-ds-primary"
                />
                <span className={ic === "phone" ? "dsr-mono" : undefined}>
                  {v}
                </span>
              </div>
            ))}
          {data.gstin && (
            <div className="mt-2 text-[12px] text-ds-text2">
              GSTIN{" "}
              <span
                className="dsr-mono font-semibold text-ds-text1"

              >
                {data.gstin}
              </span>
            </div>
          )}
          <div className="flex gap-2 mt-3.5">
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
            <div className="flex mt-2">
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
              className="dsr-ghost-btn w-full mt-2"

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
      className="flex items-center gap-[5px] -mt-1.5 mb-2.5 text-[12px] font-semibold" style={{ color:
          type === "error"
            ? DS.danger
            : type === "warn"
              ? DS.amber
              : DS.success }}
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
    <div className="mb-3">
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <span
          className="dsr-mono absolute top-[1px] bottom-[1px] left-[1px] flex items-center justify-center w-[42px] text-[12px] font-semibold text-ds-primary bg-ds-primary-dim rounded-[7px_0_0_7px] border-r border-solid border-r-ds-border"

        >
          +91
        </span>
        <input
          className="dsr-input dsr-field pl-13.5 pr-8.5"

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
            className={`absolute top-[11px] right-[11px] ${ok ? "text-ds-success" : "text-ds-danger"}`}
          >
            <Icon name={ok ? "check" : "alert"} size={15} strokeWidth={2.3} />
          </span>
        )}
      </div>
      {value && !ok && (
        <div
          className="mt-[5px] text-[12px] font-semibold text-ds-danger"
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
    <div className="grid gap-3.5">
      <div className="dsr-glass p-4.5 rounded-2xl">
        <SubHead icon="sparkle">Live summary</SubHead>
        <div
          className="flex items-center gap-[11px] mb-3.5"
        >
          <div
            className="flex items-center justify-center shrink-0 w-[42px] h-[42px] font-semibold text-[13px] bg-ds-primary-dim text-ds-primary rounded-[50%] border border-solid border-ds-primary"
          >
            {getInitials(name || "?")}
          </div>
          <div className="min-w-0">
            <div
              className="text-[14px] font-semibold text-ellipsis whitespace-nowrap overflow-hidden"
            >
              {name || "Customer name"}
            </div>
            <div className="text-[12px] text-ds-text2">
              {data.area || "Area"} · {data.distributor || "Distributor"}
            </div>
          </div>
        </div>
        {data.stage && (
          <span
            className="inline-block max-w-full py-[3px] px-[9px] mb-2 text-[12px] font-semibold text-ellipsis whitespace-nowrap rounded-[5px] overflow-hidden" style={{ background: sc.bg, color: sc.text, border: `1px solid color-mix(in srgb, ${sc.border} 33.3%, transparent)` }}
          >
            {data.stage}
          </span>
        )}
        <StageLadder stage={data.stage} />
        <div className="dsr-stat-grid my-4 mx-0">
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

      <div className="dsr-glass p-4.5 rounded-2xl">
        <SubHead icon="sparkle">Profile completeness</SubHead>
        <div
          className="flex items-baseline justify-between mb-2"
        >
          <span
            className={`dsr-mono text-[24px] font-semibold ${profilePct >= 70 ? "text-ds-success" : "text-ds-primary"}`}

          >
            {profilePct}%
          </span>
          <span className="text-[12px] text-ds-text2">
            contact · GST · notes
          </span>
        </div>
        <div
          className="h-[6px] bg-ds-border rounded-sm overflow-hidden"
        >
          <div
            className="h-full bg-ds-primary [transition:width_.4s]" style={{ width: `${profilePct}%` }}
          />
        </div>
      </div>

      <div className="dsr-glass p-4.5 rounded-2xl">
        <SubHead icon="check">Form checklist</SubHead>
        <div
          className="h-[6px] mb-2 bg-ds-border rounded-sm overflow-hidden"
        >
          <div
            className={`h-full [transition:width_.3s] ${done === required.length ? "bg-ds-success" : "bg-ds-primary"}`} style={{ width: `${(done / required.length) * 100}%` }}
          />
        </div>
        <div className="text-[12px] text-ds-text2">
          {done}/{required.length} required fields complete
        </div>
      </div>

      {isEdit && (
        <div className="dsr-glass p-4.5 rounded-2xl">
          <SubHead icon="clock">Activity</SubHead>
          <div className="mb-3 text-[12.5px]">
            <span
              className="dsr-mono font-semibold text-ds-primary"

            >
              {visitCount}
            </span>{" "}
            visit{visitCount === 1 ? "" : "s"} recorded
          </div>
          <CustomerLastRecord record={lastRecord} />
          <button
            className="dsr-ghost-btn w-full"

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
      title={isEdit ? editName : "Naya customer"}
      subtitle={
        isEdit ? "Update master data" : "Fill in the customer master data"
      }
      avatar={isEdit ? getInitials(editName) : "+"}
      onBack={confirmLeave(dirty, onCancel)}
      aside={aside}
      maxWidth={1100}
    >
      <SectionCard title="Basic details">
        <div className="mb-3">
          <FieldLabel required>Customer name</FieldLabel>
          <input
            className="dsr-input dsr-field"

            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter full name"
          />
          {dupName && (
            <div
              className="flex items-center gap-2 flex-wrap mt-1.5 text-[12px] font-semibold text-ds-amber"
            >
              <Icon name="alert" size={13} /> A customer named "{dupName}"
              already exists.
              {onOpenOther && (
                <button
                  className="dsr-ghost-btn h-[26px] py-0 px-2.5 text-[12px]"

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
          <div className="mb-3">
            <FieldLabel>Designation</FieldLabel>
            <input
              className="dsr-input dsr-field"

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
        <div className="mb-1">
          <FieldLabel>Notes / remarks</FieldLabel>
          <textarea
            className="dsr-input dsr-field h-21 py-2.5 px-3 leading-normal [font-family:inherit] resize-y"
            name="notes"
            value={data.notes}
            onChange={handleChange}
            placeholder="Preferred time, decision maker, special instructions…"

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
    <div className="grid gap-3.5">
      <div className="dsr-glass p-4.5 rounded-2xl">
        <SubHead icon="trending">YTD vs ABP (live)</SubHead>
        <div
          className="dsr-mono text-[30px] font-semibold"
          style={{ color: pctColor(livePct) }}
        >
          {livePct.toFixed(1)}%
        </div>
        <div
          className="h-2 mt-2.5 mb-2 mx-0 bg-ds-border rounded-[5px] overflow-hidden"
        >
          <div
            className="h-full [transition:width_.4s]" style={{ width: `${Math.min(100, livePct)}%`, background: pctColor(livePct) }}
          />
        </div>
        <div className="text-[12px] text-ds-text2">
          {fmtL(ytd)} of {fmtL(abp)} ABP
        </div>
        <div className="mt-3.5">
          <StageLadder stage={data.stage} />
        </div>
      </div>

      <div className="dsr-glass p-4.5 rounded-2xl">
        <SubHead icon="clock">Pichli visit</SubHead>
        {prev ? (
          <>
            <CustomerLastRecord record={prev} />
            <div className="text-[12px] text-ds-text2">
              Outcome: {prev.outcome || "—"}
            </div>
          </>
        ) : (
          <div className="text-[12px] text-ds-text2">
            This is the customer's first visit.
          </div>
        )}
        <button
          className="dsr-ghost-btn w-full mt-3"

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
      title={record.customer || "Record"}
      subtitle={`${fmtDate(record.date)} · visit record edit`}
      avatar={getInitials(record.customer || "?")}
      onBack={confirmLeave(dirty, onCancel)}
      aside={aside}
      maxWidth={1100}
    >
      <SectionCard title="Visit details">
        <Grid2>
          <div className="mb-3">
            <FieldLabel required>Date</FieldLabel>
            <input
              className="dsr-input dsr-field"

              type="date"
              name="date"
              value={data.date}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
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
    <div className="grid gap-3.5">
      <ContactCard
        data={pickContact(customer)}
        name={name}
        onEdit={onEditCustomer}
      />
      <div className="dsr-glass p-4.5 rounded-2xl">
        <SubHead icon="store">Customer master</SubHead>
        <div className="dsr-stat-grid mb-3.5">
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

      <div className="dsr-glass p-4.5 rounded-2xl">
        <SubHead icon="trending">Stage journey</SubHead>
        {journey.length === 0 ? (
          <div className="text-[12px] text-ds-text2">
            No stage records yet.
          </div>
        ) : (
          <div className="grid gap-0">
            {journey.map((j, i) => {
              const c = stageColor(j.stage);
              const isCur = i === journey.length - 1;
              return (
                <div
                  key={`${j.stage}-${i}`}
                  className="flex gap-[11px]"
                >
                  <div
                    className="flex flex-col items-center"
                  >
                    <span
                      className="w-[11px] h-[11px] mt-1 rounded-[50%]" style={{ background: isCur ? c.border : DS.surface, border: `2px solid ${c.border}` }}
                    />
                    {i < journey.length - 1 && (
                      <span
                        className="flex-1 w-[2px] min-h-[22px] bg-ds-border"
                      />
                    )}
                  </div>
                  <div className="min-w-0 pb-3">
                    <div
                      className={`text-[12px] leading-[1.35] ${isCur ? "font-bold" : "font-semibold"}`} style={{ color: isCur ? c.text : DS.text1 }}
                    >
                      {j.stage}
                    </div>
                    <div className="text-[12px] text-ds-text3">
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
      title={name}
      subtitle={`${customer?.area || latest?.area || "—"} · ${customer?.distributor || latest?.distributor || "—"}`}
      avatar={getInitials(name)}
      onBack={onBack}
      aside={aside}
      badge={
        currentStage ? (
          <span
            className="max-w-[300px] py-[5px] px-[11px] text-[12px] font-semibold text-ellipsis whitespace-nowrap rounded-md overflow-hidden" style={{ background: sc.bg, color: sc.text, border: `1px solid color-mix(in srgb, ${sc.border} 40.0%, transparent)` }}
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
            className="dsr-btn-primary flex items-center gap-1.5 h-[38px] py-0 px-4 text-[12.5px] font-semibold text-[#0A0B10] rounded-[10px] border-0 cursor-pointer"
            onClick={onAddVisit}

          >
            <Icon name="addRecord" size={14} strokeWidth={2.2} /> Add visit
          </button>
        </>
      }
    >
      <div className="dsr-stat-grid cols4 mb-4.5">
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
        className="flex gap-2.5 flex-wrap mb-4"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Icon
            name="search"
            size={14}
            className="absolute top-3 left-3 text-ds-text3"
          />
          <input
            className="dsr-input dsr-field h-10 pl-8.5"

            placeholder="Outcome / objective / stage search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button
          className="dsr-ghost-btn h-10"

          disabled={!total}
          onClick={() => exportCustomerHistory(name, customer, records)}
        >
          <Icon name="download" size={14} /> Export Excel
        </button>
      </div>

      {total === 0 ? (
        <div
          className="dsr-glass py-11 px-4 text-center text-ds-text2 rounded-2xl"

        >
          <div className="dsr-empty-icon">
            <Icon
              name="inbox"
              size={26}
              strokeWidth={1.6}
              className="text-ds-primary"
            />
          </div>
          <div className="text-[14.5px] font-semibold text-ds-text1">
            No visits yet
          </div>
          <div className="mt-1 text-[12px]">
            Create this customer's first record with "Add visit"
          </div>
        </div>
      ) : groups.length === 0 ? (
        <div
          className="p-7.5 text-center text-[13px] text-ds-text2"
        >
          No visits match "{q}".
        </div>
      ) : (
        groups.map((g) => (
          <div key={g.key} className="mb-5">
            <div
              className="flex items-center gap-2.5 mb-2.5 text-[12px] font-semibold text-ds-text3"
            >
              <span>{g.label}</span>
              <span className="text-ds-primary">
                · {g.items.length} visit{g.items.length > 1 ? "s" : ""}
              </span>
              <span className="flex-1 h-[1px] bg-ds-border" />
              {g.key !== "unknown" && (
                <button
                  className="dsr-visits-btn py-[3px] px-[11px] text-[12px] font-semibold normal-case tracking-[0] text-ds-primary bg-ds-primary-dim rounded-[20px] border border-solid [border-color:color-mix(in_srgb,_var(--ds-primary)_33%,_transparent)] cursor-pointer"
                  onClick={() => onOpenMonth(g.key)}

                >
                  Month view →
                </button>
              )}
            </div>
            <div className="grid gap-3">
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
          <div className="dsr-glass p-4.5 rounded-2xl">
            <SubHead icon="calendar">Other months</SubHead>
            <div className="grid gap-2">
              {otherMonths.map((m) => (
                <button
                  key={m.key}
                  onClick={() => onOpenMonth(m.key)}
                  className={`dsr-filter-chip justify-between py-[9px] px-3 rounded-[10px] ${m.key === currentKey ? "bg-ds-primary" : ""} ${m.key === currentKey ? "text-[#0A0B10]" : ""} ${m.key === currentKey ? "border-ds-primary" : ""}`}

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
      <div className="dsr-stat-grid cols4 mb-4.5">
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
          className="flex items-center gap-3 flex-wrap mb-4"
        >
          <span
            className="py-1 px-2.5 text-[12px] font-semibold rounded-md" style={{ background: sc.bg, color: sc.text, border: `1px solid color-mix(in srgb, ${sc.border} 40.0%, transparent)` }}
          >
            {latest.stage}
          </span>
          <StageLadder stage={latest.stage} size="sm" />
        </div>
      )}
      <div className="grid gap-3">
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
      <span className="text-[12px] font-semibold text-ds-text3">
        — no change
      </span>
    );
  }
  const up = d > 0;
  return (
    <span
      className={`dsr-mono text-[12px] font-semibold ${up ? "text-ds-success" : "text-ds-danger"}`}

    >
      {up ? "▲ +" : "▼ "}
      {d.toFixed(digits)}
      {suffix}
    </span>
  );
};

const PanelHead = ({ icon, children, onOpen }) => (
  <div
    className="flex justify-between items-start gap-2"
  >
    <SubHead icon={icon}>{children}</SubHead>
    {onOpen && (
      <button className="dsr-viewall" onClick={onOpen}>
        Details
        <span className="flex [transform:rotate(45deg)]">
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
      className="flex justify-between gap-2 mb-1 text-[12px]"
    >
      <span
        className="font-semibold text-ellipsis whitespace-nowrap text-ds-text1 overflow-hidden"
      >
        {label}
      </span>
      <span
        className="dsr-mono shrink-0 font-semibold"
        style={{ color }}
      >
        {right ?? value}
      </span>
    </div>
    <div
      className="h-[6px] bg-ds-border rounded-sm overflow-hidden"
    >
      <div
        className="h-full [transition:width_.5s_cubic-bezier(0.16,1,0.3,1)]" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, background: color }}
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
    <span className="inline-flex gap-2 items-baseline">
      <span>{text}</span>
      {pg && <Delta cur={cur} prev={p} suffix={suffix} digits={digits} />}
    </span>
  );

  // ── aside: kind switch + ranked list ────────────────────────────────────
  const aside = (
    <div className="dsr-glass p-4 rounded-2xl">
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
        className="grid gap-1.5 grid-cols-[minmax(0,1fr)]"
      >
        {groups.map((g) => {
          const on = active && g.id === active.id;
          const sc = kind === "stage" ? stageColor(g.id) : null;
          const color = sc ? sc.border : kind === "area" ? DS.info : DS.primary;
          return (
            <button
              key={g.id}
              className={`dsr-rank-row${on ? " on" : ""} ${g.visits === 0 && !on ? "opacity-55" : "opacity-100"}`}
              onClick={() => onSelect(g.id)}
              aria-pressed={on}

            >
              <div className="dsr-rank-top">
                <span className="dsr-rank-name">{g.label}</span>
                <span className="dsr-mono font-semibold" style={{ color }}>
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
          <div className="text-[12px] text-ds-text2">No data</div>
        )}
      </div>
    </div>
  );

  const title = active ? active.label : meta.label;

  return (
    <PageShell
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
          className="dsr-ghost-btn h-9"

          disabled={!active || active.n === 0}
          onClick={exportGroup}
        >
          <Icon name="download" size={13} /> Excel
        </button>
      }
    >
      {!active ? (
        <div
          className="dsr-glass p-9 text-center rounded-2xl"

        >
          <div className="mb-1.5 font-semibold">
            This {meta.short.toLowerCase()} was not found in this period
          </div>
          <div className="text-[12px] text-ds-text2">
            Pick another {meta.short.toLowerCase()} from the list.
          </div>
        </div>
      ) : (
        <div
          className="grid gap-4 grid-cols-[minmax(0,1fr)]"
        >
          <div
            className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(min(100%,170px),1fr))]"
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

          <div className="dsr-glass p-4.5 rounded-2xl">
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
            <div className="mt-2.5 text-[12px] text-ds-text2">
              {activeDays} active day{activeDays === 1 ? "" : "s"}
              {peak.n > 0 && (
                <>
                  {" "}
                  · busiest <b className="text-ds-text1">{peak.d}</b> (
                  {peak.n} visit{peak.n === 1 ? "" : "s"})
                </>
              )}
            </div>
          </div>

          <div
            className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]"
          >
            {cross.map(({ k, list }) => (
              <div
                key={k}
                className="dsr-glass p-4.5 rounded-2xl"

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
              className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))]"
            >
              <div
                className="dsr-glass p-4.5 rounded-2xl"

              >
                <SubHead icon="clock">Follow-up due · 10+ days silent</SubHead>
                {silent.length === 0 ? (
                  <div className="text-[12px] text-ds-text2">
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
                          className="dsr-mono font-semibold text-ds-warning"

                        >
                          {gapOf(c)}d
                        </span>
                      </button>
                    ))
                )}
              </div>
              <div
                className="dsr-glass p-4.5 rounded-2xl"

              >
                <SubHead icon="lightbulb">Biggest headroom</SubHead>
                {opportunity.length === 0 ? (
                  <div className="text-[12px] text-ds-text2">
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
                        className="dsr-mono font-semibold text-ds-success"

                      >
                        {fmtL(custHeadroom(c))}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="dsr-glass p-4.5 rounded-2xl">
            <div
              className="flex gap-2.5 items-center flex-wrap mb-3"
            >
              <SubHead icon="users">Customers · {shown.length}</SubHead>
              <div className="flex-1" />
              <input
                className="dsr-input dsr-field h-[34px] w-[200px] max-w-full"
                placeholder="Search customer…"
                value={q}
                onChange={(e) => setQ(e.target.value)}

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
                      <span className="text-[12px]">
                        {new Date(c.latest.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                        {gap >= 10 && (
                          <small className="ml-1.5 text-ds-warning">
                            {gap}d
                          </small>
                        )}
                      </span>
                    </div>
                  );
                })}
                {shown.length === 0 && (
                  <div className="p-4.5 text-[12px] text-ds-text2">
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
      className="dsr-ghost-btn h-9"
      disabled={!fn}
      onClick={fn || undefined}

    >
      {dir === "l" && <Icon name="back" size={13} />} {label}
    </button>
  );

  const aside = (
    <div className="grid gap-3.5">
      {pv && (
        <div className="dsr-glass p-4.5 rounded-2xl">
          <SubHead icon="trending">vs previous period</SubHead>
          <div className="mb-3 text-[12px] text-ds-text2">
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
              className="flex justify-between items-center py-2 px-0 border-b border-dashed border-b-ds-border"
            >
              <span className="text-[12px] text-ds-text2">{lbl}</span>
              <span
                className="flex gap-2.5 items-baseline"
              >
                <span
                  className="dsr-mono text-[13px] font-semibold"

                >
                  {cur}
                </span>
                <Delta cur={cur} prev={pr} suffix={suf} digits={dg} />
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="dsr-glass p-4.5 rounded-2xl">
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

      <div className="dsr-glass p-4.5 rounded-2xl">
        <PanelHead icon="store" onOpen={() => onOpenInsight("distributor")}>
          Distributor-wise visits
        </PanelHead>
        {byDist.length === 0 && (
          <div className="text-[12px] text-ds-text2">No data</div>
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

      <div className="dsr-glass p-4.5 rounded-2xl">
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
            className="dsr-ghost-btn h-9"
            disabled={!onNewer}
            onClick={onNewer || undefined}

          >
            Newer{" "}
            <span className="flex [transform:rotate(180deg)]">
              <Icon name="back" size={13} />
            </span>
          </button>
          <button
            className="dsr-ghost-btn h-9"

            onClick={exportPeriod}
          >
            <Icon name="download" size={13} /> Excel
          </button>
        </>
      }
    >
      <div
        className="flex gap-2 flex-wrap mb-3.5"
      >
        {[
          ["full", "Full month"],
          ["1", `1 – 15`],
          ["2", `16 – ${lastDay}`],
        ].map(([id, lbl]) => (
          <button
            key={id}
            className={`dsr-filter-chip${period === id ? " active" : ""} py-[7px] px-4 text-[12.5px]`}
            onClick={() => period !== id && onSwitch(id)}

          >
            {lbl}
          </button>
        ))}
      </div>

      <div className="dsr-stat-grid cols4 mb-3">
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
      <div className="dsr-stat-grid cols4 mb-4.5">
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
          className="dsr-grid2 grid gap-3 grid-cols-2"

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
                className={`dsr-half-card min-w-0 p-3.5 rounded-[14px] ${active ? "bg-ds-primary-dim" : "bg-ds-surface"} ${active ? "cursor-default" : "cursor-pointer"}`}
                style={{ border: `1px solid ${active ? DS.primary : DS.border}` }}
              >
                <div
                  className="flex items-center justify-between gap-2 mb-3"
                >
                  <span
                    className="py-[3px] px-[9px] text-[12px] font-semibold text-[#0A0B10] bg-ds-primary rounded-[20px]"
                  >
                    {h.id === 1 ? "FIRST HALF" : "SECOND HALF"}
                  </span>
                  <span
                    className="dsr-mono text-[13px] font-semibold"

                  >
                    {h.title}
                  </span>
                </div>
                {h.totalVisits === 0 ? (
                  <div
                    className="py-3 px-0 text-[12px] text-center text-ds-text3"
                  >
                    No visits in this period
                  </div>
                ) : (
                  <div
                    className="grid gap-2 grid-cols-2"
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
                        className="min-w-0 py-2 px-2.5 [background:color-mix(in_srgb,_var(--wash)_3.0%,_transparent)] rounded-[9px] border border-solid border-ds-border"
                      >
                        <div
                          className="text-[12px] font-semibold text-ds-text3"
                        >
                          {lbl}
                        </div>
                        <div
                          className="dsr-mono my-0.5 mx-0 text-[15px] font-semibold"
                          style={{ color: clr }}
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
                  <div className="mt-2 text-[12px] text-ds-text3">
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
          className={`flex items-end h-[150px] pt-2 ${period === "full" ? "gap-[3px]" : "gap-1.5"}`}
        >
          {daily.map((x) => (
            <div
              key={x.d}
              title={`${x.d} ${month.label.split(" ")[0]} · ${x.n} visit${x.n === 1 ? "" : "s"}`}
              className="flex flex-1 flex-col items-center justify-end min-w-0 h-full"
            >
              <span
                className={`dsr-mono mb-[3px] text-[12px] ${x.n ? "text-ds-gold" : "text-transparent"}`}

              >
                {x.n || 0}
              </span>
              <div
                className={`w-full max-w-[26px] rounded-[5px_5px_2px_2px] ${x.n ? "min-h-[4px]" : "min-h-[2px]"}`} style={{ height: `${(x.n / maxDaily) * 100}%`, background: x.n
                    ? x.d === peak.d
                      ? DS.primary
                      : DS.borderHi
                    : DS.border }}
              />
            </div>
          ))}
        </div>
        <div
          className={`flex mt-1.5 ${period === "full" ? "gap-[3px]" : "gap-1.5"}`}
        >
          {daily.map((x) => (
            <div
              key={x.d}
              className="dsr-mono flex-1 min-w-0 text-center text-[12px] text-ds-text3"

            >
              {period === "full" && x.d % 5 !== 1 ? "" : x.d}
            </div>
          ))}
        </div>
      </SectionCard>

      {pv && (notRevisited.length > 0 || newThisPeriod.length > 0) && (
        <div
          className="dsr-grid2 grid gap-3 grid-cols-2 mb-3.5"

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
              className="dsr-glass min-w-0 p-4 rounded-2xl"

            >
              <div
                className="mb-[3px] text-[12.5px] font-semibold" style={{ color: clr }}
              >
                {ttl}
              </div>
              <div className="mb-2.5 text-[12px] text-ds-text2">
                {sub}
              </div>
              <div

                className="dsr-scroll flex flex-wrap gap-1.5 max-h-[130px] overflow-y-auto"
              >
                {list.length === 0 && (
                  <span className="text-[12px] text-ds-text3">—</span>
                )}
                {list.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => onOpenCustomer(c.name)}
                    className="dsr-filter-chip py-1 px-2.5 text-[12px]"

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
          className="flex gap-2.5 flex-wrap mb-3"
        >
          <div className="relative flex-1 min-w-[180px]">
            <Icon
              name="search"
              size={14}
              className="absolute top-3 left-3 text-ds-text3"
            />
            <input
              className="dsr-input dsr-field h-10 pl-8.5"

              placeholder="Customer / area / distributor…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
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
        <div className="grid gap-2">
          {shown.length === 0 && (
            <div
              className="p-6 text-center text-[12.5px] text-ds-text2"
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
                className="dsr-customer-row flex items-center gap-3 flex-wrap py-[11px] px-[13px] bg-ds-surface rounded-xl border border-solid border-ds-border"
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

              >
                <span
                  className="dsr-mono w-[22px] text-[12px] font-semibold text-ds-text3"

                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-[150px]">
                  <div
                    className="text-[13px] font-semibold text-ellipsis whitespace-nowrap overflow-hidden"
                  >
                    {c.name}
                  </div>
                  <div className="mt-0.5 text-[12px] text-ds-text2">
                    {c.latest.area} · {c.latest.distributor} · last{" "}
                    {fmtDate(c.latest.date)}
                  </div>
                </div>
                <StageLadder stage={c.latest.stage} size="sm" />
                <div className="min-w-[62px] text-right">
                  <div
                    className="dsr-mono text-[12px] font-semibold text-ds-text1"

                  >
                    {fmtL(pot)}
                  </div>
                  <div
                    className="dsr-mono text-[12px] font-semibold"
                    style={{ color: pctColor(pct) }}
                  >
                    {pct}%
                  </div>
                </div>
                <button
                  type="button"
                  className="dsr-visits-btn py-1 px-[11px] text-[12px] font-semibold whitespace-nowrap text-ds-primary bg-ds-primary-dim rounded-[20px] border border-solid border-[rgba(212,175,106,0.35)] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenVisits(c.name);
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
    injectFonts();
  }, []);
  const [activeTab, setActiveTab] = useState("records");
  const [cached] = useState(readDsrCache); // read once, before first paint
  const [records, setRecords] = useState(() =>
    Array.isArray(cached?.records) ? cached.records : [],
  );
  const [customers, setCustomers] = useState(() =>
    cached?.customers && typeof cached.customers === "object"
      ? cached.customers
      : {},
  );
  // only write to the cache once we hold real data (cached or freshly fetched)
  const recordsCacheOk = useRef(Array.isArray(cached?.records));
  const customersCacheOk = useRef(
    !!cached?.customers && typeof cached.customers === "object",
  );
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
  const [keyOnly, setKeyOnly] = useState(false);
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
  const [custView, setCustView] = useState("all"); // Customer Master view: "all" | "key"
  const [recordsLoaded, setRecordsLoaded] = useState(recordsCacheOk.current);
  const [customersLoaded, setCustomersLoaded] = useState(
    customersCacheOk.current,
  );
  // true from first paint until the first fetch finishes (no "No records" flash)
  const recordsPending = loading || !recordsLoaded;

  // ── Routing: popups ab pages hain ──────────────────────────────────────
  const navigate = useNavigate();
  const location = useLocation();
  const route = useMemo(
    () => parseRoute(location.pathname),
    [location.pathname],
  );
  // old /key-customers link → open the Key view inside the Customers tab
  useEffect(() => {
    if (!route.openKeyCustomers) return;
    setActiveTab("customers");
    setCustView("key");
    navigate(BASE, { replace: true });
  }, [route.openKeyCustomers, navigate]);
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
    const hadCache = recordsCacheOk.current;
    try {
      if (!hadCache) setLoading(true); // saved copy on screen → refresh silently
      const res = await apiFetch("/api/dsr/records");
      recordsCacheOk.current = true;
      setRecords(res.data || []);
    } catch (err) {
      showToast(
        hadCache
          ? "Couldn't refresh — showing your saved data"
          : err.message,
        "error",
      );
    } finally {
      setLoading(false);
      setRecordsLoaded(true);
    }
  }, [showToast]);
  const loadCustomers = useCallback(async () => {
    const hadCache = customersCacheOk.current;
    try {
      const res = await apiFetch("/api/dsr/customers");
      customersCacheOk.current = true;
      setCustomers(res.data || {});
    } catch (err) {
      if (!hadCache) showToast(err.message, "error");
    } finally {
      setCustomersLoaded(true);
    }
  }, [showToast]);
  // keep the browser copy in step with every refresh / add / edit / delete
  useEffect(() => {
    if (recordsCacheOk.current) writeDsrCache({ records });
  }, [records]);
  useEffect(() => {
    if (customersCacheOk.current) writeDsrCache({ customers });
  }, [customers]);
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
      keyOnly,
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
      if (keyOnly && !customers[r.customer]?.isKey) return false;
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
    keyOnly,
    customers,
    latestAll,
    sortBy,
  ]);

  const clearAllFilters = () => {
    setActiveFilter("all");
    setStageFilter("");
    setDistFilter("");
    setAreaFilter("");
    setFollowOnly(false);
    setKeyOnly(false);
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
            ...pickKeyFields(up),
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

  // Key customers: mark/unmark + visit frequency (see features/keyCustomers)
  const keyActions = useKeyCustomers({ customers, setCustomers, showToast });

  const handleImportDone = (imported) => {
    setCustomers((p) => {
      const n = { ...p };
      Object.keys(imported).forEach((k) => {
        n[k] = mergeKeyFields(imported[k], p[k]);
      });
      return n;
    });
    const c = Object.keys(imported).length;
    showToast(`${c} customer${c !== 1 ? "s" : ""} import ho gaye!`);
    setShowImporter(false);
  };
  const customerList = Object.keys(customers).sort();
  const keyCount = countKeyCustomers(customers);
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
        page = <PageLoading onBack={goBack} />;
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
        page = <PageLoading onBack={goBack} />;
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
        page = <PageLoading onBack={goBack} />;
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
        page = <PageLoading onBack={goBack} />;
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
        page = <PageLoading onBack={goBack} />;
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
        page = <PageLoading onBack={goBack} />;
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
      className="dsr-layout bg-ds-bg text-ds-text1"
      style={{ fontFamily:
          "'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" }}
    >
      <Toast msg={toast.msg} type={toast.type} />
      <Sidebar
        active={activeTab}
        onChange={setActiveTab}
        recordCount={records.length}
      />
      <div
        className="dsr-main max-w-[520px] w-full pt-4 pb-[80px] px-4 my-0 mx-auto"

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
              loading={recordsPending}
            />
            <RecordsToolbar
              loading={recordsPending}
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
              keyOnly={keyOnly}
              setKeyOnly={setKeyOnly}
              keyCount={keyCount}
              shown={filteredRecords.length}
              total={records.length}
              onClear={clearAllFilters}
              exportNode={
                <ExportDropdown records={filteredRecords} onExport={doExport} />
              }
            />
            {recordsPending ? (
              <RecordsLoading view={viewMode} />
            ) : filteredRecords.length === 0 ? (
              <div
                className="py-14 px-4 text-center text-ds-text2"
              >
                <div className="dsr-empty-icon">
                  <Icon
                    name="inbox"
                    size={26}
                    strokeWidth={1.6}
                    className="text-ds-primary"
                  />
                </div>
                <div
                  className="text-[14.5px] font-semibold tracking-[-0.01em] text-ds-text1"
                >
                  No records found
                </div>
                <div className="mt-1 text-[12px] text-ds-text2">
                  Try a different filter or search
                </div>
                {filteredRecords.length < records.length && (
                  <button
                    className="dsr-ghost-btn mt-3.5"

                    onClick={clearAllFilters}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="dsr-reveal">
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
              </div>
            )}
          </>
        )}

        {activeTab === "add" && (
          <>
            <CustomerLastRecord record={selectedCustomerLastRecord} />
            <SectionCard
              title={
                <span className="flex items-center gap-[5px]">
                  <Icon name="calendar" size={12} strokeWidth={2} /> Visit
                  details
                </span>
              }
            >
              <div
                className="dsr-grid2 grid gap-2.5 grid-cols-2"

              >
                <div className="mb-3">
                  <FieldLabel required>Date</FieldLabel>
                  <input
                    className={`dsr-input dsr-field ${!newRecord.date ? "border-ds-amber" : "border-ds-border"} ${!newRecord.date ? "bg-[rgba(245,158,11,0.06)]" : "[background:color-mix(in_srgb,_var(--wash)_4.0%,_transparent)]"}`}

                    type="date"
                    name="date"
                    value={newRecord.date}
                    onChange={handleRecordChange}
                  />
                  {!newRecord.date && (
                    <div
                      className="flex items-center gap-1 mt-[3px] text-[12px] text-ds-amber"
                    >
                      <Icon name="calendar" size={11} strokeWidth={2} />
                      <span>Select date manually</span>
                    </div>
                  )}
                </div>
                <div className="mb-3">
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
                className="dsr-grid2 grid gap-2.5 grid-cols-2"

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
              <div className="mb-3">
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
              <div className="mb-3">
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
                <span className="flex items-center gap-[5px]">
                  <Icon name="wallet" size={12} strokeWidth={2} /> Numbers (₹
                  Lakhs)
                </span>
              }
            >
              <div
                className="dsr-grid2 grid gap-2.5 grid-cols-2"

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
                <div className="mb-3">
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
                className="flex items-start gap-[7px] py-[9px] px-3 mt-1 text-[12px] leading-normal text-ds-info bg-ds-surface rounded-lg"
              >
                <Icon
                  name="lightbulb"
                  size={13}
                  strokeWidth={2}
                  className="mt-[1px] text-ds-info"
                />
                <span>
                  Select a saved customer and the fields will auto-fill.
                </span>
              </div>
            </SectionCard>
            <button
              className="dsr-btn-primary flex items-center justify-center gap-2 w-full h-[46px] mb-3 text-[14px] font-semibold text-inherit rounded-xl border-0 cursor-pointer"
              onClick={addRecord}
              disabled={loading}

            >
              {loading ? (
                <span
                  className="dsr-spinner w-[15px] h-[15px] m-0 border-t-2 border-solid border-t-[#0A0B10] border-r-2 border-r-[rgba(0,0,0,0.2)] border-b-2 border-b-[rgba(0,0,0,0.2)] border-l-2 border-l-[rgba(0,0,0,0.2)]"

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
              className="flex justify-between items-center gap-2 flex-wrap mb-3.5"
            >
              <div
                className="flex items-center gap-[7px] text-[14px] font-semibold text-ds-text1"
              >
                <Icon name="store" size={15} strokeWidth={2} /> Customer Master{" "}
                <span
                  className="ml-2 text-[12px] font-normal text-ds-text2"
                >
                  {customerList.length} total
                </span>
              </div>
              {custView === "all" && (
              <div className="flex gap-2 flex-wrap">
                <button
                  className="dsr-ghost-btn h-[34px] text-[12px]"
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

                >
                  <Icon name="download" size={13} strokeWidth={2.1} /> Download
                  {customerQuery.trim()
                    ? ` (${visibleCustomerList.length})`
                    : ""}
                </button>
                <button
                  className="ei-import-btn flex items-center gap-[5px] h-[34px] py-0 px-3.5 text-[12px] font-semibold bg-ds-surface text-ds-text1 rounded-lg border border-solid border-ds-border cursor-pointer"
                  onClick={() => setShowImporter(true)}

                >
                  <Icon name="upload" size={13} strokeWidth={2.1} /> Excel
                  Upload
                </button>
                <button
                  onClick={openAddCustomer}
                  className="flex items-center gap-1 h-[34px] py-0 px-3.5 text-[12px] font-semibold bg-[rgba(212,175,106,0.10)] text-ds-primary rounded-lg border border-solid border-[rgba(212,175,106,0.25)] cursor-pointer"
                >
                  <Icon name="addRecord" size={13} strokeWidth={2} /> Add
                </button>
              </div>
              )}
            </div>
            {customerList.length > 0 && (
              <div className="mb-3.5">
                <KeyViewSwitch
                  view={custView}
                  onChange={setCustView}
                  total={customerList.length}
                  keyCount={keyCount}
                />
              </div>
            )}
            {custView === "key" && customerList.length > 0 ? (
              <KeyCustomersPanel
                customers={customers}
                historyMap={customerHistoryMap}
                actions={keyActions}
                showToast={showToast}
                onOpenCustomer={(n) => navigate(ROUTES.history(n))}
                onAddVisit={startVisitFor}
                onNewCustomer={openAddCustomer}
              />
            ) : (
              <>
            {customerList.length > 0 && (
              <div className="relative mb-3">
                <Icon
                  name="search"
                  size={14}
                  className="absolute top-3 left-3 text-ds-text3"
                />
                <input
                  className="dsr-input dsr-field h-10 pl-8.5"

                  placeholder="Naam, area, contact person, mobile, GSTIN…"
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                />
              </div>
            )}
            {customerList.length > 0 && visibleCustomerList.length === 0 && (
              <div
                className="p-6 text-center text-[12.5px] text-ds-text2"
              >
                No customers match "{customerQuery}".
              </div>
            )}
            {customerList.length === 0 ? (
              <div
                className="py-10 px-4 text-center text-ds-text2"
              >
                <div className="dsr-empty-icon">
                  <Icon
                    name="store"
                    size={26}
                    strokeWidth={1.6}
                    className="text-ds-primary"
                  />
                </div>
                <div
                  className="text-[14.5px] font-semibold tracking-[-0.01em] text-ds-text1"
                >
                  No customers yet
                </div>
                <div className="mt-1 text-[12px] text-ds-text2">
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
                    className="dsr-customer-row flex items-center gap-2.5 py-2.5 px-2 rounded-lg border-b border-solid border-b-ds-border"
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

                  >
                    <div
                      className="flex items-center justify-center shrink-0 w-[38px] h-[38px] text-[12px] font-medium bg-ds-surface text-ds-text2 rounded-[50%] border border-solid border-ds-border"
                    >
                      {getInitials(name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className="flex items-center gap-1.5 min-w-0"
                      >
                        <span
                          className="text-[13px] font-semibold text-ellipsis whitespace-nowrap text-ds-text1 overflow-hidden"
                        >
                          {name}
                        </span>
                        <KeyStarButton
                          name={name}
                          isKey={!!c.isKey}
                          size="sm"
                          disabled={keyActions.saving}
                          onToggle={(next) => keyActions.setKey([name], next)}
                        />
                      </div>
                      <div
                        className="mt-[1px] text-[12px] text-ds-text2"
                      >
                        {c.area} · {c.distributor}
                        {(c.contactPerson || c.mobile) && (
                          <span className="ml-[5px] text-ds-text1">
                            · {c.contactPerson}
                            {c.contactPerson && c.mobile ? " · " : ""}
                            {c.mobile && (
                              <span className="dsr-mono">{c.mobile}</span>
                            )}
                          </span>
                        )}
                        {lastR && (
                          <span className="ml-[5px] text-ds-text3">
                            · {fmtDate(lastR.date)}
                          </span>
                        )}
                        <span className="ml-[5px] text-ds-primary">
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
                          className="flex items-center justify-center h-[30px] w-[30px] text-ds-success rounded-md border border-solid border-[rgba(34,197,94,0.30)]"
                        >
                          <Icon name="phone" size={13} strokeWidth={2} />
                        </a>
                      ) : (
                        <span
                          className="w-[30px] h-[30px]"
                          aria-hidden="true"
                        />
                      )}
                      <button
                        className="dsr-btn-edit flex items-center justify-center h-[30px] w-[30px] bg-transparent text-ds-info rounded-md border border-solid border-[rgba(59,130,246,0.25)] cursor-pointer"
                        onClick={() => openEditCustomer(name)}
                        aria-label={`Edit ${name}`}

                      >
                        <Icon name="edit" size={13} strokeWidth={2} />
                      </button>
                      <button
                        className="dsr-btn-danger flex items-center justify-center h-[30px] w-[30px] bg-transparent text-ds-danger rounded-md border border-solid border-[rgba(244,63,94,0.25)] cursor-pointer"
                        onClick={() => handleDeleteCustomer(name)}
                        aria-label={`Delete ${name}`}

                      >
                        <Icon name="trash" size={13} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
              </>
            )}
          </SectionCard>
        )}

        {activeTab === "analysis" && (
          <>
            <div
              className="flex justify-between items-center gap-2 flex-wrap mb-3.5"
            >
              <div
                className="flex items-center gap-[7px] text-[14px] font-semibold text-ds-text1"
              >
                <Icon name="trending" size={15} strokeWidth={2} /> Monthly Visit
                Analysis
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-ds-text2">
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
                className="py-14 px-4 text-center text-ds-text2"
              >
                <div className="dsr-empty-icon">
                  <Icon
                    name="trending"
                    size={26}
                    strokeWidth={1.6}
                    className="text-ds-primary"
                  />
                </div>
                <div
                  className="text-[14.5px] font-semibold tracking-[-0.01em] text-ds-text1"
                >
                  No data available
                </div>
                <div className="mt-1 text-[12px] text-ds-text2">
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
                className="dsr-card-list flex flex-col gap-2.5"

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
