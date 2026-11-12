// routes/priceListRoute.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getPriceList,
  savePriceList,
  clearPriceList,
  listSavedCustomers,
  saveSavedCustomer,
  deleteSavedCustomer,
} from "../controllers/priceListController.js";

const router = express.Router();

router.get("/", protect, getPriceList);
router.put("/", protect, savePriceList);
router.delete("/", protect, clearPriceList);

router.get("/customers", protect, listSavedCustomers);
router.put("/customers/:cid", protect, saveSavedCustomer);
router.delete("/customers/:cid", protect, deleteSavedCustomer);

export default router;
