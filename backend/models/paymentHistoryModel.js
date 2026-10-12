import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema({
  entryId: { type: mongoose.Schema.Types.ObjectId, ref: "OverdueEntry" },
  refNo: { type: String, default: "" },
  dated: { type: String, default: "" },
  amount: { type: Number, required: true, min: 0 },
  pendingBefore: { type: Number, default: 0 },
  pendingAfter: { type: Number, default: 0 },
}, { _id: false });

const paymentHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  account: { type: String, required: true, trim: true },
  amountReceived: { type: Number, required: true, min: 0.01 },
  allocatedAmount: { type: Number, default: 0 },
  unallocatedAmount: { type: Number, default: 0 },
  allocations: { type: [allocationSchema], default: [] },
  source: { type: String, enum: ["customer", "single-bill"], default: "customer" },
}, { timestamps: true });

paymentHistorySchema.index({ user: 1, createdAt: -1 });
export default mongoose.model("PaymentHistory", paymentHistorySchema);
