import { useState, useMemo } from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const T = {
  navy: "#0E1A2B",
  navyLight: "#152335",
  navyBorder: "#1E3047",
  teal: "#00D4B8",
  tealDark: "#00B8A2",
  tealGlow: "rgba(0,212,184,0.15)",
  amber: "#F59E0B",
  amberLight: "#FEF3C7",
  amberDark: "#D97706",
  rose: "#F43F5E",
  roseLight: "#FFF1F2",
  violet: "#8B5CF6",
  violetLight: "#EDE9FE",
  emerald: "#10B981",
  emeraldLight: "#D1FAE5",
  blue: "#3B82F6",
  blueLight: "#EFF6FF",
  orange: "#F97316",
  orangeLight: "#FFF7ED",
  sky: "#0EA5E9",
  skyLight: "#E0F2FE",
  white: "#FFFFFF",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  text: "#111827",
  bg: "#F0F4F8",
};

// ─── Stage Config ─────────────────────────────────────────────────────────────
const STAGES = [
  {
    id: "A",
    label: "Promotion Complete",
    short: "Promotion",
    color: T.blue,
    bg: T.blueLight,
  },
  {
    id: "B",
    label: "Lab Trials Complete",
    short: "Lab Trial",
    color: "#8B5CF6",
    bg: T.violetLight,
  },
  {
    id: "C",
    label: "PR Enhanced",
    short: "PR Enhanced",
    color: T.teal,
    bg: "#E0FAF7",
  },
  {
    id: "D",
    label: "Bulk Trials Complete",
    short: "Bulk Trial",
    color: T.amber,
    bg: T.amberLight,
  },
  {
    id: "E",
    label: "Trial Report Sent",
    short: "Trial Report",
    color: T.orange,
    bg: T.orangeLight,
  },
  {
    id: "F",
    label: "Commercials Conveyed",
    short: "Commercials",
    color: T.sky,
    bg: T.skyLight,
  },
  {
    id: "G",
    label: "Proposal & Final Meet",
    short: "Final Meet",
    color: T.rose,
    bg: T.roseLight,
  },
  {
    id: "H",
    label: "Products Regularized",
    short: "Regularized",
    color: T.emerald,
    bg: T.emeraldLight,
  },
];
const stageOf = (id) => STAGES.find((s) => s.id === id) || STAGES[0];

