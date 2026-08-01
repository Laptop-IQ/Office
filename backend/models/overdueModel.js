import mongoose from "mongoose";

// ────────────────────────────────────────────
// SCHEMA
// ────────────────────────────────────────────
const overdueEntrySchema = new mongoose.Schema(
  {
    // ── Ownership ─────────────────────────────────────────────────────────
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Original Excel columns ────────────────────────────────────────────
    salesman:  { type: String, default: "" },
    account:   { type: String, default: "", index: true },
    dated:     { type: String, default: "" }, // stored as YYYY-MM-DD string
    type:      { type: String, default: "" },
    refNo:     { type: String, required: true },
    refAmt:    { type: Number, default: 0 },
    pendingAmt:{ type: Number, default: 0 },
    due:       { type: String, default: "" },
    dueDate:   { type: String, default: "" },

    // ── Status flags ──────────────────────────────────────────────────────
    // isDeleted: soft-delete — entry is hidden but preserved so that
    //   re-uploading a fresh Excel doesn't resurrect dismissed entries.
    isDeleted: { type: Boolean, default: false },

    // isPendingModified: true once a partial payment has been recorded.
    //   When the user uploads a new Excel, we keep the DB's pendingAmt
    //   for these entries instead of overwriting with the file's value,
    //   because the dashboard payment may not yet be reflected in the
    //   accounting system's export.
    isPendingModified: { type: Boolean, default: false },

    // ── Source file ───────────────────────────────────────────────────────
    fileName: { type: String, default: "" },
  },
  { timestamps: true },
);

// ── Indexes ────────────────────────────────────────────────────────────────
// Compound unique: one entry per (user, refNo) — prevents duplicates on
// re-upload and is the natural lookup key for payment/delete operations.
overdueEntrySchema.index({ user: 1, refNo: 1 }, { unique: true });
overdueEntrySchema.index({ user: 1, isDeleted: 1 });

export default mongoose.model("OverdueEntry", overdueEntrySchema);
