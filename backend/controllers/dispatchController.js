// controllers/dispatchController.js
import StockWorkspace from "../models/stockModel.js";

const genId = () => Date.now() + Math.floor(Math.random() * 9999);
const nowStr = () =>
  new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

// changeLog + lastUpdated ko wahi shape me update karta hai jo frontend ka
// logAction() karta tha — taaki "Log" tab dispatch/undo ke baad bhi sahi rahe.
const pushLog = (ws, action, tab, details) => {
  ws.changeLog.unshift({ id: genId(), action, tab, details, time: nowStr() });
  if (ws.changeLog.length > 200) ws.changeLog.splice(200);
  ws.lastUpdated[tab] = nowStr();
};

const LOCATIONS = ["sample", "delhi", "faridabad", "shadecard"];

// FIX: package-tracked product (packageSize set hai) ke liye qty ghatne ke
// baad packageCount bhi sync karo, warna qty aur packageCount×packageSize
// alag ho jaate.
const syncPackageCount = (product) => {
  if (product.packageSize && product.packageSize > 0) {
    product.packageCount = Math.floor(product.qty / product.packageSize);
  }
};

// ────────────────────────────────────────────
// CREATE DISPATCH — POST /api/dispatch
// body: { customerName, location, date, note, items: [{ productId, shade, qty }] }
// ────────────────────────────────────────────
export const createDispatch = async (req, res) => {
  try {
    const { invoiceNo, customerName, location, date, note, items } = req.body;

    if (!customerName?.trim())
      return res.status(400).json({ message: "Customer name required" });
    if (!location)
      return res.status(400).json({ message: "Location required" });
    // FIX: location string frontend se aata tha aur seedha ws.stocks[location]
    // index kiya jaata tha, bina whitelist ke — ab valid tab hi allow hai.
    if (!LOCATIONS.includes(location))
      return res.status(400).json({ message: `Unknown location: ${location}` });
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "At least one item required" });

    const ids = items.map((i) => String(i.productId));
    if (new Set(ids).size !== ids.length)
      return res
        .status(400)
        .json({ message: "Same product dobara select hua hai" });

    const ws = await StockWorkspace.findOne({ owner: req.user._id });
    if (!ws) return res.status(404).json({ message: "Workspace not found" });

    const list = ws.stocks[location];
    if (!list)
      return res.status(400).json({ message: `Unknown location: ${location}` });

    // Pass 1 — sab items validate karo. Koi bhi fail ho to yahin return —
    // isse partial dispatch (kuch item deduct, kuch nahi) kabhi save nahi hota.
    const plan = [];
    for (const raw of items) {
      const requestedQty = parseInt(raw.qty, 10);
      if (!raw.productId || !requestedQty || requestedQty <= 0)
        return res.status(400).json({
          message: "Har item ke liye valid product aur quantity chahiye",
        });

      const product = list.find((p) => String(p.id) === String(raw.productId));
      if (!product)
        return res
          .status(404)
          .json({ message: `Product not found (id: ${raw.productId})` });
      if (requestedQty > product.qty)
        return res.status(400).json({
          message: `${product.name}: sirf ${product.qty} ${product.unit} available hai`,
        });

      plan.push({ product, requestedQty, shade: (raw.shade || "").trim() });
    }

    // Pass 2 — ab deduct karo. Pass 1 pura pass ho chuka hai.
    const dispatchItems = plan.map(({ product, requestedQty, shade }) => {
      const prevQty = product.qty;
      product.qty -= requestedQty;
      syncPackageCount(product);
      return {
        productId: product.id,
        productName: product.name,
        shade,
        qtyDispatched: requestedQty,
        unit: product.unit,
        prevQty,
        newQty: product.qty,
      };
    });

    const totalQty = dispatchItems.reduce((s, i) => s + i.qtyDispatched, 0);
    const entry = {
      id: genId(),
      invoiceNo: (invoiceNo || "").trim(), // FIX: pehle yahan padha hi nahi jaata tha
      customerName: customerName.trim(),
      location,
      items: dispatchItems,
      note: (note || "").trim(),
      date: date || new Date().toISOString().split("T")[0],
      time: nowStr(),
      totalQty,
    };

    ws.dispatches.unshift(entry);
    pushLog(
      ws,
      "DISPATCH",
      location,
      `${dispatchItems.length} chemicals → ${entry.customerName}: ${dispatchItems
        .map((i) => `${i.productName}(${i.qtyDispatched}${i.unit})`)
        .join(", ")}`,
    );

    // CRITICAL FIX: Mongoose Mixed type fields mein nested mutation detect
    // nahi hoti — markModified() se explicitly batana padta hai ki kya badla.
    ws.markModified("stocks");
    ws.markModified("dispatches");
    ws.markModified("changeLog");
    ws.markModified("lastUpdated");
    await ws.save();

    // Updated slices wapas bhejte hain taaki frontend seedha local state
    // replace kar sake, bina dobara GET /api/stock call kiye.
    res.status(201).json({
      message: "Dispatch created",
      dispatch: entry,
      stocks: ws.stocks,
      dispatches: ws.dispatches,
      changeLog: ws.changeLog,
      lastUpdated: ws.lastUpdated,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create dispatch", error: err.message });
  }
};

