import "./ecofast-entry.css";
import { useEffect, useRef, useState } from "react";
import { loadXLSX } from "@/lib/xlsx";
import {
  Activity,
  ArrowDownToLine,
  Check,
  ChevronDown,
  Copy,
  FileSpreadsheet,
  FlaskConical,
  LayoutList,
  PencilLine,
  Plus,
  Search,
  Send,
  Table2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

// Fonts are added as a <link> (the old CSS @import blocked rendering).
if (
  typeof document !== "undefined" &&
  !document.getElementById("ecofast-fonts")
) {
  const fl = document.createElement("link");
  fl.id = "ecofast-fonts";
  fl.rel = "stylesheet";
  fl.href =
    "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap";
  document.head.appendChild(fl);
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);

async function ecofastFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const targetUrl = url.startsWith("/api/") ? `${API_BASE_URL}${url}` : url;
  return fetch(targetUrl, { ...options, headers });
}

async function readApiJson(response) {
  const raw = await response.text();
  if (!raw.trim()) {
    throw new Error(
      `The server returned an empty response (HTTP ${response.status}). Please check the backend server and route.`,
    );
  }
  try {
    return JSON.parse(raw);
  } catch {
    const hint = raw.trim().startsWith("<")
      ? "Received an HTML page instead of the API response. Please check the frontend proxy / backend URL."
      : "The server response is not valid JSON. Please check the backend logs.";
    throw new Error(`${hint} (HTTP ${response.status})`);
  }
}

// ─── Report format: Ecofast (original template) or Ecosol (BLACK_Q2ELW template) ───
const BRANDS = {
  ecofast: { label: "Ecofast", suffix: "fast", sampleProduct: "BLUE BR" },
  ecosol: {
    label: "Ecosol",
    suffix: "sol",
    sampleProduct: "ECOSOL BLACK Q2ELW",
  },
};
const BRAND_KEY = "ecofast-brand";
const loadBrand = () => {
  try {
    return localStorage.getItem(BRAND_KEY) === "ecosol" ? "ecosol" : "ecofast";
  } catch {
    return "ecofast";
  }
};
// default / list can be a plain value, a function, or { ecofast: ..., ecosol: ... }
const byBrand = (v, brand) =>
  typeof v === "function"
    ? v()
    : v && typeof v === "object" && !Array.isArray(v)
      ? v[brand]
      : v;

