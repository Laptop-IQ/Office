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
  },
  { _id: false }
);
// _id:false because frontend already generates its own numeric `id` field —
// we keep that id so existing React state logic (find/map by id) works unchanged.
productSchema.add({ id: { type: Number, required: true } });

const changeLogSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    action: { type: String, required: true }, // ADD | EDIT | DELETE | QTY | IMPORT
    tab: { type: String, required: true },
    details: { type: String, default: "" },
    time: { type: String, default: "" },
  },
  { _id: false }
);

// One document per "workspace" (a company / store). All 4 tabs live inside it
// as sub-fields, mirroring the `stocks` object shape already used in React.
const stockWorkspaceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
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
  },
  { timestamps: true }
);

const StockWorkspace = mongoose.model("StockWorkspace", stockWorkspaceSchema);
export default StockWorkspace;
