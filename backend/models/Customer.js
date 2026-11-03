import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
    },
    distributor: {
      type: String,
      required: [true, "Distributor is required"],
      enum: ["Supple", "Shree Jee Traders"],
    },
    stage: {
      type: String,
      trim: true,
      default: "",
    },
    potDyes: { type: Number, default: 0 },
    potAux: { type: Number, default: 0 },
    exDyes: { type: Number, default: 0 },
    exAux: { type: Number, default: 0 },
    abp: { type: Number, default: 0 },

    // ── Contact details (optional) ─────────────────────────────────────────
    contactPerson: { type: String, trim: true, default: "" },
    designation: { type: String, trim: true, default: "" },
    mobile: {
      type: String,
      trim: true,
      default: "",
      match: [/^$|^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"],
    },
    altMobile: {
      type: String,
      trim: true,
      default: "",
      match: [/^$|^[6-9]\d{9}$/, "Enter a valid 10-digit alternate number"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      match: [/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email"],
    },
    address: { type: String, trim: true, default: "" },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      match: [
        /^$|^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
        "Enter a valid 15-character GSTIN",
      ],
    },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

// One user cannot have duplicate customer names
customerSchema.index({ user: 1, name: 1 }, { unique: true });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
