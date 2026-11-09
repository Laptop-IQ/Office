import "./ecofast-entry.css";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  Check,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  FlaskConical,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

// Fonts are added as a <link> (the old CSS @import blocked rendering).
if (typeof document !== "undefined" && !document.getElementById("ecofast-fonts")) {
  const fl = document.createElement("link");
  fl.id = "ecofast-fonts";
  fl.rel = "stylesheet";
  fl.href =
    "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(fl);
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/+$/,
  "",
);

// Excel template ke formatted process rows. Default steps 18 hain, isliye 18.
// Agar template me sach me 17 rows hain to yahan 17 karein aur default steps me se 1 hatayein.
const MAX_STEP_ROWS = 18;

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

const emptyEntry = () => ({
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
      }),
      blankStep({ details: "CAUSTIC SODA", dosage: "1 gpl" }),
      blankStep({ details: "SODA ASH", dosage: "2 gpl" }),
      blankStep({ details: "SODIUM SULPHIDE", dosage: "3 gpl" }),
      blankStep({ no: "2", details: "DYE ADDITION" }),
      blankStep(),
      blankStep({ details: "SODIUM SULPHIDE" }),
      blankStep({ details: "SALT ADDITION ( COMMON SALT )", dosage: "20 gpl" }),
      blankStep({ details: "RUN", temp: "60 C", time: "45 min" }),
      blankStep({ no: "3", details: "DRAIN" }),
      blankStep({ no: "4", details: "COLD WASH TILL CLEAR LIQUID" }),
      blankStep({ no: "5", details: "OXIDATION" }),
      blankStep({ details: "ACETIC ACID", dosage: "2 gpl" }),
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

const reportFields = [
  ["customer", "Customer", "text", true],
  ["date", "Trial date", "date"],
  ["visitedBy", "Visited by", "text"],
  ["dmuMet", "DMU met", "text"],
  ["objective", "Objective of trial", "textarea"],
  ["reason", "Reason for trial", "text"],
  ["quality", "Quality", "text"],
  ["qualityType", "Quality type", "text"],
  ["trialDetails", "Trial details", "textarea"],
  ["machinery", "Machinery", "text"],
  ["mlr", "M:L:R", "text"],
  ["processFollowed", "Process followed", "text"],
  ["observations", "Other notes & observations", "textarea"],
  ["conclusion", "Conclusion", "text"],
  ["product", "Product / shade", "text"],
  ["action", "Action", "textarea"],
];
const WIDE_FIELDS = ["objective", "trialDetails", "observations", "action"];

// Sab uppercase me, kyunki compare uppercase string se hota hai
const titleOnlyProcessRows = new Set([
  "TRIAL DETAILS :",
  "DYE ADDITION",
  "DRAIN",
  "OXIDATION",
  "SOAPING",
  "DRAIN AND RINSING",
  "FINISH",
]);

const processFields = [
  ["quality", "Quality"],
  ["qualityType", "Quality type"],
  ["raw", "Raw / RFD"],
  ["quantity", "Quantity"],
  ["standardSolution", "Standard solution"],
  ["standardValue", "Standard value"],
  ["machine", "Machine"],
  ["liquorQuantity", "Liquor quantity"],
  ["sample", "Sample"],
  ["method", "Method"],
  ["speed", "Speed"],
];
const stepColumns = [
  ["no", "No."],
  ["details", "Process details / additions / remarks"],
  ["dosage", "Dosage"],
  ["totalQty", "Total qty"],
  ["ph", "pH"],
  ["temp", "Temp."],
  ["time", "Time"],
  ["costPerKg", "Cost/kg"],
  ["cost", "Cost"],
];

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
//  2nd row = SODIUM SULPHIDE : SULPHIDE_RATIO x BLUE B
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  wide = false,
}) {
  return (
    <label className={`field ${wide ? "wide" : ""}`}>
      <span>
        {label}
        {required && <b className="required"> *</b>}
      </span>
      {type === "textarea" ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows="2"
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        />
      )}
    </label>
  );
}

