// routes/keyCustomerRoutes.js — mounted at /api/dsr/key-customers
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  setKeyCustomers,
  setVisitFrequency,
} from "../controllers/keyCustomerController.js";

const router = express.Router();

router.use(protect);

router.put("/", setKeyCustomers); //        PUT   /api/dsr/key-customers
router.patch("/:id", setVisitFrequency); // PATCH /api/dsr/key-customers/:id

export default router;
