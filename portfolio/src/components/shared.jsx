// shared.jsx — constants, utilities, styles & base components shared across files

// ── API ───────────────────────────────────────────────────────────────────────
export const API_BASE = `${import.meta.env.VITE_API_URL}/stock`;
export const DISPATCH_API_BASE = `${import.meta.env.VITE_API_URL}/dispatch`;

// FIX: AuthContext "remember me" unchecked hone par token sirf
// sessionStorage me rakhta hai (localStorage.jsx login()). Pehle yahan
// sirf localStorage check hota tha, isliye us case me hamesha "Bearer null"
// jaata aur Stock/Dispatch API hamesha 401 deta.
export const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

// FIX: user-specific localStorage key ke liye token ke andar ki user id
// nikalne ka helper — LS_KEY ab isी se banegi taaki ek browser me do alag
// users login karein to unka data mix na ho.
export const getUserIdFromToken = () => {
  try {
    const t = getToken();
    if (!t) return null;
    const payload = JSON.parse(atob(t.split(".")[1]));
    return payload?.id || null;
  } catch {
    return null;
  }
};

export const apiHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ── Categories ────────────────────────────────────────────────────────────────
export const CATEGORIES = {
  ECOFAST: { label: "Ecofast Dye", color: "#0369a1", bg: "#e0f2fe" },
  ECOSOL: { label: "Ecosol Dye", color: "#7c3aed", bg: "#ede9fe" },
  ECOPLUS: { label: "Ecoplus Dye", color: "#7c3aed", bg: "#ede9fe" },
  SAFEAUX: { label: "Safeaux Aux", color: "#b45309", bg: "#fef3c7" },
  DENIMOZ: { label: "Denimoz", color: "#065f46", bg: "#d1fae5" },
  SULFAID: { label: "Sulfaid", color: "#b91c1c", bg: "#fee2e2" },
  OTHER: { label: "Other", color: "#4b5563", bg: "#f3f4f6" },
};

export const getCategory = (name) => {
  const u = (name || "").toUpperCase();
  for (const key of Object.keys(CATEGORIES)) if (u.includes(key)) return key;
  return "OTHER";
};

export const ALL_COLUMNS = [
  { id: "idx", label: "#", default: true },
  { id: "name", label: "Product Name", default: true },
  { id: "category", label: "Category", default: true },
  { id: "batch", label: "Batch", default: false },
  { id: "expiry", label: "Expiry", default: false },
  { id: "supplier", label: "Supplier", default: false },
  { id: "qty", label: "QT", default: true },
  { id: "minQty", label: "Min QT", default: true },
  { id: "status", label: "Status", default: true },
  { id: "reorderNote", label: "Reorder Note", default: false },
  { id: "actions", label: "Actions", default: true },
];
export const LOCKED_COLS = ["name", "qty", "actions"];

// ── Default product ───────────────────────────────────────────────────────────
export const EMPTY_PRODUCT = {
  name: "",
  qty: "",
  minQty: "",
  unit: "kg",
  category: "ECOFAST",
  batch: "",
  expiry: "",
  supplier: "",
  reorderNote: "",
};

export const genId = () => Date.now() + Math.floor(Math.random() * 9999);
export const nowStr = () =>
  new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
export const todayStr = () => new Date().toISOString().split("T")[0];
export const newItem = () => ({
  _id: genId(),
  productId: "",
  shade: "",
  qty: "",
});

/** Normalise old single-product dispatch entries into new items[] format */
export const normD = (d) => {
  if (d.items) return d;
  return {
    ...d,
    items: [
      {
        productId: d.productId,
        productName: d.productName,
        shade: d.shade || "",
        qtyDispatched: d.qtyDispatched,
        unit: d.unit,
        prevQty: d.prevQty,
        newQty: d.newQty,
      },
    ],
  };
};

export const detectColumns = (headerRow) => {
  const h = (headerRow || []).map((c) =>
    String(c || "")
      .trim()
      .toLowerCase(),
  );
  const find = (...kw) => h.findIndex((c) => kw.some((k) => c.includes(k)));
  const nameCol = find(
    "product name",
    "name",
    "item",
    "description",
    "product",
  );
  const qtyCol = find("qt", "qty", "quantity", "stock");
  const minCol = find("min qt", "min qty", "minimum", "reorder");
  const hasSN = /^s\.?\s*n/i.test(h[0]) || h[0] === "sn" || h[0] === "sr";
  return {
    nameCol: nameCol !== -1 ? nameCol : hasSN ? 1 : 0,
    qtyCol: qtyCol !== -1 ? qtyCol : hasSN ? 2 : 1,
    minQtyCol: minCol !== -1 ? minCol : hasSN ? 3 : 2,
  };
};

// ── Shared styles ─────────────────────────────────────────────────────────────
export const S = {
  wrap: {
    fontFamily: "'Inter',system-ui,sans-serif",
    minHeight: "100vh",
    background: "#F1F5F9",
    paddingBottom: 72,
  },
  header: {
    background: "#0F172A",
    padding: "0 20px",
    boxShadow: "0 2px 20px rgba(0,0,0,.3)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  hdrInner: {
    maxWidth: 1280,
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 58,
    flexWrap: "wrap",
    gap: 8,
  },
  main: { maxWidth: 1280, margin: "0 auto", padding: "20px 16px" },
  card: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 1px 6px rgba(0,0,0,.07)",
    overflow: "hidden",
  },
  hdrBtn: (bg, col) => ({
    padding: "6px 13px",
    borderRadius: 8,
    border: "none",
    background: bg,
    color: col,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 5,
  }),
  smBtn: (bg, col, border) => ({
    padding: "7px 13px",
    borderRadius: 8,
    border: border || "none",
    background: bg,
    color: col,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
  }),
  rowBtn: (bg, col, border) => ({
    padding: "5px 11px",
    borderRadius: 7,
    border,
    background: bg,
    color: col,
    cursor: "pointer",
    fontSize: 11,
    fontWeight: 600,
  }),
  input: (ac) => ({
    padding: "8px 11px",
    border: `1.5px solid ${ac || "#E5E7EB"}`,
    borderRadius: 8,
    fontSize: 13,
    outline: "none",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
    color: "#000",
  }),
  td: (al) => ({
    padding: "10px 12px",
    textAlign: al || "left",
    verticalAlign: "middle",
  }),
};

// ── FormField component ───────────────────────────────────────────────────────
export const FormField = ({ label, children }) => (
  <div style={{ marginBottom: 12 }}>
    <label
      style={{
        display: "block",
        fontSize: 11,
        fontWeight: 700,
        color: "#6B7280",
        textTransform: "uppercase",
        letterSpacing: ".05em",
        marginBottom: 4,
      }}
    >
      {label}
    </label>
    {children}
  </div>
);
