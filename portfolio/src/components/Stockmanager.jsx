import { useState, useCallback, useRef, useEffect } from "react";
import * as XLSX from "xlsx";

/* ─── Storage ─────────────────────────────────────────────────────────────── */
const STORAGE_KEY = "chem_stock_v3";
const load = () => {
  try {
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : null;
  } catch {
    return null;
  }
};
const save = (d) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {}
};

/* ─── Chemical category detection ─────────────────────────────────────────── */
const CATEGORIES = {
  ECOFAST: { label: "Ecofast Dye", color: "#0EA5E9", bg: "#E0F2FE" },
  ECOSOL: { label: "Ecosol Dye", color: "#8B5CF6", bg: "#EDE9FE" },
  ECOPLUS: { label: "Ecoplus Dye", color: "#8B5CF6", bg: "#EDE9FE" },
  SAFEAUX: { label: "Safeaux Aux", color: "#F59E0B", bg: "#FEF3C7" },
  DENIMOZ: { label: "Denimoz", color: "#10B981", bg: "#D1FAE5" },
  SULFAID: { label: "Sulfaid", color: "#EF4444", bg: "#FEE2E2" },
  OTHER: { label: "Other", color: "#6B7280", bg: "#F3F4F6" },
};
const getCategory = (name) => {
  const u = (name || "").toUpperCase();
  for (const key of Object.keys(CATEGORIES)) if (u.includes(key)) return key;
  return "OTHER";
};

/* ─── Tabs ─────────────────────────────────────────────────────────────────── */
const TABS = [
  { id: "sample", label: "Sample", icon: "🧪" },
  { id: "delhi", label: "Delhi", icon: "🏙" },
  { id: "faridabad", label: "Faridabad", icon: "🏭" },
  { id: "shadecard", label: "Shade Card", icon: "🎨" },
];

