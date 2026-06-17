import express from "express";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router
  .route("/")
  .get(getCustomers) // GET  /api/dsr/customers
  .post(createCustomer); // POST /api/dsr/customers

router
  .route("/:id")
  .put(updateCustomer) // PUT    /api/dsr/customers/:id
  .delete(deleteCustomer); // DELETE /api/dsr/customers/:id

export default router;
