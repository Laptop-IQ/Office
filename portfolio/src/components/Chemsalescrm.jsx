import { useState, useMemo, useEffect } from "react";

// ─── Design Tokens ──────────────────────────────────────────────────────────
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
  slate: "#F0F4F8",
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
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const todayISO = () => new Date().toISOString().slice(0, 10);
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
  const diff = (new Date(d) - new Date()) / 86400000;
  return Math.ceil(diff);
};
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const pct = (a, b) => (b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0);

// ─── Stage Config ────────────────────────────────────────────────────────────
const STAGES = [
  { id: "A", label: "Promotion", color: T.blue, bg: T.blueLight },
  { id: "B", label: "Lab Trial", color: "#8B5CF6", bg: T.violetLight },
  { id: "C", label: "PR Enhanced", color: T.teal, bg: "#E0FAF7" },
  { id: "D", label: "Bulk Trial", color: T.amber, bg: T.amberLight },
  { id: "E", label: "Trial Report", color: "#F97316", bg: "#FFF7ED" },
  { id: "F", label: "Commercials", color: "#0EA5E9", bg: "#E0F2FE" },
  { id: "G", label: "Final Meet", color: T.rose, bg: T.roseLight },
  { id: "H", label: "Regularized", color: T.emerald, bg: T.emeraldLight },
];
const stageOf = (id) => STAGES.find((s) => s.id === id) || STAGES[0];

const PRIORITY = ["High", "Medium", "Low"];
const CATEGORIES = ["Dyes", "Auxiliaries", "Fixatives", "Surfactants", "Other"];
const VISIT_OUTCOMES = [
  "Positive",
  "Neutral",
  "Needs Follow-up",
  "Rejected",
  "Trial Initiated",
];

// ─── Seed Data ───────────────────────────────────────────────────────────────
const SEED_TARGETS = {
  dyesSales: { target: 120, achieved: 76 },
  auxSales: { target: 80, achieved: 52 },
  visits: { target: 25, achieved: 17 },
  newCustomers: { target: 8, achieved: 3 },
};

const SEED_CUSTOMERS = [
  {
    id: "c1",
    name: "Rajesh Fabrics",
    area: "Panipat",
    distributor: "Supple",
    stage: "D",
    potential: 18,
    existing: 6,
    abp: 120,
    ytd: 48,
  },
  {
    id: "c2",
    name: "Krishna Textiles",
    area: "Surat",
    distributor: "Shree Jee",
    stage: "H",
    potential: 30,
    existing: 22,
    abp: 200,
    ytd: 180,
  },
  {
    id: "c3",
    name: "Modern Dyeing Co",
    area: "Ludhiana",
    distributor: "Supple",
    stage: "B",
    potential: 25,
    existing: 0,
    abp: 60,
    ytd: 8,
  },
  {
    id: "c4",
    name: "Bharat Processors",
    area: "Bhiwandi",
    distributor: "Shree Jee",
    stage: "F",
    potential: 40,
    existing: 15,
    abp: 150,
    ytd: 92,
  },
  {
    id: "c5",
    name: "Anand Knit Works",
    area: "Tirupur",
    distributor: "Supple",
    stage: "C",
    potential: 20,
    existing: 4,
    abp: 80,
    ytd: 22,
  },
];

const SEED_VISITS = [
  {
    id: "v1",
    customerId: "c1",
    customerName: "Rajesh Fabrics",
    date: "2026-06-15",
    objective: "Bulk trial for ECOFAST NAVY 232",
    outcome: "Positive",
    stage: "D",
    notes: "Sample approved, waiting for bulk order",
    nextFollowUp: "2026-06-22",
  },
  {
    id: "v2",
    customerId: "c2",
    customerName: "Krishna Textiles",
    date: "2026-06-12",
    objective: "Quarterly review & new product intro",
    outcome: "Positive",
    stage: "H",
    notes: "Introduced SAFEAUX SILICON NXT",
    nextFollowUp: "2026-07-01",
  },
  {
    id: "v3",
    customerId: "c3",
    customerName: "Modern Dyeing Co",
    date: "2026-06-10",
    objective: "Lab trial for ECOFAST OLIVE series",
    outcome: "Trial Initiated",
    stage: "B",
    notes: "3 shades sent for trial",
    nextFollowUp: "2026-06-20",
  },
  {
    id: "v4",
    customerId: "c4",
    customerName: "Bharat Processors",
    date: "2026-06-08",
    objective: "Price negotiation for Q3",
    outcome: "Needs Follow-up",
    stage: "F",
    notes: "Price concern raised, sent revised proposal",
    nextFollowUp: "2026-06-18",
  },
];

const SEED_TRIALS = [
  {
    id: "t1",
    customerId: "c3",
    customerName: "Modern Dyeing Co",
    product: "ECOFAST OLIVE 5G-149",
    category: "Dyes",
    startDate: "2026-06-10",
    expectedClose: "2026-06-25",
    status: "In Progress",
    shade: "5G-149",
    remarks: "Lab trial ongoing",
    potential: 8,
  },
  {
    id: "t2",
    customerId: "c1",
    customerName: "Rajesh Fabrics",
    product: "ECOFAST NAVY 232",
    category: "Dyes",
    startDate: "2026-06-01",
    expectedClose: "2026-06-20",
    status: "Report Sent",
    shade: "Navy 232",
    remarks: "Positive result, bulk trial next",
    potential: 12,
  },
  {
    id: "t3",
    customerId: "c5",
    customerName: "Anand Knit Works",
    product: "SAFEAUX PREP LF",
    category: "Auxiliaries",
    startDate: "2026-06-05",
    expectedClose: "2026-06-30",
    status: "In Progress",
    shade: "—",
    remarks: "Pretreatment study in progress",
    potential: 6,
  },
];

const SEED_ACTIVITIES = [
  {
    id: "a1",
    date: "2026-06-18",
    type: "Call",
    customer: "Bharat Processors",
    note: "Follow up on revised price proposal",
    done: false,
    priority: "High",
  },
  {
    id: "a2",
    date: "2026-06-18",
    type: "Visit",
    customer: "Anand Knit Works",
    note: "Check trial progress for SAFEAUX",
    done: false,
    priority: "Medium",
  },
  {
    id: "a3",
    date: "2026-06-20",
    type: "Sample",
    customer: "Modern Dyeing Co",
    note: "Send ECOFAST FIR GREEN 42 samples",
    done: false,
    priority: "Medium",
  },
  {
    id: "a4",
    date: "2026-06-22",
    type: "Visit",
    customer: "Rajesh Fabrics",
    note: "Collect bulk trial report",
    done: false,
    priority: "High",
  },
  {
    id: "a5",
    date: "2026-06-25",
    type: "Report",
    customer: "Krishna Textiles",
    note: "Submit Q2 activity report",
    done: true,
    priority: "Low",
  },
];

// ─── Reusable UI ─────────────────────────────────────────────────────────────
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

const Card = ({ children, style, onClick, hover }) => (
  <div
    onClick={onClick}
    style={{
      background: T.white,
      borderRadius: 14,
      border: `1px solid ${T.gray200}`,
      padding: "16px",
      transition: hover ? "transform 0.15s, box-shadow 0.15s" : "none",
      cursor: onClick ? "pointer" : "default",
      ...style,
    }}
    onMouseEnter={
      hover
        ? (e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.09)";
          }
        : undefined
    }
    onMouseLeave={
      hover
        ? (e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }
        : undefined
    }
  >
    {children}
  </div>
);

