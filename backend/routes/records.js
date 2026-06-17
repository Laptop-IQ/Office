const express = require("express");
const router = express.Router();
const { body, param, query, validationResult } = require("express-validator");
const SalesRecord = require("../models/SalesRecord");
const Customer = require("../models/Customer");
const { protect } = require("../middleware/auth");

// All sales routes require login
router.use(protect);

// ── GET /api/records ───────────────────────────────────────────────────────────
// Supports: ?date=2026-06-15  ?customerId=xxx  ?distributor=Supple
//           ?from=2026-06-01&to=2026-06-30     ?page=1&limit=20
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const filter = {};

      // Filter by exact date
      if (req.query.date) {
        const start = new Date(req.query.date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(req.query.date);
        end.setHours(23, 59, 59, 999);
        filter.date = { $gte: start, $lte: end };
      }

      // Filter by date range
      if (req.query.from || req.query.to) {
        filter.date = {};
        if (req.query.from) filter.date.$gte = new Date(req.query.from);
        if (req.query.to) {
          const toDate = new Date(req.query.to);
          toDate.setHours(23, 59, 59, 999);
          filter.date.$lte = toDate;
        }
      }

      // Filter by customer ID
      if (req.query.customerId) {
        filter.customer = req.query.customerId;
      }

      // Filter by distributor
      if (req.query.distributor) {
        filter.distributor = req.query.distributor;
      }

      // Filter by area
      if (req.query.area) {
        filter.area = new RegExp(req.query.area, "i");
      }

      // Pagination
      const page  = parseInt(req.query.page)  || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip  = (page - 1) * limit;

      const total = await SalesRecord.countDocuments(filter);
      const records = await SalesRecord.find(filter)
        .populate("customer", "name area distributor projectStage")
        .populate("createdBy", "name email")
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        count: records.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: records,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/records/summary ───────────────────────────────────────────────────
// Dashboard stats: total records, avg YTD%, total by distributor
router.get("/summary", async (req, res, next) => {
  try {
    const [totals, byDistributor, avgPct] = await Promise.all([
      SalesRecord.countDocuments(),
      SalesRecord.aggregate([
        { $group: { _id: "$distributor", count: { $sum: 1 }, totalYtd: { $sum: "$ytdSaleTillEndOfPrevMth" } } },
      ]),
      SalesRecord.aggregate([
        { $group: { _id: null, avg: { $avg: "$ytdActVsAbpPercent" } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalRecords: totals,
        avgYtdVsAbpPercent: avgPct[0]?.avg?.toFixed(1) ?? "0.0",
        byDistributor,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/records/:id ───────────────────────────────────────────────────────
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid record ID")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const record = await SalesRecord.findById(req.params.id)
        .populate("customer", "name area distributor projectStage")
        .populate("createdBy", "name email");

      if (!record) {
        return res.status(404).json({ success: false, message: "Record not found" });
      }

      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/records ──────────────────────────────────────────────────────────
router.post(
  "/",
  [
    body("date").isISO8601().withMessage("Valid date is required (YYYY-MM-DD)"),
    body("area").trim().notEmpty().withMessage("Area is required"),
    body("distributor")
      .isIn(["Supple", "Shree Jee Traders"])
      .withMessage("Invalid distributor"),
    body("customer").isMongoId().withMessage("Valid customer ID is required"),
    body("potentialDyes").optional().isNumeric(),
    body("potentialAux").optional().isNumeric(),
    body("existingBusDyes").optional().isNumeric(),
    body("existingBusAux").optional().isNumeric(),
    body("abpAm26").optional().isNumeric(),
    body("ytdSaleTillEndOfPrevMth").optional().isNumeric(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Verify customer exists
      const customer = await Customer.findById(req.body.customer);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      const record = await SalesRecord.create({
        ...req.body,
        createdBy: req.user._id,
      });

      // Populate before returning
      await record.populate("customer", "name area distributor projectStage");

      res.status(201).json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /api/records/:id ───────────────────────────────────────────────────────
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid record ID"),
    body("date").optional().isISO8601().withMessage("Valid date required"),
    body("distributor")
      .optional()
      .isIn(["Supple", "Shree Jee Traders"])
      .withMessage("Invalid distributor"),
    body("customer").optional().isMongoId().withMessage("Valid customer ID required"),
    body("potentialDyes").optional().isNumeric(),
    body("potentialAux").optional().isNumeric(),
    body("existingBusDyes").optional().isNumeric(),
    body("existingBusAux").optional().isNumeric(),
    body("abpAm26").optional().isNumeric(),
    body("ytdSaleTillEndOfPrevMth").optional().isNumeric(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const record = await SalesRecord.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate("customer", "name area distributor projectStage");

      if (!record) {
        return res.status(404).json({ success: false, message: "Record not found" });
      }

      res.json({ success: true, data: record });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/records/:id ────────────────────────────────────────────────────
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid record ID")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const record = await SalesRecord.findByIdAndDelete(req.params.id);

      if (!record) {
        return res.status(404).json({ success: false, message: "Record not found" });
      }

      res.json({ success: true, message: "Record deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
