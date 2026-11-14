import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fillTemplate } from "./fillTemplate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const TEMPLATES_DIR = path.join(__dirname, "..", "templates");
// One template per brand. Ecofast = the original format, Ecosol = the BLACK_Q2ELW format.
const BRANDS = {
  ecofast: {
    file: path.join(TEMPLATES_DIR, "ecofast-template.xlsx"),
    prefix: "Ecofast",
  },
  ecosol: {
    file: path.join(TEMPLATES_DIR, "ecosol-template.xlsx"),
    prefix: "Ecosol",
  },
};
const brandOf = (v) =>
  String(v ?? "").toLowerCase() === "ecosol" ? "ecosol" : "ecofast";

function clean(value, max = 5000) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, max);
}
function normalizeEntry(input = {}) {
  const report = input.report || {};
  const process = input.process || {};
  return {
    brand: brandOf(input.brand),
    report: {
      date: clean(report.date, 30),
      customer: clean(report.customer, 200),
      visitedBy: clean(report.visitedBy, 200),
      dmuMet: clean(report.dmuMet, 200),
      objective: clean(report.objective),
      reason: clean(report.reason, 1000),
      quality: clean(report.quality, 200),
      qualityType: clean(report.qualityType, 200),
      trialDetails: clean(report.trialDetails, 1000),
      machinery: clean(report.machinery, 300),
      mlr: clean(report.mlr, 100),
      processFollowed: clean(report.processFollowed, 1000),
      observations: clean(report.observations, 3000),
      conclusion: clean(report.conclusion, 1000),
      product: clean(report.product, 500),
      action: clean(report.action, 1500),
    },
    process: {
      quality: clean(process.quality, 200),
      qualityType: clean(process.qualityType, 200),
      raw: clean(process.raw, 200),
      quantity: clean(process.quantity, 100),
      standardSolution: clean(process.standardSolution, 100),
      standardValue: clean(process.standardValue, 100),
      machine: clean(process.machine, 200),
      liquorQuantity: clean(process.liquorQuantity, 100),
      sample: clean(process.sample, 200),
      method: clean(process.method, 300),
      speed: clean(process.speed, 100),
      steps: Array.isArray(process.steps)
        ? process.steps.slice(0, 18).map((s) => ({
            no: clean(s.no, 20),
            details: clean(s.details, 500),
            dosage: clean(s.dosage, 100),
            totalQty: clean(s.totalQty, 100),
            ph: clean(s.ph, 50),
            temp: clean(s.temp, 50),
            time: clean(s.time, 50),
            costPerKg: clean(s.costPerKg, 50),
            cost: clean(s.cost, 50),
          }))
        : [],
    },
  };
}

router.get("/health", (_req, res) => res.json({ ok: true }));

// Builds the Excel by filling the chosen template's own XML (see fillTemplate.js), so the download
// is identical to ecofast-template.xlsx / ecosol-template.xlsx: same pictures, merges, widths, print setup and styles.
async function buildWorkbook(entry) {
  const brand = BRANDS[entry.brand];
  const r = entry.report;
  const datePart = (r.date || new Date().toISOString().slice(0, 10)).replaceAll(
    "-",
    "",
  );
  const safeCustomer = (r.customer || "Trial_Report")
    .replace(/[^a-z0-9-_]+/gi, "_")
    .slice(0, 40);
  const filename = `${brand.prefix}_${safeCustomer}_${datePart}.xlsx`;
  const fileBuffer = await fillTemplate(brand.file, entry, entry.brand);
  return { fileBuffer, filename };
}
function sendXlsx(res, fileBuffer, filename) {
  res.status(200);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", String(fileBuffer.byteLength));
  res.setHeader("Cache-Control", "no-store");
  res.end(Buffer.from(fileBuffer));
}

// POST /api/ecofast/export - build the Excel for one trial (one row of the bulk import)
// body: { brand: "ecofast" | "ecosol", report, process }
router.post("/export", async (req, res, next) => {
  try {
    const entry = normalizeEntry(req.body);
    if (!entry.report.customer)
      return res.status(400).json({ message: "Customer name is required." });
    const { fileBuffer, filename } = await buildWorkbook(entry);
    sendXlsx(res, fileBuffer, filename);
  } catch (e) {
    next(e);
  }
});

router.use((err, _req, res, _next) => {
  console.error("Ecofast route error:", err);
  res.status(500).json({
    message: "Ecofast server error. Please check backend logs.",
    detail: process.env.NODE_ENV === "production" ? undefined : err.message,
  });
});

export default router;
