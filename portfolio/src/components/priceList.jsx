import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import * as XLSX from "xlsx";

// ─── Utilities ────────────────────────────────────────────────────────────────
const calcCustomerPrice = (dp45) => Math.round((Number(dp45) + 15) * 1.3);
const fmtDate = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const STORAGE_KEY = "sf_pricelist_products";
const STORAGE_NAME_KEY = "sf_pricelist_filename";

const saveToStorage = (products, fileName) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    localStorage.setItem(STORAGE_NAME_KEY, fileName);
  } catch {}
};
const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const name = localStorage.getItem(STORAGE_NAME_KEY) || "";
    return { products: data ? JSON.parse(data) : [], fileName: name };
  } catch {
    return { products: [], fileName: "" };
  }
};
const clearStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_NAME_KEY);
  } catch {}
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  Check: ({ size = "w-4 h-4" }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={size}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  ChevronRight: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-4 h-4"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  X: ({ size = "w-4 h-4" }) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={size}
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  User: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="w-5 h-5"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Back: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-4 h-4"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  Search: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="w-4 h-4"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Print: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="w-4 h-4"
    >
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Trash: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="w-4 h-4"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  Upload: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="w-5 h-5"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  FileX: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="w-5 h-5"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
  Refresh: () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="w-4 h-4"
    >
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
};

// ─── Category colours ──────────────────────────────────────────────────────────
const CAT_COLORS = {
  ECOSOL: {
    bg: "bg-violet-500/15",
    text: "text-violet-300",
    border: "border-violet-500/30",
    dot: "#a78bfa",
  },
  "ECOSOL HE": {
    bg: "bg-purple-500/15",
    text: "text-purple-300",
    border: "border-purple-500/30",
    dot: "#c084fc",
  },
  ECOVAT: {
    bg: "bg-sky-500/15",
    text: "text-sky-300",
    border: "border-sky-500/30",
    dot: "#38bdf8",
  },
  ECOPLUS: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
    dot: "#34d399",
  },
  ECOTEMP: {
    bg: "bg-teal-500/15",
    text: "text-teal-300",
    border: "border-teal-500/30",
    dot: "#2dd4bf",
  },
  ECOFAST: {
    bg: "bg-orange-500/15",
    text: "text-orange-300",
    border: "border-orange-500/30",
    dot: "#fb923c",
  },
  "ECOFAST PLUS": {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "border-amber-500/30",
    dot: "#fbbf24",
  },
  "ECOFAST 5G": {
    bg: "bg-yellow-500/15",
    text: "text-yellow-300",
    border: "border-yellow-500/30",
    dot: "#fde047",
  },
  SULFAID: {
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    border: "border-rose-500/30",
    dot: "#fb7185",
  },
  DENIMOZ: {
    bg: "bg-indigo-500/15",
    text: "text-indigo-300",
    border: "border-indigo-500/30",
    dot: "#818cf8",
  },
  PREPARATION: {
    bg: "bg-cyan-500/15",
    text: "text-cyan-300",
    border: "border-cyan-500/30",
    dot: "#22d3ee",
  },
  COLOURATION: {
    bg: "bg-pink-500/15",
    text: "text-pink-300",
    border: "border-pink-500/30",
    dot: "#f472b6",
  },
  FINISHING: {
    bg: "bg-lime-500/15",
    text: "text-lime-300",
    border: "border-lime-500/30",
    dot: "#a3e635",
  },
  SPECIALS: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-300",
    border: "border-yellow-500/30",
    dot: "#facc15",
  },
};
const catColor = (cat) =>
  CAT_COLORS[cat] || {
    bg: "bg-slate-500/15",
    text: "text-slate-300",
    border: "border-slate-500/30",
    dot: "#94a3b8",
  };

