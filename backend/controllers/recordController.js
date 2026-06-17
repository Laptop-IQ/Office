import Record from "../models/Record.js";
import ExcelJS from "exceljs";

const DISTRIBUTOR_OPTIONS = ["Supple", "Shree Jee Traders"];

// ── GET /api/dsr/records ─────────────────────────────────────────────────────
export const getRecords = async (req, res) => {
  try {
    const { search, area, distributor, dateFrom, dateTo } = req.query;
    const filter = { user: req.user.id };

    if (area) filter.area = { $regex: area, $options: "i" };
    if (distributor) filter.distributor = distributor;

    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom;
      if (dateTo) filter.date.$lte = dateTo;
    }

    if (search) {
      filter.$or = [
        { customer: { $regex: search, $options: "i" } },
        { area: { $regex: search, $options: "i" } },
        { distributor: { $regex: search, $options: "i" } },
        { objective: { $regex: search, $options: "i" } },
      ];
    }

    const records = await Record.find(filter).sort({ date: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: records.length,
      data: records,
    });
  } catch (err) {
    console.error("getRecords error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// ── POST /api/dsr/records ────────────────────────────────────────────────────
export const createRecord = async (req, res) => {
  try {
    const {
      date,
      area,
      distributor,
      customer,
      objective,
      stage,
      outcome,
      potDyes,
      potAux,
      exDyes,
      exAux,
      abp,
      ytd,
    } = req.body;

    // Required field check
    if (!date || !area || !distributor || !customer) {
      return res.status(400).json({
        success: false,
        message: "date, area, distributor, and customer are required.",
      });
    }

    // Distributor whitelist — catches casing/spacing issues before Mongoose does
    if (!DISTRIBUTOR_OPTIONS.includes(distributor)) {
      return res.status(400).json({
        success: false,
        message: `distributor must be one of: ${DISTRIBUTOR_OPTIONS.join(", ")}`,
      });
    }

    const record = await Record.create({
      user: req.user.id,
      date,
      area,
      distributor,
      customer,
      objective: objective || "",
      stage: stage || "",
      outcome: outcome || "",
      potDyes: Number(potDyes) || 0,
      potAux: Number(potAux) || 0,
      exDyes: Number(exDyes) || 0,
      exAux: Number(exAux) || 0,
      abp: Number(abp) || 0,
      ytd: Number(ytd) || 0,
      // pct is calculated by the pre("save") hook — no need to pass it
    });

    return res.status(201).json({ success: true, data: record });
  } catch (err) {
    console.error("createRecord error:", err);
    // Return the real Mongoose validation message so the frontend can display it
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// ── GET /api/dsr/records/:id ─────────────────────────────────────────────────
export const getRecordById = async (req, res) => {
  try {
    const record = await Record.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.error("getRecordById error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// ── PUT /api/dsr/records/:id ─────────────────────────────────────────────────
export const updateRecord = async (req, res) => {
  try {
    const ALLOWED = [
      "date",
      "area",
      "distributor",
      "customer",
      "objective",
      "stage",
      "outcome",
      "potDyes",
      "potAux",
      "exDyes",
      "exAux",
      "abp",
      "ytd",
    ];
    const NUM_FIELDS = ["potDyes", "potAux", "exDyes", "exAux", "abp", "ytd"];

    const updates = {};
    ALLOWED.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    NUM_FIELDS.forEach((k) => {
      if (updates[k] !== undefined) updates[k] = Number(updates[k]) || 0;
    });

    // Validate distributor if it's being updated
    if (
      updates.distributor &&
      !DISTRIBUTOR_OPTIONS.includes(updates.distributor)
    ) {
      return res.status(400).json({
        success: false,
        message: `distributor must be one of: ${DISTRIBUTOR_OPTIONS.join(", ")}`,
      });
    }

    // pct is recalculated by the pre("findOneAndUpdate") hook
    const record = await Record.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    console.error("updateRecord error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// ── DELETE /api/dsr/records/:id ──────────────────────────────────────────────
export const deleteRecord = async (req, res) => {
  try {
    const record = await Record.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Record not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Record deleted successfully" });
  } catch (err) {
    console.error("deleteRecord error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

// ── GET /api/dsr/records/export/excel ────────────────────────────────────────
export const exportRecordsExcel = async (req, res) => {
  try {
    const records = await Record.find({ user: req.user.id }).sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("Daily Sales Report");

    ws.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Area", key: "area", width: 15 },
      { header: "Distributor", key: "dist", width: 18 },
      { header: "Customer", key: "cust", width: 20 },
      { header: "Objective / Project", key: "obj", width: 30 },
      { header: "Project Stage", key: "stage", width: 25 },
      { header: "Visit Outcome", key: "outcome", width: 20 },
      { header: "Potential Dyes (Rs L/mth)", key: "potDyes", width: 22 },
      { header: "Potential Aux (Rs L/mth)", key: "potAux", width: 22 },
      { header: "Existing Dyes (Rs L/mth)", key: "exDyes", width: 22 },
      { header: "Existing Aux (Rs L/mth)", key: "exAux", width: 22 },
      { header: "ABP AM26 (Rs L)", key: "abp", width: 18 },
      { header: "YTD Sale Prev Mth (Rs L)", key: "ytd", width: 24 },
      { header: "YTD vs ABP %", key: "pct", width: 14 },
    ];

    // Header row styling
    const hr = ws.getRow(1);
    hr.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    hr.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0C447C" },
    };
    hr.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    hr.height = 30;

    records.forEach((r) => {
      ws.addRow({
        date: r.date,
        area: r.area,
        dist: r.distributor,
        cust: r.customer,
        obj: r.objective,
        stage: r.stage,
        outcome: r.outcome,
        potDyes: r.potDyes,
        potAux: r.potAux,
        exDyes: r.exDyes,
        exAux: r.exAux,
        abp: r.abp,
        ytd: r.ytd,
        pct: r.pct,
      });
    });

    ws.eachRow((row, n) => {
      if (n > 1) {
        row.eachCell((cell) => {
          cell.alignment = { vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE0E0E0" } },
            bottom: { style: "thin", color: { argb: "FFE0E0E0" } },
            left: { style: "thin", color: { argb: "FFE0E0E0" } },
            right: { style: "thin", color: { argb: "FFE0E0E0" } },
          };
        });
        if (n % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF4F8FC" },
            };
          });
        }
      }
    });

    if (records.length) {
      ws.autoFilter = { from: "A1", to: `N${records.length + 1}` };
    }
    ws.views = [{ state: "frozen", ySplit: 1 }];

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Daily_Sales_Report_${dateStr}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("exportRecordsExcel error:", err);
    return res
      .status(500)
      .json({ success: false, message: err.message || "Export failed" });
  }
};
