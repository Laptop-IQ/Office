// models/stockModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    qty: { type: Number, default: 0 },
    minQty: { type: Number, default: 0 },
    unit: { type: String, default: "kg" },
    category: { type: String, default: "OTHER" },
    batch: { type: String, default: "" },
    expiry: { type: String, default: "" },
    supplier: { type: String, default: "" },
    reorderNote: { type: String, default: "" },
    // FIX: ye do fields schema me nahi thi, isliye Mongoose (strict mode)
    // har save par chup-chaap hata deta tha — package-tracked products ka
    // packageSize/packageCount server par kabhi save hi nahi hota tha.
    packageSize: { type: Number, default: null },
    packageCount: { type: Number, default: null },
  },
  { _id: false },
);
// _id:false because frontend already generates its own numeric `id` field —
// we keep that id so existing React state logic (find/map by id) works unchanged.
productSchema.add({ id: { type: Number, required: true } });

const changeLogSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    action: { type: String, required: true }, // ADD | EDIT | DELETE | QTY | IMPORT | DISPATCH | UNDO_DISPATCH
    tab: { type: String, required: true },
    details: { type: String, default: "" },
    time: { type: String, default: "" },
  },
  { _id: false },
);

// ── NEW: dispatch item + dispatch entry, embedded the same way products are ──
const dispatchItemSchema = new mongoose.Schema(
  {
    productId: { type: Number, required: true }, // matches product.id, not Mongo _id
    productName: { type: String, required: true },
    shade: { type: String, default: "" },
    qtyDispatched: { type: Number, required: true, min: 1 },
    unit: { type: String, default: "" },
    prevQty: { type: Number, required: true },
    newQty: { type: Number, required: true },
  },
  { _id: false },
);

const dispatchEntrySchema = new mongoose.Schema(
  {
    id: { type: Number, required: true }, // frontend-style numeric id (genId())
    customerName: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    items: { type: [dispatchItemSchema], default: [] },
    note: { type: String, default: "" },
    date: { type: String, default: "" },
    time: { type: String, default: "" },
    totalQty: { type: Number, default: 0 },
    // FIX: frontend invoiceNo bhejta tha aur edited/editedAt set karta tha,
    // lekin schema me fields hi nahi thi — dono chup-chaap drop ho rahe the.
    invoiceNo: { type: String, default: "" },
    edited: { type: Boolean, default: false },
    editedAt: { type: String, default: "" },
  },
  { _id: false },
);

// One document per "workspace" (a company / store). All tabs live inside it
// as sub-fields, mirroring the `stocks` object shape already used in React.
const stockWorkspaceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // FIX: pehle sirf index:true tha — concurrent requests
      // (e.g. React StrictMode double-effect) se ek user ke do workspace
      // ban sakte the, aur data "randomly gayab" hota dikhta.
    },
    companyName: { type: String, default: "My Chemical Store" },
    stocks: {
      sample: { type: [productSchema], default: [] },
      delhi: { type: [productSchema], default: [] },
      faridabad: { type: [productSchema], default: [] },
      shadecard: { type: [productSchema], default: [] },
    },
    changeLog: { type: [changeLogSchema], default: [] },
    lastUpdated: {
      sample: { type: String, default: "" },
      delhi: { type: String, default: "" },
      faridabad: { type: String, default: "" },
      shadecard: { type: String, default: "" },
    },
    // ── NEW — pehle ye field hi missing thi, isliye dispatches save nahi ho rahe the ──
    dispatches: { type: [dispatchEntrySchema], default: [] },
  },
  { timestamps: true },
);

const StockWorkspace = mongoose.model("StockWorkspace", stockWorkspaceSchema);
export default StockWorkspace;
