import express from "express";
import ExcelJS from "exceljs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import EcofastEntry from "../models/EcofastEntry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const TEMPLATE_FILE = path.join(__dirname, "..", "templates", "ecofast-template.xlsx");

function clean(value, max = 5000) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, max);
}
function normalizeEntry(input = {}) {
  const report = input.report || {};
  const process = input.process || {};
  return {
    report: {
      date: clean(report.date, 30), customer: clean(report.customer, 200),
      visitedBy: clean(report.visitedBy, 200), dmuMet: clean(report.dmuMet, 200),
      objective: clean(report.objective), reason: clean(report.reason, 1000),
      quality: clean(report.quality, 200), qualityType: clean(report.qualityType, 200),
      trialDetails: clean(report.trialDetails, 1000), machinery: clean(report.machinery, 300),
      mlr: clean(report.mlr, 100), processFollowed: clean(report.processFollowed, 1000),
      observations: clean(report.observations, 3000), conclusion: clean(report.conclusion, 1000),
      product: clean(report.product, 500), action: clean(report.action, 1500),
    },
    process: {
      quality: clean(process.quality, 200), qualityType: clean(process.qualityType, 200),
      raw: clean(process.raw, 200), quantity: clean(process.quantity, 100),
      standardSolution: clean(process.standardSolution, 100), standardValue: clean(process.standardValue, 100),
      machine: clean(process.machine, 200), liquorQuantity: clean(process.liquorQuantity, 100),
      sample: clean(process.sample, 200), method: clean(process.method, 300), speed: clean(process.speed, 100),
      steps: Array.isArray(process.steps) ? process.steps.slice(0, 18).map((s) => ({
        no: clean(s.no, 20), details: clean(s.details, 500), dosage: clean(s.dosage, 100),
        totalQty: clean(s.totalQty, 100), ph: clean(s.ph, 50), temp: clean(s.temp, 50),
        time: clean(s.time, 50), costPerKg: clean(s.costPerKg, 50), cost: clean(s.cost, 50),
      })) : [],
    },
  };
}
function publicEntry(doc) {
  const item = doc.toObject ? doc.toObject() : doc;
  return {
    id: String(item._id),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    report: item.report,
    process: item.process,
  };
}
function validId(id) {
  return mongoose.isValidObjectId(id);
}

router.get("/health", (_req, res) => res.json({ ok: true, storage: "mongodb" }));

router.get("/entries", async (req, res, next) => {
  try {
    const docs = await EcofastEntry.find({ user: req.user._id }).sort({ updatedAt: -1 }).lean();
    res.json(docs.map(publicEntry));
  } catch (error) { next(error); }
});

router.get("/entries/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid entry id." });
    const doc = await EcofastEntry.findOne({ _id: req.params.id, user: req.user._id });
    if (!doc) return res.status(404).json({ message: "Entry not found." });
    res.json(publicEntry(doc));
  } catch (error) { next(error); }
});

router.post("/entries", async (req, res, next) => {
  try {
    const normalized = normalizeEntry(req.body);
    if (!normalized.report.customer) {
      return res.status(400).json({ message: "Customer name is required." });
    }

    if (req.body.id) {
      if (!validId(req.body.id)) return res.status(400).json({ message: "Invalid entry id." });
      const updated = await EcofastEntry.findOneAndUpdate(
        { _id: req.body.id, user: req.user._id },
        { $set: normalized },
        { new: true, runValidators: true },
      );
      if (!updated) return res.status(404).json({ message: "Entry not found or access denied." });
      return res.json(publicEntry(updated));
    }

    const created = await EcofastEntry.create({ ...normalized, user: req.user._id });
    return res.status(201).json(publicEntry(created));
  } catch (error) { next(error); }
});

router.delete("/entries/:id", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid entry id." });
    const deleted = await EcofastEntry.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: "Entry not found." });
    res.json({ ok: true });
  } catch (error) { next(error); }
});