/* ─── All columns definition ──────────────────────────────────────────────── */
const ALL_COLUMNS = [
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

/* ─── Seed data ────────────────────────────────────────────────────────────── */
const SEED = {
  delhi: [
    {
      id: 1,
      name: "ECOFAST BLUE B",
      qty: 4,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-001",
      expiry: "2026-12-01",
      supplier: "ColorChem Ltd",
      safetyNote: "Avoid skin contact",
      reorderNote: "Min 5kg order",
    },
    {
      id: 2,
      name: "ECOFAST NAVY BLUE 232",
      qty: 5,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-002",
      expiry: "2026-11-15",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 3,
      name: "ECOFAST DARK OLIVE 44",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-003",
      expiry: "2027-01-10",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 4,
      name: "ECOFAST MEHENDI OLIVE 240",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-004",
      expiry: "2027-03-20",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 5,
      name: "ECOFAST MAST OLIVE 404",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-005",
      expiry: "2026-09-30",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 6,
      name: "ECOFAST OLIVE 5G-149",
      qty: 1,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-006",
      expiry: "2026-08-15",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "Urgent reorder",
    },
    {
      id: 7,
      name: "ECOFAST MILITTARY OILIVE 50",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-007",
      expiry: "2027-02-28",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 8,
      name: "ECOFAST OLIVE GREEN 5G-147",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-008",
      expiry: "2027-04-10",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 9,
      name: "ECOFAST TEA OLIVE 5G-148",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-009",
      expiry: "2027-05-20",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 10,
      name: "ECOFAST FIR GREEN 42",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-010",
      expiry: "2027-06-01",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 11,
      name: "ECOFAST JUST BLACK 100",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-011",
      expiry: "2027-07-15",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 12,
      name: "ECOFAST LIGHT GREY 5G-150",
      qty: 1,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-012",
      expiry: "2026-10-31",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 13,
      name: "ECOFAST ENGINE GREY S 152",
      qty: 5,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-013",
      expiry: "2027-08-20",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 14,
      name: "ECOFAST BLUE GREY 280",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-014",
      expiry: "2027-09-10",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 15,
      name: "ECOFAST DARK GREY 5G-180",
      qty: 4,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-015",
      expiry: "2027-10-05",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 16,
      name: "ECOFAST COLD GREY 54",
      qty: 7,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-016",
      expiry: "2027-11-01",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 17,
      name: "ECOFAST CAMEL BROWN 37",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-017",
      expiry: "2027-12-15",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 18,
      name: "ECOFAST COFFEE BROWN 35",
      qty: 0,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "",
      expiry: "",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "Out of stock - urgent",
    },
    {
      id: 19,
      name: "ECOFAST SLATE BROWN 34",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-019",
      expiry: "2027-02-20",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 20,
      name: "ECOFAST OLIVE BROWN V 92",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-020",
      expiry: "2027-03-10",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 21,
      name: "ECOFAST POLICE KHAKI 12",
      qty: 1,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-021",
      expiry: "2026-11-20",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 22,
      name: "ECOFAST KHAKI 5G-115",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-022",
      expiry: "2027-04-25",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 23,
      name: "ECOFAST GOLD KHAKI 5G-116",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-023",
      expiry: "2027-05-30",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 24,
      name: "ECOFAST YELLOW 5G 09",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-024",
      expiry: "2027-06-15",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 25,
      name: "ECOFAST RUST V 79",
      qty: 1,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-025",
      expiry: "2026-09-15",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 26,
      name: "ECOFAST PRUNE B 20",
      qty: 4,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-026",
      expiry: "2027-07-20",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 27,
      name: "ECOFAST RED BROWN 5G-112",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-027",
      expiry: "2027-08-10",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 28,
      name: "ECOFAST BROWN 390",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-028",
      expiry: "2027-09-05",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 29,
      name: "ECOFAST SKY BLUE 5G-140",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-029",
      expiry: "2027-10-20",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 30,
      name: "ECOFAST DULL BLUE 5G-145",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-030",
      expiry: "2027-11-15",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 31,
      name: "ECOFAST ANAND BLUE V87",
      qty: 2,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-031",
      expiry: "2027-12-01",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 32,
      name: "SAFEAUX OPTOFAST IS",
      qty: 1000,
      minQty: 100,
      unit: "ml",
      category: "SAFEAUX",
      batch: "SA-001",
      expiry: "2027-06-30",
      supplier: "AuxiPro India",
      safetyNote: "Flammable - keep cool",
      reorderNote: "Bulk order 5L",
    },
    {
      id: 33,
      name: "SAFEAUX SILICON NXT",
      qty: 2,
      minQty: 5,
      unit: "L",
      category: "SAFEAUX",
      batch: "SA-002",
      expiry: "2026-12-15",
      supplier: "AuxiPro India",
      safetyNote: "Eye irritant",
      reorderNote: "",
    },
    {
      id: 34,
      name: "DENIMOZ DYEFIX S2D",
      qty: 2,
      minQty: 5,
      unit: "kg",
      category: "DENIMOZ",
      batch: "DZ-001",
      expiry: "2027-01-20",
      supplier: "DeniChem Co",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 35,
      name: "SULFAID ANTIOXIDANT IY",
      qty: 500,
      minQty: 100,
      unit: "g",
      category: "SULFAID",
      batch: "SF-001",
      expiry: "2027-03-10",
      supplier: "SulfaChem",
      safetyNote: "Oxidising agent",
      reorderNote: "",
    },
    {
      id: 36,
      name: "DENIMOZ SEQUADET FBN",
      qty: 0,
      minQty: 5,
      unit: "L",
      category: "DENIMOZ",
      batch: "",
      expiry: "",
      supplier: "DeniChem Co",
      safetyNote: "",
      reorderNote: "Out of stock",
    },
    {
      id: 37,
      name: "SAFEAUX PREP LF",
      qty: 0,
      minQty: 5,
      unit: "L",
      category: "SAFEAUX",
      batch: "",
      expiry: "",
      supplier: "AuxiPro India",
      safetyNote: "",
      reorderNote: "Out of stock",
    },
    {
      id: 38,
      name: "DENIMOZ EXECUTOR IAS",
      qty: 0,
      minQty: 5,
      unit: "kg",
      category: "DENIMOZ",
      batch: "",
      expiry: "",
      supplier: "DeniChem Co",
      safetyNote: "Corrosive",
      reorderNote: "",
    },
    {
      id: 39,
      name: "SULFAID OXYDANT ION",
      qty: 0,
      minQty: 5,
      unit: "g",
      category: "SULFAID",
      batch: "",
      expiry: "",
      supplier: "SulfaChem",
      safetyNote: "Strong oxidiser",
      reorderNote: "",
    },
    {
      id: 40,
      name: "NFDF",
      qty: 500,
      minQty: 100,
      unit: "ml",
      category: "OTHER",
      batch: "NF-001",
      expiry: "2027-05-15",
      supplier: "",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 41,
      name: "LEVEL DYE VRD",
      qty: 1000,
      minQty: 100,
      unit: "g",
      category: "OTHER",
      batch: "LD-001",
      expiry: "2027-07-01",
      supplier: "",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 42,
      name: "ECOSOL ADMIRAL NAVY EEB",
      qty: 500,
      minQty: 100,
      unit: "g",
      category: "ECOSOL",
      batch: "ES-001",
      expiry: "2027-08-20",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 43,
      name: "ECOSOL BLUE BLACK Q3B",
      qty: 500,
      minQty: 100,
      unit: "g",
      category: "ECOSOL",
      batch: "ES-002",
      expiry: "2027-09-10",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 44,
      name: "ECOSOL COLD GREY IR",
      qty: 500,
      minQty: 100,
      unit: "g",
      category: "ECOSOL",
      batch: "ES-003",
      expiry: "2027-10-05",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 45,
      name: "ECOFAST TOFFEE BROWN 32",
      qty: 3,
      minQty: 2,
      unit: "kg",
      category: "ECOFAST",
      batch: "BC-045",
      expiry: "2027-11-20",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 46,
      name: "SAFEAUX SILICON NXT (B)",
      qty: 0,
      minQty: 5,
      unit: "L",
      category: "SAFEAUX",
      batch: "",
      expiry: "",
      supplier: "AuxiPro India",
      safetyNote: "Eye irritant",
      reorderNote: "",
    },
    {
      id: 47,
      name: "SAFEAUX OPTOFAST IS (B)",
      qty: 0,
      minQty: 100,
      unit: "ml",
      category: "SAFEAUX",
      batch: "",
      expiry: "",
      supplier: "AuxiPro India",
      safetyNote: "Flammable",
      reorderNote: "",
    },
    {
      id: 48,
      name: "DENIMOZ DYEFIX S2D (B)",
      qty: 0,
      minQty: 5,
      unit: "kg",
      category: "DENIMOZ",
      batch: "",
      expiry: "",
      supplier: "DeniChem Co",
      safetyNote: "",
      reorderNote: "",
    },
  ],
  sample: [
    {
      id: 101,
      name: "ECOFAST BLUE B",
      qty: 60,
      minQty: 20,
      unit: "kg",
      category: "ECOFAST",
      batch: "DL-001",
      expiry: "2027-01-15",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 102,
      name: "ECOFAST DARK OLIVE 44",
      qty: 15,
      minQty: 25,
      unit: "kg",
      category: "ECOFAST",
      batch: "DL-002",
      expiry: "2026-11-30",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "Reorder soon",
    },
    {
      id: 103,
      name: "SAFEAUX PREP LF",
      qty: 8,
      minQty: 10,
      unit: "L",
      category: "SAFEAUX",
      batch: "DL-003",
      expiry: "2027-03-20",
      supplier: "AuxiPro India",
      safetyNote: "",
      reorderNote: "",
    },
  ],
  faridabad: [
    {
      id: 201,
      name: "ECOFAST JUST BLACK 100",
      qty: 90,
      minQty: 30,
      unit: "kg",
      category: "ECOFAST",
      batch: "FB-001",
      expiry: "2027-02-10",
      supplier: "ColorChem Ltd",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 202,
      name: "SAFEAUX PREP LF",
      qty: 5,
      minQty: 20,
      unit: "L",
      category: "SAFEAUX",
      batch: "",
      expiry: "",
      supplier: "AuxiPro India",
      safetyNote: "",
      reorderNote: "Out of stock",
    },
    {
      id: 203,
      name: "SULFAID ANTIOXIDANT IY",
      qty: 200,
      minQty: 100,
      unit: "g",
      category: "SULFAID",
      batch: "FB-003",
      expiry: "2027-04-15",
      supplier: "SulfaChem",
      safetyNote: "Oxidising agent",
      reorderNote: "",
    },
  ],
  shadecard: [
    {
      id: 301,
      name: "Shade 101 - Sky Blue",
      qty: 55,
      minQty: 30,
      unit: "pcs",
      category: "OTHER",
      batch: "SC-001",
      expiry: "",
      supplier: "",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 302,
      name: "Shade 102 - Rose Red",
      qty: 12,
      minQty: 25,
      unit: "pcs",
      category: "OTHER",
      batch: "SC-002",
      expiry: "",
      supplier: "",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 303,
      name: "Shade 103 - Forest Green",
      qty: 80,
      minQty: 20,
      unit: "pcs",
      category: "OTHER",
      batch: "SC-003",
      expiry: "",
      supplier: "",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 304,
      name: "Shade 104 - Sunset Orange",
      qty: 8,
      minQty: 30,
      unit: "pcs",
      category: "OTHER",
      batch: "SC-004",
      expiry: "",
      supplier: "",
      safetyNote: "",
      reorderNote: "",
    },
    {
      id: 305,
      name: "Shade 105 - Midnight Black",
      qty: 44,
      minQty: 15,
      unit: "pcs",
      category: "OTHER",
      batch: "SC-005",
      expiry: "",
      supplier: "",
      safetyNote: "",
      reorderNote: "",
    },
  ],
};

const EMPTY_PRODUCT = {
  name: "",
  qty: "",
  minQty: "",
  unit: "kg",
  category: "ECOFAST",
  batch: "",
  expiry: "",
  supplier: "",
  safetyNote: "",
  reorderNote: "",
};
const genId = () => Date.now() + Math.floor(Math.random() * 9999);
const nowStr = () =>
  new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const detectColumns = (headerRow) => {
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

/* ─── PDF Export ─────────────────────────────────────────────────────────── */
const exportPDF = (
  stocks,
  tab,
  tabLabel,
  filterLow = false,
  catFilter = "ALL",
  customTitle = null,
) => {
  let data = filterLow
    ? Object.entries(stocks).flatMap(([t, ps]) =>
        ps
          .filter((p) => p.qty <= p.minQty)
          .map((p) => ({ ...p, _tab: TABS.find((x) => x.id === t)?.label })),
      )
    : stocks[tab] || [];

  if (!filterLow && catFilter !== "ALL") {
    data = data.filter(
      (p) => (p.category || getCategory(p.name)) === catFilter,
    );
  }

  const title =
    customTitle ||
    (filterLow
      ? "Low Stock Report — All Locations"
      : `${tabLabel} · ${catFilter !== "ALL" ? CATEGORIES[catFilter]?.label || catFilter : "All Categories"}`);

  const rows = data
    .map((p, i) => {
      const isLow = p.qty <= p.minQty,
        isZero = p.qty === 0;
      const cat = CATEGORIES[p.category || getCategory(p.name)];
      const statusColor = isZero ? "#DC2626" : isLow ? "#D97706" : "#059669";
      const statusText = isZero ? "OUT OF STOCK" : isLow ? "LOW" : "OK";
      return `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#F9FAFB"}">
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;color:#6B7280">${i + 1}</td>
      ${filterLow ? `<td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:11px">${p._tab || ""}</td>` : ""}
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;font-weight:600;color:#111">${p.name}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;text-align:center">
        <span style="background:${cat?.bg || "#F3F4F6"};color:${cat?.color || "#555"};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700">${cat?.label || p.category || ""}</span>
      </td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:12px;font-weight:700;text-align:center;color:${statusColor}">${p.qty} ${p.unit || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:11px;text-align:center;color:#6B7280">${p.minQty} ${p.unit || ""}</td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:10px;text-align:center">
        <span style="background:${isZero ? "#FEE2E2" : isLow ? "#FEF3C7" : "#D1FAE5"};color:${statusColor};padding:2px 8px;border-radius:10px;font-weight:700;font-size:10px">${statusText}</span>
      </td>
      <td style="padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:10px;color:#DC2626">${p.reorderNote || ""}</td>
    </tr>`;
    })
    .join("");

  const totalQty = data.reduce((s, p) => s + (p.qty || 0), 0);
  const lowCount = data.filter((p) => p.qty <= p.minQty).length;
  const outCount = data.filter((p) => p.qty === 0).length;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${title}</title>
  <style>
    @media print { body { margin: 0; } .no-print { display: none; } }
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #fff; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: 9px 10px; background: #0F172A; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing:.05em; text-align:left; }
    .summary-box { display:inline-block; padding:10px 20px; border-radius:8px; margin-right:10px; margin-bottom:16px; }
  </style></head><body>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #0F172A">
    <div>
      <div style="font-size:22px;font-weight:900;color:#0F172A;letter-spacing:-.5px">⚗ Chemical Stock Report</div>
      <div style="font-size:13px;color:#555;margin-top:4px">${title} &nbsp;·&nbsp; Generated: ${new Date().toLocaleString("en-IN")}</div>
    </div>
  </div>
  <div style="margin-bottom:16px">
    <div class="summary-box" style="background:#EFF6FF;color:#1D4ED8"><strong style="font-size:20px">${data.length}</strong><br><span style="font-size:11px">Total Products</span></div>
    <div class="summary-box" style="background:#ECFDF5;color:#065F46"><strong style="font-size:20px">${totalQty}</strong><br><span style="font-size:11px">Total Quantity</span></div>
    <div class="summary-box" style="background:#FEF3C7;color:#92400E"><strong style="font-size:20px">${lowCount}</strong><br><span style="font-size:11px">Low Stock</span></div>
    <div class="summary-box" style="background:#FEE2E2;color:#991B1B"><strong style="font-size:20px">${outCount}</strong><br><span style="font-size:11px">Out of Stock</span></div>
  </div>
  <button class="no-print" onclick="window.print()" style="margin-bottom:16px;padding:8px 20px;background:#0F172A;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600">🖨 Print / Save PDF</button>
  <table>
    <thead><tr>
      <th>#</th>
      ${filterLow ? "<th>Location</th>" : ""}
      <th>Product Name</th><th>Category</th><th>Qty</th><th>Min Qty</th><th>Status</th><th>Reorder Note</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  </body></html>`;

  const w = window.open("", "_blank", "width=1100,height=800");
  w.document.write(html);
  w.document.close();
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */
const S = {
  wrap: {
    fontFamily: "'Inter',system-ui,sans-serif",
    minHeight: "100vh",
    background: "#F1F5F9",
    paddingBottom: 64,
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
  main: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: "20px 16px",
    display: "flex",
    gap: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 1px 6px rgba(0,0,0,.07)",
    overflow: "hidden",
  },
  tabBar: {
    display: "flex",
    gap: 4,
    background: "#fff",
    borderRadius: 12,
    padding: 5,
    boxShadow: "0 1px 4px rgba(0,0,0,.07)",
    width: "fit-content",
    flexWrap: "wrap",
  },
  btn: (bg, col, sm) => ({
    padding: sm ? "7px 14px" : "9px 18px",
    borderRadius: 9,
    border: "none",
    background: bg,
    color: col,
    cursor: "pointer",
    fontSize: sm ? 11 : 13,
    fontWeight: 700,
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 5,
  }),
  rowBtn: (bg, col) => ({
    padding: "5px 11px",
    borderRadius: 7,
    border: `1.5px solid ${col}30`,
    background: bg,
    color: col,
    cursor: "pointer",
    fontSize: 12,
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

const FormField = ({ label, children }) => (
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

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */
export default function ChemicalStockManager() {
  const saved = load();
  const [stocks, setStocksRaw] = useState(saved?.stocks || SEED);
  const [changeLog, setChangeLog] = useState(saved?.changeLog || []);
  const [lastUpdated, setLastUpdated] = useState(saved?.lastUpdated || {});
  const [companyName, setCompanyName] = useState(
    saved?.companyName || "My Chemical Store",
  );

  const [activeTab, setActiveTab] = useState("sample");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [showLowOnly, setShowLowOnly] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [newRow, setNewRow] = useState(EMPTY_PRODUCT);
  const [toastMsg, setToastMsg] = useState(null);
  const [importMode, setImportMode] = useState("manual");
  const [showLog, setShowLog] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mobileTab, setMobileTab] = useState("stock");

  // ── Column selector state ──
  const defaultVisible = ALL_COLUMNS.filter((c) => c.default).map((c) => c.id);
  const [visibleCols, setVisibleCols] = useState(defaultVisible);
  const [showColPicker, setShowColPicker] = useState(false);
  const colPickerRef = useRef();

  const fileRef = useRef();

  useEffect(() => {
    save({ stocks, changeLog, lastUpdated, companyName });
  }, [stocks, changeLog, lastUpdated, companyName]);

  // Close col picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (colPickerRef.current && !colPickerRef.current.contains(e.target))
        setShowColPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const setStocks = useCallback((updater) => {
    setStocksRaw((prev) =>
      typeof updater === "function" ? updater(prev) : updater,
    );
  }, []);

  const toast = (msg, type = "success") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };
  const logAction = (action, tab, details) => {
    const entry = { id: genId(), action, tab, details, time: nowStr() };
    setChangeLog((p) => [entry, ...p].slice(0, 200));
    setLastUpdated((p) => ({ ...p, [tab]: nowStr() }));
  };

  const current = stocks[activeTab] || [];

  // ── Category counts for current tab ──
  const catCounts = {};
  current.forEach((p) => {
    const cat = p.category || getCategory(p.name);
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });
  const catLowCounts = {};
  current
    .filter((p) => p.qty <= p.minQty)
    .forEach((p) => {
      const cat = p.category || getCategory(p.name);
      catLowCounts[cat] = (catLowCounts[cat] || 0) + 1;
    });

  const filtered = current.filter((p) => {
    const ms =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.batch || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier || "").toLowerCase().includes(search.toLowerCase());
    const ml = showLowOnly ? p.qty <= p.minQty : true;
    const mc =
      catFilter === "ALL"
        ? true
        : (p.category || getCategory(p.name)) === catFilter;
    return ms && ml && mc;
  });

  const handleAdd = () => {
    if (!newRow.name.trim()) return toast("Product name required", "error");
    const p = {
      ...newRow,
      id: genId(),
      qty: parseInt(newRow.qty) || 0,
      minQty: parseInt(newRow.minQty) || 0,
      category: newRow.category || getCategory(newRow.name),
    };
    setStocks((s) => ({ ...s, [activeTab]: [...s[activeTab], p] }));
    logAction("ADD", activeTab, `"${p.name}" added (QT: ${p.qty} ${p.unit})`);
    setNewRow(EMPTY_PRODUCT);
    setAddMode(false);
    toast(`"${p.name}" added ✓`);
  };

  const handleSaveEdit = () => {
    if (!editRow.name.trim()) return toast("Product name required", "error");
    const updated = {
      ...editRow,
      qty: parseInt(editRow.qty) || 0,
      minQty: parseInt(editRow.minQty) || 0,
    };
    const prev = current.find((p) => p.id === editRow.id);
    setStocks((s) => ({
      ...s,
      [activeTab]: s[activeTab].map((p) => (p.id === editRow.id ? updated : p)),
    }));
    const ch = [];
    if (prev.qty !== updated.qty) ch.push(`QT: ${prev.qty}→${updated.qty}`);
    if (prev.name !== updated.name) ch.push(`Name changed`);
    logAction(
      "EDIT",
      activeTab,
      `"${updated.name}" ${ch.join(", ") || "updated"}`,
    );
    setEditRow(null);
    toast("Saved ✓");
  };

  const handleDelete = (id) => setConfirmDel(current.find((p) => p.id === id));
  const confirmDelete = () => {
    setStocks((s) => ({
      ...s,
      [activeTab]: s[activeTab].filter((p) => p.id !== confirmDel.id),
    }));
    logAction("DELETE", activeTab, `"${confirmDel.name}" deleted`);
    toast("Deleted", "error");
    setConfirmDel(null);
  };

  const nudgeQty = (id, delta) => {
    const p = current.find((x) => x.id === id);
    if (!p) return;
    const newQty = Math.max(0, p.qty + delta);
    setStocks((s) => ({
      ...s,
      [activeTab]: s[activeTab].map((x) =>
        x.id === id ? { ...x, qty: newQty } : x,
      ),
    }));
    logAction("QTY", activeTab, `"${p.name}" QT: ${p.qty} → ${newQty}`);
  };

  const handleFile = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
          if (!rows.length) return toast("File is empty", "error");
          const { nameCol, qtyCol, minQtyCol } = detectColumns(rows[0]);
          const imported = rows
            .slice(1)
            .filter((r) => r[nameCol] && String(r[nameCol]).trim())
            .map((r) => ({
              id: genId(),
              name: String(r[nameCol]).trim(),
              qty: parseInt(r[qtyCol]) || 0,
              minQty: parseInt(r[minQtyCol]) || 0,
              unit: "kg",
              category: getCategory(String(r[nameCol])),
              batch: "",
              expiry: "",
              supplier: "",
              safetyNote: "",
              reorderNote: "",
            }));
          if (!imported.length) return toast("No valid data found", "error");
          setStocks((s) => ({
            ...s,
            [activeTab]: [...s[activeTab], ...imported],
          }));
          logAction(
            "IMPORT",
            activeTab,
            `${imported.length} products imported from Excel`,
          );
          toast(`${imported.length} products imported ✓`);
        } catch {
          toast("Failed to read file", "error");
        }
      };
      reader.readAsBinaryString(file);
      e.target.value = "";
    },
    [activeTab],
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filtered.map((p, i) => ({
        "S.N": i + 1,
        "Product Name": p.name,
        Category: CATEGORIES[p.category]?.label || p.category,
        QT: p.qty,
        Unit: p.unit,
        "Min QT": p.minQty,
        Status: p.qty <= p.minQty ? "LOW" : "OK",
        "Reorder Note": p.reorderNote || "",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      ws,
      TABS.find((t) => t.id === activeTab)?.label,
    );
    XLSX.writeFile(wb, `${activeTab}_stock_${Date.now()}.xlsx`);
    toast("Excel exported ✓");
  };

  const tabLabel = TABS.find((t) => t.id === activeTab)?.label || "";
  const totalLow = Object.values(stocks)
    .flat()
    .filter((p) => p.qty <= p.minQty).length;
  const allAlerts = Object.entries(stocks).flatMap(([tab, ps]) =>
    ps
      .filter((p) => p.qty <= p.minQty)
      .map((p) => ({
        ...p,
        _tab: TABS.find((t) => t.id === tab)?.label,
        _tabId: tab,
      })),
  );

  const switchTab = (id) => {
    setActiveTab(id);
    setSearch("");
    setCatFilter("ALL");
    setShowLowOnly(false);
    setEditRow(null);
    setAddMode(false);
  };

  const isColVisible = (id) => visibleCols.includes(id);
  const toggleCol = (id) => {
    if (["name", "qty", "actions"].includes(id)) return; // always visible
    setVisibleCols((v) =>
      v.includes(id) ? v.filter((c) => c !== id) : [...v, id],
    );
  };

  const drawerData = editRow || (addMode ? newRow : null);
  const setDrawer = editRow ? setEditRow : setNewRow;

  /* ── Low stock PDF for current filtered view ── */
  const exportLowPDF = () => {
    const lowData = filtered.filter((p) => p.qty <= p.minQty);
    if (!lowData.length)
      return toast("No low stock items in current filter", "error");
    const catLabel =
      catFilter !== "ALL"
        ? ` · ${CATEGORIES[catFilter]?.label || catFilter}`
        : "";
    exportPDF(
      { [activeTab]: lowData },
      activeTab,
      tabLabel,
      false,
      "ALL",
      `Low Stock — ${tabLabel}${catLabel}`,
    );
  };

  /* ─── Detail Modal ─── */
  const DetailModal = detailRow && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 201,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) setDetailRow(null);
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "18px 18px 0 0",
          width: "100%",
          maxWidth: 520,
          maxHeight: "85vh",
          overflowY: "auto",
          padding: 24,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 800,
              color: "#0F172A",
            }}
          >
            {detailRow.name}
          </h3>
          <button
            onClick={() => setDetailRow(null)}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#9CA3AF",
            }}
          >
            ×
          </button>
        </div>
        {[
          ["Quantity", `${detailRow.qty} ${detailRow.unit || ""}`],
          ["Min Quantity", `${detailRow.minQty} ${detailRow.unit || ""}`],
          [
            "Category",
            CATEGORIES[detailRow.category]?.label || detailRow.category,
          ],
          ["Reorder Note", detailRow.reorderNote || "None"],
        ].map(([k, v]) => (
          <div
            key={k}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 600 }}>
              {k}
            </span>
            <span
              style={{
                fontSize: 13,
                color: "#111",
                fontWeight: 500,
                maxWidth: "60%",
                textAlign: "right",
              }}
            >
              {v}
            </span>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button
            onClick={() => {
              setEditRow({ ...detailRow });
              setDetailRow(null);
            }}
            style={{
              ...S.btn("#2563EB", "#fff"),
              flex: 1,
              justifyContent: "center",
            }}
          >
            Edit
          </button>
          <button
            onClick={() => {
              handleDelete(detailRow.id);
              setDetailRow(null);
            }}
            style={{
              ...S.btn("#FEF2F2", "#DC2626"),
              flex: 1,
              justifyContent: "center",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Confirm Delete ─── */
  const ConfirmModal = confirmDel && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 202,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 340,
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
        <p
          style={{
            fontWeight: 800,
            fontSize: 15,
            marginBottom: 6,
            color: "#0F172A",
          }}
        >
          Delete Product?
        </p>
        <p
          style={{
            color: "#555",
            fontSize: 13,
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          "{confirmDel.name}" permanently remove ho jaayega.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setConfirmDel(null)}
            style={{
              ...S.btn("#F1F5F9", "#374151"),
              flex: 1,
              justifyContent: "center",
            }}
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            style={{
              ...S.btn("#EF4444", "#fff"),
              flex: 1,
              justifyContent: "center",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Settings Modal ─── */
  const SettingsModal = showSettings && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 202,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>
            ⚙ Settings
          </h3>
          <button
            onClick={() => setShowSettings(false)}
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              color: "#9CA3AF",
            }}
          >
            ×
          </button>
        </div>
        <FormField label="Company / Store Name">
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={S.input("#2563EB")}
          />
        </FormField>
        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #F3F4F6",
          }}
        >
          <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 12 }}>
            ⚠ Danger Zone
          </p>
          <button
            onClick={() => {
              if (window.confirm("Sab data delete hoga! Sure?")) {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
              }
            }}
            style={{
              ...S.btn("#FEF2F2", "#DC2626"),
              width: "100%",
              justifyContent: "center",
            }}
          >
            🗑 Clear All Data
          </button>
        </div>
      </div>
    </div>
  );

  /* ─── Column Picker Dropdown ─── */
  const ColPicker = showColPicker && (
    <div
      ref={colPickerRef}
      style={{
        position: "absolute",
        top: "calc(100% + 6px)",
        right: 0,
        zIndex: 150,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,.15)",
        padding: "12px 0",
        minWidth: 200,
        border: "1.5px solid #E2E8F0",
      }}
    >
      <div
        style={{
          padding: "0 14px 8px",
          fontSize: 10,
          fontWeight: 800,
          color: "#94A3B8",
          textTransform: "uppercase",
          letterSpacing: ".06em",
        }}
      >
        Columns
      </div>
      {ALL_COLUMNS.map((col) => {
        const locked = ["name", "qty", "actions"].includes(col.id);
        const checked = isColVisible(col.id);
        return (
          <label
            key={col.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "7px 14px",
              cursor: locked ? "not-allowed" : "pointer",
              background: "transparent",
              userSelect: "none",
            }}
            onMouseEnter={(e) => {
              if (!locked) e.currentTarget.style.background = "#F8FAFC";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              onClick={() => !locked && toggleCol(col.id)}
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                border: `2px solid ${checked ? "#2563EB" : "#D1D5DB"}`,
                background: checked ? "#2563EB" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                opacity: locked ? 0.4 : 1,
              }}
            >
              {checked && (
                <span
                  style={{
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 900,
                    lineHeight: 1,
                  }}
                >
                  ✓
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 12,
                color: locked ? "#94A3B8" : "#374151",
                fontWeight: checked ? 600 : 400,
              }}
            >
              {col.label}{" "}
              {locked && (
                <span style={{ fontSize: 9, color: "#CBD5E1" }}>(fixed)</span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );

  /* ─── Render ─── */
  return (
    <div style={S.wrap}>
      {/* Toast */}
      {toastMsg && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 999,
            background: toastMsg.type === "error" ? "#EF4444" : "#10B981",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0,0,0,.18)",
          }}
        >
          {toastMsg.type === "error" ? "✕" : "✓"} {toastMsg.msg}
        </div>
      )}

      {/* Edit/Add Modal */}
      <div
        style={{
          display: editRow || addMode ? "flex" : "none",
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0,0,0,.5)",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setEditRow(null);
            setAddMode(false);
          }
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "18px 18px 0 0",
            width: "100%",
            maxWidth: 580,
            maxHeight: "92vh",
            overflowY: "auto",
            padding: 24,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 800,
                color: "#0F172A",
              }}
            >
              {editRow ? "Edit Product" : "Add Product"}
            </h3>
            <button
              onClick={() => {
                setEditRow(null);
                setAddMode(false);
              }}
              style={{
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: "#9CA3AF",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
          {drawerData && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div style={{ gridColumn: "1/-1" }}>
                <FormField label="Product Name *">
                  <input
                    value={drawerData.name}
                    onChange={(e) =>
                      setDrawer((r) => ({ ...r, name: e.target.value }))
                    }
                    style={S.input("#2563EB")}
                    placeholder="e.g. ECOFAST BLUE B"
                  />
                </FormField>
              </div>
              <FormField label="Quantity *">
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(drawerData.qty ?? "")}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d+$/.test(v))
                      setDrawer((r) => ({ ...r, qty: v }));
                  }}
                  style={S.input()}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Min Quantity *">
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(drawerData.minQty ?? "")}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "" || /^\d+$/.test(v))
                      setDrawer((r) => ({ ...r, minQty: v }));
                  }}
                  style={S.input()}
                  placeholder="0"
                />
              </FormField>
              <FormField label="Unit">
                <select
                  value={drawerData.unit || "kg"}
                  onChange={(e) =>
                    setDrawer((r) => ({ ...r, unit: e.target.value }))
                  }
                  style={{ ...S.input(), appearance: "auto" }}
                >
                  {["kg", "g", "L", "ml", "pcs", "box", "drum", "bag"].map(
                    (u) => (
                      <option key={u}>{u}</option>
                    ),
                  )}
                </select>
              </FormField>
              <FormField label="Category">
                <select
                  value={drawerData.category || "OTHER"}
                  onChange={(e) =>
                    setDrawer((r) => ({ ...r, category: e.target.value }))
                  }
                  style={{ ...S.input(), appearance: "auto" }}
                >
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </FormField>
              <div style={{ gridColumn: "1/-1" }}>
                <FormField label="Reorder Note">
                  <input
                    value={drawerData.reorderNote || ""}
                    onChange={(e) =>
                      setDrawer((r) => ({ ...r, reorderNote: e.target.value }))
                    }
                    style={S.input()}
                    placeholder="e.g. Min 5kg order, call supplier"
                  />
                </FormField>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={editRow ? handleSaveEdit : handleAdd}
              style={{
                ...S.btn("#2563EB", "#fff"),
                flex: 1,
                justifyContent: "center",
                padding: 12,
              }}
            >
              {editRow ? "💾 Save Changes" : "✚ Add Product"}
            </button>
            <button
              onClick={() => {
                setEditRow(null);
                setAddMode(false);
              }}
              style={{ ...S.btn("#F1F5F9", "#374151"), padding: 12 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      {DetailModal}
      {ConfirmModal}
      {SettingsModal}

      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.hdrInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>⚗</span>
            <div>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: 15,
                  color: "#fff",
                  letterSpacing: "-.3px",
                }}
              >
                {companyName}
              </div>
              <div style={{ fontSize: 10, color: "#64748B" }}>
                Chemical Stock Manager · Auto-saved
              </div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {totalLow > 0 && (
              <span
                style={{
                  background: "#FEF2F2",
                  color: "#DC2626",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: "1.5px solid #FECACA",
                }}
              >
                ⚠ {totalLow} Low
              </span>
            )}
            <button
              onClick={() => exportPDF(stocks, activeTab, tabLabel, true)}
              style={S.btn("#DC2626", "#fff", true)}
            >
              📄 PDF Alert
            </button>
            <button
              onClick={() =>
                exportPDF(stocks, activeTab, tabLabel, false, catFilter)
              }
              style={S.btn("#F59E0B", "#0F172A", true)}
            >
              📄 PDF Report
            </button>
            <button
              onClick={() => setShowSettings(true)}
              style={S.btn("#1E293B", "#94A3B8", true)}
            >
              ⚙
            </button>
          </div>
        </div>
      </div>

      <div style={S.main}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Tabs */}
          <div style={{ ...S.tabBar, marginBottom: 16 }}>
            {TABS.map((t) => {
              const low =
                stocks[t.id]?.filter((p) => p.qty <= p.minQty).length || 0;
              const act = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => switchTab(t.id)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    background: act ? "#0F172A" : "transparent",
                    color: act ? "#fff" : "#64748B",
                    fontWeight: act ? 700 : 500,
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    transition: "all .12s",
                  }}
                >
                  {t.icon} {t.label}
                  {low > 0 && (
                    <span
                      style={{
                        background: act ? "rgba(255,255,255,.2)" : "#FEE2E2",
                        color: act ? "#fff" : "#DC2626",
                        fontSize: 9,
                        fontWeight: 800,
                        padding: "1px 5px",
                        borderRadius: 8,
                      }}
                    >
                      {low}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                l: "Products",
                v: current.length,
                bg: "#EFF6FF",
                col: "#1D4ED8",
              },
              {
                l: "Total QT",
                v: current.reduce((s, p) => s + p.qty, 0),
                bg: "#ECFDF5",
                col: "#065F46",
              },
              {
                l: "Low Stock",
                v: current.filter((p) => p.qty <= p.minQty).length,
                bg: "#FEF3C7",
                col: "#92400E",
              },
              {
                l: "Out of Stock",
                v: current.filter((p) => p.qty === 0).length,
                bg: "#FEE2E2",
                col: "#991B1B",
              },
            ].map((s) => (
              <div
                key={s.l}
                style={{
                  background: s.bg,
                  borderRadius: 10,
                  padding: "10px 14px",
                  flex: "1 1 80px",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 900, color: s.col }}>
                  {s.v}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: s.col + "99",
                    fontWeight: 600,
                    marginTop: 1,
                  }}
                >
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          {/* ── Controls ── */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {/* Search */}
            <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  fontSize: 14,
                }}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Search name, batch, supplier…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...S.input(), paddingLeft: 32, fontSize: 12 }}
              />
            </div>

            {/* ── Category filter with counts ── */}
            <div style={{ position: "relative" }}>
              <select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                style={{
                  ...S.input(),
                  width: "auto",
                  fontSize: 12,
                  padding: "8px 10px",
                  appearance: "auto",
                  minWidth: 160,
                  paddingRight: 28,
                  color: "#0F172A",
                  fontWeight: catFilter !== "ALL" ? 700 : 400,
                  borderColor:
                    catFilter !== "ALL"
                      ? CATEGORIES[catFilter]?.color + "80"
                      : "#E5E7EB",
                  background:
                    catFilter !== "ALL" ? CATEGORIES[catFilter]?.bg : "#fff",
                }}
              >
                <option value="ALL">All Categories ({current.length})</option>
                {Object.entries(CATEGORIES).map(([k, v]) => {
                  const count = catCounts[k] || 0;
                  if (!count) return null;
                  const lowC = catLowCounts[k] || 0;
                  return (
                    <option key={k} value={k}>
                      {v.label} ({count}
                      {lowC > 0 ? ` ⚠${lowC}` : ""})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Low-only toggle */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "#555",
                cursor: "pointer",
                userSelect: "none",
                whiteSpace: "nowrap",
              }}
            >
              <div
                onClick={() => setShowLowOnly((v) => !v)}
                style={{
                  width: 34,
                  height: 18,
                  borderRadius: 9,
                  background: showLowOnly ? "#EF4444" : "#D1D5DB",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background .2s",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: showLowOnly ? 17 : 2,
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: "#fff",
                    transition: "left .2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                  }}
                />
              </div>
              Low only
            </label>

            {/* ── Low Stock PDF button ── */}
            <button
              onClick={exportLowPDF}
              style={{
                ...S.btn("#FEF2F2", "#DC2626", true),
                border: "1.5px solid #FECACA",
                whiteSpace: "nowrap",
              }}
            >
              📄 Low PDF
            </button>

            {/* Import mode toggle */}
            <div
              style={{
                display: "flex",
                borderRadius: 8,
                border: "1.5px solid #E2E8F0",
                overflow: "hidden",
              }}
            >
              {["manual", "excel"].map((m) => (
                <button
                  key={m}
                  onClick={() => setImportMode(m)}
                  style={{
                    padding: "7px 12px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 700,
                    background: importMode === m ? "#0F172A" : "#fff",
                    color: importMode === m ? "#fff" : "#64748B",
                  }}
                >
                  {m === "manual" ? "✏ Manual" : "📊 Excel"}
                </button>
              ))}
            </div>
            {importMode === "excel" && (
              <button
                onClick={() => fileRef.current.click()}
                style={S.btn("#0F172A", "#fff", true)}
              >
                ↑ Upload
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={handleFile}
            />
            <button
              onClick={exportExcel}
              style={S.btn("#059669", "#fff", true)}
            >
              ↓ Excel
            </button>

            {/* ── Column Picker Button ── */}
            <div style={{ position: "relative" }} ref={colPickerRef}>
              <button
                onClick={() => setShowColPicker((v) => !v)}
                style={{
                  ...S.btn(
                    showColPicker ? "#0F172A" : "#F1F5F9",
                    showColPicker ? "#fff" : "#374151",
                    true,
                  ),
                  border: "1.5px solid #E2E8F0",
                }}
              >
                ⊞ Columns
                <span
                  style={{
                    background: showColPicker
                      ? "rgba(255,255,255,.2)"
                      : "#E2E8F0",
                    color: showColPicker ? "#fff" : "#374151",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: 6,
                  }}
                >
                  {visibleCols.length}
                </span>
              </button>
              {ColPicker}
            </div>

            <button
              onClick={() => {
                setAddMode(true);
                setNewRow(EMPTY_PRODUCT);
              }}
              style={S.btn("#2563EB", "#fff", true)}
            >
              ＋ Add
            </button>
          </div>

          {lastUpdated[activeTab] && (
            <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 10 }}>
              💾 Auto-saved · Last:{" "}
              <strong style={{ color: "#64748B" }}>
                {lastUpdated[activeTab]}
              </strong>
              {catFilter !== "ALL" && (
                <span
                  style={{
                    marginLeft: 10,
                    background: CATEGORIES[catFilter]?.bg,
                    color: CATEGORIES[catFilter]?.color,
                    padding: "2px 8px",
                    borderRadius: 8,
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {CATEGORIES[catFilter]?.label} · {catCounts[catFilter] || 0}{" "}
                  products
                  {catLowCounts[catFilter]
                    ? ` · ⚠ ${catLowCounts[catFilter]} low`
                    : ""}
                </span>
              )}
            </p>
          )}

          {/* ── Table ── */}
          <div style={{ ...S.card, display: "block", overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 400,
              }}
            >
              <thead>
                <tr style={{ background: "#0F172A" }}>
                  {ALL_COLUMNS.filter((c) => isColVisible(c.id)).map(
                    (col, i) => (
                      <th
                        key={col.id}
                        style={{
                          padding: "10px 12px",
                          color: "#94A3B8",
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".06em",
                          textAlign: ["qty", "minQty", "status"].includes(
                            col.id,
                          )
                            ? "center"
                            : col.id === "actions"
                              ? "right"
                              : "left",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col.label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={visibleCols.length}
                      style={{
                        padding: "40px 12px",
                        textAlign: "center",
                        color: "#94A3B8",
                        fontSize: 13,
                      }}
                    >
                      {showLowOnly
                        ? "✅ No low-stock items here"
                        : "No products found"}
                    </td>
                  </tr>
                )}
                {filtered.map((p, idx) => {
                  const isLow = p.qty <= p.minQty,
                    isZero = p.qty === 0;
                  const cat = CATEGORIES[p.category || getCategory(p.name)];
                  const rowBg = isZero ? "#FFF5F5" : isLow ? "#FFFBEB" : "#fff";
                  return (
                    <tr
                      key={p.id}
                      style={{
                        background: rowBg,
                        borderTop: "1px solid #F1F5F9",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F8FAFC")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = rowBg)
                      }
                      onClick={() => setDetailRow(p)}
                    >
                      {isColVisible("idx") && (
                        <td style={S.td()}>
                          <span style={{ color: "#94A3B8", fontSize: 11 }}>
                            {idx + 1}
                          </span>
                        </td>
                      )}
                      {isColVisible("name") && (
                        <td style={S.td()}>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#0F172A",
                              fontSize: 12,
                            }}
                          >
                            {p.name}
                          </div>
                          {p.reorderNote && !isColVisible("reorderNote") && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "#D97706",
                                marginTop: 2,
                              }}
                            >
                              ↺ {p.reorderNote}
                            </div>
                          )}
                        </td>
                      )}
                      {isColVisible("category") && (
                        <td style={S.td("center")}>
                          <span
                            style={{
                              background: cat?.bg || "#F3F4F6",
                              color: cat?.color || "#555",
                              padding: "2px 8px",
                              borderRadius: 10,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {cat?.label || p.category}
                          </span>
                        </td>
                      )}
                      {isColVisible("batch") && (
                        <td
                          style={{ ...S.td(), fontSize: 11, color: "#64748B" }}
                        >
                          {p.batch || (
                            <span style={{ color: "#CBD5E1" }}>—</span>
                          )}
                        </td>
                      )}
                      {isColVisible("expiry") && (
                        <td
                          style={{
                            ...S.td(),
                            fontSize: 11,
                            color:
                              p.expiry && new Date(p.expiry) < new Date()
                                ? "#DC2626"
                                : "#64748B",
                          }}
                        >
                          {p.expiry || (
                            <span style={{ color: "#CBD5E1" }}>—</span>
                          )}
                        </td>
                      )}
                      {isColVisible("supplier") && (
                        <td
                          style={{ ...S.td(), fontSize: 11, color: "#64748B" }}
                        >
                          {p.supplier || (
                            <span style={{ color: "#CBD5E1" }}>—</span>
                          )}
                        </td>
                      )}
                      {isColVisible("qty") && (
                        <td
                          style={S.td("center")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 4,
                            }}
                          >
                            <button
                              onClick={() => nudgeQty(p.id, -1)}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 5,
                                border: "1px solid #E2E8F0",
                                background: "#F8FAFC",
                                cursor: "pointer",
                                fontSize: 14,
                                color: "#555",
                                lineHeight: 1,
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 13,
                                color: isZero
                                  ? "#DC2626"
                                  : isLow
                                    ? "#D97706"
                                    : "#0F172A",
                                minWidth: 30,
                                textAlign: "center",
                              }}
                            >
                              {p.qty}
                            </span>
                            <button
                              onClick={() => nudgeQty(p.id, +1)}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 5,
                                border: "1px solid #E2E8F0",
                                background: "#F8FAFC",
                                cursor: "pointer",
                                fontSize: 14,
                                color: "#555",
                                lineHeight: 1,
                              }}
                            >
                              +
                            </button>
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: "#94A3B8",
                              textAlign: "center",
                            }}
                          >
                            {p.unit}
                          </div>
                        </td>
                      )}
                      {isColVisible("minQty") && (
                        <td
                          style={{
                            ...S.td("center"),
                            color: "#64748B",
                            fontSize: 12,
                          }}
                        >
                          {p.minQty} {p.unit}
                        </td>
                      )}
                      {isColVisible("status") && (
                        <td style={S.td("center")}>
                          <span
                            style={{
                              background: isZero
                                ? "#FEE2E2"
                                : isLow
                                  ? "#FEF3C7"
                                  : "#D1FAE5",
                              color: isZero
                                ? "#991B1B"
                                : isLow
                                  ? "#92400E"
                                  : "#065F46",
                              padding: "3px 8px",
                              borderRadius: 10,
                              fontSize: 10,
                              fontWeight: 800,
                            }}
                          >
                            {isZero ? "✕ Out" : isLow ? "⚠ Low" : "✓ OK"}
                          </span>
                        </td>
                      )}
                      {isColVisible("reorderNote") && (
                        <td
                          style={{
                            ...S.td(),
                            fontSize: 11,
                            color: "#D97706",
                            maxWidth: 160,
                          }}
                        >
                          {p.reorderNote || ""}
                        </td>
                      )}
                      {isColVisible("actions") && (
                        <td
                          style={S.td("right")}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 5,
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              onClick={() => setEditRow({ ...p })}
                              style={S.rowBtn("#EFF6FF", "#1D4ED8")}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              style={S.rowBtn("#FEF2F2", "#DC2626")}
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div
              style={{
                padding: "10px 14px",
                background: "#F8FAFC",
                borderTop: "1px solid #E5E7EB",
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 11, color: "#64748B" }}>
                {filtered.length} of {current.length} products
                {search && (
                  <span style={{ color: "#2563EB" }}> · "{search}"</span>
                )}
                {catFilter !== "ALL" && (
                  <span style={{ color: CATEGORIES[catFilter]?.color }}>
                    {" "}
                    · {CATEGORIES[catFilter]?.label}
                  </span>
                )}
              </span>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  fontSize: 11,
                  color: "#64748B",
                }}
              >
                <span>
                  QT:{" "}
                  <strong style={{ color: "#0F172A" }}>
                    {filtered.reduce((s, p) => s + p.qty, 0)}
                  </strong>
                </span>
                <span style={{ color: "#DC2626" }}>
                  Low:{" "}
                  <strong>
                    {filtered.filter((p) => p.qty <= p.minQty).length}
                  </strong>
                </span>
                <span style={{ color: "#7C3AED" }}>
                  Out:{" "}
                  <strong>{filtered.filter((p) => p.qty === 0).length}</strong>
                </span>
              </div>
            </div>
          </div>

          {importMode === "excel" && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 16px",
                background: "#EFF6FF",
                borderRadius: 10,
                border: "1.5px solid #BFDBFE",
                fontSize: 11,
                color: "#1E40AF",
              }}
            >
              <strong>📊 Excel Format:</strong> S.N | Product Name | QT — ya —
              Product Name | QT | Min QT
            </div>
          )}
        </div>

        {/* ── Sidebar: Alerts ── */}
        {allAlerts.length > 0 && (
          <div style={{ width: 280, flexShrink: 0 }}>
            <div style={S.card}>
              <div
                style={{
                  padding: "12px 14px",
                  background: "#FEF2F2",
                  borderBottom: "1px solid #FEE2E2",
                }}
              >
                <span
                  style={{ fontWeight: 800, fontSize: 13, color: "#991B1B" }}
                >
                  🚨 Alerts ({allAlerts.length})
                </span>
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {allAlerts.slice(0, 20).map((p) => (
                  <div
                    key={p.id}
                    style={{
                      padding: "10px 14px",
                      borderBottom: "1px solid #F3F4F6",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#0F172A",
                        marginBottom: 2,
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>
                      {p._tab} · {p.qty} {p.unit || ""}
                    </div>
                    {p.reorderNote && (
                      <div
                        style={{ fontSize: 10, color: "#D97706", marginTop: 2 }}
                      >
                        ↺ {p.reorderNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {showLog && (
              <div style={{ ...S.card, marginTop: 16 }}>
                <div
                  style={{
                    padding: "12px 14px",
                    background: "#F8FAFC",
                    borderBottom: "1px solid #E5E7EB",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontWeight: 800, fontSize: 13, color: "#374151" }}
                  >
                    📋 Change Log
                  </span>
                  <button
                    onClick={() => setShowLog(false)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#9CA3AF",
                      fontSize: 18,
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {changeLog.length === 0 ? (
                    <p
                      style={{
                        padding: "24px 14px",
                        textAlign: "center",
                        color: "#9CA3AF",
                        fontSize: 12,
                      }}
                    >
                      No changes yet
                    </p>
                  ) : (
                    changeLog.map((e) => {
                      const cols = {
                        ADD: ["#D1FAE5", "#065F46"],
                        DELETE: ["#FEE2E2", "#991B1B"],
                        IMPORT: ["#DBEAFE", "#1E40AF"],
                        EDIT: ["#FEF3C7", "#92400E"],
                        QTY: ["#F0FDF4", "#166534"],
                      };
                      const [bg, col] = cols[e.action] || [
                        "#F3F4F6",
                        "#374151",
                      ];
                      return (
                        <div
                          key={e.id}
                          style={{
                            padding: "10px 14px",
                            borderBottom: "1px solid #F3F4F6",
                          }}
                        >
                          <div
                            style={{ display: "flex", gap: 6, marginBottom: 3 }}
                          >
                            <span
                              style={{
                                background: bg,
                                color: col,
                                fontSize: 9,
                                fontWeight: 800,
                                padding: "2px 6px",
                                borderRadius: 5,
                              }}
                            >
                              {e.action}
                            </span>
                            <span style={{ fontSize: 10, color: "#94A3B8" }}>
                              {TABS.find((t) => t.id === e.tab)?.label}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 11,
                              color: "#374151",
                              lineHeight: 1.4,
                            }}
                          >
                            {e.details}
                          </p>
                          <p
                            style={{
                              margin: "3px 0 0",
                              fontSize: 10,
                              color: "#94A3B8",
                            }}
                          >
                            {e.time}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mobile bottom bar ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "#0F172A",
          display: "flex",
          borderTop: "1px solid #1E293B",
          zIndex: 100,
        }}
      >
        {[
          { id: "stock", icon: "📦", label: "Stock" },
          {
            id: "alerts",
            icon: "🚨",
            label: `Alerts${allAlerts.length > 0 ? " (" + allAlerts.length + ")" : ""}`,
          },
          { id: "add", icon: "＋", label: "Add" },
          { id: "pdf", icon: "📄", label: "PDF" },
          { id: "log", icon: "📋", label: "Log" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === "add") {
                setAddMode(true);
                setNewRow(EMPTY_PRODUCT);
              } else if (item.id === "pdf")
                exportPDF(stocks, activeTab, tabLabel, false, catFilter);
              else if (item.id === "log") setShowLog((v) => !v);
              else setMobileTab(item.id);
            }}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color:
                mobileTab === item.id || (item.id === "log" && showLog)
                  ? "#F59E0B"
                  : "#64748B",
              cursor: "pointer",
              padding: "10px 4px 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 700 }}>{item.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity:.6; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:#F1F5F9; }
        ::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:4px; }
        input, select, textarea { color: #000 !important; }
      `}</style>
    </div>
  );
}
