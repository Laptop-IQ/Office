// models/purchasePriceListModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    code: { type: String, default: "" },
    name: { type: String, required: true },
    category: { type: String, default: "General" },
    dp7: { type: Number, default: 0 },
    dp45: { type: Number, default: 0 },
    rsp: { type: Number, default: 0 },
  },
  { _id: false },
);

// One uploaded price list per user for the /purchase page —
// available on every device / browser they log in from.
const purchasePriceListSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    label: { type: String, default: "" },
    products: { type: [productSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("PurchasePriceList", purchasePriceListSchema);