const processRows = [18, 19, 20, 21, 23, 24, 25, 26, 28, 30, 32, 33, 34, 36, 37, 39, 41];
function setCell(sheet, address, value) {
  const cell = sheet.getCell(address);
  if (value !== undefined && value !== null && value !== "") cell.value = value;
  else cell.value = null;
}
function setDateCell(sheet, address, value) {
  if (!value) { sheet.getCell(address).value = null; return; }
  const date = new Date(`${value}T00:00:00`);
  sheet.getCell(address).value = Number.isNaN(date.getTime()) ? value : date;
}
router.get("/entries/:id/export", async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid entry id." });
    const doc = await EcofastEntry.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!doc) return res.status(404).json({ message: "Entry not found" });
    const entry = publicEntry(doc);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_FILE);
    const report = workbook.getWorksheet("Report");
    const process = workbook.getWorksheet("Process");
    if (!report || !process) throw new Error("Template must contain Report and Process sheets.");

    const r = entry.report;
    setDateCell(report, "D2", r.date);
    setCell(report, "B8", r.customer);
    setCell(report, "B10", r.visitedBy);
    setCell(report, "B12", r.dmuMet);
    setCell(report, "B14", r.objective);
    setCell(report, "B17", r.reason);
    setCell(report, "B22", r.quality);
    setCell(report, "C22", r.qualityType);
    setCell(report, "D22", r.trialDetails);
    setCell(report, "B24", r.machinery);
    setCell(report, "B26", r.mlr);
    setCell(report, "A29", r.processFollowed);
    setCell(report, "A33", r.observations);
    setCell(report, "B36", r.conclusion);
    setCell(report, "B37", r.product);
    setCell(report, "B41", r.action);

    const p = entry.process;
    setCell(process, "B7", p.quality || r.customer); // B7 is linked to Report in the original template; reapply customer below.
    process.getCell("B7").value = { formula: "Report!B8" };
    setCell(process, "B8", p.quality);
    setCell(process, "C8", p.qualityType);
    setCell(process, "G8", p.raw);
    setCell(process, "B10", p.quantity);
    setCell(process, "C10", p.standardSolution);
    setCell(process, "D10", p.standardValue);
    setCell(process, "F10", p.machine);
    setCell(process, "B12", p.liquorQuantity);
    setCell(process, "C12", p.sample);
    setCell(process, "F12", p.method);
    setCell(process, "E9", p.speed);

    // Clear editable data in the template's preformatted step rows, then fill supplied steps.
    for (const rowNo of processRows) {
      for (const col of ["A", "B", "C", "D", "E", "F", "G", "H", "I"]) {
        const cell = process.getCell(`${col}${rowNo}`);
        if (!cell.isMerged || cell.master.address === cell.address) cell.value = null;
      }
    }
    entry.process.steps.forEach((step, index) => {
      const rowNo = processRows[index];
      if (!rowNo) return;
      // Merged cells are written only at the top-left cell of each merged region.
      const map = { A: step.no, B: step.details, C: step.dosage, D: step.totalQty, E: step.ph, F: step.temp, G: step.time, H: step.costPerKg, I: step.cost };
      for (const [col, value] of Object.entries(map)) {
        const cell = process.getCell(`${col}${rowNo}`);
        if (!cell.isMerged || cell.isMerged && cell.master.address === cell.address) {
          cell.value = value || null;
        }
      }
    });

    const datePart = (r.date || new Date().toISOString().slice(0, 10)).replaceAll("-", "");
    const safeCustomer = (r.customer || "Trial_Report").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 40);
    const filename = `Ecofast_${safeCustomer}_${datePart}.xlsx`;
    // Build the complete workbook before sending headers. This avoids partial/empty
    // downloads if ExcelJS encounters an error while streaming directly to the response.
    const fileBuffer = await workbook.xlsx.writeBuffer();
    res.status(200);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", String(fileBuffer.byteLength));
    res.setHeader("Cache-Control", "no-store");
    res.end(Buffer.from(fileBuffer));
  } catch (e) { next(e); }
});

router.use((err, _req, res, _next) => {
  console.error("Ecofast route error:", err);
  res.status(500).json({ message: "Ecofast server error. Please check backend logs.", detail: process.env.NODE_ENV === "production" ? undefined : err.message });
});

export default router;
