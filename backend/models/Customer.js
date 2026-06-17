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
  },
  { timestamps: true },
);

// One user cannot have duplicate customer names
customerSchema.index({ user: 1, name: 1 }, { unique: true });

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