// ────────────────────────────────────────────
// UNDO DISPATCH — POST /api/dispatch/:id/undo
// :id dispatch entry ka numeric `id` hai (Mongo _id nahi)
// ────────────────────────────────────────────
export const undoDispatch = async (req, res) => {
  try {
    const dispatchId = Number(req.params.id);
    const ws = await StockWorkspace.findOne({ owner: req.user._id });
    if (!ws) return res.status(404).json({ message: "Workspace not found" });

    // FIX: strict === compare — createDispatch String() compare karta hai,
    // yahan bhi consistent rakha taaki id type mismatch (number vs string)
    // par "Dispatch not found" na aaye.
    const idx = ws.dispatches.findIndex(
      (d) => String(d.id) === String(dispatchId),
    );
    if (idx === -1)
      return res.status(404).json({ message: "Dispatch not found" });

    const dispatch = ws.dispatches[idx];
    const list = ws.stocks[dispatch.location];
    if (list) {
      for (const item of dispatch.items) {
        const product = list.find(
          (p) => String(p.id) === String(item.productId),
        );
        if (product) {
          product.qty += item.qtyDispatched;
          syncPackageCount(product);
        }
        // Product delete ho chuka ho to silently skip
      }
    }

    pushLog(
      ws,
      "UNDO_DISPATCH",
      dispatch.location,
      `Undo: ${dispatch.customerName} — ${dispatch.items.length} item(s) restored`,
    );

    ws.dispatches.splice(idx, 1);

    // CRITICAL FIX: Mongoose Mixed type nested mutation detect nahi karta.
    ws.markModified("stocks");
    ws.markModified("dispatches");
    ws.markModified("changeLog");
    ws.markModified("lastUpdated");
    await ws.save();

    res.status(200).json({
      message: "Dispatch undone, stock restored",
      stocks: ws.stocks,
      dispatches: ws.dispatches,
      changeLog: ws.changeLog,
      lastUpdated: ws.lastUpdated,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to undo dispatch", error: err.message });
  }
};

// ────────────────────────────────────────────
// UPDATE DISPATCH — PUT /api/dispatch/:id
// FIX: frontend (DispatchTab.jsx handleSaveEditDispatch) ye route hamesha
// call karta tha, lekin backend me controller/route hi nahi tha — result
// 404 aata, "Update failed" dikhta ya "offline mode" me silently local-only
// edit ho jaata jo agle PUT /stock me server data ko overwrite kar deta.
// body: { customerName, date, note, items: [{ productId, shade, qty }] }
// ────────────────────────────────────────────
export const updateDispatch = async (req, res) => {
  try {
    const dispatchId = Number(req.params.id);
    const { customerName, date, note, items } = req.body;

    if (!customerName?.trim())
      return res.status(400).json({ message: "Customer name required" });
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "At least one item required" });
    const ids = items.map((i) => String(i.productId));
    if (new Set(ids).size !== ids.length)
      return res
        .status(400)
        .json({ message: "Same product dobara select hua hai" });

    const ws = await StockWorkspace.findOne({ owner: req.user._id });
    if (!ws) return res.status(404).json({ message: "Workspace not found" });

    const idx = ws.dispatches.findIndex(
      (d) => String(d.id) === String(dispatchId),
    );
    if (idx === -1)
      return res.status(404).json({ message: "Dispatch not found" });

    const dispatch = ws.dispatches[idx];
    const list = ws.stocks[dispatch.location];
    if (!list)
      return res
        .status(400)
        .json({ message: `Unknown location: ${dispatch.location}` });

    // Step 1 — is dispatch ke purane items wapas stock me add karo (memory
    // me, save abhi nahi) taaki availability sahi dikhe naye items validate
    // karte waqt.
    for (const item of dispatch.items) {
      const product = list.find((p) => String(p.id) === String(item.productId));
      if (product) {
        product.qty += item.qtyDispatched;
        syncPackageCount(product);
      }
    }

    // Step 2 — naye items validate karo. Fail hua to function yahin return
    // ho jaata hai — is case me upar ka "add back" state DB me save nahi
    // hota (ws.save() call hi nahi hua), isliye koi corruption nahi hoti.
    const plan = [];
    for (const raw of items) {
      const requestedQty = parseInt(raw.qty, 10);
      if (!raw.productId || !requestedQty || requestedQty <= 0)
        return res.status(400).json({
          message: "Har item ke liye valid product aur quantity chahiye",
        });
      const product = list.find((p) => String(p.id) === String(raw.productId));
      if (!product)
        return res
          .status(404)
          .json({ message: `Product not found (id: ${raw.productId})` });
      if (requestedQty > product.qty)
        return res.status(400).json({
          message: `${product.name}: sirf ${product.qty} ${product.unit} available hai`,
        });
      plan.push({ product, requestedQty, shade: (raw.shade || "").trim() });
    }

    // Step 3 — deduct karo
    const newItems = plan.map(({ product, requestedQty, shade }) => {
      const prevQty = product.qty;
      product.qty -= requestedQty;
      syncPackageCount(product);
      return {
        productId: product.id,
        productName: product.name,
        shade,
        qtyDispatched: requestedQty,
        unit: product.unit,
        prevQty,
        newQty: product.qty,
      };
    });

    dispatch.items = newItems;
    dispatch.customerName = customerName.trim();
    dispatch.date = date || dispatch.date;
    dispatch.note = (note || "").trim();
    dispatch.totalQty = newItems.reduce((s, i) => s + i.qtyDispatched, 0);
    dispatch.edited = true;
    dispatch.editedAt = nowStr();

    pushLog(
      ws,
      "EDIT_DISPATCH",
      dispatch.location,
      `${dispatch.invoiceNo || dispatch.id} updated — ${newItems.length} chemicals → ${dispatch.customerName}`,
    );

    ws.markModified("stocks");
    ws.markModified("dispatches");
    ws.markModified("changeLog");
    ws.markModified("lastUpdated");
    await ws.save();

    res.status(200).json({
      message: "Dispatch updated",
      stocks: ws.stocks,
      dispatches: ws.dispatches,
      changeLog: ws.changeLog,
      lastUpdated: ws.lastUpdated,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update dispatch", error: err.message });
  }
};
