// models/priceListModel.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    sr: { type: mongoose.Schema.Types.Mixed, default: "" },
    code: { type: String, default: "" },
    name: { type: String, required: true },
    category: { type: String, default: "GENERAL" },
    dp7: { type: Number, default: 0 },
    dp45: { type: Number, default: 0 },
    rsp: { type: Number, default: 0 },
  },
  { _id: false },
);

// One uploaded price sheet per user — available on every device they log in from.
const priceListSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fileName: { type: String, default: "" },
    products: { type: [productSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("PriceListWorkspace", priceListSchema);
