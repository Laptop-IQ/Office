import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    type: {
      type: String,
      enum: [
        "Call",
        "Order",
        "Follow-up",
        "Payment",
        "Visit",
        "Note",
        "Quotation",
      ],
      required: true,
    },
    note: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const customerSchema = new mongoose.Schema(
  {
    customerId: { type: String, unique: true },

    company: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    gst: { type: String, trim: true, uppercase: true },
    pan: { type: String, trim: true, uppercase: true },

    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },

    type: {
      type: String,
      enum: ["Germents Dyeing", "Denim", "Non Denim", "Sub traders"],
      required: true,
    },
    category: {
      type: String,
      enum: ["Dyes", "Auxiliaries"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Closed", "Blocked"],
      default: "Active",
    },
    badges: {
      type: [String],
      enum: ["VIP", "New Customer", "High Value", "Low Credit", "Blacklisted"],
      default: [],
    },

    salesPerson: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    creditLimit: { type: Number, default: 0 },
    outstanding: { type: Number, default: 0 },
    lastOrderDate: { type: Date },
    nextFollowUpDate: { type: Date },
    isFollowUpDone: { type: Boolean, default: false },
    followUpCancelled: { type: Boolean, default: false },

    timeline: { type: [timelineSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// ─── FIX 1: async hook mein next() nahi hota Mongoose 6+ mein ───────────────
// ─── FIX 2: model name "Customer" tha jo "CustomerList" se match nahi karta ─

customerSchema.pre("save", async function () {
  // ← next hataya
  if (this.isNew && !this.customerId) {
    const count = await mongoose.model("CustomerList").countDocuments(); // ← naam fix kiya
    this.customerId = `CUST-${1001 + count}`;
  }
  // next() nahi chahiye — async hook khud resolve ho jaata hai
});

// Text index hataya — controller regex search use karta hai, $text nahi
customerSchema.index({ company: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ salesPerson: 1 });

export default mongoose.model("CustomerList", customerSchema);
