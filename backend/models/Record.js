import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
    },
    distributor: {
      type: String,
      required: [true, "Distributor is required"],
      // ── NOTE: enum removed so minor typos/spacing don't cause 500s.
      // Validate on the frontend/controller instead.
    },
    customer: {
      type: String,
      required: [true, "Customer is required"],
      trim: true,
    },
    objective: { type: String, trim: true, default: "" },
    stage: { type: String, trim: true, default: "" },
    outcome: { type: String, trim: true, default: "" },
    potDyes: { type: Number, default: 0 },
    potAux: { type: Number, default: 0 },
    exDyes: { type: Number, default: 0 },
    exAux: { type: Number, default: 0 },
    abp: { type: Number, default: 0 },
    ytd: { type: Number, default: 0 },
    pct: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// ── pre("save"): runs on Record.create() and doc.save() ──────────────────────
// Sync function — uses next() callback pattern.
recordSchema.pre("save", function () {
  this.pct =
    this.abp && this.abp > 0
      ? parseFloat(((this.ytd / this.abp) * 100).toFixed(1))
      : 0;
});

// ── pre("findOneAndUpdate"): runs on findOneAndUpdate() ──────────────────────
// Async function — NO next param. Mongoose uses the returned Promise instead.
// Return early to skip, throw/reject to signal errors.
recordSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  const $set = update["$set"] || {};

  const incomingYtd = $set.ytd ?? update.ytd;
  const incomingAbp = $set.abp ?? update.abp;

  // Nothing relevant is changing — skip
  if (incomingYtd === undefined && incomingAbp === undefined) return;

  // Fetch existing doc to fill in whichever field isn't being updated
  const existing = await this.model.findOne(this.getFilter()).lean();
  if (!existing) return;

  const ytd = incomingYtd !== undefined ? Number(incomingYtd) : existing.ytd;
  const abp = incomingAbp !== undefined ? Number(incomingAbp) : existing.abp;

  const pct = abp && abp > 0 ? parseFloat(((ytd / abp) * 100).toFixed(1)) : 0;

  // Always write into $set so Mongoose handles it cleanly
  if (!update["$set"]) update["$set"] = {};
  update["$set"].pct = pct;
});

const Record = mongoose.model("Record", recordSchema);
export default Record;
