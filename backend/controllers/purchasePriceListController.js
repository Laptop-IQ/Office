// controllers/purchasePriceListController.js
import PurchasePriceList from "../models/purchasePriceListModel.js";

const MAX_PRODUCTS = 10000;
const toStr = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const cleanProduct = (p) => ({
  code: toStr(p?.code, 60),
  name: toStr(p?.name, 200),
  category: toStr(p?.category, 80) || "General",
  dp7: toNum(p?.prices?.DP7),
  dp45: toNum(p?.prices?.DP45),
  rsp: toNum(p?.prices?.RSP),
});

// GET /api/purchase-pricelist
export const getPurchasePriceList = async (req, res) => {
  try {
    const doc = await PurchasePriceList.findOne({ owner: req.user._id }).lean();
    res.status(200).json({
      products: doc?.products || [],
      label: doc?.label || "",
      updatedAt: doc?.updatedAt || null,
    });
  } catch {
    res.status(500).json({ message: "Failed to load price list" });
  }
};

// PUT /api/purchase-pricelist   body: { products: [{code,name,category,prices:{DP7,DP45,RSP}}], label }
export const savePurchasePriceList = async (req, res) => {
  try {
    const { products, label } = req.body || {};
    if (!Array.isArray(products)) {
      return res.status(400).json({ message: "products must be an array" });
    }
    if (products.length > MAX_PRODUCTS) {
      return res
        .status(400)
        .json({ message: `Too many products (max ${MAX_PRODUCTS})` });
    }
    const clean = products.map(cleanProduct).filter((p) => p.name);
    const doc = await PurchasePriceList.findOneAndUpdate(
      { owner: req.user._id },
      { $set: { products: clean, label: toStr(label, 300) } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.status(200).json({
      success: true,
      count: doc.products.length,
      updatedAt: doc.updatedAt,
    });
  } catch {
    res.status(500).json({ message: "Failed to save price list" });
  }
};

// DELETE /api/purchase-pricelist
export const clearPurchasePriceList = async (req, res) => {
  try {
    await PurchasePriceList.deleteOne({ owner: req.user._id });
    res.status(200).json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to clear price list" });
  }
};