const DISTRIBUTORS = ["All", "Supple", "Shree Jee Traders", "Other"];

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_CUSTOMERS = [
  {
    id: "c1",
    name: "Rajesh Fabrics Pvt Ltd",
    contact: "+91 98765 43210",
    contactPerson: "Rajesh Sharma",
    designation: "Purchase Manager",
    email: "rajesh@rajeshfabrics.com",
    area: "Panipat",
    distributor: "Supple",
    stage: "D",
    potential: 18,
    existing: 6,
    abp: 120,
    ytd: 48,
    priority: "High",
    tags: ["Dyes", "Bulk Buyer"],
    timeline: [
      {
        date: "2026-03-10",
        type: "Promotion",
        note: "Introduced ECOFAST NAVY range. Good response from purchase team.",
      },
      {
        date: "2026-04-05",
        type: "Lab Trial",
        note: "3 shades sent for lab evaluation. Shade Navy 232, Olive 5G, Red BF.",
      },
      {
        date: "2026-05-20",
        type: "Visit",
        note: "Follow-up on lab trial results. Minor fixation issue raised by lab team.",
      },
      {
        date: "2026-06-01",
        type: "Bulk Trial",
        note: "Bulk trial initiated for ECOFAST NAVY 232. 100kg material issued.",
      },
      {
        date: "2026-06-15",
        type: "Visit",
        note: "Visited to check bulk trial. Sample approved, awaiting formal order.",
      },
    ],
    nextFollowUp: "2026-06-22",
    lastVisit: "2026-06-15",
  },
  {
    id: "c2",
    name: "Krishna Textiles",
    contact: "+91 90123 45678",
    contactPerson: "Krishnaswamy Iyer",
    designation: "Director",
    email: "director@krishnatex.in",
    area: "Surat",
    distributor: "Shree Jee Traders",
    stage: "H",
    potential: 30,
    existing: 22,
    abp: 200,
    ytd: 180,
    priority: "High",
    tags: ["Dyes", "Auxiliaries", "Key Account"],
    timeline: [
      {
        date: "2025-10-12",
        type: "Promotion",
        note: "Promoted SAFEAUX range. Director was impressed with sustainability story.",
      },
      {
        date: "2025-11-08",
        type: "Lab Trial",
        note: "Trial for SAFEAUX SILICON NXT and ECOFAST BLK series.",
      },
      {
        date: "2025-12-15",
        type: "Bulk Trial",
        note: "Bulk trial successful. 500kg order placed for ECOFAST BLK.",
      },
      {
        date: "2026-01-20",
        type: "Regularized",
        note: "Products added to approved vendor list. Monthly supply started.",
      },
      {
        date: "2026-06-12",
        type: "Visit",
        note: "Quarterly review. Introduced SAFEAUX SILICON NXT. New trial planned.",
      },
    ],
    nextFollowUp: "2026-07-01",
    lastVisit: "2026-06-12",
  },
  {
    id: "c3",
    name: "Modern Dyeing Co",
    contact: "+91 88001 22334",
    contactPerson: "Harpreet Singh",
    designation: "Technical Head",
    email: "technical@moderndyeing.com",
    area: "Ludhiana",
    distributor: "Supple",
    stage: "B",
    potential: 25,
    existing: 0,
    abp: 60,
    ytd: 8,
    priority: "Medium",
    tags: ["Dyes"],
    timeline: [
      {
        date: "2026-05-01",
        type: "Promotion",
        note: "First meeting. Presented ECOFAST OLIVE series. Technical head showed interest.",
      },
      {
        date: "2026-06-10",
        type: "Lab Trial",
        note: "3 shades sent for lab trial. ECOFAST OLIVE 5G-149, 10G-180, BLK BF-100.",
      },
    ],
    nextFollowUp: "2026-06-20",
    lastVisit: "2026-06-10",
  },
  {
    id: "c4",
    name: "Bharat Processors Ltd",
    contact: "+91 77900 11223",
    contactPerson: "Suresh Patel",
    designation: "GM Purchase",
    email: "suresh.p@bharatproc.com",
    area: "Bhiwandi",
    distributor: "Shree Jee Traders",
    stage: "F",
    potential: 40,
    existing: 15,
    abp: 150,
    ytd: 92,
    priority: "High",
    tags: ["Dyes", "Auxiliaries"],
    timeline: [
      {
        date: "2025-12-01",
        type: "Promotion",
        note: "Introduced via distributor intro. Met GM Purchase.",
      },
      {
        date: "2026-01-15",
        type: "Lab Trial",
        note: "Lab trial for 5 dye shades and 2 auxiliary products.",
      },
      {
        date: "2026-02-28",
        type: "Bulk Trial",
        note: "Bulk trial completed. Report shared with positive findings.",
      },
      {
        date: "2026-04-10",
        type: "Trial Report",
        note: "Formal trial report sent with ROI analysis. GM impressed.",
      },
      {
        date: "2026-05-20",
        type: "Commercials",
        note: "Commercial proposal submitted. Price negotiation started.",
      },
      {
        date: "2026-06-08",
        type: "Visit",
        note: "Price concern raised. Revised proposal sent. Decision expected by June end.",
      },
    ],
    nextFollowUp: "2026-06-18",
    lastVisit: "2026-06-08",
  },
  {
    id: "c5",
    name: "Anand Knit Works",
    contact: "+91 94400 56789",
    contactPerson: "Anand Rajan",
    designation: "Owner",
    email: "anand@anandknit.com",
    area: "Tirupur",
    distributor: "Supple",
    stage: "C",
    potential: 20,
    existing: 4,
    abp: 80,
    ytd: 22,
    priority: "Medium",
    tags: ["Auxiliaries"],
    timeline: [
      {
        date: "2026-02-10",
        type: "Promotion",
        note: "Cold call turned into meeting. Owner personally handles tech decisions.",
      },
      {
        date: "2026-03-05",
        type: "Lab Trial",
        note: "Trial for SAFEAUX PREP LF and SAFEAUX SILICON NXT.",
      },
      {
        date: "2026-06-05",
        type: "PR Enhanced",
        note: "PR team convinced. Pretreatment study ongoing with positive initial results.",
      },
    ],
    nextFollowUp: "2026-07-05",
    lastVisit: "2026-06-05",
  },
  {
    id: "c6",
    name: "Star Dye House",
    contact: "+91 82200 99001",
    contactPerson: "Mohammed Farooq",
    designation: "Production Manager",
    email: "prod@stardyehouse.in",
    area: "Erode",
    distributor: "Shree Jee Traders",
    stage: "A",
    potential: 12,
    existing: 0,
    abp: 50,
    ytd: 0,
    priority: "Low",
    tags: ["Dyes"],
    timeline: [
      {
        date: "2026-06-01",
        type: "Promotion",
        note: "First visit. Presented full ECOFAST range. Production manager was receptive.",
      },
    ],
    nextFollowUp: "2026-07-01",
    lastVisit: "2026-06-01",
  },
  {
    id: "c7",
    name: "Premium Processors",
    contact: "+91 96600 33445",
    contactPerson: "Deepak Verma",
    designation: "Technical Director",
    email: "deepak@premiumproc.com",
    area: "Jaipur",
    distributor: "Supple",
    stage: "G",
    potential: 35,
    existing: 10,
    abp: 180,
    ytd: 145,
    priority: "High",
    tags: ["Dyes", "Auxiliaries", "Key Account"],
    timeline: [
      {
        date: "2025-09-15",
        type: "Promotion",
        note: "Senior management meeting arranged by distributor.",
      },
      {
        date: "2025-10-20",
        type: "Lab Trial",
        note: "Extensive lab trial across 8 shades.",
      },
      {
        date: "2025-11-30",
        type: "Bulk Trial",
        note: "Bulk trial successful for all 8 shades.",
      },
      {
        date: "2026-01-10",
        type: "Trial Report",
        note: "Trial report presented. Positive outcome.",
      },
      {
        date: "2026-02-25",
        type: "Commercials",
        note: "Annual commercial proposal submitted.",
      },
      {
        date: "2026-05-15",
        type: "Final Meet",
        note: "Final proposal meeting. Board approval pending. Decision imminent.",
      },
    ],
    nextFollowUp: "2026-06-25",
    lastVisit: "2026-05-15",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

const daysFromNow = (d) => {
  if (!d) return 9999;
  return Math.ceil((new Date(d) - new Date()) / 86400000);
};

const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

const getInitials = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const tagColors = {
  Dyes: { bg: "#EFF6FF", color: "#1D4ED8" },
  Auxiliaries: { bg: "#EDE9FE", color: "#6D28D9" },
  Fixatives: { bg: "#E0FAF7", color: "#0F766E" },
  "Key Account": { bg: "#FEF3C7", color: "#B45309" },
  "Bulk Buyer": { bg: "#D1FAE5", color: "#065F46" },
};

const priorityConfig = {
  High: { bg: T.roseLight, color: T.rose, icon: "🔴" },
  Medium: { bg: T.amberLight, color: T.amberDark, icon: "🟡" },
  Low: { bg: T.emeraldLight, color: "#065F46", icon: "🟢" },
};

const timelineTypeConfig = {
  Promotion: { color: T.blue, bg: T.blueLight, icon: "📣" },
  "Lab Trial": { color: "#8B5CF6", bg: T.violetLight, icon: "🧪" },
  "Bulk Trial": { color: T.amber, bg: T.amberLight, icon: "🏭" },
  "PR Enhanced": { color: T.teal, bg: "#E0FAF7", icon: "📈" },
  "Trial Report": { color: T.orange, bg: T.orangeLight, icon: "📄" },
  Commercials: { color: T.sky, bg: T.skyLight, icon: "💼" },
  "Final Meet": { color: T.rose, bg: T.roseLight, icon: "🤝" },
  Regularized: { color: T.emerald, bg: T.emeraldLight, icon: "✅" },
  Visit: { color: T.gray500, bg: T.gray100, icon: "🗺" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
const Badge = ({ label, color, bg, small }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: small ? "2px 7px" : "3px 10px",
      borderRadius: 20,
      fontSize: small ? 9 : 10,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      background: bg,
      color,
      flexShrink: 0,
    }}
  >
    {label}
  </span>
);

const StagePill = ({ stageId, full }) => {
  const s = stageOf(stageId);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        background: s.bg,
        color: s.color,
        flexShrink: 0,
      }}
    >
      <span style={{ fontWeight: 900 }}>{s.id}</span>
      {full ? `. ${s.label}` : `. ${s.short}`}
    </span>
  );
};

