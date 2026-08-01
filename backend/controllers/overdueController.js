import XLSX from "xlsx";
import OverdueEntry from "../models/overdueModel.js";

// ────────────────────────────────────────────
// SHARED HELPERS
// ────────────────────────────────────────────

// Mirrors the frontend toISODate() exactly — handles Date objects from
// SheetJS cellDates:true, Excel serials, YYYY-MM-DD, and dd-mm-yyyy strings.
const toISODate = (value) => {
  if (value === null || value === undefined || value === "") return null;

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null;
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  if (typeof value === "number" && isFinite(value)) {
    const ms = Date.UTC(1899, 11, 30) + Math.round(value) * 86400000;
    const dt = new Date(ms);
    return isNaN(dt.getTime())
      ? null
      : `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
  }

  const str = String(value).trim();
  if (!str) return null;

  // YYYY-MM-DD
  let mt = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (mt && +mt[2] >= 1 && +mt[2] <= 12 && +mt[3] >= 1 && +mt[3] <= 31)
    return `${mt[1]}-${mt[2].padStart(2, "0")}-${mt[3].padStart(2, "0")}`;

  // dd-mm-yyyy or dd/mm/yyyy (this workbook's convention)
  mt = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (mt && +mt[2] >= 1 && +mt[2] <= 12 && +mt[1] >= 1 && +mt[1] <= 31)
    return `${mt[3]}-${mt[2].padStart(2, "0")}-${mt[1].padStart(2, "0")}`;

  return null;
};

// calcDueDays — same formula as frontend, runs fresh on every response so
// the value is never stale even if the entry has been in the DB for months.
const calcDueDays = (dated) => {
  if (!dated) return null;
  const [y, m, d] = dated.split("-").map(Number);
  if (!y || !m || !d) return null;
  const invoiceDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - invoiceDate) / (1000 * 60 * 60 * 24));
};

// Parse the uploaded .xlsx / .xls buffer using SheetJS.
// Returns an array of plain objects ready to be upserted into the DB.
const parseExcelBuffer = (buffer, fileName) => {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { raw: true });

  return raw.map((r) => {
    // Trim all string keys so stray spaces in headers don't break lookups
    const row = {};
    for (const k of Object.keys(r))
      row[k.trim()] = typeof r[k] === "string" ? r[k].trim() : r[k];

    const isoDated  = toISODate(row["Dated"]);
    const isoDueDate = toISODate(row["Due Date"]);

    return {
      salesman:   String(row["Salesman"]    ?? "").trim(),
      account:    String(row["Account"]     ?? "").trim(),
      dated:      isoDated  || "",
      type:       String(row["Type"]        ?? "").trim(),
      refNo:      String(row["Ref. No."]    ?? "").trim(),
      refAmt:     Number(String(row["Ref. Amt."]    ?? 0).replace(/,/g, "")),
      pendingAmt: Number(String(row["Pending Amt."] ?? 0).replace(/,/g, "")),
      due:        String(row["Due"]         ?? "").trim(),
      dueDate:    isoDueDate || "",
      fileName,
    };
  }).filter((r) => r.refNo); // discard rows without a reference number
};

// Transforms a DB document into the shape the frontend / PDF expects.
// dueDays is always recalculated here — never read from DB.
const toResponseShape = (doc) => ({
  _id:          doc._id,
  "Salesman":   doc.salesman,
  "Account":    doc.account,
  "Dated":      doc.dated,
  "Type":       doc.type,
  "Ref. No.":   doc.refNo,
  "Ref. Amt.":  doc.refAmt,
  "Pending Amt.": doc.pendingAmt,
  "Due":        doc.due,
  "Due Date":   doc.dueDate,
  "Due Days":   calcDueDays(doc.dated),
  fileName:     doc.fileName,
});

// ────────────────────────────────────────────
// UPLOAD EXCEL — POST /api/overdues/upload
// ────────────────────────────────────────────
// Smart upsert strategy:
//   • New refNo            → insert fresh
//   • Existing + deleted   → skip (user's deletion is respected across re-uploads)
//   • Existing + payment   → keep DB's pendingAmt; update all other fields
//   • Existing + unchanged → overwrite with fresh file data
export const uploadOverdues = async (req, res) => {
  try {
    if (!req.file)
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });

    const fileName = req.file.originalname;
    const userId   = req.user.id;

    // 1. Parse the uploaded workbook
    let entries;
    try {
      entries = parseExcelBuffer(req.file.buffer, fileName);
    } catch {
      return res
        .status(400)
        .json({ success: false, message: "Could not parse Excel file" });
    }

    if (!entries.length)
      return res
        .status(400)
        .json({ success: false, message: "No valid rows found in file" });

    // 2. Fetch existing DB entries for this user (minimal projection)
    const existing = await OverdueEntry.find(
      { user: userId },
      { refNo: 1, isDeleted: 1, isPendingModified: 1, pendingAmt: 1 },
    ).lean();

    const existingMap = new Map(existing.map((e) => [e.refNo, e]));

    // 3. Build bulkWrite operations
    const ops = [];

    for (const entry of entries) {
      const ex = existingMap.get(entry.refNo);

      if (!ex) {
        // ── New entry ──────────────────────────────────────────────────
        ops.push({
          insertOne: {
            document: {
              user:              userId,
              isDeleted:         false,
              isPendingModified: false,
              ...entry,
            },
          },
        });
      } else if (ex.isDeleted) {
        // ── Previously deleted — do not resurrect ──────────────────────
        continue;
      } else {
        // ── Existing, active entry ─────────────────────────────────────
        ops.push({
          updateOne: {
            filter: { _id: ex._id },
            update: {
              $set: {
                ...entry,
                // If a payment was recorded in the dashboard, preserve it.
                // The accounting system's export may not yet reflect it.
                pendingAmt: ex.isPendingModified ? ex.pendingAmt : entry.pendingAmt,
              },
            },
          },
        });
      }
    }

    if (ops.length > 0) await OverdueEntry.bulkWrite(ops, { ordered: false });

    // 4. Return the full up-to-date dataset
    const docs = await OverdueEntry.find({ user: userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    res.status(201).json({
      success:  true,
      message:  `${ops.length} entries processed`,
      fileName,
      data:     docs.map(toResponseShape),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// GET ALL ENTRIES — GET /api/overdues
// ────────────────────────────────────────────
// Returns all non-deleted entries sorted by Due Days descending (most
// overdue first).  dueDays is recalculated fresh on every call.
// Optional query param: ?account=<name>   → filter by account
//                       ?salesman=<name>  → filter by salesman
export const getOverdues = async (req, res) => {
  try {
    const filter = { user: req.user.id, isDeleted: false };

    if (req.query.account)
      filter.account = { $regex: new RegExp(req.query.account, "i") };
    if (req.query.salesman)
      filter.salesman = { $regex: new RegExp(req.query.salesman, "i") };

    const docs = await OverdueEntry.find(filter).lean();

    const data = docs
      .map(toResponseShape)
      .sort((a, b) => (b["Due Days"] ?? 0) - (a["Due Days"] ?? 0));

    // Derive the most recent fileName from any entry
    const fileName = docs[0]?.fileName ?? "";

    res.json({ success: true, fileName, totalEntries: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// RECORD PAYMENT — PUT /api/overdues/:id/payment
// ────────────────────────────────────────────
// Body: { amount: Number }
// Reduces pendingAmt by `amount`.  If the result ≤ 0 the entry is
// soft-deleted (fully settled) — same behaviour as the frontend.
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const amount  = Number(req.body.amount);

    if (!amount || amount <= 0)
      return res
        .status(400)
        .json({ success: false, message: "amount must be a positive number" });

    const entry = await OverdueEntry.findOne({
      _id:       id,
      user:      req.user.id,
      isDeleted: false,
    });

    if (!entry)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });

    const newPending   = Math.max(0, entry.pendingAmt - amount);
    const clearedFully = newPending <= 0;

    entry.pendingAmt        = newPending;
    entry.isPendingModified = true;
    if (clearedFully) entry.isDeleted = true;

    await entry.save();

    res.json({
      success:      true,
      message:      clearedFully ? "Entry cleared — fully settled" : "Payment recorded",
      clearedFully,
      pendingAmt:   newPending,
      entry:        clearedFully ? null : toResponseShape(entry),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// DELETE ENTRY — DELETE /api/overdues/:id
// ────────────────────────────────────────────
// Soft-delete.  The refNo is preserved in the DB so that re-uploading the
// same Excel file doesn't bring this entry back.
export const deleteEntry = async (req, res) => {
  try {
    const result = await OverdueEntry.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { isDeleted: true } },
      { new: true },
    );

    if (!result)
      return res
        .status(404)
        .json({ success: false, message: "Entry not found" });

    res.json({ success: true, message: "Entry deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// DELETE ACCOUNT — DELETE /api/overdues/account/:name
// ────────────────────────────────────────────
// Soft-deletes every non-deleted entry belonging to the named account.
// :name must be URL-encoded by the caller.
export const deleteAccount = async (req, res) => {
  try {
    const accountName = decodeURIComponent(req.params.name);

    const result = await OverdueEntry.updateMany(
      { user: req.user.id, account: accountName, isDeleted: false },
      { $set: { isDeleted: true } },
    );

    if (result.matchedCount === 0)
      return res
        .status(404)
        .json({ success: false, message: "No entries found for this account" });

    res.json({
      success:  true,
      message:  `${result.modifiedCount} entries deleted for "${accountName}"`,
      deleted:  result.modifiedCount,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// CLEAR ALL — DELETE /api/overdues/clear
// ────────────────────────────────────────────
// Hard-deletes every entry for this user (including soft-deleted ones).
// Equivalent to the "Clear data" button in the frontend.
export const clearAll = async (req, res) => {
  try {
    const result = await OverdueEntry.deleteMany({ user: req.user.id });
    res.json({
      success: true,
      message: `All data cleared (${result.deletedCount} entries removed)`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ────────────────────────────────────────────
// GET STATS — GET /api/overdues/stats
// ────────────────────────────────────────────
// Returns top-level KPIs + a per-account breakdown — same numbers the
// frontend's summary tab and the PDF header cards display.
export const getStats = async (req, res) => {
  try {
    const docs = await OverdueEntry.find({
      user:      req.user.id,
      isDeleted: false,
    }).lean();

    if (!docs.length)
      return res.json({
        success: true,
        stats: {
          totalPending:    0,
          totalEntries:    0,
          overdueEntries:  0,
          overdueAmount:   0,
          criticalEntries: 0,
          maxDueDays:      0,
          byAccount:       [],
        },
      });

    // Attach fresh dueDays to each doc (not stored in DB)
    const enriched = docs.map((d) => ({ ...d, dueDays: calcDueDays(d.dated) }));

    const totalPending    = enriched.reduce((s, r) => s + r.pendingAmt, 0);
    const overdueRows     = enriched.filter((r) => (r.dueDays ?? 0) > 0);
    const criticalRows    = enriched.filter((r) => (r.dueDays ?? 0) > 90);
    const overdueAmount   = overdueRows.reduce((s, r) => s + r.pendingAmt, 0);
    const maxDueDays      = Math.max(...enriched.map((r) => r.dueDays ?? 0));

    // Per-account summary
    const accountMap = {};
    enriched.forEach((r) => {
      const a = r.account || "Unknown";
      if (!accountMap[a])
        accountMap[a] = {
          account:      a,
          total:        0,
          entries:      0,
          maxDays:      0,
          overdueAmt:   0,
          overdueCount: 0,
        };
      accountMap[a].total   += r.pendingAmt;
      accountMap[a].entries += 1;
      accountMap[a].maxDays  = Math.max(accountMap[a].maxDays, r.dueDays ?? 0);
      if ((r.dueDays ?? 0) > 0) {
        accountMap[a].overdueAmt   += r.pendingAmt;
        accountMap[a].overdueCount += 1;
      }
    });

    const byAccount = Object.values(accountMap).sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      stats: {
        totalPending,
        totalEntries:    enriched.length,
        overdueEntries:  overdueRows.length,
        overdueAmount,
        criticalEntries: criticalRows.length,
        maxDueDays,
        byAccount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