const StatCard = ({ icon, label, value, sub, color, progress }) => (
  <Card hover style={{ borderTop: `3px solid ${color}` }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 10,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: T.gray400,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 5,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: T.text,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: T.gray400, marginTop: 4 }}>
            {sub}
          </div>
        )}
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: color + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 20,
        }}
      >
        {icon}
      </div>
    </div>
    {progress !== undefined && (
      <>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 10, color: T.gray400 }}>Progress</span>
          <span style={{ fontSize: 10, fontWeight: 700, color }}>
            {progress}%
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
              width: `${Math.min(progress, 100)}%`,
              background: color,
              borderRadius: 3,
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </>
    )}
  </Card>
);

const Input = ({ label, required, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && (
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: T.gray500,
          marginBottom: 5,
          letterSpacing: "0.03em",
        }}
      >
        {label}
        {required && <span style={{ color: T.rose }}> *</span>}
      </label>
    )}
    {props.type === "select" ? (
      <select
        {...{ ...props, type: undefined }}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 9,
          border: `1.5px solid ${T.gray200}`,
          fontSize: 13,
          color: T.text,
          background: T.white,
          outline: "none",
          cursor: "pointer",
        }}
      >
        {props.children}
      </select>
    ) : props.type === "textarea" ? (
      <textarea
        {...{ ...props, type: undefined }}
        rows={3}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 9,
          border: `1.5px solid ${T.gray200}`,
          fontSize: 13,
          color: T.text,
          background: T.white,
          outline: "none",
          resize: "vertical",
          fontFamily: "inherit",
        }}
      />
    ) : (
      <input
        {...props}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: 9,
          border: `1.5px solid ${T.gray200}`,
          fontSize: 13,
          color: T.text,
          background: T.white,
          outline: "none",
        }}
      />
    )}
  </div>
);

const Btn = ({
  children,
  variant = "primary",
  small,
  onClick,
  disabled,
  style: sx,
}) => {
  const variants = {
    primary: {
      bg: T.teal,
      color: T.navy,
      shadow: "0 4px 14px rgba(0,212,184,0.3)",
    },
    danger: { bg: T.roseLight, color: T.rose, shadow: "none" },
    ghost: { bg: T.gray100, color: T.gray700, shadow: "none" },
    amber: { bg: T.amberLight, color: T.amberDark, shadow: "none" },
    navy: {
      bg: T.navy,
      color: "#fff",
      shadow: "0 4px 14px rgba(14,26,43,0.25)",
    },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "6px 14px" : "9px 20px",
        borderRadius: 9,
        border: "none",
        background: disabled ? T.gray200 : v.bg,
        color: disabled ? T.gray400 : v.color,
        fontSize: small ? 11 : 13,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: v.shadow,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        transition: "opacity 0.15s",
        opacity: disabled ? 0.6 : 1,
        ...sx,
      }}
    >
      {children}
    </button>
  );
};

const Modal = ({ title, onClose, children, width = 500 }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(14,26,43,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 400,
      padding: 16,
      backdropFilter: "blur(4px)",
    }}
  >
    <div
      style={{
        background: T.white,
        borderRadius: 18,
        width: "100%",
        maxWidth: width,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 22px 14px",
          borderBottom: `1px solid ${T.gray100}`,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 800, color: T.navy }}>
          {title}
        </span>
        <button
          onClick={onClose}
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            border: `1px solid ${T.gray200}`,
            background: T.gray50,
            cursor: "pointer",
            fontSize: 16,
            color: T.gray400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: "18px 22px 22px", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  </div>
);

const StagePill = ({ stage }) => {
  const s = stageOf(stage);
  return <Badge label={`${stage}. ${s.label}`} color={s.color} bg={s.bg} />;
};

