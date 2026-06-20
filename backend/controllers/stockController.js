// controllers/stockController.js
import StockWorkspace from "../models/stockModel.js";

/* Har user ka apna ek workspace hota hai. Agar exist nahi karta to
   create kar dete hain (first load pe), taaki frontend ko alag se
   "setup" call na karna pade. */
const getOrCreateWorkspace = async (userId) => {
  let ws = await StockWorkspace.findOne({ owner: userId });
  if (!ws) {
    ws = await StockWorkspace.create({ owner: userId });
  }
  return ws;
};

// ── GET /api/stock ───────────────────────────
// Pura state ek baar me return karta hai (stocks + changeLog + lastUpdated + companyName)
// Frontend ka loadData() isi shape ko expect karta hai.
export const getStockData = async (req, res) => {
  try {
    const ws = await getOrCreateWorkspace(req.user._id);
    res.status(200).json({
      stocks: ws.stocks,
      changeLog: ws.changeLog,
      lastUpdated: ws.lastUpdated,
      companyName: ws.companyName,
      updatedAt: ws.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stock data", error: err.message });
  }
};

// ── PUT /api/stock ───────────────────────────
// Pura state overwrite karta hai — saveData() jo localStorage me karta tha,
// wahi kaam yeh route karega, bas server pe.
// Body: { stocks, changeLog, lastUpdated, companyName }
export const saveStockData = async (req, res) => {
  try {
    const { stocks, changeLog, lastUpdated, companyName } = req.body;

    if (!stocks || typeof stocks !== "object") {
      return res.status(400).json({ message: "`stocks` is required and must be an object" });
    }

    const ws = await getOrCreateWorkspace(req.user._id);

    ws.stocks = {
      sample: stocks.sample || [],
      delhi: stocks.delhi || [],
      faridabad: stocks.faridabad || [],
      shadecard: stocks.shadecard || [],
    };
    if (Array.isArray(changeLog)) ws.changeLog = changeLog.slice(0, 200);
    if (lastUpdated && typeof lastUpdated === "object") ws.lastUpdated = lastUpdated;
    if (typeof companyName === "string") ws.companyName = companyName;

    await ws.save();

    res.status(200).json({
      message: "Saved",
      updatedAt: ws.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to save stock data", error: err.message });
  }
};

// ── DELETE /api/stock ─────────────────────────
// "Clear All Data" button ke liye — settings modal me localStorage.removeItem ki jagah.
export const clearStockData = async (req, res) => {
  try {
    await StockWorkspace.findOneAndDelete({ owner: req.user._id });
    res.status(200).json({ message: "Cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear stock data", error: err.message });
  }
};
