// controllers/priceListController.js
import PriceListWorkspace from "../models/priceListModel.js";
import PriceListCustomer from "../models/priceListCustomerModel.js";

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

// ─── Customer-wise saved price lists ─────────────────────────────────────────
const MAX_CUSTOMERS = 500;
const MAX_BYTES = 3 * 1024 * 1024;
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

// GET /api/pricelist/customers
export const listSavedCustomers = async (req, res) => {
  try {
    const docs = await PriceListCustomer.find({ owner: req.user._id })
      .sort({ savedAt: -1 })
      .lean();
    res.status(200).json({
      customers: docs.map((d) => ({
        id: d.cid,
        name: d.name,
        city: d.city,
        current: d.current,
        history: d.history || [],
        savedAt: d.savedAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load saved price lists" });
  }
};

// PUT /api/pricelist/customers/:cid   body: { name, city, current, history, savedAt }
export const saveSavedCustomer = async (req, res) => {
  try {
    const cid = String(req.params.cid || "");
    if (!/^[\w-]{1,64}$/.test(cid)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    const { name, city, current, history, savedAt } = req.body || {};
    if (!toStr(name) || !isObj(current) || !Array.isArray(current.keys)) {
      return res.status(400).json({ message: "Invalid price list" });
    }
    const hist = Array.isArray(history) ? history.filter(isObj).slice(0, 5) : [];
    if (Buffer.byteLength(JSON.stringify({ current, hist })) > MAX_BYTES) {
      return res.status(400).json({ message: "Price list is too large" });
    }
    const exists = await PriceListCustomer.exists({ owner: req.user._id, cid });
    if (!exists) {
      const count = await PriceListCustomer.countDocuments({ owner: req.user._id });
      if (count >= MAX_CUSTOMERS) {
        return res
          .status(400)
          .json({ message: `Limit reached (${MAX_CUSTOMERS} customers)` });
      }
    }
    await PriceListCustomer.findOneAndUpdate(
      { owner: req.user._id, cid },
      {
        $set: {
          name: toStr(name),
          city: toStr(city),
          current,
          history: hist,
          savedAt: Number(savedAt) || Date.now(),
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to save price list" });
  }
};

// DELETE /api/pricelist/customers/:cid
export const deleteSavedCustomer = async (req, res) => {
  try {
    await PriceListCustomer.deleteOne({
      owner: req.user._id,
      cid: String(req.params.cid || ""),
    });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete price list" });
  }
};