export default function App() {
  const [entry, setEntry] = useState(emptyEntry);
  const [saved, setSaved] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [tab, setTab] = useState("report");
  const [query, setQuery] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSheet, setPreviewSheet] = useState("report");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });

  async function loadEntries() {
    try {
      const res = await ecofastFetch("/api/ecofast/entries");
      if (!res.ok) throw new Error("Could not load saved entries.");
      const data = await readApiJson(res);
      if (!Array.isArray(data))
        throw new Error("The saved entries API did not return a list.");
      setSaved(data);
    } catch {
      setNotice({
        type: "error",
        text: "Cannot connect to the server. Please start the backend.",
      });
    }
  }
  useEffect(() => {
    loadEntries();
  }, []);

  const updateReport = (key, rawValue) =>
    setEntry((prev) => {
      const value = key === "product" ? rawValue.toUpperCase() : rawValue;
      const steps =
        key === "product"
          ? syncDyeRow(
              prev.process.steps,
              value,
              prev.process.standardSolution,
              prev.process.standardValue,
            )
          : prev.process.steps;
      return {
        ...prev,
        report: { ...prev.report, [key]: value },
        process: { ...prev.process, steps },
      };
    });

  const updateProcess = (key, value) =>
    setEntry((prev) => {
      const process = { ...prev.process, [key]: value };

      if (["standardSolution", "quantity", "liquorQuantity"].includes(key)) {
        process.standardValue = calculateStandardValue(
          process.standardSolution,
          process.quantity,
          process.liquorQuantity,
        );
        // FIX: pehle process.report?.product use ho raha tha (hamesha undefined)
        process.steps = syncDyeRow(
          process.steps,
          prev.report.product || "",
          process.standardSolution,
          process.standardValue,
        );
      }

      // Liquor badalne par baaki steps ka total qty bhi dobara nikalo
      if (key === "liquorQuantity") {
        process.steps = process.steps.map((s) => {
          const t = calculateTotalQty(s.dosage, value);
          return t ? { ...s, totalQty: t } : s;
        });
      }

      return { ...prev, process };
    });

  const updateStep = (index, key, value) =>
    setEntry((prev) => {
      const steps = [...prev.process.steps];
      const step = { ...steps[index], [key]: value };

      if (key === "dosage" || key === "details") {
        const total = calculateTotalQty(
          step.dosage,
          prev.process.liquorQuantity,
        );
        if (total) {
          step.totalQty = total;
        } else if (key === "dosage") {
          const d = String(step.dosage || "").trim();
          step.totalQty = /gm$/i.test(d) ? d : "";
        }
      }

      steps[index] = step;
      return { ...prev, process: { ...prev.process, steps } };
    });

  const filtered = useMemo(
    () =>
      saved.filter((x) =>
        `${x.report?.customer || ""} ${x.report?.product || ""} ${x.report?.visitedBy || ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [saved, query],
  );

  function newEntry() {
    setEntry(emptyEntry());
    setActiveId("");
    setTab("report");
    setNotice({ type: "", text: "" });
  }

  function editEntry(item) {
    const fresh = emptyEntry();
    const savedSteps = item.process?.steps || [];
    const length = Math.max(fresh.process.steps.length, savedSteps.length);
    setEntry({
      ...fresh,
      ...item,
      report: { ...fresh.report, ...item.report },
      process: {
        ...fresh.process,
        ...item.process,
        steps: Array.from({ length }, (_, i) => ({
          ...(fresh.process.steps[i] || blankStep()),
          ...(savedSteps[i] || {}),
        })),
      },
    });
    setActiveId(item.id);
    setTab("report");
    setNotice({ type: "", text: `Editing ${item.report?.customer || ""}` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Current form ko server par save karta hai aur id return karta hai
  async function persistEntry() {
    const res = await ecofastFetch("/api/ecofast/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entry, ...(activeId ? { id: activeId } : {}) }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.message || "Save failed.");
    setActiveId(data.id);
    return data.id;
  }

  async function saveEntry(event) {
    event.preventDefault();
    setBusy(true);
    setNotice({ type: "", text: "" });
    try {
      await persistEntry();
      setNotice({ type: "success", text: "Entry server par save ho gayi." });
      await loadEntries();
    } catch (e) {
      setNotice({ type: "error", text: e.message || "Save failed." });
    } finally {
      setBusy(false);
    }
  }

  async function exportEntry(idFromList) {
    setBusy(true);
    try {
      let id = idFromList;
      let customer;

      if (id) {
        // Saved list se download: us record ka naam use karo, form ka nahi
        customer = saved.find((x) => x.id === id)?.report?.customer;
      } else {
        // FIX: form se download karte waqt hamesha pehle latest changes save karo,
        // warna purana saved version export hota tha.
        if (!entry.report.customer.trim())
          throw new Error("Enter the customer name before downloading the Excel file.");
        id = await persistEntry();
        customer = entry.report.customer;
        await loadEntries();
      }

      const res = await ecofastFetch(`/api/ecofast/entries/${id}/export`);
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
      if (!blob.size)
        throw new Error(
          "The Excel file is empty. Restart the server and try again.",
        );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ecofast_${(customer || "Trial_Report").replace(/[^a-z0-9-_]+/gi, "_")}.xlsx`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setNotice({
        type: "success",
        text: "Excel download started. Please check your browser's Downloads folder.",
      });
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function deleteEntry(id) {
    if (!window.confirm("Permanently delete this saved entry?"))
      return;
    try {
      const res = await ecofastFetch(`/api/ecofast/entries/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed.");
      if (activeId === id) newEntry();
      await loadEntries();
      setNotice({ type: "success", text: "Entry delete ho gayi." });
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    }
  }

  const formatDate = (d) => {
    const date = new Date(d);
    return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
  };

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
                eco<span>fast</span>
              </strong>
              <small>TRIAL MANAGEMENT</small>
            </div>
          </div>
          <div className="nav-caption">WORKSPACE</div>
          <button className="nav-item active">
            <LayoutDashboard size={18} /> Trial entry
          </button>
          <button
            className="nav-item"
            onClick={() =>
              document
                .getElementById("saved-entries")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <ClipboardList size={18} /> Saved reports{" "}
            <span className="nav-count">{saved.length}</span>
          </button>
          <div className="sidebar-bottom">
            <div className="status-dot" /> Server storage <span>● Online*</span>
            <small>*Local server status</small>
          </div>
        </aside>
        <main className="main">
          <header className="topbar">
            <div>
              <div className="eyebrow">TRIAL REPORTS / DATA ENTRY</div>
              <h1>Trial report workspace</h1>
              <p>
                Enter trial details once. Save them on your server and export
                both Excel sheets.
              </p>
            </div>
            <button className="btn btn-outline" onClick={newEntry}>
              <Plus size={17} /> New report
            </button>
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
          <div className="stats">
            <div className="stat-card">
              <div className="stat-icon teal">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <span>Saved reports</span>
                <strong>{saved.length}</strong>
                <small>Stored on this server</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue">
                <Users size={20} />
              </div>
              <div>
                <span>Current customer</span>
                <strong className="stat-customer">
                  {entry.report.customer || "Not set"}
                </strong>
                <small>{activeId ? "Editing saved report" : "New draft"}</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber">
                <FileSpreadsheet size={20} />
              </div>
              <div>
                <span>Excel worksheets</span>
                <strong>02</strong>
                <small>Report + Process</small>
              </div>
            </div>
          </div>
          <form onSubmit={saveEntry}>
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <span className="step-badge">01</span>
                  <div>
                    <h2>Trial information</h2>
                    <p>Details mapped to the Report worksheet.</p>
                  </div>
                </div>
                <div className="sheet-chip">
                  <span /> Report sheet
                </div>
              </div>
              <div className="tabs">
                <button
                  type="button"
                  className={tab === "report" ? "tab active" : "tab"}
                  onClick={() => setTab("report")}
                >
                  Report details
                </button>
                <button
                  type="button"
                  className={tab === "process" ? "tab active" : "tab"}
                  onClick={() => setTab("process")}
                >
                  Process details
                </button>
              </div>
              {tab === "report" ? (
                <div className="form-grid">
                  {reportFields.map(([key, label, type = "text", required]) => (
                    <Field
                      key={key}
                      label={label}
                      type={type}
                      required={required}
                      wide={WIDE_FIELDS.includes(key)}
                      value={entry.report[key]}
                      onChange={(v) => updateReport(key, v)}
                    />
                  ))}
                </div>
              ) : (
                <div className="form-grid">
                  {processFields.map(([key, label]) => (
                    <Field
                      key={key}
                      label={label}
                      value={entry.process[key]}
                      onChange={(v) => updateProcess(key, v)}
                    />
                  ))}
                </div>
              )}
            </section>
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <span className="step-badge">02</span>
                  <div>
                    <h2>Process steps</h2>
                    <p>
                      These rows are written into the preformatted Process
                      worksheet.
                    </p>
                  </div>
                </div>
                <span className="count-chip">
                  {entry.process.steps.length} rows
                </span>
              </div>
              <div className="table-note">
                <Activity size={15} /> Existing Excel row layout is preserved.
                Edit the process details below.
              </div>
              <div className="process-table-wrap">
                <table className="process-table">
                  <thead>
                    <tr>
                      {stepColumns.map(([, label]) => (
                        <th key={label}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entry.process.steps.map((step, index) => {
                      const isTitleOnly = titleOnlyProcessRows.has(
                        String(step.details || "")
                          .trim()
                          .toUpperCase(),
                      );
                      return isTitleOnly ? (
                        <tr key={index} className="process-title-row">
                          <td colSpan={stepColumns.length}>
                            <span>{step.details}</span>
                          </td>
                        </tr>
                      ) : (
                        <tr key={index}>
                          {stepColumns.map(([key, label]) => (
                            <td key={key}>
                              <input
                                aria-label={`${label} row ${index + 1}`}
                                title={label}
                                value={step[key] ?? ""}
                                onChange={(e) =>
                                  updateStep(index, key, e.target.value)
                                }
                                className={
                                  key === "details" ? "detail-input" : ""
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="table-footer">
                <span>
                  Template has {MAX_STEP_ROWS} formatted process-step rows.
                </span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    updateProcess(
                      "steps",
                      [...entry.process.steps, blankStep()].slice(
                        0,
                        MAX_STEP_ROWS,
                      ),
                    )
                  }
                  disabled={entry.process.steps.length >= MAX_STEP_ROWS}
                >
                  <Plus size={15} /> Add blank row
                </button>
              </div>
            </section>
            <div className="action-bar">
              <div className="save-hint">
                <span className="live-dot" />
                <div>
                  <strong>Server persistence enabled</strong>
                  <small>
                    Download Excel automatically saves your latest changes
                    first.
                  </small>
                </div>
              </div>
              <div className="action-buttons">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setPreviewSheet("report");
                    setPreviewOpen(true);
                  }}
                >
                  <Eye size={16} /> Preview
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={newEntry}
                >
                  <RefreshCw size={16} /> Reset
                </button>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Save size={17} />
                  )}{" "}
                  {activeId ? "Update report" : "Save to server"}
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => exportEntry()}
                  disabled={busy}
                >
                  <ArrowDownToLine size={17} /> Download Excel
                </button>
              </div>
            </div>
          </form>

          <section className="panel saved-panel" id="saved-entries">
            <div className="panel-head">
              <div className="panel-title">
                <span className="step-badge">03</span>
                <div>
                  <h2>Saved reports</h2>
                  <p>
                    Open a saved report to edit it or download its Excel
                    workbook.
                  </p>
                </div>
              </div>
              <button
                className="icon-btn"
                onClick={loadEntries}
                title="Refresh list"
              >
                <RefreshCw size={17} />
              </button>
            </div>
            <div className="saved-toolbar">
              <div className="searchbox">
                <Search size={17} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search customer, product or visitor..."
                />
              </div>
              <span>{filtered.length} records</span>
            </div>
            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <ClipboardList size={24} />
                </div>
                <strong>No saved reports yet</strong>
                <span>Save a report above and it will appear here.</span>
              </div>
            ) : (
              <div className="saved-list">
                {filtered.map((item) => (
                  <div className="saved-row" key={item.id}>
                    <div className="saved-file">
                      <div className="file-icon">
                        <FileSpreadsheet size={19} />
                      </div>
                      <div>
                        <strong>
                          {item.report?.customer || "Untitled customer"}
                        </strong>
                        <span>
                          {item.report?.product || "No product specified"} ·{" "}
                          {item.report?.date || "No date"}
                        </span>
                      </div>
                    </div>
                    <div className="saved-meta">
                      <span>Updated {formatDate(item.updatedAt)}</span>
                      <span className="saved-status">
                        <span /> Saved
                      </span>
                    </div>
                    <div className="saved-actions">
                      <button
                        className="btn btn-small btn-outline"
                        onClick={() => editEntry(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="icon-btn download-icon"
                        title="Download Excel"
                        disabled={busy}
                        onClick={() => exportEntry(item.id)}
                      >
                        <ArrowDownToLine size={17} />
                      </button>
                      <button
                        className="icon-btn delete-icon"
                        title="Delete entry"
                        onClick={() => deleteEntry(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          {previewOpen && (
            <div
              className="modal-backdrop"
              role="presentation"
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setPreviewOpen(false);
              }}
            >
              <section
                className="preview-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Excel data preview"
              >
                <div className="preview-head">
                  <div>
                    <div className="eyebrow">WORKBOOK PREVIEW</div>
                    <h2>{entry.report.customer || "New trial report"}</h2>
                    <p>
                      Preview the data that will be exported to your two Excel
                      worksheets.
                    </p>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => setPreviewOpen(false)}
                    aria-label="Close preview"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="preview-tabs">
                  <button
                    className={
                      previewSheet === "report"
                        ? "preview-tab active"
                        : "preview-tab"
                    }
                    onClick={() => setPreviewSheet("report")}
                  >
                    Report sheet
                  </button>
                  <button
                    className={
                      previewSheet === "process"
                        ? "preview-tab active"
                        : "preview-tab"
                    }
                    onClick={() => setPreviewSheet("process")}
                  >
                    Process sheet
                  </button>
                </div>
                {previewSheet === "report" ? (
                  <div className="preview-content">
                    <div className="preview-grid">
                      {reportFields.map(([key, label]) => (
                        <div className="preview-field" key={key}>
                          <span>{label}</span>
                          <strong>{entry.report[key] || "—"}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="preview-content">
                    <div className="preview-grid">
                      {processFields.map(([key, label]) => (
                        <div className="preview-field" key={key}>
                          <span>{label}</span>
                          <strong>{entry.process[key] || "—"}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="preview-table-wrap">
                      <table className="preview-table">
                        <thead>
                          <tr>
                            {stepColumns.map(([, label]) => (
                              <th key={label}>{label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {entry.process.steps.map((step, i) => (
                            <tr key={i}>
                              {stepColumns.map(([key]) => (
                                <td key={key}>{step[key] || "—"}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                <div className="preview-footer">
                  <span>
                    <FileSpreadsheet size={15} /> Excel template · 2 worksheets
                  </span>
                  <div>
                    <button
                      className="btn btn-outline"
                      onClick={() => setPreviewOpen(false)}
                    >
                      Close preview
                    </button>
                    <button
                      className="btn btn-dark"
                      onClick={() => exportEntry()}
                      disabled={busy}
                    >
                      <ArrowDownToLine size={16} /> Download Excel
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
          <footer className="footer">
            <span>© {new Date().getFullYear()} Ecofast Trial Management</span>
            <span>
              <span className="live-dot" /> Workbook template: 2 worksheets
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
