import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  uploadOverdues,
  getOverdues,
  getStats,
  recordPayment,
  deleteEntry,
  deleteAccount,
  clearAll,
} from "../controllers/overdueController.js";

const router = express.Router();

// ── All routes are protected ───────────────────────────────────────────────
//
// Mount in your main server file:
//   import overdueRoutes from "./routes/overdueRoutes.js";
//   app.use("/api/overdues", overdueRoutes);
//
// ── Route table ───────────────────────────────────────────────────────────
//
//  POST   /api/overdues/upload            Upload Excel file (multipart/form-data, field: "file")
//  GET    /api/overdues                   Get all active entries  ?account= ?salesman=
//  GET    /api/overdues/stats             Summary KPIs + per-account breakdown
//  DELETE /api/overdues/clear             Hard-delete ALL entries for user (reset)
//  DELETE /api/overdues/account/:name     Soft-delete all entries for one account (URL-encode name)
//  PUT    /api/overdues/:id/payment       Record a payment  body: { amount }
//  DELETE /api/overdues/:id               Soft-delete one entry
//
// ⚠ Order matters: static segments (/clear, /stats, /account/:name) must be
//   registered BEFORE the wildcard /:id route, otherwise Express matches
//   "clear" and "stats" as MongoDB ObjectIds and returns a CastError.
// ─────────────────────────────────────────────────────────────────────────

router.post("/upload", protect, upload.single("file"), uploadOverdues);

router.get("/stats", protect, getStats);
router.get("/",      protect, getOverdues);

router.delete("/clear",           protect, clearAll);
router.delete("/account/:name",   protect, deleteAccount);

router.put("/:id/payment", protect, recordPayment);
router.delete("/:id",      protect, deleteEntry);

export default router;
