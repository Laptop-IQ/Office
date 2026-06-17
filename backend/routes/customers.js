const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const Customer = require("../models/Customer");
const { protect } = require("../middleware/auth");

// All customer routes require login
router.use(protect);

// ── GET /api/customers ─────────────────────────────────────────────────────────
// Returns all customers (sorted A-Z by name)
router.get("/", async (req, res, next) => {
  try {
    const customers = await Customer.find()
      .sort({ name: 1 })
      .populate("createdBy", "name email");

    res.json({ success: true, count: customers.length, data: customers });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/customers/:id ─────────────────────────────────────────────────────
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid customer ID")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const customer = await Customer.findById(req.params.id).populate(
        "createdBy",
        "name email"
      );

      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /api/customers ────────────────────────────────────────────────────────
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Customer name is required"),
    body("area").trim().notEmpty().withMessage("Area is required"),
    body("distributor")
      .isIn(["Supple", "Shree Jee Traders"])
      .withMessage("Invalid distributor"),
    body("projectStage").notEmpty().withMessage("Project stage is required"),
    body("potentialDyes").optional().isNumeric().withMessage("Must be a number"),
    body("potentialAux").optional().isNumeric().withMessage("Must be a number"),
    body("existingBusDyes").optional().isNumeric().withMessage("Must be a number"),
    body("existingBusAux").optional().isNumeric().withMessage("Must be a number"),
    body("abpAm26").optional().isNumeric().withMessage("Must be a number"),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      // Check for duplicate name
      const exists = await Customer.findOne({ name: req.body.name });
      if (exists) {
        return res.status(400).json({ success: false, message: "Customer with this name already exists" });
      }

      const customer = await Customer.create({
        ...req.body,
        createdBy: req.user._id,
      });

      res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /api/customers/:id ─────────────────────────────────────────────────────
router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid customer ID"),
    body("area").optional().trim().notEmpty().withMessage("Area cannot be empty"),
    body("distributor")
      .optional()
      .isIn(["Supple", "Shree Jee Traders"])
      .withMessage("Invalid distributor"),
    body("potentialDyes").optional().isNumeric(),
    body("potentialAux").optional().isNumeric(),
    body("existingBusDyes").optional().isNumeric(),
    body("existingBusAux").optional().isNumeric(),
    body("abpAm26").optional().isNumeric(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const customer = await Customer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      res.json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /api/customers/:id ──────────────────────────────────────────────────
router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid customer ID")],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const customer = await Customer.findByIdAndDelete(req.params.id);

      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      res.json({ success: true, message: "Customer deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
