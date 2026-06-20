import React, { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";

// ─── Column mapping from Excel headers → internal keys ────────────────────────
const COL_MAP = {
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

// Normalize distributor name from Excel to match dropdown options
const normalizeDistributor = (val) => {
  if (!val) return "";
  const v = String(val).trim().toUpperCase();
  if (v.includes("SUPPLE")) return "Supple";
  if (v.includes("SHREE JEE")) return "Shree Jee Traders";
  return String(val).trim();
};

// Normalize stage name — try to match to known stages by prefix letter
const normalizeStage = (val) => {
  if (!val) return "";
  const v = String(val).trim();
  const letter = v[0]?.toUpperCase();
  const match = PROJECT_STAGE_OPTIONS.find((s) => s[0] === letter);
  return match || v;
};

const toNum = (v) => {
  if (v === "" || v === undefined || v === null) return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("ei-styles")) return;
  const s = document.createElement("style");
  s.id = "ei-styles";
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    .ei-input { transition: border-color 0.15s, box-shadow 0.15s; outline: none; }
    .ei-input:focus { border-color: #00B8A2 !important; box-shadow: 0 0 0 3px rgba(0,184,162,0.15) !important; }
    .ei-row-new { background: #F0FDF4; }
    .ei-row-dup { background: #FFF7ED; }
    .ei-row-skip { background: #F9FAFB; opacity: 0.6; }
    .ei-row-new td:first-child { border-left: 3px solid #10B981; }
    .ei-row-dup td:first-child { border-left: 3px solid #F59E0B; }
    .ei-row-skip td:first-child { border-left: 3px solid #D1D5DB; }
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
    .ei-badge-skip { background: #F3F4F6; color: #9CA3AF; }
    .ei-toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); color: #fff; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 9999; white-space: nowrap; box-shadow: 0 8px 24px rgba(0,0,0,0.18); display: flex; align-items: center; gap: 8px; }
    @media (max-width: 640px) { .ei-desktop-only { display: none !important; } }
  `;
  document.head.appendChild(s);
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) =>
  msg ? (
    <div
      className="ei-toast"
      style={{ background: type === "error" ? "#BE123C" : "#047857" }}
    >
      {type === "error" ? "✕" : "✓"} {msg}
    </div>
  ) : null;

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * ExcelImporter — Excel se customer data import karo
 *
 * Props:
 *   existingCustomers: object  { "Customer Name": { area, distributor, ... } }
 *   onImportDone:      (newCustomersObj) => void
 *       newCustomersObj is the same shape as existingCustomers — merge it in
 *   onClose:           () => void
 *   apiBase:           string   e.g. "https://api.example.com"
 *   getToken:          () => string
 */
const ExcelImporter = ({
  existingCustomers = {},
  onImportDone,
  onClose,
  apiBase = "",
  getToken = () => "",
}) => {
  React.useEffect(() => {
    injectStyles();
  }, []);

  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState([]); // parsed rows from Excel
  const [selected, setSelected] = useState({}); // { index: true/false }
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [dupAction, setDupAction] = useState("skip"); // "skip" | "overwrite"

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  // ── Parse Excel file ────────────────────────────────────────────────────
  const parseFile = useCallback(
    (file) => {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          // Try to find the header row (look for "Customer" in first 5 rows)
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

          // Deduplicate within file itself — keep last occurrence per customer
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
              const key = COL_MAP[h];
              if (key) obj[key] = row[j];
            });

            const name = String(obj.name || "").trim();
            if (!name) return; // skip empty rows

            // Only include the last occurrence of each customer from the file
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

          // Auto-select all NEW customers; deselect dups by default
          const sel = {};
          parsed.forEach((r, idx) => {
            sel[idx] = !r._isDup; // new = selected, dup = deselected
          });
          setSelected(sel);
          setDone(false);
        } catch (err) {
          showToast("File parse nahi hua: " + err.message, "error");
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

  // ── Select / deselect helpers ───────────────────────────────────────────
  const toggleRow = (idx) => setSelected((p) => ({ ...p, [idx]: !p[idx] }));

  const selectAll = () => {
    const sel = {};
    rows.forEach((r, i) => {
      sel[i] = r._status !== "skip";
    });
    setSelected(sel);
  };

  const selectAllNew = () => {
    const sel = {};
    rows.forEach((r, i) => {
      sel[i] = !r._isDup;
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

  // ── Import to API ───────────────────────────────────────────────────────
  const handleImport = async () => {
    if (selectedRows.length === 0) {
      showToast("Koi customer select nahi kiya.", "error");
      return;
    }

    setImporting(true);
    let successCount = 0;
    let failCount = 0;
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
          // Update existing
          const existingId = existingCustomers[r.name]?._id;
          if (existingId) {
            const res = await fetch(
              `${apiBase}/api/dsr/customers/${existingId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify(payload),
              },
            );
            const data = await res.json();
            if (res.ok && data.data) {
              importedCustomers[r.name] = data.data;
              successCount++;
            } else {
              failCount++;
            }
          } else {
            failCount++;
          }
        } else if (!r._isDup) {
          // Create new
          const res = await fetch(`${apiBase}/api/dsr/customers`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getToken()}`,
            },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (res.ok && data.data) {
            // API returns { data: { CustomerName: {...} } }
            Object.assign(importedCustomers, data.data);
            successCount++;
          } else {
            failCount++;
          }
        }
      } catch {
        failCount++;
      }
    }

    setImporting(false);
    setDone(true);

    if (successCount > 0) {
      showToast(
        `${successCount} customer${successCount > 1 ? "s" : ""} import ho gaye!${
          failCount > 0 ? ` (${failCount} fail)` : ""
        }`,
      );
      if (onImportDone) onImportDone(importedCustomers);
    } else {
      showToast("Import fail ho gaya.", "error");
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────
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
      <Toast msg={toast.msg} type={toast.type} />

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
        {/* Header */}
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

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {/* ── Upload zone ── */}
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
              {/* Expected columns info */}
              <div
                style={{
                  marginTop: 20,
                  padding: "12px 16px",
                  background: "#EFF6FF",
                  borderRadius: 10,
                  border: "1px solid #BFDBFE",
                  textAlign: "left",
                  fontSize: 11,
                  color: "#1D4ED8",
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  📋 Expected columns:
                </div>
                Customer · Area · Distributor · Project Stage · Potential - Dyes
                (Rs L/mth) · Potential - Aux (Rs L/mth) · Existing Bus: Dyes (Rs
                L/mth) · Existing Bus: Aux (Rs L/mth) · ABP AM26 (Rs L) · YTD
                Sale till end of Prev Mth (Rs L)
              </div>
            </div>
          )}

          {/* ── Parsed table ── */}
          {rows.length > 0 && (
            <>
              {/* Summary bar */}
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
                  ✦ {newCount} Naye customers
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
                    ⚠ {dupCount} Already exist
                  </div>
                )}
                <div
                  style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280" }}
                >
                  {selectedRows.length} selected
                </div>
              </div>

              {/* Dup action toggle */}
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
                    ⚠ Already existing customers ke liye:
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: `1px solid ${dupAction === "skip" ? "#F59E0B" : "#E5E7EB"}`,
                        background: dupAction === "skip" ? "#FEF3C7" : "#fff",
                        fontWeight: dupAction === "skip" ? 700 : 400,
                        color: dupAction === "skip" ? "#92400E" : "#374151",
                      }}
                    >
                      <input
                        type="radio"
                        name="dupAction"
                        value="skip"
                        checked={dupAction === "skip"}
                        onChange={() => setDupAction("skip")}
                        className="ei-check"
                      />
                      Skip karo (recommended)
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: `1px solid ${dupAction === "overwrite" ? "#F97316" : "#E5E7EB"}`,
                        background:
                          dupAction === "overwrite" ? "#FFF7ED" : "#fff",
                        fontWeight: dupAction === "overwrite" ? 700 : 400,
                        color:
                          dupAction === "overwrite" ? "#C2410C" : "#374151",
                      }}
                    >
                      <input
                        type="radio"
                        name="dupAction"
                        value="overwrite"
                        checked={dupAction === "overwrite"}
                        onChange={() => setDupAction("overwrite")}
                        className="ei-check"
                      />
                      Overwrite karo
                    </label>
                  </div>
                  {dupAction === "overwrite" && (
                    <div
                      style={{ fontSize: 11, color: "#C2410C", marginTop: 6 }}
                    >
                      ⚠ Selected duplicate customers ka data replace ho jaayega.
                    </div>
                  )}
                </div>
              )}

              {/* Select all shortcuts */}
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
                  ✓ Sirf naye select karo
                </button>
                <button
                  className="ei-btn-secondary"
                  onClick={selectAll}
                  style={{ fontSize: 11, padding: "4px 10px" }}
                >
                  ✓ Sab select karo
                </button>
                <button
                  className="ei-btn-secondary"
                  onClick={deselectAll}
                  style={{ fontSize: 11, padding: "4px 10px" }}
                >
                  ✕ Deselect all
                </button>
              </div>

              {/* Table */}
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
                      <th className="ei-desktop-only">Distributor</th>
                      <th className="ei-desktop-only">Pot. Dyes</th>
                      <th className="ei-desktop-only">Pot. Aux</th>
                      <th className="ei-desktop-only">ABP</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, idx) => {
                      const isSelected = !!selected[idx];
                      const rowClass = r._isDup
                        ? "ei-row-dup"
                        : isSelected
                          ? "ei-row-new"
                          : "";
                      return (
                        <tr
                          key={idx}
                          className={rowClass}
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
                          <td style={{ color: "#374151" }}>{r.area}</td>
                          <td
                            className="ei-desktop-only"
                            style={{ color: "#374151" }}
                          >
                            {r.distributor}
                          </td>
                          <td
                            className="ei-desktop-only"
                            style={{ color: "#374151" }}
                          >
                            ₹{r.potDyes}L
                          </td>
                          <td
                            className="ei-desktop-only"
                            style={{ color: "#374151" }}
                          >
                            ₹{r.potAux}L
                          </td>
                          <td
                            className="ei-desktop-only"
                            style={{ color: "#374151" }}
                          >
                            ₹{r.abp}L
                          </td>
                          <td>
                            <span
                              className={`ei-badge ${
                                r._isDup ? "ei-badge-dup" : "ei-badge-new"
                              }`}
                            >
                              {r._isDup ? "⚠ Duplicate" : "✦ New"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Change file link */}
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

        {/* Footer */}
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
                  ? `⏳ Import ho raha hai… (${selectedRows.length})`
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

export default ExcelImporter;
