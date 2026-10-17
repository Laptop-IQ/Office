import "./ecofast-entry.css";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownToLine, Check, ClipboardList, Eye, FileSpreadsheet,
  FlaskConical, LayoutDashboard, LoaderCircle, Plus, RefreshCw, Save, Search,
  Trash2, Users, X
} from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

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
    throw new Error(`Server ne empty response bheja (HTTP ${response.status}). Backend server aur route check karein.`);
  }
  try {
    return JSON.parse(raw);
  } catch {
    const hint = raw.trim().startsWith("<")
      ? "API ke badle HTML page mila. Frontend proxy/backend URL check karein."
      : "Server ka response valid JSON nahi hai. Backend logs check karein.";
    throw new Error(`${hint} (HTTP ${response.status})`);
  }
}

const emptyEntry = () => ({
  report: {
    date: new Date().toISOString().slice(0, 10), customer: "", visitedBy: "", dmuMet: "",
    objective: "", reason: "", quality: "", qualityType: "", trialDetails: "",
    machinery: "", mlr: "", processFollowed: "Process Followed as per annexure 1 to 2",
    observations: "", conclusion: "", product: "", action: ""
  },
  process: {
    quality: "Garment", qualityType: "P/C", raw: "RAW ( RFD)", quantity: "",
    standardSolution: "", standardValue: "", machine: "", liquorQuantity: "",
    sample: "", method: "Method: Exhaust Dyeing", speed: "",
    steps: [
      { no: "1", details: "Water Softner", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "CAUSTIC SODA", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "SODA ASH", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "SODIUM SULPHIDE", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "2", details: "DYE ADDITION Ecofast Coffee Brown 35", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "SODIUM SULPHIDE", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "SALT ADDITION ( COMMON SALT )", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "RUN", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "3", details: "DRAIN", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "4", details: "COLD WASH TILL CLEAR LIQUID", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "5", details: "OXIDATION", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "ACETIC ACID", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "HYDROGEN PROXIDE", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "6", details: "SOAPING", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "SOAPING AGENT", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "7", details: "DRAIN AND RINSING", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" },
      { no: "", details: "FINISH", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" }
    ]
  }
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
  ["trialDetails", "Trial details", "text"],
  ["machinery", "Machinery", "text"],
  ["mlr", "M:L:R", "text"],
  ["processFollowed", "Process followed", "text"],
  ["observations", "Other notes & observations", "textarea"],
  ["conclusion", "Conclusion", "text"],
  ["product", "Product / shade", "text"],
  ["action", "Action", "textarea"]
];
const processFields = [
  ["quality", "Quality"], ["qualityType", "Quality type"], ["raw", "Raw / RFD"],
  ["quantity", "Quantity"], ["standardSolution", "Standard solution"], ["standardValue", "Standard value"],
  ["machine", "Machine"], ["liquorQuantity", "Liquor quantity"], ["sample", "Sample"], ["method", "Method"], ["speed", "Speed"]
];
const stepColumns = [
  ["no", "No."], ["details", "Process details / additions / remarks"], ["dosage", "Dosage"],
  ["totalQty", "Total qty"], ["ph", "pH"], ["temp", "Temp."], ["time", "Time"],
  ["costPerKg", "Cost/kg"], ["cost", "Cost"]
];

function Field({ label, value, onChange, type = "text", required = false, wide = false }) {
  return <label className={`field ${wide ? "wide" : ""}`}>
    <span>{label}{required && <b className="required"> *</b>}</span>
    {type === "textarea"
      ? <textarea value={value ?? ""} onChange={e => onChange(e.target.value)} rows="2" />
      : <input type={type} value={value ?? ""} onChange={e => onChange(e.target.value)} required={required} />}
  </label>;
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
      if (!Array.isArray(data)) throw new Error("Saved entries API ne list return nahi ki.");
      setSaved(data);
    } catch {
      setNotice({ type: "error", text: "Server se connect nahi ho raha. Backend start karein." });
    }
  }
  useEffect(() => { loadEntries(); }, []);

  const updateReport = (key, value) => setEntry(prev => ({ ...prev, report: { ...prev.report, [key]: value } }));
  const updateProcess = (key, value) => setEntry(prev => ({ ...prev, process: { ...prev.process, [key]: value } }));
  const updateStep = (index, key, value) => setEntry(prev => {
    const steps = [...prev.process.steps];
    steps[index] = { ...steps[index], [key]: value };
    return { ...prev, process: { ...prev.process, steps } };
  });
  const filtered = useMemo(() => saved.filter(x =>
    `${x.report.customer} ${x.report.product} ${x.report.visitedBy}`.toLowerCase().includes(query.toLowerCase())
  ), [saved, query]);

  function newEntry() {
    setEntry(emptyEntry());
    setActiveId("");
    setTab("report");
    setNotice({ type: "", text: "" });
  }
  function editEntry(item) {
    const fresh = emptyEntry();
    setEntry({
      ...fresh, ...item,
      report: { ...fresh.report, ...item.report },
      process: { ...fresh.process, ...item.process,
        steps: fresh.process.steps.map((s, i) => ({ ...s, ...(item.process?.steps?.[i] || {}) }))
      }
    });
    setActiveId(item.id);
    setTab("report");
    setNotice({ type: "", text: `Editing ${item.report.customer}` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function saveEntry(event) {
    event.preventDefault();
    setBusy(true);
    setNotice({ type: "", text: "" });
    try {
      const res = await ecofastFetch("/api/ecofast/entries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...entry, ...(activeId ? { id: activeId } : {}) })
      });
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.message || "Save failed.");
      setActiveId(data.id);
      setNotice({ type: "success", text: "Entry server par save ho gayi." });
      await loadEntries();
    } catch (e) {
      setNotice({ type: "error", text: e.message || "Save failed." });
    } finally { setBusy(false); }
  }
  async function exportEntry(id = activeId) {
    setBusy(true);
    try {
      // If this is a new, unsaved draft, save it first so local downloads work immediately.
      if (!id) {
        if (!entry.report.customer.trim()) throw new Error("Excel download se pehle Customer name bharein.");
        const saveRes = await ecofastFetch("/api/ecofast/entries", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(entry)
        });
        const savedEntry = await readApiJson(saveRes);
        if (!saveRes.ok) throw new Error(savedEntry.message || "Entry save nahi ho saki.");
        id = savedEntry.id;
        setActiveId(id);
        await loadEntries();
      }
      const res = await ecofastFetch(`/api/ecofast/entries/${id}/export`);
      if (!res.ok) {
        let body = {};
        try { body = await readApiJson(res); } catch (error) { body = { message: error.message }; }
        throw new Error(body.message || "Excel export failed.");
      }
      const blob = await res.blob();
      if (!blob.size) throw new Error("Excel file empty hai. Server restart karke dobara try karein.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ecofast_${(entry.report.customer || "Trial_Report").replace(/[^a-z0-9-_]+/gi, "_")}.xlsx`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Do not revoke immediately: some browsers cancel the download if the URL
      // is revoked in the same event loop as the click.
      window.setTimeout(() => URL.revokeObjectURL(url), 1500);
      setNotice({ type: "success", text: "Excel download start ho gayi. Browser Downloads folder check karein." });
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    } finally { setBusy(false); }
  }
  async function deleteEntry(id) {
    if (!window.confirm("Is saved entry ko permanently delete karna hai?")) return;
    try {
      const res = await ecofastFetch(`/api/ecofast/entries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      if (activeId === id) newEntry();
      await loadEntries();
      setNotice({ type: "success", text: "Entry delete ho gayi." });
    } catch (e) { setNotice({ type: "error", text: e.message }); }
  }

  return <div className="ecofast-app"><div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><FlaskConical size={23}/></div><div><strong>eco<span>fast</span></strong><small>TRIAL MANAGEMENT</small></div></div>
      <div className="nav-caption">WORKSPACE</div>
      <button className="nav-item active"><LayoutDashboard size={18}/> Trial entry</button>
      <button className="nav-item" onClick={() => document.getElementById("saved-entries")?.scrollIntoView({ behavior: "smooth" })}><ClipboardList size={18}/> Saved reports <span className="nav-count">{saved.length}</span></button>
      <div className="sidebar-bottom"><div className="status-dot"/> Server storage <span>● Online*</span><small>*Local server status</small></div>
    </aside>
    <main className="main">
      <header className="topbar"><div><div className="eyebrow">TRIAL REPORTS / DATA ENTRY</div><h1>Trial report workspace</h1><p>Enter trial details once. Save them on your server and export both Excel sheets.</p></div>
        <button className="btn btn-outline" onClick={newEntry}><Plus size={17}/> New report</button>
      </header>
      {notice.text && <div className={`notice ${notice.type}`}><span>{notice.type === "success" ? <Check size={17}/> : <Activity size={17}/>}</span>{notice.text}<button onClick={() => setNotice({ type: "", text: "" })}><X size={16}/></button></div>}
      <div className="stats">
        <div className="stat-card"><div className="stat-icon teal"><FileSpreadsheet size={20}/></div><div><span>Saved reports</span><strong>{saved.length}</strong><small>Stored on this server</small></div></div>
        <div className="stat-card"><div className="stat-icon blue"><Users size={20}/></div><div><span>Current customer</span><strong className="stat-customer">{entry.report.customer || "Not set"}</strong><small>{activeId ? "Editing saved report" : "New draft"}</small></div></div>
        <div className="stat-card"><div className="stat-icon amber"><FileSpreadsheet size={20}/></div><div><span>Excel worksheets</span><strong>02</strong><small>Report + Process</small></div></div>
      </div>
      <form onSubmit={saveEntry}>
        <section className="panel">
          <div className="panel-head"><div className="panel-title"><span className="step-badge">01</span><div><h2>Trial information</h2><p>Details mapped to the Report worksheet.</p></div></div><div className="sheet-chip"><span/> Report sheet</div></div>
          <div className="tabs"><button type="button" className={tab === "report" ? "tab active" : "tab"} onClick={() => setTab("report")}>Report details</button><button type="button" className={tab === "process" ? "tab active" : "tab"} onClick={() => setTab("process")}>Process details</button></div>
          {tab === "report" ? <div className="form-grid">
            {reportFields.map(([key, label, type = "text", required]) => <Field key={key} label={label} type={type} required={required} wide={["objective", "observations", "action"].includes(key)} value={entry.report[key]} onChange={v => updateReport(key, v)}/>)}
          </div> : <div className="form-grid">
            {processFields.map(([key, label]) => <Field key={key} label={label} value={entry.process[key]} onChange={v => updateProcess(key, v)}/>)}
          </div>}
        </section>
        <section className="panel">
          <div className="panel-head"><div className="panel-title"><span className="step-badge">02</span><div><h2>Process steps</h2><p>These rows are written into the preformatted Process worksheet.</p></div></div><span className="count-chip">{entry.process.steps.length} rows</span></div>
          <div className="table-note"><Activity size={15}/> Existing Excel row layout is preserved. Edit the process details below.</div>
          <div className="process-table-wrap"><table className="process-table"><thead><tr>{stepColumns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>
            {entry.process.steps.map((step, index) => <tr key={index}>{stepColumns.map(([key, label]) => <td key={key}><input aria-label={`${label} row ${index + 1}`} title={label} value={step[key] ?? ""} onChange={e => updateStep(index, key, e.target.value)} className={key === "details" ? "detail-input" : ""}/></td>)}</tr>)}
          </tbody></table></div>
          <div className="table-footer"><span>Template has 17 formatted process-step rows.</span><button type="button" className="text-button" onClick={() => updateProcess("steps", [...entry.process.steps, { no: "", details: "", dosage: "", totalQty: "", ph: "", temp: "", time: "", costPerKg: "", cost: "" }].slice(0,17))} disabled={entry.process.steps.length >= 17}><Plus size={15}/> Add blank row</button></div>
        </section>
        <div className="action-bar"><div className="save-hint"><span className="live-dot"/><div><strong>Server persistence enabled</strong><small>Save your draft before exporting the workbook.</small></div></div><div className="action-buttons"><button type="button" className="btn btn-outline" onClick={() => { setPreviewSheet("report"); setPreviewOpen(true); }}><Eye size={16}/> Preview</button><button type="button" className="btn btn-outline" onClick={newEntry}><RefreshCw size={16}/> Reset</button><button className="btn btn-primary" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <Save size={17}/>} {activeId ? "Update report" : "Save to server"}</button><button type="button" className="btn btn-dark" onClick={() => exportEntry()} disabled={busy}><ArrowDownToLine size={17}/> Download Excel</button></div></div>
      </form>

      <section className="panel saved-panel" id="saved-entries">
        <div className="panel-head"><div className="panel-title"><span className="step-badge">03</span><div><h2>Saved reports</h2><p>Open a saved report to edit it or download its Excel workbook.</p></div></div><button className="icon-btn" onClick={loadEntries} title="Refresh list"><RefreshCw size={17}/></button></div>
        <div className="saved-toolbar"><div className="searchbox"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search customer, product or visitor..."/></div><span>{filtered.length} records</span></div>
        {filtered.length === 0 ? <div className="empty-state"><div className="empty-icon"><ClipboardList size={24}/></div><strong>No saved reports yet</strong><span>Save a report above and it will appear here.</span></div> : <div className="saved-list">{filtered.map(item => <div className="saved-row" key={item.id}><div className="saved-file"><div className="file-icon"><FileSpreadsheet size={19}/></div><div><strong>{item.report.customer || "Untitled customer"}</strong><span>{item.report.product || "No product specified"} · {item.report.date || "No date"}</span></div></div><div className="saved-meta"><span>Updated {new Date(item.updatedAt).toLocaleDateString()}</span><span className="saved-status"><span/> Saved</span></div><div className="saved-actions"><button className="btn btn-small btn-outline" onClick={() => editEntry(item)}>Edit</button><button className="icon-btn download-icon" title="Download Excel" onClick={() => exportEntry(item.id)}><ArrowDownToLine size={17}/></button><button className="icon-btn delete-icon" title="Delete entry" onClick={() => deleteEntry(item.id)}><Trash2 size={16}/></button></div></div>)}</div>}
      </section>
      {previewOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setPreviewOpen(false); }}>
        <section className="preview-modal" role="dialog" aria-modal="true" aria-label="Excel data preview">
          <div className="preview-head"><div><div className="eyebrow">WORKBOOK PREVIEW</div><h2>{entry.report.customer || "New trial report"}</h2><p>Preview the data that will be exported to your two Excel worksheets.</p></div><button className="icon-btn" onClick={() => setPreviewOpen(false)} aria-label="Close preview"><X size={18}/></button></div>
          <div className="preview-tabs"><button className={previewSheet === "report" ? "preview-tab active" : "preview-tab"} onClick={() => setPreviewSheet("report")}>Report sheet</button><button className={previewSheet === "process" ? "preview-tab active" : "preview-tab"} onClick={() => setPreviewSheet("process")}>Process sheet</button></div>
          {previewSheet === "report" ? <div className="preview-content"><div className="preview-grid">{reportFields.map(([key, label]) => <div className="preview-field" key={key}><span>{label}</span><strong>{entry.report[key] || "—"}</strong></div>)}</div></div> : <div className="preview-content"><div className="preview-grid">{processFields.map(([key, label]) => <div className="preview-field" key={key}><span>{label}</span><strong>{entry.process[key] || "—"}</strong></div>)}</div><div className="preview-table-wrap"><table className="preview-table"><thead><tr>{stepColumns.map(([, label]) => <th key={label}>{label}</th>)}</tr></thead><tbody>{entry.process.steps.map((step, i) => <tr key={i}>{stepColumns.map(([key]) => <td key={key}>{step[key] || "—"}</td>)}</tr>)}</tbody></table></div></div>}
          <div className="preview-footer"><span><FileSpreadsheet size={15}/> Excel template · 2 worksheets</span><div><button className="btn btn-outline" onClick={() => setPreviewOpen(false)}>Close preview</button><button className="btn btn-dark" onClick={() => exportEntry()} disabled={busy}><ArrowDownToLine size={16}/> Download Excel</button></div></div>
        </section>
      </div>}
      <footer className="footer"><span>© {new Date().getFullYear()} Ecofast Trial Management</span><span><span className="live-dot"/> Workbook template: 2 worksheets</span></footer>
    </main>
  </div></div>;
}