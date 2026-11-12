// controllers/priceListController.js
import PriceListWorkspace from "../models/priceListModel.js";

const MAX_PRODUCTS = 10000;
const toStr = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const cleanProduct = (p) => ({
  sr: typeof p?.sr === "number" ? p.sr : toStr(p?.sr, 20),
  code: toStr(p?.code, 60),
  name: toStr(p?.name, 200),
  category: toStr(p?.category, 80).toUpperCase() || "GENERAL",
  dp7: toNum(p?.dp7),
  dp45: toNum(p?.dp45),
  rsp: toNum(p?.rsp),
});

// GET /api/pricelist
export const getPriceList = async (req, res) => {
  try {
    const ws = await PriceListWorkspace.findOne({ owner: req.user._id }).lean();
    res.status(200).json({
      products: ws?.products || [],
      fileName: ws?.fileName || "",
      updatedAt: ws?.updatedAt || null,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load price list" });
  }
};

// PUT /api/pricelist   body: { products, fileName }
export const savePriceList = async (req, res) => {
  try {
    const { products, fileName } = req.body || {};
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "products must be an array" });
    }
    if (products.length > MAX_PRODUCTS) {
      return res
        .status(400)
        .json({ message: `Too many products (max ${MAX_PRODUCTS})` });
    }
    const clean = products.map(cleanProduct).filter((p) => p.name);
    const ws = await PriceListWorkspace.findOneAndUpdate(
      { owner: req.user._id },
      { $set: { products: clean, fileName: toStr(fileName, 200) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.status(200).json({
      success: true,
      count: ws.products.length,
      updatedAt: ws.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to save price list" });
  }
};

// DELETE /api/pricelist
export const clearPriceList = async (req, res) => {
  try {
    await PriceListWorkspace.deleteOne({ owner: req.user._id });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear price list" });
  }
};
