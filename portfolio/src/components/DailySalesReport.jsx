import React, { useState, useEffect, useCallback, useMemo } from "react";

// ─── API Base URL ─────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_BASE_URL;

// ─── Constants ────────────────────────────────────────────────────────────────
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

// Returns today's date in YYYY-MM-DD format (for date input default value)
const todayISO = () => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const EMPTY_RECORD = {
  date: todayISO(), // ← auto-pickup today's date, editable
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

// ─── API Helper ───────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toNum = (v) => (v === "" || v === undefined ? 0 : parseFloat(v));

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
    month: "short",
    year: "numeric",
  });
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
    .dsr-record-card { transition: box-shadow 0.15s ease, transform 0.15s ease; }
    .dsr-record-card:hover { box-shadow: 0 4px 16px rgba(11,46,78,0.10) !important; transform: translateY(-1px); }
    .dsr-customer-row { transition: background 0.12s; }
    .dsr-customer-row:hover { background: #F0FDFA !important; }
    .dsr-customer-row:hover .dsr-row-actions { opacity: 1 !important; }
    .dsr-row-actions { opacity: 0; transition: opacity 0.15s; display: flex; gap: 6px; flex-shrink: 0; }
    /* Always show actions on mobile (no hover) */
    @media (max-width: 767px) { .dsr-row-actions { opacity: 1 !important; } }
    .dsr-nav-item:hover { background: rgba(255,255,255,0.08) !important; }
    .dsr-nav-item.active { background: rgba(0,184,162,0.18) !important; color: #00B8A2 !important; }
    .dsr-nav-action:hover { background: rgba(255,255,255,0.10) !important; }
    .dsr-topbar-btn:hover { background: rgba(255,255,255,0.15) !important; }
    .dsr-topbar-btn:active { background: rgba(255,255,255,0.25) !important; }

    /* Customer last-record banner */
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

    /* Last-hint pill */
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

    /* Edit modal header stripe */
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

    @media (min-width: 768px) {
      .dsr-layout { display: grid !important; grid-template-columns: 220px 1fr !important; min-height: 100vh !important; }
      .dsr-sidebar { display: flex !important; }
      .dsr-mobile-tabbar { display: none !important; }
      .dsr-main { padding: 28px 32px !important; max-width: 760px !important; }
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

// ─── Last-hint pill ───────────────────────────────────────────────────────────
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

// ─── Sub-components ───────────────────────────────────────────────────────────
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

// ─── Toast ────────────────────────────────────────────────────────────────────
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

// ─── Record Card ──────────────────────────────────────────────────────────────
const RecordCard = ({ record, onDelete }) => {
  const color = pctColor(record.pct);
  const sc = stageColor(record.stage);
  const id = record._id || record.id;
  return (
    <div
      className="dsr-record-card"
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        overflow: "hidden",
        borderLeft: `4px solid ${sc.border}`,
      }}
    >
      <div style={{ padding: "14px 14px 12px 14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
            marginBottom: 6,
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
              {record.date} · {record.area}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "3px 9px",
              borderRadius: 20,
              fontWeight: 600,
              background: "#EEF6FF",
              color: "#1D4ED8",
              border: "1px solid #BFDBFE",
              flexShrink: 0,
            }}
          >
            {record.distributor}
          </span>
        </div>
        {record.objective && (
          <div
            style={{
              fontSize: 12,
              color: "#374151",
              marginBottom: 6,
              lineHeight: 1.4,
              background: "#F0FDF4",
              borderRadius: 6,
              padding: "5px 9px",
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
              marginBottom: 6,
              lineHeight: 1.4,
              background: "#EFF6FF",
              borderRadius: 6,
              padding: "5px 9px",
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
        <div
          className="dsr-record-detail-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "6px 14px",
            padding: "10px 12px",
            background: "#F9FAFB",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          {[
            ["Pot. Dyes", record.potDyes],
            ["Pot. Aux", record.potAux],
            ["Ex. Dyes", record.exDyes],
            ["Ex. Aux", record.exAux],
            ["ABP AM26", record.abp],
            ["YTD Sale", record.ytd],
          ].map(([key, val]) => (
            <div key={key}>
              <div
                style={{
                  fontSize: 9,
                  color: "#9CA3AF",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {key}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: key === "YTD Sale" ? "#7C3AED" : "#111827",
                  marginTop: 1,
                }}
              >
                ₹{val}L
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
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
                height: 4,
                background: "#E5E7EB",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(record.pct, 100)}%`,
                  background: color,
                  borderRadius: 2,
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
    </div>
  );
};

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: "records", icon: "📋", label: "Records" },
  { id: "add", icon: "➕", label: "Add Record" },
  { id: "customers", icon: "🏪", label: "Customers" },
];

const NavActionBtn = ({ icon, label, onClick }) => (
  <button
    className="dsr-nav-action"
    onClick={onClick}
    title={label}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 9,
      width: "100%",
      padding: "9px 12px",
      borderRadius: 8,
      border: "none",
      cursor: "pointer",
      marginBottom: 2,
      fontSize: 12,
      fontWeight: 500,
      color: "rgba(255,255,255,0.55)",
      background: "transparent",
      textAlign: "left",
      transition: "background 0.15s, color 0.15s",
    }}
  >
    <span style={{ fontSize: 15, lineHeight: 1 }}>{icon}</span>
    <span>{label}</span>
  </button>
);

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
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #00B8A2, #0284C7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          📊
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
            DSR — VS
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
        padding: "10px 10px 6px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: "rgba(255,255,255,0.25)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          padding: "0 12px",
          marginBottom: 6,
        }}
      >
        Navigation
      </div>
      <NavActionBtn
        icon="🏠"
        label="Home"
        onClick={() => onChange("records")}
      />
      <NavActionBtn
        icon="←"
        label="Go Back"
        onClick={() => window.history.back()}
      />
    </div>
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

// ─── Mobile Tab Bar ───────────────────────────────────────────────────────────
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
      title="Go Back"
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
      <span style={{ fontSize: 9, letterSpacing: "0.03em" }}>Back</span>
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
        <span
          style={{
            fontSize: 9,
            fontWeight: active === t.id ? 700 : 400,
            letterSpacing: "0.03em",
          }}
        >
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
      <span
        style={{
          fontSize: 9,
          fontWeight: active === "records" ? 700 : 400,
          letterSpacing: "0.03em",
        }}
      >
        Home
      </span>
    </button>
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
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

// ─── Customer Modal (Add + Edit) ──────────────────────────────────────────────
// mode: "add" | "edit"
// editName: string (original name when editing)
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

  // Sync when editName changes (switching between customers to edit)
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
        {/* ── Header stripe ── */}
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

        {/* Customer name — always editable */}
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
          {isEdit && name.trim() !== editName && name.trim() !== "" && (
            <div
              style={{
                fontSize: 10,
                color: "#D97706",
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                borderRadius: 6,
                padding: "4px 8px",
                marginTop: 4,
              }}
            >
              ✏️ Naam badlega: <strong>{editName}</strong> →{" "}
              <strong>{name.trim()}</strong>
            </div>
          )}
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
          <div style={{ gridColumn: "1 / -1", marginBottom: 12 }}>
            <FieldLabel>ABP AM26</FieldLabel>
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

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {/* Delete button — only in edit mode */}
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
                transition: "background 0.15s",
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

  // ── Customer modal state ──────────────────────────────────────────────────
  // modalMode: null | "add" | "edit"
  const [modalMode, setModalMode] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null); // name string
  const [modalSaving, setModalSaving] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  // ── Load data ─────────────────────────────────────────────────────────────
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

  // ── Customer-specific last record map ─────────────────────────────────────
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

  // ── Derived metrics ───────────────────────────────────────────────────────
  const avgPct = records.length
    ? (records.reduce((s, r) => s + (r.pct || 0), 0) / records.length).toFixed(
        1,
      )
    : "0.0";
  const totalPot = records
    .reduce((s, r) => s + toNum(r.potDyes) + toNum(r.potAux), 0)
    .toFixed(1);
  const totalYTD = records.reduce((s, r) => s + toNum(r.ytd), 0).toFixed(1);
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const filteredRecords = records.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.customer.toLowerCase().includes(q) ||
      r.area.toLowerCase().includes(q) ||
      r.distributor.toLowerCase().includes(q) ||
      (r.objective && r.objective.toLowerCase().includes(q))
    );
  });

  // ── Record handlers ───────────────────────────────────────────────────────
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
    } else {
      setNewRecord((prev) => ({ ...prev, customer: val }));
    }
  };

  const addRecord = async () => {
    const { date, area, distributor, customer } = newRecord;
    if (!date || !area || !distributor || !customer) {
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
      setNewRecord({ ...EMPTY_RECORD }); // reset with today's date
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

  const exportToExcel = async () => {
    try {
      const res = await fetch(`${API}/api/dsr/records/export/excel`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `DSR_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      showToast("Excel download ho raha hai!");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // ── Customer modal handlers ───────────────────────────────────────────────
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

  // Called from CustomerModal on save
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
        // Get the MongoDB _id of the customer being edited
        const oldId = customers[editingCustomer]?._id;

        if (!oldId) {
          showToast("Customer ID nahi mila. Page refresh karo.", "error");
          return;
        }

        if (nameChanged) {
          // Rename: PUT old doc with new name (single atomic update)
          const res = await apiFetch(`/api/dsr/customers/${oldId}`, {
            method: "PUT",
            body: JSON.stringify(payload), // payload already has new name
          });
          const updated = res.data; // backend returns updated Customer doc

          setCustomers((prev) => {
            const next = { ...prev };
            delete next[editingCustomer]; // remove old key
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

          if (newRecord.customer === editingCustomer) {
            setNewRecord((prev) => ({ ...prev, customer: updated.name }));
          }
          showToast(`Naam update: ${editingCustomer} → ${updated.name}`);
        } else {
          // Same name — PUT to update fields only
          const res = await apiFetch(`/api/dsr/customers/${oldId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          });
          const updated = res.data;

          setCustomers((prev) => ({
            ...prev,
            [editingCustomer]: {
              _id: updated._id,
              area: updated.area,
              distributor: updated.distributor,
              stage: updated.stage,
              potDyes: updated.potDyes,
              potAux: updated.potAux,
              exDyes: updated.exDyes,
              exAux: updated.exAux,
              abp: updated.abp,
            },
          }));

          if (newRecord.customer === editingCustomer) {
            setNewRecord((prev) => ({
              ...prev,
              area: updated.area || prev.area,
              distributor: updated.distributor || prev.distributor,
              stage: updated.stage || prev.stage,
              potDyes: updated.potDyes ?? prev.potDyes,
              potAux: updated.potAux ?? prev.potAux,
              exDyes: updated.exDyes ?? prev.exDyes,
              exAux: updated.exAux ?? prev.exAux,
              abp: updated.abp ?? prev.abp,
            }));
          }
          showToast(`${name} update ho gaya!`);
        }
      } else {
        // POST /api/dsr/customers
        const res = await apiFetch("/api/dsr/customers", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        const newCust = res.data;
        setCustomers((prev) => ({ ...prev, ...newCust }));
        const custData = newCust[name];
        if (custData) {
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
        }
        showToast(`${name} add ho gaya!`);
      }
      closeModal();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setModalSaving(false);
    }
  };

  // Delete customer from edit modal or row
  const handleDeleteCustomer = async (name) => {
    if (
      !window.confirm(
        `"${name}" ko delete karein? Iske saare records bhi hat sakte hain.`,
      )
    )
      return;
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
      // If deleted customer was selected in form, clear it
      if (newRecord.customer === name) setNewRecord({ ...EMPTY_RECORD });
      showToast(`${name} delete ho gaya.`);
      closeModal();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const customerList = Object.keys(customers).sort();
  const lr = selectedCustomerLastRecord; // shorthand

  // ── Render ────────────────────────────────────────────────────────────────
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
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Header */}
        <div
          className="dsr-header"
          style={{
            background: "linear-gradient(135deg, #0B2E4E 0%, #185FA5 100%)",
            borderRadius: 12,
            padding: "16px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            className="dsr-topbar-btn"
            onClick={() => window.history.back()}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background 0.15s",
            }}
          >
            ←
          </button>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "linear-gradient(135deg, #00B8A2, #0284C7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            📊
          </div>
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
              Daily Sales Report — VS
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
              transition: "background 0.15s, color 0.15s",
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
            label="Total records"
            value={records.length}
            sub={today}
            accent="#3B82F6"
          />
          <MetricCard
            label="Avg. YTD vs ABP"
            value={`${avgPct}%`}
            sub="all customers"
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

        {/* ── RECORDS TAB ─────────────────────────────────────────────── */}
        {activeTab === "records" && (
          <>
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
              <button
                className="dsr-btn-export"
                onClick={exportToExcel}
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
                  gap: 5,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  transition: "background 0.15s",
                }}
              >
                ⬇ Export
              </button>
            </div>
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
                  Try a different search, or add a new record
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

        {/* ── ADD RECORD TAB ──────────────────────────────────────────── */}
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
                {/* Date — pre-filled with today, editable */}
                <div style={{ marginBottom: 12 }}>
                  <FieldLabel required>Date</FieldLabel>
                  <input
                    className="dsr-input"
                    style={inputStyle}
                    type="date"
                    name="date"
                    value={newRecord.date}
                    onChange={handleRecordChange}
                  />
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

              {/* Objective */}
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

              {/* Visit outcome */}
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

                {/* YTD */}
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
                transition: "background 0.15s, transform 0.1s",
              }}
            >
              {loading ? "⏳ Saving…" : "✚ Save record"}
            </button>
          </>
        )}

        {/* ── CUSTOMERS TAB ──────────────────────────────────────────── */}
        {activeTab === "customers" && (
          <SectionCard>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0B2E4E" }}>
                🏪 Customer Master
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
                  transition: "background 0.15s",
                }}
              >
                ＋ Add customer
              </button>
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
                  Add your first customer to get started
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
                    {/* Avatar */}
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

                    {/* Info */}
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

                    {/* Stage badge */}
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

                    {/* ── Edit / Delete action buttons ── */}
                    <div className="dsr-row-actions">
                      <button
                        className="dsr-btn-edit"
                        onClick={() => openEditCustomer(name)}
                        title="Edit customer"
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
                          transition: "background 0.15s, color 0.15s",
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="dsr-btn-danger"
                        onClick={() => handleDeleteCustomer(name)}
                        title="Delete customer"
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
                          transition: "background 0.15s",
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

      {/* Mobile bottom nav */}
      <MobileTabBar
        active={activeTab}
        onChange={setActiveTab}
        recordCount={records.length}
      />

      {/* ── Customer Modal (Add / Edit) ──────────────────────────────── */}
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
    </div>
  );
};

export default DailySalesReport;
