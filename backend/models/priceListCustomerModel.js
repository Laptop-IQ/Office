// models/priceListCustomerModel.js
import mongoose from "mongoose";

// One saved price list per customer (per user account).
// `current` = latest snapshot { keys, prices, pricing, opts, savedAt }
// `history` = previous snapshots (newest first, max 5)
const schema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cid: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    city: { type: String, default: "", maxlength: 200 },
    current: { type: mongoose.Schema.Types.Mixed, required: true },
    history: { type: [mongoose.Schema.Types.Mixed], default: [] },
    savedAt: { type: Number, default: () => Date.now() },
  },
  { timestamps: true },
);
schema.index({ owner: 1, cid: 1 }, { unique: true });

export default mongoose.model("PriceListCustomer", schema);
