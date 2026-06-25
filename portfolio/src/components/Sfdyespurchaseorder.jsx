import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";

const PRICE_TIERS = ["DP7", "DP45", "RSP"];

const HEADER_KEYWORDS = [
  "code",
  "sku",
  "name",
  "product",
  "item",
  "description",
  "category",
  "sr",
  "sno",
  "no",
  "dp7",
  "dp45",
  "rsp",
];

// Package size config: category keyword → default kg
const PKG_DEFAULTS_CONFIG = [
  { key: "ecofast", label: "Ecofast", defaultKg: 12 },
  { key: "ecosol", label: "Ecosol", defaultKg: 35 },
];

const tierInfo = {
  DP7: { color: "#4ade80", desc: "Dealer ≥7 days" },
  DP45: { color: "#60a5fa", desc: "Dealer 45-day" },
  RSP: { color: "#f472b6", desc: "Retail price" },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function detectHeaderRowIndex(rawRows, scanLimit = 15) {
  let bestIdx = -1,
    bestScore = 0;
  const limit = Math.min(rawRows.length, scanLimit);
  for (let r = 0; r < limit; r++) {
    const row = rawRows[r] || [];
    const score = row.filter((cell) => {
      const c = String(cell ?? "")
        .toLowerCase()
        .replace(/[\s_.-]/g, "");
      return (
        c && HEADER_KEYWORDS.some((k) => c.includes(k.replace(/[\s_.-]/g, "")))
      );
    }).length;
    if (score > bestScore && score >= 2) {
      bestScore = score;
      bestIdx = r;
    }
  }
  return bestIdx;
}

function findCol(cols, keywords) {
  return cols.find((c) =>
    keywords.some((k) =>
      c
        .toLowerCase()
        .replace(/[\s_-]/g, "")
        .includes(k.toLowerCase().replace(/[\s_-]/g, "")),
    ),
  );
}

function detectCategory(name, category) {
  const s = (name + " " + category).toLowerCase();
  if (s.includes("ecofast")) return "ecofast";
  if (s.includes("ecosol")) return "ecosol";
  return null;
}

function formatDate(d) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${parseInt(day)} ${months[parseInt(m) - 1]} ${y}`;
}

// Returns true if qty is an exact multiple of pkgSize (within float tolerance)
function isExactMultiple(qty, pkgSize) {
  const q = parseFloat(qty);
  const p = parseFloat(pkgSize);
  if (!q || !p || p <= 0) return true; // empty/zero: no error
  const ratio = q / p;
  return Math.abs(ratio - Math.round(ratio)) < 0.0001;
}

// Nearest valid multiple of pkgSize (rounds down)
function snapDown(qty, pkgSize) {
  const q = parseFloat(qty);
  const p = parseFloat(pkgSize);
  if (!q || !p || p <= 0) return qty;
  return Math.floor(q / p) * p;
}

// Nearest valid multiple of pkgSize (rounds up)
function snapUp(qty, pkgSize) {
  const q = parseFloat(qty);
  const p = parseFloat(pkgSize);
  if (!q || !p || p <= 0) return qty;
  return Math.ceil(q / p) * p;
}

// ── Print CSS ───────────────────────────────────────────────────────────────

const PRINT_CSS = `
@media print {
  @page { size: A4 portrait; margin: 12mm 14mm 14mm 14mm; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { background: #fff !important; }
  .screen-only { display: none !important; }

  .print-doc {
    display: block !important;
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 9pt; color: #111; background: #fff;
  }
  .print-doc * { box-sizing: border-box; }

  .print-header {
    display: flex !important;
    align-items: flex-start; justify-content: space-between;
    margin-bottom: 0; padding-bottom: 0;
  }
  .print-logo-col { display: flex !important; flex-direction: column; gap: 3pt; }
  .print-company-name {
  font-family: 'EB Garamond', 'Georgia', serif;
  font-size: 22pt;
  font-weight: 700;
  letter-spacing: -0.2pt;
}
  .print-company-tagline { font-size: 6.5pt; color: #999; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; }

  .print-po-col { text-align: right; }
  .print-po-eyebrow { font-size: 6pt; font-weight: 700; color: #999; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 3pt; }
  .print-po-number { font-size: 15pt; font-weight: 900; color: #111; letter-spacing: -0.4pt; font-family: 'JetBrains Mono','Courier New',monospace; line-height: 1.1; }
  .print-po-date { font-size: 8pt; color: #555; margin-top: 4pt; }

  .print-rule { border: none; border-top: 2pt solid #111; margin: 10pt 0; }

  .print-section-eye { font-size: 6pt; font-weight: 800; color: #999; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 5pt; }

  .print-table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
  .print-table thead { display: table-header-group; }
  .print-table tbody tr { page-break-inside: avoid; }
  .print-table thead tr { background: #111 !important; }
  .print-table thead th {
    padding: 5pt 8pt; font-size: 6.5pt; font-weight: 800;
    color: #fff !important; letter-spacing: 0.12em; text-transform: uppercase;
    text-align: left; white-space: nowrap;
  }
  .print-table thead th.r { text-align: right; }
  .print-table tbody tr:nth-child(even) { background: #f9f9f9 !important; }
  .print-table tbody tr:nth-child(odd)  { background: #fff !important; }
  .print-table tbody td {
    padding: 5pt 8pt; font-size: 8.5pt; color: #111;
    border-bottom: 0.5pt solid #ebebeb; vertical-align: middle;
  }
  .print-table tbody td.r    { text-align: right; }
  .print-table tbody td.mono { font-family: 'JetBrains Mono','Courier New',monospace; font-size: 7.5pt; }
  .print-table tbody td.bold { font-weight: 700; }
  .print-table tbody td.dim  { color: #aaa; font-size: 7.5pt; }

  .print-pkg-badge {
    display: inline-block; background: #f3e8ff; color: #6b21a8;
    border-radius: 3pt; padding: 1pt 5pt; font-size: 6pt; font-weight: 800; letter-spacing: .06em;
  }

  .print-sub-row td {
    background: #f2f2f2 !important; border-top: 1.5pt solid #111 !important;
    border-bottom: none !important; padding: 6pt 8pt !important;
    font-size: 8.5pt; font-weight: 700 !important; color: #111 !important;
  }

  .print-totals {
    width: 42%; margin-left: auto;
    border: 1pt solid #ddd; border-radius: 6pt; overflow: hidden; margin-top: 10pt;
  }
  .print-total-row { display: flex !important; justify-content: space-between; padding: 5pt 11pt; border-bottom: 0.5pt solid #eee; font-size: 8.5pt; }
  .print-total-row:last-child { border-bottom: none; }
  .print-total-label { color: #666; font-weight: 500; }
  .print-total-val   { font-weight: 700; color: #111; }
  .print-grand { background: #111 !important; padding: 8pt 11pt !important; }
  .print-grand .print-total-label { color: #ccc !important; font-weight: 700; font-size: 8.5pt; }
  .print-grand .print-total-val   { color: #fff !important; font-weight: 900; font-size: 11pt; }

  .print-footer {
    margin-top: 14pt; padding-top: 8pt; border-top: 1pt solid #eee;
    display: flex !important; justify-content: space-between;
    font-size: 6.5pt; color: #bbb; font-weight: 500;
  }
}
@media screen { .print-doc { display: none; } }
`;

// ── Component ───────────────────────────────────────────────────────────────

export default function SFDyesPurchaseOrder() {
  const [poNumber, setPoNumber] = useState("SNI/001/26-27");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerName, setCustomerName] = useState("");
  const [priceTier, setPriceTier] = useState("DP7");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [orderItems, setOrderItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [uploadLabel, setUploadLabel] = useState(
    "Upload price list (.xlsx / .csv)",
  );
  const [uploadedFile, setUploadedFile] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  // pkgDefaults: { ecofast: 12, ecosol: 35, _other: 12 }
  const [pkgDefaults, setPkgDefaults] = useState(
    Object.fromEntries([
      ...PKG_DEFAULTS_CONFIG.map((c) => [c.key, c.defaultKg]),
      ["_other", 12],
    ]),
  );

  // Track which rows have an invalid qty (not a multiple of pkg size)
  // key = item._id, value = { enteredQty, nearDown, nearUp }
  const [qtyErrors, setQtyErrors] = useState({});

  const fileInputRef = useRef(null);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Inject print CSS
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "sf-print-css";
    style.textContent = PRINT_CSS;
    if (!document.getElementById("sf-print-css"))
      document.head.appendChild(style);
    return () => {
      const el = document.getElementById("sf-print-css");
      if (el) el.remove();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      )
        setShowSearch(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Derived helpers ──────────────────────────────────────────────────────

  const getDefaultPkgForProduct = useCallback(
    (product) => {
      const cat = detectCategory(product.name, product.category || "");
      if (cat && pkgDefaults[cat] != null) return pkgDefaults[cat];
      return pkgDefaults["_other"] || 12;
    },
    [pkgDefaults],
  );

  const getPrice = (item) => item.prices?.[priceTier] ?? 0;
  const getTotal = (item) => (parseFloat(item.qty) || 0) * getPrice(item);

  const computePkgCount = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const pkg = parseFloat(item.pkgSize) || 1;
    return Math.round((qty / pkg) * 10) / 10;
  };

  const fmtQty = (q) => {
    const n = parseFloat(q) || 0;
    return n % 1 === 0 ? String(n) : n.toFixed(2);
  };

  const fmtMoney = (v) =>
    v.toLocaleString("en-IN", { maximumFractionDigits: 0 });

  // ── Totals ───────────────────────────────────────────────────────────────

  const hasQtyErrors = Object.keys(qtyErrors).length > 0;
  const totalItems = orderItems.length;
  const totalQty = orderItems.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
  const totalPkgs = orderItems.reduce((s, i) => s + computePkgCount(i), 0);
  const orderValue = orderItems.reduce((s, i) => s + getTotal(i), 0);
  const gstAmount = orderValue * 0.18;
  const grandTotal = orderValue + gstAmount;

  // ── File upload ───────────────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setUploadStatus({ type: "loading", msg: `Reading ${file.name}…` });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const merged = new Map();
      const sheetsUsed = [];

      wb.SheetNames.forEach((sheetName) => {
        const ws = wb.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
          blankrows: false,
        });
        if (!rawRows.length) return;
        const headerRowIdx = detectHeaderRowIndex(rawRows);
        if (headerRowIdx === -1) return;
        const headerRow = rawRows[headerRowIdx].map(
          (h, i) => String(h ?? "").trim() || `Col${i + 1}`,
        );
        const rows = rawRows
          .slice(headerRowIdx + 1)
          .filter((r) => r.some((c) => String(c ?? "").trim() !== ""));
        if (!rows.length) return;

        const codeCol = findCol(headerRow, ["code", "productcode", "sku"]);
        const nameCol = findCol(headerRow, [
          "name",
          "productname",
          "itemname",
          "description",
          "product",
        ]);
        const catCol = findCol(headerRow, ["category", "cat", "type", "group"]);
        const tierCols = {};
        PRICE_TIERS.forEach((t) => {
          const found = headerRow.find(
            (c) =>
              c.toUpperCase().replace(/[\s_]/g, "") ===
              t.toUpperCase().replace(/[\s_]/g, ""),
          );
          if (found) tierCols[t] = found;
        });
        if (!nameCol && !codeCol) return;

        const tierKeys = Object.keys(tierCols);
        let sheetHadRows = false;

        rows.forEach((r) => {
          const row = {};
          headerRow.forEach((h, i) => {
            row[h] = r[i] ?? "";
          });
          const name = nameCol ? String(row[nameCol] ?? "").trim() : "";
          if (!name) return;
          const allPricesBlank =
            tierKeys.length > 0 &&
            tierKeys.every((t) => String(row[tierCols[t]] ?? "").trim() === "");
          const hasCode = codeCol && String(row[codeCol] ?? "").trim();
          if (allPricesBlank && !hasCode) return;

          const code = codeCol ? String(row[codeCol] ?? "").trim() : "";
          const category = catCol
            ? String(row[catCol] ?? "").trim() || "General"
            : "General";
          const prices = Object.fromEntries(
            PRICE_TIERS.map((t) => [
              t,
              tierCols[t] ? parseFloat(row[tierCols[t]]) || 0 : 0,
            ]),
          );

          sheetHadRows = true;
          const key = name.toUpperCase();
          const existing = merged.get(key);
          if (!existing) {
            merged.set(key, {
              code,
              name,
              category,
              prices,
              _id: `imp_${merged.size}`,
            });
          } else {
            if (code) existing.code = code;
            if (category !== "General") existing.category = category;
            PRICE_TIERS.forEach((t) => {
              if (prices[t] > 0) existing.prices[t] = prices[t];
            });
          }
        });

        if (sheetHadRows) sheetsUsed.push(sheetName);
      });

      if (merged.size === 0)
        throw new Error(
          "No recognizable price data found. Expected columns: Code, Name, DP7, DP45, RSP.",
        );

      const parsed = Array.from(merged.values());
      setProducts(parsed);
      setOrderItems([]);
      setUploadedFile(true);
      setUploadLabel(`${parsed.length} products · ${file.name}`);
      const sheetNote =
        sheetsUsed.length > 1
          ? ` (merged from ${sheetsUsed.length} sheets: ${sheetsUsed.join(", ")})`
          : "";
      setUploadStatus({
        type: "success",
        msg: `${parsed.length} products loaded from ${file.name}${sheetNote}`,
      });
      setTimeout(() => setUploadStatus(null), 5000);
    } catch (err) {
      setUploadStatus({ type: "error", msg: err.message });
    }
  }, []);

  // ── Order mutations ───────────────────────────────────────────────────────

  const addItem = (product) => {
    const defPkg = getDefaultPkgForProduct(product);
    setOrderItems((prev) => {
      const exists = prev.find((i) => i._id === product._id);
      if (exists)
        return prev.map((i) =>
          i._id === product._id
            ? { ...i, qty: (parseFloat(i.qty) || 0) + defPkg }
            : i,
        );
      return [...prev, { ...product, qty: defPkg, pkgSize: defPkg }];
    });
    setSearchQuery("");
    setShowSearch(false);
  };

  const removeItem = (_id) => {
    setOrderItems((prev) => prev.filter((i) => i._id !== _id));
    setQtyErrors((prev) => {
      const next = { ...prev };
      delete next[_id];
      return next;
    });
  };

  const updateQty = (_id, value) => {
    // Allow free typing; validate immediately and flag error if not a multiple
    setOrderItems((prev) =>
      prev.map((i) => (i._id === _id ? { ...i, qty: value } : i)),
    );
    setQtyErrors((prev) => {
      const item = orderItems.find((i) => i._id === _id);
      if (!item) return prev;
      const pkgKg = item.pkgSize || getDefaultPkgForProduct(item);
      if (isExactMultiple(value, pkgKg)) {
        const next = { ...prev };
        delete next[_id];
        return next;
      }
      const q = parseFloat(value);
      return {
        ...prev,
        [_id]: {
          enteredQty: value,
          nearDown: snapDown(value, pkgKg),
          nearUp: snapUp(value, pkgKg),
          pkgKg,
        },
      };
    });
  };

  // Snap qty to nearest valid multiple when user leaves the field
  const handleQtyBlur = (_id) => {
    const item = orderItems.find((i) => i._id === _id);
    if (!item) return;
    const pkgKg = item.pkgSize || getDefaultPkgForProduct(item);
    if (!isExactMultiple(item.qty, pkgKg)) {
      // Don't auto-snap — keep error visible so user decides
    }
  };

  // User clicks a suggestion pill to snap to nearDown or nearUp
  const snapQtyTo = (_id, snapVal) => {
    setOrderItems((prev) =>
      prev.map((i) => (i._id === _id ? { ...i, qty: snapVal } : i)),
    );
    setQtyErrors((prev) => {
      const next = { ...prev };
      delete next[_id];
      return next;
    });
  };

  const updatePkgSize = (_id, value) => {
    const newPkg = parseInt(value) || 1;
    setOrderItems((prev) =>
      prev.map((i) => (i._id === _id ? { ...i, pkgSize: newPkg } : i)),
    );
    // Re-validate qty against new pkg size
    setQtyErrors((prev) => {
      const item = orderItems.find((i) => i._id === _id);
      if (!item) return prev;
      const q = item.qty;
      if (isExactMultiple(q, newPkg)) {
        const next = { ...prev };
        delete next[_id];
        return next;
      }
      return {
        ...prev,
        [_id]: {
          enteredQty: q,
          nearDown: snapDown(q, newPkg),
          nearUp: snapUp(q, newPkg),
          pkgKg: newPkg,
        },
      };
    });
  };

  const updatePkgDefault = (key, value) => {
    const val = parseInt(value) || 1;
    setPkgDefaults((prev) => ({ ...prev, [key]: val }));
  };

  const clearOrder = () => {
    if (
      orderItems.length > 0 &&
      !window.confirm("Clear all items from this order?")
    )
      return;
    setOrderItems([]);
    setQtyErrors({});
    setCustomerName("");
    setDate(new Date().toISOString().split("T")[0]);
    setPoNumber("SNI/001/26-27");
  };

  // ── Search filter ─────────────────────────────────────────────────────────

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      q.length > 0 &&
      (p.name.toLowerCase().includes(q) ||
        (p.code && p.code.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)))
    );
  });

  // ── CSV export ────────────────────────────────────────────────────────────

  const downloadCSV = () => {
    const rows = [
      ["Sainath Industries — Purchase Order"],
      ["PO Number", poNumber],
      ["Date", date],
      ["Customer", customerName],
      ["Price Tier", priceTier],
      [],
      [
        "#",
        "Code",
        "Product Name",
        "Rate (₹/kg)",
        "Pkg Size (kg)",
        "Packages",
        "Qty (kg)",
        "Total (₹)",
      ],
      ...orderItems.map((item, i) => [
        i + 1,
        item.code,
        item.name,
        getPrice(item),
        item.pkgSize || getDefaultPkgForProduct(item),
        Math.round(computePkgCount(item) * 10) / 10,
        item.qty,
        getTotal(item).toFixed(2),
      ]),
      [],
      ["", "", "", "", "", "Total Items", totalItems],
      ["", "", "", "", "", "Total Packages", Math.round(totalPkgs * 10) / 10],
      ["", "", "", "", "", "Total Qty (kg)", totalQty.toFixed(2)],
      ["", "", "", "", "", "Subtotal (₹)", orderValue.toFixed(2)],
      ["", "", "", "", "", "GST @ 18% (₹)", gstAmount.toFixed(2)],
      ["", "", "", "", "", "Grand Total (₹)", grandTotal.toFixed(2)],
    ];
    const csv = rows
      .map((r) =>
        r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${poNumber}.csv`,
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Shared input style ────────────────────────────────────────────────────

  const inputStyle = {
    width: "100%",
    background: "#0d0d10",
    border: "1px solid #1e2030",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#f1f5f9",
    fontSize: 13,
    fontWeight: 500,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const focusGreen = (e) => (e.target.style.borderColor = "#4ade80");
  const blurNeutral = (e) => (e.target.style.borderColor = "#1e2030");

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* ══ PRINT DOCUMENT ══════════════════════════════════════════════════ */}
      <div className="print-doc">
        <div className="print-header">
          <div className="print-logo-col">
            <div className="print-company-name">SAINATH INDUSTRIES</div>
            <div className="print-company-tagline">Purchase Order</div>
          </div>
          <div className="print-po-col">
            <div className="print-po-eyebrow">PO Number</div>
            <div className="print-po-number">{poNumber}</div>
            <div className="print-po-date">
              {formatDate(date)} · {customerName || "—"} · {priceTier}
            </div>
          </div>
        </div>
        <hr className="print-rule" />

        <div className="print-section-eye">Order Items</div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: "20pt" }}>#</th>
              <th style={{ width: "50pt" }}>Code</th>
              <th>Product Name</th>
              <th className="r" style={{ width: "48pt" }}>
                Rate ₹/kg
              </th>
              <th className="r" style={{ width: "54pt" }}>
                Package
              </th>
              <th className="r" style={{ width: "38pt" }}>
                Qty kg
              </th>
              <th className="r" style={{ width: "60pt" }}>
                Amount ₹
              </th>
            </tr>
          </thead>
          <tbody>
            {orderItems.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    color: "#bbb",
                    padding: "20pt",
                    fontStyle: "italic",
                  }}
                >
                  No items on this order.
                </td>
              </tr>
            ) : (
              <>
                {orderItems.map((item, idx) => {
                  const price = getPrice(item);
                  const total = getTotal(item);
                  const pkgKg = item.pkgSize || getDefaultPkgForProduct(item);
                  const pkgCount = computePkgCount(item);
                  return (
                    <tr key={item._id}>
                      <td className="dim">{idx + 1}</td>
                      <td className="mono">{item.code || "—"}</td>
                      <td className="bold">{item.name}</td>
                      <td className="r">{price.toLocaleString("en-IN")}</td>
                      <td className="r">
                        <span className="print-pkg-badge">
                          {pkgKg}kg×{Math.round(pkgCount * 10) / 10}
                        </span>
                      </td>
                      <td className="r bold">{fmtQty(item.qty)}</td>
                      <td className="r bold">{fmtMoney(total)}</td>
                    </tr>
                  );
                })}
                <tr className="print-sub-row">
                  <td colSpan={3}>
                    Total — {totalItems} product{totalItems !== 1 ? "s" : ""}
                  </td>
                  <td></td>
                  <td className="r">{Math.round(totalPkgs * 10) / 10} pkg</td>
                  <td className="r">{fmtQty(totalQty)} kg</td>
                  <td className="r">—</td>
                </tr>
              </>
            )}
          </tbody>
        </table>

        {orderItems.length > 0 && (
          <div className="print-totals">
            <div className="print-total-row">
              <span className="print-total-label">Subtotal</span>
              <span className="print-total-val">₹{fmtMoney(orderValue)}</span>
            </div>
            <div className="print-total-row">
              <span className="print-total-label">GST @ 18%</span>
              <span className="print-total-val">₹{fmtMoney(gstAmount)}</span>
            </div>
            <div className="print-total-row print-grand">
              <span className="print-total-label">Grand Total (incl. GST)</span>
              <span className="print-total-val">₹{fmtMoney(grandTotal)}</span>
            </div>
          </div>
        )}

        <div className="print-footer">
          <span>Sainath Industries · Purchase Order System</span>
          <span>
            {poNumber} · {priceTier}
          </span>
          <span>
            Generated:{" "}
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* ══ SCREEN UI ═══════════════════════════════════════════════════════ */}
      <div
        className="screen-only"
        style={{ minHeight: "100vh", background: "#09090b", color: "#e2e8f0" }}
      >
        {/* TOP BAR */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            background: "rgba(9,9,11,0.97)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid #18181e",
            padding: "0 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 58,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: "linear-gradient(135deg,#4ade80,#22d3ee)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 800, color: "#09090b" }}
                >
                  SI
                </span>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#f1f5f9",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Sainath Industries
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "#3f4254",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Purchase Order System
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#111116",
                  border: "1px solid #18181e",
                  borderRadius: 6,
                  padding: "4px 10px",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: tierInfo[priceTier].color,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: tierInfo[priceTier].color,
                    letterSpacing: "0.06em",
                  }}
                >
                  {priceTier}
                </span>
              </div>
              {totalItems > 0 && (
                <div
                  style={{
                    background: "#4ade80",
                    color: "#09090b",
                    borderRadius: 20,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          style={{
            maxWidth: 1000,
            margin: "0 auto",
            padding: "24px 24px 220px",
          }}
        >
          {/* ORDER META */}
          <div
            style={{
              background: "#111116",
              border: "1px solid #18181e",
              borderRadius: 14,
              padding: "18px 20px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#3f4254",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Order Details
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 2fr",
                gap: 12,
              }}
            >
              {[
                {
                  label: "PO Number",
                  value: poNumber,
                  setter: setPoNumber,
                  type: "text",
                  mono: true,
                  ph: "",
                },
                {
                  label: "Date",
                  value: date,
                  setter: setDate,
                  type: "date",
                  mono: false,
                  ph: "",
                },
                {
                  label: "Customer / Firm Name",
                  value: customerName,
                  setter: setCustomerName,
                  type: "text",
                  mono: false,
                  ph: "Enter customer or firm name",
                },
              ].map((f) => (
                <div key={f.label}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#3f4254",
                      marginBottom: 6,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={f.value}
                    placeholder={f.ph}
                    onChange={(e) => f.setter(e.target.value)}
                    style={{
                      ...inputStyle,
                      fontFamily: f.mono ? "monospace" : "inherit",
                      letterSpacing: f.mono ? "0.04em" : "normal",
                      colorScheme: "dark",
                    }}
                    onFocus={focusGreen}
                    onBlur={blurNeutral}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CONTROLS ROW */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 2fr",
              gap: 12,
              marginBottom: 14,
            }}
          >
            {/* Price tier */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#3f4254",
                  marginBottom: 6,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Price Tier
              </label>
              <div style={{ display: "flex", gap: 4 }}>
                {PRICE_TIERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setPriceTier(t)}
                    title={tierInfo[t].desc}
                    style={{
                      flex: 1,
                      padding: "9px 0",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor:
                        priceTier === t ? tierInfo[t].color : "#18181e",
                      background:
                        priceTier === t ? `${tierInfo[t].color}18` : "#0d0d10",
                      color: priceTier === t ? tierInfo[t].color : "#3f4254",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#3f4254",
                  marginTop: 5,
                  paddingLeft: 2,
                }}
              >
                {tierInfo[priceTier].desc}
              </div>
            </div>

            {/* Upload */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#3f4254",
                  marginBottom: 6,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Price List
              </label>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: "100%",
                  background: "#0d0d10",
                  border: `1px solid ${uploadedFile ? "#4ade8040" : "#18181e"}`,
                  borderRadius: 8,
                  padding: "9px 12px",
                  color: uploadedFile ? "#4ade80" : "#6b7280",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = "#4ade8070")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = uploadedFile
                    ? "#4ade8040"
                    : "#18181e")
                }
              >
                <span style={{ fontSize: 14 }}>{uploadedFile ? "✓" : "↑"}</span>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 160,
                  }}
                >
                  {uploadLabel}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              {uploadedFile && (
                <div
                  style={{
                    fontSize: 10,
                    color: "#3f4254",
                    marginTop: 5,
                    paddingLeft: 2,
                  }}
                >
                  {products.length} products available
                </div>
              )}
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#3f4254",
                  marginBottom: 6,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Search Products
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#3f4254",
                    fontSize: 15,
                    pointerEvents: "none",
                  }}
                >
                  ⌕
                </span>
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                  placeholder={
                    uploadedFile
                      ? "Name, code or category…"
                      : "Upload a price list first"
                  }
                  disabled={!uploadedFile}
                  style={{
                    ...inputStyle,
                    padding: "10px 36px 10px 36px",
                    opacity: uploadedFile ? 1 : 0.45,
                    cursor: uploadedFile ? "text" : "not-allowed",
                  }}
                  onFocus={(e) => {
                    if (uploadedFile) e.target.style.borderColor = "#4ade80";
                  }}
                  onBlur={(e) => (e.target.style.borderColor = "#1e2030")}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearch(false);
                    }}
                    style={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#6b7280",
                      cursor: "pointer",
                      fontSize: 18,
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Dropdown */}
              {showSearch && searchQuery.length > 0 && (
                <div
                  ref={dropdownRef}
                  style={{
                    position: "absolute",
                    zIndex: 100,
                    top: "calc(100% + 4px)",
                    left: 0,
                    right: 0,
                    background: "#111116",
                    border: "1px solid #1e2030",
                    borderRadius: 12,
                    overflow: "hidden",
                    maxHeight: 320,
                    overflowY: "auto",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
                  }}
                >
                  {filteredProducts.length === 0 ? (
                    <div
                      style={{
                        padding: "18px 16px",
                        textAlign: "center",
                        color: "#3f4254",
                        fontSize: 13,
                      }}
                    >
                      No products match "{searchQuery}"
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          padding: "7px 12px",
                          borderBottom: "1px solid #18181e",
                          display: "flex",
                          justifyContent: "space-between",
                          position: "sticky",
                          top: 0,
                          background: "#111116",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            color: "#3f4254",
                            fontWeight: 600,
                          }}
                        >
                          {filteredProducts.length} result
                          {filteredProducts.length !== 1 ? "s" : ""}
                        </span>
                        <span style={{ fontSize: 10, color: "#3f4254" }}>
                          Click to add
                        </span>
                      </div>
                      {filteredProducts.map((p) => {
                        const isInOrder = orderItems.some(
                          (i) => i._id === p._id,
                        );
                        const cat = detectCategory(p.name, p.category || "");
                        const pkgKg = cat
                          ? pkgDefaults[cat]
                          : pkgDefaults["_other"] || 12;
                        return (
                          <button
                            key={p._id}
                            onClick={() => addItem(p)}
                            style={{
                              width: "100%",
                              background: "none",
                              border: "none",
                              padding: "10px 14px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              borderBottom: "1px solid #09090b",
                              transition: "background 0.1s",
                              textAlign: "left",
                            }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "#18181e")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "none")
                            }
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              {p.code && (
                                <div
                                  style={{
                                    fontSize: 9,
                                    color: "#6b7280",
                                    fontWeight: 800,
                                    fontFamily: "monospace",
                                    letterSpacing: "0.06em",
                                    marginBottom: 1,
                                  }}
                                >
                                  {p.code}
                                </div>
                              )}
                              <div
                                style={{
                                  fontSize: 13,
                                  color: "#f1f5f9",
                                  fontWeight: 500,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {p.name}
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                  marginTop: 2,
                                }}
                              >
                                {p.category && p.category !== "General" && (
                                  <span
                                    style={{ fontSize: 9, color: "#3f4254" }}
                                  >
                                    {p.category}
                                  </span>
                                )}
                                {cat && (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      background: "#0891b218",
                                      border: "1px solid #0891b240",
                                      borderRadius: 4,
                                      padding: "1px 6px",
                                      fontSize: 9,
                                      fontWeight: 800,
                                      color: "#67e8f9",
                                    }}
                                  >
                                    {pkgKg}kg
                                  </span>
                                )}
                              </div>
                            </div>
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 800,
                                  color: "#4ade80",
                                }}
                              >
                                ₹
                                {(p.prices[priceTier] || 0).toLocaleString(
                                  "en-IN",
                                )}
                              </div>
                              <div style={{ fontSize: 9, color: "#3f4254" }}>
                                per kg
                              </div>
                              {isInOrder && (
                                <div
                                  style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    color: "#4ade80",
                                    background: "#4ade8015",
                                    borderRadius: 4,
                                    padding: "1px 6px",
                                    marginTop: 2,
                                  }}
                                >
                                  + added
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* STATUS BANNER */}
          {uploadStatus && (
            <div
              style={{
                marginBottom: 12,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                fontWeight: 500,
                borderColor:
                  uploadStatus.type === "success"
                    ? "#14532d"
                    : uploadStatus.type === "error"
                      ? "#7f1d1d"
                      : "#18181e",
                background:
                  uploadStatus.type === "success"
                    ? "#081410"
                    : uploadStatus.type === "error"
                      ? "#150a0a"
                      : "#111116",
                color:
                  uploadStatus.type === "success"
                    ? "#4ade80"
                    : uploadStatus.type === "error"
                      ? "#f87171"
                      : "#94a3b8",
              }}
            >
              <span>
                {uploadStatus.type === "success"
                  ? "✓"
                  : uploadStatus.type === "error"
                    ? "✗"
                    : "⟳"}
              </span>
              {uploadStatus.msg}
            </div>
          )}

          {/* PACKAGE SIZE CONFIG */}
          {uploadedFile && (
            <div
              style={{
                background: "#111116",
                border: "1px solid #18181e",
                borderRadius: 12,
                padding: "14px 16px",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#3f4254",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Default Package Sizes
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: 8,
                }}
              >
                {[
                  ...PKG_DEFAULTS_CONFIG,
                  { key: "_other", label: "Others" },
                ].map((cfg) => (
                  <div
                    key={cfg.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "#0d0d10",
                      border: "1px solid #18181e",
                      borderRadius: 8,
                      padding: "8px 11px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        background: "#0891b218",
                        border: "1px solid #0891b240",
                        borderRadius: 4,
                        padding: "2px 7px",
                        fontSize: 10,
                        fontWeight: 800,
                        color: "#67e8f9",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {cfg.label}
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={pkgDefaults[cfg.key] || 12}
                      onChange={(e) =>
                        updatePkgDefault(cfg.key, e.target.value)
                      }
                      style={{
                        width: 60,
                        background: "#09090b",
                        border: "1px solid #1e2030",
                        borderRadius: 6,
                        padding: "5px 8px",
                        color: "#a78bfa",
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "#3f4254",
                        fontWeight: 600,
                      }}
                    >
                      kg/pkg
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#3f4254", marginTop: 8 }}>
                Auto-detected per product · Override per row below
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!uploadedFile && (
            <div
              style={{
                background: "#111116",
                border: "1.5px dashed #18181e",
                borderRadius: 14,
                padding: "56px 24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  border: "1.5px dashed #1e2030",
                  borderRadius: 14,
                  margin: "0 auto 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 26, color: "#1e2030" }}>↑</span>
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#3f4254",
                  marginBottom: 6,
                }}
              >
                No price list loaded
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#1e2030",
                  maxWidth: 320,
                  margin: "0 auto",
                }}
              >
                Upload an .xlsx or .csv file with columns: Code, Name, DP7,
                DP45, RSP
              </div>
            </div>
          )}

          {/* ORDER TABLE */}
          {uploadedFile && (
            <div
              style={{
                background: "#111116",
                border: "1px solid #18181e",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 78px 1fr 100px 90px 120px 32px",
                  gap: 8,
                  padding: "9px 16px",
                  background: "#0d0d10",
                  borderBottom: "1px solid #18181e",
                }}
              >
                {[
                  "#",
                  "Code",
                  "Product Name",
                  "Rate",
                  "Pkg Size",
                  "Qty (kg)",
                  "",
                ].map((h, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: i === 4 ? "#a78bfa" : "#3f4254",
                      textAlign:
                        i >= 3 ? (i === 4 ? "center" : "right") : "left",
                    }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {/* Qty input style helper */}
              <style>{`
                .sf-qty::-webkit-outer-spin-button,.sf-qty::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
                .sf-qty{-moz-appearance:textfield}
                .sf-row:hover{background:#13131a!important}
              `}</style>

              {orderItems.length === 0 ? (
                <div style={{ padding: "52px 24px", textAlign: "center" }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      border: "1.5px dashed #1e2030",
                      borderRadius: 10,
                      margin: "0 auto 14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 20, color: "#1e2030" }}>+</span>
                  </div>
                  <div
                    style={{ color: "#3f4254", fontSize: 13, fontWeight: 600 }}
                  >
                    No products added
                  </div>
                  <div style={{ color: "#1e2030", fontSize: 11, marginTop: 4 }}>
                    Search a product above to add it to the order
                  </div>
                </div>
              ) : (
                <>
                  {orderItems.map((item, idx) => {
                    const price = getPrice(item);
                    const total = getTotal(item);
                    const pkgKg = item.pkgSize || getDefaultPkgForProduct(item);
                    const pkgCount = computePkgCount(item);
                    const cat = detectCategory(item.name, item.category || "");
                    return (
                      <div
                        key={item._id}
                        className="sf-row"
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "28px 78px 1fr 100px 90px 120px 32px",
                          gap: 8,
                          padding: "12px 16px",
                          borderBottom: "1px solid #0d0d10",
                          alignItems: "center",
                          transition: "background 0.1s",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: "#1e2030",
                          }}
                        >
                          {idx + 1}
                        </span>

                        <div
                          style={{
                            fontSize: 10,
                            color: "#6b7280",
                            fontWeight: 800,
                            fontFamily: "monospace",
                            letterSpacing: "0.04em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.code || "—"}
                        </div>

                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "#e2e8f0",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.name}
                          </div>
                          {item.category && item.category !== "General" && (
                            <div
                              style={{
                                fontSize: 9,
                                color: "#3f4254",
                                marginTop: 1,
                              }}
                            >
                              {item.category}
                            </div>
                          )}
                        </div>

                        {/* Rate */}
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 800,
                              color: "#f1f5f9",
                            }}
                          >
                            ₹{price.toLocaleString("en-IN")}
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              color: "#3f4254",
                              marginTop: 1,
                            }}
                          >
                            per kg
                          </div>
                        </div>

                        {/* Pkg size */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={pkgKg}
                            onChange={(e) =>
                              updatePkgSize(item._id, e.target.value)
                            }
                            className="sf-qty"
                            title="Package size (kg per package)"
                            style={{
                              width: 62,
                              background: "#0d0d10",
                              border: `1px solid ${cat ? "#7c3aed40" : "#18181e"}`,
                              borderRadius: 6,
                              padding: "5px 7px",
                              color: "#a78bfa",
                              fontSize: 12,
                              fontWeight: 700,
                              textAlign: "center",
                              outline: "none",
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = "#a78bfa")
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = cat
                                ? "#7c3aed40"
                                : "#18181e")
                            }
                          />
                          <span
                            style={{
                              fontSize: 9,
                              color: "#6b7280",
                              fontWeight: 600,
                            }}
                          >
                            {pkgCount} pkg
                          </span>
                        </div>

                        {/* Qty + line total */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: 3,
                          }}
                        >
                          <input
                            type="number"
                            min="0"
                            step={pkgKg}
                            value={item.qty === "" ? "" : item.qty}
                            onChange={(e) =>
                              updateQty(item._id, e.target.value)
                            }
                            onBlur={() => handleQtyBlur(item._id)}
                            className="sf-qty"
                            style={{
                              width: "100%",
                              background: "#0d0d10",
                              border: `1px solid ${qtyErrors[item._id] ? "#f87171" : "#18181e"}`,
                              borderRadius: 6,
                              padding: "5px 8px",
                              color: qtyErrors[item._id]
                                ? "#f87171"
                                : "#f1f5f9",
                              fontSize: 13,
                              fontWeight: 700,
                              textAlign: "right",
                              outline: "none",
                              boxSizing: "border-box",
                              transition: "border-color 0.15s",
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = qtyErrors[item._id]
                                ? "#f87171"
                                : "#4ade80")
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = qtyErrors[item._id]
                                ? "#f87171"
                                : "#18181e")
                            }
                          />
                          {qtyErrors[item._id] ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-end",
                                gap: 2,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 9,
                                  color: "#f87171",
                                  fontWeight: 700,
                                }}
                              >
                                Not a multiple of {qtyErrors[item._id].pkgKg} kg
                              </span>
                              <div style={{ display: "flex", gap: 3 }}>
                                <button
                                  onClick={() =>
                                    snapQtyTo(
                                      item._id,
                                      qtyErrors[item._id].nearDown,
                                    )
                                  }
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    color: "#4ade80",
                                    background: "#4ade8015",
                                    border: "1px solid #4ade8040",
                                    borderRadius: 4,
                                    padding: "2px 6px",
                                    cursor: "pointer",
                                    lineHeight: 1.4,
                                  }}
                                  title={`Round down to ${qtyErrors[item._id].nearDown} kg`}
                                >
                                  ↓ {qtyErrors[item._id].nearDown} kg
                                </button>
                                <button
                                  onClick={() =>
                                    snapQtyTo(
                                      item._id,
                                      qtyErrors[item._id].nearUp,
                                    )
                                  }
                                  style={{
                                    fontSize: 9,
                                    fontWeight: 800,
                                    color: "#60a5fa",
                                    background: "#60a5fa15",
                                    border: "1px solid #60a5fa40",
                                    borderRadius: 4,
                                    padding: "2px 6px",
                                    cursor: "pointer",
                                    lineHeight: 1.4,
                                  }}
                                  title={`Round up to ${qtyErrors[item._id].nearUp} kg`}
                                >
                                  ↑ {qtyErrors[item._id].nearUp} kg
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 800,
                                color: "#4ade80",
                              }}
                            >
                              ₹{fmtMoney(total)}
                            </span>
                          )}
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item._id)}
                          title="Remove item"
                          style={{
                            background: "none",
                            border: "none",
                            color: "#1e2030",
                            cursor: "pointer",
                            fontSize: 18,
                            padding: 0,
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "color 0.15s",
                            borderRadius: 4,
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#f87171")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#1e2030")
                          }
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}

                  {/* Summary row */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "28px 78px 1fr 100px 90px 120px 32px",
                      gap: 8,
                      padding: "12px 16px",
                      background: "#0d0d10",
                      borderTop: "1px solid #18181e",
                      alignItems: "center",
                    }}
                  >
                    <span />
                    <span />
                    <span
                      style={{
                        fontSize: 11,
                        color: "#3f4254",
                        fontWeight: 600,
                      }}
                    >
                      {totalItems} product{totalItems !== 1 ? "s" : ""}
                    </span>
                    <span />
                    <span
                      style={{
                        textAlign: "center",
                        fontSize: 11,
                        color: "#a78bfa",
                        fontWeight: 700,
                      }}
                    >
                      {Math.round(totalPkgs * 10) / 10} pkg
                    </span>
                    <span
                      style={{
                        textAlign: "right",
                        fontSize: 12,
                        color: "#6b7280",
                        fontWeight: 700,
                      }}
                    >
                      {fmtQty(totalQty)} kg
                    </span>
                    <span />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* FIXED FOOTER */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(7,7,9,0.98)",
            backdropFilter: "blur(20px)",
            borderTop: "1px solid #18181e",
            zIndex: 50,
          }}
        >
          <div style={{ maxWidth: 1000, margin: "0 auto" }}>
            {/* Error strip — shown when any qty is invalid */}
            {hasQtyErrors && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 20px",
                  background: "#1a0a0a",
                  borderBottom: "1px solid #7f1d1d",
                }}
              >
                <span style={{ fontSize: 13, color: "#f87171" }}>⚠</span>
                <span
                  style={{ fontSize: 11, color: "#f87171", fontWeight: 700 }}
                >
                  {Object.keys(qtyErrors).length} item
                  {Object.keys(qtyErrors).length !== 1 ? "s have" : " has"} qty
                  not matching package size — fix or snap using the ↓ ↑ buttons
                </span>
              </div>
            )}
            {/* Stats strip */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr",
                borderBottom: "1px solid #111116",
              }}
            >
              {[
                {
                  label: "Products",
                  value: totalItems,
                  color: "#94a3b8",
                  large: false,
                },
                {
                  label: "Total Weight",
                  value: `${fmtQty(totalQty)} kg`,
                  color: "#60a5fa",
                  large: false,
                },
                {
                  label: "Packages",
                  value: `${Math.round(totalPkgs * 10) / 10} pkg`,
                  color: "#a78bfa",
                  large: false,
                },
                {
                  label: "Subtotal",
                  value: `₹${fmtMoney(orderValue)}`,
                  color: "#94a3b8",
                  large: false,
                },
                {
                  label: "GST @ 18%",
                  value: `₹${fmtMoney(gstAmount)}`,
                  color: "#fb923c",
                  large: false,
                },
                {
                  label: "Grand Total",
                  value: `₹${fmtMoney(grandTotal)}`,
                  color: "#4ade80",
                  large: true,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 14px",
                    borderRight: i < 5 ? "1px solid #111116" : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: "#3f4254",
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      marginBottom: 2,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: s.large ? 18 : 14,
                      fontWeight: 800,
                      color: s.color,
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 8,
                padding: "10px 20px",
              }}
            >
              <button
                onClick={clearOrder}
                style={{
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "1px solid #18181e",
                  background: "none",
                  color: "#3f4254",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#7f1d1d";
                  e.currentTarget.style.color = "#f87171";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#18181e";
                  e.currentTarget.style.color = "#3f4254";
                }}
              >
                Clear Order
              </button>

              <button
                onClick={() => window.print()}
                style={{
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "1px solid #18181e",
                  background: "none",
                  color: "#94a3b8",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#60a5fa50";
                  e.currentTarget.style.color = "#60a5fa";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#18181e";
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                🖨 Print / Save PDF
              </button>

              <button
                onClick={downloadCSV}
                disabled={orderItems.length === 0 || hasQtyErrors}
                style={{
                  padding: "10px 0",
                  borderRadius: 8,
                  background:
                    orderItems.length > 0 && !hasQtyErrors
                      ? "#4ade80"
                      : "#18181e",
                  border: "1px solid transparent",
                  color:
                    orderItems.length > 0 && !hasQtyErrors
                      ? "#09090b"
                      : "#1e2030",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor:
                    orderItems.length > 0 && !hasQtyErrors
                      ? "pointer"
                      : "not-allowed",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (orderItems.length > 0 && !hasQtyErrors)
                    e.currentTarget.style.background = "#86efac";
                }}
                onMouseLeave={(e) => {
                  if (orderItems.length > 0 && !hasQtyErrors)
                    e.currentTarget.style.background = "#4ade80";
                }}
                title={
                  hasQtyErrors ? "Fix package qty errors before exporting" : ""
                }
              >
                ↓ Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