// ─── Pipeline Chain Visual ───────────────────────────────────────────────────
const PipelineChain = ({ customers }) => {
  const counts = {};
  STAGES.forEach((s) => {
    counts[s.id] = 0;
  });
  customers.forEach((c) => {
    if (counts[c.stage] !== undefined) counts[c.stage]++;
  });
  return (
    <Card
      style={{ padding: "18px 20px", marginBottom: 16, overflow: "hidden" }}
    >
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
        Customer Pipeline — Reaction Chain
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          overflowX: "auto",
          gap: 0,
          paddingBottom: 4,
        }}
      >
        {STAGES.map((s, i) => (
          <div
            key={s.id}
            style={{ display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: counts[s.id] > 0 ? s.color : T.gray100,
                  border: `2px solid ${counts[s.id] > 0 ? s.color : T.gray200}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 800,
                  color: counts[s.id] > 0 ? T.white : T.gray300,
                  boxShadow:
                    counts[s.id] > 0 ? `0 0 0 4px ${s.color}22` : "none",
                  transition: "all 0.3s",
                }}
              >
                {counts[s.id] > 0 ? counts[s.id] : s.id}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: counts[s.id] > 0 ? s.color : T.gray300,
                  marginTop: 5,
                  textAlign: "center",
                  maxWidth: 52,
                }}
              >
                {s.label}
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <div
                style={{
                  width: 24,
                  height: 2,
                  background: `linear-gradient(90deg, ${counts[s.id] > 0 ? s.color : T.gray200}, ${counts[STAGES[i + 1].id] > 0 ? STAGES[i + 1].color : T.gray200})`,
                  flexShrink: 0,
                  marginBottom: 18,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─── Tabs Config ─────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", icon: "⚡", label: "Dashboard" },
  { id: "activities", icon: "📋", label: "Activities" },
  { id: "visits", icon: "🗺", label: "Visit Log" },
  { id: "trials", icon: "🧪", label: "Trials" },
  { id: "customers", icon: "🏭", label: "Customers" },
  { id: "targets", icon: "🎯", label: "Targets" },
];

// ─── Toast ───────────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) =>
  !msg ? null : (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 999,
        background: type === "error" ? T.rose : T.teal,
        color: type === "error" ? T.white : T.navy,
        padding: "10px 22px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 700,
        boxShadow: "0 8px 28px rgba(0,0,0,0.2)",
        whiteSpace: "nowrap",
      }}
    >
      {type === "error" ? "✕" : "✓"} {msg}
    </div>
  );

// ════════════════════════════════════════════════════════════════════
//   MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function ChemSalesCRM() {
  const [tab, setTab] = useState("dashboard");
  const [customers, setCustomers] = useState(SEED_CUSTOMERS);
  const [visits, setVisits] = useState(SEED_VISITS);
  const [trials, setTrials] = useState(SEED_TRIALS);
  const [activities, setActivities] = useState(SEED_ACTIVITIES);
  const [targets, setTargets] = useState(SEED_TARGETS);
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [modal, setModal] = useState(null); // null | { type: 'visit'|'trial'|'activity'|'customer'|'target', data?, mode }
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  // ─── Derived ───────────────────────────────────────────────────────
  const upcomingFollowUps = useMemo(
    () =>
      [...visits]
        .filter(
          (v) =>
            v.nextFollowUp &&
            daysFromNow(v.nextFollowUp) <= 7 &&
            daysFromNow(v.nextFollowUp) >= 0,
        )
        .sort((a, b) => new Date(a.nextFollowUp) - new Date(b.nextFollowUp)),
    [visits],
  );

  const pendingActivities = activities.filter((a) => !a.done);
  const overdueActivities = pendingActivities.filter(
    (a) => daysFromNow(a.date) < 0,
  );
  const activeTrials = trials.filter(
    (t) => t.status !== "Closed" && t.status !== "Converted",
  );
  const totalPotential = customers.reduce((s, c) => s + (c.potential || 0), 0);

  // ─── CRUD ──────────────────────────────────────────────────────────
  const saveVisit = (data) => {
    if (data.id) {
      setVisits((p) => p.map((v) => (v.id === data.id ? data : v)));
      showToast("Visit updated!");
    } else {
      setVisits((p) => [{ ...data, id: genId() }, ...p]);
      showToast("Visit logged!");
    }
    setModal(null);
  };

  const saveTrial = (data) => {
    if (data.id) {
      setTrials((p) => p.map((t) => (t.id === data.id ? data : t)));
      showToast("Trial updated!");
    } else {
      setTrials((p) => [{ ...data, id: genId() }, ...p]);
      showToast("Trial added!");
    }
    setModal(null);
  };

  const saveActivity = (data) => {
    if (data.id) {
      setActivities((p) => p.map((a) => (a.id === data.id ? data : a)));
      showToast("Activity updated!");
    } else {
      setActivities((p) => [{ ...data, id: genId() }, ...p]);
      showToast("Activity added!");
    }
    setModal(null);
  };

  const saveCustomer = (data) => {
    if (data.id) {
      setCustomers((p) => p.map((c) => (c.id === data.id ? data : c)));
      showToast("Customer updated!");
    } else {
      setCustomers((p) => [...p, { ...data, id: genId() }]);
      showToast("Customer added!");
    }
    setModal(null);
  };

  const toggleActivity = (id) => {
    setActivities((p) =>
      p.map((a) => (a.id === id ? { ...a, done: !a.done } : a)),
    );
  };

  const deleteVisit = (id) => {
    setVisits((p) => p.filter((v) => v.id !== id));
    showToast("Deleted", "error");
  };
  const deleteTrial = (id) => {
    setTrials((p) => p.filter((t) => t.id !== id));
    showToast("Deleted", "error");
  };
  const deleteActivity = (id) => {
    setActivities((p) => p.filter((a) => a.id !== id));
    showToast("Deleted", "error");
  };
  const deleteCustomer = (id) => {
    setCustomers((p) => p.filter((c) => c.id !== id));
    showToast("Deleted", "error");
  };

  // ═══════════════════════════════════════════════════════════════
  //   MODALS
  // ═══════════════════════════════════════════════════════════════

  const VisitModal = () => {
    const initial = modal?.data || {
      date: todayISO(),
      customerId: "",
      customerName: "",
      objective: "",
      outcome: "",
      stage: "A",
      notes: "",
      nextFollowUp: "",
    };
    const [form, setForm] = useState(initial);
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    return (
      <Modal
        title={form.id ? "✏️ Edit Visit" : "🗺 Log Visit"}
        onClose={() => setModal(null)}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          }}
        >
          <Input
            label="Date"
            required
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Customer <span style={{ color: T.rose }}>*</span>
            </label>
            <select
              value={form.customerId}
              onChange={(e) => {
                const c = customers.find((x) => x.id === e.target.value);
                set("customerId", e.target.value);
                set("customerName", c?.name || "");
              }}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Objective / Purpose"
          required
          type="text"
          placeholder="e.g. Introduce ECOFAST OLIVE range"
          value={form.objective}
          onChange={(e) => set("objective", e.target.value)}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Outcome
            </label>
            <select
              value={form.outcome}
              onChange={(e) => set("outcome", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              <option value="">Select outcome</option>
              {VISIT_OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Stage Update
            </label>
            <select
              value={form.stage}
              onChange={(e) => set("stage", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Notes / Discussion"
          type="textarea"
          placeholder="What was discussed? Any important points?"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
        <Input
          label="Next Follow-up Date"
          type="date"
          value={form.nextFollowUp}
          onChange={(e) => set("nextFollowUp", e.target.value)}
        />
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 6,
          }}
        >
          <Btn variant="ghost" onClick={() => setModal(null)}>
            Cancel
          </Btn>
          <Btn
            onClick={() => saveVisit(form)}
            disabled={!form.date || !form.customerId || !form.objective}
          >
            💾 Save Visit
          </Btn>
        </div>
      </Modal>
    );
  };

  const TrialModal = () => {
    const initial = modal?.data || {
      customerId: "",
      customerName: "",
      product: "",
      category: "Dyes",
      startDate: todayISO(),
      expectedClose: "",
      shade: "",
      status: "In Progress",
      remarks: "",
      potential: "",
    };
    const [form, setForm] = useState(initial);
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    return (
      <Modal
        title={form.id ? "✏️ Edit Trial" : "🧪 New Trial"}
        onClose={() => setModal(null)}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          }}
        >
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Customer <span style={{ color: T.rose }}>*</span>
            </label>
            <select
              value={form.customerId}
              onChange={(e) => {
                const c = customers.find((x) => x.id === e.target.value);
                set("customerId", e.target.value);
                set("customerName", c?.name || "");
              }}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Product / Chemical Name"
          required
          type="text"
          placeholder="e.g. ECOFAST OLIVE 5G-149"
          value={form.product}
          onChange={(e) => set("product", e.target.value)}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "0 14px",
          }}
        >
          <Input
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
          <Input
            label="Expected Close"
            type="date"
            value={form.expectedClose}
            onChange={(e) => set("expectedClose", e.target.value)}
          />
          <Input
            label="Potential (₹L)"
            type="number"
            placeholder="0"
            value={form.potential}
            onChange={(e) => set("potential", e.target.value)}
          />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          }}
        >
          <Input
            label="Shade / Reference"
            type="text"
            placeholder="e.g. Navy 232"
            value={form.shade}
            onChange={(e) => set("shade", e.target.value)}
          />
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              {[
                "In Progress",
                "Report Sent",
                "Approved",
                "Rejected",
                "Converted",
                "Closed",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Remarks"
          type="textarea"
          placeholder="Trial observations, next steps..."
          value={form.remarks}
          onChange={(e) => set("remarks", e.target.value)}
        />
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 6,
          }}
        >
          <Btn variant="ghost" onClick={() => setModal(null)}>
            Cancel
          </Btn>
          <Btn
            onClick={() => saveTrial(form)}
            disabled={!form.customerId || !form.product}
          >
            💾 Save Trial
          </Btn>
        </div>
      </Modal>
    );
  };

  const ActivityModal = () => {
    const initial = modal?.data || {
      date: todayISO(),
      type: "Visit",
      customer: "",
      note: "",
      priority: "Medium",
      done: false,
    };
    const [form, setForm] = useState(initial);
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    return (
      <Modal
        title={form.id ? "✏️ Edit Activity" : "📋 Add Activity"}
        onClose={() => setModal(null)}
        width={420}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          }}
        >
          <Input
            label="Date"
            required
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Type
            </label>
            <select
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              {[
                "Visit",
                "Call",
                "Email",
                "Sample",
                "Report",
                "Meeting",
                "Demo",
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          }}
        >
          <Input
            label="Customer"
            type="text"
            placeholder="Customer name"
            value={form.customer}
            onChange={(e) => set("customer", e.target.value)}
          />
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => set("priority", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              {PRIORITY.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Input
          label="Notes / Task"
          type="textarea"
          placeholder="What needs to be done?"
          value={form.note}
          onChange={(e) => set("note", e.target.value)}
        />
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 6,
          }}
        >
          <Btn variant="ghost" onClick={() => setModal(null)}>
            Cancel
          </Btn>
          <Btn onClick={() => saveActivity(form)} disabled={!form.date}>
            💾 Save
          </Btn>
        </div>
      </Modal>
    );
  };

  const CustomerModal = () => {
    const initial = modal?.data || {
      name: "",
      area: "",
      distributor: "Supple",
      stage: "A",
      potential: "",
      existing: "",
      abp: "",
      ytd: "",
    };
    const [form, setForm] = useState(initial);
    const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
    return (
      <Modal
        title={form.id ? "✏️ Edit Customer" : "🏭 New Customer"}
        onClose={() => setModal(null)}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          }}
        >
          <div style={{ gridColumn: "1/-1" }}>
            <Input
              label="Customer Name"
              required
              type="text"
              placeholder="Full company name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <Input
            label="Area / City"
            type="text"
            placeholder="e.g. Panipat"
            value={form.area}
            onChange={(e) => set("area", e.target.value)}
          />
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Distributor
            </label>
            <select
              value={form.distributor}
              onChange={(e) => set("distributor", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              <option>Supple</option>
              <option>Shree Jee Traders</option>
              <option>Direct</option>
            </select>
          </div>
          <div style={{ marginBottom: 14, gridColumn: "1/-1" }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 600,
                color: T.gray500,
                marginBottom: 5,
              }}
            >
              Pipeline Stage
            </label>
            <select
              value={form.stage}
              onChange={(e) => set("stage", e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: T.gray400,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 12,
          }}
        >
          💰 Numbers (₹ Lakhs)
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0 14px",
          }}
        >
          <Input
            label="Potential /mth"
            type="number"
            placeholder="0"
            value={form.potential}
            onChange={(e) => set("potential", e.target.value)}
          />
          <Input
            label="Existing Business /mth"
            type="number"
            placeholder="0"
            value={form.existing}
            onChange={(e) => set("existing", e.target.value)}
          />
          <Input
            label="ABP AM26"
            type="number"
            placeholder="0"
            value={form.abp}
            onChange={(e) => set("abp", e.target.value)}
          />
          <Input
            label="YTD Sale (till prev mth)"
            type="number"
            placeholder="0"
            value={form.ytd}
            onChange={(e) => set("ytd", e.target.value)}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 6,
          }}
        >
          <Btn variant="ghost" onClick={() => setModal(null)}>
            Cancel
          </Btn>
          <Btn onClick={() => saveCustomer(form)} disabled={!form.name}>
            💾 Save Customer
          </Btn>
        </div>
      </Modal>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //   TAB VIEWS
  // ═══════════════════════════════════════════════════════════════

  const DashboardView = () => {
    const actTypeCounts = {};
    activities
      .filter((a) => !a.done)
      .forEach((a) => {
        actTypeCounts[a.type] = (actTypeCounts[a.type] || 0) + 1;
      });
    return (
      <div>
        {/* KPI row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <StatCard
            icon="👥"
            label="Customers"
            value={customers.length}
            sub={`₹${totalPotential}L total potential`}
            color={T.blue}
            progress={pct(
              customers.filter((c) => c.stage === "H").length,
              customers.length,
            )}
          />
          <StatCard
            icon="🧪"
            label="Active Trials"
            value={activeTrials.length}
            sub={`₹${trials.reduce((s, t) => s + Number(t.potential || 0), 0)}L in pipeline`}
            color={T.violet}
          />
          <StatCard
            icon="🗺"
            label="Visits This Month"
            value={visits.filter((v) => v.date?.startsWith("2026-06")).length}
            sub="June 2026"
            color={T.teal}
            progress={pct(targets.visits.achieved, targets.visits.target)}
          />
          <StatCard
            icon="⚠️"
            label="Follow-ups Due"
            value={upcomingFollowUps.length}
            sub={`${overdueActivities.length} overdue tasks`}
            color={T.amber}
          />
        </div>

        <PipelineChain customers={customers} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 14,
          }}
        >
          {/* Upcoming follow-ups */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
                📅 Follow-ups Due (7 days)
              </span>
              <Badge
                label={`${upcomingFollowUps.length}`}
                color={T.amberDark}
                bg={T.amberLight}
              />
            </div>
            {upcomingFollowUps.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                  color: T.gray400,
                  fontSize: 13,
                }}
              >
                ✅ No follow-ups due
              </div>
            ) : (
              upcomingFollowUps.map((v) => {
                const days = daysFromNow(v.nextFollowUp);
                return (
                  <div
                    key={v.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: `1px solid ${T.gray100}`,
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: days === 0 ? T.roseLight : T.amberLight,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        color: days === 0 ? T.rose : T.amberDark,
                        flexShrink: 0,
                        textAlign: "center",
                        lineHeight: 1.2,
                      }}
                    >
                      {days === 0 ? "TODAY" : `${days}d`}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{ fontSize: 13, fontWeight: 700, color: T.navy }}
                      >
                        {v.customerName}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: T.gray400,
                          marginTop: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {v.objective}
                      </div>
                    </div>
                    <StagePill stage={v.stage} />
                  </div>
                );
              })
            )}
          </Card>

          {/* Pending activities */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
                📋 Today's Activities
              </span>
              <Btn small onClick={() => setModal({ type: "activity" })}>
                ＋ Add
              </Btn>
            </div>
            {pendingActivities.slice(0, 5).map((a) => {
              const overdue = daysFromNow(a.date) < 0;
              const today = daysFromNow(a.date) === 0;
              const typeColors = {
                Visit: [T.teal, "#E0FAF7"],
                Call: [T.blue, T.blueLight],
                Sample: [T.violet, T.violetLight],
                Report: [T.amber, T.amberLight],
                Email: [T.emerald, T.emeraldLight],
                Meeting: [T.rose, T.roseLight],
                Demo: ["#F97316", "#FFF7ED"],
              };
              const [tc, tb] = typeColors[a.type] || [T.gray500, T.gray100];
              return (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 0",
                    borderBottom: `1px solid ${T.gray100}`,
                  }}
                >
                  <div
                    onClick={() => toggleActivity(a.id)}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      border: `2px solid ${T.teal}`,
                      background: a.done ? T.teal : "transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {a.done && (
                      <span
                        style={{
                          color: T.white,
                          fontSize: 10,
                          fontWeight: 900,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <Badge label={a.type} color={tc} bg={tb} small />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: T.navy,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.customer}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: overdue
                          ? T.rose
                          : today
                            ? T.amberDark
                            : T.gray400,
                      }}
                    >
                      {overdue
                        ? "⚠ Overdue"
                        : today
                          ? "Today"
                          : fmtDate(a.date)}
                    </div>
                  </div>
                  <Badge
                    label={a.priority}
                    color={
                      a.priority === "High"
                        ? T.rose
                        : a.priority === "Medium"
                          ? T.amber
                          : T.gray400
                    }
                    bg={
                      a.priority === "High"
                        ? T.roseLight
                        : a.priority === "Medium"
                          ? T.amberLight
                          : T.gray100
                    }
                    small
                  />
                </div>
              );
            })}
            {pendingActivities.length > 5 && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: 10,
                  fontSize: 12,
                  color: T.teal,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => setTab("activities")}
              >
                View all {pendingActivities.length} →
              </div>
            )}
          </Card>

          {/* Trials overview */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
                🧪 Active Trials
              </span>
              <Btn small onClick={() => setModal({ type: "trial" })}>
                ＋ New
              </Btn>
            </div>
            {activeTrials.slice(0, 4).map((t) => {
              const days = daysFromNow(t.expectedClose);
              const statusColor =
                t.status === "Approved"
                  ? T.emerald
                  : t.status === "Report Sent"
                    ? T.teal
                    : t.status === "Rejected"
                      ? T.rose
                      : T.amber;
              return (
                <div
                  key={t.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: `1px solid ${T.gray100}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 8,
                      marginBottom: 5,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 12, fontWeight: 700, color: T.navy }}
                      >
                        {t.product}
                      </div>
                      <div style={{ fontSize: 11, color: T.gray400 }}>
                        {t.customerName} · {t.category}
                      </div>
                    </div>
                    <Badge
                      label={t.status}
                      color={statusColor}
                      bg={statusColor + "20"}
                      small
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color:
                          days < 0
                            ? T.rose
                            : days <= 3
                              ? T.amberDark
                              : T.gray400,
                      }}
                    >
                      {days < 0
                        ? `⚠ ${Math.abs(days)}d overdue`
                        : days === 0
                          ? "Due today"
                          : `Due in ${days}d`}
                    </span>
                    <span
                      style={{ fontSize: 11, fontWeight: 700, color: T.violet }}
                    >
                      ₹{t.potential || 0}L
                    </span>
                  </div>
                </div>
              );
            })}
            {activeTrials.length > 4 && (
              <div
                style={{
                  textAlign: "center",
                  marginTop: 10,
                  fontSize: 12,
                  color: T.teal,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                onClick={() => setTab("trials")}
              >
                View all {activeTrials.length} →
              </div>
            )}
          </Card>

          {/* Monthly targets summary */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: T.navy }}>
                🎯 Monthly Targets
              </span>
              <button
                onClick={() => setTab("targets")}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.teal,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                View all →
              </button>
            </div>
            {[
              {
                label: "Dyes Sales",
                val: targets.dyesSales.achieved,
                target: targets.dyesSales.target,
                unit: "₹L",
                color: T.blue,
              },
              {
                label: "Aux Sales",
                val: targets.auxSales.achieved,
                target: targets.auxSales.target,
                unit: "₹L",
                color: T.violet,
              },
              {
                label: "Customer Visits",
                val: targets.visits.achieved,
                target: targets.visits.target,
                unit: "",
                color: T.teal,
              },
              {
                label: "New Customers",
                val: targets.newCustomers.achieved,
                target: targets.newCustomers.target,
                unit: "",
                color: T.amber,
              },
            ].map((item) => {
              const p = pct(item.val, item.target);
              return (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <span style={{ fontSize: 12, color: T.gray600 }}>
                      {item.label}
                    </span>
                    <span
                      style={{ fontSize: 12, fontWeight: 700, color: T.navy }}
                    >
                      {item.unit}
                      {item.val} / {item.unit}
                      {item.target}{" "}
                      <span style={{ fontWeight: 400, color: item.color }}>
                        ({p}%)
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: T.gray100,
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${p}%`,
                        background: item.color,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    );
  };

  const ActivitiesView = () => {
    const [filter, setFilter] = useState("all");
    const shown = activities
      .filter((a) => {
        if (filter === "pending") return !a.done;
        if (filter === "done") return a.done;
        if (filter === "overdue") return !a.done && daysFromNow(a.date) < 0;
        if (filter === "today") return !a.done && daysFromNow(a.date) === 0;
        return true;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const typeColors = {
      Visit: [T.teal, "#E0FAF7"],
      Call: [T.blue, T.blueLight],
      Sample: [T.violet, T.violetLight],
      Report: [T.amber, T.amberLight],
      Email: [T.emerald, T.emeraldLight],
      Meeting: [T.rose, T.roseLight],
      Demo: ["#F97316", "#FFF7ED"],
    };
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              ["all", "All"],
              ["pending", "Pending"],
              ["overdue", "Overdue ⚠"],
              ["today", "Today"],
              ["done", "Done ✓"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: `1.5px solid ${filter === id ? T.teal : T.gray200}`,
                  background: filter === id ? T.teal : T.white,
                  color: filter === id ? T.navy : T.gray500,
                  fontWeight: filter === id ? 700 : 400,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <Btn onClick={() => setModal({ type: "activity" })}>
            ＋ Add Activity
          </Btn>
        </div>
        {shown.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 40, color: T.gray400 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>No
            activities
          </Card>
        ) : (
          shown.map((a) => {
            const overdue = !a.done && daysFromNow(a.date) < 0;
            const today = !a.done && daysFromNow(a.date) === 0;
            const [tc, tb] = typeColors[a.type] || [T.gray500, T.gray100];
            return (
              <Card
                key={a.id}
                hover
                style={{
                  marginBottom: 10,
                  borderLeft: `4px solid ${overdue ? T.rose : a.done ? T.gray200 : today ? T.amber : T.teal}`,
                  opacity: a.done ? 0.65 : 1,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <div
                    onClick={() => toggleActivity(a.id)}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `2px solid ${a.done ? T.emerald : T.gray300}`,
                      background: a.done ? T.emerald : "transparent",
                      cursor: "pointer",
                      flexShrink: 0,
                      marginTop: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {a.done && (
                      <span
                        style={{
                          color: T.white,
                          fontSize: 11,
                          fontWeight: 900,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 5,
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <Badge label={a.type} color={tc} bg={tb} small />
                        <Badge
                          label={a.priority}
                          color={
                            a.priority === "High"
                              ? T.rose
                              : a.priority === "Medium"
                                ? T.amberDark
                                : T.gray400
                          }
                          bg={
                            a.priority === "High"
                              ? T.roseLight
                              : a.priority === "Medium"
                                ? T.amberLight
                                : T.gray100
                          }
                          small
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: overdue
                            ? T.rose
                            : today
                              ? T.amberDark
                              : T.gray400,
                          fontWeight: overdue || today ? 700 : 400,
                        }}
                      >
                        {overdue
                          ? `⚠ ${Math.abs(daysFromNow(a.date))}d overdue`
                          : today
                            ? "📌 Today"
                            : fmtDate(a.date)}
                      </span>
                    </div>
                    {a.customer && (
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: T.navy,
                          marginBottom: 3,
                        }}
                      >
                        {a.customer}
                      </div>
                    )}
                    {a.note && (
                      <div
                        style={{
                          fontSize: 12,
                          color: T.gray500,
                          lineHeight: 1.5,
                        }}
                      >
                        {a.note}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <Btn
                      small
                      variant="ghost"
                      onClick={() => setModal({ type: "activity", data: a })}
                    >
                      ✏️
                    </Btn>
                    <Btn
                      small
                      variant="danger"
                      onClick={() => deleteActivity(a.id)}
                    >
                      🗑
                    </Btn>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    );
  };

  const VisitsView = () => {
    const [search, setSearch] = useState("");
    const shown = visits.filter(
      (v) =>
        !search ||
        [v.customerName, v.objective, v.notes, v.outcome].some((f) =>
          (f || "").toLowerCase().includes(search.toLowerCase()),
        ),
    );
    const outcomeColor = {
      Positive: [T.emerald, T.emeraldLight],
      "Needs Follow-up": [T.amber, T.amberLight],
      Rejected: [T.rose, T.roseLight],
      "Trial Initiated": [T.violet, T.violetLight],
      Neutral: [T.gray400, T.gray100],
    };
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <input
            type="text"
            placeholder="🔍 Search visits…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: 9,
              border: `1.5px solid ${T.gray200}`,
              fontSize: 13,
              color: T.text,
              background: T.white,
              outline: "none",
              flex: 1,
              minWidth: 200,
            }}
          />
          <Btn onClick={() => setModal({ type: "visit" })}>＋ Log Visit</Btn>
        </div>
        {shown.map((v) => {
          const [oc, ob] = outcomeColor[v.outcome] || [T.gray400, T.gray100];
          const followDays = v.nextFollowUp
            ? daysFromNow(v.nextFollowUp)
            : null;
          return (
            <Card
              key={v.id}
              hover
              style={{
                marginBottom: 12,
                borderLeft: `4px solid ${stageOf(v.stage).color}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.navy }}>
                    {v.customerName}
                  </div>
                  <div style={{ fontSize: 11, color: T.gray400, marginTop: 2 }}>
                    📅 {fmtDate(v.date)}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {v.outcome && <Badge label={v.outcome} color={oc} bg={ob} />}
                  <StagePill stage={v.stage} />
                </div>
              </div>
              {v.objective && (
                <div
                  style={{
                    background: T.gray50,
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 8,
                    borderLeft: `3px solid ${T.teal}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: T.gray400,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 3,
                    }}
                  >
                    Objective
                  </div>
                  <div style={{ fontSize: 12, color: T.gray700 }}>
                    {v.objective}
                  </div>
                </div>
              )}
              {v.notes && (
                <div
                  style={{
                    background: T.blueLight,
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 8,
                    borderLeft: `3px solid ${T.blue}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#1D4ED8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 3,
                    }}
                  >
                    Notes
                  </div>
                  <div style={{ fontSize: 12, color: "#1e3a5f" }}>
                    {v.notes}
                  </div>
                </div>
              )}
              {v.nextFollowUp && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      background:
                        followDays !== null && followDays <= 2
                          ? T.amberLight
                          : T.gray100,
                      color:
                        followDays !== null && followDays <= 2
                          ? T.amberDark
                          : T.gray500,
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontWeight: 600,
                    }}
                  >
                    🔁 Follow-up: {fmtDate(v.nextFollowUp)}
                    {followDays !== null && followDays <= 2
                      ? ` (${followDays === 0 ? "Today!" : `${followDays}d`})`
                      : ""}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn
                      small
                      variant="ghost"
                      onClick={() => setModal({ type: "visit", data: v })}
                    >
                      ✏️ Edit
                    </Btn>
                    <Btn
                      small
                      variant="danger"
                      onClick={() => deleteVisit(v.id)}
                    >
                      🗑
                    </Btn>
                  </div>
                </div>
              )}
              {!v.nextFollowUp && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 6,
                  }}
                >
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => setModal({ type: "visit", data: v })}
                  >
                    ✏️ Edit
                  </Btn>
                  <Btn small variant="danger" onClick={() => deleteVisit(v.id)}>
                    🗑
                  </Btn>
                </div>
              )}
            </Card>
          );
        })}
        {shown.length === 0 && (
          <Card style={{ textAlign: "center", padding: 40, color: T.gray400 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>No visits
            found
          </Card>
        )}
      </div>
    );
  };

  const TrialsView = () => {
    const [filter, setFilter] = useState("all");
    const shown = trials.filter((t) => filter === "all" || t.status === filter);
    const statusColor = {
      "In Progress": [T.amber, T.amberLight],
      "Report Sent": [T.teal, "#E0FAF7"],
      Approved: [T.emerald, T.emeraldLight],
      Rejected: [T.rose, T.roseLight],
      Converted: [T.blue, T.blueLight],
      Closed: [T.gray400, T.gray100],
    };
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", "In Progress", "Report Sent", "Approved", "Converted"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1.5px solid ${filter === s ? T.teal : T.gray200}`,
                    background: filter === s ? T.teal : T.white,
                    color: filter === s ? T.navy : T.gray500,
                    fontWeight: filter === s ? 700 : 400,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  {s === "all" ? "All" : s}
                </button>
              ),
            )}
          </div>
          <Btn onClick={() => setModal({ type: "trial" })}>＋ New Trial</Btn>
        </div>
        {/* Summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)",
            gap: 10,
            marginBottom: 14,
          }}
        >
          {[
            { label: "Total Trials", val: trials.length, color: T.navy },
            {
              label: "In Progress",
              val: trials.filter((t) => t.status === "In Progress").length,
              color: T.amber,
            },
            {
              label: "Approved",
              val: trials.filter((t) => t.status === "Approved").length,
              color: T.emerald,
            },
            {
              label: "Pipeline Value",
              val: `₹${trials.reduce((s, t) => s + Number(t.potential || 0), 0)}L`,
              color: T.violet,
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: T.white,
                borderRadius: 12,
                padding: "12px 14px",
                border: `1px solid ${T.gray200}`,
                borderTop: `3px solid ${s.color}`,
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>
                {s.val}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: T.gray400,
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
        {shown.map((t) => {
          const [sc, sb] = statusColor[t.status] || [T.gray400, T.gray100];
          const days = t.expectedClose ? daysFromNow(t.expectedClose) : null;
          return (
            <Card
              key={t.id}
              hover
              style={{ marginBottom: 10, borderLeft: `4px solid ${sc}` }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: T.navy }}>
                    {t.product}
                  </div>
                  <div style={{ fontSize: 11, color: T.gray400, marginTop: 2 }}>
                    {t.customerName} · {t.category}{" "}
                    {t.shade && t.shade !== "—" ? `· ${t.shade}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Badge label={t.status} color={sc} bg={sb} />
                  <span
                    style={{ fontSize: 12, fontWeight: 700, color: T.violet }}
                  >
                    ₹{t.potential || 0}L
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    fontSize: 11,
                    color: T.gray400,
                  }}
                >
                  <span>Started: {fmtDate(t.startDate)}</span>
                  {t.expectedClose && (
                    <span
                      style={{
                        color:
                          days !== null && days < 0
                            ? T.rose
                            : days !== null && days <= 3
                              ? T.amberDark
                              : T.gray400,
                        fontWeight: days !== null && days <= 3 ? 700 : 400,
                      }}
                    >
                      Close: {fmtDate(t.expectedClose)}
                      {days !== null && days < 0 ? " ⚠" : ""}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => setModal({ type: "trial", data: t })}
                  >
                    ✏️
                  </Btn>
                  <Btn small variant="danger" onClick={() => deleteTrial(t.id)}>
                    🗑
                  </Btn>
                </div>
              </div>
              {t.remarks && (
                <div
                  style={{
                    fontSize: 12,
                    color: T.gray500,
                    marginTop: 8,
                    background: T.gray50,
                    borderRadius: 7,
                    padding: "6px 10px",
                  }}
                >
                  💬 {t.remarks}
                </div>
              )}
            </Card>
          );
        })}
        {shown.length === 0 && (
          <Card style={{ textAlign: "center", padding: 40, color: T.gray400 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🧪</div>No trials
            found
          </Card>
        )}
      </div>
    );
  };

  const CustomersView = () => {
    const [search, setSearch] = useState("");
    const [stageFilter, setStageFilter] = useState("all");
    const shown = customers.filter((c) => {
      const ms =
        !search ||
        [c.name, c.area, c.distributor].some((f) =>
          (f || "").toLowerCase().includes(search.toLowerCase()),
        );
      const mst = stageFilter === "all" || c.stage === stageFilter;
      return ms && mst;
    });
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="🔍 Search customers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "9px 14px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
                flex: 1,
                minWidth: 160,
              }}
            />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 9,
                border: `1.5px solid ${T.gray200}`,
                fontSize: 13,
                color: T.text,
                background: T.white,
                outline: "none",
              }}
            >
              <option value="all">All Stages</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.label}
                </option>
              ))}
            </select>
          </div>
          <Btn onClick={() => setModal({ type: "customer" })}>
            ＋ Add Customer
          </Btn>
        </div>
        {shown.map((c) => {
          const s = stageOf(c.stage);
          const ytdPct = pct(Number(c.ytd || 0), Number(c.abp || 0));
          const custVisits = visits.filter((v) => v.customerId === c.id);
          const lastVisit = custVisits.sort(
            (a, b) => new Date(b.date) - new Date(a.date),
          )[0];
          return (
            <Card
              key={c.id}
              hover
              style={{ marginBottom: 12, borderLeft: `4px solid ${s.color}` }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 10,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.navy }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: 11, color: T.gray400, marginTop: 2 }}>
                    {c.area} · {c.distributor}
                  </div>
                </div>
                <StagePill stage={c.stage} />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                {[
                  ["Potential /mth", `₹${c.potential || 0}L`, T.blue],
                  ["Existing /mth", `₹${c.existing || 0}L`, T.emerald],
                  ["ABP", `₹${c.abp || 0}L`, T.violet],
                  ["YTD Sale", `₹${c.ytd || 0}L`, T.teal],
                ].map(([label, val, col]) => (
                  <div
                    key={label}
                    style={{
                      background: T.gray50,
                      borderRadius: 8,
                      padding: "8px 10px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: T.gray400,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: 3,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: col }}>
                      {val}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ flex: 1, minWidth: 120 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 10, color: T.gray400 }}>
                      YTD vs ABP
                    </span>
                    <span
                      style={{
                        fontSize: 10,
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
                    style={{
                      height: 5,
                      background: T.gray100,
                      borderRadius: 3,
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
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  {lastVisit && (
                    <div
                      style={{ fontSize: 10, color: T.gray400, marginTop: 5 }}
                    >
                      Last visit: {fmtDate(lastVisit.date)}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn
                    small
                    variant="ghost"
                    onClick={() =>
                      setModal({
                        type: "visit",
                        data: {
                          customerId: c.id,
                          customerName: c.name,
                          date: todayISO(),
                          objective: "",
                          outcome: "",
                          stage: c.stage,
                          notes: "",
                          nextFollowUp: "",
                        },
                      })
                    }
                  >
                    🗺 Visit
                  </Btn>
                  <Btn
                    small
                    variant="ghost"
                    onClick={() => setModal({ type: "customer", data: c })}
                  >
                    ✏️
                  </Btn>
                  <Btn
                    small
                    variant="danger"
                    onClick={() => deleteCustomer(c.id)}
                  >
                    🗑
                  </Btn>
                </div>
              </div>
            </Card>
          );
        })}
        {shown.length === 0 && (
          <Card style={{ textAlign: "center", padding: 40, color: T.gray400 }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏭</div>No customers
          </Card>
        )}
      </div>
    );
  };

  const TargetsView = () => {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ ...targets });
    const setF = (key, subkey, val) =>
      setForm((p) => ({ ...p, [key]: { ...p[key], [subkey]: Number(val) } }));
    const items = [
      {
        key: "dyesSales",
        label: "Dyes Sales",
        unit: "₹L",
        icon: "🎨",
        color: T.blue,
      },
      {
        key: "auxSales",
        label: "Auxiliaries Sales",
        unit: "₹L",
        icon: "⚗️",
        color: T.violet,
      },
      {
        key: "visits",
        label: "Customer Visits",
        unit: "visits",
        icon: "🗺",
        color: T.teal,
      },
      {
        key: "newCustomers",
        label: "New Customers",
        unit: "customers",
        icon: "🏭",
        color: T.amber,
      },
    ];
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3
            style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.navy }}
          >
            🎯 Monthly Targets — June 2026
          </h3>
          {editing ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn
                variant="ghost"
                onClick={() => {
                  setForm({ ...targets });
                  setEditing(false);
                }}
              >
                Cancel
              </Btn>
              <Btn
                onClick={() => {
                  setTargets({ ...form });
                  setEditing(false);
                  showToast("Targets saved!");
                }}
              >
                💾 Save
              </Btn>
            </div>
          ) : (
            <Btn variant="ghost" onClick={() => setEditing(true)}>
              ✏️ Edit Targets
            </Btn>
          )}
        </div>
        {items.map((item) => {
          const data = form[item.key];
          const p = pct(data.achieved, data.target);
          const remaining = Math.max(0, data.target - data.achieved);
          return (
            <Card key={item.key} style={{ marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 14,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: item.color + "18",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 14, fontWeight: 800, color: T.navy }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: 11, color: T.gray400 }}>
                      Remaining: {item.unit === "₹L" ? "₹" : ""}
                      {remaining}
                      {item.unit !== "₹L" ? ` ${item.unit}` : "L"}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 28, fontWeight: 900, color: item.color }}
                  >
                    {p}%
                  </div>
                  <div style={{ fontSize: 11, color: T.gray400 }}>
                    {item.unit === "₹L" ? "₹" : ""}
                    {data.achieved} of {item.unit === "₹L" ? "₹" : ""}
                    {data.target}
                    {item.unit !== "₹L" ? ` ${item.unit}` : "L"}
                  </div>
                </div>
              </div>
              <div
                style={{
                  height: 10,
                  background: T.gray100,
                  borderRadius: 5,
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${p}%`,
                    background: `linear-gradient(90deg, ${item.color}, ${item.color}cc)`,
                    borderRadius: 5,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              {editing && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                    marginTop: 10,
                    paddingTop: 12,
                    borderTop: `1px solid ${T.gray100}`,
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        color: T.gray500,
                        marginBottom: 5,
                      }}
                    >
                      Target ({item.unit})
                    </label>
                    <input
                      type="number"
                      value={data.target}
                      onChange={(e) => setF(item.key, "target", e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 9,
                        border: `1.5px solid ${item.color}`,
                        fontSize: 13,
                        color: T.text,
                        background: T.white,
                        outline: "none",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 11,
                        fontWeight: 600,
                        color: T.gray500,
                        marginBottom: 5,
                      }}
                    >
                      Achieved ({item.unit})
                    </label>
                    <input
                      type="number"
                      value={data.achieved}
                      onChange={(e) =>
                        setF(item.key, "achieved", e.target.value)
                      }
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 9,
                        border: `1.5px solid ${T.gray200}`,
                        fontSize: 13,
                        color: T.text,
                        background: T.white,
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {/* Monthly summary */}
        <Card style={{ background: T.navy, border: "none" }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 14,
            }}
          >
            Monthly Summary
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
              gap: 14,
            }}
          >
            {items.map((item) => {
              const p = pct(
                targets[item.key].achieved,
                targets[item.key].target,
              );
              return (
                <div key={item.key} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      position: "relative",
                      width: 64,
                      height: 64,
                      margin: "0 auto 8px",
                    }}
                  >
                    <svg
                      width="64"
                      height="64"
                      style={{ transform: "rotate(-90deg)" }}
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="5"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="5"
                        strokeDasharray={`${(p / 100) * 163.4} 163.4`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        color: T.white,
                      }}
                    >
                      {p}%
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.6)",
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  //   RENDER
  // ═══════════════════════════════════════════════════════════════
  const tabContent = {
    dashboard: <DashboardView />,
    activities: <ActivitiesView />,
    visits: <VisitsView />,
    trials: <TrialsView />,
    customers: <CustomersView />,
    targets: <TargetsView />,
  };
  const currentTab = TABS.find((t) => t.id === tab);

  const alertCount =
    overdueActivities.length +
    upcomingFollowUps.filter((v) => daysFromNow(v.nextFollowUp) === 0).length;

  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        background: T.slate,
        minHeight: "100vh",
        color: T.text,
      }}
    >
      <Toast msg={toast.msg} type={toast.type} />
      {modal?.type === "visit" && <VisitModal />}
      {modal?.type === "trial" && <TrialModal />}
      {modal?.type === "activity" && <ActivityModal />}
      {modal?.type === "customer" && <CustomerModal />}

      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* ── Sidebar (desktop only) ── */}
        {!isMobile && (
          <aside
            style={{
              width: 220,
              background: T.navy,
              display: "flex",
              flexDirection: "column",
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              overflowY: "auto",
              zIndex: 100,
            }}
          >
            {/* Logo */}
            <div
              style={{
                padding: "22px 20px 18px",
                borderBottom: `1px solid ${T.navyBorder}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${T.teal}, #0284C7)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  ⚗️
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: T.white,
                      letterSpacing: "-0.3px",
                    }}
                  >
                    ChemCRM
                  </div>
                  <div
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}
                  >
                    Sales Intelligence
                  </div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ padding: "12px 10px", flex: 1 }}>
              {TABS.map((t) => {
                const isActive = tab === t.id;
                const badge =
                  t.id === "activities"
                    ? overdueActivities.length
                    : t.id === "visits"
                      ? upcomingFollowUps.filter(
                          (v) => daysFromNow(v.nextFollowUp) <= 1,
                        ).length
                      : 0;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 9,
                      border: "none",
                      cursor: "pointer",
                      marginBottom: 2,
                      fontSize: 13,
                      fontWeight: isActive ? 700 : 400,
                      color: isActive ? T.teal : "rgba(255,255,255,0.55)",
                      background: isActive ? T.tealGlow : "transparent",
                      transition: "all 0.15s",
                      textAlign: "left",
                    }}
                  >
                    <span
                      style={{ display: "flex", alignItems: "center", gap: 9 }}
                    >
                      <span style={{ fontSize: 16 }}>{t.icon}</span>
                      {t.label}
                    </span>
                    {badge > 0 && (
                      <span
                        style={{
                          background: T.rose,
                          color: T.white,
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: 10,
                          minWidth: 18,
                          textAlign: "center",
                        }}
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            {/* Quick actions */}
            <div
              style={{
                padding: "12px 10px",
                borderTop: `1px solid ${T.navyBorder}`,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.2)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  padding: "0 12px",
                  marginBottom: 8,
                }}
              >
                Quick Add
              </div>
              {[
                {
                  icon: "🗺",
                  label: "Log Visit",
                  action: () => setModal({ type: "visit" }),
                },
                {
                  icon: "🧪",
                  label: "New Trial",
                  action: () => setModal({ type: "trial" }),
                },
                {
                  icon: "📋",
                  label: "Add Activity",
                  action: () => setModal({ type: "activity" }),
                },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={a.action}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    marginBottom: 2,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.45)",
                    background: "transparent",
                    textAlign: "left",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(0,212,184,0.08)";
                    e.currentTarget.style.color = T.teal;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                  }}
                >
                  <span style={{ fontSize: 14 }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
            {/* Footer */}
            <div
              style={{
                padding: "12px 20px",
                borderTop: `1px solid ${T.navyBorder}`,
              }}
            >
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </aside>
        )}

        {/* ── Main Content ── */}
        <main
          style={{
            flex: 1,
            marginLeft: isMobile ? 0 : 220,
            paddingBottom: isMobile ? 80 : 30,
          }}
        >
          {/* Top bar */}
          <div
            style={{
              background: T.white,
              borderBottom: `1px solid ${T.gray200}`,
              padding: isMobile ? "14px 16px" : "16px 28px",
              position: "sticky",
              top: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: isMobile ? 15 : 17,
                  fontWeight: 800,
                  color: T.navy,
                }}
              >
                {currentTab?.icon} {currentTab?.label}
              </h2>
              <div style={{ fontSize: 10, color: T.gray400, marginTop: 2 }}>
                Chemical Sales Management · June 2026
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {alertCount > 0 && (
                <div
                  style={{
                    background: T.roseLight,
                    color: T.rose,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "5px 12px",
                    borderRadius: 20,
                    border: `1px solid ${T.rose}30`,
                  }}
                >
                  ⚠ {alertCount} Alert{alertCount > 1 ? "s" : ""}
                </div>
              )}
              {!isMobile && (
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn small onClick={() => setModal({ type: "visit" })}>
                    🗺 Visit
                  </Btn>
                  <Btn
                    small
                    variant="navy"
                    onClick={() => setModal({ type: "trial" })}
                  >
                    🧪 Trial
                  </Btn>
                </div>
              )}
            </div>
          </div>

          {/* Page content */}
          <div style={{ padding: isMobile ? "14px 14px" : "20px 28px" }}>
            {tabContent[tab] || <DashboardView />}
          </div>
        </main>
      </div>

      {/* ── Mobile bottom tab bar ── */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: T.white,
            borderTop: `1px solid ${T.gray200}`,
            display: "flex",
            zIndex: 100,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {TABS.map((t) => {
            const isActive = tab === t.id;
            const badge = t.id === "activities" ? overdueActivities.length : 0;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  padding: "8px 4px 6px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  position: "relative",
                  color: isActive ? T.teal : T.gray400,
                }}
              >
                {badge > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: "18%",
                      background: T.rose,
                      color: T.white,
                      fontSize: 8,
                      fontWeight: 800,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {badge}
                  </span>
                )}
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: isActive ? 700 : 400,
                    letterSpacing: "0.02em",
                  }}
                >
                  {t.label}
                </span>
                {isActive && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "20%",
                      right: "20%",
                      height: 2,
                      background: T.teal,
                      borderRadius: 2,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #F0F4F8; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
        input, select, textarea { color: #111827 !important; font-family: inherit; }
        input:focus, select:focus, textarea:focus { border-color: #00D4B8 !important; box-shadow: 0 0 0 3px rgba(0,212,184,0.15) !important; }
        button:hover { opacity: 0.88; }
        @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
      `}</style>
    </div>
  );
}
