import mongoose from "mongoose";

const stepSchema = new mongoose.Schema(
  {
    no: { type: String, default: "" },
    details: { type: String, default: "" },
    dosage: { type: String, default: "" },
    totalQty: { type: String, default: "" },
    ph: { type: String, default: "" },
    temp: { type: String, default: "" },
    time: { type: String, default: "" },
    costPerKg: { type: String, default: "" },
    cost: { type: String, default: "" },
  },
  { _id: false },
);

const reportSchema = new mongoose.Schema(
  {
    date: { type: String, default: "" },
    customer: { type: String, required: true, trim: true, maxlength: 200 },
    visitedBy: { type: String, default: "" },
    dmuMet: { type: String, default: "" },
    objective: { type: String, default: "" },
    reason: { type: String, default: "" },
    quality: { type: String, default: "" },
    qualityType: { type: String, default: "" },
    trialDetails: { type: String, default: "" },
    machinery: { type: String, default: "" },
    mlr: { type: String, default: "" },
    processFollowed: { type: String, default: "" },
    observations: { type: String, default: "" },
    conclusion: { type: String, default: "" },
    product: { type: String, default: "" },
    action: { type: String, default: "" },
  },
  { _id: false },
);

const processSchema = new mongoose.Schema(
  {
    quality: { type: String, default: "" },
    qualityType: { type: String, default: "" },
    raw: { type: String, default: "" },
    quantity: { type: String, default: "" },
    standardSolution: { type: String, default: "" },
    standardValue: { type: String, default: "" },
    machine: { type: String, default: "" },
    liquorQuantity: { type: String, default: "" },
    sample: { type: String, default: "" },
    method: { type: String, default: "" },
    speed: { type: String, default: "" },
    steps: { type: [stepSchema], default: [] },
  },
  { _id: false },
);

const ecofastEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    report: { type: reportSchema, required: true },
    process: { type: processSchema, required: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

ecofastEntrySchema.index({ user: 1, updatedAt: -1 });

const EcofastEntry = mongoose.model("EcofastEntry", ecofastEntrySchema);
export default EcofastEntry;