function BrandSwitch({ brand, onChange }) {
  return (
    <div className="fmt-switch">
      <span>Format</span>
      <div className="ts-seg" role="group" aria-label="Report format">
        {Object.entries(BRANDS).map(([key, b]) => (
          <button
            key={key}
            type="button"
            className={brand === key ? "active" : ""}
            onClick={() => onChange(key)}
          >
            {b.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Recalculate standard value, dye rows and total qty after process fields are filled
const recomputeProcess = (process, product) => {
  const p = { ...process };
  p.standardValue = calculateStandardValue(
    p.standardSolution,
    p.quantity,
    p.liquorQuantity,
  );
  p.steps = syncDyeRow(p.steps, product, p.standardSolution, p.standardValue);
  p.steps = p.steps.map((st) => {
    const t = calculateTotalQty(st.dosage, p.liquorQuantity);
    return t ? { ...st, totalQty: t } : st;
  });
  return p;
};
const blankStep = (o = {}) => ({
  no: "",
  details: "",
  dosage: "",
  totalQty: "",
  ph: "",
  temp: "",
  time: "",
  costPerKg: "",
  cost: "",
  ...o,
});

const emptyEcofastEntry = () => ({
  report: {
    date: new Date().toISOString().slice(0, 10),
    customer: "",
    visitedBy: "SK",
    dmuMet: "",
    objective:
      "To Achieve the result with our Product and get the order from the Customer",
    reason: "Promotion",
    quality: "Jeans",
    qualityType: "Cotton",
    trialDetails: "",
    machinery: "Belly Washer",
    mlr: "1:12",
    processFollowed: "Process Followed as per annexure 1 to 2",
    observations: "",
    conclusion: "Trial Success",
    product: "",
    action: "",
  },
  process: {
    quality: "Garment",
    qualityType: "Cotton",
    raw: "RAW ( RFD)",
    quantity: "",
    standardSolution: "",
    standardValue: "",
    machine: "Belly Washer",
    liquorQuantity: "",
    sample: "",
    method: "Method: Exhaust Dyeing",
    speed: "16",
    steps: [
      blankStep({
        no: "1",
        details: "FBN",
        dosage: "1 gpl",
        ph: "12.5",
        temp: "60 C",
        time: "10 min",
      }),
      blankStep({ details: "CAUSTIC SODA", dosage: "1 gpl" }),
      blankStep({ details: "SODA ASH", dosage: "2 gpl" }),
      blankStep({ details: "SODIUM SULPHIDE", dosage: "3 gpl" }),
      blankStep({ no: "2", details: "DYE ADDITION", time: "10 min" }),
      blankStep(),
      blankStep({ details: "SODIUM SULPHIDE" }),
      blankStep({
        details: "SALT ADDITION ( COMMON SALT )",
        dosage: "20 gpl",
        time: "10 min",
      }),
      blankStep({ details: "RUN", temp: "60 C", time: "45 min" }),
      blankStep({ no: "3", details: "DRAIN" }),
      blankStep({ no: "4", details: "COLD WASH TILL CLEAR LIQUID" }),
      blankStep({ no: "5", details: "OXIDATION" }),
      blankStep({
        details: "ACETIC ACID",
        dosage: "2 gpl",
        ph: "4-5",
        temp: "50 C",
        time: "15 min",
      }),
      blankStep({ details: "HYDROGEN PROXIDE", dosage: "3 gpl" }),
      blankStep({ no: "6", details: "SOAPING" }),
      blankStep({
        details: "IAS",
        dosage: "1 gpl",
        temp: "60 C",
        time: "15 min",
      }),
      blankStep({ no: "7", details: "DRAIN AND RINSING" }),
      blankStep({ details: "FINISH" }),
    ],
  },
});

// Ecosol process steps = the rows of ecosol-template.xlsx (18 rows -> 17 after the dye row is merged)
const ECOSOL_STEPS = () => [
  blankStep({
    no: "1",
    details: "Squandet FBN",
    dosage: "1 gpl",
    ph: "12.5",
    temp: "55 C",
    time: "10 min",
  }),
  blankStep({ details: "Prep LF", dosage: "1 gpl" }),
  blankStep({ details: "CAUSTIC SODA", dosage: "1 gpl" }),
  blankStep({ details: "SODA ASH", dosage: "3 gpl" }),
  blankStep({ details: "Antioxydant IY", dosage: "8 gpl" }),
  blankStep({ no: "2", details: "DYE ADDITION", temp: "55 C", time: "10 min" }),
  blankStep(), // product row, filled by syncDyeRow
  blankStep({
    details: "SALT ADDITION ( COMMON SALT )",
    dosage: "25 gpl",
    temp: "55 C",
    time: "10 min",
  }),
  blankStep({ details: "RUN", temp: "60 C", time: "45 min" }),
  blankStep({ no: "3", details: "DRAIN" }),
  blankStep({ no: "4", details: "COLD WASH TILL CLEAR LIQUID" }),
  blankStep({ no: "5", details: "OXIDATION" }),
  blankStep({
    details: "ACETIC ACID",
    dosage: "2 gpl",
    ph: "4.5",
    temp: "50 C",
    time: "15 min",
  }),
  blankStep({ details: "Oxydant ION", dosage: "3 gpl" }),
  blankStep({ no: "6", details: "SOAPING" }),
  blankStep({
    details: "Executor IAS",
    dosage: "1 gpl",
    temp: "70 C",
    time: "10 min",
  }),
  blankStep({ no: "7", details: "DRAIN AND RINSING" }),
  blankStep({ details: "FINISH" }),
];
const emptyEntry = (brand = "ecofast") => {
  const e = emptyEcofastEntry();
  if (brand !== "ecosol") return e;
  e.report.qualityType = "PC";
  e.report.trialDetails = "RFD Garment";
  e.process.raw = "RFD Garment";
  e.process.steps = ECOSOL_STEPS();
  return e;
};

// ─── Bulk import: Excel sheet -> one report per row ─────────────────────────
// [section, key, column label, accepted header names (lowercase, letters/digits only)]
const BULK_FIELDS = [
  [
    "report",
    "customer",
    "Customer",
    ["customer", "customername", "party", "partyname", "firm", "firmname"],
  ],
  ["report", "date", "Date", ["date", "trialdate"]],
  ["report", "visitedBy", "Visited By", ["visitedby", "visitor"]],
  ["report", "dmuMet", "DMU Met", ["dmumet", "dmu"]],
  ["report", "objective", "Objective", ["objective", "objectiveoftrial"]],
  ["report", "reason", "Reason", ["reason", "reasonfortrial"]],
  ["report", "quality", "Quality", ["quality"]],
  ["report", "qualityType", "Quality Type", ["qualitytype"]],
  ["report", "machinery", "Machinery", ["machinery"]],
  ["report", "mlr", "MLR", ["mlr"]],
  ["report", "processFollowed", "Process Followed", ["processfollowed"]],
  [
    "report",
    "observations",
    "Observations",
    ["observations", "notes", "otherobservations", "othernotesobservations"],
  ],
  ["report", "conclusion", "Conclusion", ["conclusion"]],
  ["report", "product", "Product", ["product", "productshade", "shade"]],
  ["report", "action", "Action", ["action"]],
  ["process", "quantity", "Quantity", ["quantity", "qty"]],
  [
    "process",
    "standardSolution",
    "Standard Solution",
    ["standardsolution", "stdsolution"],
  ],
  [
    "process",
    "liquorQuantity",
    "Liquor Quantity",
    ["liquorquantity", "liquor", "liquorqty"],
  ],
  ["process", "sample", "Sample", ["sample"]],
  ["process", "machine", "Machine", ["machine", "mc"]],
  ["process", "method", "Method", ["method"]],
  ["process", "speed", "Speed", ["speed"]],
  ["process", "raw", "Raw", ["raw", "rawrfd"]],
  ["process", "quality", "Process Quality", ["processquality"]],
  ["process", "qualityType", "Process Quality Type", ["processqualitytype"]],
];
const normHeader = (h) =>
  String(h ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const pad2 = (n) => String(n).padStart(2, "0");
const isoDate = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
function normalizeDateValue(v) {
  // +12h keeps the calendar day correct whatever the time zone of the parsed Date
  if (v instanceof Date && !Number.isNaN(v.getTime()))
    return isoDate(new Date(v.getTime() + 12 * 3600 * 1000));
  const t = String(v ?? "").trim();
  if (!t) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`; // dd/mm/yyyy
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? t : isoDate(d);
}
// Same defaults + same calculations as the manual form (standard value, dye rows, total qty)
function rowToEntry(rawRow, fmtRow, headerMap, brand = "ecofast") {
  const e = emptyEntry(brand);
  BULK_FIELDS.forEach(([sec, key]) => {
    const h = headerMap[`${sec}.${key}`];
    if (!h) return;
    const v =
      sec === "report" && key === "date"
        ? normalizeDateValue(rawRow[h] instanceof Date ? rawRow[h] : fmtRow[h])
        : String(fmtRow[h] ?? "").trim();
    if (v !== "") e[sec][key] = v;
  });
  e.report.product = e.report.product.toUpperCase();
  // Ecosol: Report "Trial details" (F22) follows the Raw field
  if (brand === "ecosol") e.report.trialDetails = e.process.raw;
  e.process = recomputeProcess(e.process, e.report.product);
  return e;
}
function parseBulkWorkbook(XLSX, wb, brand = "ecofast") {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { defval: "", raw: true });
  // "formatted" copy keeps what Excel shows, e.g. 3% instead of 0.03
  const fmt = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
  if (!raw.length)
    return { error: "The sheet appears to be empty.", rows: [], ignored: [] };
  const headers = [...new Set(raw.flatMap((r) => Object.keys(r)))];
  const headerMap = {};
  const ignored = [];
  headers.forEach((h) => {
    const n = normHeader(h);
    const f = BULK_FIELDS.find(
      ([sec, key, , names]) => names.includes(n) && !headerMap[`${sec}.${key}`],
    );
    if (f) headerMap[`${f[0]}.${f[1]}`] = h;
    else ignored.push(h);
  });
  if (!headerMap["report.customer"])
    return {
      error:
        "Customer column not found. Add a column named Customer (see the sample sheet).",
      rows: [],
      ignored,
    };
  const rows = raw.map((r, i) => {
    const entry = rowToEntry(r, fmt[i] || {}, headerMap, brand);
    const ok = !!entry.report.customer.trim();
    return {
      id: i + 1,
      entry,
      src: { raw: r, fmt: fmt[i] || {} }, // lets us rebuild the row when the format is switched
      status: ok ? "ready" : "skipped",
      msg: ok ? "" : "Customer missing",
    };
  });
  return { error: "", rows, ignored, headerMap };
}
const safeFile = (v) =>
  String(v || "")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

// Sodium sulphide = BLUE B ka kitna guna. Sirf BLUE B jitna chahiye to 1 kar dein.
const SULPHIDE_RATIO = 1;

// "50 L", "6 kg", "50" -> 50, 6, 50
const parseNum = (v) => {
  const m = String(v ?? "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : NaN;
};

// "4 gpl", "3 %", "3 percent" -> { value, unit }
function parseStandardSolution(text) {
  const m = String(text || "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(gpl|%|percent)?$/i);
  if (!m) return null;
  const unit = (m[2] || "").toLowerCase();
  return { value: Number(m[1]), unit: unit === "percent" ? "%" : unit };
}

// gpl -> value x liquor (L) | % -> value x quantity (kg) x 10  (6 kg, 3% = 180 gm)
function calculateStandardValue(standardSolution, quantity, liquorQuantity) {
  const parsed = parseStandardSolution(standardSolution);
  if (!parsed) return "";
  let grams;
  if (parsed.unit === "gpl") {
    const liquor = parseNum(liquorQuantity);
    if (!Number.isFinite(liquor)) return "";
    grams = parsed.value * liquor;
  } else if (parsed.unit === "%") {
    const qty = parseNum(quantity);
    if (!Number.isFinite(qty)) return "";
    grams = parsed.value * qty * 10;
  } else {
    return "";
  }
  return `${Number(grams.toFixed(4))} gm`;
}

// "2 gpl" ya "2" -> dosage x liquor. "240 gm" / "3 %" ko multiply nahi karta.
function calculateTotalQty(dosage, liquorQuantity) {
  const m = String(dosage || "")
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s*(gpl)?$/i);
  const liquor = parseNum(liquorQuantity);
  if (!m || !Number.isFinite(liquor)) return "";
  return `${Number((Number(m[1]) * liquor).toFixed(4))} gm`;
}

// DYE ADDITION ke neeche:
//  1st row = product (BLUE B): dosage = standard solution, total qty = standard value
//  2nd row = SODIUM SULPHIDE : SULPHIDE_RATIO x BLUE B  (only if that row exists - Ecofast)
function syncDyeRow(steps, product, standardSolution, standardValue) {
  const next = [...steps];
  const dyeIndex = next.findIndex(
    (s) => s.details?.trim().toUpperCase() === "DYE ADDITION",
  );
  if (dyeIndex === -1) return next;

  const parsed = parseStandardSolution(standardSolution);
  const gm = parseNum(standardValue);
  const unitText = parsed?.unit ? ` ${parsed.unit}` : "";

  if (next[dyeIndex + 1]) {
    next[dyeIndex + 1] = {
      ...next[dyeIndex + 1],
      details: product,
      dosage: parsed ? `${parsed.value}${unitText}` : "",
      totalQty: standardValue || "",
    };
  }
  const sulphide = next[dyeIndex + 2];
  if (
    sulphide &&
    sulphide.details?.trim().toUpperCase() === "SODIUM SULPHIDE"
  ) {
    next[dyeIndex + 2] = {
      ...sulphide,
      dosage: parsed
        ? `${Number((parsed.value * SULPHIDE_RATIO).toFixed(4))}${unitText}`
        : "",
      totalQty: Number.isFinite(gm)
        ? `${Number((gm * SULPHIDE_RATIO).toFixed(4))} gm`
        : "",
    };
  }
  return next;
}

// ─── Fill & download: fill trials in a form / table -> Excel or Bulk import ───
// Order and labels are the same as BULK_FIELDS, so the downloaded file imports cleanly.
const todayStr = () => new Date().toISOString().slice(0, 10);
const MACHINES = ["Belly Washer", "Sample Machine", "Jigger"];
const SHEET_FIELDS = [
  {
    key: "customer",
    label: "Customer",
    req: true,
    ph: "e.g. Sai Nath Textiles",
    span: 2,
  },
  { key: "date", label: "Date", type: "date", def: todayStr },
  { key: "visitedBy", label: "Visited By", def: "SK", list: ["SK"] },
  { key: "dmuMet", label: "DMU Met", ph: "Person met" },
  {
    key: "objective",
    label: "Objective",
    def: "To Achieve the result with our Product and get the order from the Customer",
    area: true,
    span: 3,
  },
  {
    key: "reason",
    label: "Reason",
    def: "Promotion",
    list: ["Promotion", "Complaint", "New shade", "Cost saving"],
  },
  {
    key: "quality",
    label: "Quality",
    def: "Jeans",
    list: ["Jeans", "Shirting", "Knit"],
  },
  {
    key: "qualityType",
    label: "Quality Type",
    def: { ecofast: "Cotton", ecosol: "PC" },
    list: ["Cotton", "Polyester", "Blend", "PC"],
  },
  { key: "machinery", label: "Machinery", def: "Belly Washer", list: MACHINES },
  {
    key: "mlr",
    label: "MLR",
    def: "1:12",
    list: ["1:8", "1:10", "1:12", "1:15"],
  },
  {
    key: "processFollowed",
    label: "Process Followed",
    def: "Process Followed as per annexure 1 to 2",
    span: 2,
  },
  {
    key: "observations",
    label: "Observations",
    area: true,
    span: 3,
    ph: "Notes about the trial",
  },
  {
    key: "conclusion",
    label: "Conclusion",
    def: "Trial Success",
    list: ["Trial Success", "Trial Failed", "Pending"],
  },
  {
    key: "product",
    label: "Product",
    ph: "e.g. BLUE BR",
    list: {
      ecofast: ["BLUE BR", "BLUE B", "BLACK B"],
      ecosol: ["ECOSOL BLACK Q2ELW"],
    },
  },
  {
    key: "action",
    label: "Action",
    ph: "e.g. Send sample for approval",
    span: 3,
  },
  { key: "quantity", label: "Quantity", ph: "6 kg" },
  { key: "standardSolution", label: "Standard Solution", ph: "3% or 4 gpl" },
  { key: "liquorQuantity", label: "Liquor Quantity", ph: "50 L" },
  { key: "machine", label: "Machine", def: "Belly Washer", list: MACHINES },
  { key: "method", label: "Method", def: "Method: Exhaust Dyeing", span: 2 },
  { key: "speed", label: "Speed", def: "16" },
  {
    key: "raw",
    label: "Raw",
    def: { ecofast: "RAW ( RFD)", ecosol: "RFD Garment" },
  },
  { key: "processQuality", label: "Process Quality", def: "Garment" },
  { key: "processQualityType", label: "Process Quality Type", def: "Cotton" },
];
const FIELD = Object.fromEntries(SHEET_FIELDS.map((f) => [f.key, f]));
const SHEET_SECTIONS = [
  {
    title: "Trial details",
    desc: "Who, when and why.",
    keys: ["customer", "date", "visitedBy", "dmuMet", "objective", "reason"],
  },
  {
    title: "Dye recipe",
    desc: "The dye weight is calculated from these.",
    keys: ["product", "quantity", "standardSolution", "liquorQuantity"],
    calc: true,
  },
  {
    title: "Result",
    desc: "What happened and what comes next.",
    keys: ["conclusion", "action", "observations"],
  },
  {
    title: "Fabric & machine",
    desc: "Usually the same for every trial.",
    keys: ["quality", "qualityType", "machinery", "mlr", "processFollowed"],
    advanced: true,
  },
  {
    title: "Process setup",
    desc: "Fills the header of the Process sheet.",
    keys: [
      "machine",
      "method",
      "speed",
      "raw",
      "processQuality",
      "processQualityType",
    ],
    advanced: true,
  },
];
// Accepted header names per sheet field (the two "Process ..." columns reuse the BULK_FIELDS names)
const HEADER_NAMES = Object.fromEntries(
  BULK_FIELDS.map(([sec, key, , names]) => [
    sec === "process" && (key === "quality" || key === "qualityType")
      ? key === "quality"
        ? "processQuality"
        : "processQualityType"
      : key,
    names,
  ]),
);
const uid = () => Math.random().toString(36).slice(2, 9);
const newSheetRow = (brand = "ecofast") => ({
  id: uid(),
  ...Object.fromEntries(
    SHEET_FIELDS.map((f) => [f.key, byBrand(f.def, brand) ?? ""]),
  ),
});
const SHEET_DRAFT_KEY = "ecofast-sheet-draft-v2";
function loadSheetDraft(brand) {
  try {
    const rows = JSON.parse(localStorage.getItem(SHEET_DRAFT_KEY) || "null");
    if (Array.isArray(rows) && rows.length && rows.every((r) => r && r.id))
      return rows;
  } catch {
    /* ignore */
  }
  return [newSheetRow(brand)];
}

function SheetField({ f, row, onChange, bad }) {
  const id = `ts-${row.id}-${f.key}`;
  const common = {
    id,
    className: `ts-input${bad ? " bad" : ""}`,
    value: row[f.key] ?? "",
    placeholder: f.ph || "",
    onChange: (e) => onChange(f.key, e.target.value),
  };
  return (
    <div className={`ts-field${f.span ? ` span${f.span}` : ""}`}>
      <label htmlFor={id}>
        {f.label}
        {f.req && <span className="req"> *</span>}
      </label>
      {f.area ? (
        <textarea rows={2} {...common} />
      ) : (
        <input
          type={f.type || "text"}
          list={f.list ? `ts-dl-${f.key}` : undefined}
          {...common}
        />
      )}
      {bad && <span className="ts-err">Customer is required</span>}
    </div>
  );
}

// onSendToBulk(aoa) -> App turns the rows into bulk reports (no Excel file in between)
function TrialSheet({ brand, onBrandChange, onSendToBulk }) {
  const [rows, setRows] = useState(() => loadSheetDraft(brand));
  const [selId, setSelId] = useState(null);
  const [view, setView] = useState("form"); // "form" | "table"
  const [query, setQuery] = useState("");
  const [more, setMore] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [dup, setDup] = useState(null); // duplicate dialog: null or { srcId, product, quantity, ... }
  const [notice, setNotice] = useState({ type: "", text: "" });
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(SHEET_DRAFT_KEY, JSON.stringify(rows));
    } catch {
      /* ignore */
    }
  }, [rows]);

  // When the format is switched, fields still holding the old format's default get the new default
  const prevBrand = useRef(brand);
  useEffect(() => {
    const from = prevBrand.current;
    if (from === brand) return;
    prevBrand.current = brand;
    const swap = SHEET_FIELDS.filter((f) => f.def && typeof f.def === "object");
    setRows((rs) =>
      rs.map((r) => {
        const n = { ...r };
        swap.forEach((f) => {
          if (r[f.key] === f.def[from]) n[f.key] = f.def[brand];
        });
        return n;
      }),
    );
  }, [brand]);

  const sel = rows.find((r) => r.id === selId) || rows[0];
  const isReady = (r) => !!String(r.customer).trim();
  const readyCount = rows.filter(isReady).length;
  const q = query.trim().toLowerCase();
  const visible = rows
    .map((r, i) => ({ r, i }))
    .filter(
      ({ r }) =>
        !q ||
        `${r.customer} ${r.product} ${r.dmuMet}`.toLowerCase().includes(q),
    );

  function setField(id, key, value) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }
  function addRow() {
    const r = newSheetRow(brand);
    setRows((rs) => [...rs, r]);
    setSelId(r.id);
    setQuery("");
  }
  // Duplicate opens a dialog: the recipe fields must be checked, and the Product must change
  function duplicateRow(id) {
    const src = rows.find((r) => r.id === id);
    if (!src) return;
    setDup({
      srcId: id,
      product: src.product,
      quantity: src.quantity,
      standardSolution: src.standardSolution,
      liquorQuantity: src.liquorQuantity,
      error: "",
    });
  }
  function confirmDuplicate() {
    const d = dup;
    const src = rows.find((r) => r.id === d.srcId);
    if (!src) return setDup(null);
    const product = d.product.trim();
    if (!product) return setDup({ ...d, error: "Product is required." });
    if (product.toLowerCase() === String(src.product).trim().toLowerCase())
      return setDup({
        ...d,
        error:
          "Change the Product — it is the same as the trial you are copying.",
      });
    const copy = {
      ...src,
      id: uid(),
      product,
      quantity: d.quantity.trim(),
      standardSolution: d.standardSolution.trim(),
      liquorQuantity: d.liquorQuantity.trim(),
    };
    setRows((rs) => {
      const i = rs.findIndex((r) => r.id === d.srcId);
      return [...rs.slice(0, i + 1), copy, ...rs.slice(i + 1)];
    });
    setSelId(copy.id);
    setDup(null);
    setNotice({ type: "success", text: `Duplicated as ${product}.` });
  }
  function deleteRow(id) {
    const left = rows.filter((r) => r.id !== id);
    const next = left.length ? left : [newSheetRow(brand)];
    setRows(next);
    if (id === sel?.id) setSelId(next[0].id);
  }
  function clearAll() {
    const r = newSheetRow(brand);
    setRows([r]);
    setSelId(r.id);
    setSubmitted(false);
    setNotice({ type: "", text: "" });
  }
  function buildAoa() {
    const ready = rows.filter(isReady);
    if (!ready.length) {
      setSubmitted(true);
      setNotice({
        type: "error",
        text: "Enter a Customer in at least one trial.",
      });
      return null;
    }
    return [
      SHEET_FIELDS.map((f) => f.label),
      ...ready.map((r) =>
        SHEET_FIELDS.map((f) => String(r[f.key] ?? "").trim()),
      ),
    ];
  }
  async function downloadExcel() {
    const aoa = buildAoa();
    if (!aoa) return;
    try {
      const XLSX = await loadXLSX();
      const ws = XLSX.utils.aoa_to_sheet(aoa);
      ws["!cols"] = SHEET_FIELDS.map((f) => ({
        wch: Math.max(14, f.label.length + 2),
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Trials");
      XLSX.writeFile(wb, `${brand}-trials-${todayStr()}.xlsx`);
      const n = aoa.length - 1;
      const skipped = rows.length - n;
      setNotice({
        type: "success",
        text: `${n} trial${n === 1 ? "" : "s"} downloaded${skipped ? ` · ${skipped} without Customer skipped` : ""}.`,
      });
    } catch {
      setNotice({ type: "error", text: "Could not create the Excel file." });
    }
  }
  function sendToBulk() {
    const aoa = buildAoa();
    if (aoa) onSendToBulk(aoa);
  }
  // Load an existing sheet (for example the sample sheet or an earlier download) into the editor
  async function importFile(file) {
    if (!file) return;
    try {
      const XLSX = await loadXLSX();
      const wb = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "", raw: true });
      const fmt = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
      if (!raw.length) {
        setNotice({ type: "error", text: "The sheet appears to be empty." });
        return;
      }
      const headers = Object.keys(raw[0]);
      const col = {};
      SHEET_FIELDS.forEach((f) => {
        const names = HEADER_NAMES[f.key] || [];
        const h = headers.find(
          (x) =>
            names.includes(normHeader(x)) && !Object.values(col).includes(x),
        );
        if (h) col[f.key] = h;
      });
      if (!col.customer) {
        setNotice({
          type: "error",
          text: "Customer column not found in this file.",
        });
        return;
      }
      const loaded = raw.map((r, i) => {
        const row = newSheetRow(brand);
        Object.entries(col).forEach(([key, h]) => {
          const v =
            key === "date"
              ? normalizeDateValue(r[h] instanceof Date ? r[h] : fmt[i][h])
              : String(fmt[i][h] ?? "").trim();
          if (v !== "") row[key] = v;
        });
        return row;
      });
      setRows((rs) =>
        rs.every((r) => !isReady(r)) ? loaded : [...rs, ...loaded],
      );
      setSelId(loaded[0].id);
      setNotice({
        type: "success",
        text: `${loaded.length} trial${loaded.length === 1 ? "" : "s"} loaded from ${file.name}.`,
      });
    } catch {
      setNotice({
        type: "error",
        text: "Could not read the file. Please upload a valid Excel / CSV.",
      });
    }
  }

  const listFields = SHEET_FIELDS.filter((f) => f.list);
  const std = sel
    ? calculateStandardValue(
        sel.standardSolution,
        sel.quantity,
        sel.liquorQuantity,
      )
    : "";
  const parsedStd = sel ? parseStandardSolution(sel.standardSolution) : null;

  return (
    <>
      <header className="topbar">
        <div>
          <div className="eyebrow">TRIAL REPORTS / FILL &amp; DOWNLOAD</div>
          <h1>Fill &amp; download</h1>
          <p>
            Enter your trials, then download one Excel sheet or send them
            straight to Bulk import.
          </p>
        </div>
        <BrandSwitch brand={brand} onChange={onBrandChange} />
      </header>

      {notice.text && (
        <div className={`notice ${notice.type}`}>
          <span>
            {notice.type === "success" ? (
              <Check size={17} />
            ) : (
              <Activity size={17} />
            )}
          </span>
          {notice.text}
          <button onClick={() => setNotice({ type: "", text: "" })}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="ts-toolbar">
        <div className="ts-seg">
          <button
            type="button"
            className={view === "form" ? "active" : ""}
            onClick={() => setView("form")}
          >
            <LayoutList size={15} /> Form
          </button>
          <button
            type="button"
            className={view === "table" ? "active" : ""}
            onClick={() => setView("table")}
          >
            <Table2 size={15} /> Table
          </button>
        </div>
        <span className="ts-spacer" />
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          hidden
          onChange={(e) => {
            importFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => fileRef.current?.click()}
        >
          <Upload size={16} /> Load file
        </button>
        <button type="button" className="btn btn-outline" onClick={clearAll}>
          <Trash2 size={16} /> Clear all
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={downloadExcel}
        >
          <ArrowDownToLine size={16} /> Download Excel
        </button>
        <button type="button" className="btn btn-dark" onClick={sendToBulk}>
          <Send size={16} /> Send to Bulk import
        </button>
      </div>

      {listFields.map((f) => (
        <datalist key={f.key} id={`ts-dl-${f.key}`}>
          {byBrand(f.list, brand).map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      ))}

      {view === "table" ? (
        <>
          <div className="ts-table-wrap">
            <table className="ts-table">
              <thead>
                <tr>
                  <th>#</th>
                  {SHEET_FIELDS.map((f) => (
                    <th key={f.key}>
                      {f.label}
                      {f.req && (
                        <span style={{ color: "var(--ds-danger)" }}> *</span>
                      )}
                    </th>
                  ))}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="num">{i + 1}</td>
                    {SHEET_FIELDS.map((f) => (
                      <td
                        key={f.key}
                        className={f.area || f.span === 3 ? "wide" : ""}
                      >
                        <input
                          className={
                            f.key === "customer" && submitted && !isReady(r)
                              ? "bad"
                              : ""
                          }
                          value={r[f.key] ?? ""}
                          list={f.list ? `ts-dl-${f.key}` : undefined}
                          aria-label={`${f.label}, trial ${i + 1}`}
                          onChange={(e) =>
                            setField(r.id, f.key, e.target.value)
                          }
                        />
                      </td>
                    ))}
                    <td className="num">
                      <button
                        type="button"
                        className="icon-btn"
                        title="Delete trial"
                        onClick={() => deleteRow(r.id)}
                      >
                        <X size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ts-hint">
            <button type="button" className="btn btn-outline" onClick={addRow}>
              <Plus size={16} /> Add trial
            </button>{" "}
            &nbsp; Trials without a Customer are skipped.
          </p>
        </>
      ) : (
        <div className="ts-layout">
          <aside className="ts-list">
            <div className="ts-list-head">
              <label className="ts-search">
                <Search size={15} />
                <input
                  value={query}
                  placeholder="Search trials"
                  aria-label="Search trials"
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="btn btn-dark"
                onClick={addRow}
                title="Add trial"
              >
                <Plus size={16} /> New
              </button>
            </div>
            <div className="ts-items">
              {visible.map(({ r, i }) => (
                <button
                  type="button"
                  key={r.id}
                  className={`ts-item${r.id === sel?.id ? " active" : ""}`}
                  onClick={() => setSelId(r.id)}
                >
                  <span className="ts-num">{i + 1}</span>
                  <span>
                    <strong className={isReady(r) ? "" : "ts-empty-name"}>
                      {r.customer.trim() || "Untitled trial"}
                    </strong>
                    <small>
                      {[r.product, r.quantity].filter(Boolean).join(" · ") ||
                        r.date}
                    </small>
                  </span>
                  <span className={`ts-pill${isReady(r) ? " ok" : ""}`}>
                    {isReady(r) ? "Ready" : "Draft"}
                  </span>
                </button>
              ))}
              {!visible.length && (
                <p className="ts-hint" style={{ padding: 8 }}>
                  No trials match.
                </p>
              )}
            </div>
            <div className="ts-list-foot">
              {rows.length} trial{rows.length === 1 ? "" : "s"} · {readyCount}{" "}
              ready · saved on this device
            </div>
          </aside>

          {sel && (
            <div className="ts-editor">
              <div className="ts-editor-head">
                <div>
                  <h2>{sel.customer.trim() || "Untitled trial"}</h2>
                  <p>
                    Trial {rows.findIndex((r) => r.id === sel.id) + 1} of{" "}
                    {rows.length}
                  </p>
                </div>
                <div className="action-buttons">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => duplicateRow(sel.id)}
                  >
                    <Copy size={16} /> Duplicate
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => deleteRow(sel.id)}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              </div>

              {SHEET_SECTIONS.filter((s) => !s.advanced).map((s) => (
                <section className="ts-section" key={s.title}>
                  <div className="ts-section-head">
                    <h3>{s.title}</h3>
                    <p>{s.desc}</p>
                  </div>
                  <div className="ts-grid">
                    {s.keys.map((k) => (
                      <SheetField
                        key={k}
                        f={FIELD[k]}
                        row={sel}
                        onChange={(key, v) => setField(sel.id, key, v)}
                        bad={k === "customer" && submitted && !isReady(sel)}
                      />
                    ))}
                  </div>
                  {s.calc && (
                    <div className={`ts-calc${std ? "" : " warn"}`}>
                      {std ? (
                        <span>
                          <strong>{sel.product || "Dye"}</strong>:{" "}
                          {parsedStd.value}
                          {parsedStd.unit ? ` ${parsedStd.unit}` : ""} →{" "}
                          <strong>{std}</strong>
                          {brand === "ecofast" &&
                            " (sodium sulphide is added automatically)"}
                        </span>
                      ) : (
                        <span>
                          Enter Quantity, Liquor Quantity and a Standard
                          Solution like “3%” or “4 gpl” to see the dye weight.
                        </span>
                      )}
                    </div>
                  )}
                </section>
              ))}

              <button
                type="button"
                className={`ts-more${more ? " open" : ""}`}
                onClick={() => setMore((m) => !m)}
                aria-expanded={more}
              >
                <ChevronDown size={16} /> {more ? "Hide" : "Show"} fabric,
                machine &amp; process fields
              </button>

              {more &&
                SHEET_SECTIONS.filter((s) => s.advanced).map((s) => (
                  <section className="ts-section" key={s.title}>
                    <div className="ts-section-head">
                      <h3>{s.title}</h3>
                      <p>{s.desc}</p>
                    </div>
                    <div className="ts-grid">
                      {s.keys.map((k) => (
                        <SheetField
                          key={k}
                          f={FIELD[k]}
                          row={sel}
                          onChange={(key, v) => setField(sel.id, key, v)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
            </div>
          )}
        </div>
      )}

      {dup && (
        <div
          className="ts-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDup(null);
          }}
        >
          <div
            className="ts-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ts-dup-title"
            onKeyDown={(e) => {
              if (e.key === "Escape") setDup(null);
              if (e.key === "Enter" && e.target.tagName === "INPUT") {
                e.preventDefault();
                confirmDuplicate();
              }
            }}
          >
            <div className="ts-modal-head">
              <div>
                <h3 id="ts-dup-title">Duplicate trial</h3>
                <p>
                  Copying{" "}
                  <b>
                    {rows.find((r) => r.id === dup.srcId)?.customer ||
                      "this trial"}
                  </b>
                  . Check the recipe — the Product must be different.
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Close"
                onClick={() => setDup(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ts-modal-body">
              {[
                ["product", "Product", "e.g. BLUE BR", true],
                ["quantity", "Quantity", "6 kg"],
                ["standardSolution", "Standard Solution", "3% or 4 gpl"],
                ["liquorQuantity", "Liquor Quantity", "50 L"],
              ].map(([key, label, ph, first]) => (
                <div className="ts-field" key={key}>
                  <label htmlFor={`ts-dup-${key}`}>
                    {label}
                    {first && <span className="req"> *</span>}
                  </label>
                  <input
                    id={`ts-dup-${key}`}
                    className={`ts-input${first && dup.error ? " bad" : ""}`}
                    value={dup[key]}
                    placeholder={ph}
                    list={first ? "ts-dl-product" : undefined}
                    autoFocus={first}
                    onFocus={(e) => first && e.target.select()}
                    onChange={(e) =>
                      setDup({ ...dup, [key]: e.target.value, error: "" })
                    }
                  />
                </div>
              ))}
              {dup.error && <p className="ts-err ts-modal-err">{dup.error}</p>}
            </div>
            <div className="ts-modal-foot">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDup(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-dark"
                onClick={confirmDuplicate}
              >
                <Copy size={16} /> Create copy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [tab, setTab] = useState("bulk"); // "bulk" | "sheet"
  const [brand, setBrand] = useState(loadBrand); // "ecofast" | "ecosol"
  const [bulk, setBulk] = useState({
    file: "",
    rows: [],
    ignored: [],
    headerMap: {},
  });
  const [bulkRun, setBulkRun] = useState({ running: false, done: 0, total: 0 });
  const [bulkDrag, setBulkDrag] = useState(false);
  const bulkCancel = useRef(false);
  const bulkInput = useRef(null);
  const [notice, setNotice] = useState({ type: "", text: "" });

  useEffect(() => {
    try {
      localStorage.setItem(BRAND_KEY, brand);
    } catch {
      /* ignore */
    }
  }, [brand]);

  // Switching the format re-builds already loaded rows with that format's defaults
  useEffect(() => {
    setBulk((b) =>
      b.rows.length
        ? {
            ...b,
            rows: b.rows.map((r) => ({
              ...r,
              entry: rowToEntry(r.src.raw, r.src.fmt, b.headerMap, brand),
              ...(r.status === "skipped" ? {} : { status: "ready", msg: "" }),
            })),
          }
        : b,
    );
  }, [brand]);

  // ── Fill & download -> Bulk import (no Excel file in between) ──────────────
  async function importFromSheet(aoa) {
    try {
      const XLSX = await loadXLSX();
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Trials");
      const out = parseBulkWorkbook(XLSX, wb, brand);
      if (out.error) {
        setNotice({ type: "error", text: out.error });
      } else {
        setBulk({
          file: "Fill & download",
          rows: out.rows,
          ignored: out.ignored,
          headerMap: out.headerMap,
        });
        const ready = out.rows.filter((r) => r.status === "ready").length;
        setNotice({
          type: "success",
          text: `${ready} report${ready === 1 ? "" : "s"} ready from Fill & download.`,
        });
      }
    } catch {
      setNotice({ type: "error", text: "Could not prepare the reports." });
    }
    setTab("bulk");
  }

  // ── Bulk import ────────────────────────────────────────────────────────────
  async function parseBulkFile(file) {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setNotice({
        type: "error",
        text: "Please upload an .xlsx, .xls or .csv file.",
      });
      return;
    }
    try {
      const XLSX = await loadXLSX();
      const wb = XLSX.read(await file.arrayBuffer(), {
        type: "array",
        cellDates: true,
      });
      const out = parseBulkWorkbook(XLSX, wb, brand);
      if (out.error) {
        setNotice({ type: "error", text: out.error });
        return;
      }
      setBulk({
        file: file.name,
        rows: out.rows,
        ignored: out.ignored,
        headerMap: out.headerMap,
      });
      const ready = out.rows.filter((r) => r.status === "ready").length;
      setNotice({
        type: "success",
        text: `${ready} report${ready === 1 ? "" : "s"} ready from ${file.name}.`,
      });
    } catch {
      setNotice({
        type: "error",
        text: "Could not read the file. Please upload a valid Excel / CSV.",
      });
    }
  }
  function setBulkRow(id, patch) {
    setBulk((b) => ({
      ...b,
      rows: b.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }
  // Builds the Excel on the server (template of the chosen format) WITHOUT saving it
  async function downloadBulkRow(row) {
    const res = await ecofastFetch("/api/ecofast/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row.entry, brand }),
    });
    if (!res.ok) {
      let body = {};
      try {
        body = await readApiJson(res);
      } catch (error) {
        body = { message: error.message };
      }
      throw new Error(body.message || "Excel export failed.");
    }
    const blob = await res.blob();
    if (!blob.size) throw new Error("The Excel file is empty.");
    const cust = safeFile(row.entry.report.customer) || "Trial_Report";
    const prod = safeFile(row.entry.report.product);
    triggerDownload(
      blob,
      `${BRANDS[brand].label}_${cust}${prod ? `_${prod}` : ""}.xlsx`,
    );
  }
  async function downloadOneBulk(row) {
    setBulkRow(row.id, { status: "working", msg: "" });
    try {
      await downloadBulkRow(row);
      setBulkRow(row.id, { status: "done" });
    } catch (e) {
      setBulkRow(row.id, { status: "error", msg: e.message });
    }
  }
  // One by one, with a short pause so the browser accepts every file
  async function downloadAllBulk() {
    const todo = bulk.rows.filter((r) => r.status !== "skipped");
    if (!todo.length) return;
    bulkCancel.current = false;
    setBulkRun({ running: true, done: 0, total: todo.length });
    let ok = 0;
    for (let i = 0; i < todo.length; i++) {
      if (bulkCancel.current) break;
      const row = todo[i];
      setBulkRow(row.id, { status: "working", msg: "" });
      try {
        await downloadBulkRow(row);
        setBulkRow(row.id, { status: "done" });
        ok++;
      } catch (e) {
        setBulkRow(row.id, { status: "error", msg: e.message });
      }
      setBulkRun((r) => ({ ...r, done: i + 1 }));
      await sleep(700);
    }
    setBulkRun((r) => ({ ...r, running: false }));
    setNotice({
      type: ok === todo.length ? "success" : "error",
      text: bulkCancel.current
        ? `Stopped. ${ok} of ${todo.length} reports downloaded.`
        : `${ok} of ${todo.length} reports downloaded. Check your browser's Downloads folder.`,
    });
  }
  async function downloadBulkTemplate() {
    try {
      const XLSX = await loadXLSX();
      const headers = BULK_FIELDS.map(([, , label]) => label);
      const sample = (cust, prod, qty, std) =>
        headers.map(
          (h) =>
            ({
              Customer: cust,
              Date: new Date().toISOString().slice(0, 10),
              "Visited By": "SK",
              "DMU Met": "Ramesh",
              Product: prod,
              Action: "Send sample for approval",
              Quantity: qty,
              "Standard Solution": std,
              "Liquor Quantity": "50 L",
              Speed: 16,
            })[h] ?? "",
        );
      const product = BRANDS[brand].sampleProduct;
      const ws = XLSX.utils.aoa_to_sheet([
        headers,
        sample("Sai Nath Textiles", product, "6 kg", "3%"),
        sample("Om Denim", product, "8 kg", "4 gpl"),
      ]);
      ws["!cols"] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Trials");
      XLSX.writeFile(wb, `${brand}-bulk-template.xlsx`);
    } catch {
      setNotice({ type: "error", text: "Could not create the sample sheet." });
    }
  }

  return (
    <div className="ecofast-app">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">
              <FlaskConical size={23} />
            </div>
            <div>
              <strong>
                Eco<span>{BRANDS[brand].suffix}</span>
              </strong>
              <small>TRIAL MANAGEMENT</small>
            </div>
          </div>
          <div className="nav-caption">WORKSPACE</div>
          <button
            className={`nav-item${tab === "bulk" ? " active" : ""}`}
            onClick={() => setTab("bulk")}
          >
            <Upload size={18} /> Bulk import
            {bulk.rows.length > 0 && (
              <span className="nav-count">{bulk.rows.length}</span>
            )}
          </button>
          <button
            className={`nav-item${tab === "sheet" ? " active" : ""}`}
            onClick={() => setTab("sheet")}
          >
            <PencilLine size={18} /> Fill &amp; download
          </button>
          <div className="sidebar-bottom">
            <div className="status-dot" /> Server storage <span>● Online*</span>
            <small>*Local server status</small>
          </div>
        </aside>
        <main className="main">
          {tab === "sheet" ? (
            <TrialSheet
              brand={brand}
              onBrandChange={setBrand}
              onSendToBulk={importFromSheet}
            />
          ) : (
            <>
              <header className="topbar">
                <div>
                  <div className="eyebrow">TRIAL REPORTS / BULK IMPORT</div>
                  <h1>Bulk import</h1>
                  <p>
                    Upload an Excel sheet and download every trial report in the
                    same format.
                  </p>
                </div>
                <BrandSwitch brand={brand} onChange={setBrand} />
              </header>
              {notice.text && (
                <div className={`notice ${notice.type}`}>
                  <span>
                    {notice.type === "success" ? (
                      <Check size={17} />
                    ) : (
                      <Activity size={17} />
                    )}
                  </span>
                  {notice.text}
                  <button onClick={() => setNotice({ type: "", text: "" })}>
                    <X size={16} />
                  </button>
                </div>
              )}
              <section className="panel">
                <div className="panel-head">
                  <div className="panel-title">
                    <span className="step-badge">
                      <Upload size={16} />
                    </span>
                    <div>
                      <h2>Upload trial sheet</h2>
                      <p>
                        One trial per row. Each row becomes a report in the{" "}
                        {BRANDS[brand].label} Excel format.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={downloadBulkTemplate}
                  >
                    <FileSpreadsheet size={16} /> Sample sheet
                  </button>
                </div>
                <div className="bulk-body">
                  <div
                    className={`bulk-drop${bulkDrag ? " drag" : ""}`}
                    role="button"
                    tabIndex={0}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setBulkDrag(true);
                    }}
                    onDragLeave={() => setBulkDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setBulkDrag(false);
                      parseBulkFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() => bulkInput.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        bulkInput.current?.click();
                      }
                    }}
                  >
                    <input
                      ref={bulkInput}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      hidden
                      onChange={(e) => {
                        parseBulkFile(e.target.files[0]);
                        e.target.value = "";
                      }}
                    />
                    <Upload size={22} />
                    <strong>
                      {bulkDrag ? "Drop file here" : "Drag & drop Excel file"}
                    </strong>
                    <span>or click to browse · .xlsx .xls .csv</span>
                  </div>
                </div>

                {bulk.rows.length > 0 && (
                  <>
                    <div className="saved-toolbar">
                      <span>
                        <b>{bulk.file}</b> ·{" "}
                        {bulk.rows.filter((r) => r.status !== "skipped").length}{" "}
                        reports
                        {bulk.rows.some((r) => r.status === "skipped") &&
                          ` · ${bulk.rows.filter((r) => r.status === "skipped").length} skipped`}
                        {bulkRun.running &&
                          ` · downloading ${bulkRun.done} / ${bulkRun.total}`}
                      </span>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={bulkRun.running}
                          onClick={() =>
                            setBulk({
                              file: "",
                              rows: [],
                              ignored: [],
                              headerMap: {},
                            })
                          }
                        >
                          <X size={16} /> Clear
                        </button>
                        {bulkRun.running ? (
                          <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                              bulkCancel.current = true;
                            }}
                          >
                            Stop
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-dark"
                            onClick={downloadAllBulk}
                          >
                            <ArrowDownToLine size={16} /> Download all one by
                            one
                          </button>
                        )}
                      </div>
                    </div>
                    {bulk.ignored.length > 0 && (
                      <p className="bulk-caption" style={{ padding: "0 22px" }}>
                        Ignored columns: {bulk.ignored.join(", ")}
                      </p>
                    )}
                    <div className="bulk-table-wrap">
                      <table className="bulk-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Customer</th>
                            <th>Product / shade</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {bulk.rows.map((row) => (
                            <tr key={row.id}>
                              <td>{row.id}</td>
                              <td className="strong">
                                {row.entry.report.customer || "—"}
                              </td>
                              <td>{row.entry.report.product || "—"}</td>
                              <td>{row.entry.report.date || "—"}</td>
                              <td>
                                <span className={`bulk-status ${row.status}`}>
                                  {
                                    {
                                      ready: "Ready",
                                      working: "Downloading…",
                                      done: "Downloaded",
                                      error: "Failed",
                                      skipped: "Skipped",
                                    }[row.status]
                                  }
                                </span>
                                {row.msg && (
                                  <small className="bulk-msg">{row.msg}</small>
                                )}
                              </td>
                              <td className="bulk-act">
                                <button
                                  type="button"
                                  className="icon-btn download-icon"
                                  title="Download this report"
                                  disabled={
                                    row.status === "skipped" ||
                                    row.status === "working" ||
                                    bulkRun.running
                                  }
                                  onClick={() => downloadOneBulk(row)}
                                >
                                  <ArrowDownToLine size={17} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>
            </>
          )}
          <footer className="footer">
            <span>© {new Date().getFullYear()} Ecofast Trial Management</span>
            <span>
              <span className="live-dot" /> Workbook template: 2 worksheets ·{" "}
              {BRANDS[brand].label} format
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