const StatBox = ({ label, value, color, sub }) => (
  <div
    style={{
      background: T.gray50,
      borderRadius: 8,
      padding: "10px 12px",
      borderTop: `2px solid ${color}`,
    }}
  >
    <div
      style={{
        fontSize: 9,
        color: T.gray400,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        marginBottom: 3,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    {sub && (
      <div style={{ fontSize: 10, color: T.gray400, marginTop: 2 }}>{sub}</div>
    )}
  </div>
);

// ─── Customer Detail Panel ─────────────────────────────────────────────────────
const CustomerDetail = ({ customer, onClose, onEdit }) => {
  const [activeSection, setActiveSection] = useState("overview");
  const s = stageOf(customer.stage);
  const ytdPct = pct(customer.ytd, customer.abp);
  const followDays = daysFromNow(customer.nextFollowUp);
  const prio = priorityConfig[customer.priority] || priorityConfig.Medium;

  const sections = ["overview", "timeline", "numbers", "contacts"];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(11,26,43,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backdropFilter: "blur(3px)",
      }}
    >
      <div
        style={{
          background: T.white,
          borderRadius: 18,
          width: "100%",
          maxWidth: 680,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 80px rgba(0,0,0,0.22)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${T.navy} 0%, #185FA5 100%)`,
            padding: "20px 22px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(0,184,162,0.2)",
                  border: "2px solid rgba(0,184,162,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 800,
                  color: T.teal,
                  flexShrink: 0,
                }}
              >
                {getInitials(customer.name)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: T.white,
                    marginBottom: 3,
                  }}
                >
                  {customer.name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                  {customer.area} · {customer.distributor}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 15,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StagePill stageId={customer.stage} full />
            <Badge label={customer.priority} color={prio.color} bg={prio.bg} />
            {customer.tags.map((tag) => {
              const tc = tagColors[tag] || { bg: T.gray100, color: T.gray600 };
              return (
                <Badge key={tag} label={tag} color={tc.color} bg={tc.bg} />
              );
            })}
          </div>
        </div>

        {/* Section Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${T.gray200}`,
            background: T.gray50,
            flexShrink: 0,
          }}
        >
          {sections.map((sec) => {
            const labels = {
              overview: "📊 Overview",
              timeline: "📅 Timeline",
              numbers: "💰 Numbers",
              contacts: "👤 Contact",
            };
            return (
              <button
                key={sec}
                onClick={() => setActiveSection(sec)}
                style={{
                  flex: 1,
                  padding: "12px 8px",
                  border: "none",
                  background: "transparent",
                  fontSize: 11,
                  fontWeight: activeSection === sec ? 700 : 400,
                  color: activeSection === sec ? T.teal : T.gray500,
                  borderBottom: `2px solid ${activeSection === sec ? T.teal : "transparent"}`,
                  cursor: "pointer",
                  transition: "color 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {labels[sec]}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {/* OVERVIEW */}
          {activeSection === "overview" && (
            <div>
              {/* Follow-up alert */}
              {customer.nextFollowUp && followDays <= 3 && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    marginBottom: 16,
                    background: followDays <= 0 ? T.roseLight : T.amberLight,
                    border: `1px solid ${followDays <= 0 ? "#FECACA" : "#FDE68A"}`,
                    borderLeft: `4px solid ${followDays <= 0 ? T.rose : T.amber}`,
                    fontSize: 12,
                    color: followDays <= 0 ? T.rose : T.amberDark,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>
                    {followDays <= 0 ? "⚠️" : "📌"}
                  </span>
                  {followDays <= 0
                    ? `Follow-up OVERDUE by ${Math.abs(followDays)} days`
                    : followDays === 0
                      ? "Follow-up is TODAY"
                      : `Follow-up in ${followDays} days`}
                  {" — "}
                  {fmtDate(customer.nextFollowUp)}
                </div>
              )}

              {/* Stage progress */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.gray400,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  Pipeline Stage
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    overflowX: "auto",
                    paddingBottom: 4,
                  }}
                >
                  {STAGES.map((st, i) => {
                    const isActive = st.id === customer.stage;
                    const isPast =
                      STAGES.findIndex((s) => s.id === customer.stage) > i;
                    return (
                      <div
                        key={st.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: isActive ? 36 : 28,
                            height: isActive ? 36 : 28,
                            borderRadius: "50%",
                            background: isActive
                              ? st.color
                              : isPast
                                ? st.color + "60"
                                : T.gray200,
                            border: `2px solid ${isActive ? st.color : isPast ? st.color + "40" : T.gray300}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: isActive ? 13 : 10,
                            fontWeight: 800,
                            color: isActive || isPast ? T.white : T.gray400,
                            boxShadow: isActive
                              ? `0 0 0 3px ${st.color}30`
                              : "none",
                            transition: "all 0.2s",
                            flexShrink: 0,
                          }}
                        >
                          {st.id}
                        </div>
                        {i < STAGES.length - 1 && (
                          <div
                            style={{
                              width: 12,
                              height: 2,
                              background: isPast ? st.color + "60" : T.gray200,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 11,
                    color: s.color,
                    fontWeight: 700,
                  }}
                >
                  Stage {customer.stage}: {s.label}
                </div>
              </div>

              {/* Quick stats */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <StatBox
                  label="Potential /mth"
                  value={`₹${customer.potential}L`}
                  color={T.blue}
                />
                <StatBox
                  label="Existing /mth"
                  value={`₹${customer.existing}L`}
                  color={T.emerald}
                />
                <StatBox
                  label="ABP AM26"
                  value={`₹${customer.abp}L`}
                  color={T.violet}
                />
                <StatBox
                  label="YTD Sale"
                  value={`₹${customer.ytd}L`}
                  color={T.teal}
                  sub={`${ytdPct}% of ABP`}
                />
              </div>

              {/* YTD progress bar */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 12, color: T.gray500 }}>
                    YTD vs ABP Progress
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        ytdPct >= 80
                          ? T.emerald
                          : ytdPct >= 50
                            ? T.amber
                            : T.rose,
                    }}
                  >
                    {ytdPct}%
                  </span>
                </div>
                <div
                  style={{ height: 8, background: T.gray100, borderRadius: 4 }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${ytdPct}%`,
                      background:
                        ytdPct >= 80
                          ? T.emerald
                          : ytdPct >= 50
                            ? T.amber
                            : T.rose,
                      borderRadius: 4,
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>

              {/* Recent timeline summary */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: T.gray400,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  Recent Activity
                </div>
                {customer.timeline
                  .slice(-3)
                  .reverse()
                  .map((item, i) => {
                    const tc =
                      timelineTypeConfig[item.type] || timelineTypeConfig.Visit;
                    return (
                      <div
                        key={i}
                        style={{ display: "flex", gap: 10, marginBottom: 10 }}
                      >
                        <div
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 8,
                            background: tc.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 14,
                            flexShrink: 0,
                          }}
                        >
                          {tc.icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 2,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: tc.color,
                              }}
                            >
                              {item.type}
                            </span>
                            <span style={{ fontSize: 10, color: T.gray400 }}>
                              {fmtDate(item.date)}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: T.gray600,
                              lineHeight: 1.4,
                            }}
                          >
                            {item.note}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                <button
                  onClick={() => setActiveSection("timeline")}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 8,
                    border: `1px dashed ${T.gray300}`,
                    background: "transparent",
                    fontSize: 12,
                    color: T.teal,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  View full timeline ({customer.timeline.length} events) →
                </button>
              </div>
            </div>
          )}

          {/* TIMELINE */}
          {activeSection === "timeline" && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.gray400,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 16,
                }}
              >
                Complete Activity Timeline — {customer.timeline.length} events
              </div>
              <div style={{ position: "relative", paddingLeft: 24 }}>
                <div
                  style={{
                    position: "absolute",
                    left: 11,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: T.gray200,
                  }}
                />
                {customer.timeline
                  .slice()
                  .reverse()
                  .map((item, i) => {
                    const tc =
                      timelineTypeConfig[item.type] || timelineTypeConfig.Visit;
                    return (
                      <div
                        key={i}
                        style={{ position: "relative", marginBottom: 20 }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            left: -24,
                            top: 6,
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: tc.bg,
                            border: `2px solid ${tc.color}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            zIndex: 1,
                          }}
                        >
                          {tc.icon}
                        </div>
                        <div
                          style={{
                            background: T.gray50,
                            borderRadius: 10,
                            padding: "12px 14px",
                            border: `1px solid ${T.gray200}`,
                            borderLeft: `3px solid ${tc.color}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: tc.color,
                              }}
                            >
                              {item.type}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                color: T.gray400,
                                background: T.white,
                                padding: "2px 8px",
                                borderRadius: 20,
                                border: `1px solid ${T.gray200}`,
                              }}
                            >
                              {fmtDate(item.date)}
                            </span>
                          </div>
                          <p
                            style={{
                              fontSize: 12,
                              color: T.gray700,
                              lineHeight: 1.5,
                              margin: 0,
                            }}
                          >
                            {item.note}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* NUMBERS */}
          {activeSection === "numbers" && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.gray400,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 14,
                }}
              >
                Financial Summary (₹ Lakhs)
              </div>

              {/* Main numbers grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {[
                  {
                    label: "Monthly Potential",
                    sub: "Max possible /month",
                    value: `₹${customer.potential}L`,
                    color: T.blue,
                  },
                  {
                    label: "Current Existing",
                    sub: "Active business /month",
                    value: `₹${customer.existing}L`,
                    color: T.emerald,
                  },
                  {
                    label: "ABP AM26",
                    sub: "Annual Business Plan",
                    value: `₹${customer.abp}L`,
                    color: T.violet,
                  },
                  {
                    label: "YTD Sale",
                    sub: "Till end of prev month",
                    value: `₹${customer.ytd}L`,
                    color: T.teal,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: T.white,
                      border: `1px solid ${T.gray200}`,
                      borderRadius: 10,
                      padding: "14px 16px",
                      borderTop: `3px solid ${item.color}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: T.gray400,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 6,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: item.color,
                        marginBottom: 2,
                      }}
                    >
                      {item.value}
                    </div>
                    <div style={{ fontSize: 10, color: T.gray400 }}>
                      {item.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* ABP performance */}
              <div
                style={{
                  background: T.navy,
                  borderRadius: 12,
                  padding: "16px 18px",
                  color: T.white,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    marginBottom: 14,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  ABP Performance Tracker
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}
                  >
                    YTD vs ABP
                  </span>
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color:
                        ytdPct >= 80
                          ? T.emerald
                          : ytdPct >= 50
                            ? T.amber
                            : T.rose,
                    }}
                  >
                    {ytdPct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 10,
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 5,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${ytdPct}%`,
                      background:
                        ytdPct >= 80
                          ? T.emerald
                          : ytdPct >= 50
                            ? T.amber
                            : T.rose,
                      borderRadius: 5,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.4)",
                        marginBottom: 3,
                      }}
                    >
                      Achieved
                    </div>
                    <div
                      style={{ fontSize: 16, fontWeight: 800, color: T.teal }}
                    >
                      ₹{customer.ytd}L
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.4)",
                        marginBottom: 3,
                      }}
                    >
                      Target
                    </div>
                    <div
                      style={{ fontSize: 16, fontWeight: 800, color: T.white }}
                    >
                      ₹{customer.abp}L
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgba(255,255,255,0.4)",
                        marginBottom: 3,
                      }}
                    >
                      Remaining
                    </div>
                    <div
                      style={{ fontSize: 16, fontWeight: 800, color: T.amber }}
                    >
                      ₹{Math.max(0, customer.abp - customer.ytd)}L
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTACT */}
          {activeSection === "contacts" && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.gray400,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 14,
                }}
              >
                Contact Information
              </div>
              <div
                style={{
                  background: T.white,
                  border: `1px solid ${T.gray200}`,
                  borderRadius: 12,
                  padding: "18px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 18,
                    paddingBottom: 18,
                    borderBottom: `1px solid ${T.gray100}`,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      background: T.blueLight,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: 800,
                      color: T.blue,
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(customer.contactPerson)}
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 15, fontWeight: 700, color: T.text }}
                    >
                      {customer.contactPerson}
                    </div>
                    <div
                      style={{ fontSize: 12, color: T.gray500, marginTop: 2 }}
                    >
                      {customer.designation}
                    </div>
                    <div
                      style={{ fontSize: 11, color: T.gray400, marginTop: 1 }}
                    >
                      {customer.name}
                    </div>
                  </div>
                </div>
                {[
                  { icon: "📞", label: "Phone", value: customer.contact },
                  { icon: "📧", label: "Email", value: customer.email },
                  { icon: "📍", label: "Area / City", value: customer.area },
                  {
                    icon: "🏪",
                    label: "Distributor",
                    value: customer.distributor,
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: `1px solid ${T.gray100}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        width: 22,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      {row.icon}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: T.gray500,
                        width: 80,
                        flexShrink: 0,
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: T.text }}
                    >
                      {row.value || "—"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Next follow-up */}
              {customer.nextFollowUp && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "12px 16px",
                    borderRadius: 10,
                    background:
                      followDays <= 0
                        ? T.roseLight
                        : followDays <= 3
                          ? T.amberLight
                          : T.emeraldLight,
                    border: `1px solid ${followDays <= 0 ? "#FECACA" : followDays <= 3 ? "#FDE68A" : "#A7F3D0"}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.gray500,
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Next Follow-up
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        followDays <= 0
                          ? T.rose
                          : followDays <= 3
                            ? T.amberDark
                            : "#065F46",
                    }}
                  >
                    {fmtDate(customer.nextFollowUp)}
                    {followDays <= 0
                      ? ` — OVERDUE by ${Math.abs(followDays)}d`
                      : followDays === 0
                        ? " — Today!"
                        : ` — in ${followDays} days`}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 22px",
            borderTop: `1px solid ${T.gray200}`,
            background: T.gray50,
            display: "flex",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 38,
              background: T.gray100,
              color: T.gray700,
              border: `1px solid ${T.gray200}`,
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
          <button
            onClick={() => onEdit(customer)}
            style={{
              flex: 2,
              height: 38,
              background: T.teal,
              color: T.navy,
              border: "none",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ✏️ Edit Customer
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Avatar bg palette — one per letter band ─────────────────────────────────
const avatarPalette = [
  { bg: "#E6F1FB", color: "#0C447C" },
  { bg: "#EAF3DE", color: "#27500A" },
  { bg: "#EEEDFE", color: "#3C3489" },
  { bg: "#FAEEDA", color: "#633806" },
  { bg: "#FCEBEB", color: "#791F1F" },
  { bg: "#E1F5EE", color: "#085041" },
  { bg: "#FBEAF0", color: "#72243E" },
  { bg: "#FAECE7", color: "#712B13" },
];
const avatarColor = (name) =>
  avatarPalette[name.charCodeAt(0) % avatarPalette.length];

// ─── Customer Card ────────────────────────────────────────────────────────────
const CustomerCard = ({ customer, onClick }) => {
  const s = stageOf(customer.stage);
  const ytdPct = pct(customer.ytd, customer.abp);
  const followDays = daysFromNow(customer.nextFollowUp);
  const isOverdue = followDays < 0;
  const isToday = followDays === 0;
  const isUrgent = followDays <= 2 && followDays >= 0;
  const isKeyAccount = customer.tags.includes("Key Account");
  const av = avatarColor(customer.name);

  // Progress bar color
  const barColor = ytdPct >= 80 ? T.emerald : ytdPct >= 50 ? T.amber : T.rose;

  // Priority dot color
  const prioDot =
    customer.priority === "High"
      ? T.rose
      : customer.priority === "Medium"
        ? T.amber
        : T.emerald;

  // Follow-up strip config
  const followBg = isOverdue
    ? "#FFF1F2"
    : isToday
      ? T.amberLight
      : isUrgent
        ? "#FFFBEB"
        : T.gray50;
  const followColor = isOverdue
    ? T.rose
    : isToday
      ? T.amberDark
      : isUrgent
        ? "#B45309"
        : T.gray400;
  const followIcon = isOverdue ? "⚠" : isToday ? "📌" : "🗓";
  const followText = isOverdue
    ? `Follow-up overdue · ${fmtDate(customer.nextFollowUp)}`
    : isToday
      ? `Follow-up today · ${fmtDate(customer.nextFollowUp)}`
      : customer.nextFollowUp
        ? `Follow-up ${followDays}d · ${fmtDate(customer.nextFollowUp)}`
        : "No follow-up set";

  return (
    <div
      onClick={() => onClick(customer)}
      style={{
        background: T.white,
        borderRadius: 14,
        border: `1px solid ${isKeyAccount ? s.color + "55" : T.gray200}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s, transform 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = s.color + "99";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isKeyAccount
          ? s.color + "55"
          : T.gray200;
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Stage accent bar — top */}
      <div style={{ height: 3, background: s.color, width: "100%" }} />

      {/* Key Account banner */}
      {isKeyAccount && (
        <div
          style={{
            background: T.amberLight,
            padding: "4px 14px",
            display: "flex",
            alignItems: "center",
            gap: 5,
            borderBottom: `1px solid #FDE68A`,
          }}
        >
          <span style={{ fontSize: 11 }}>⭐</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#92400E",
              letterSpacing: "0.03em",
            }}
          >
            Key Account
          </span>
        </div>
      )}

      {/* Card body */}
      <div style={{ padding: "13px 14px 0" }}>
        {/* Row 1 — Avatar + Name + Stage pill */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: av.bg,
              color: av.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
              border: `1.5px solid ${av.color}30`,
            }}
          >
            {getInitials(customer.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: T.text,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                lineHeight: 1.25,
                marginBottom: 3,
              }}
            >
              {customer.name}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: T.gray500,
              }}
            >
              <span style={{ fontSize: 11 }}>📍</span>
              <span>{customer.area}</span>
              <span style={{ color: T.gray300 }}>·</span>
              <span style={{ color: T.gray400 }}>{customer.distributor}</span>
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <StagePill stageId={customer.stage} />
          </div>
        </div>

        {/* Row 2 — Contact person + Priority */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: 13, color: T.gray400 }}>👤</span>
            <span
              style={{
                fontSize: 12,
                color: T.gray600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {customer.contactPerson}
            </span>
            <span style={{ fontSize: 11, color: T.gray400, flexShrink: 0 }}>
              · {customer.designation}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: prioDot,
                display: "inline-block",
              }}
            />
            <span style={{ fontSize: 11, color: T.gray500, fontWeight: 600 }}>
              {customer.priority}
            </span>
          </div>
        </div>

        {/* Row 3 — Tags */}
        {customer.tags.filter((t) => t !== "Key Account").length > 0 && (
          <div
            style={{
              display: "flex",
              gap: 5,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {customer.tags
              .filter((t) => t !== "Key Account")
              .map((tag) => {
                const tc = tagColors[tag] || {
                  bg: T.gray100,
                  color: T.gray600,
                };
                return (
                  <span
                    key={tag}
                    style={{
                      fontSize: 11,
                      padding: "2px 9px",
                      borderRadius: 20,
                      background: tc.bg,
                      color: tc.color,
                      fontWeight: 600,
                      border: `1px solid ${tc.color}20`,
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
          </div>
        )}

        {/* Row 4 — YTD progress */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 5,
            }}
          >
            <span style={{ fontSize: 11, color: T.gray400, fontWeight: 500 }}>
              YTD vs ABP
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: barColor }}>
              {ytdPct}%
            </span>
          </div>
          <div
            style={{
              height: 5,
              background: T.gray100,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${ytdPct}%`,
                background: barColor,
                borderRadius: 3,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Number strip — 3 cells */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderTop: `1px solid ${T.gray100}`,
        }}
      >
        {[
          {
            label: "Potential",
            value: `₹${customer.potential}L`,
            sub: "/month",
            valueColor: T.blue,
          },
          {
            label: "Existing",
            value: `₹${customer.existing}L`,
            sub: "/month",
            valueColor: T.emerald,
          },
          {
            label: "YTD Sale",
            value: `₹${customer.ytd}L`,
            sub: `of ₹${customer.abp}L`,
            valueColor: T.text,
          },
        ].map((n, i) => (
          <div
            key={n.label}
            style={{
              padding: "9px 12px",
              borderRight: i < 2 ? `1px solid ${T.gray100}` : "none",
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: T.gray400,
                fontWeight: 500,
                marginBottom: 2,
              }}
            >
              {n.label}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: n.valueColor,
                lineHeight: 1.1,
              }}
            >
              {n.value}
            </div>
            <div style={{ fontSize: 10, color: T.gray400, marginTop: 1 }}>
              {n.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Footer strip — follow-up + last visit + arrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 14px",
          background: followBg,
          borderTop: `1px solid ${isOverdue ? "#FECACA" : isToday ? "#FDE68A" : T.gray100}`,
          gap: 8,
        }}
      >
        <div
          style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}
        >
          <span style={{ fontSize: 13, flexShrink: 0 }}>{followIcon}</span>
          <span
            style={{
              fontSize: 11,
              color: followColor,
              fontWeight: isOverdue || isToday ? 700 : 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {followText}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {customer.lastVisit && (
            <span style={{ fontSize: 10, color: T.gray400 }}>
              🕐 {fmtDate(customer.lastVisit)}
            </span>
          )}
          <span style={{ fontSize: 14, color: T.gray300 }}>›</span>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CustomerListPage() {
  const [customers] = useState(SEED_CUSTOMERS);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [search, setSearch] = useState("");
  const [distFilter, setDistFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState("split"); // split | list | grid

  const filtered = useMemo(() => {
    let list = customers.filter((c) => {
      const q = search.toLowerCase();
      const matchSearch =
        !search ||
        [
          c.name,
          c.area,
          c.contactPerson,
          c.distributor,
          c.email,
          c.contact,
          ...c.tags,
        ].some((f) => (f || "").toLowerCase().includes(q));
      const matchDist = distFilter === "All" || c.distributor === distFilter;
      const matchStage = stageFilter === "All" || c.stage === stageFilter;
      const matchPriority =
        priorityFilter === "All" || c.priority === priorityFilter;
      return matchSearch && matchDist && matchStage && matchPriority;
    });

    list.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "stage") return a.stage.localeCompare(b.stage);
      if (sortBy === "ytd") return b.ytd - a.ytd;
      if (sortBy === "followup")
        return daysFromNow(a.nextFollowUp) - daysFromNow(b.nextFollowUp);
      if (sortBy === "potential") return b.potential - a.potential;
      return 0;
    });

    return list;
  }, [customers, search, distFilter, stageFilter, priorityFilter, sortBy]);

  // Grouped by distributor for split view
  const suppleCustomers = filtered.filter((c) => c.distributor === "Supple");
  const shreeJeeCustomers = filtered.filter(
    (c) => c.distributor === "Shree Jee Traders",
  );
  const otherCustomers = filtered.filter(
    (c) => c.distributor !== "Supple" && c.distributor !== "Shree Jee Traders",
  );

  // Summary stats
  const totalPotential = filtered.reduce((s, c) => s + c.potential, 0);
  const totalYTD = filtered.reduce((s, c) => s + c.ytd, 0);
  const overdueCount = filtered.filter(
    (c) => c.nextFollowUp && daysFromNow(c.nextFollowUp) < 0,
  ).length;
  const dueTodayCount = filtered.filter(
    (c) => c.nextFollowUp && daysFromNow(c.nextFollowUp) === 0,
  ).length;

  const DistributorColumn = ({ title, color, custList, icon }) => (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Distributor Header */}
      <div
        style={{
          background: T.navy,
          borderRadius: "12px 12px 0 0",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: color + "30",
              border: `1px solid ${color}60`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.white }}>
              {title}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.45)",
                marginTop: 1,
              }}
            >
              {custList.length} customers
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color }}>
            ₹{custList.reduce((s, c) => s + c.potential, 0)}L
          </div>
          <div
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.4)",
              marginTop: 1,
            }}
          >
            total potential
          </div>
        </div>
      </div>

      {/* Cards */}
      <div
        style={{
          background: T.bg,
          borderRadius: "0 0 12px 12px",
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          minHeight: 120,
        }}
      >
        {custList.length === 0 ? (
          <div
            style={{
              padding: "30px 16px",
              textAlign: "center",
              color: T.gray400,
              fontSize: 12,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
            No customers match filters
          </div>
        ) : (
          custList.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              onClick={setSelectedCustomer}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <div
      style={{
        background: T.bg,
        minHeight: "100vh",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: T.text,
      }}
    >
      {/* Top Header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${T.navy} 0%, #185FA5 100%)`,
          padding: "20px 20px 16px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #00B8A2, #0284C7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                🏭
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: T.white,
                    margin: 0,
                  }}
                >
                  Customer Master
                </h1>
                <p
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                    margin: 0,
                    marginTop: 2,
                  }}
                >
                  Supple & Shree Jee Traders — Sales Intelligence
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {["split", "grid"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 7,
                    border: `1px solid ${viewMode === mode ? T.teal : "rgba(255,255,255,0.2)"}`,
                    background:
                      viewMode === mode ? T.teal : "rgba(255,255,255,0.08)",
                    color: viewMode === mode ? T.navy : "rgba(255,255,255,0.6)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {mode === "split" ? "⚡ Split View" : "⊞ Grid"}
                </button>
              ))}
            </div>
          </div>

          {/* Summary stat chips */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              {
                label: `${filtered.length} Customers`,
                bg: "rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.8)",
              },
              {
                label: `₹${totalPotential}L Potential`,
                bg: "rgba(0,184,162,0.2)",
                color: T.teal,
              },
              {
                label: `₹${totalYTD}L YTD`,
                bg: "rgba(139,92,246,0.2)",
                color: "#B39DDB",
              },
              overdueCount > 0 && {
                label: `⚠ ${overdueCount} Overdue`,
                bg: "rgba(244,63,94,0.2)",
                color: "#FCA5A5",
              },
              dueTodayCount > 0 && {
                label: `📌 ${dueTodayCount} Due Today`,
                bg: "rgba(245,158,11,0.2)",
                color: "#FCD34D",
              },
            ]
              .filter(Boolean)
              .map((chip, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: "4px 12px",
                    borderRadius: 20,
                    background: chip.bg,
                    color: chip.color,
                  }}
                >
                  {chip.label}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        style={{
          background: T.white,
          borderBottom: `1px solid ${T.gray200}`,
          padding: "12px 20px",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 14,
                color: T.gray400,
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search name, contact, area, tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                height: 36,
                paddingLeft: 32,
                paddingRight: 12,
                border: `1px solid ${T.gray200}`,
                borderRadius: 8,
                fontSize: 13,
                color: T.text,
                background: T.gray50,
                outline: "none",
              }}
            />
          </div>

          {[
            {
              label: "Distributor",
              value: distFilter,
              set: setDistFilter,
              options: DISTRIBUTORS,
            },
            {
              label: "Stage",
              value: stageFilter,
              set: setStageFilter,
              options: ["All", ...STAGES.map((s) => s.id)],
            },
            {
              label: "Priority",
              value: priorityFilter,
              set: setPriorityFilter,
              options: ["All", "High", "Medium", "Low"],
            },
            {
              label: "Sort",
              value: sortBy,
              set: setSortBy,
              options: [
                ["name", "Name"],
                ["stage", "Stage"],
                ["ytd", "YTD"],
                ["potential", "Potential"],
                ["followup", "Follow-up"],
              ],
            },
          ].map((filter) => (
            <select
              key={filter.label}
              value={filter.value}
              onChange={(e) => filter.set(e.target.value)}
              style={{
                height: 36,
                padding: "0 10px",
                border: `1px solid ${T.gray200}`,
                borderRadius: 8,
                fontSize: 12,
                color: T.text,
                background: T.gray50,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {filter.options.map((opt) => {
                const val = Array.isArray(opt) ? opt[0] : opt;
                const lbl = Array.isArray(opt)
                  ? opt[1]
                  : filter.label === "Stage" && opt !== "All"
                    ? `${opt}. ${stageOf(opt).short}`
                    : opt;
                return (
                  <option key={val} value={val}>
                    {val === filter.options[0] && !Array.isArray(opt)
                      ? `${filter.label}: ${lbl}`
                      : lbl}
                  </option>
                );
              })}
            </select>
          ))}

          {(search ||
            distFilter !== "All" ||
            stageFilter !== "All" ||
            priorityFilter !== "All") && (
            <button
              onClick={() => {
                setSearch("");
                setDistFilter("All");
                setStageFilter("All");
                setPriorityFilter("All");
              }}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 8,
                border: `1px solid ${T.gray200}`,
                background: T.roseLight,
                color: T.rose,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 40px" }}
      >
        {viewMode === "split" ? (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <DistributorColumn
              title="Supple"
              color={T.teal}
              icon="🟢"
              custList={suppleCustomers}
            />
            <DistributorColumn
              title="Shree Jee Traders"
              color={T.blue}
              icon="🔵"
              custList={shreeJeeCustomers}
            />
            {otherCustomers.length > 0 && (
              <DistributorColumn
                title="Other / Direct"
                color={T.amber}
                icon="🟠"
                custList={otherCustomers}
              />
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 12,
            }}
          >
            {filtered.map((c) => (
              <CustomerCard
                key={c.id}
                customer={c}
                onClick={setSelectedCustomer}
              />
            ))}
            {filtered.length === 0 && (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "60px 20px",
                  color: T.gray400,
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: T.gray700 }}
                >
                  No customers found
                </div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Try adjusting your search or filters
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stage Summary Legend */}
        <div
          style={{
            marginTop: 24,
            background: T.white,
            borderRadius: 12,
            border: `1px solid ${T.gray200}`,
            padding: "16px 18px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.gray400,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            Pipeline Stage Distribution
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STAGES.map((s) => {
              const count = filtered.filter((c) => c.stage === s.id).length;
              return (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 20,
                    background: s.bg,
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setStageFilter(stageFilter === s.id ? "All" : s.id)
                  }
                >
                  <span
                    style={{ fontSize: 10, fontWeight: 900, color: s.color }}
                  >
                    {s.id}
                  </span>
                  <span
                    style={{ fontSize: 10, fontWeight: 600, color: s.color }}
                  >
                    {s.short}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: s.color,
                      background: "rgba(255,255,255,0.5)",
                      borderRadius: 10,
                      padding: "0 5px",
                    }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetail
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onEdit={(c) => {
            alert(`Edit: ${c.name} (connect to your edit modal here)`);
          }}
        />
      )}

      <style>{`
        * { box-sizing: border-box; }
        select, input { font-family: inherit; }
        input:focus { border-color: #00B8A2 !important; box-shadow: 0 0 0 3px rgba(0,184,162,0.15) !important; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #F0F4F8; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        @media (max-width: 767px) {
          .dist-split { flex-direction: column !important; }
        }
      `}</style>
    </div>
  );
}