// ─── Print CSS ─────────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@media print {
  @page { margin:6mm 6mm; size:A4 portrait; }
  body { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; color-adjust:exact !important; }
  body * { visibility:hidden !important; }
  #sf-print-area, #sf-print-area * { visibility:visible !important; }
  #sf-print-area { position:fixed; inset:0; background:#fff; z-index:9999; overflow:visible; }
  .no-print { display:none !important; }
  .print-page-break { page-break-before:always; }
}
.no-scrollbar::-webkit-scrollbar{display:none}
.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
`;

let styleInjected = false;
const injectStyles = () => {
  if (styleInjected) return;
  const s = document.createElement("style");
  s.innerHTML = GLOBAL_CSS;
  document.head.appendChild(s);
  styleInjected = true;
};

// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [products, setProducts] = useState([]);
  const [fileName, setFileName] = useState("");
  const [parseErr, setParseErr] = useState("");
  const [dragging, setDragging] = useState(false);
  const [hasStored, setHasStored] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const [step, setStep] = useState(0); // 0=upload 1=customer 2=select 3=preview
  const [customerName, setCN] = useState("");
  const [customerCity, setCC] = useState("");

  const [search, setSearch] = useState("");
  const [selCat, setSelCat] = useState("ALL");
  const [selected, setSelected] = useState({});

  const fileRef = useRef();

  useEffect(() => {
    injectStyles();
    const { products: stored, fileName: storedName } = loadFromStorage();
    if (stored.length) {
      setProducts(stored);
      setFileName(storedName);
      setHasStored(true);
      setStep(1);
    }
  }, []);

  // ── Parse Excel ───────────────────────────────────────────────────────────
  const parseFile = useCallback((file) => {
    setParseErr("");
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setParseErr("Please upload an .xlsx, .xls or .csv file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (!rows.length) {
          setParseErr("The sheet appears to be empty.");
          return;
        }
        const norm = (obj) => {
          const o = {};
          Object.keys(obj).forEach((k) => {
            o[k.trim().toLowerCase().replace(/\s+/g, "")] = obj[k];
          });
          return o;
        };
        const mapped = rows
          .map((raw, idx) => {
            const r = norm(raw);
            const sr = r["sr"] ?? r["srno"] ?? r["#"] ?? idx + 1;
            const name =
              r["productname"] ??
              r["name"] ??
              r["product"] ??
              r["description"] ??
              "";
            const code = r["code"] ?? r["productcode"] ?? "";
            const dp7 = parseFloat(r["dp7"] ?? r["dp-7"] ?? 0) || 0;
            const dp45 = parseFloat(r["dp45"] ?? r["dp-45"] ?? 0) || 0;
            const rsp = parseFloat(r["rsp"] ?? 0) || 0;
            const rawCat = String(r["category"] ?? r["cat"] ?? "")
              .trim()
              .toUpperCase();
            const category =
              rawCat && rawCat !== "UNCATEGORISED" ? rawCat : "GENERAL";
            return {
              sr,
              code: String(code).trim(),
              name: String(name).trim(),
              dp7,
              dp45,
              rsp,
              category,
            };
          })
          .filter((p) => p.name);
        if (!mapped.length) {
          setParseErr(
            "No valid product rows found. Check headers: SR, Code, Product Name, DP7, DP45, RSP",
          );
          return;
        }
        setProducts(mapped);
        setFileName(file.name);
        setSelected({});
        saveToStorage(mapped, file.name);
        setHasStored(true);
        setStep(1);
      } catch {
        setParseErr(
          "Could not parse the file. Ensure it is a valid Excel/CSV.",
        );
      }
    };
    reader.readAsBinaryString(file);
  }, []);

  const handleRemoveFile = () => {
    clearStorage();
    setProducts([]);
    setFileName("");
    setSelected({});
    setHasStored(false);
    setConfirmRemove(false);
    setStep(0);
    setCN("");
    setCC("");
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      parseFile(e.dataTransfer.files[0]);
    },
    [parseFile],
  );

  // ── Derived data ──────────────────────────────────────────────────────────
  const categories = useMemo(
    () => ["ALL", ...new Set(products.map((p) => p.category))],
    [products],
  );
  const catCounts = useMemo(() => {
    const c = { ALL: products.length };
    products.forEach((p) => {
      c[p.category] = (c[p.category] || 0) + 1;
    });
    return c;
  }, [products]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const cm = selCat === "ALL" || p.category === selCat;
        const q = search.toLowerCase();
        const sm =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q);
        return cm && sm;
      }),
    [products, selCat, search],
  );

  const key = (p) => `${p.category}||${p.name}`;
  const toggle = (p) => setSelected((s) => ({ ...s, [key(p)]: !s[key(p)] }));
  const selAll = () => {
    const u = {};
    filtered.forEach((p) => {
      u[key(p)] = true;
    });
    setSelected((s) => ({ ...s, ...u }));
  };
  const deselAll = () => setSelected({});

  const selectedProducts = products.filter((p) => selected[key(p)]);
  const grouped = useMemo(() => {
    const g = {};
    selectedProducts.forEach((p) => {
      (g[p.category] = g[p.category] || []).push(p);
    });
    return g;
  }, [selectedProducts]);
  const selCount = selectedProducts.length;

  const handlePrint = () => {
    injectStyles();
    window.print();
  };

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 0 — Upload
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 0)
    return (
      <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 text-[#4f8ef7] mb-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="w-7 h-7"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              SF Dyes Price List
            </h1>
            <p className="text-slate-500 text-sm mt-2">
              Upload your product Excel sheet to get started
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
            ${dragging ? "border-[#4f8ef7] bg-[#4f8ef7]/8 scale-[1.02]" : "border-slate-700 hover:border-slate-500 bg-[#0e1220] hover:bg-[#111827]"}`}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => parseFile(e.target.files[0])}
            />
            <div
              className={`mx-auto mb-4 w-14 h-14 rounded-xl flex items-center justify-center transition-all
            ${dragging ? "bg-[#4f8ef7]/20 text-[#4f8ef7]" : "bg-slate-800 text-slate-500"}`}
            >
              <Icon.Upload />
            </div>
            <p className="text-white font-semibold text-lg mb-1">
              {dragging ? "Drop file here" : "Drag & drop Excel file"}
            </p>
            <p className="text-slate-500 text-sm">
              or click to browse &nbsp;·&nbsp;{" "}
              <span className="text-slate-400">.xlsx .xls .csv</span>
            </p>
          </div>

          {parseErr && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
              <Icon.X />
              {parseErr}
            </div>
          )}

          <div className="mt-5 rounded-xl bg-[#0e1220] border border-slate-800 p-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Expected column headers
            </p>
            <div className="flex flex-wrap gap-2">
              {["SR", "Code", "Product Name", "DP7", "DP45", "RSP"].map((c) => (
                <span
                  key={c}
                  className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg font-mono border border-slate-700"
                >
                  {c}
                </span>
              ))}
              {["Category"].map((c) => (
                <span
                  key={c}
                  className="text-xs bg-slate-900 text-slate-600 px-2.5 py-1 rounded-lg font-mono border border-slate-800"
                >
                  {c} (optional)
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 1 — Customer Details
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 1)
    return (
      <div className="min-h-screen bg-[#080b12] flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md">
          <StepBar current={1} />
          <div className="mt-8 bg-[#0e1220] border border-slate-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-7">
              <div className="w-10 h-10 rounded-xl bg-[#4f8ef7]/10 border border-[#4f8ef7]/20 flex items-center justify-center text-[#4f8ef7]">
                <Icon.User />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg leading-tight">
                  Customer Details
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">
                  Appears on the printed price list
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <Field
                label="Customer / Firm Name *"
                value={customerName}
                onChange={setCN}
                placeholder="e.g. Sai Nath Textiles Pvt Ltd"
              />
              <Field
                label="City / Address (optional)"
                value={customerCity}
                onChange={setCC}
                placeholder="e.g. Surat, Gujarat"
              />
            </div>

            {/* Loaded file info + remove option */}
            <div className="mt-6 rounded-xl bg-[#080b12] border border-slate-800 p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-none">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-4 h-4"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-medium truncate">
                  {fileName}
                </p>
                <p className="text-xs text-slate-600">
                  {products.length} products · saved locally
                </p>
              </div>
              {!confirmRemove ? (
                <button
                  onClick={() => setConfirmRemove(true)}
                  className="flex-none flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/8 hover:bg-red-500/15 text-red-400 text-xs font-semibold border border-red-500/15 transition-all"
                >
                  <Icon.Trash /> Remove
                </button>
              ) : (
                <div className="flex-none flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Sure?</span>
                  <button
                    onClick={handleRemoveFile}
                    className="px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmRemove(false)}
                    className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-600 transition-colors"
                  >
                    No
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setStep(0);
                }}
                className="flex-none px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors flex items-center gap-1.5"
              >
                <Icon.Refresh /> Change File
              </button>
              <button
                onClick={() => customerName.trim() && setStep(2)}
                disabled={!customerName.trim()}
                className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                ${customerName.trim() ? "bg-[#4f8ef7] hover:bg-[#3d7de6] text-white shadow-lg shadow-[#4f8ef7]/15" : "bg-slate-800 text-slate-600 cursor-not-allowed"}`}
              >
                Select Products <Icon.ChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 2 — Product Selection
  // ════════════════════════════════════════════════════════════════════════════
  if (step === 2)
    return (
      <div className="min-h-screen bg-[#080b12] flex flex-col font-sans">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-[#080b12]/95 backdrop-blur border-b border-slate-800/80 px-4 py-3">
          <div className="max-w-6xl mx-auto">
            <StepBar current={2} />

            {/* Search + actions */}
            <div className="flex flex-wrap gap-2.5 mt-3 items-center">
              <div className="relative flex-1 min-w-[180px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                  <Icon.Search />
                </span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product name or code…"
                  className="w-full pl-9 pr-4 py-2 bg-[#0e1220] border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#4f8ef7]/60 transition-colors"
                />
              </div>
              <button
                onClick={selAll}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-[#4f8ef7]/10 text-[#7aabff] hover:bg-[#4f8ef7]/20 transition-colors border border-[#4f8ef7]/15 whitespace-nowrap"
              >
                ✓ Select visible ({filtered.length})
              </button>
              <button
                onClick={deselAll}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-red-500/8 text-red-400 hover:bg-red-500/15 transition-colors border border-red-500/15"
              >
                ✕ Clear all
              </button>
              <span className="ml-auto text-sm font-bold text-white whitespace-nowrap">
                <span className="text-[#4f8ef7]">{selCount}</span>{" "}
                <span className="text-slate-500 font-normal">selected</span>
              </span>
            </div>

            {/* Category pills */}
            <div className="mt-2.5 -mx-4 px-4 overflow-x-auto no-scrollbar">
              <div
                className="flex gap-1.5 pb-0.5"
                style={{ minWidth: "max-content" }}
              >
                {categories.map((cat) => {
                  const isActive = selCat === cat;
                  const cc = catColor(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelCat(cat)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all duration-150
                      ${
                        isActive
                          ? cat === "ALL"
                            ? "bg-white text-[#080b12] border-white shadow-sm"
                            : `${cc.bg.replace("/15", "/30")} ${cc.text} ${cc.border} shadow-sm`
                          : `bg-transparent text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-400`
                      }`}
                    >
                      {cat === "ALL" ? "All" : cat}
                      <span
                        className={`text-[10px] font-black px-1 rounded ${isActive ? (cat === "ALL" ? "text-[#080b12]/60" : "opacity-70") : "text-slate-600"}`}
                      >
                        {catCounts[cat] ?? 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="rounded-2xl border border-slate-800/80 overflow-hidden">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0b0f1a] border-b border-slate-800">
                    <th className="w-10 py-3 px-3 text-center">
                      <div className="w-4 h-4 rounded border border-slate-700 inline-block" />
                    </th>
                    <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-32">
                      Code
                    </th>
                    <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Product Name
                    </th>
                    <th className="py-3 px-4 text-right text-[11px] font-bold text-[#4f8ef7] uppercase tracking-wider w-32">
                      Cust. Price
                    </th>
                    <th className="py-3 px-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider w-36">
                      Category
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-20 text-center text-slate-700 text-sm"
                      >
                        No products match your search
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p, i) => {
                      const k = key(p);
                      const isSel = !!selected[k];
                      const cp = calcCustomerPrice(p.dp45);
                      const cc = catColor(p.category);
                      return (
                        <tr
                          key={k}
                          onClick={() => toggle(p)}
                          className={`border-b border-slate-800/50 cursor-pointer transition-colors duration-75
                        ${isSel ? "bg-[#4f8ef7]/6" : "hover:bg-slate-800/30"}`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <div
                              className={`w-4 h-4 rounded border-2 inline-flex items-center justify-center transition-all
                          ${isSel ? "bg-[#4f8ef7] border-[#4f8ef7]" : "border-slate-600"}`}
                            >
                              {isSel && <Icon.Check size="w-2.5 h-2.5" />}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-xs text-slate-500">
                            {p.code || "—"}
                          </td>
                          <td
                            className={`py-2.5 px-4 font-medium leading-tight ${isSel ? "text-white" : "text-slate-300"}`}
                          >
                            {p.name}
                          </td>
                          <td className="py-2.5 px-4 text-right font-black text-[#4f8ef7]">
                            ₹ {cp}
                          </td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cc.bg} ${cc.text} ${cc.border}`}
                            >
                              {p.category}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sticky bottom-0 bg-[#080b12]/95 backdrop-blur border-t border-slate-800/80 px-4 py-3 no-print">
          <div className="max-w-6xl mx-auto flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Icon.Back /> Back
            </button>
            <button
              onClick={() => selCount > 0 && setStep(3)}
              disabled={selCount === 0}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
              ${selCount > 0 ? "bg-[#4f8ef7] hover:bg-[#3d7de6] text-white shadow-lg shadow-[#4f8ef7]/15" : "bg-slate-800 text-slate-600 cursor-not-allowed"}`}
            >
              Preview & Print &nbsp;·&nbsp; {selCount} products{" "}
              <Icon.ChevronRight />
            </button>
          </div>
        </div>
      </div>
    );

  // ════════════════════════════════════════════════════════════════════════════
  // STEP 3 — Print Preview
  // ════════════════════════════════════════════════════════════════════════════
  const today = fmtDate();

  return (
    <div className="min-h-screen bg-[#080b12] font-sans">
      {/* Screen toolbar */}
      <div className="no-print sticky top-0 z-30 bg-[#080b12]/95 backdrop-blur border-b border-slate-800/80 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={() => setStep(2)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <Icon.Back /> Edit
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {customerName}
            </p>
            <p className="text-slate-500 text-xs">
              {selCount} products · {Object.keys(grouped).length} categories
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-xl bg-[#4f8ef7] hover:bg-[#3d7de6] text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#4f8ef7]/15 transition-all"
          >
            <Icon.Print /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* ─── PRINT DOCUMENT ─────────────────────────────────────────────── */}
      <div id="sf-print-area" className="max-w-5xl mx-auto px-4 py-6">
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 8px 40px #0003",
          }}
        >
          {/* ══ HEADER — solid colors only, no transparency ══ */}
          <div style={{ background: "#0f2554" }}>
            {/* Top accent bar */}
            <div
              style={{
                height: 5,
                background: "linear-gradient(90deg,#3b82f6,#1d4ed8,#1e40af)",
              }}
            />

            {/* Main header content */}
            <div style={{ padding: "28px 40px 22px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 24,
                }}
              >
                {/* Left — company */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 6,
                    }}
                  >
                    {/* Logo box */}
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 10,
                        background: "#1d3a7a",
                        border: "2px solid #2d5299",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#93c5fd"
                        strokeWidth="1.6"
                        style={{ width: 24, height: 24 }}
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: "#ffffff",
                          letterSpacing: "0.01em",
                          lineHeight: 1,
                        }}
                      >
                        SF DYES PRIVATE LIMITED
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#93c5fd",
                          marginTop: 5,
                          fontWeight: 500,
                          letterSpacing: "0.02em",
                        }}
                      >
                        Eco-Friendly Textile Dyes &amp; Auxiliaries
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right — date */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#7dd3fc",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                  >
                    Date Issued
                  </div>
                  <div
                    style={{ fontSize: 17, color: "#ffffff", fontWeight: 800 }}
                  >
                    {today}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      display: "inline-block",
                      background: "#1a3d80",
                      borderRadius: 6,
                      padding: "4px 12px",
                      border: "1px solid #2d5299",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 9,
                        color: "#93c5fd",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      Customer Price List
                    </span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{ height: 1, background: "#1d3a7a", margin: "20px 0" }}
              />

              {/* Customer + Stats row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "#7dd3fc",
                      textTransform: "uppercase",
                      letterSpacing: "0.18em",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Prepared For
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      color: "#ffffff",
                      fontWeight: 900,
                      lineHeight: 1.1,
                    }}
                  >
                    {customerName}
                  </div>
                  {customerCity && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#93c5fd",
                        marginTop: 4,
                        fontWeight: 500,
                      }}
                    >
                      {customerCity}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  {[
                    { label: "Products", value: selCount },
                    { label: "Categories", value: Object.keys(grouped).length },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        textAlign: "center",
                        background: "#1a3d80",
                        borderRadius: 10,
                        padding: "12px 22px",
                        border: "1px solid #2d5299",
                        minWidth: 90,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: "#7dd3fc",
                          textTransform: "uppercase",
                          letterSpacing: "0.14em",
                          fontWeight: 700,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 26,
                          color: "#ffffff",
                          fontWeight: 900,
                          lineHeight: 1,
                          marginTop: 4,
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Category tags strip */}
            <div
              style={{
                background: "#0a1e45",
                borderTop: "1px solid #1d3a7a",
                padding: "9px 40px",
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: "#7dd3fc",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                  marginRight: 6,
                }}
              >
                Includes:
              </span>
              {Object.keys(grouped).map((cat) => (
                <span
                  key={cat}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 20,
                    background: "#1d3a7a",
                    color: "#bfdbfe",
                    border: "1px solid #2d5299",
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* ══ INFO BAR ══ */}
          <div
            style={{
              background: "#f0f6ff",
              borderBottom: "2px solid #dbeafe",
              padding: "8px 40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 10, color: "#475569", fontWeight: 500 }}>
              All prices in &nbsp;
              <strong style={{ color: "#1e3a8a", fontSize: 11 }}>
                ₹ per kg
              </strong>
              &nbsp; · Subject to change without prior notice
            </span>
            <span
              style={{
                fontSize: 9,
                color: "#94a3b8",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              REF: {fileName}
            </span>
          </div>

          {/* ══ PRODUCT TABLES ══ */}
          {Object.entries(grouped).map(([cat, prods], catIdx) => {
            const cc = catColor(cat);
            const dotColor = cc.dot || "#1e3a8a";
            return (
              <div key={cat} className={catIdx > 0 ? "print-page-break" : ""}>
                {/* Category header bar */}
                <div
                  style={{
                    background: "#1e3a8a",
                    padding: "9px 40px",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: dotColor,
                      flexShrink: 0,
                      boxShadow: `0 0 0 2px #1e3a8a, 0 0 0 3px ${dotColor}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "#ffffff",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {cat}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "#93c5fd",
                      fontWeight: 600,
                      marginLeft: 4,
                    }}
                  >
                    {prods.length} item{prods.length > 1 ? "s" : ""}
                  </span>
                </div>

                {/* Column headers */}
                <div
                  style={{
                    background: "#f8faff",
                    borderBottom: "1px solid #dbeafe",
                    display: "grid",
                    gridTemplateColumns: "44px 120px 1fr 120px",
                    padding: "0 40px 0 0",
                  }}
                >
                  {[
                    { label: "#", pl: 40, align: "left" },
                    { label: "Code", pl: 12, align: "left" },
                    { label: "Product Name", pl: 12, align: "left" },
                    {
                      label: "Price (₹/kg)",
                      pl: 12,
                      pr: 40,
                      align: "right",
                      blue: true,
                    },
                  ].map((col) => (
                    <div
                      key={col.label}
                      style={{
                        padding: `7px ${col.pr || 0}px 7px ${col.pl}px`,
                        fontSize: 9,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: col.blue ? "#1e3a8a" : "#94a3b8",
                        textAlign: col.align,
                      }}
                    >
                      {col.label}
                    </div>
                  ))}
                </div>

                {/* Rows */}
                {prods.map((p, i) => {
                  const even = i % 2 === 0;
                  return (
                    <div
                      key={key(p)}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "44px 120px 1fr 120px",
                        background: even ? "#ffffff" : "#f8faff",
                        borderBottom: "1px solid #eef2f8",
                        padding: "0 40px 0 0",
                      }}
                    >
                      <div
                        style={{
                          padding: "9px 12px 9px 40px",
                          color: "#94a3b8",
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        {i + 1}
                      </div>
                      <div
                        style={{
                          padding: "9px 12px",
                          fontFamily: "'Courier New',monospace",
                          fontSize: 10,
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {p.code || "—"}
                      </div>
                      <div
                        style={{
                          padding: "9px 12px",
                          fontWeight: 600,
                          color: "#0f172a",
                          fontSize: 12,
                          lineHeight: 1.35,
                        }}
                      >
                        {p.name}
                      </div>
                      <div
                        style={{
                          padding: "9px 40px 9px 12px",
                          textAlign: "right",
                          fontWeight: 900,
                          fontSize: 14,
                          color: "#1e3a8a",
                          background: even ? "#eff6ff" : "#e8f2fe",
                          borderLeft: "2px solid #dbeafe",
                        }}
                      >
                        ₹ {calcCustomerPrice(p.dp45)}
                      </div>
                    </div>
                  );
                })}

                {/* Category footer */}
                <div
                  style={{
                    background: "#f0f6ff",
                    borderBottom: "2px solid #dbeafe",
                    borderTop: "1px solid #dbeafe",
                    display: "grid",
                    gridTemplateColumns: "44px 120px 1fr 120px",
                    padding: "0 40px 0 0",
                  }}
                >
                  <div style={{ padding: "7px 12px 7px 40px" }} />
                  <div
                    style={{
                      padding: "7px 12px",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#1e3a8a",
                      letterSpacing: "0.04em",
                      gridColumn: "2/4",
                    }}
                  >
                    {cat} &nbsp;·&nbsp; {prods.length} product
                    {prods.length > 1 ? "s" : ""}
                  </div>
                  <div style={{ padding: "7px 40px 7px 12px" }} />
                </div>
              </div>
            );
          })}

          {/* ══ FOOTER ══ */}
          <div
            style={{ background: "#0f2554", borderTop: "3px solid #1d4ed8" }}
          >
            <div
              style={{
                padding: "14px 40px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 10, color: "#93c5fd", fontWeight: 600 }}>
                SF Dyes Private Limited &nbsp;·&nbsp; {today}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#7dd3fc",
                  fontWeight: 700,
                  textAlign: "center",
                  letterSpacing: "0.03em",
                }}
              >
                Confidential — Prepared for:{" "}
                <span style={{ color: "#ffffff" }}>{customerName}</span>
              </div>
              <div style={{ fontSize: 10, color: "#93c5fd", fontWeight: 600 }}>
                Prices in ₹/kg · Not a tax invoice
              </div>
            </div>
            {/* Bottom accent */}
            <div
              style={{
                height: 4,
                background: "linear-gradient(90deg,#3b82f6,#1d4ed8,#1e40af)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StepBar({ current }) {
  const steps = ["Upload", "Customer", "Products", "Preview"];
  return (
    <div className="flex items-center gap-1">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center gap-1 min-w-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all
              ${
                active
                  ? "bg-[#4f8ef7]/15 text-[#4f8ef7] border border-[#4f8ef7]/30"
                  : done
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-slate-700"
              }`}
            >
              {done ? (
                <span className="text-emerald-400">
                  <Icon.Check size="w-3 h-3" />
                </span>
              ) : (
                <span
                  className={`w-4 h-4 rounded-full border text-[10px] flex items-center justify-center
                  ${active ? "border-[#4f8ef7] text-[#4f8ef7]" : "border-slate-800 text-slate-700"}`}
                >
                  {n}
                </span>
              )}
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px w-4 flex-none ${done ? "bg-emerald-500/30" : "bg-slate-800"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-[#080b12] border border-slate-800 rounded-xl text-white placeholder-slate-800
          focus:outline-none focus:border-[#4f8ef7]/50 focus:ring-1 focus:ring-[#4f8ef7]/10 transition-all text-sm"
      />
    </div>
  );
}
