import express from "express";
import {
  getRecords,
  createRecord,
  getRecordById,
  updateRecord,
  deleteRecord,
  exportRecordsExcel,
} from "../controllers/recordController.js";
import { protect } from "../middleware/authMiddleware.js"; // ← fix here

const router = express.Router();

// All routes require auth
router.use(protect); // ← fix here

// Export MUST be declared before /:id to avoid "export" being caught as an id param
router.get("/export/excel", exportRecordsExcel);

router.route("/").get(getRecords).post(createRecord);

router.route("/:id").get(getRecordById).put(updateRecord).delete(deleteRecord);

export default router;
