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
      stocks: ws.stocks,
      changeLog: ws.changeLog,
      lastUpdated: ws.lastUpdated,
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
export const saveStockData = async (req, res) => {
  try {
    const { stocks, changeLog, lastUpdated, companyName, dispatches } =
      req.body;

    if (!stocks || typeof stocks !== "object") {
      return res
        .status(400)
        .json({ message: "`stocks` is required and must be an object" });
    }

    const ws = await getOrCreateWorkspace(req.user._id);

    ws.stocks = {
      sample: stocks.sample || [],
      delhi: stocks.delhi || [],
      faridabad: stocks.faridabad || [],
      shadecard: stocks.shadecard || [],
    };
    if (Array.isArray(changeLog)) ws.changeLog = changeLog.slice(0, 200);
    if (lastUpdated && typeof lastUpdated === "object")
      ws.lastUpdated = lastUpdated;
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
