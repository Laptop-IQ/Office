import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
  bulkAssignSalesPerson,
  addTimelineEntry,
  getCustomerStats,
} from "../controllers/customerListController.js";

const router = express.Router();

router.use(protect); 

router.get("/stats", getCustomerStats);
router.post("/bulk-delete", bulkDeleteCustomers);
router.post("/bulk-assign", bulkAssignSalesPerson);

router.route("/")
  .get(getCustomers)
  .post(createCustomer);

router.route("/:id")
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

router.post("/:id/timeline", addTimelineEntry);

export default router;
