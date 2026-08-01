// shared.jsx — constants, utilities, styles & base components shared across files

// ── API ───────────────────────────────────────────────────────────────────────
export const API_BASE         = `${import.meta.env.VITE_API_URL}/stock`;
export const DISPATCH_API_BASE = `${import.meta.env.VITE_API_URL}/dispatch`;

export const getToken   = () => localStorage.getItem("token");
export const apiHeaders = () => ({
  "Content-Type": "application/json",
  Authorization:  `Bearer ${getToken()}`,
});

// ── Categories ────────────────────────────────────────────────────────────────
export const CATEGORIES = {
  ECOFAST: { label: "Ecofast Dye", color: "#0369a1", bg: "#e0f2fe" },
  ECOSOL:  { label: "Ecosol Dye",  color: "#7c3aed", bg: "#ede9fe" },
  ECOPLUS: { label: "Ecoplus Dye", color: "#7c3aed", bg: "#ede9fe" },
  SAFEAUX: { label: "Safeaux Aux", color: "#b45309", bg: "#fef3c7" },
  DENIMOZ: { label: "Denimoz",     color: "#065f46", bg: "#d1fae5" },
  SULFAID: { label: "Sulfaid",     color: "#b91c1c", bg: "#fee2e2" },
  OTHER:   { label: "Other",       color: "#4b5563", bg: "#f3f4f6" },
};

export const getCategory = (name) => {
  const u = (name || "").toUpperCase();
  for (const key of Object.keys(CATEGORIES)) if (u.includes(key)) return key;
  return "OTHER";
};

// ── Tabs ──────────────────────────────────────────────────────────────────────
export const TABS = [
  { id: "sample",    label: "Sample",     icon: "🧪" },
  { id: "delhi",     label: "Delhi",      icon: "🏙" },
  { id: "shadecard", label: "Shade Card", icon: "🎨" },
  { id: "dispatch",  label: "Dispatch",   icon: "📤" },
];
export const STOCK_TABS = TABS.filter((t) => t.id !== "dispatch");

export const ALL_COLUMNS = [
  { id: "idx",         label: "#",            default: true  },
  { id: "name",        label: "Product Name", default: true  },
  { id: "category",    label: "Category",     default: true  },
  { id: "batch",       label: "Batch",        default: false },
  { id: "expiry",      label: "Expiry",       default: false },
  { id: "supplier",    label: "Supplier",     default: false },
  { id: "qty",         label: "QT",           default: true  },
  { id: "minQty",      label: "Min QT",       default: true  },
  { id: "status",      label: "Status",       default: true  },
  { id: "reorderNote", label: "Reorder Note", default: false },
  { id: "actions",     label: "Actions",      default: true  },
];
export const LOCKED_COLS = ["name", "qty", "actions"];

// ── Default product ───────────────────────────────────────────────────────────
export const EMPTY_PRODUCT = {
  name: "", qty: "", minQty: "", unit: "kg", category: "ECOFAST",
  batch: "", expiry: "", supplier: "", reorderNote: "",
};

