// controllers/stockController.js
import StockWorkspace from "../models/stockModel.js";

/* Har user ka apna ek workspace hota hai. Agar exist nahi karta to
   create kar dete hain (first load pe), taaki frontend ko alag se
   "setup" call na karna pade. */
// FIX: findOne + create do alag steps the — do requests ek saath aayein
// (jaise React StrictMode ka double-mount) to dono ko null milta aur dono
// workspace create kar deti thi. Ab ek hi atomic upsert operation hai.
const getOrCreateWorkspace = (userId) =>
  StockWorkspace.findOneAndUpdate(
    { owner: userId },
    { $setOnInsert: { owner: userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

// ── GET /api/stock ───────────────────────────
// Pura state ek baar me return karta hai (stocks + changeLog + lastUpdated + companyName + dispatches)
// Frontend ka loadData() isi shape ko expect karta hai.
export const getStockData = async (req, res) => {
  try {
    const ws = await getOrCreateWorkspace(req.user._id);
    res.status(200).json({
      locations: ws.locations,
      stocks: ws.stocks || {},
      changeLog: ws.changeLog,
      lastUpdated: ws.lastUpdated || {},
      companyName: ws.companyName,
      dispatches: ws.dispatches, // NEW
      updatedAt: ws.updatedAt,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to load stock data", error: err.message });
  }
};

// ── PUT /api/stock ───────────────────────────
// Pura state overwrite karta hai — saveData() jo localStorage me karta tha,
// wahi kaam yeh route karega, bas server pe.
// Body: { stocks, changeLog, lastUpdated, companyName, dispatches }
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const toStr = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const optNum = (v) =>
  v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v);

const cleanProduct = (p) => ({
  id: toNum(p?.id, Date.now()),
  name: toStr(p?.name),
  qty: toNum(p?.qty),
  minQty: toNum(p?.minQty),
  unit: toStr(p?.unit, 20) || "kg",
  category: toStr(p?.category, 40) || "OTHER",
  batch: toStr(p?.batch, 60),
  expiry: toStr(p?.expiry, 20),
  supplier: toStr(p?.supplier, 80),
  reorderNote: toStr(p?.reorderNote, 200),
  packageSize: optNum(p?.packageSize),
  packageCount: optNum(p?.packageCount),
});

const LOC_ID = /^[a-z0-9_-]{1,40}$/i;
const cleanLocations = (locations, stocks) => {
  const seen = new Set();
  const out = [];
  const src = Array.isArray(locations)
    ? locations
    : Object.keys(stocks).map((id) => ({ id, name: id }));
  for (const l of src.slice(0, 30)) {
    const id = toStr(l?.id, 40);
    const name = toStr(l?.name, 40);
    if (!LOC_ID.test(id) || !name || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name, icon: toStr(l?.icon, 8) || "📦" });
  }
  return out;
};

export const saveStockData = async (req, res) => {
  try {
    const { locations, stocks, changeLog, lastUpdated, companyName, dispatches } =
      req.body;

    if (!stocks || typeof stocks !== "object") {
      return res
        .status(400)
        .json({ message: "`stocks` is required and must be an object" });
    }

    const ws = await getOrCreateWorkspace(req.user._id);

    // Locations are dynamic – every location owns its own product array.
    const locs = cleanLocations(locations, stocks);
    const cleanStocks = {};
    for (const l of locs) {
      const list = Array.isArray(stocks[l.id]) ? stocks[l.id] : [];
      cleanStocks[l.id] = list.map(cleanProduct).filter((p) => p.name);
    }
    ws.locations = locs;
    ws.stocks = cleanStocks;
    ws.markModified("stocks");
    ws.markModified("lastUpdated");
    if (Array.isArray(changeLog)) ws.changeLog = changeLog.slice(0, 200);
    if (lastUpdated && typeof lastUpdated === "object")
      ws.lastUpdated = lastUpdated;
    ws.markModified("lastUpdated");
    if (typeof companyName === "string") ws.companyName = companyName;
    // NEW — pehle silently drop ho raha tha kyunki schema me field hi nahi thi
    if (Array.isArray(dispatches)) ws.dispatches = dispatches;

    await ws.save();

    res.status(200).json({
      message: "Saved",
      updatedAt: ws.updatedAt,
    });
  } catch (err) {
    // FIX: schema validation fail hone par (e.g. ek row ka required field
    // missing) poora save fail hota hai aur error chhup jaata tha. Ab
    // message frontend tak jaata hai taaki "save fail ho raha hai" pata chale.
    res
      .status(500)
      .json({ message: err.message || "Failed to save stock data" });
  }
};

// ── DELETE /api/stock ─────────────────────────
// "Clear All Data" button ke liye — settings modal me localStorage.removeItem ki jagah.
export const clearStockData = async (req, res) => {
  try {
    await StockWorkspace.findOneAndDelete({ owner: req.user._id });
    res.status(200).json({ message: "Cleared" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to clear stock data", error: err.message });
  }
};