// ── Seed data ─────────────────────────────────────────────────────────────────
export const SEED = {
  delhi: [
    { id: 1,  name: "ECOFAST BLUE B",                qty: 4,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-001", expiry: "2026-12-01", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 2,  name: "ECOFAST NAVY BLUE 232",          qty: 5,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-002", expiry: "2026-11-15", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 3,  name: "ECOFAST DARK OLIVE 44",          qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-003", expiry: "2027-01-10", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 4,  name: "ECOFAST MEHENDI OLIVE 240",      qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-004", expiry: "2027-03-20", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 5,  name: "ECOFAST MAST OLIVE 404",         qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-005", expiry: "2026-09-30", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 6,  name: "ECOFAST OLIVE 5G-149",           qty: 1,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-006", expiry: "2026-08-15", supplier: "ColorChem Ltd", reorderNote: "Urgent reorder" },
    { id: 7,  name: "ECOFAST MILITTARY OILIVE 50",    qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-007", expiry: "2027-02-28", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 8,  name: "ECOFAST OLIVE GREEN 5G-147",     qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-008", expiry: "2027-04-10", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 9,  name: "ECOFAST TEA OLIVE 5G-148",       qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-009", expiry: "2027-05-20", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 10, name: "ECOFAST FIR GREEN 42",           qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-010", expiry: "2027-06-01", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 11, name: "ECOFAST JUST BLACK 100",         qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-011", expiry: "2027-07-15", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 12, name: "ECOFAST LIGHT GREY 5G-150",      qty: 1,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-012", expiry: "2026-10-31", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 13, name: "ECOFAST ENGINE GREY S 152",      qty: 5,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-013", expiry: "2027-08-20", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 14, name: "ECOFAST BLUE GREY 280",          qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-014", expiry: "2027-09-10", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 15, name: "ECOFAST DARK GREY 5G-180",       qty: 4,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-015", expiry: "2027-10-05", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 16, name: "ECOFAST COLD GREY 54",           qty: 7,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-016", expiry: "2027-11-01", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 17, name: "ECOFAST CAMEL BROWN 37",         qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-017", expiry: "2027-12-15", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 18, name: "ECOFAST COFFEE BROWN 35",        qty: 0,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "",        expiry: "",           supplier: "ColorChem Ltd", reorderNote: "Out of stock - urgent" },
    { id: 19, name: "ECOFAST SLATE BROWN 34",         qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-019", expiry: "2027-02-20", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 20, name: "ECOFAST OLIVE BROWN V 92",       qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-020", expiry: "2027-03-10", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 21, name: "ECOFAST POLICE KHAKI 12",        qty: 1,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-021", expiry: "2026-11-20", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 22, name: "ECOFAST KHAKI 5G-115",           qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-022", expiry: "2027-04-25", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 23, name: "ECOFAST GOLD KHAKI 5G-116",      qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-023", expiry: "2027-05-30", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 24, name: "ECOFAST YELLOW 5G 09",           qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-024", expiry: "2027-06-15", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 25, name: "ECOFAST RUST V 79",              qty: 1,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-025", expiry: "2026-09-15", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 26, name: "ECOFAST PRUNE B 20",             qty: 4,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-026", expiry: "2027-07-20", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 27, name: "ECOFAST RED BROWN 5G-112",       qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-027", expiry: "2027-08-10", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 28, name: "ECOFAST BROWN 390",              qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-028", expiry: "2027-09-05", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 29, name: "ECOFAST SKY BLUE 5G-140",        qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-029", expiry: "2027-10-20", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 30, name: "ECOFAST DULL BLUE 5G-145",       qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-030", expiry: "2027-11-15", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 31, name: "ECOFAST ANAND BLUE V87",         qty: 2,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-031", expiry: "2027-12-01", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 32, name: "SAFEAUX OPTOFAST IS",            qty: 1000, minQty: 100, unit: "ml",  category: "SAFEAUX", batch: "SA-001", expiry: "2027-06-30", supplier: "AuxiPro India", reorderNote: "Bulk order 5L" },
    { id: 33, name: "SAFEAUX SILICON NXT",            qty: 2,    minQty: 5,   unit: "L",   category: "SAFEAUX", batch: "SA-002", expiry: "2026-12-15", supplier: "AuxiPro India", reorderNote: "" },
    { id: 34, name: "DENIMOZ DYEFIX S2D",             qty: 2,    minQty: 5,   unit: "kg",  category: "DENIMOZ", batch: "DZ-001", expiry: "2027-01-20", supplier: "DeniChem Co",   reorderNote: "" },
    { id: 35, name: "SULFAID ANTIOXIDANT IY",         qty: 500,  minQty: 100, unit: "g",   category: "SULFAID", batch: "SF-001", expiry: "2027-03-10", supplier: "SulfaChem",     reorderNote: "" },
    { id: 36, name: "DENIMOZ SEQUADET FBN",           qty: 0,    minQty: 5,   unit: "L",   category: "DENIMOZ", batch: "",        expiry: "",           supplier: "DeniChem Co",   reorderNote: "Out of stock" },
    { id: 37, name: "SAFEAUX PREP LF",                qty: 0,    minQty: 5,   unit: "L",   category: "SAFEAUX", batch: "",        expiry: "",           supplier: "AuxiPro India", reorderNote: "Out of stock" },
    { id: 38, name: "DENIMOZ EXECUTOR IAS",           qty: 0,    minQty: 5,   unit: "kg",  category: "DENIMOZ", batch: "",        expiry: "",           supplier: "DeniChem Co",   reorderNote: "" },
    { id: 39, name: "SULFAID OXYDANT ION",            qty: 0,    minQty: 5,   unit: "g",   category: "SULFAID", batch: "",        expiry: "",           supplier: "SulfaChem",     reorderNote: "" },
    { id: 40, name: "NFDF",                           qty: 500,  minQty: 100, unit: "ml",  category: "OTHER",   batch: "NF-001", expiry: "2027-05-15", supplier: "",              reorderNote: "" },
    { id: 41, name: "LEVEL DYE VRD",                  qty: 1000, minQty: 100, unit: "g",   category: "OTHER",   batch: "LD-001", expiry: "2027-07-01", supplier: "",              reorderNote: "" },
    { id: 42, name: "ECOSOL ADMIRAL NAVY EEB",        qty: 500,  minQty: 100, unit: "g",   category: "ECOSOL",  batch: "ES-001", expiry: "2027-08-20", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 43, name: "ECOSOL BLUE BLACK Q3B",          qty: 500,  minQty: 100, unit: "g",   category: "ECOSOL",  batch: "ES-002", expiry: "2027-09-10", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 44, name: "ECOSOL COLD GREY IR",            qty: 500,  minQty: 100, unit: "g",   category: "ECOSOL",  batch: "ES-003", expiry: "2027-10-05", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 45, name: "ECOFAST TOFFEE BROWN 32",        qty: 3,    minQty: 2,   unit: "kg",  category: "ECOFAST", batch: "BC-045", expiry: "2027-11-20", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 46, name: "SAFEAUX SILICON NXT (B)",        qty: 0,    minQty: 5,   unit: "L",   category: "SAFEAUX", batch: "",        expiry: "",           supplier: "AuxiPro India", reorderNote: "" },
    { id: 47, name: "SAFEAUX OPTOFAST IS (B)",        qty: 0,    minQty: 100, unit: "ml",  category: "SAFEAUX", batch: "",        expiry: "",           supplier: "AuxiPro India", reorderNote: "" },
    { id: 48, name: "DENIMOZ DYEFIX S2D (B)",         qty: 0,    minQty: 5,   unit: "kg",  category: "DENIMOZ", batch: "",        expiry: "",           supplier: "DeniChem Co",   reorderNote: "" },
  ],
  sample: [
    { id: 101, name: "ECOFAST BLUE B",      qty: 60, minQty: 20, unit: "kg", category: "ECOFAST", batch: "DL-001", expiry: "2027-01-15", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 102, name: "ECOFAST DARK OLIVE 44", qty: 15, minQty: 25, unit: "kg", category: "ECOFAST", batch: "DL-002", expiry: "2026-11-30", supplier: "ColorChem Ltd", reorderNote: "Reorder soon" },
    { id: 103, name: "SAFEAUX PREP LF",     qty: 8,  minQty: 10, unit: "L",  category: "SAFEAUX", batch: "DL-003", expiry: "2027-03-20", supplier: "AuxiPro India", reorderNote: "" },
  ],
  faridabad: [
    { id: 201, name: "ECOFAST JUST BLACK 100", qty: 90, minQty: 30, unit: "kg", category: "ECOFAST", batch: "FB-001", expiry: "2027-02-10", supplier: "ColorChem Ltd", reorderNote: "" },
    { id: 202, name: "SAFEAUX PREP LF",        qty: 5,  minQty: 20, unit: "L",  category: "SAFEAUX", batch: "",        expiry: "",           supplier: "AuxiPro India", reorderNote: "Out of stock" },
    { id: 203, name: "SULFAID ANTIOXIDANT IY", qty: 200, minQty: 100, unit: "g", category: "SULFAID", batch: "FB-003", expiry: "2027-04-15", supplier: "SulfaChem",    reorderNote: "" },
  ],
  shadecard: [
    { id: 301, name: "Shade 101 - Sky Blue",      qty: 55, minQty: 30, unit: "pcs", category: "OTHER", batch: "SC-001", expiry: "", supplier: "", reorderNote: "" },
    { id: 302, name: "Shade 102 - Rose Red",       qty: 12, minQty: 25, unit: "pcs", category: "OTHER", batch: "SC-002", expiry: "", supplier: "", reorderNote: "" },
    { id: 303, name: "Shade 103 - Forest Green",   qty: 80, minQty: 20, unit: "pcs", category: "OTHER", batch: "SC-003", expiry: "", supplier: "", reorderNote: "" },
    { id: 304, name: "Shade 104 - Sunset Orange",  qty: 8,  minQty: 30, unit: "pcs", category: "OTHER", batch: "SC-004", expiry: "", supplier: "", reorderNote: "" },
    { id: 305, name: "Shade 105 - Midnight Black", qty: 44, minQty: 15, unit: "pcs", category: "OTHER", batch: "SC-005", expiry: "", supplier: "", reorderNote: "" },
  ],
};

// ── Utility functions ─────────────────────────────────────────────────────────
export const genId    = () => Date.now() + Math.floor(Math.random() * 9999);
export const nowStr   = () => new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
export const todayStr = () => new Date().toISOString().split("T")[0];
export const newItem  = () => ({ _id: genId(), productId: "", shade: "", qty: "" });

/** Normalise old single-product dispatch entries into new items[] format */
export const normD = (d) => {
  if (d.items) return d;
  return {
    ...d,
    items: [{
      productId:     d.productId,
      productName:   d.productName,
      shade:         d.shade || "",
      qtyDispatched: d.qtyDispatched,
      unit:          d.unit,
      prevQty:       d.prevQty,
      newQty:        d.newQty,
    }],
  };
};

export const detectColumns = (headerRow) => {
  const h       = (headerRow || []).map((c) => String(c || "").trim().toLowerCase());
  const find    = (...kw) => h.findIndex((c) => kw.some((k) => c.includes(k)));
  const nameCol = find("product name", "name", "item", "description", "product");
  const qtyCol  = find("qt", "qty", "quantity", "stock");
  const minCol  = find("min qt", "min qty", "minimum", "reorder");
  const hasSN   = /^s\.?\s*n/i.test(h[0]) || h[0] === "sn" || h[0] === "sr";
  return {
    nameCol:   nameCol !== -1 ? nameCol : hasSN ? 1 : 0,
    qtyCol:    qtyCol  !== -1 ? qtyCol  : hasSN ? 2 : 1,
    minQtyCol: minCol  !== -1 ? minCol  : hasSN ? 3 : 2,
  };
};

// ── Shared styles ─────────────────────────────────────────────────────────────
export const S = {
  wrap:     { fontFamily: "'Inter',system-ui,sans-serif", minHeight: "100vh", background: "#F1F5F9", paddingBottom: 72 },
  header:   { background: "#0F172A", padding: "0 20px", boxShadow: "0 2px 20px rgba(0,0,0,.3)", position: "sticky", top: 0, zIndex: 100 },
  hdrInner: { maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, flexWrap: "wrap", gap: 8 },
  main:     { maxWidth: 1280, margin: "0 auto", padding: "20px 16px" },
  card:     { background: "#fff", borderRadius: 14, boxShadow: "0 1px 6px rgba(0,0,0,.07)", overflow: "hidden" },
  hdrBtn:  (bg, col)         => ({ padding: "6px 13px", borderRadius: 8, border: "none", background: bg, color: col, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }),
  smBtn:   (bg, col, border) => ({ padding: "7px 13px", borderRadius: 8, border: border || "none", background: bg, color: col, cursor: "pointer", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }),
  rowBtn:  (bg, col, border) => ({ padding: "5px 11px", borderRadius: 7, border, background: bg, color: col, cursor: "pointer", fontSize: 11, fontWeight: 600 }),
  input:   (ac)              => ({ padding: "8px 11px", border: `1.5px solid ${ac || "#E5E7EB"}`, borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box", color: "#000" }),
  td:      (al)              => ({ padding: "10px 12px", textAlign: al || "left", verticalAlign: "middle" }),
};

// ── FormField component ───────────────────────────────────────────────────────
export const FormField = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>
      {label}
    </label>
    {children}
  </div>
);
